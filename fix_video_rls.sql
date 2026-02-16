-- Fix 401 Unauthorized Error for Videos
-- Enable Row Level Security
ALTER TABLE marketing_videos ENABLE ROW LEVEL SECURITY;

-- 1. Allow Public Read Access (Crucial for Landing Page)
CREATE POLICY "Public videos are viewable by everyone" 
ON marketing_videos FOR SELECT 
USING (true);

-- 2. Allow Insert/Delete for Admin Features
-- Note: Since we don't have Supabase Auth integrated for users (only a simple JS check),
-- we must allow public write access for the Admin functionalities to work.
-- In a production environment, this should be restricted to authenticated users.

CREATE POLICY "Enable insert for everyone" 
ON marketing_videos FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable delete for everyone" 
ON marketing_videos FOR DELETE 
USING (true);
