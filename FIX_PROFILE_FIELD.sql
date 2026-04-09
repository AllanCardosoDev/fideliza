-- ============================================================
-- FIX: Adicionar campo PROFILE à tabela CLIENTS
-- ============================================================
-- Execute este script AGORA no Supabase SQL Editor
-- se você já criou a tabela clients sem o campo profile

ALTER TABLE clients ADD COLUMN IF NOT EXISTS profile JSONB DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_clients_profile ON clients USING GIN(profile);

-- Confirmação
SELECT 'Campo profile adicionado com sucesso!' AS resultado;
