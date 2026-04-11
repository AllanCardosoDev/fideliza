// Endpoint para executar migrações SQL (adicionar em server.js)
// POST /api/migrations/run-first-installment-day

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Função para executar migração
export async function runFirstInstallmentDayMigration(req, res) {
  try {
    // Criar cliente Supabase (usar admin key se disponível)
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let supabase;

    if (supabaseServiceRoleKey) {
      console.log("✅ Usando Service Role Key (admin)");
      supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    } else {
      console.log("⚠️  Usando Anon Key (limitado)");
      supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    // Ler arquivo SQL
    const migrationPath = path.join(
      process.cwd(),
      "migrations/2026-04-11_add_first_installment_day.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      return res
        .status(404)
        .json({ error: "Arquivo SQL não encontrado" });
    }

    const sqlContent = fs.readFileSync(migrationPath, "utf-8");
    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--"));

    console.log(`\n🚀 Executando ${statements.length} statement(s) SQL...`);

    let results = [];
    let errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(
        `[${i + 1}/${statements.length}] ${statement.substring(0, 80)}...`
      );

      try {
        // Executar via RPC se disponível
        const { data, error } = await supabase.rpc("exec_sql", {
          sql: statement,
        });

        if (error) {
          // Tentar com fetch direto se RPC não funcionar
          const response = await fetch(
            `${supabaseUrl}/rest/v1/rpc/pg_query`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: supabaseServiceRoleKey || supabaseAnonKey,
                Authorization: `Bearer ${supabaseServiceRoleKey || supabaseAnonKey}`,
              },
              body: JSON.stringify({ statement }),
            }
          );

          if (!response.ok) {
            console.error(`   ❌ Erro: ${error.message}`);
            errors.push({ statement: statement.substring(0, 50), error: error.message });
          } else {
            const resData = await response.json();
            console.log(`   ✅ OK`);
            results.push({ statement: statement.substring(0, 50), status: "success" });
          }
        } else {
          console.log(`   ✅ OK`);
          results.push({ statement: statement.substring(0, 50), status: "success" });
        }
      } catch (err) {
        console.error(`   ❌ Erro: ${err.message}`);
        errors.push({ statement: statement.substring(0, 50), error: err.message });
      }
    }

    if (errors.length === 0) {
      console.log("\n✨ Migração concluída com sucesso!");
      return res.json({
        success: true,
        message: "Migração executada com sucesso! A coluna 'first_installment_day' foi adicionada à tabela loans.",
        results: results.length,
      });
    } else {
      console.log(`\n⚠️  ${errors.length} error(s)`);
      return res.status(400).json({
        success: false,
        message: "Alguns statements falharam",
        results: results.length,
        errors: errors,
      });
    }
  } catch (err) {
    console.error("❌ Erro geral:", err.message);
    return res.status(500).json({
      success: false,
      message: "Erro ao executar migração: " + err.message,
    });
  }
}
