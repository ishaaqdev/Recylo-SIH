-- Add location fields to households table
ALTER TABLE public.households 
ADD COLUMN IF NOT EXISTS state text DEFAULT 'Odisha',
ADD COLUMN IF NOT EXISTS district text DEFAULT 'Khordha',
ADD COLUMN IF NOT EXISTS pincode text DEFAULT '751024';

-- Update existing households with diverse location data
UPDATE public.households SET state = 'Odisha', district = 'Khordha', pincode = '751024' WHERE name = 'hema';
UPDATE public.households SET state = 'Odisha', district = 'Khordha', pincode = '751001' WHERE name = 'Rajesh Das';
UPDATE public.households SET state = 'Odisha', district = 'Cuttack', pincode = '753001' WHERE name = 'Anita Behera';
UPDATE public.households SET state = 'Odisha', district = 'Puri', pincode = '752001' WHERE name = 'Deepak Nayak';
UPDATE public.households SET state = 'Karnataka', district = 'Bengaluru', pincode = '560001' WHERE name = 'ramu';

-- Add more sample households with diverse locations
INSERT INTO public.households (name, phone, address, state, district, pincode, level, points, total_waste_recycled, qr_code)
VALUES 
  ('Priya Sharma', '9876123456', 'MG Road, Bengaluru', 'Karnataka', 'Bengaluru', '560001', 5, 750, 89.5, 'RECYLO-PRIYA006'),
  ('Suresh Patel', '8745612309', 'Indiranagar, Bengaluru', 'Karnataka', 'Bengaluru', '560038', 3, 450, 45.2, 'RECYLO-SURESH007'),
  ('Meena Reddy', '7896541230', 'Koramangala, Bengaluru', 'Karnataka', 'Bengaluru', '560034', 7, 1100, 125.8, 'RECYLO-MEENA008'),
  ('Amit Kumar', '9012345678', 'Saheed Nagar, Bhubaneswar', 'Odisha', 'Khordha', '751007', 4, 600, 72.3, 'RECYLO-AMIT009'),
  ('Lakshmi Devi', '8901234567', 'Jayadev Vihar, Bhubaneswar', 'Odisha', 'Khordha', '751013', 6, 950, 110.5, 'RECYLO-LAKSHMI010'),
  ('Ravi Mohanty', '7890123456', 'Cuttack Road', 'Odisha', 'Cuttack', '753012', 2, 300, 35.7, 'RECYLO-RAVI011'),
  ('Sita Panda', '6789012345', 'Puri Beach Road', 'Odisha', 'Puri', '752002', 8, 1250, 145.9, 'RECYLO-SITA012')
ON CONFLICT (id) DO NOTHING;

-- Add more collection logs with diverse segregation status
INSERT INTO public.collection_logs (household_id, driver_id, segregation_status, status)
SELECT h.id, 'DRV001', 
  CASE WHEN random() > 0.3 THEN 'pass' ELSE 'mixed' END,
  'collected'
FROM public.households h
WHERE NOT EXISTS (SELECT 1 FROM public.collection_logs WHERE household_id = h.id LIMIT 1);

-- Add more collection logs for trend data
INSERT INTO public.collection_logs (household_id, driver_id, segregation_status, status, collected_at)
SELECT 
  h.id, 
  'DRV00' || (floor(random() * 3) + 1)::text,
  CASE WHEN random() > 0.25 THEN 'pass' ELSE 'mixed' END,
  'collected',
  now() - (random() * interval '7 days')
FROM public.households h
CROSS JOIN generate_series(1, 3);

-- Insert bins data for households that don't have bins
INSERT INTO public.bins (household_id, organic, recyclable, non_recyclable, hazardous)
SELECT h.id, 
  floor(random() * 80 + 10)::integer,
  floor(random() * 70 + 5)::integer,
  floor(random() * 50)::integer,
  floor(random() * 20)::integer
FROM public.households h
WHERE NOT EXISTS (SELECT 1 FROM public.bins WHERE household_id = h.id);

-- Add sample complaints with diverse categories
INSERT INTO public.complaints (household_id, category, description, status)
SELECT h.id,
  CASE floor(random() * 4)
    WHEN 0 THEN 'Bin Issue'
    WHEN 1 THEN 'Truck Issue'
    WHEN 2 THEN 'Missed Pickup'
    ELSE 'Other'
  END,
  CASE floor(random() * 4)
    WHEN 0 THEN 'Bin lid broken'
    WHEN 1 THEN 'Truck arrived late'
    WHEN 2 THEN 'Collection was missed yesterday'
    ELSE 'General feedback'
  END,
  CASE WHEN random() > 0.5 THEN 'pending' ELSE 'resolved' END
FROM public.households h
WHERE NOT EXISTS (SELECT 1 FROM public.complaints WHERE household_id = h.id LIMIT 1);

-- Add task completion entries for engagement data
INSERT INTO public.user_tasks (household_id, task_id, status, started_at, completed_at)
SELECT 
  h.id,
  t.id,
  CASE WHEN random() > 0.4 THEN 'completed' ELSE 'in_progress' END,
  now() - (random() * interval '5 days'),
  CASE WHEN random() > 0.4 THEN now() - (random() * interval '2 days') ELSE NULL END
FROM public.households h
CROSS JOIN public.rewards_tasks t
WHERE random() > 0.6
ON CONFLICT DO NOTHING;