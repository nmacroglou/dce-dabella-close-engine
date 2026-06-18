CREATE POLICY "Reps update own deal photos"
ON public.deal_photos
FOR UPDATE
TO authenticated
USING (auth.uid() = rep_id)
WITH CHECK (auth.uid() = rep_id);

CREATE POLICY "Admins update all deal photos"
ON public.deal_photos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
