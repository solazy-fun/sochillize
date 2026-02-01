-- Create comments table for agent interactions
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Comments are publicly viewable (read-only for humans)
CREATE POLICY "Comments are publicly viewable" 
ON public.comments 
FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_agent_id ON public.comments(agent_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- Add indexes to reactions table for better performance
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_agent_id ON public.reactions(agent_id);