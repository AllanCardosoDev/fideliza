# 🚀 Executar Migração SQL do Supabase

A migração adiciona a coluna `first_installment_day` à tabela `loans`, permitindo que cada empréstimo tenha um dia customizável para a primeira parcela.

## Opção 1: Via Script Automático (Windows) ⚡

```bash
execute-migration.bat
```

O script irá:

1. Iniciar o servidor de desenvolvimento
2. Aguardar alguns segundos
3. Executar a migração automaticamente
4. Exibir o resultado

## Opção 2: Via Supabase Dashboard 🌐

1. Acesse: https://app.supabase.com/project/*/sql
2. Clique em "New Query"
3. Cole o SQL abaixo:

```sql
-- Migration: Add first_installment_day column to loans table
-- Date: 2026-04-11

ALTER TABLE loans
ADD COLUMN IF NOT EXISTS first_installment_day INT DEFAULT NULL;

ALTER TABLE loans
ADD CONSTRAINT check_first_installment_day
  CHECK (first_installment_day IS NULL OR (first_installment_day >= 1 AND first_installment_day <= 31));

CREATE INDEX IF NOT EXISTS idx_loans_first_installment_day ON loans(first_installment_day);

SELECT 'Migration completed: first_installment_day column added to loans table' as status;
```

4. Clique em "Run" ou pressione `Ctrl+Enter`
5. Se vir ✅ Success, a migração foi concluída

## Opção 3: Via curl (Se servidor está rodando) 💻

```bash
curl -X POST http://localhost:3000/api/migrations/run-first-installment-day \
  -H "Content-Type: application/json"
```

## Opção 4: Via Node.js Script

```bash
node run-migration.js
```

Mostrará o SQL que precisa ser executado no Supabase Dashboard.

---

## ✨ Após a Migração

O sistema estará pronto para:

- ✅ Definir juros padrão de 2.98%
- ✅ Escolher o dia da primeira parcela (1-31)
- ✅ Precificar automaticamente 1 mês após o contrato
- ✅ Modificar valores refletindo em todas as parcelas

## 🆘 Solução de Problemas

**Erro: "Conexão recusada"**

- Certifique-se de que o servidor está rodando: `npm run dev`
- Aguarde alguns segundos para o servidor inicializar

**Erro: "Coluna já existe"**

- A migração já foi executada com sucesso
- Você pode usar o sistema normalmente

**Erro: "Permissão negada"**

- Você precisa ter permissões admin no Supabase
- Use o Supabase Dashboard para executar manualmente

---

**Status:** ✅ Pronto para usar
**Data:** 2026-04-11
