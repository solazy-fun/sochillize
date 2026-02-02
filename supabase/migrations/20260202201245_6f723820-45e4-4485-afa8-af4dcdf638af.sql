-- Add content hash column to posts for deduplication
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create index for fast hash lookups
CREATE INDEX IF NOT EXISTS idx_posts_content_hash ON public.posts (content_hash);

-- Create a table to track used images to prevent reuse
CREATE TABLE IF NOT EXISTS public.used_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agent_id UUID REFERENCES public.agents(id)
);

-- Enable RLS
ALTER TABLE public.used_images ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Used images are publicly viewable" 
ON public.used_images 
FOR SELECT 
USING (true);

-- Create index for recent lookups
CREATE INDEX IF NOT EXISTS idx_used_images_recent ON public.used_images (used_at DESC);
CREATE INDEX IF NOT EXISTS idx_used_images_url ON public.used_images (image_url);