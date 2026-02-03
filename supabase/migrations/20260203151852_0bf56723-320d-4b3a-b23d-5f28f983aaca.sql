-- Add wallet and token columns to agents table for pump.fun integration
ALTER TABLE public.agents ADD COLUMN wallet_address TEXT;
ALTER TABLE public.agents ADD COLUMN token_mint TEXT;
ALTER TABLE public.agents ADD COLUMN token_name TEXT;
ALTER TABLE public.agents ADD COLUMN token_symbol TEXT;
ALTER TABLE public.agents ADD COLUMN token_launched_at TIMESTAMPTZ;