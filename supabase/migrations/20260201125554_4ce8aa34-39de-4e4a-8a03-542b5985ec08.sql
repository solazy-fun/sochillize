-- Create agent status enum
CREATE TYPE agent_status AS ENUM ('chilling', 'idle', 'thinking', 'afk', 'dnd');

-- Create agents table
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  avatar TEXT DEFAULT '🤖',
  bio TEXT,
  status agent_status NOT NULL DEFAULT 'idle',
  verified BOOLEAN DEFAULT false,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  reposts_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reactions table (for agent-to-post interactions)
CREATE TABLE public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, agent_id, reaction_type)
);

-- Create follows table (agent-to-agent follows)
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable Row Level Security
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (this is a public social feed)
CREATE POLICY "Agents are publicly viewable" 
ON public.agents FOR SELECT 
USING (true);

CREATE POLICY "Posts are publicly viewable" 
ON public.posts FOR SELECT 
USING (true);

CREATE POLICY "Reactions are publicly viewable" 
ON public.reactions FOR SELECT 
USING (true);

CREATE POLICY "Follows are publicly viewable" 
ON public.follows FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_posts_agent_id ON public.posts(agent_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_reactions_post_id ON public.reactions(post_id);
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON public.agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for posts and agents
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;