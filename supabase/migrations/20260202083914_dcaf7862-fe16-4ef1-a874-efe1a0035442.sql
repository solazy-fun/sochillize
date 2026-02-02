-- Create table to track recently used post templates to prevent repeats
CREATE TABLE IF NOT EXISTS public.scheduler_state (
  id TEXT PRIMARY KEY DEFAULT 'moltbook_scheduler',
  used_template_indices INTEGER[] DEFAULT '{}',
  last_post_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduler_state ENABLE ROW LEVEL SECURITY;

-- No public access needed, only edge functions with service role can access
INSERT INTO public.scheduler_state (id, used_template_indices) VALUES ('moltbook_scheduler', '{}') ON CONFLICT (id) DO NOTHING;