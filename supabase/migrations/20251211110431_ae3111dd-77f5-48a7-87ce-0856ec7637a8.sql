-- Fix: Allow municipal users to read all drivers data
CREATE POLICY "Municipal users can read all drivers" 
ON public.drivers 
FOR SELECT 
USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Drivers can read own data" ON public.drivers;