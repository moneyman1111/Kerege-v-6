-- =====================================================
-- Kerege Synak: Link-Only Tests with Time Windows
-- Run this migration in Supabase SQL Editor
-- =====================================================

-- 1. Add new columns to the tests table
ALTER TABLE tests
    ADD COLUMN IF NOT EXISTS is_link_only BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS access_start TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS access_end   TIMESTAMPTZ DEFAULT NULL;

-- 2. Index for fast lookups by link-only flag
CREATE INDEX IF NOT EXISTS idx_tests_link_only ON tests(is_link_only);

-- 3. Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tests'
  AND column_name IN ('is_link_only', 'access_start', 'access_end');
