-- Migration: Tabela de Contratos
-- Data: 2026-04-15
-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS contracts (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_id        BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  loan_id          BIGINT REFERENCES loans(id) ON DELETE SET NULL,
  protocol         TEXT UNIQUE NOT NULL,
  status           TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'signed', 'cancelled')),

  -- Dados do Mutuário (snapshot no momento de geração do contrato)
  mutuaria_name    TEXT NOT NULL,
  mutuaria_cnpj    TEXT,
  mutuaria_address TEXT,

  -- Dados da Operação (snapshot)
  valor_contratado NUMERIC(12,2) NOT NULL,
  taxa_juros       NUMERIC(6,3) NOT NULL,
  qtde_parcelas    INTEGER NOT NULL,
  valor_parcela    NUMERIC(12,2) NOT NULL,
  aliquota_iof     NUMERIC(10,2) DEFAULT 0,
  data_contrato    DATE DEFAULT CURRENT_DATE,
  start_date       DATE,

  created_by       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_protocol ON contracts(protocol);
CREATE INDEX IF NOT EXISTS idx_contracts_client   ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_loan     ON contracts(loan_id);

-- Trigger de updated_at automático
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_contracts_updated_at();
