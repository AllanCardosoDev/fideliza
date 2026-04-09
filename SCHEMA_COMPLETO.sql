-- ============================================================
--  FIDELIZA CRED — Schema Completo para Nova Conta Supabase
--  Execute TODO este arquivo no SQL Editor do novo projeto
--  Ordem de execução: employees → clients → loans → demais
-- ============================================================

-- ============================================================
-- 1. EMPLOYEES (criada primeiro, pois clients faz referência)
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            TEXT NOT NULL DEFAULT '',
  role            TEXT DEFAULT '',
  phone           TEXT DEFAULT '',
  email           TEXT DEFAULT '',
  status          TEXT DEFAULT 'active',
  salary          NUMERIC(12,2) DEFAULT NULL,
  department      TEXT DEFAULT '',
  admission       DATE DEFAULT NULL,
  username        TEXT DEFAULT '',
  password        TEXT DEFAULT '',
  access_level    TEXT DEFAULT 'employee',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT access_level_check CHECK (
    access_level IN ('admin', 'supervisor', 'employee', 'guest')
  )
);

-- ============================================================
-- 2. CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name             TEXT NOT NULL,
  cpf_cnpj         TEXT UNIQUE,
  phone            TEXT DEFAULT '',
  email            TEXT DEFAULT '',
  address          TEXT DEFAULT '',
  notes            TEXT DEFAULT '',
  status           TEXT DEFAULT 'ativo',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  created_by       BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  owner_id         BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  approval_status  VARCHAR(25) DEFAULT 'approved',
  rejection_reason TEXT DEFAULT NULL,
  -- campos extras de cadastro
  rg               TEXT DEFAULT '',
  profession       TEXT DEFAULT '',
  client_type      TEXT DEFAULT 'autonomo',
  business_segment TEXT DEFAULT '',
  birth_date       DATE DEFAULT NULL,
  zip_code         TEXT DEFAULT '',
  street           TEXT DEFAULT '',
  number           TEXT DEFAULT '',
  complement       TEXT DEFAULT '',
  neighborhood     TEXT DEFAULT '',
  city             TEXT DEFAULT '',
  state            TEXT DEFAULT '',
  profile          JSONB DEFAULT '{}'
);

-- ============================================================
-- 3. LOANS
-- ============================================================
CREATE TABLE IF NOT EXISTS loans (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client           TEXT DEFAULT '',
  client_id        BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  value            NUMERIC(12,2) NOT NULL DEFAULT 0,
  installments     INT NOT NULL DEFAULT 1,
  paid             INT DEFAULT 0,
  status           TEXT DEFAULT 'active',
  interest_rate    NUMERIC(5,2) DEFAULT 5.00,
  interest_type    TEXT DEFAULT 'compound',
  start_date       DATE DEFAULT CURRENT_DATE,
  notes            TEXT DEFAULT '',
  protocol         TEXT UNIQUE,
  -- rastreamento de aprovação
  approved_at      TIMESTAMP NULL,
  approved_by      UUID NULL,
  rejected_at      TIMESTAMP NULL,
  rejected_by      UUID NULL,
  rejection_reason TEXT DEFAULT NULL,
  -- rastreamento de criação
  created_by       UUID DEFAULT NULL,
  created_by_name  VARCHAR(255) DEFAULT NULL,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. INSTALLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS installments (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  loan_id     BIGINT REFERENCES loans(id) ON DELETE CASCADE,
  number      INT NOT NULL DEFAULT 1,
  due_date    DATE NOT NULL,
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  status      TEXT DEFAULT 'pending',
  paid_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  loan_id         BIGINT REFERENCES loans(id) ON DELETE CASCADE,
  installment_id  BIGINT REFERENCES installments(id) ON DELETE SET NULL,
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  penalty         NUMERIC(12,2) DEFAULT 0,
  mora            NUMERIC(12,2) DEFAULT 0,
  payment_date    DATE DEFAULT CURRENT_DATE,
  notes           TEXT DEFAULT '',
  reversed        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. TRANSACTIONS  (receitas e despesas manuais)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  description TEXT DEFAULT '',
  category    TEXT DEFAULT '',
  type        TEXT DEFAULT 'income',   -- 'income' | 'expense'
  amount      NUMERIC(12,2) DEFAULT 0,
  date        DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title      TEXT DEFAULT '',
  message    TEXT DEFAULT '',
  type       TEXT DEFAULT 'info',
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. CLIENT_ASSIGNMENTS  (vincula múltiplos funcionários a um cliente)
-- ============================================================
CREATE TABLE IF NOT EXISTS client_assignments (
  id          BIGSERIAL PRIMARY KEY,
  client_id   BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'viewer',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  notes       TEXT,
  UNIQUE(client_id, employee_id, role)
);

-- ============================================================
-- 11. DOCUMENTS  (metadados dos arquivos enviados)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_id     BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  employee_id   BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  document_type TEXT DEFAULT '',
  file_name     TEXT DEFAULT '',
  file_url      TEXT DEFAULT '',
  file_size     BIGINT DEFAULT 0,
  mime_type     TEXT DEFAULT '',
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MIGRAÇÃO: Adicionar campo profile se não existir
-- ============================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS profile JSONB DEFAULT '{}';

-- ============================================================
-- 12. ÍNDICES  (performance)
-- ============================================================

-- clients
CREATE INDEX IF NOT EXISTS idx_clients_cpf_cnpj        ON clients(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clients_status           ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_by       ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_owner_id         ON clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_clients_approval_status  ON clients(approval_status);
CREATE INDEX IF NOT EXISTS idx_clients_profile          ON clients USING GIN(profile);

-- employees
CREATE INDEX IF NOT EXISTS idx_employees_email          ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_access_level   ON employees(access_level);

-- loans
CREATE INDEX IF NOT EXISTS idx_loans_client_id   ON loans(client_id);
CREATE INDEX IF NOT EXISTS idx_loans_status      ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_protocol    ON loans(protocol);
CREATE INDEX IF NOT EXISTS idx_loans_approved_at ON loans(approved_at);
CREATE INDEX IF NOT EXISTS idx_loans_rejected_at ON loans(rejected_at);
CREATE INDEX IF NOT EXISTS idx_loans_approved_by ON loans(approved_by);
CREATE INDEX IF NOT EXISTS idx_loans_created_at  ON loans(created_at);

-- installments
CREATE INDEX IF NOT EXISTS idx_installments_loan_id  ON installments(loan_id);
CREATE INDEX IF NOT EXISTS idx_installments_status   ON installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_loan_id        ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_installment_id ON payments(installment_id);

-- client_assignments
CREATE INDEX IF NOT EXISTS idx_client_assignments_client_id   ON client_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_employee_id ON client_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_role        ON client_assignments(role);

-- documents
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);

-- ============================================================
-- 13. DESABILITAR ROW LEVEL SECURITY (acesso via anon key)
-- ============================================================
ALTER TABLE clients           DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees         DISABLE ROW LEVEL SECURITY;
ALTER TABLE loans             DISABLE ROW LEVEL SECURITY;
ALTER TABLE installments      DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments          DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions      DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents         DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 14. PERMISSÕES (anon key e authenticated)
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================
-- 15. USUÁRIO ADMIN INICIAL
--     Troque a senha antes de usar em produção!
-- ============================================================
INSERT INTO employees (name, email, username, password, access_level, role, status)
VALUES ('Administrador', 'credifideliza@gmail.com', 'admin', 'admin123', 'admin', 'Administrador', 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 16. VERIFICAÇÃO FINAL — conta registros em cada tabela
-- ============================================================
SELECT 'employees'          AS tabela, COUNT(*) AS total FROM employees
UNION ALL
SELECT 'clients',             COUNT(*) FROM clients
UNION ALL
SELECT 'loans',               COUNT(*) FROM loans
UNION ALL
SELECT 'installments',        COUNT(*) FROM installments
UNION ALL
SELECT 'payments',            COUNT(*) FROM payments
UNION ALL
SELECT 'transactions',        COUNT(*) FROM transactions
UNION ALL
SELECT 'notifications',       COUNT(*) FROM notifications
UNION ALL
SELECT 'client_assignments',  COUNT(*) FROM client_assignments
UNION ALL
SELECT 'documents',           COUNT(*) FROM documents
ORDER BY tabela;
