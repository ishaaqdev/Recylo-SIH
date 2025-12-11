-- Add user_id column to households table to link with auth.users
ALTER TABLE public.households 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX idx_households_user_id ON public.households(user_id);

-- Update RLS policy to allow users to read their own household
DROP POLICY IF EXISTS "Households are publicly readable" ON public.households;
CREATE POLICY "Users can read own household" 
ON public.households 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Update RLS policy for update
DROP POLICY IF EXISTS "Households can be updated" ON public.households;
CREATE POLICY "Users can update own household" 
ON public.households 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Update RLS policy for insert to include user_id
DROP POLICY IF EXISTS "Households can be inserted" ON public.households;
CREATE POLICY "Users can insert own household" 
ON public.households 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);