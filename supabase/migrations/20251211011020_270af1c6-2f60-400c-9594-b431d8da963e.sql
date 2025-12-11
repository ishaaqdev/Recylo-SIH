-- Allow households to be inserted
CREATE POLICY "Households can be inserted" 
ON public.households 
FOR INSERT 
WITH CHECK (true);