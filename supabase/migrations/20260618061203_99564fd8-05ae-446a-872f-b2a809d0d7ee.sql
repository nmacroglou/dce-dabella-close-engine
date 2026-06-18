CREATE POLICY "Reps update own incident attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'incident-attachments' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'incident-attachments' AND (auth.uid())::text = (storage.foldername(name))[1]);