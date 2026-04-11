#!/usr/bin/env node

/**
 * Script para configurar secrets do Supabase
 * Você precisa do Supabase Service Role Key (chave de admin)
 *
 * Como obter:
 * 1. Vá a: https://app.supabase.com
 * 2. Selecione seu projeto
 * 3. Vá em: Settings → API → Service Role (cópia a chave)
 * 4. Crie um arquivo .env com:
 *    SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
 * 5. Execute: node setup-secrets.mjs
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Carregar .env
dotenv.config();

const SUPABASE_URL = "https://urysprfgdhfhkgzxkpru.supabase.co";
const PROJECT_ID = "urysprfgdhfhkgzxkpru";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error(
    "❌ ERRO: Variável SUPABASE_SERVICE_ROLE_KEY não encontrada no .env",
  );
  console.error("\nPASSOS:");
  console.error("1. Vá a: https://app.supabase.com");
  console.error("2. Selecione o projeto 'Fideliza'");
  console.error("3. Vá em: Settings (bottom left) → API");
  console.error(
    "4. Copie o valor de 'Service Role' (a chave longa que começa com 'eyJ...')",
  );
  console.error("5. Crie um arquivo .env nesta pasta com:");
  console.error("   SUPABASE_SERVICE_ROLE_KEY=cole_a_chave_aqui");
  console.error("6. Rode este script novamente");
  process.exit(1);
}

// Ler o arquivo de credenciais
const credentialsPath = path.join(
  process.cwd(),
  "credentials",
  "google-service-account.json",
);
const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
const serviceAccountJson = JSON.stringify(serviceAccount);

const secrets = [
  {
    name: "GOOGLE_SERVICE_ACCOUNT",
    value: serviceAccountJson,
  },
  {
    name: "GOOGLE_CLIENTES_FOLDER_ID",
    value: "1cMF0yQawpwshJlvLF30hDC1HeZiJlyNOf",
  },
];

async function setSecret(name, value) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/secrets?name=eq.${name}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ value }),
      },
    );

    if (!response.ok) {
      // Tenta inserir em vez de atualizar
      const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/secrets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ name, value }),
      });

      if (!insertResponse.ok) {
        console.error(`❌ Erro ao definir ${name}`);
        console.error(await insertResponse.json());
        return false;
      }
    }

    console.log(`✅ ${name} configurado com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🔧 Configurando secrets do Supabase...\n");

  for (const secret of secrets) {
    console.log(`Configurando: ${secret.name}`);
    const success = await setSecret(secret.name, secret.value);
    if (!success) {
      console.error(`\n⚠️ Falha ao configurar. Tente manualmente:\n`);
      console.error("1. Vá a: https://app.supabase.com");
      console.error("2. Selecione seu projeto");
      console.error("3. Vá em: Settings → Edge Functions → Secrets");
      console.error("4. Clique em 'Create secret' e adicione:\n");
      console.error(`   Nome: ${secret.name}`);
      console.error(`   Valor: ${secret.value.substring(0, 50)}...\n`);
      process.exit(1);
    }
  }

  console.log("\n✅ Todos os secrets foram configurados com sucesso!");
  console.log("🎉 Agora teste a funcionalidade de upload no app!");
}

main().catch(console.error);
