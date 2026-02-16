-- ============================================
-- COMPLETE SCHEMA: Kerege Synak ORT Platform
-- ============================================
-- Execute this ONLY if starting fresh
-- If tables already exist, use ort_migration.sql instead

-- ============================================
-- PART 1: Base Tables (Initial Setup)
-- ============================================

-- 1. Create the Results Table
CREATE TABLE IF NOT EXISTS test_results (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Student Info
  first_name text,
  last_name text,
  whatsapp text,
  region text,
  parent_phone text,
  
  -- Test Info
  test_name text,
  
  -- Results
  score integer, -- ORT Score (55-245)
  correct_count text, -- format "25 / 30"
  duration integer, -- seconds
  
  -- Analysis
  full_history text, -- answer history "1:A->C"
  answers jsonb -- final answers JSON {"1":"C", "2":"A"}
);

-- 2. Marketing Videos Table
CREATE TABLE IF NOT EXISTS marketing_videos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  language TEXT DEFAULT 'RU',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tests Table (if not exists)
CREATE TABLE IF NOT EXISTS tests (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  language TEXT DEFAULT 'RU',
  duration INTEGER DEFAULT 45,
  answerKey TEXT[],
  photoUrls TEXT[],
  test_type TEXT DEFAULT 'standard',
  topics TEXT[],
  weights INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================
-- PART 2: ORT Modernization (Enhancements)
-- ============================================

-- 1. Update test_results table with ORT fields
ALTER TABLE test_results 
ADD COLUMN IF NOT EXISTS raw_score INTEGER,
ADD COLUMN IF NOT EXISTS scaled_score INTEGER,
ADD COLUMN IF NOT EXISTS topic_analysis JSONB,
ADD COLUMN IF NOT EXISTS student_name TEXT,
ADD COLUMN IF NOT EXISTS test_id UUID,
ADD COLUMN IF NOT EXISTS answers_json TEXT,
ADD COLUMN IF NOT EXISTS answer_history TEXT,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS total_questions INTEGER;

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
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at);
CREATE INDEX IF NOT EXISTS idx_test_results_test_name ON test_results(test_name);

-- 4. Update tests table to support multi-section structure
ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS structure JSONB;

-- ============================================
-- PART 3: Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- test_results policies
DROP POLICY IF EXISTS "Enable insert for everyone" ON test_results;
DROP POLICY IF EXISTS "Enable read for everyone" ON test_results;

CREATE POLICY "Enable insert for everyone" 
ON test_results FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable read for everyone" 
ON test_results FOR SELECT 
USING (true);

-- marketing_videos policies
DROP POLICY IF EXISTS "Enable read access for all users" ON marketing_videos;

CREATE POLICY "Enable read access for all users" 
ON marketing_videos FOR SELECT 
USING (true);

-- tests policies
DROP POLICY IF EXISTS "Enable read access for all users" ON tests;

CREATE POLICY "Enable read access for all users" 
ON tests FOR SELECT 
USING (true);

-- questions policies
DROP POLICY IF EXISTS "Public questions are viewable by everyone" ON questions;
DROP POLICY IF EXISTS "Enable insert for everyone" ON questions;
DROP POLICY IF EXISTS "Enable update for everyone" ON questions;
DROP POLICY IF EXISTS "Enable delete for everyone" ON questions;

CREATE POLICY "Public questions are viewable by everyone" 
ON questions FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for everyone" 
ON questions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update for everyone" 
ON questions FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete for everyone" 
ON questions FOR DELETE 
USING (true);

-- ============================================
-- PART 4: Comments (Documentation)
-- ============================================

COMMENT ON TABLE questions IS 'Detailed question metadata for ORT-style testing with topics, weights, and sections';
COMMENT ON COLUMN test_results.raw_score IS 'Number of correct answers';
COMMENT ON COLUMN test_results.scaled_score IS 'ORT scaled score (55-245)';
COMMENT ON COLUMN test_results.topic_analysis IS 'JSON object with percentage success per topic';
COMMENT ON TABLE test_results IS 'Student test results with ORT scoring and topic analysis';
COMMENT ON TABLE marketing_videos IS 'Marketing videos displayed on the platform';
COMMENT ON TABLE tests IS 'Test definitions with questions, answers, and ORT structure';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify everything is set up correctly:

-- 1. Check all tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 2. Check test_results columns
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'test_results';

-- 3. Check RLS policies
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
