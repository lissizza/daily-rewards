-- Migration: Add child request system
-- Children can submit pending events that require parent approval

-- 1. Add status column to events table
ALTER TABLE public.events
  ADD COLUMN status text NOT NULL DEFAULT 'approved'
  CHECK (status IN ('approved', 'pending', 'rejected'));

CREATE INDEX idx_events_status ON public.events(status);

-- 2. Update get_child_balance to only sum approved events
CREATE OR REPLACE FUNCTION public.get_child_balance(p_child_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_child_family_id uuid;
  v_user_family_id uuid;
  v_user_role text;
  v_balance integer;
BEGIN
  SELECT family_id INTO v_child_family_id
  FROM public.profiles
  WHERE id = p_child_id;

  SELECT family_id, role INTO v_user_family_id, v_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF p_child_id = auth.uid() THEN
    NULL;
  ELSIF v_child_family_id = v_user_family_id AND v_user_role IN ('owner', 'admin') THEN
    NULL;
  ELSE
    RETURN NULL;
  END IF;

  SELECT coalesce(sum(points), 0)::integer INTO v_balance
  FROM public.events
  WHERE child_id = p_child_id
    AND status = 'approved';

  RETURN v_balance;
END;
$$;

-- 3. Create get_pending_count RPC for notification badge
CREATE OR REPLACE FUNCTION public.get_pending_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_family_id uuid;
  v_role text;
  v_count integer;
BEGIN
  SELECT family_id, role INTO v_family_id, v_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_role NOT IN ('owner', 'admin') THEN
    RETURN 0;
  END IF;

  SELECT count(*)::integer INTO v_count
  FROM public.events e
  JOIN public.profiles p ON p.id = e.child_id
  WHERE p.family_id = v_family_id
    AND e.status = 'pending';

  RETURN v_count;
END;
$$;

-- 4. RLS policy: children can insert pending events for themselves
CREATE POLICY "Child can insert pending events"
  ON public.events FOR INSERT
  WITH CHECK (
    child_id = auth.uid()
    AND created_by = auth.uid()
    AND status = 'pending'
    AND public.get_my_role() = 'child'
  );

-- 5. Enable Realtime on events table
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
