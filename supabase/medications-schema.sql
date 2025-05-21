-- Create the medications table
create table if not exists public.medications (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null,
  is_active boolean default true,
  code jsonb,
  dose_form text not null,
  total_volume jsonb,
  package_info jsonb,
  extension jsonb,
  dispenser_info jsonb,
  ingredient jsonb not null,
  allowed_routes text[],
  default_route text,
  common_dosages jsonb,
  dosage_constraints jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.medications enable row level security;

-- Create a policy that allows all operations for now
-- In production, you'd want more restrictive policies
create policy "Allow all operations for now" 
  on public.medications for all 
  using (true) 
  with check (true);

-- Create an index for faster lookups by name
create index if not exists medications_name_idx on public.medications (name);

-- Create an function to update the timestamp on record updates
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create a trigger to automatically update the timestamp
create trigger set_medications_updated_at
before update on public.medications
for each row
execute function public.set_updated_at();
