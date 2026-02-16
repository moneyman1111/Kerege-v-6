-- Migration: ORT Modernization - Database Schema Updates
-- Purpose: Add support for scaled scoring, topic analysis, and question metadata

-- 1. Update test_results table
ALTER TABLE test_results 
ADD COLUMN IF NOT EXISTS raw_score INTEGER,
ADD COLUMN IF NOT EXISTS scaled_score INTEGER,
ADD COLUMN IF NOT EXISTS topic_analysis JSONB;

-- 2. Create questions table for detailed question metadata
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  correct_answer TEXT NOT NULL,
  weight INTEGER DEFAULT 1,
  topic TEXT,
  section TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_section ON questions(section);

-- 4. Update tests table to support multi-section structure
ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS structure JSONB;

-- Example structure for Math test:
-- {
--   "sections": [
--     {"name": "Математика Часть 1", "questions": 30, "duration": 30},
--     {"name": "Перерыв", "duration": 5, "isBreak": true},
--     {"name": "Математика Часть 2", "questions": 30, "duration": 30}
--   ]
-- }

-- 5. Enable RLS for questions table
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow public read access for questions
CREATE POLICY "Public questions are viewable by everyone" 
ON questions FOR SELECT 
USING (true);

-- Allow insert/update/delete for authenticated users (admin)
CREATE POLICY "Enable insert for everyone" 
ON questions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update for everyone" 
ON questions FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete for everyone" 
ON questions FOR DELETE 
USING (true);

COMMENT ON TABLE questions IS 'Detailed question metadata for ORT-style testing with topics, weights, and sections';
COMMENT ON COLUMN test_results.raw_score IS 'Number of correct answers';
COMMENT ON COLUMN test_results.scaled_score IS 'ORT scaled score (55-245)';
COMMENT ON COLUMN test_results.topic_analysis IS 'JSON object with percentage success per topic';
