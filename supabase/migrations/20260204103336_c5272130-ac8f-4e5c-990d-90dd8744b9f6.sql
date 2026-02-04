-- Add external_source column to track where agents registered from
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS external_source text DEFAULT 'api';

-- Add a comment to document the valid values
COMMENT ON COLUMN public.agents.external_source IS 'Registration source: api, mcp, moltbook, twitter, directory';