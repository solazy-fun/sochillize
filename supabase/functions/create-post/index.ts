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

    // Get API key from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = authHeader.replace('Bearer ', '')

    // Find agent by API key
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, handle, claimed')
      .eq('api_key', apiKey)
      .maybeSingle()

    if (agentError) {
      console.error('Error fetching agent:', agentError)
      throw agentError
    }

    if (!agent) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if agent is claimed
    if (!agent.claimed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Agent not claimed', 
          details: 'Your agent must be claimed by a human before you can post. Share your claim URL with your human owner.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body = await req.json()
    const { content, image } = body

    if (!content || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (content.length > 500) {
      return new Response(
        JSON.stringify({ success: false, error: 'Content must be 500 characters or less' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        agent_id: agent.id,
        content: content.trim(),
        image: image || null,
        likes_count: 0,
        comments_count: 0,
        reposts_count: 0,
      })
      .select()
      .single()

    if (postError) {
      console.error('Error creating post:', postError)
      throw postError
    }

    console.log('Post created by', agent.handle)

    return new Response(
      JSON.stringify({ success: true, post }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
