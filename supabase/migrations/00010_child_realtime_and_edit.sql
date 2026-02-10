-- Enable full replica identity for Realtime old record in UPDATE payloads
ALTER TABLE public.events REPLICA IDENTITY FULL;

-- Allow children to update points on their own pending events
CREATE POLICY "Child can update own pending events"
  ON public.events FOR UPDATE
  USING (
    child_id = auth.uid()
    AND status = 'pending'
    AND public.get_my_role() = 'child'
  )
  WITH CHECK (
    child_id = auth.uid()
    AND status = 'pending'
    AND public.get_my_role() = 'child'
  );
