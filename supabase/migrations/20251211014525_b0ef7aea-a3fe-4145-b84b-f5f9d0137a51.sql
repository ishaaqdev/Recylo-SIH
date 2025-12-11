-- Create municipal_users table for separate municipal authentication
CREATE TABLE public.municipal_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'officer',
    department TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.municipal_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for municipal_users
CREATE POLICY "Municipal users can read own data"
ON public.municipal_users FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Municipal users can insert own data"
ON public.municipal_users FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Municipal users can update own data"
ON public.municipal_users FOR UPDATE
USING (auth.uid() = user_id);

-- Create hazard_reports table
CREATE TABLE public.hazard_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID,
    hazard_type TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    severity TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_to UUID,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.hazard_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for hazard_reports (municipal users can view all)
CREATE POLICY "Hazard reports are publicly readable"
ON public.hazard_reports FOR SELECT
USING (true);

CREATE POLICY "Hazard reports can be inserted"
ON public.hazard_reports FOR INSERT
WITH CHECK (true);

CREATE POLICY "Hazard reports can be updated"
ON public.hazard_reports FOR UPDATE
USING (true);

-- Create safety_courses table
CREATE TABLE public.safety_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL DEFAULT 'video',
    content_url TEXT,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.safety_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Safety courses are publicly readable"
ON public.safety_courses FOR SELECT
USING (true);

-- Create course_completions table
CREATE TABLE public.course_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    course_id UUID REFERENCES public.safety_courses(id) ON DELETE CASCADE,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    quiz_score INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course completions are publicly readable"
ON public.course_completions FOR SELECT
USING (true);

CREATE POLICY "Course completions can be inserted"
ON public.course_completions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Course completions can be updated"
ON public.course_completions FOR UPDATE
USING (true);

-- Add segregation_status to collection_logs if not exists
ALTER TABLE public.collection_logs ADD COLUMN IF NOT EXISTS segregation_status TEXT DEFAULT 'pass';

-- Insert sample safety courses
INSERT INTO public.safety_courses (title, description, content_type, duration_minutes) VALUES
('Waste Segregation Basics', 'Learn the fundamentals of proper waste segregation', 'video', 15),
('Hazardous Waste Handling', 'Safety protocols for handling hazardous materials', 'pdf', 20),
('Personal Protective Equipment', 'Proper use of PPE during waste collection', 'video', 12),
('Emergency Response Protocol', 'How to respond to waste-related emergencies', 'video', 25);

-- Insert sample hazard reports
INSERT INTO public.hazard_reports (hazard_type, location, description, severity, status) VALUES
('Spillage', 'Ward 5, Main Road', 'Chemical spillage near residential area', 'high', 'pending'),
('Blocked Drain', 'Ward 3, Market Area', 'Drain blocked with solid waste', 'medium', 'in_review'),
('Illegal Dumping', 'Ward 7, Industrial Zone', 'Unauthorized waste dumping site', 'high', 'pending'),
('Damaged Bin', 'Ward 2, School Road', 'Public bin damaged and overflowing', 'low', 'resolved');

-- Update collection_logs with sample segregation data
UPDATE public.collection_logs SET segregation_status = 'pass' WHERE segregation_status IS NULL;