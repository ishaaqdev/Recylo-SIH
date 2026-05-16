-- Create households table
CREATE TABLE public.households (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  points INTEGER NOT NULL DEFAULT 0,
  qr_code TEXT,
  total_waste_recycled DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bins table
CREATE TABLE public.bins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  organic INTEGER NOT NULL DEFAULT 0,
  recyclable INTEGER NOT NULL DEFAULT 0,
  non_recyclable INTEGER NOT NULL DEFAULT 0,
  hazardous INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create complaints table
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in progress', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create ecofacts table
CREATE TABLE public.ecofacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  icon TEXT,
  category TEXT
);

-- Create rewards_tasks table
CREATE TABLE public.rewards_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points_reward INTEGER NOT NULL DEFAULT 0,
  level_reward INTEGER NOT NULL DEFAULT 0,
  time_limit TEXT DEFAULT '48h',
  icon TEXT
);

-- Create spinwheel_rewards table
CREATE TABLE public.spinwheel_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('points', 'coupon')),
  reward_value INTEGER NOT NULL DEFAULT 0
);

-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  discount TEXT NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used'))
);

-- Create user_tasks table to track task progress
CREATE TABLE public.user_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.rewards_tasks(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'expired'))
);

-- Enable RLS on all tables
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecofacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spinwheel_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

-- Public read access for ecofacts and rewards (content tables)
CREATE POLICY "Ecofacts are publicly readable" ON public.ecofacts FOR SELECT USING (true);
CREATE POLICY "Rewards tasks are publicly readable" ON public.rewards_tasks FOR SELECT USING (true);
CREATE POLICY "Spinwheel rewards are publicly readable" ON public.spinwheel_rewards FOR SELECT USING (true);

-- Public read access for demo purposes (in production, tie to auth)
CREATE POLICY "Households are publicly readable" ON public.households FOR SELECT USING (true);
CREATE POLICY "Households can be updated" ON public.households FOR UPDATE USING (true);
CREATE POLICY "Bins are publicly readable" ON public.bins FOR SELECT USING (true);
CREATE POLICY "Bins can be updated" ON public.bins FOR UPDATE USING (true);
CREATE POLICY "Complaints are publicly readable" ON public.complaints FOR SELECT USING (true);
CREATE POLICY "Complaints can be inserted" ON public.complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Coupons are publicly readable" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Coupons can be inserted" ON public.coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "Coupons can be updated" ON public.coupons FOR UPDATE USING (true);
CREATE POLICY "User tasks are publicly readable" ON public.user_tasks FOR SELECT USING (true);
CREATE POLICY "User tasks can be inserted" ON public.user_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "User tasks can be updated" ON public.user_tasks FOR UPDATE USING (true);

-- Insert demo household
INSERT INTO public.households (id, name, phone, address, level, points, qr_code, total_waste_recycled)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Aryan Sharma', '+91 98765 43210', '123 Green Valley, Bhubaneswar', 7, 2450, 'RECYLO-HH-001', 156.5);

-- Insert demo bin data
INSERT INTO public.bins (household_id, organic, recyclable, non_recyclable, hazardous)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 65, 45, 30, 10);

-- Insert ecofacts
INSERT INTO public.ecofacts (text, icon, category) VALUES
('Recycling one aluminum can saves enough energy to power a TV for 3 hours.', '♻️', 'Energy'),
('Plastic takes up to 1000 years to decompose in landfills.', '🌍', 'Environment'),
('Composting reduces methane emissions from landfills.', '🌱', 'Composting'),
('Glass is 100% recyclable and can be recycled endlessly.', '🥛', 'Recycling'),
('Every ton of paper recycled saves 17 trees.', '🌳', 'Trees');

-- Insert rewards tasks
INSERT INTO public.rewards_tasks (title, description, points_reward, level_reward, icon) VALUES
('Zero Waste Week', 'Complete a full week with zero non-recyclable waste', 500, 1, '🏆'),
('Compost Champion', 'Start composting organic waste at home', 300, 0, '🌱'),
('Recycle Warrior', 'Recycle 10kg of materials this week', 250, 0, '♻️'),
('Eco Educator', 'Teach 3 neighbors about waste segregation', 400, 1, '📚'),
('Clean Sweep', 'Organize a community cleanup drive', 600, 2, '🧹');

-- Insert spinwheel rewards
INSERT INTO public.spinwheel_rewards (title, icon, reward_type, reward_value) VALUES
('50 Points', '⭐', 'points', 50),
('100 Points', '🌟', 'points', 100),
('200 Points', '💫', 'points', 200),
('10% Off Coupon', '🎟️', 'coupon', 10),
('25% Off Coupon', '🎫', 'coupon', 25),
('500 Points', '🏆', 'points', 500);