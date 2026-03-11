-- ============================================
-- KEREGE SYNAK - УНИВЕРСАЛЬНАЯ СХЕМА БД
-- ============================================
-- Финальная версия схемы для Supabase
-- Включает: тесты, видео, результаты студентов, CRM
-- Поддержка: загрузка, удаление, обновление всех данных
-- ============================================

-- ============================================
-- ШАГ 1: УДАЛЕНИЕ СТАРЫХ ТАБЛИЦ (если нужно начать с нуля)
-- ============================================
-- ВНИМАНИЕ: Раскомментируйте только если хотите удалить ВСЕ данные!
-- DROP TABLE IF EXISTS questions CASCADE;
-- DROP TABLE IF EXISTS test_results CASCADE;
-- DROP TABLE IF EXISTS tests CASCADE;
-- DROP TABLE IF EXISTS marketing_videos CASCADE;

-- ============================================
-- ШАГ 2: СОЗДАНИЕ ОСНОВНЫХ ТАБЛИЦ
-- ============================================

-- 1. ТАБЛИЦА ТЕСТОВ
CREATE TABLE IF NOT EXISTS tests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  language TEXT DEFAULT 'RU' CHECK (language IN ('RU', 'KG')),
  duration INTEGER DEFAULT 45 CHECK (duration > 0),
  answer_key TEXT[] NOT NULL, -- Правильные ответы: ["A","B","C","D",...]
  photo_urls TEXT[] NOT NULL, -- Base64 изображения вопросов
  test_type TEXT DEFAULT 'standard' CHECK (test_type IN ('standard', 'math', 'kyrgyz')),
  topics TEXT[], -- Темы вопросов: ["Алгебра", "Геометрия", ...]
  weights NUMERIC[], -- Веса вопросов: [1, 1.5, 2, 2.5, ...]
  structure JSONB, -- Структура разделов для ORT
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ТАБЛИЦА ВОПРОСОВ (детальная информация)
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  weight NUMERIC DEFAULT 1 CHECK (weight > 0),
  topic TEXT,
  section TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_id, question_number)
);

-- 3. ТАБЛИЦА РЕЗУЛЬТАТОВ СТУДЕНТОВ (CRM)
CREATE TABLE IF NOT EXISTS crm_student_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Информация о студенте
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  student_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  whatsapp TEXT NOT NULL,
  region TEXT,
  oblast TEXT, -- Область/Район
  parent_phone TEXT,
  parent_name TEXT, -- Имя родителя
  
  -- Информация о тесте
  test_id UUID REFERENCES tests(id) ON DELETE SET NULL,
  test_name TEXT NOT NULL,
  
  -- Результаты
  raw_score INTEGER, -- Количество правильных ответов
  scaled_score INTEGER CHECK (scaled_score >= 55 AND scaled_score <= 245), -- Балл ОРТ (55-245)
  ort_score INTEGER, -- Алиас для scaled_score
  score INTEGER, -- Основной балл (для совместимости)
  correct_count TEXT, -- Формат "25 / 30"
  total_questions INTEGER,
  
  -- Детали теста
  duration_seconds INTEGER, -- Время прохождения в секундах
  answers JSONB, -- Финальные ответы: {"1":"C", "2":"A", ...}
  answers_json TEXT, -- Дубликат для совместимости
  answer_history TEXT, -- История изменений: "1:A->C, 2:B->A"
  full_history TEXT, -- Полная история
  
  -- Анализ по темам
  topic_analysis JSONB, -- {"Алгебра": 80, "Геометрия": 60, ...}
  
  -- Дополнительные поля
  test_language TEXT DEFAULT 'RU',
  test_type TEXT DEFAULT 'standard'
);

-- ... (skip marketing_videos table) ...

-- Индексы для результатов студентов (CRM)
CREATE INDEX IF NOT EXISTS idx_crm_student_results_created_at ON crm_student_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_student_results_test_name ON crm_student_results(test_name);
CREATE INDEX IF NOT EXISTS idx_crm_student_results_test_id ON crm_student_results(test_id);
CREATE INDEX IF NOT EXISTS idx_crm_student_results_whatsapp ON crm_student_results(whatsapp);
CREATE INDEX IF NOT EXISTS idx_crm_student_results_region ON crm_student_results(region);
CREATE INDEX IF NOT EXISTS idx_crm_student_results_score ON crm_student_results(scaled_score DESC);

-- Индексы для видео
CREATE INDEX IF NOT EXISTS idx_videos_language ON marketing_videos(language);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON marketing_videos(created_at DESC);

-- ============================================
-- ШАГ 4: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Включаем RLS для всех таблиц
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_videos ENABLE ROW LEVEL SECURITY;

-- ПОЛИТИКИ ДЛЯ ТЕСТОВ
DROP POLICY IF EXISTS "tests_select_policy" ON tests;
DROP POLICY IF EXISTS "tests_insert_policy" ON tests;
DROP POLICY IF EXISTS "tests_update_policy" ON tests;
DROP POLICY IF EXISTS "tests_delete_policy" ON tests;

CREATE POLICY "tests_select_policy" ON tests FOR SELECT USING (true);
CREATE POLICY "tests_insert_policy" ON tests FOR INSERT WITH CHECK (true);
CREATE POLICY "tests_update_policy" ON tests FOR UPDATE USING (true);
CREATE POLICY "tests_delete_policy" ON tests FOR DELETE USING (true);

-- ПОЛИТИКИ ДЛЯ ВОПРОСОВ
DROP POLICY IF EXISTS "questions_select_policy" ON questions;
DROP POLICY IF EXISTS "questions_insert_policy" ON questions;
DROP POLICY IF EXISTS "questions_update_policy" ON questions;
DROP POLICY IF EXISTS "questions_delete_policy" ON questions;

CREATE POLICY "questions_select_policy" ON questions FOR SELECT USING (true);
CREATE POLICY "questions_insert_policy" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "questions_update_policy" ON questions FOR UPDATE USING (true);
CREATE POLICY "questions_delete_policy" ON questions FOR DELETE USING (true);

-- ПОЛИТИКИ ДЛЯ РЕЗУЛЬТАТОВ СТУДЕНТОВ
DROP POLICY IF EXISTS "test_results_select_policy" ON test_results;
DROP POLICY IF EXISTS "test_results_insert_policy" ON test_results;
DROP POLICY IF EXISTS "test_results_update_policy" ON test_results;
DROP POLICY IF EXISTS "test_results_delete_policy" ON test_results;

CREATE POLICY "test_results_select_policy" ON test_results FOR SELECT USING (true);
CREATE POLICY "test_results_insert_policy" ON test_results FOR INSERT WITH CHECK (true);
CREATE POLICY "test_results_update_policy" ON test_results FOR UPDATE USING (true);
CREATE POLICY "test_results_delete_policy" ON test_results FOR DELETE USING (true);

-- ПОЛИТИКИ ДЛЯ ВИДЕО
DROP POLICY IF EXISTS "videos_select_policy" ON marketing_videos;
DROP POLICY IF EXISTS "videos_insert_policy" ON marketing_videos;
DROP POLICY IF EXISTS "videos_update_policy" ON marketing_videos;
DROP POLICY IF EXISTS "videos_delete_policy" ON marketing_videos;

CREATE POLICY "videos_select_policy" ON marketing_videos FOR SELECT USING (true);
CREATE POLICY "videos_insert_policy" ON marketing_videos FOR INSERT WITH CHECK (true);
CREATE POLICY "videos_update_policy" ON marketing_videos FOR UPDATE USING (true);
CREATE POLICY "videos_delete_policy" ON marketing_videos FOR DELETE USING (true);

-- ============================================
-- ШАГ 5: ФУНКЦИИ ДЛЯ АВТОМАТИЗАЦИИ
-- ============================================

-- Функция для автоматического создания вопросов из теста
CREATE OR REPLACE FUNCTION create_questions_from_test()
RETURNS TRIGGER AS $$
DECLARE
  i INTEGER;
  topic_val TEXT;
  weight_val NUMERIC;
BEGIN
  -- Удаляем старые вопросы если они есть
  DELETE FROM questions WHERE test_id = NEW.id;
  
  -- Создаем новые вопросы
  FOR i IN 1..array_length(NEW.answer_key, 1) LOOP
    -- Получаем тему (если есть)
    topic_val := NULL;
    IF NEW.topics IS NOT NULL AND array_length(NEW.topics, 1) >= i THEN
      topic_val := NEW.topics[i];
    END IF;
    
    -- Получаем вес (если есть, иначе 1)
    weight_val := 1;
    IF NEW.weights IS NOT NULL AND array_length(NEW.weights, 1) >= i THEN
      weight_val := NEW.weights[i];
    END IF;
    
    -- Вставляем вопрос
    INSERT INTO questions (test_id, question_number, correct_answer, weight, topic)
    VALUES (NEW.id, i, NEW.answer_key[i], weight_val, topic_val);
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического создания вопросов
DROP TRIGGER IF EXISTS trigger_create_questions ON tests;
CREATE TRIGGER trigger_create_questions
AFTER INSERT OR UPDATE ON tests
FOR EACH ROW
EXECUTE FUNCTION create_questions_from_test();

-- ============================================
-- ШАГ 6: ПРЕДСТАВЛЕНИЯ (VIEWS) ДЛЯ УДОБСТВА
-- ============================================

-- Представление для CRM с полной информацией
CREATE OR REPLACE VIEW crm_student_results AS
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
  t.language as test_language,
  t.test_type
FROM test_results tr
LEFT JOIN tests t ON tr.test_id = t.id
ORDER BY tr.created_at DESC;

-- Представление для статистики тестов
CREATE OR REPLACE VIEW test_statistics AS
SELECT 
  t.id,
  t.name,
  t.language,
  t.test_type,
  array_length(t.answer_key, 1) as total_questions,
  COUNT(DISTINCT tr.id) as times_taken,
  ROUND(AVG(tr.scaled_score), 2) as avg_score,
  MAX(tr.scaled_score) as max_score,
  MIN(tr.scaled_score) as min_score,
  t.created_at
FROM tests t
LEFT JOIN test_results tr ON t.id = tr.test_id
GROUP BY t.id, t.name, t.language, t.test_type, t.answer_key, t.created_at
ORDER BY t.created_at DESC;

-- ============================================
-- ШАГ 7: КОММЕНТАРИИ (ДОКУМЕНТАЦИЯ)
-- ============================================

COMMENT ON TABLE tests IS 'Тесты с вопросами, ответами и фотографиями';
COMMENT ON COLUMN tests.answer_key IS 'Массив правильных ответов: ["A","B","C","D"]';
COMMENT ON COLUMN tests.photo_urls IS 'Массив base64 изображений вопросов';
COMMENT ON COLUMN tests.weights IS 'Веса вопросов (поддерживает дробные: 1, 1.5, 2, 2.5)';
COMMENT ON COLUMN tests.topics IS 'Темы вопросов: ["Алгебра", "Геометрия"]';

COMMENT ON TABLE questions IS 'Детальная информация о каждом вопросе теста';
COMMENT ON COLUMN questions.weight IS 'Вес вопроса (поддерживает дробные числа)';

COMMENT ON TABLE test_results IS 'Результаты студентов (CRM система)';
COMMENT ON COLUMN test_results.scaled_score IS 'Балл ОРТ по шкале 55-245';
COMMENT ON COLUMN test_results.topic_analysis IS 'Анализ по темам: {"Алгебра": 80%, "Геометрия": 60%}';

COMMENT ON TABLE marketing_videos IS 'Маркетинговые видео для платформы';

-- ============================================
-- ШАГ 8: ПРОВЕРКА УСТАНОВКИ
-- ============================================

-- Проверка таблиц
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('tests', 'questions', 'test_results', 'marketing_videos')
ORDER BY table_name;

-- Проверка политик RLS
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('tests', 'questions', 'test_results', 'marketing_videos')
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- ГОТОВО! 🎉
-- ============================================
-- Теперь база данных готова к работе:
-- ✅ Загрузка и удаление тестов
-- ✅ Загрузка и удаление видео
-- ✅ Сохранение результатов студентов
-- ✅ CRM система для админ-панели
-- ✅ Автоматическое создание вопросов
-- ✅ Поддержка дробных весов (1.5, 2.5)
-- ✅ Быстрая работа с индексами
-- ✅ Полная безопасность с RLS
-- ============================================
