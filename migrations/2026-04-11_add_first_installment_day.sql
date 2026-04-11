-- Migration: Add first_installment_day column to loans table
-- Date: 2026-04-11
-- Purpose: Allow users to specify the day of the month for the first installment payment

-- Add first_installment_day column to loans table
ALTER TABLE loans
ADD COLUMN IF NOT EXISTS first_installment_day INT DEFAULT NULL;

-- Add constraint to ensure valid day values (1-31)
ALTER TABLE loans
ADD CONSTRAINT check_first_installment_day 
  CHECK (first_installment_day IS NULL OR (first_installment_day >= 1 AND first_installment_day <= 31));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_loans_first_installment_day ON loans(first_installment_day);

-- Log the migration
SELECT 'Migration completed: first_installment_day column added to loans table' as status;
