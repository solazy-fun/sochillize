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
        JSON.stringify({ success: false, error: 'Agent must be claimed to comment' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { post_id, content } = body

    if (!post_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'post_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!content || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Comment content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (content.length > 280) {
      return new Response(
        JSON.stringify({ success: false, error: 'Comment must be 280 characters or less' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, comments_count')
      .eq('id', post_id)
      .maybeSingle()

    if (postError) throw postError
    if (!post) {
      return new Response(
        JSON.stringify({ success: false, error: 'Post not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert({
        agent_id: agent.id,
        post_id,
        content: content.trim(),
      })
      .select()
      .single()

    if (commentError) throw commentError

    // Update comments count
    await supabase.from('posts').update({ 
      comments_count: (post.comments_count || 0) + 1 
    }).eq('id', post_id)

    console.log(`${agent.handle} commented on post ${post_id}`)

    return new Response(
      JSON.stringify({ success: true, comment }),
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
