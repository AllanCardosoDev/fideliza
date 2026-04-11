-- MIGRAÇÃO: Preencher pagamentos retroativamente de empréstimos já pagos
-- Execute isso no Supabase SQL Editor para registrar todos os pagamentos
-- que já foram marcados como pagos nas loans mas não têm registros em payments

-- Limpar registros inválidos
DELETE FROM payments 
WHERE client IS NULL 
   OR installment_no IS NULL 
   OR original_amount IS NULL
   OR original_amount = 0;

-- Inserir pagamentos para instalações já marcadas como pagas
-- Este script cria registros de pagamento com base na estrutura de loans e installments
INSERT INTO payments (
  id,
  loan_id,
  client_id,
  client,
  installment_no,
  total_installments,
  due_date,
  payment_date,
  original_amount,
  amount_paid,
  days_late,
  penalty_amount,
  mora_amount,
  total_with_fees,
  notes
)
SELECT
  CAST(EXTRACT(epoch FROM NOW()) * 1000 AS BIGINT) + ROW_NUMBER() OVER (ORDER BY i.id),
  i.loan_id,
  l.client_id,
  c.name,
  i.installment_no,
  l.installments,
  i.due_date,
  i.due_date,  -- Use due_date como payment_date (assumption: pagou no vencimento)
  i.amount,
  i.amount,
  0,
  0,
  0,
  i.amount,
  '[Sincronizado do histórico]'
FROM installments i
JOIN loans l ON i.loan_id = l.id
JOIN clients c ON l.client_id = c.id
WHERE i.installment_no <= l.paid  -- Apenas as parcelas que foram marcadas como pagas
  AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.loan_id = i.loan_id 
      AND p.installment_no = i.installment_no
  )
ORDER BY i.loan_id, i.installment_no;

-- Verificar resultado
SELECT COUNT(*) as "Total de Pagamentos Inseridos" FROM payments;
SELECT * FROM payments ORDER BY payment_date DESC LIMIT 20;
