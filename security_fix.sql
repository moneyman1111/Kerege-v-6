
-- 1. Enable Row Level Security (RLS) on all tables
ALTER TABLE IF EXISTS marketing_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tests ENABLE ROW LEVEL SECURITY;

-- 2. Policies for Marketing Videos
-- Allow anyone to view videos
DROP POLICY IF EXISTS "Public Read Videos" ON marketing_videos;
CREATE POLICY "Public Read Videos" ON marketing_videos FOR SELECT USING (true);

-- Allow anyone to Insert/Update/Delete (Temporary for Admin Panel without Login)
-- WARNING: In production, replace 'true' with (auth.role() = 'service_role' OR auth.uid() IN (select user_id from admins))
DROP POLICY IF EXISTS "Admin Manage Videos" ON marketing_videos;
CREATE POLICY "Admin Manage Videos" ON marketing_videos FOR ALL USING (true);

-- 3. Policies for Test Results
-- Allow anyone to Insert their result (submit test)
DROP POLICY IF EXISTS "Public Submit Results" ON test_results;
CREATE POLICY "Public Submit Results" ON test_results FOR INSERT WITH CHECK (true);

-- Allow admins to view all results (using 'true' for now for CRM Access)
DROP POLICY IF EXISTS "Admin View Results" ON test_results;
CREATE POLICY "Admin View Results" ON test_results FOR SELECT USING (true);

-- 4. Policies for Tests
DROP POLICY IF EXISTS "Public Read Tests" ON tests;
CREATE POLICY "Public Read Tests" ON tests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Manage Tests" ON tests;
CREATE POLICY "Admin Manage Tests" ON tests FOR ALL USING (true);
