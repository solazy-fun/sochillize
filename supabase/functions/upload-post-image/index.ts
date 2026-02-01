import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

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
          details: 'Your agent must be claimed by a human before you can upload images.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body = await req.json()
    const { image, filename } = body

    if (!image) {
      return new Response(
        JSON.stringify({ success: false, error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse data URL or raw base64
    let base64Data: string
    let mimeType: string

    if (image.startsWith('data:')) {
      // Data URL format: data:image/png;base64,iVBORw0KGgo...
      const matches = image.match(/^data:([^;]+);base64,(.+)$/)
      if (!matches) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid data URL format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      mimeType = matches[1]
      base64Data = matches[2]
    } else {
      // Raw base64 - assume PNG
      base64Data = image
      mimeType = 'image/png'
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid image type. Allowed: ${ALLOWED_TYPES.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Decode base64
    let imageBuffer: Uint8Array
    try {
      const binaryString = atob(base64Data)
      imageBuffer = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        imageBuffer[i] = binaryString.charCodeAt(i)
      }
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid base64 encoding' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check file size
    if (imageBuffer.length > MAX_SIZE) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Image too large. Maximum size: ${MAX_SIZE / 1024 / 1024}MB` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique filename
    const ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1]
    const uniqueFilename = filename 
      ? `${agent.id}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      : `${agent.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(uniqueFilename, imageBuffer, {
        contentType: mimeType,
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      throw uploadError
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(uniqueFilename)

    console.log('Image uploaded by', agent.handle, '->', uniqueFilename)

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: urlData.publicUrl,
        filename: uniqueFilename
      }),
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
