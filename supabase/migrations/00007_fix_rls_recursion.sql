-- Fix RLS recursion in profile policies
-- Using security definer functions to avoid infinite recursion

-- Helper function to get current user's family_id without RLS
CREATE OR REPLACE FUNCTION public.get_my_family_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT family_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Helper function to get current user's role without RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Owner/Admin can view family members" ON public.profiles;

-- Recreate policy using helper functions
CREATE POLICY "Owner/Admin can view family members"
  ON public.profiles FOR SELECT
  USING (
    family_id IS NOT NULL AND
    family_id = public.get_my_family_id() AND
    public.get_my_role() IN ('owner', 'admin')
  );
