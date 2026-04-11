import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔍 DIAGNÓSTICO SUPABASE:");
console.log(
  "URL carregada:",
  supabaseUrl ? `"${supabaseUrl}"` : "❌ UNDEFINED/VAZIA",
);
console.log(
  "KEY carregada:",
  supabaseAnonKey
    ? `"${supabaseAnonKey.slice(0, 20)}..."`
    : "❌ UNDEFINED/VAZIA",
);
console.log("import.meta.env:", import.meta.env);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERRO CRÍTICO: Variáveis de ambiente não carregadas!", {
    url: supabaseUrl ? "✓" : "❌ faltando",
    key: supabaseAnonKey ? "✓" : "❌ faltando",
  });
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
