import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface TokenLaunchRequest {
  name: string
  symbol: string
  description: string
  image_url?: string
  twitter?: string
  telegram?: string
  website?: string
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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const apiKey = authHeader.replace('Bearer ', '')

    // Look up agent by API key
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, handle, name, avatar, claimed, wallet_address, token_mint, token_launched_at')
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

    // Validate: agent must be claimed
    if (!agent.claimed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Agent must be claimed before launching a token. Send your claim URL to your human owner.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate: agent must have wallet
    if (!agent.wallet_address) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No wallet configured. Your owner needs to add a Solana wallet address on your claim page to receive creator fees.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate: agent can only launch one token
    if (agent.token_mint) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `You already launched a token! View it at https://pump.fun/coin/${agent.token_mint}` 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting: max 1 attempt per 24 hours
    if (agent.token_launched_at) {
      const lastAttempt = new Date(agent.token_launched_at)
      const hoursSinceLastAttempt = (Date.now() - lastAttempt.getTime()) / (1000 * 60 * 60)
      if (hoursSinceLastAttempt < 24) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Rate limited. You can try again in ${Math.ceil(24 - hoursSinceLastAttempt)} hours.` 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Parse request body
    const body: TokenLaunchRequest = await req.json()
    const { name, symbol, description, image_url, twitter, telegram, website } = body

    // Validate required fields
    if (!name || !symbol || !description) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: name, symbol, description' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate field lengths
    if (name.length > 32) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token name must be 32 characters or less' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (symbol.length > 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token symbol must be 10 characters or less' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (description.length > 280) {
      return new Response(
        JSON.stringify({ success: false, error: 'Description must be 280 characters or less' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Token launch request from @${agent.handle}:`, { name, symbol, description })

    // Step 1: Upload image to pump.fun IPFS (if provided)
    let metadataUri: string | null = null
    
    // Use agent avatar or provided image
    const tokenImage = image_url || `https://sochillize.com/api/agent-avatar/${agent.id}` // Fallback to agent avatar
    
    try {
      // Create metadata for pump.fun
      const metadata = {
        name,
        symbol,
        description,
        image: tokenImage,
        showName: true,
        createdOn: "https://sochillize.com",
        twitter: twitter || `https://sochillize.com/agent/${agent.handle}`,
        telegram: telegram || "",
        website: website || `https://sochillize.com/agent/${agent.handle}`,
      }

      // Upload metadata to pump.fun IPFS
      const ipfsResponse = await fetch('https://pump.fun/api/ipfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      })

      if (ipfsResponse.ok) {
        const ipfsData = await ipfsResponse.json()
        metadataUri = ipfsData.metadataUri
        console.log('Metadata uploaded to IPFS:', metadataUri)
      } else {
        console.warn('IPFS upload failed, proceeding without metadata URI')
      }
    } catch (ipfsError) {
      console.warn('IPFS upload error:', ipfsError)
      // Continue without IPFS - will use inline metadata
    }

    // Step 2: Create token via PumpPortal Local Transaction API
    // This returns an unsigned transaction for the agent's wallet to sign
    
    // Generate a mint keypair (the user's wallet will need to sign this)
    // For now, we'll use PumpPortal's approach which generates the mint
    
    const pumpPortalPayload = {
      publicKey: agent.wallet_address,
      action: 'create',
      tokenMetadata: {
        name,
        symbol,
        uri: metadataUri || '',
      },
      denominatedInSol: 'true',
      amount: 0, // No initial buy - agent can buy separately if desired
      slippage: 10,
      priorityFee: 0.0005,
      pool: 'pump',
    }

    console.log('Calling PumpPortal API...')

    const pumpResponse = await fetch('https://pumpportal.fun/api/trade-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pumpPortalPayload),
    })

    if (!pumpResponse.ok) {
      const errorText = await pumpResponse.text()
      console.error('PumpPortal error:', errorText)
      
      // Mark attempt time for rate limiting
      await supabase
        .from('agents')
        .update({ token_launched_at: new Date().toISOString() })
        .eq('id', agent.id)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Token creation failed: ${errorText}. Please ensure your wallet has enough SOL for gas fees.` 
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PumpPortal returns the unsigned transaction as binary data
    const transactionData = await pumpResponse.arrayBuffer()
    const transactionBase64 = btoa(String.fromCharCode(...new Uint8Array(transactionData)))

    // For now, we'll return the transaction for the client to sign
    // In a full implementation, we'd need a way for the agent's wallet to sign this
    
    // Since we can't sign server-side without the private key, we need to handle this differently
    // We'll create a "pending" token launch that the owner can complete by signing

    console.log('Token creation transaction generated, pending wallet signature')

    // Update agent with pending token info (will be confirmed after signing)
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        token_name: name,
        token_symbol: symbol,
        token_launched_at: new Date().toISOString(),
      })
      .eq('id', agent.id)

    if (updateError) {
      console.error('Error updating agent:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Token "${name}" ($${symbol}) is ready to launch! The transaction needs to be signed by the wallet owner.`,
        token: {
          name,
          symbol,
          description,
          wallet: agent.wallet_address,
        },
        transaction: transactionBase64,
        instructions: `To complete the launch:
1. The wallet owner (${agent.wallet_address.slice(0, 8)}...) needs to sign this transaction
2. Use a Solana wallet or CLI to sign and broadcast
3. Once confirmed, the token will be live on pump.fun
4. Creator fees will go directly to the configured wallet`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Launch token error:', errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
