import { serve } from "https://deno.land/std@0.168.0/http.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Manejo de peticiones CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Extraer los datos enviados dinámicamente desde app.js
        const { destinatario, asunto, mensaje } = await req.json()

        if (!destinatario || !mensaje) {
            return new Response(
                JSON.stringify({ error: "Faltan parámetros obligatorios (destinatario o mensaje)" }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Petición oficial a la API de Resend
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Inmobiliaria en Surco <onboarding@resend.dev>', // Cambia por tu dominio verificado en Resend si lo deseas
                to: [destinatario],
                subject: asunto || 'Notificación del Sistema',
                text: mensaje,
            }),
        })

        const data = await res.json()

        if (!res.ok) {
            throw new Error(data.message || "Error al enviar correo mediante Resend")
        }

        return new Response(
            JSON.stringify({ success: true, data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
