-- Fix: Ensure users can always view their own profile
-- The "Owner/Admin can view family members" policy may block owners from seeing their own profile
-- because it requires family_id to match AND role to be owner/admin, but the role check
-- uses get_my_role() which queries profiles - causing recursion or blocking.

-- First, make sure the "Users can view own profile" policy exists and works
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- The key insight: PostgreSQL RLS policies are OR'd together.
-- So if "Users can view own profile" matches (id = auth.uid()), access is granted
-- regardless of what "Owner/Admin can view family members" does.
--
-- The issue was that the helper functions get_my_family_id() and get_my_role()
-- were themselves trying to read from profiles table, which triggered RLS again.
-- But since they are SECURITY DEFINER, they should bypass RLS...
--
-- Let's ensure the helper functions have proper search_path to avoid any issues:

CREATE OR REPLACE FUNCTION public.get_my_family_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT family_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;
