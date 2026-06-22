-- ============================================================
-- Phase 4: RLS additions — allow cross-user profile reads
-- Needed so exhibitors can see visitor names in their leads list
-- ============================================================

-- Authenticated users can read any profile (name, email, interests)
-- This is intentional — trade show participants share basic info
create policy "profiles: any authenticated read"
  on public.profiles for select
  using (auth.uid() is not null);
