import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de peticiones CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { destinatario, asunto, mensaje } = await req.json()

    if (!destinatario || !asunto || !mensaje) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos (destinatario, asunto, mensaje)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Petición al servicio de correo Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Inmobiliaria <onboarding@resend.dev>', // O tu dominio verificado en Resend
        to: [destinatario],
        subject: asunto,
        text: mensaje,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Error al enviar el correo a través de Resend')
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
