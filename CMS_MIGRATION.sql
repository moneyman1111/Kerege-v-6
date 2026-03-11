-- CMS Migration for Kerege Synak

-- 1. Create content_blocks table
CREATE TABLE IF NOT EXISTS content_blocks (
  key TEXT PRIMARY KEY, -- e.g., 'problem_1', 'problem_2', 'problem_3'
  icon TEXT NOT NULL,   -- e.g., '😰', '⏰', '📚'
  title TEXT NOT NULL,  -- e.g., 'Страх перед неизвестностью?'
  description TEXT NOT NULL, -- e.g., 'Наши тесты полностью копируют формат...'
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. Enable RLS
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Public read access
DROP POLICY IF EXISTS "content_blocks_read_policy" ON content_blocks;
CREATE POLICY "content_blocks_read_policy" ON content_blocks FOR SELECT USING (true);

-- Admin write access (simplified to true for now, can be restricted later if auth is strict)
DROP POLICY IF EXISTS "content_blocks_write_policy" ON content_blocks;
CREATE POLICY "content_blocks_write_policy" ON content_blocks FOR ALL USING (true) WITH CHECK (true);

-- 4. Insert Default Data (Initial Population)
INSERT INTO content_blocks (key, icon, title, description) VALUES
('problem_1', '😰', 'Страх перед неизвестностью?', 'Наши тесты полностью копируют формат реального ЖРТ'),
('problem_2', '⏰', 'Не хватает времени?', 'Встроенный таймер научит тебя распределять силы'),
('problem_3', '📚', 'Сложные темы?', 'Узнай свои слабые места до экзамена, а не на нем')
ON CONFLICT (key) DO NOTHING;

-- 5. Notify Schema Reload
NOTIFY pgrst, 'reload schema';
