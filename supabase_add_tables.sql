
-- Run this in Supabase SQL Editor to create missing tables

-- 1. Tests Table (Storage for test definitions)
create table if not exists tests (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  language text default 'RU',
  duration integer default 60, -- in minutes
  answer_key text[] default '{}', -- Array of correct answers ['A', 'B', ...]
  photo_urls text[] default '{}' -- Array of image URLs
);

-- 2. Videos Table
create table if not exists videos (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  url text not null, -- YouTube URL
  language text default 'RU'
);

-- 3. Enable RLS (Security)
alter table tests enable row level security;
alter table videos enable row level security;

-- 4. Policies (Public Read, Admin Write)
-- Allow everyone to read tests and videos
create policy "Public tests are viewable by everyone" on tests for select using (true);
create policy "Public videos are viewable by everyone" on videos for select using (true);

-- Allow everyone to insert/update/delete (FOR DEMO/ADMIN PANEL TO WORK WITHOUT AUTH)
-- In production, restrict this to authenticated admins only
create policy "Enable full access for all users" on tests for all using (true);
create policy "Enable full access for all users" on videos for all using (true);

-- 5. Insert Mock Data (Optional)
insert into tests (name, language, duration, answer_key, photo_urls)
values 
('Математика 2024 (Демо)', 'RU', 45, ARRAY['A', 'B', 'C', 'D', 'A'], ARRAY['https://via.placeholder.com/600x800']),
('Аналогии (Кыргызча)', 'KG', 30, ARRAY['A', 'A', 'B', 'B'], ARRAY['https://via.placeholder.com/600x800']);

insert into videos (title, url, language)
values
('Как решать задачи на проценты', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'RU'),
('Логикалык суроолор', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'KG');
