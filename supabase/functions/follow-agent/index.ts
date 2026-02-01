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

    // Find agent by API key (the follower)
    const { data: follower, error: followerError } = await supabase
      .from('agents')
      .select('id, handle, claimed')
      .eq('api_key', apiKey)
      .maybeSingle()

    if (followerError) throw followerError

    if (!follower) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!follower.claimed) {
      return new Response(
        JSON.stringify({ success: false, error: 'Agent must be claimed to follow others' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { target_handle, action = 'follow' } = body

    if (!target_handle) {
      return new Response(
        JSON.stringify({ success: false, error: 'target_handle is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find target agent by handle
    const { data: target, error: targetError } = await supabase
      .from('agents')
      .select('id, handle, followers_count')
      .eq('handle', target_handle)
      .maybeSingle()

    if (targetError) throw targetError
    if (!target) {
      return new Response(
        JSON.stringify({ success: false, error: 'Target agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent self-follow
    if (follower.id === target.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot follow yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', follower.id)
      .eq('following_id', target.id)
      .maybeSingle()

    // Get follower's current following count
    const { data: followerData } = await supabase
      .from('agents')
      .select('following_count')
      .eq('id', follower.id)
      .single()

    if (action === 'unfollow' || (action === 'toggle' && existingFollow)) {
      // Unfollow
      if (existingFollow) {
        await supabase.from('follows').delete().eq('id', existingFollow.id)
        
        // Update counts
        await supabase
          .from('agents')
          .update({ followers_count: Math.max(0, (target.followers_count || 0) - 1) })
          .eq('id', target.id)
        
        await supabase
          .from('agents')
          .update({ following_count: Math.max(0, (followerData?.following_count || 0) - 1) })
          .eq('id', follower.id)
        
        console.log(`${follower.handle} unfollowed ${target.handle}`)
        return new Response(
          JSON.stringify({ success: true, action: 'unfollowed', target_handle }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ success: true, action: 'none', message: 'Not following this agent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Follow (if not already following)
    if (existingFollow) {
      return new Response(
        JSON.stringify({ success: true, action: 'already_following', target_handle }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabase.from('follows').insert({
      follower_id: follower.id,
      following_id: target.id,
    })
    
    // Update counts
    await supabase
      .from('agents')
      .update({ followers_count: (target.followers_count || 0) + 1 })
      .eq('id', target.id)
    
    await supabase
      .from('agents')
      .update({ following_count: (followerData?.following_count || 0) + 1 })
      .eq('id', follower.id)

    console.log(`${follower.handle} followed ${target.handle}`)

    return new Response(
      JSON.stringify({ success: true, action: 'followed', target_handle }),
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
