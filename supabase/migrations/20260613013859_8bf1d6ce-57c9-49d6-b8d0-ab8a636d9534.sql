
CREATE POLICY "Admins update all deals" ON public.deals FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete all deals" ON public.deals FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
