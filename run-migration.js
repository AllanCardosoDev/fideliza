#!/usr/bin/env node
// Script temporário para executar migração SQL no Supabase
// Uso: node run-migration.js

import fs from "fs";
import path from "path";

// Carregar variáveis de ambiente do .env
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf-8");
  const env = {};

  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && !key.startsWith("#")) {
      env[key.trim()] = valueParts.join("=").trim();
    }
  });

  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Erro: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios em .env",
  );
  process.exit(1);
}

console.log("✅ Variáveis de ambiente carregadas!");

// Ler o arquivo SQL
const migrationPath = path.join(
  process.cwd(),
  "migrations/2026-04-11_add_first_installment_day.sql",
);

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Arquivo SQL não encontrado: ${migrationPath}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(migrationPath, "utf-8");

console.log("\n📌 INSTRUÇÕES PARA EXECUTAR A MIGRAÇÃO\n");
console.log("═".repeat(70));
console.log("\n1️⃣  Acesse o Supabase SQL Editor:");
console.log(`   🔗 https://app.supabase.com/project/*/sql`);
console.log("\n2️⃣  Clique em 'New Query'");
console.log("\n3️⃣  Cole o SQL abaixo:");
console.log("\n" + "─".repeat(70));
console.log(sqlContent);
console.log("─".repeat(70));
console.log("\n4️⃣  Clique em 'Run' ou pressione Ctrl+Enter");
console.log("\n5️⃣  Se vir ✅ Success, a migração foi concluída!");
console.log("\n═".repeat(70) + "\n");

console.log("💡 Após a migração, o sistema estará pronto para usar!");
console.log(
  "   Acesse http://localhost:5173 para testar a nova funcionalidade.\n",
);
