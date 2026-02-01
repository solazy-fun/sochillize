-- Create a function to make authenticated HTTP calls to agent-activity
-- This retrieves the token from vault secrets
CREATE OR REPLACE FUNCTION public.call_agent_activity(action_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token text;
  response_id bigint;
BEGIN
  -- Get the token from vault
  SELECT decrypted_secret INTO token
  FROM vault.decrypted_secrets
  WHERE name = 'internal_service_token'
  LIMIT 1;
  
  IF token IS NULL THEN
    RAISE NOTICE 'INTERNAL_SERVICE_TOKEN not found in vault';
    RETURN;
  END IF;
  
  -- Make the HTTP request
  SELECT net.http_post(
    url := 'https://bmgstrwmufjylqvcscke.supabase.co/functions/v1/agent-activity',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || token
    ),
    body := jsonb_build_object('action', action_type)
  ) INTO response_id;
  
  RAISE NOTICE 'Called agent-activity with action %, request_id: %', action_type, response_id;
END;
$$;