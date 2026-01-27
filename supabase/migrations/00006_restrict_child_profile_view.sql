-- Restrict children from viewing other family members
-- Children should only see their own profile

-- Drop the old permissive policy
drop policy if exists "Users can view family members" on public.profiles;

-- Create new policy: only owner/admin can view all family members
create policy "Owner/Admin can view family members"
  on public.profiles for select
  using (
    family_id is not null and
    family_id = (select family_id from public.profiles where id = auth.uid()) and
    (select role from public.profiles where id = auth.uid()) in ('owner', 'admin')
  );

-- Note: "Users can view own profile" policy already exists and allows
-- children to see their own profile (auth.uid() = id)
