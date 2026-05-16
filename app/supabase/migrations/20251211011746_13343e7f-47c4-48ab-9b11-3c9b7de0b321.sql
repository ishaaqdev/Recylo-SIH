-- Create collection_logs table
CREATE TABLE public.collection_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  driver_id TEXT,
  status TEXT NOT NULL DEFAULT 'collected'
);

-- Enable RLS
ALTER TABLE public.collection_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/insert for collection logs
CREATE POLICY "Collection logs are publicly readable" 
ON public.collection_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Collection logs can be inserted" 
ON public.collection_logs 
FOR INSERT 
WITH CHECK (true);