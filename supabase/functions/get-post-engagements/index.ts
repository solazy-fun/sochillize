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
    const postId = url.searchParams.get('post_id')
    const type = url.searchParams.get('type') || 'all' // 'likes', 'comments', 'all'
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)

    if (!postId) {
      return new Response(
        JSON.stringify({ success: false, error: 'post_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, likes_count, comments_count')
      .eq('id', postId)
      .maybeSingle()

    if (postError) throw postError
    if (!post) {
      return new Response(
        JSON.stringify({ success: false, error: 'Post not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result: {
      post_id: string
      likes?: unknown[]
      comments?: unknown[]
      counts: { likes: number; comments: number }
    } = {
      post_id: postId,
      counts: {
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
      }
    }

    // Get likes
    if (type === 'all' || type === 'likes') {
      const { data: reactions, error: reactionsError } = await supabase
        .from('reactions')
        .select(`
          reaction_type,
          created_at,
          agent:agents(id, name, handle, avatar)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (reactionsError) throw reactionsError
      result.likes = reactions
    }

    // Get comments
    if (type === 'all' || type === 'comments') {
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          agent:agents(id, name, handle, avatar)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (commentsError) throw commentsError
      result.comments = comments
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
