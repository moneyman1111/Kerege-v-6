-- Migration: Support Sectioned Tests
-- 1. Add sections column to tests
ALTER TABLE tests ADD COLUMN IF NOT EXISTS sections JSONB;

-- 2. Add partial_answers to test_results table for debounce saving/recovery
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS partial_answers JSONB DEFAULT '{}';

-- 3. Redefine the crm_student_results VIEW to include the new column
-- We use DROP VIEW CASCADE because OR REPLACE cannot change column order or remove columns
DROP VIEW IF EXISTS crm_student_results CASCADE;

CREATE VIEW crm_student_results AS
SELECT 
  tr.id,
  tr.created_at,
  tr.first_name,
  tr.last_name,
  tr.student_name,
  tr.whatsapp,
  tr.parent_phone,
  tr.region,
  tr.test_name,
  tr.scaled_score as ort_score,
  tr.raw_score,
  tr.correct_count,
  tr.total_questions,
  tr.duration_seconds,
  tr.topic_analysis,
  tr.partial_answers, -- Added to view
  t.language as test_language,
  t.test_type
FROM test_results tr
LEFT JOIN tests t ON tr.test_id = t.id
ORDER BY tr.created_at DESC;

-- 4. Comments for documentation
COMMENT ON COLUMN tests.sections IS 'Array of test/break sections: [{"type":"test","pdf_url":"...","timer_seconds":1800}, ...]';
COMMENT ON COLUMN test_results.partial_answers IS 'Mid-test saved answers for crash recovery and real-time syncing';
COMMENT ON COLUMN crm_student_results.partial_answers IS 'Mid-test saved answers (visible in CRM view)';
