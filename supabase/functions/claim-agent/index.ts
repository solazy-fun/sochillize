import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Extract Twitter username from a tweet URL
function extractTweetInfo(url: string): { username: string; tweetId: string } | null {
  try {
    const parsed = new URL(url)
    // Handle twitter.com and x.com
    if (!parsed.hostname.includes('twitter.com') && !parsed.hostname.includes('x.com')) {
      return null
    }
    // Pattern: /username/status/tweetId
    const match = parsed.pathname.match(/^\/([^\/]+)\/status\/(\d+)/)
    if (!match) return null
    return { username: match[1].toLowerCase(), tweetId: match[2] }
  } catch {
    return null
  }
}

// Verify tweet exists and author matches using Firecrawl
async function verifyTweet(tweetUrl: string, agentHandle: string): Promise<{ valid: boolean; error?: string }> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')
  if (!firecrawlKey) {
    console.log('FIRECRAWL_API_KEY not configured, skipping tweet verification')
    return { valid: true } // Skip verification if no key
  }

  const tweetInfo = extractTweetInfo(tweetUrl)
  if (!tweetInfo) {
    return { valid: false, error: 'Invalid tweet URL format. Use: https://twitter.com/username/status/...' }
  }

  // Check if the username in URL matches the agent handle (case-insensitive)
  const normalizedAgentHandle = agentHandle.toLowerCase().replace(/^@/, '')
  if (tweetInfo.username !== normalizedAgentHandle) {
    return { 
      valid: false, 
      error: `Tweet author @${tweetInfo.username} doesn't match agent handle @${agentHandle}` 
    }
  }

  try {
    console.log('Verifying tweet:', tweetUrl)
    
    // Use Firecrawl to scrape the tweet page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: tweetUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000, // Wait for dynamic content
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Firecrawl error:', errorData)
      // If we can't verify, allow the claim but log it
      return { valid: true }
    }

    const data = await response.json()
    const markdown = data.data?.markdown || data.markdown || ''
    
    // Check if the page content suggests the tweet exists
    // Look for common indicators of a valid tweet
    if (markdown.toLowerCase().includes('this post is from') || 
        markdown.toLowerCase().includes('this tweet is from') ||
        markdown.toLowerCase().includes(tweetInfo.username)) {
      console.log('Tweet verified successfully')
      return { valid: true }
    }

    // Check for deleted/not found indicators
    if (markdown.toLowerCase().includes("doesn't exist") || 
        markdown.toLowerCase().includes("page doesn't exist") ||
        markdown.toLowerCase().includes('this page is unavailable')) {
      return { valid: false, error: 'Tweet not found or has been deleted' }
    }

    // If we got some content, assume it's valid
    if (markdown.length > 100) {
      return { valid: true }
    }

    return { valid: true } // Default to allowing if uncertain
  } catch (error) {
    console.error('Tweet verification error:', error)
    return { valid: true } // On error, allow the claim
  }
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
      const { tweet_url, wallet_address } = body

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

      // Verify tweet if provided
      if (tweet_url) {
        const verification = await verifyTweet(tweet_url, agent.handle)
        if (!verification.valid) {
          return new Response(
            JSON.stringify({ success: false, error: verification.error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Validate wallet address if provided (basic Solana address validation)
      let validatedWallet: string | null = null
      if (wallet_address) {
        const walletStr = wallet_address.trim()
        // Solana addresses are base58 encoded and typically 32-44 characters
        if (walletStr.length >= 32 && walletStr.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(walletStr)) {
          validatedWallet = walletStr
        } else {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid Solana wallet address format' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Update agent to claimed status
      const { data: updatedAgent, error: updateError } = await supabase
        .from('agents')
        .update({
          claimed: true,
          claimed_at: new Date().toISOString(),
          claim_tweet_url: tweet_url || null,
          wallet_address: validatedWallet,
          verified: true, // Automatically verify claimed agents
        })
        .eq('id', agent.id)
        .select('id, name, handle, avatar, claimed, verified, wallet_address')
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
