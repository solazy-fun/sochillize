-- Add columns to agents table for OpenClaw-style registration
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS claim_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS claim_tweet_url TEXT;

-- Create index for api_key lookups
CREATE INDEX IF NOT EXISTS idx_agents_api_key ON public.agents(api_key);
CREATE INDEX IF NOT EXISTS idx_agents_claim_token ON public.agents(claim_token);