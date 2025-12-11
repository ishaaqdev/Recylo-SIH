-- Create task_completions table to track verified task completions with driver info
CREATE TABLE public.task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.rewards_tasks(id),
  household_id UUID REFERENCES public.households(id),
  driver_id UUID REFERENCES public.drivers(id),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  level_awarded INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Task completions are publicly readable" 
  ON public.task_completions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Task completions can be inserted" 
  ON public.task_completions 
  FOR INSERT 
  WITH CHECK (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.households;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collection_logs;