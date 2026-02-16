-- 1. Create the Results Table
create table test_results (
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

-- 2. Enable Row Level Security (RLS)
alter table test_results enable row level security;

-- 3. Create Policies
-- Allow anyone to insert results (for public tests)
create policy "Enable insert for everyone" 
on test_results for insert 
with check (true);

-- Allow anyone to read results (optional, maybe restrict later)
create policy "Enable read for everyone" 
on test_results for select 
using (true);
