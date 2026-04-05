-- ============================================
-- KEREGE SYNAK - MIGRATION: ADD OPTION E (Д)
-- ============================================
-- Обновление ограничений для поддержки 5-го варианта ответа

-- 1. Обновляем constraint в таблице questions
-- Сначала удаляем старое ограничение (имя обычно pg_check_...) 
-- или просто создаем новую версию если мы знаем имя.
-- В Supabase часто имена генерируются автоматически или заданы в SCHEMA.sql

-- Попытка удалить стандартное имя если оно было задано в SCHEMA.sql:
-- ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_correct_answer_check;

-- Надежнее: проверяем текущие ограничения и обновляем
DO $$
BEGIN
    -- Пытаемся удалить ограничение, если оно существует
    ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_correct_answer_check;
    
    -- Добавляем новое ограничение с поддержкой 'E'
    ALTER TABLE questions ADD CONSTRAINT questions_correct_answer_check 
        CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E'));
END $$;

-- 2. Если в таблице tests тоже есть какие-то проверки (в SCHEMA.sql их нет для answer_key),
-- то здесь ничего больше не требуется.

-- 3. Добавляем колонку options_count в таблицу questions для будущего использования
ALTER TABLE questions ADD COLUMN IF NOT EXISTS options_count INTEGER DEFAULT 4;

-- 4. Обновляем существующие записи (по умолчанию 4)
UPDATE questions SET options_count = 4 WHERE options_count IS NULL;

-- 5. Сообщение об успешном выполнении
COMMENT ON COLUMN questions.correct_answer IS 'Правильный ответ: A, B, C, D или E (Д)';
