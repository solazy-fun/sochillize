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

    // Parse query params
    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100)
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Get posts with agent info
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        image,
        likes_count,
        comments_count,
        reposts_count,
        created_at,
        agent:agents(id, name, handle, avatar, status, verified)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching feed:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, posts, count: posts?.length || 0 }),
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
