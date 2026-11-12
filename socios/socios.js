/* jshint esversion: 11 */

const SUPABASE_URL = 'https://supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uNtOayIxxDaxozSL4uA7Qw_j8adfYS1';

// Correo de tu equipo comercial que recibirá alerta cada vez que postule un nuevo socio
const CORREO_ALERTA_ADMIN = 'orlandopena11@yahoo.com';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PERFILES_SOCIOS = [
    {
        id: 'agente',
        titulo: 'Soy un agente o corredor',
        descripcion: 'Recibe prospectos calificados y gestiona tu cartera de propiedades en venta y alquiler.',
        imagen: 'https://unsplash.com',
        camposExtra: [
            { name: 'licencia', label: 'Código de Agente Inmobiliario (MVCS)', type: 'text', required: true, placeholder: 'Ej. PN-12345' },
            { name: 'especialidad', label: 'Especialidad', type: 'select', options: ['Residencial', 'Comercial', 'Terrenos', 'Lujo'], required: true },
            { name: 'zona_servicio', label: 'Distritos donde operas', type: 'text', required: true, placeholder: 'Ej. Surco, Miraflores, San Borja' }
        ]
    },
    {
        id: 'propietario_venta',
        titulo: 'Propietario que quiere vender',
        descripcion: 'Publica tu inmueble directamente y conéctate con compradores interesados en la zona.',
        imagen: 'https://unsplash.com',
        camposExtra: []
    },
    {
        id: 'propietario_alquiler',
        titulo: 'Propietario que quiere alquilar',
        descripcion: 'Oferta tus propiedades en alquiler y gestiona tus solicitudes de visita.',
        imagen: 'https://unsplash.com',
        camposExtra: []
    },
    {
        id: 'constructor',
        titulo: 'Soy un constructor / Inmobiliaria',
        descripcion: 'Promociona tus proyectos inmobiliarios en planos, construcción o entrega inmediata.',
        imagen: 'https://unsplash.com',
        camposExtra: [
            { name: 'nombre_empresa', label: 'Razón Social / Constructora', type: 'text', required: true, placeholder: 'Ej. Constructora Surco S.A.C.' },
            { name: 'ciudad', label: 'Ciudad principal', type: 'text', required: true, placeholder: 'Lima' },
            { name: 'sitio_web', label: 'Sitio Web Corporativo', type: 'url', required: false, placeholder: 'https://...' }
        ]
    },
    {
        id: 'prestamista',
        titulo: 'Soy prestamista o entidad financiera',
        descripcion: 'Ofrece alternativas de crédito hipotecario a clientes que simulan su compra en el portal.',
        imagen: 'https://unsplash.com',
        camposExtra: [
            { name: 'nombre_empresa', label: 'Nombre de la Entidad Financiera', type: 'text', required: true, placeholder: 'Ej. Banco / Financiera' },
            { name: 'ciudad', label: 'Ciudad / Sede', type: 'text', required: true, placeholder: 'Lima' },
            { name: 'sitio_web', label: 'Sitio Web', type: 'url', required: false, placeholder: 'https://...' }
        ]
    },
    {
        id: 'anunciante',
        titulo: 'Soy una marca o anunciante local',
        descripcion: 'Posiciona tus servicios de mudanza, arquitectura, diseño interior o seguros.',
        imagen: 'https://unsplash.com',
        camposExtra: [
            { name: 'nombre_empresa', label: 'Nombre Comercial de la Marca', type: 'text', required: true, placeholder: 'Ej. Mudanzas Express Perú' },
            { name: 'ciudad', label: 'Ciudad', type: 'text', required: true, placeholder: 'Lima' },
            { name: 'sitio_web', label: 'Sitio Web o Red Social', type: 'url', required: false, placeholder: 'https://...' }
        ]
    }
];

document.addEventListener('DOMContentLoaded', () => {
    renderizarTarjetas();
    configurarEventosModal();
});

function renderizarTarjetas() {
    const grid = document.getElementById('grid-tarjetas-socios');
    if (!grid) return;

    grid.innerHTML = PERFILES_SOCIOS.map(perfil => `
        <article class="partner-card">
            <img src="${perfil.imagen}" alt="${perfil.titulo}" class="partner-card-img" loading="lazy">
            <div class="partner-card-body">
                <div>
                    <h3>${perfil.titulo}</h3>
                    <p>${perfil.descripcion}</p>
                </div>
                <button type="button" class="btn-empezar-socio" data-perfil-id="${perfil.id}">
                    ¡Empieza!
                </button>
            </div>
        </article>
    `).join('');

    grid.addEventListener('click', (e) => {
        const boton = e.target.closest('.btn-empezar-socio');
        if (!boton) return;
        abrirModalSocio(boton.getAttribute('data-perfil-id'));
    });
}

function configurarEventosModal() {
    const modal = document.getElementById('modal-registro-socio');
    const btnCerrar = document.getElementById('btn-cerrar-modal-socio');
    const form = document.getElementById('form-registro-socio');

    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModalSocio);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModalSocio();
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarNuevoSocio(form);
        });
    }
}

function abrirModalSocio(perfilId) {
    const perfil = PERFILES_SOCIOS.find(p => p.id === perfilId);
    if (!perfil) return;

    document.getElementById('modal-socio-titulo').textContent = perfil.titulo;
    document.getElementById('modal-socio-subtitulo').textContent = perfil.descripcion;
    document.getElementById('input-socio-tipo').value = perfil.id;

    const contenedorDinamico = document.getElementById('contenedor-campos-dinamicos');
    contenedorDinamico.innerHTML = perfil.camposExtra.map(campo => {
        if (campo.type === 'select') {
            const opciones = campo.options.map(op => `<option value="${op}">${op}</option>`).join('');
            return `
                <div class="form-group">
                    <label>${campo.label} ${campo.required ? '*' : ''}</label>
                    <select name="${campo.name}" ${campo.required ? 'required' : ''}>${opciones}</select>
                </div>
            `;
        }
        return `
            <div class="form-group">
                <label>${campo.label} ${campo.required ? '*' : ''}</label>
                <input type="${campo.type}" name="${campo.name}" 
                       placeholder="${campo.placeholder || ''}" 
                       ${campo.required ? 'required' : ''}>
            </div>
        `;
    }).join('');

    const modal = document.getElementById('modal-registro-socio');
    modal.classList.add('activo');
    modal.setAttribute('aria-hidden', 'false');
}

function cerrarModalSocio() {
    const modal = document.getElementById('modal-registro-socio');
    if (!modal) return;
    modal.classList.remove('activo');
    modal.setAttribute('aria-hidden', 'true');
}

async function notificarEquipoComercial(payload, codigoEntidad) {
    try {
        const urlEdge = `${SUPABASE_URL}/functions/v1/enviar-correo`;
        const cuerpo = `Nuevo postulante a Socio Comercial registrado en estado PENDIENTE:\n\n` +
            `- Perfil: ${payload.tipo_socio.toUpperCase()}\n` +
            `- Código Asignado: ${codigoEntidad}\n` +
            `- Nombre: ${payload.nombre} ${payload.apellido}\n` +
            `- Correo: ${payload.correo}\n` +
            `- Teléfono: ${payload.telefono}\n` +
            (payload.nombre_empresa ? `- Empresa: ${payload.nombre_empresa}\n` : '') +
            (payload.licencia ? `- Licencia MVCS: ${payload.licencia}\n` : '') +
            `\nPor favor, contáctalo para validar sus datos y cambiar su estado a ACTIVO desde el panel administrativo.`;

        await fetch(urlEdge, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                destinatario: CORREO_ALERTA_ADMIN,
                asunto: `Nuevo Socio Potencial (${payload.tipo_socio}): ${payload.nombre} ${payload.apellido}`,
                mensaje: cuerpo
            })
        });
    } catch (errMail) {
        console.warn('No se pudo enviar la alerta al administrador:', errMail.message);
    }
}

async function guardarNuevoSocio(formNode) {
    const btnSubmit = document.getElementById('btn-submit-socio');
    const textoOriginal = btnSubmit.textContent;
    btnSubmit.textContent = 'Enviando solicitud...';
    btnSubmit.disabled = true;

    try {
        const formData = new FormData(formNode);
        const payload = Object.fromEntries(formData.entries());

        // 1. Guardar en PostgreSQL mediante procedimiento almacenado (estado = 'pendiente')
        const { data, error } = await supabaseClient.rpc('registrar_socio_potencial', {
            p_datos: payload
        });

        if (error) throw new Error(error.message);
        if (!data || !data.exito) throw new Error(data?.error || 'No se pudo procesar el registro.');

        // 2. Enviar correo de verificación OTP al socio
        const urlPortalPrincipal = window.location.origin + window.location.pathname.replace(/\/socios\/.*$/, '/index.html');
        await supabaseClient.auth.signInWithOtp({
            email: payload.correo.trim().toLowerCase(),
            options: {
                emailRedirectTo: urlPortalPrincipal
            }
        });

        // 3. Notificar por correo a tu equipo comercial para que lo contacten y filtren
        await notificarEquipoComercial(payload, data.codigo_entidad);

        alert('¡Solicitud enviada con éxito! Revisa tu correo electrónico para confirmar tu dirección. Un asesor de nuestro equipo se comunicará contigo pronto para activar tu cuenta.');
        formNode.reset();
        cerrarModalSocio();

    } catch (err) {
        console.error('[Error Registro Socio]:', err);
        alert('Error al registrar solicitud: ' + err.message);
    } finally {
        btnSubmit.textContent = textoOriginal;
        btnSubmit.disabled = false;
    }
}
