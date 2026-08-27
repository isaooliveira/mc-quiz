/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_GA_ID?: string;
  readonly VITE_EAP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
