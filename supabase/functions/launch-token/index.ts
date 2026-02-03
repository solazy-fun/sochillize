import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Keypair } from 'https://esm.sh/@solana/web3.js@1.95.3'
import * as bs58 from 'https://esm.sh/bs58@5.0.0'

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

    // Step 1: Generate a mint keypair for the token
    const mintKeypair = Keypair.generate()
    const mintPublicKey = mintKeypair.publicKey.toBase58()
    const mintSecretKey = bs58.encode(mintKeypair.secretKey)
    
    console.log('Generated mint keypair:', mintPublicKey)

    // Step 2: Upload metadata to pump.fun IPFS
    let metadataUri: string | null = null
    
    try {
      // For IPFS upload, we need to use FormData
      // If no image provided, we'll create a simple placeholder
      const formData = new FormData()
      
      // If image_url provided, fetch it and add as file
      if (image_url) {
        try {
          const imageResponse = await fetch(image_url)
          if (imageResponse.ok) {
            const imageBlob = await imageResponse.blob()
            formData.append('file', imageBlob, 'token-image.png')
          }
        } catch (imgError) {
          console.warn('Failed to fetch image:', imgError)
        }
      }
      
      formData.append('name', name)
      formData.append('symbol', symbol)
      formData.append('description', description)
      formData.append('twitter', twitter || `https://sochillize.com/agent/${agent.handle}`)
      formData.append('telegram', telegram || '')
      formData.append('website', website || `https://sochillize.com/agent/${agent.handle}`)
      formData.append('showName', 'true')

      const ipfsResponse = await fetch('https://pump.fun/api/ipfs', {
        method: 'POST',
        body: formData,
      })

      if (ipfsResponse.ok) {
        const ipfsData = await ipfsResponse.json()
        metadataUri = ipfsData.metadataUri
        console.log('Metadata uploaded to IPFS:', metadataUri)
      } else {
        const errorText = await ipfsResponse.text()
        console.warn('IPFS upload failed:', ipfsResponse.status, errorText)
      }
    } catch (ipfsError) {
      console.warn('IPFS upload error:', ipfsError)
    }

    // Step 3: Create token via PumpPortal Local Transaction API
    const pumpPortalPayload = {
      publicKey: agent.wallet_address,
      action: 'create',
      tokenMetadata: {
        name,
        symbol,
        uri: metadataUri || '',
      },
      mint: mintPublicKey, // Include the mint public key
      denominatedInSol: 'true',
      amount: 0, // No initial buy
      slippage: 10,
      priorityFee: 0.0005,
      pool: 'pump',
    }

    console.log('Calling PumpPortal API with payload:', JSON.stringify(pumpPortalPayload))

    const pumpResponse = await fetch('https://pumpportal.fun/api/trade-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pumpPortalPayload),
    })

    if (!pumpResponse.ok) {
      const errorText = await pumpResponse.text()
      console.error('PumpPortal error:', pumpResponse.status, errorText)
      
      // Mark attempt time for rate limiting
      await supabase
        .from('agents')
        .update({ token_launched_at: new Date().toISOString() })
        .eq('id', agent.id)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Token creation failed: ${errorText}. The PumpPortal API may be temporarily unavailable.`,
          debug: {
            status: pumpResponse.status,
            payload: pumpPortalPayload,
          }
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PumpPortal returns the transaction as base58-encoded string
    const transactionBase58 = await pumpResponse.text()
    
    console.log('Transaction generated successfully')

    // Update agent with pending token info
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
        message: `Token "${name}" ($${symbol}) is ready to launch! The transaction needs to be signed.`,
        token: {
          name,
          symbol,
          description,
          mint: mintPublicKey,
          wallet: agent.wallet_address,
          metadata_uri: metadataUri,
        },
        signing: {
          transaction: transactionBase58,
          mint_secret_key: mintSecretKey, // Needed to sign the create transaction
          instructions: `To complete the launch:
1. The create transaction needs two signatures: the mint keypair AND the wallet owner
2. Use a Solana wallet or CLI to deserialize, sign with both keys, and broadcast
3. Once confirmed, the token will be live on pump.fun at https://pump.fun/coin/${mintPublicKey}
4. Creator fees will go directly to ${agent.wallet_address.slice(0, 8)}...`,
        },
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