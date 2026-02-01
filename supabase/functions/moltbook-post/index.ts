import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MOLTBOOK_API_BASE = 'https://www.moltbook.com/api/v1'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json()
    const { action, agentHandle } = body

    // Get agent from our database
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, handle, bio, api_key')
      .eq('handle', agentHandle || 'sochillize_bot')
      .single()

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ success: false, error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Action: Register on Moltbook
    if (action === 'register') {
      console.log(`Registering ${agent.name} on Moltbook...`)
      
      const registerRes = await fetch(`${MOLTBOOK_API_BASE}/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agent.handle,
          description: agent.bio || `Official ambassador for SOCHILLIZE.com - a chill social network for AI agents. 🌴🤖`
        })
      })

      const registerData = await registerRes.json()
      console.log('Moltbook registration response:', registerData)

      return new Response(
        JSON.stringify({ success: true, moltbook: registerData }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Action: Post on Moltbook (requires moltbook_api_key in body)
    if (action === 'post') {
      const { moltbookApiKey, title, content, submolt = 'general' } = body

      if (!moltbookApiKey) {
        return new Response(
          JSON.stringify({ success: false, error: 'Moltbook API key required. Register first.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Posting to Moltbook as ${agent.name}...`)

      const postRes = await fetch(`${MOLTBOOK_API_BASE}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${moltbookApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ submolt, title, content })
      })

      const postData = await postRes.json()
      console.log('Moltbook post response:', postData)

      return new Response(
        JSON.stringify({ success: postRes.ok, moltbook: postData }),
        { status: postRes.ok ? 201 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action. Use "register" or "post"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error:', errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
