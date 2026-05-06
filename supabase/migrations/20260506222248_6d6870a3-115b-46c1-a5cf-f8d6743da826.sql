insert into storage.buckets (id, name, public) values ('followup-attachments', 'followup-attachments', true)
on conflict (id) do nothing;

create policy "Reps view own followup attachments"
on storage.objects for select
using (bucket_id = 'followup-attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public can view followup attachments"
on storage.objects for select
using (bucket_id = 'followup-attachments');

create policy "Reps upload own followup attachments"
on storage.objects for insert
with check (bucket_id = 'followup-attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Reps update own followup attachments"
on storage.objects for update
using (bucket_id = 'followup-attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Reps delete own followup attachments"
on storage.objects for delete
using (bucket_id = 'followup-attachments' and auth.uid()::text = (storage.foldername(name))[1]);