-- ============================================================
-- ACCESS LINKS MIGRATION
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Table for unique access link codes
CREATE TABLE IF NOT EXISTS test_access_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id     uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  access_code text NOT NULL UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 12),
  expires_at  timestamptz,
  created_at  timestamptz DEFAULT now()
);

-- Index for fast code lookup
CREATE INDEX IF NOT EXISTS idx_access_links_code ON test_access_links(access_code);

-- Index for public test list query (is_link_only filter + ordering by date)
CREATE INDEX IF NOT EXISTS idx_tests_public
  ON tests(is_link_only, created_at DESC)
  WHERE is_link_only IS DISTINCT FROM true;

-- Index for fast single-test fetch by id (usually exists, but ensure it)
CREATE INDEX IF NOT EXISTS idx_tests_id ON tests(id);

-- 2. RLS for test_access_links
ALTER TABLE test_access_links ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read a link (validation check by code)
CREATE POLICY "Public can read access links by code"
  ON test_access_links FOR SELECT
  USING (true);

-- Allow unrestricted insert/delete (admin panel uses anon key)
CREATE POLICY "Admin can manage access links"
  ON test_access_links FOR ALL
  USING (true);

-- 3. Fix CASCADE DELETE for test_results
-- (Drop and re-add FK with ON DELETE CASCADE)
DO $$
BEGIN
  -- Fix test_results FK if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'test_results'
    AND constraint_name = 'test_results_test_id_fkey'
  ) THEN
    ALTER TABLE test_results
      DROP CONSTRAINT test_results_test_id_fkey;
    ALTER TABLE test_results
      ADD CONSTRAINT test_results_test_id_fkey
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. RLS for tests table — allow DELETE for anon (admin panel)
DO $$
BEGIN
  -- Drop old restrictive delete policy if exists
  DROP POLICY IF EXISTS "Deny delete for anon" ON tests;
  DROP POLICY IF EXISTS "Admin can delete tests" ON tests;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Allow delete for all (admin uses anon key)"
  ON tests FOR DELETE
  USING (true);

-- ============================================================
-- DONE. Now:
-- 1. test_access_links table is ready
-- 2. Deleting a test cascades to test_results and test_access_links
-- 3. RLS allows anon admin to delete tests
-- ============================================================
