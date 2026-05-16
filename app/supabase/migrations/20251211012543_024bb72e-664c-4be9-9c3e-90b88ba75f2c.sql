-- Create drivers table for driver authentication
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  driver_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Drivers can read their own data
CREATE POLICY "Drivers can read own data"
ON public.drivers
FOR SELECT
USING (auth.uid() = user_id);

-- Drivers can insert their own profile
CREATE POLICY "Drivers can insert own data"
ON public.drivers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update households to ensure unique QR codes
UPDATE public.households
SET qr_code = 'RECYLO-' || UPPER(SUBSTRING(id::text, 1, 8))
WHERE qr_code IS NULL OR qr_code = '';