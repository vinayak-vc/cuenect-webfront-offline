/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly CF_ACCOUNT_ID?: string;
  readonly VITE_CF_ACCOUNT_ID?: string;
  readonly CF_API_TOKEN?: string;
  readonly VITE_CF_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
