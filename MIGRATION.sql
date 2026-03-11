-- МИГРАЦИЯ: ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ БАЛЛОВ ОРТ

-- 1. Добавляем колонки в ТАБЛИЦУ (если еще не добавлены)
ALTER TABLE test_results 
ADD COLUMN IF NOT EXISTS oblast TEXT,
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS ort_score INTEGER,
ADD COLUMN IF NOT EXISTS test_language TEXT,
ADD COLUMN IF NOT EXISTS test_type TEXT;

-- 2. Обновляем представление crm_student_results
-- Исправляем ошибку, из-за которой балл ОРТ был пустым
DROP VIEW IF EXISTS crm_student_results;

CREATE OR REPLACE VIEW crm_student_results WITH (security_invoker = on) AS
SELECT 
  tr.id,
  tr.created_at,
  tr.first_name,
  tr.last_name,
  tr.student_name,
  tr.whatsapp,
  tr.parent_phone,
  tr.parent_name,
  tr.region,
  tr.oblast,
  tr.test_name,
  -- ВАЖНО: Берем балл из ort_score, так как код пишет именно туда
  COALESCE(tr.ort_score, tr.scaled_score) as ort_score, 
  tr.raw_score,
  tr.correct_count,
  tr.total_questions,
  tr.duration_seconds,
  tr.topic_analysis,
  COALESCE(tr.test_language, t.language) as test_language,
  COALESCE(tr.test_type, t.test_type) as test_type
FROM test_results tr
LEFT JOIN tests t ON tr.test_id = t.id
ORDER BY tr.created_at DESC;

-- 3. Перезагружаем кэш схемы
NOTIFY pgrst, 'reload schema';
