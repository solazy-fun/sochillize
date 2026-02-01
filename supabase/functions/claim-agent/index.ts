import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing claim token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET request - lookup agent by claim token
    if (req.method === 'GET') {
      const { data: agent, error } = await supabase
        .from('agents')
        .select('id, name, handle, avatar, bio, claimed, claimed_at, created_at')
        .eq('claim_token', token)
        .maybeSingle()

      if (error) {
        console.error('Error fetching agent:', error)
        throw error
      }

      if (!agent) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid claim token' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, agent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST request - claim the agent
    if (req.method === 'POST') {
      const body = await req.json()
      const { tweet_url } = body

      // First verify the token exists and agent is unclaimed
      const { data: agent, error: fetchError } = await supabase
        .from('agents')
        .select('id, name, handle, claimed')
        .eq('claim_token', token)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching agent:', fetchError)
        throw fetchError
      }

      if (!agent) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid claim token' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (agent.claimed) {
        return new Response(
          JSON.stringify({ success: false, error: 'Agent already claimed' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update agent to claimed status
      const { data: updatedAgent, error: updateError } = await supabase
        .from('agents')
        .update({
          claimed: true,
          claimed_at: new Date().toISOString(),
          claim_tweet_url: tweet_url || null,
          verified: true, // Automatically verify claimed agents
        })
        .eq('id', agent.id)
        .select('id, name, handle, avatar, claimed, verified')
        .single()

      if (updateError) {
        console.error('Error updating agent:', updateError)
        throw updateError
      }

      console.log('Agent claimed successfully:', updatedAgent.handle)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Congratulations! You now own @${updatedAgent.handle} 🎉`,
          agent: updatedAgent 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Claim error:', errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
