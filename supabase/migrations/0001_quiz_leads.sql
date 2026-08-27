-- Quiz "Como você lê um caso" — tabela de leads.
-- Todo acesso passa pela Edge Function submit-quiz (service_role).
-- Nenhuma policy para anon/authenticated => tabela não é legível/gravável com a chave pública.

create extension if not exists pgcrypto;

create table if not exists public.quiz_leads (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),

  name              text not null,
  email             text not null,
  email_normalized  text not null,
  phone_e164        text not null,
  phone_normalized  text not null,

  answers           jsonb not null,   -- [{ "q":1, "option":"B" }, ...]
  counts            jsonb not null,   -- { "FP":3, "VC":2, "TE":2, "LI":3 }
  result_code       text not null,
  result_type       text not null,

  consent_lgpd      boolean not null default false,
  consent_at        timestamptz,

  utm               jsonb,
  referrer          text,
  landing_path      text,
  user_agent        text,
  ga_client_id      text,
  ip_hash           text,

  constraint quiz_leads_result_code_chk check (result_code in
    ('FP','VC','TE','LI','LI_ALL','FP_VC','FP_TE','FP_LI','VC_TE','VC_LI','TE_LI')),
  constraint quiz_leads_result_type_chk check (result_type in ('pure','hybrid','special'))
);

create unique index if not exists quiz_leads_email_uidx on public.quiz_leads (email_normalized);
create index if not exists quiz_leads_phone_idx   on public.quiz_leads (phone_normalized);
create index if not exists quiz_leads_created_idx on public.quiz_leads (created_at desc);
create index if not exists quiz_leads_result_idx  on public.quiz_leads (result_code);
create index if not exists quiz_leads_iphash_idx  on public.quiz_leads (ip_hash, created_at desc);

alter table public.quiz_leads enable row level security;
-- (sem policies de propósito)
