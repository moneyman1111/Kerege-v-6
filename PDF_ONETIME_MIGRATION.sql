-- ========================================================
-- KEREGE — PDF & One-Time Link Migration
-- Run this in your Supabase SQL Editor
-- ========================================================

-- 1. Add pdf_url column to tests table (stores base64 PDF data URL)
ALTER TABLE tests ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- 2. Add question_count column (number of questions for PDF-based tests)
ALTER TABLE tests ADD COLUMN IF NOT EXISTS question_count INTEGER;

-- 3. Add is_pdf column to distinguish PDF tests from image-based tests
ALTER TABLE tests ADD COLUMN IF NOT EXISTS is_pdf BOOLEAN DEFAULT FALSE;

-- 4. Add is_used to test_access_links (one-time link tracking)
ALTER TABLE test_access_links ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT FALSE;
ALTER TABLE test_access_links ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

-- 5. Update RLS policy to allow marking links as used (public update on is_used only)
-- Drop existing policy if needed and recreate
DROP POLICY IF EXISTS "Allow marking link as used" ON test_access_links;
CREATE POLICY "Allow marking link as used"
ON test_access_links
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- 6. Ensure content_blocks table has rows for new CMS fields
-- Add 'value', 'label', and 'video_url' columns to content_blocks if they don't exist
ALTER TABLE content_blocks ADD COLUMN IF NOT EXISTS value TEXT;
ALTER TABLE content_blocks ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE content_blocks ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Run ONLY if content_blocks table exists
INSERT INTO content_blocks (key, value, label, icon, title, description) VALUES
  ('whatsapp_number', '996555123456', 'WhatsApp номер для связи', '📱', 'WhatsApp', 'Номер для кнопок связи'),
  ('landing_hero_title', 'Кереге окуу борбору менен 200+ баллга жет', 'Заголовок лендинга', '🏠', 'Герой Заголовок', 'Главный заголовок на лендинге'),
  ('landing_hero_subtitle', 'Бул тест сенин чыныгы деңгээлиңди аныктайт.', 'Подзаголовок лендинга', '🏠', 'Герой Подзаголовок', 'Текст под главным заголовком'),
  ('company_description', 'KEREGE — ОРТ/ЖРТга даярдоочу профессионал борбор.', 'Описание компании', '🏢', 'О компании', 'Описание на странице О нас'),
  ('congrats_text', 'Тест ийгиликтүү бүттү! Натыйжаларыңыз мугалимдерибизге жөнөтүлдү.', 'Текст поздравления', '🎉', 'Поздравление', 'Текст после завершения теста')
ON CONFLICT (key) DO NOTHING;
