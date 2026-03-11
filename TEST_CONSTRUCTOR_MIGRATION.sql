-- ============================================================
-- TEST CONSTRUCTOR: Draft Autosave Table
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

-- Draft storage for Test Constructor autosave
CREATE TABLE IF NOT EXISTS test_drafts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_name  text,
  draft_data  jsonb NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Enable RLS (allow all for now — admin-only panel)
ALTER TABLE test_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to drafts"
  ON test_drafts FOR ALL USING (true);

-- Optional: Add extra columns to existing tests table
-- (Run only if these columns don't exist yet)
DO $$
BEGIN
  -- question_texts: array of HTML strings for each question
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='tests' AND column_name='question_texts'
  ) THEN
    ALTER TABLE tests ADD COLUMN question_texts jsonb;
  END IF;

  -- options: array of {A,B,C,D} objects
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='tests' AND column_name='options'
  ) THEN
    ALTER TABLE tests ADD COLUMN options jsonb;
  END IF;

  -- explanations: array of explanation strings per question
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='tests' AND column_name='explanations'
  ) THEN
    ALTER TABLE tests ADD COLUMN explanations jsonb;
  END IF;

  -- sections: array of section names per question
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='tests' AND column_name='sections'
  ) THEN
    ALTER TABLE tests ADD COLUMN sections jsonb;
  END IF;
END $$;

-- ============================================================
-- DONE. Your Test Constructor is now ready for autosave.
-- ============================================================
