-- Add allow_multiple column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN DEFAULT false;
