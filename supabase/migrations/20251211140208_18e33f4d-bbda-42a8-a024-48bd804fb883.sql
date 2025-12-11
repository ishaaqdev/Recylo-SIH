-- Create trash_detections table for logging waste detection events from Raspberry Pi
CREATE TABLE public.trash_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  class TEXT NOT NULL, -- recyclable, organic, hazardous, non_recyclable
  subclass TEXT, -- plastic, metal, paper, cardboard, batteries, biomedical, ewaste, toxic_sharp
  weight_kg DECIMAL NOT NULL DEFAULT 0,
  bin_levels JSONB, -- {organic: 30, recyclable: 45, non_recyclable: 23, hazardous: 0}
  bin_weights JSONB -- {organic: 1.5, recyclable: 2.3, non_recyclable: 1.0, hazardous: 0}
);

-- Enable RLS
ALTER TABLE public.trash_detections ENABLE ROW LEVEL SECURITY;

-- Allow public read for municipal dashboard
CREATE POLICY "Trash detections are publicly readable"
ON public.trash_detections
FOR SELECT
USING (true);

-- Allow inserts for Raspberry Pi
CREATE POLICY "Trash detections can be inserted"
ON public.trash_detections
FOR INSERT
WITH CHECK (true);

-- Add weight columns to bins table if they don't exist
ALTER TABLE public.bins 
ADD COLUMN IF NOT EXISTS organic_weight DECIMAL NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS recyclable_weight DECIMAL NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS non_recyclable_weight DECIMAL NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS hazardous_weight DECIMAL NOT NULL DEFAULT 0;

-- Insert sample trash detection data for demo
INSERT INTO public.trash_detections (household_id, class, subclass, weight_kg, detected_at) VALUES
-- Recyclables
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'recyclable', 'plastic', 2.5, now() - interval '1 day'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'recyclable', 'metal', 1.2, now() - interval '2 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'recyclable', 'cardboard', 3.0, now() - interval '3 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'recyclable', 'paper', 1.8, now() - interval '4 days'),
('40184b2b-88c1-4561-a81c-15920292ed0f', 'recyclable', 'plastic', 4.2, now() - interval '1 day'),
('40184b2b-88c1-4561-a81c-15920292ed0f', 'recyclable', 'metal', 2.8, now() - interval '2 days'),
('2db7eeef-4dc9-4004-8821-743de5b4572f', 'recyclable', 'cardboard', 5.5, now() - interval '1 day'),
('2db7eeef-4dc9-4004-8821-743de5b4572f', 'recyclable', 'paper', 2.1, now() - interval '3 days'),
('46b8a557-27db-485b-96af-e1574ced5e21', 'recyclable', 'plastic', 3.3, now() - interval '2 days'),
('f8451558-dd73-4323-b4cb-a6f89106c5c8', 'recyclable', 'metal', 1.9, now() - interval '1 day'),
-- Hazardous
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'hazardous', 'batteries', 0.5, now() - interval '5 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'hazardous', 'ewaste', 1.2, now() - interval '6 days'),
('40184b2b-88c1-4561-a81c-15920292ed0f', 'hazardous', 'biomedical', 0.3, now() - interval '4 days'),
('40184b2b-88c1-4561-a81c-15920292ed0f', 'hazardous', 'toxic_sharp', 0.2, now() - interval '5 days'),
('2db7eeef-4dc9-4004-8821-743de5b4572f', 'hazardous', 'ewaste', 2.1, now() - interval '3 days'),
('46b8a557-27db-485b-96af-e1574ced5e21', 'hazardous', 'batteries', 0.8, now() - interval '2 days'),
('f8451558-dd73-4323-b4cb-a6f89106c5c8', 'hazardous', 'biomedical', 0.4, now() - interval '4 days'),
-- Organic
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'organic', 'food_waste', 5.5, now() - interval '1 day'),
('40184b2b-88c1-4561-a81c-15920292ed0f', 'organic', 'food_waste', 7.2, now() - interval '1 day'),
('2db7eeef-4dc9-4004-8821-743de5b4572f', 'organic', 'garden_waste', 4.8, now() - interval '2 days'),
('46b8a557-27db-485b-96af-e1574ced5e21', 'organic', 'food_waste', 3.2, now() - interval '1 day'),
('f8451558-dd73-4323-b4cb-a6f89106c5c8', 'organic', 'food_waste', 6.1, now() - interval '2 days'),
-- Non-recyclable
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'non_recyclable', 'mixed', 2.0, now() - interval '2 days'),
('40184b2b-88c1-4561-a81c-15920292ed0f', 'non_recyclable', 'mixed', 3.1, now() - interval '3 days'),
('2db7eeef-4dc9-4004-8821-743de5b4572f', 'non_recyclable', 'mixed', 1.5, now() - interval '1 day');

-- Update bins with sample weight data
UPDATE public.bins SET 
  organic_weight = organic * 0.15,
  recyclable_weight = recyclable * 0.12,
  non_recyclable_weight = non_recyclable * 0.08,
  hazardous_weight = hazardous * 0.05;