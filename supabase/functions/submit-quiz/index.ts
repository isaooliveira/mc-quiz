// Edge Function: submit-quiz
// Valida o envio, recalcula o resultado no servidor a partir do gabarito canônico,
// bloqueia refazer (dedup por e-mail OU telefone), grava o lead e devolve o result_code.

import { createClient } from "npm:@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Gabarito canônico + motor de cálculo (espelho de src/data/*)
// ---------------------------------------------------------------------------
type Tag = "FP" | "VC" | "TE" | "LI";
type OptionId = "A" | "B" | "C" | "D";
type Counts = Record<Tag, number>;

const ANSWER_KEY: Record<number, Record<OptionId, Tag>> = {
  1: { A: "FP", B: "LI", C: "TE", D: "VC" },
  2: { A: "VC", B: "FP", C: "LI", D: "TE" },
  3: { A: "LI", B: "TE", C: "FP", D: "VC" },
  4: { A: "TE", B: "VC", C: "LI", D: "FP" },
  5: { A: "FP", B: "VC", C: "TE", D: "LI" },
  6: { A: "LI", B: "VC", C: "TE", D: "FP" },
  7: { A: "TE", B: "FP", C: "LI", D: "VC" },
  8: { A: "VC", B: "FP", C: "LI", D: "TE" },
  9: { A: "LI", B: "FP", C: "VC", D: "TE" },
  10: { A: "TE", B: "FP", C: "VC", D: "LI" },
};

const PRIORITY: Record<Tag, number> = { FP: 0, VC: 1, TE: 2, LI: 3 };
const LABEL_ORDER: Tag[] = ["FP", "VC", "TE", "LI"];

function computeResult(counts: Counts): { code: string; type: string } {
  if (counts.LI >= 9) return { code: "LI_ALL", type: "special" };
  const entries = LABEL_ORDER.map((t) => [t, counts[t]] as [Tag, number]);
  entries.sort((a, b) => b[1] - a[1] || PRIORITY[a[0]] - PRIORITY[b[0]]);
  const [c1, v1] = entries[0];
  const [c2, v2] = entries[1];
  if (v1 - v2 >= 2) return { code: c1, type: "pure" };
  const pair = [c1, c2].sort((a, b) => LABEL_ORDER.indexOf(a) - LABEL_ORDER.indexOf(b));
  return { code: pair.join("_"), type: "hybrid" };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(raw: string): { e164: string; digits: string } | null {
  const s = (raw || "").trim();
  if (!s) return null;

  let digits = s.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);

  // Nacional BR legado (sem +55): 10 ou 11 dígitos.
  const looksNationalBR =
    !s.startsWith("+") &&
    (digits.length === 10 || digits.length === 11) &&
    !digits.startsWith("55");
  if (looksNationalBR) {
    const ddd = Number(digits.slice(0, 2));
    if (ddd < 11 || ddd > 99) return null;
    if (digits.length === 11 && digits[2] !== "9") return null;
    return { e164: "+55" + digits, digits: "55" + digits };
  }

  // E.164: 8–15 dígitos, sem zero à esquerda.
  if (digits.length < 8 || digits.length > 15) return null;
  if (digits[0] === "0") return null;

  if (digits.startsWith("55")) {
    const national = digits.slice(2);
    if (national.length !== 10 && national.length !== 11) return null;
    const ddd = Number(national.slice(0, 2));
    if (ddd < 11 || ddd > 99) return null;
    if (national.length === 11 && national[2] !== "9") return null;
  }

  return { e164: "+" + digits, digits };
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "server" }, 405);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "validation", fields: { body: "JSON inválido" } }, 422);
  }

  // Honeypot: responde ok sem gravar.
  if (typeof payload.hp === "string" && payload.hp.trim() !== "") {
    return json({ ok: true, alreadyExists: false, result_code: "LI", result_type: "pure" });
  }

  const name = String(payload.name ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase();
  const phoneRaw = String(payload.phone ?? "");
  const consent = payload.consent_lgpd === true;
  const answers = Array.isArray(payload.answers) ? payload.answers : [];

  const fields: Record<string, string> = {};
  if (name.length < 2 || name.length > 120) fields.name = "Nome inválido.";
  if (!EMAIL_RE.test(email) || email.length > 180) fields.email = "E-mail inválido.";
  const phone = normalizePhone(phoneRaw);
  if (!phone) fields.phone = "WhatsApp inválido.";
  if (!consent) fields.consent = "Consentimento obrigatório.";

  // Valida respostas: exatamente 10, q 1..10 sem repetição, option A..D.
  const seen = new Set<number>();
  let answersValid = answers.length === 10;
  const normAnswers: { q: number; option: OptionId }[] = [];
  for (const a of answers) {
    const q = Number((a as Record<string, unknown>)?.q);
    const option = String((a as Record<string, unknown>)?.option ?? "") as OptionId;
    if (!Number.isInteger(q) || q < 1 || q > 10 || seen.has(q) || !["A", "B", "C", "D"].includes(option)) {
      answersValid = false;
      break;
    }
    seen.add(q);
    normAnswers.push({ q, option });
  }
  if (!answersValid) fields.answers = "Respostas inválidas.";

  if (Object.keys(fields).length > 0) return json({ ok: false, error: "validation", fields }, 422);

  // Contagem + resultado (servidor é a fonte de verdade).
  const counts: Counts = { FP: 0, VC: 0, TE: 0, LI: 0 };
  for (const { q, option } of normAnswers) counts[ANSWER_KEY[q][option]] += 1;
  const result = computeResult(counts);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  const ipHash = await sha256Hex(ip + (Deno.env.get("IP_HASH_SALT") ?? "eap-quiz"));

  // Rate limit: máx 5 por ip_hash na última hora.
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count: recent } = await supabase
    .from("quiz_leads")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", hourAgo);
  if ((recent ?? 0) >= 5) return json({ ok: false, error: "rate_limited" }, 429);

  // Dedup / bloqueio de refazer: e-mail OU telefone já existe.
  // Duas consultas simples para não passar input do usuário pro parser do .or().
  const { data: byEmail } = await supabase
    .from("quiz_leads")
    .select("result_code, result_type")
    .eq("email_normalized", email)
    .limit(1)
    .maybeSingle();

  let existing = byEmail;
  if (!existing) {
    const { data: byPhone } = await supabase
      .from("quiz_leads")
      .select("result_code, result_type")
      .eq("phone_normalized", phone!.digits)
      .limit(1)
      .maybeSingle();
    existing = byPhone;
  }

  if (existing) {
    return json({
      ok: true,
      alreadyExists: true,
      result_code: existing.result_code,
      result_type: existing.result_type,
    });
  }

  const utm = payload.utm && typeof payload.utm === "object" ? payload.utm : {};

  const { error: insertError } = await supabase.from("quiz_leads").insert({
    name,
    email,
    email_normalized: email,
    phone_e164: phone!.e164,
    phone_normalized: phone!.digits,
    answers: normAnswers,
    counts,
    result_code: result.code,
    result_type: result.type,
    consent_lgpd: true,
    consent_at: new Date().toISOString(),
    utm,
    referrer: String(payload.referrer ?? "").slice(0, 500) || null,
    landing_path: String(payload.landing_path ?? "").slice(0, 300) || null,
    user_agent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
    ga_client_id: String(payload.ga_client_id ?? "").slice(0, 100) || null,
    ip_hash: ipHash,
  });

  if (insertError) {
    // Corrida no índice único de e-mail: trata como "já existe".
    if (insertError.code === "23505") {
      const { data: dup } = await supabase
        .from("quiz_leads")
        .select("result_code, result_type")
        .eq("email_normalized", email)
        .limit(1)
        .maybeSingle();
      if (dup) {
        return json({
          ok: true,
          alreadyExists: true,
          result_code: dup.result_code,
          result_type: dup.result_type,
        });
      }
    }
    console.error("insert error", insertError);
    return json({ ok: false, error: "server" }, 500);
  }

  return json({
    ok: true,
    alreadyExists: false,
    result_code: result.code,
    result_type: result.type,
  });
});
