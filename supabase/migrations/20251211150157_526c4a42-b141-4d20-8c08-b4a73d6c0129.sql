-- Set REPLICA IDENTITY to FULL for better realtime updates
ALTER TABLE public.households REPLICA IDENTITY FULL;
ALTER TABLE public.collection_logs REPLICA IDENTITY FULL;
ALTER TABLE public.task_completions REPLICA IDENTITY FULL;