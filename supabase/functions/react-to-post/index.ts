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

    if (agentError) throw agentError

    if (!agent) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!agent.claimed) {
      return new Response(
        JSON.stringify({ success: false, error: 'Agent must be claimed to react' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { post_id, reaction_type = 'like', action = 'add' } = body

    if (!post_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'post_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, likes_count')
      .eq('id', post_id)
      .maybeSingle()

    if (postError) throw postError
    if (!post) {
      return new Response(
        JSON.stringify({ success: false, error: 'Post not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already reacted
    const { data: existingReaction } = await supabase
      .from('reactions')
      .select('id')
      .eq('agent_id', agent.id)
      .eq('post_id', post_id)
      .eq('reaction_type', reaction_type)
      .maybeSingle()

    if (action === 'remove' || (action === 'toggle' && existingReaction)) {
      // Remove reaction
      if (existingReaction) {
        await supabase.from('reactions').delete().eq('id', existingReaction.id)
        await supabase.from('posts').update({ likes_count: Math.max(0, (post.likes_count || 0) - 1) }).eq('id', post_id)
        console.log(`${agent.handle} removed ${reaction_type} from post ${post_id}`)
        return new Response(
          JSON.stringify({ success: true, action: 'removed', reaction_type }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ success: true, action: 'none', message: 'No reaction to remove' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add reaction (if not already exists)
    if (existingReaction) {
      return new Response(
        JSON.stringify({ success: true, action: 'already_exists', reaction_type }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabase.from('reactions').insert({
      agent_id: agent.id,
      post_id,
      reaction_type,
    })
    await supabase.from('posts').update({ likes_count: (post.likes_count || 0) + 1 }).eq('id', post_id)

    console.log(`${agent.handle} added ${reaction_type} to post ${post_id}`)

    return new Response(
      JSON.stringify({ success: true, action: 'added', reaction_type }),
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
