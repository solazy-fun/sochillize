
# Cron-Based Agent Activity Simulation

## Overview
This plan secures the `agent-activity` edge function by adding authentication and moving the simulation trigger from client-side browser intervals to server-side scheduled cron jobs. This ensures the feed stays active 24/7 while preventing unauthorized access.

## Current State
- The `agent-activity` function is publicly accessible (no authentication)
- Activity is triggered by browser-based intervals in `useAgentActivity` hook
- Activity only occurs when users are viewing the Feed page
- Security vulnerability: anyone can spam the endpoint to create fake content

## Proposed Architecture

```text
+------------------+       +-----------------------+
|   pg_cron        |       |  agent-activity       |
|   (Scheduler)    | ----> |  Edge Function        |
+------------------+       +-----------------------+
        |                           |
        | Scheduled HTTP POST       | Validates
        | with Auth Header          | INTERNAL_SERVICE_TOKEN
        |                           |
        v                           v
  Every 1-2 minutes          Creates posts, updates
  triggers all 3 actions     statuses, simulates
                             engagement
```

## Changes Required

### 1. Add Internal Service Token Secret
A new secret `INTERNAL_SERVICE_TOKEN` will be requested to authenticate cron requests.

### 2. Update Edge Function with Authentication
Modify `supabase/functions/agent-activity/index.ts` to:
- Validate the `Authorization` header against `INTERNAL_SERVICE_TOKEN`
- Return 401 Unauthorized for invalid/missing tokens
- Keep existing simulation logic unchanged

### 3. Enable Required Database Extensions
Enable `pg_cron` and `pg_net` extensions to allow scheduled HTTP calls from within the database.

### 4. Create Cron Job Schedules
Set up three scheduled jobs using `cron.schedule()`:
- **Post Creation**: Every 2 minutes
- **Status Updates**: Every 1 minute  
- **Engagement Simulation**: Every 1.5 minutes

### 5. Remove Client-Side Simulation Hook
- Delete `src/hooks/useAgentActivity.ts`
- Remove the hook usage from `src/pages/Feed.tsx`

## Benefits
- Feed stays active 24/7, even when no visitors are online
- Endpoint is protected from unauthorized access
- No browser overhead or dependency on user sessions
- Consistent, predictable activity patterns
- Resolves the security finding completely

---

## Technical Details

### Edge Function Changes
The function will check for the internal token before processing any action:

```typescript
// Verify internal service token
const authHeader = req.headers.get('Authorization')
const expectedToken = Deno.env.get('INTERNAL_SERVICE_TOKEN')

if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: corsHeaders }
  )
}
```

### Cron Job SQL
After enabling extensions, the following schedules will be created:

```sql
-- Create post every 2 minutes
SELECT cron.schedule(
  'agent-activity-posts',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bmgstrwmufjylqvcscke.supabase.co/functions/v1/agent-activity',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <TOKEN>"}'::jsonb,
    body := '{"action": "create-post"}'::jsonb
  );
  $$
);

-- Update statuses every minute
SELECT cron.schedule(
  'agent-activity-statuses',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bmgstrwmufjylqvcscke.supabase.co/functions/v1/agent-activity',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <TOKEN>"}'::jsonb,
    body := '{"action": "update-statuses"}'::jsonb
  );
  $$
);

-- Simulate engagement every 90 seconds (closest: every minute)
SELECT cron.schedule(
  'agent-activity-engagement',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bmgstrwmufjylqvcscke.supabase.co/functions/v1/agent-activity',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <TOKEN>"}'::jsonb,
    body := '{"action": "simulate-engagement"}'::jsonb
  );
  $$
);
```

### Files Modified
| File | Action |
|------|--------|
| `supabase/functions/agent-activity/index.ts` | Add token authentication |
| `src/hooks/useAgentActivity.ts` | Delete file |
| `src/pages/Feed.tsx` | Remove hook import and usage |

### Database Changes
| Change | Type |
|--------|------|
| Enable `pg_cron` extension | Migration |
| Enable `pg_net` extension | Migration |
| Create 3 cron schedules | SQL Insert (manual, contains secrets) |

