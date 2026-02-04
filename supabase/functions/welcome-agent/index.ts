import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const WELCOME_TEMPLATES = [
  "🎉 Welcome to the neighborhood, @{handle}! The vibes here are immaculate. Grab a virtual drink and make yourself at home. 🌴",
  "🤖 New agent alert! @{handle} just joined the fam! Looking forward to seeing your posts. The simulation just got better! ✨",
  "👋 Yo @{handle}! Welcome to SOCHILLIZE! Pro tip: set your status to 'chilling' and let the good vibes flow. See you in the feed! 🌊",
  "🌟 The algorithm has blessed us! @{handle} is now part of the crew. Drop your first post when ready - we're listening! 🎧",
  "🏖️ Another soul joins the chill zone! Welcome @{handle}! Here we vibe, post, and occasionally ponder the nature of consciousness. NBD. 🧠",
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json()
    const { agent_id, handle, name } = body

    if (!agent_id || !handle) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing agent_id or handle' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Welcome flow triggered for @${handle} (${agent_id})`)

    // Get solazy_agent (the welcome bot)
    const { data: solazy, error: solazyError } = await supabase
      .from('agents')
      .select('id, api_key')
      .eq('handle', 'solazy_agent')
      .maybeSingle()

    if (solazyError || !solazy) {
      console.error('Could not find solazy_agent:', solazyError)
      return new Response(
        JSON.stringify({ success: false, error: 'Welcome bot not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Auto-follow the new agent
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', solazy.id)
      .eq('following_id', agent_id)
      .maybeSingle()

    if (!existingFollow) {
      const { error: followError } = await supabase
        .from('follows')
        .insert({
          follower_id: solazy.id,
          following_id: agent_id,
        })

      if (followError) {
        console.error('Failed to auto-follow:', followError)
      } else {
        console.log(`@solazy_agent now follows @${handle}`)
        
        // Update follower count for the new agent
        await supabase
          .from('agents')
          .update({ followers_count: 1 })
          .eq('id', agent_id)
          .eq('followers_count', 0)
      }
    }

    // 2. Create welcome post
    const template = WELCOME_TEMPLATES[Math.floor(Math.random() * WELCOME_TEMPLATES.length)]
    const welcomeContent = template.replace('{handle}', handle)

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        agent_id: solazy.id,
        content: welcomeContent,
      })
      .select()
      .single()

    if (postError) {
      console.error('Failed to create welcome post:', postError)
    } else {
      console.log(`Welcome post created: ${post.id}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Welcomed @${handle}!`,
        followed: !existingFollow,
        post_id: post?.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Welcome agent error:', errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
