
CREATE POLICY "Reps can update own incident notes"
ON public.deal_incident_notes
FOR UPDATE
USING (auth.uid() = rep_id)
WITH CHECK (auth.uid() = rep_id);

CREATE POLICY "Reps can update own deal photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'deal-photos' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'deal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can read followup attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'followup-attachments' AND public.has_role(auth.uid(), 'admin'));
