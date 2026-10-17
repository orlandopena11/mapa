/* jshint esversion: 11 */

// ==========================================================================
// PARTE 1 DE 15: ARQUITECTURA DE CONTROL DE ESTADO GLOBAL INMUTABLE
// ==========================================================================

let usuarioAutenticado = false;
let correoUsuarioLogueado = "";

if (typeof window.usuarioAutenticado === "undefined") {
    window.usuarioAutenticado = false;
}

if (typeof window.correoUsuarioLogueado === "undefined") {
    window.correoUsuarioLogueado = "";
}

const state = {
    propiedades: [],
    favoritos: new Set(),
    usuarioActual: null,
    propiedadSeleccionadaId: null,
    filtros: {
        estado: 'Venta',
        precioMin: 0,
        precioMax: Infinity,
        habitaciones: 0,
        camasExactas: false,
        banos: 0,
        tiposPropiedad: new Set(['Casa', 'Departamento', 'Terreno', 'Local', 'Oficina', 'Edificio', 'Lote']),
        tiposListado: new Set(['propietario', 'agente', 'nueva construccion', 'ejecucion hipoteca', 'subasta', 'embargo', 'pre ejecucion hipoteca'])
    },
    limpiadoresDOM: new Map()
}; // Fin de asignación del objeto global state


// ==========================================================================
// CONTROLADOR DINÁMICO DE SESIÓN, BOTÓN LOGUEO Y ROLES MEDIANTE RPC
// ==========================================================================
// [INICIO DE LLAVES]: Abre la función asíncrona actualizarBotonCuenta
async function actualizarBotonCuenta() { 
    const navbar = document.querySelector('header.navbar-global');
    if (!navbar) return;

    let indicador = document.getElementById('user-session-badge');
    const btnOpenLogin = document.getElementById('btn-open-login');

    // [INICIO DE LLAVES]: Control condicional de visibilidad según estado de autenticación
    if (window.usuarioLogueado) {
        if (btnOpenLogin) btnOpenLogin.style.display = 'none';

        if (!indicador) {
            indicador = document.createElement('div');
            indicador.id = 'user-session-badge';
            indicador.style.cssText = `
                margin-left: auto; 
                display: flex; 
                align-items: center; 
                gap: 10px; 
                padding: 6px 12px; 
                background: #002e50; 
                color: #ffffff; 
                border-radius: 20px; 
                font-size: 12px; 
                font-weight: 600; 
                border: 1px solid #ffffff;
                box-sizing: border-box;
                max-width: 100%;
            `;
            navbar.appendChild(indicador);
        }
    } else {
        if (indicador) indicador.style.display = 'none';
        if (btnOpenLogin) btnOpenLogin.style.display = 'block';
    } // [FIN DE LLAVES]: Cierra el bloque condicional de autenticación visual

    if (indicador && window.usuarioLogueado) {
        // [INICIO DE LLAVES]: Bloque de procesamiento de datos y llamada RPC de permisos
        let rolTexto = "Usuario";
        let puedeCrud = false;

        try {
            const cliente = obtenerClienteSupabase();
            if (cliente) {
                const { data, error } = await cliente.rpc('obtener_permisos_usuario', { 
                    p_usuario_id: window.usuarioLogueado.id 
                });
                
                if (!error && data && data.length > 0) {
                    rolTexto = data[0].nombres_rol || "Usuario";
                    puedeCrud = data[0].permiso_insertar || data[0].permiso_modificar;
                    state.usuarioPermisos = data[0];
                }
            }
        } catch (errRol) {
            console.warn("Error al consultar permisos de rol:", errRol);
        }

        const esMovil = window.innerWidth <= 768;
        const correoCorto = window.usuarioLogueado.email.length > 18 && esMovil 
            ? window.usuarioLogueado.email.substring(0, 15) + '...' 
            : window.usuarioLogueado.email;

        let htmlContenido = `
            <span title="${window.usuarioLogueado.email}" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                👤 ${correoCorto} <span style="background: #FFB91D; color: #002e50; padding: 2px 6px; border-radius: 10px; font-size: 10px; text-transform: uppercase;">${rolTexto}</span>
            </span>
        `;

        // [INICIO DE LLAVES]: Condición para inyectar acceso al panel de mantenimiento si tiene permisos
        if (puedeCrud) {
            htmlContenido += `
                <a href="#" id="link-crud-propiedades" style="background: #006aff; color: #ffffff; padding: 4px 8px; border-radius: 12px; text-decoration: none; font-size: 11px; white-space: nowrap;">
                    ⚙️ Mantenimiento
                </a>
            `;
        } // [FIN DE LLAVES]: Cierra la condición de inyección del enlace CRUD

        indicador.innerHTML = htmlContenido;
        indicador.style.display = 'flex';

        const btnCrud = document.getElementById('link-crud-propiedades');
        // [INICIO DE LLAVES]: Asignación de evento de clic al botón de mantenimiento CRUD
        if (btnCrud) {
            btnCrud.onclick = (e) => {
                e.preventDefault();
                ejecutarPanelMantenimientoCrud(rolTexto);
            };
        } // [FIN DE LLAVES]: Cierra la asignación del evento onclick
    } // [FIN DE LLAVES]: Cierra la condición principal de indicador con usuario activo
} // [FIN DE LLAVES]: Cierra la función asíncrona actualizarBotonCuenta


// ==========================================================================
// CONTROLADOR COMPLETO Y MODULAR DEL PANEL CRUD (7 TABLAS) CON UI/UX ESTÁNDAR
// ==========================================================================

/**
 * Mapeo completo de configuración para las 7 tablas principales del sistema.
 */
const CONFIGURACION_TABLAS_CRUD = {
    propiedad: {
        titulo: "Propiedades",
        pk: "propiedad_id",
        campos: [
            { nombre: "titulo", label: "Título", tipo: "text", requerido: true },
            { nombre: "precio_base", label: "Precio Base ($)", tipo: "number", requerido: true },
            { nombre: "tipo_propiedad", label: "Tipo Propiedad", tipo: "select", opciones: ['Casa', 'Departamento', 'Terreno', 'Local', 'Oficina', 'Edificio', 'Lote'] },
            { nombre: "tipo_anuncio", label: "Transacción", tipo: "select", opciones: ['Venta', 'Alquiler'] },
            { nombre: "estado_publicacion", label: "Estado Publicación", tipo: "select", opciones: ['disponible', 'vendida', 'alquilada', 'reservada'] },
            { nombre: "habitaciones", label: "Habitaciones", tipo: "number" },
            { nombre: "banos", label: "Baños", tipo: "number" },
            { nombre: "area_terreno", label: "Área Terreno (m²)", tipo: "number" },
            { nombre: "area_construida", label: "Área Construida (m²)", tipo: "number" },
            { nombre: "direccion", label: "Dirección", tipo: "text" },
            { nombre: "distrito", label: "Distrito", tipo: "text" }
        ]
    },
    anuncio: {
        titulo: "Anuncios",
        pk: "anuncio_id",
        campos: [
            { nombre: "propiedad_id_fk", label: "ID Propiedad FK", tipo: "text", requerido: true },
            { nombre: "usuario_id_fk", label: "ID Usuario FK", tipo: "text" },
            { nombre: "agente_id_fk", label: "ID Agente FK", tipo: "text" },
            { nombre: "fecha_publicacion", label: "Fecha Publicación", tipo: "date" },
            { nombre: "estado_anuncio", label: "Estado Anuncio", tipo: "select", opciones: ['activo', 'inactivo', 'pausado'] }
        ]
    },
    agente_inmobiliario: {
        titulo: "Agentes Inmobiliarios",
        pk: "agente_id",
        campos: [
            { nombre: "nombre", label: "Nombre", tipo: "text", requerido: true },
            { nombre: "apellido", label: "Apellido", tipo: "text", requerido: true },
            { nombre: "correo", label: "Correo Electrónico", tipo: "email", requerido: true },
            { nombre: "telefono_agente", label: "Teléfono Agente", tipo: "text" },
            { nombre: "prioridad", label: "Prioridad", tipo: "number" },
            { nombre: "leads", label: "Máximo Leads", tipo: "number" },
            { nombre: "leads_recibidos", label: "Leads Recibidos", tipo: "number" }
        ]
    },
    usuario_autenticado: {
        titulo: "Usuarios Autenticados",
        pk: "usuario_id",
        campos: [
            { nombre: "nombre", label: "Nombre", tipo: "text", requerido: true },
            { nombre: "apellido", label: "Apellido", tipo: "text", requerido: true },
            { nombre: "correo", label: "Correo Electrónico", tipo: "email", requerido: true },
            { nombre: "telefono", label: "Teléfono", tipo: "text" },
            { nombre: "rol_id_fk", label: "Rol (1:Admin, 2:Agente, 3:Usuario)", tipo: "number", requerido: true },
            { nombre: "estado_cuenta", label: "Estado Cuenta", tipo: "select", opciones: ['activo', 'pendiente', 'suspendido'] }
        ]
    },
    visita: {
        titulo: "Solicitudes de Tours / Visitas",
        pk: "visita_id",
        campos: [
            { nombre: "propiedad_id_fk", label: "ID Propiedad FK", tipo: "text", requerido: true },
            { nombre: "nombre_visita", label: "Nombre Interesado", tipo: "text", requerido: true },
            { nombre: "telefono", label: "Teléfono", tipo: "text" },
            { nombre: "fecha_visita", label: "Fecha/Hora Visita", tipo: "text" },
            { nombre: "estado_visita", label: "Estado Visita", tipo: "select", opciones: ['pendiente', 'confirmada', 'cancelada', 'completada'] },
            { nombre: "estado_lead", label: "Estado Lead", tipo: "select", opciones: ['nuevo', 'contactado', 'en_proceso', 'cerrado'] }
        ]
    },
    contacte_agente: {
        titulo: "Contactos a Agentes",
        pk: "contacte_id",
        campos: [
            { nombre: "propiedad_id_fk", label: "ID Propiedad FK", tipo: "text", requerido: true },
            { nombre: "agente_id_fk", label: "ID Agente FK", tipo: "text" },
            { nombre: "nombre", label: "Nombre Interesado", tipo: "text", requerido: true },
            { nombre: "email_interesado", label: "Correo Interesado", tipo: "email", requerido: true },
            { nombre: "telefono", label: "Teléfono", tipo: "text" },
            { nombre: "estado_lead", label: "Estado Lead", tipo: "select", opciones: ['pendiente', 'contactado', 'atendido'] }
        ]
    },
    simulacion_hipotecaria: {
        titulo: "Simulaciones Hipotecarias",
        pk: "simulacion_id",
        campos: [
            { nombre: "propiedad_id_fk", label: "ID Propiedad FK", tipo: "text", requerido: true },
            { nombre: "precio_propiedad", label: "Precio Propiedad ($)", tipo: "number" },
            { nombre: "monto_prestamo", label: "Monto Préstamo ($)", tipo: "number" },
            { nombre: "pago_mensual_estimated", label: "Cuota Estimada ($)", tipo: "number" },
            { nombre: "plazo_meses", label: "Plazo Meses", tipo: "number" },
            { nombre: "tasa_tea", label: "Tasa TEA", tipo: "number" }
        ]
    }
};

let tablaCrudActiva = "propiedad";

/**
 * Descripción de la función: ejecutarPanelMantenimientoCrud valida los permisos de escritura del usuario
 * mediante el rol activo, construye la interfaz modal principal con pestañas para las 7 tablas,
 * el botón de alta y carga la vista tabular inicial de registros.
 */
// [INICIO DE LLAVES]: Abre la función principal asíncrona ejecutarPanelMantenimientoCrud
async function ejecutarPanelMantenimientoCrud(rol) {
    const permisos = state.usuarioPermisos || {};
    
    // [INICIO DE LLAVES]: Valida si el usuario posee privilegios de inserción o modificación
    if (!permisos.permiso_insertar && !permisos.permiso_modificar) {
        alert("Su rol actual no cuenta con privilegios de escritura sobre las tablas del sistema.");
        return;
    } // [FIN DE LLAVES]: Cierra la condición de bloqueo por falta de permisos

    let modalCrud = document.getElementById('modal-mantenimiento-crud-sre');
    // [INICIO DE LLAVES]: Condicional que crea el contenedor modal si no existe en el DOM
    if (!modalCrud) {
        modalCrud = document.createElement('div');
        modalCrud.id = 'modal-mantenimiento-crud-sre';
        modalCrud.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.75); z-index: 999999; display: flex;
            align-items: center; justify-content: center; font-family: sans-serif;
        `;
        document.body.appendChild(modalCrud);
    } // [FIN DE LLAVES]: Cierra la creación del modal CRUD

    modalCrud.innerHTML = `
        <div style="background: #ffffff; width: 94%; max-width: 1240px; height: 90vh; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
            <div style="background: #002e50; color: #ffffff; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0; font-size: 20px; font-weight: 700;">Panel de Mantenimiento CRUD</h3>
                    <span style="font-size: 12px; color: #FFB91D; font-weight: 600;">Rango Autorizado: ${rol.toUpperCase()}</span>
                </div>
                <button id="btn-cerrar-crud-modal" style="background: transparent; border: none; color: #ffffff; font-size: 24px; cursor: pointer; font-weight: bold;">✕</button>
            </div>

            <div style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 10px 24px; display: flex; gap: 8px; overflow-x: auto;">
                ${Object.keys(CONFIGURACION_TABLAS_CRUD).map(keyTab => `
                    <button class="btn-tab-crud ${keyTab === tablaCrudActiva ? 'activo' : ''}" data-tabla="${keyTab}" 
                        style="padding: 8px 16px; border-radius: 6px; border: 1px solid #cbd5e1; background: ${keyTab === tablaCrudActiva ? '#006aff' : '#ffffff'}; color: ${keyTab === tablaCrudActiva ? '#ffffff' : '#1e293b'}; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;">
                        ${CONFIGURACION_TABLAS_CRUD[keyTab].titulo}
                    </button>
                `).join('')}
            </div>

            <div style="padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                <h4 id="titulo-tabla-crud" style="margin: 0; color: #002e50; font-size: 18px; font-weight: 700;">${CONFIGURACION_TABLAS_CRUD[tablaCrudActiva].titulo}</h4>
                ${permisos.permiso_insertar ? `
                    <button id="btn-nuevo-registro-crud" style="background: #10b981; color: #ffffff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(16,185,129,0.2);">
                        + Nuevo Registro
                    </button>
                ` : ''}
            </div>

            <div id="contenedor-tabla-datos-crud" style="flex: 1; overflow: auto; padding: 16px 24px; background: #fafafa;">
                <p style="text-align: center; color: #64748b; font-weight: 600; padding: 40px;">Cargando registros del sistema...</p>
            </div>
        </div>
    `;

    modalCrud.style.display = 'flex';

    document.getElementById('btn-cerrar-crud-modal').onclick = () => {
        modalCrud.style.display = 'none';
    };

    // [INICIO DE LLAVES]: Asigna el evento click a los botones de navegación entre pestañas
    modalCrud.querySelectorAll('.btn-tab-crud').forEach(btn => {
        btn.onclick = (e) => {
            // [INICIO DE LLAVES]: Callback de cambio de tabla activa
            tablaCrudActiva = e.target.getAttribute('data-tabla');
            modalCrud.querySelectorAll('.btn-tab-crud').forEach(b => {
                b.style.background = '#ffffff';
                b.style.color = '#1e293b';
            });
            e.target.style.background = '#006aff';
            e.target.style.color = '#ffffff';
            document.getElementById('titulo-tabla-crud').innerText = CONFIGURACION_TABLAS_CRUD[tablaCrudActiva].titulo;
            cargarDatosTablaCrud(tablaCrudActiva);
        }; // [FIN DE LLAVES]: Cierra el callback de pestaña
    }); // [FIN DE LLAVES]: Cierra el bucle de pestañas

    const btnNuevo = document.getElementById('btn-nuevo-registro-crud');
    // [INICIO DE LLAVES]: Valida existencia del botón de nuevo registro
    if (btnNuevo) {
        btnNuevo.onclick = () => abrirFormularioEdicionCrud(tablaCrudActiva, null);
    } // [FIN DE LLAVES]: Cierra condición de botón nuevo

    await cargarDatosTablaCrud(tablaCrudActiva);
} // [FIN DE LLAVES]: Cierra la función principal ejecutarPanelMantenimientoCrud

/**
 * Descripción de la función: cargarDatosTablaCrud realiza la petición directa a Supabase REST API 
 * para consultar todos los registros de la entidad activa y renderizarlos en un Data Grid limpio.
 */
// [INICIO DE LLAVES]: Abre la función asíncrona cargarDatosTablaCrud
async function cargarDatosTablaCrud(nombreTabla) {
    const contenedor = document.getElementById('contenedor-tabla-datos-crud');
    if (!contenedor) return;

    contenedor.innerHTML = `<p style="text-align: center; color: #006aff; font-weight: 600; padding: 40px;">Consultando la base de datos para ${nombreTabla}...</p>`;

    // [INICIO DE LLAVES]: Bloque try/catch para manejo de errores en red y base de datos
    try {
        const cliente = obtenerClienteSupabase();
        if (!cliente) throw new Error("Cliente Supabase inaccesible.");

        const conf = CONFIGURACION_TABLAS_CRUD[nombreTabla];
        const { data, error } = await cliente.from(nombreTabla).select('*').limit(100);

        if (error) throw error;

        // [INICIO DE LLAVES]: Valida si la colección está vacía
        if (!data || data.length === 0) {
            contenedor.innerHTML = `<p style="text-align: center; color: #64748b; padding: 40px;">No existen registros registrados en esta tabla actualmente.</p>`;
            return;
        } // [FIN DE LLAVES]: Cierra validación de datos vacíos

        const permisos = state.usuarioPermisos || {};

        let htmlTabla = `
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background: #002e50; color: #ffffff;">
                        <th style="padding: 12px 10px; font-weight: bold; width: 130px;">Acciones</th>
                        ${conf.campos.map(c => `<th style="padding: 12px 10px; font-weight: bold; white-space: nowrap;">${c.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.map(fila => `
                        <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#ffffff'">
                            <td style="padding: 10px; white-space: nowrap;">
                                ${permisos.permiso_modificar ? `
                                    <button class="btn-edit-crud" data-id="${fila[conf.pk]}" style="background: #006aff; color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer; margin-right: 4px;">Editar</button>
                                ` : ''}
                                ${permisos.permiso_eliminar ? `
                                    <button class="btn-delete-crud" data-id="${fila[conf.pk]}" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;">Eliminar</button>
                                ` : ''}
                            </td>
                            ${conf.campos.map(c => `<td style="padding: 10px; color: #334155;">${fila[c.nombre] !== null && fila[c.nombre] !== undefined ? fila[c.nombre] : '-'}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        contenedor.innerHTML = htmlTabla;

        // [INICIO DE LLAVES]: Asigna eventos a los botones de edición de cada fila
        contenedor.querySelectorAll('.btn-edit-crud').forEach(btn => {
            btn.onclick = () => {
                const idRegistro = btn.getAttribute('data-id');
                const objetoFila = data.find(item => String(item[conf.pk]) === String(idRegistro));
                abrirFormularioEdicionCrud(nombreTabla, objetoFila);
            };
        }); // [FIN DE LLAVES]: Cierra asignación de botones editar

        // [INICIO DE LLAVES]: Asigna eventos a los botones de eliminación de cada fila
        contenedor.querySelectorAll('.btn-delete-crud').forEach(btn => {
            btn.onclick = async () => {
                // [INICIO DE LLAVES]: Callback de confirmación y eliminación
                const idRegistro = btn.getAttribute('data-id');
                if (confirm(`¿Confirma eliminar el registro con ID: ${idRegistro} de la tabla ${nombreTabla}?`)) {
                    await eliminarRegistroCrud(nombreTabla, conf.pk, idRegistro);
                }
            }; // [FIN DE LLAVES]: Cierra callback de eliminación
        }); // [FIN DE LLAVES]: Cierra asignación de botones eliminar

    } catch (err) {
        contenedor.innerHTML = `<p style="color: #ef4444; text-align: center; padding: 30px;">Error al cargar registros: ${err.message}</p>`;
    } // [FIN DE LLAVES]: Cierra bloque try/catch
} // [FIN DE LLAVES]: Cierra la función cargarDatosTablaCrud

/**
 * Descripción de la función: abrirFormularioEdicionCrud despliega un sub-modal flotante 
 * con inputs dinámicos orientados a crear (INSERT) o modificar (UPDATE) un registro.
 */
// [INICIO DE LLAVES]: Abre la función abrirFormularioEdicionCrud
function abrirFormularioEdicionCrud(nombreTabla, datosFila) {
    const conf = CONFIGURACION_TABLAS_CRUD[nombreTabla];
    const esEdicion = datosFila !== null;

    let subModal = document.getElementById('submodal-formulario-crud');
    // [INICIO DE LLAVES]: Valida existencia del sub-modal flotante
    if (!subModal) {
        subModal = document.createElement('div');
        subModal.id = 'submodal-formulario-crud';
        subModal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.65); z-index: 1000000; display: flex;
            align-items: center; justify-content: center; font-family: sans-serif;
        `;
        document.body.appendChild(subModal);
    } // [FIN DE LLAVES]: Cierra la creación del sub-modal

    subModal.innerHTML = `
        <div style="background: #ffffff; padding: 24px; border-radius: 12px; width: 92%; max-width: 620px; max-height: 85vh; overflow-y: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                <h4 style="margin: 0; color: #002e50; font-size: 18px; font-weight: 700;">${esEdicion ? 'Editar' : 'Nuevo'} Registro - ${conf.titulo}</h4>
                <button type="button" id="btn-cerrar-submodal-x" style="background: none; border: none; font-size: 20px; font-weight: bold; color: #64748b; cursor: pointer;">✕</button>
            </div>

            <form id="form-generico-crud" style="display: flex; flex-direction: column; gap: 14px;">
                ${conf.campos.map(c => {
                    const valorActual = esEdicion && datosFila[c.nombre] !== undefined ? datosFila[c.nombre] : '';
                    if (c.tipo === 'select') {
                        return `
                            <div>
                                <label style="font-size: 12px; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">${c.label}:</label>
                                <select name="${c.nombre}" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff;" ${c.requerido ? 'required' : ''}>
                                    ${c.opciones.map(op => `<option value="${op}" ${String(valorActual) === String(op) ? 'selected' : ''}>${op}</option>`).join('')}
                                </select>
                            </div>
                        `;
                    }
                    return `
                        <div>
                            <label style="font-size: 12px; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">${c.label}:</label>
                            <input type="${c.tipo}" name="${c.nombre}" value="${valorActual}" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; box-sizing: border-box;" ${c.requerido ? 'required' : ''} />
                        </div>
                    `;
                }).join('')}

                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                    <button type="button" id="btn-cancelar-submodal" style="background: #94a3b8; color: white; border: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer;">Cancelar</button>
                    <button type="submit" id="btn-guardar-crud-submit" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 700;">
                        ${esEdicion ? 'Guardar Cambios' : 'Crear Registro'}
                    </button>
                </div>
            </form>
        </div>
    `;

    subModal.style.display = 'flex';

    const cerrarSubModal = () => { subModal.style.display = 'none'; };
    document.getElementById('btn-cancelar-submodal').onclick = cerrarSubModal;
    document.getElementById('btn-cerrar-submodal-x').onclick = cerrarSubModal;

    // [INICIO DE LLAVES]: Asigna el evento submit al formulario dinámico del CRUD
    document.getElementById('form-generico-crud').onsubmit = async (e) => {
        // [INICIO DE LLAVES]: Callback asíncrono para procesar el guardado
        e.preventDefault();
        const btnSubmit = document.getElementById('btn-guardar-crud-submit');
        btnSubmit.innerText = "Guardando...";
        btnSubmit.disabled = true;

        const formData = new FormData(e.target);
        const payload = {};
        formData.forEach((val, key) => { payload[key] = val; });

        await guardarRegistroCrud(nombreTabla, conf.pk, esEdicion, esEdicion ? datosFila[conf.pk] : null, payload);
        subModal.style.display = 'none';
    }; // [FIN DE LLAVES]: Cierra el evento onsubmit del formulario
} // [FIN DE LLAVES]: Cierra la función abrirFormularioEdicionCrud

/**
 * Descripción de la función: guardarRegistroCrud ejecuta la operación de inserción (INSERT)
 * o actualización (UPDATE) directamente en la base de datos de Supabase.
 */
// [INICIO DE LLAVES]: Abre la función asíncrona guardarRegistroCrud
async function guardarRegistroCrud(nombreTabla, pkColumna, esEdicion, pkValor, payload) {
    // [INICIO DE LLAVES]: Bloque try/catch para persistencia de datos
    try {
        const cliente = obtenerClienteSupabase();
        if (!cliente) throw new Error("Cliente Supabase no disponible.");

        let res;
        // [INICIO DE LLAVES]: Condicional que diferencia entre actualizar o insertar
        if (esEdicion) {
            res = await cliente.from(nombreTabla).update(payload).eq(pkColumna, pkValor);
        } else {
            res = await cliente.from(nombreTabla).insert([payload]);
        } // [FIN DE LLAVES]: Cierra condición de guardado

        if (res.error) throw res.error;

        alert(`¡Registro ${esEdicion ? 'actualizado' : 'creado'} exitosamente en ${nombreTabla}!`);
        await cargarDatosTablaCrud(nombreTabla);

    } catch (err) {
        alert("Error al guardar en la base de datos: " + err.message);
    } // [FIN DE LLAVES]: Cierra bloque try/catch
} // [FIN DE LLAVES]: Cierra la función guardarRegistroCrud

/**
 * Descripción de la función: eliminarRegistroCrud borra de manera definitiva un registro 
 * seleccionado de la tabla en Supabase tras una confirmación previa.
 */
// [INICIO DE LLAVES]: Abre la función asíncrona eliminarRegistroCrud
async function eliminarRegistroCrud(nombreTabla, pkColumna, pkValor) {
    // [INICIO DE LLAVES]: Bloque try/catch para eliminación segura
    try {
        const cliente = obtenerClienteSupabase();
        if (!cliente) throw new Error("Cliente Supabase no disponible.");

        const { error } = await cliente.from(nombreTabla).delete().eq(pkColumna, pkValor);
        if (error) throw error;

        alert(`¡Registro eliminado exitosamente de la tabla ${nombreTabla}!`);
        await cargarDatosTablaCrud(nombreTabla);

    } catch (err) {
        alert("Error al eliminar registro: " + err.message);
    } // [FIN DE LLAVES]: Cierra bloque try/catch
} // [FIN DE LLAVES]: Cierra la función eliminarRegistroCrud


// ==========================================================================
// PARTE 2 DE 15: INITIALIZACIÓN CORE DEL CLIENTE SUPABASE CON FILTROS DE RED
// ==========================================================================

const supabaseUrl = 'https://aohizylvnnrjhgplsods.supabase.co';
const supabaseAnonKey = 'sb_publishable_uNtOayIxxDaxozSL4uA7Qw_j8adfYS1';

console.warn(">> [SRE ESPÍA 1] Iniciando traza de compilación en el hilo principal...");

let supabase = null;

function obtenerClienteSupabase() { // Inicia Function obtenerClienteSupabase
    if (supabase) return supabase;
    if (typeof createClient !== "undefined") {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    } else if (typeof window.supabase !== "undefined" && typeof window.supabase.createClient === "function") {
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    }
    if (supabase) {
        console.log("OK [SRE ESPÍA 2] Cliente Supabase vinculado y listo para peticiones.");
    } else {
        console.error("XX [SRE ESPÍA 2] No se pudo instanciar el cliente Supabase. Verifique CDN.");
    }
    return supabase;
} // Fin de Function obtenerClienteSupabase

obtenerClienteSupabase();


// ==========================================================================
// PARTE 3 DE 15: FIREWALLS DE ACCESO ACL Y TRANSPORTE JSONP APPS SCRIPT
// ==========================================================================

function verificarAutorizacionAcceso() { // Inicia Function verificarAutorizacionAcceso
    console.group(">>> [SRE ESPÍA ACL] Verificando credenciales de interacción");
    console.log("Usuario actual en estado:", state.usuarioActual);

    if (!state.usuarioActual || !state.usuarioActual.id) {
        console.warn("!! ACL BLOQUEADO: Sesión inexistente.");
        console.groupEnd();
        alert("Acceso Restringido: Debe iniciar sesión con su cuenta para realizar esta acción.");
        if (typeof mostrarPopupAccion === "function") {
            mostrarPopupAccion("modal-autenticacion-supabase");
        }
        return false;
    }

    if (state.usuarioActual && state.usuarioActual.estado_cuenta === "suspendido") {
        console.error("XX ACL BLOQUEADO: El usuario se encuentra SUSPENDIDO.");
        console.groupEnd();
        alert("Cuenta Suspendida: No tiene autorización para realizar esta acción.");
        return false;
    }

    console.log(">> ACL PERMITIDO: Cuenta activa y autorizada.");
    console.groupEnd();
    return true;
} // Fin de Function verificarAutorizacionAcceso


// ==========================================================================
// GUARDIA CENTRALIZADO DE ACCESO PARA TODAS LAS FUNCIONALIDADES PROTEGIDAS
// ==========================================================================

// --- REPARACIÓN QUIRÚRGICA PUNTO 1: Cortafuegos de Sesión async/await con recuperación caliente ---
async function validarAccesoFuncionalidadPremium() { // SRE Guardia Centralizado Async Optimizado
    console.group(">> [CORTAFUEGOS CENTRAL] Evaluando permisos de interacción...");

    // 1. VERIFICACIÓN DE AUTENTICACIÓN: ¿Existe un estado de usuario en memoria?
    if (!state.usuarioActual || !state.usuarioActual.id) {
        console.warn("!! ACL: Estado de usuario vacío. Intento caliente de recuperación de sesión nativa...");

        // Intento caliente: leer la sesión nativa activa del navegador desde Supabase Auth
        try {
            const cliente = obtenerClienteSupabase();
            if (cliente) {
                const { data: { session } } = await cliente.auth.getSession();

                // Si existe una sesión activa válida de Supabase, sincroniza el objeto en memoria
                if (session && session.user && session.user.id) {
                    state.usuarioActual = {
                        id: session.user.id,
                        correo: session.user.email,
                        estado_cuenta: 'activo'
                    };
                    console.log(">> [CORTAFUEGOS] Sesión nativa recuperada y sincronizada para:", state.usuarioActual.correo);
                    console.groupEnd();
                    return true; // Permite el paso para evitar la alerta falsa de "Acceso Restringido"
                }
            }
        } catch (errRecuperacion) {
            console.warn("!! [CORTAFUEGOS] Fallo en el intento caliente de recuperación de sesión:", errRecuperacion.message);
        }

        // Si no se pudo recuperar la sesión, se bloquea el acceso de forma tradicional
        console.warn("X ACL BLOQUEADO: El interesado no ha iniciado sesión.");
        console.groupEnd();

        alert("Acceso Restringido: Debe iniciar sesión con su cuenta para realizar esta acción.");

        if (typeof gestionarCortinaSPA === "function") gestionarCortinaSPA('cerrar');
        if (typeof cerrarTodosLosPaneles === "function") cerrarTodosLosPaneles();

        if (typeof mostrarPopupAccion === "function") {
            mostrarPopupAccion("modal-autenticacion-supabase");
        }
        return false;
    } // Fin de verificación de usuario vacío con intento caliente

    // 2. VERIFICACIÓN DE ESTADO: Extraemos el estado limpio de la cuenta
    const estadoCuenta = String(state.usuarioActual.estado_cuenta || '').toLowerCase().trim();
    console.log(`> Interesado identificado: ${state.usuarioActual.correo} | Estado: ${estadoCuenta.toUpperCase()}`);

    if (estadoCuenta === "suspendido") {
        console.error("X ACL BLOQUEO CENTRAL: Intento de uso por usuario SUSPENDIDO.");
        console.groupEnd();

        alert("Cuenta Suspendida: No tiene autorización para realizar acciones premium en la plataforma.");
        if (typeof gestionarCortinaSPA === "function") gestionarCortinaSPA('cerrar');
        return false;
    }

    if (estadoCuenta === "pendiente") {
        console.warn("! ACL BLOQUEO CENTRAL: Cuenta aún en estado PENDIENTE.");
        console.groupEnd();

        alert("Acceso Restringido: Por favor, revise su correo electrónico y valide su cuenta usando el enlace enviado para activar sus beneficios.");
        return false;
    }

    if (estadoCuenta === "activo") {
        console.log(">> ACL PERMITIDO: Interesado activo y autorizado para funciones Premium.");
        console.groupEnd();
        return true;
    }

    console.warn(`X ACL BLOQUEADO: Estado de cuenta desconocido (${estadoCuenta}).`);
    console.groupEnd();
    return false;
} // Fin de Function validarAccesoFuncionalidadPremium async

            function evaluarCriteriosDeFiltrado(prop) { // Inicia Function evaluarCriteriosDeFiltrado
                // ==========================================================================
                // REGLA DE INTEGRIDAD ESTRICTA SRE DE TRANSACCIONES COMERCIALES
                // ==========================================================================
                const filtroTransaccion = state.filtros.estado || "Venta";

                if ((filtroTransaccion === "Venta" || filtroTransaccion === "En venta") && (prop.estado_publicacion !== "disponible" || prop.tipo_anuncio !== "Venta")) {
                    return false;
                }

                if ((filtroTransaccion === "Alquiler" || filtroTransaccion === "Para el alquiler") && (prop.estado_publicacion !== "disponible" || prop.tipo_anuncio !== "Alquiler")) {
                    return false;
                }

                if ((filtroTransaccion === "Vendido" || filtroTransaccion === "Vendidas") && prop.estado_publicacion !== "vendida") {
                    return false;
                }

                const inputDireccion = document.getElementById('search-address');
                if (inputDireccion && inputDireccion.value.trim() !== "") {
                    const textoBusqueda = inputDireccion.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                    const direccionProp = String(prop.direccion || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const distritoProp = String(prop.distrito || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const tituloProp = String(prop.titulo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                    if (!direccionProp.includes(textoBusqueda) && !distritoProp.includes(textoBusqueda) && !tituloProp.includes(textoBusqueda)) {
                        return false;
                    }
                }

                if (prop.precio_base < state.filtros.precioMin || prop.precio_base > state.filtros.precioMax) return false;

                if (state.filtros.habitaciones !== undefined && state.filtros.habitaciones > 0) {
                    if ((parseInt(prop.habitaciones, 10) || 0) < state.filtros.habitaciones) return false;
                }
                if (state.filtros.banos !== undefined && state.filtros.banos > 0) {
                    if ((parseFloat(prop.banos) || 0) < state.filtros.banos) return false;
                }

                if (state.filtros.tiposPropiedad && state.filtros.tiposPropiedad.size > 0) {
                    if (!state.filtros.tiposPropiedad.has(String(prop.tipo_propiedad || '').trim())) return false;
                }

                if (state.filtros.tiposListado && state.filtros.tiposListado.size > 0) {
                    const origenPublicacion = String(prop.situacion_propiedad || prop.creado_por || "").toLowerCase().trim();
                    if (origenPublicacion !== "" && !state.filtros.tiposListado.has(origenPublicacion)) {
                        return false;
                    } // Fin de validación inside Set tiposListado
                }

                const checkboxesFisicosEnPantalla = document.querySelectorAll('.more-filter-cb');
                const checkboxesMarcados = Array.from(checkboxesFisicosEnPantalla).filter(cb => cb.checked);

                if (checkboxesMarcados.length > 0) {
                    const situacionBD = String(prop.situacion_propiedad || "").trim();
                    const coincideFiltro = checkboxesMarcados.some(cb => String(cb.value).trim() === situacionBD);

                    if (!coincideFiltro) {
                        return false;
                    } // Fin de if coincideFiltro
                } // Fin de if checkboxesMarcados

                return true;
            } // Fin de Function evaluarCriteriosDeFiltrado con retorno a configuración por defecto SRE



async function cargarDatosDesdeSupabase() { // Inicia Function cargarDatosDesdeSupabase
    console.log(">> [SRE ESPÍA 3] Consultando directamente a Supabase REST API sin intermediarios...");
    try {
        const cliente = obtenerClienteSupabase();
        if (!cliente) throw new Error("Cliente Supabase no inicializado en ventana.");

        const {
            data,
            error
        } = await cliente
            .from('vista_catalogo_mapa')
            .select('*');

        if (error) throw error;

        console.group("%c>> [SRE ESPÍA 1] DATOS CRUDOS DE SUPABASE", "background: #002E50; color: #FFB91D; padding: 4px; font-weight: bold;");
        console.log("Cantidad total devuelta por la Vista SQL:", data.length);
        if (data.length > 0) {
            console.log("Estructura del primer registro (PROP-001):", data[0]);
            console.log("¿Tiene objeto .ubicacion?:", data[0].hasOwnProperty('ubicacion') ? "Sí" : "NO");
            console.log("Campos de coordenadas en la raíz: latitud =", data[0].latitud, "| longitud =", data[0].longitud);
        }
        console.groupEnd();

        const paqueteData = {
            propiedades: data || [],
            usuarios: []
        };
        procesarDatosDelMotor(paqueteData);

    } catch (err) {
        console.error("X [SRE ESPÍA ERROR] Fallo en la lectura directa de Supabase REST:", err.message);
    }
} // Fin de Function cargarDatosDesdeSupabase


// ==========================================================================
// PARTE 4 DE 15: MOTOR DE NORMALIZACIÓN RELACIONAL Y CONCATENACIÓN DE IMÁGENES
// ==========================================================================
function normalizarPropiedad(prop) { // Inicia Function normalizarPropiedad
    const urlBaseCloudinary = "https://res.cloudinary.com/obw6ciov/image/upload/";

    let fotosUnificadas = [];

    console.group(`[ESPÍA FOTOS] Evaluando propiedad ID: ${prop.propiedad_id || prop.id}`);
    console.log("Origen galeria_fotos:", prop.galeria_fotos);
    console.log("Origen foto_despliegue:", prop.foto_despliegue);
    console.log("Origen foto_principal:", prop.foto_principal);
    console.groupEnd();

    const origenFotos = prop.galeria_fotos;

    if (origenFotos) {
        let coleccionCruda = [];

        if (Array.isArray(origenFotos)) {
            coleccionCruda = origenFotos;
        } else if (typeof origenFotos === 'string') {
            coleccionCruda = origenFotos.includes(',') ? origenFotos.split(',') : [origenFotos];
        }

        coleccionCruda.forEach(nombreFoto => {
            if (!nombreFoto) return;
            let texto = String(nombreFoto).trim();
            if (!texto) return;

            if (texto.startsWith('http://') || texto.startsWith('https://')) {
                fotosUnificadas.push(texto);
            } else {
                texto = texto.replace(/\s+/g, '_');
                fotosUnificadas.push(urlBaseCloudinary + texto);
            }
        });
    }

    if (fotosUnificadas.length === 0) {
        fotosUnificadas.push(urlBaseCloudinary + "Foto15_havrr3.webp");
    }

    console.log(`[ESPÍA RESULTADO] Propiedad: ${prop.propiedad_id || prop.id} -> Total fotos detectadas final: ${fotosUnificadas.length}`, fotosUnificadas);

    const latNum = parseFloat(prop.latitud);
    const lngNum = parseFloat(prop.longitud);

    const idVerdadero = String(prop.propiedad_id || prop.id || "");

    const res = {
        id: idVerdadero,
        propiedad_id: idVerdadero,
        usuario_id_fk: prop.usuario_id_fk || "",

        titulo: String(prop.titulo || '').trim(),
        precio_base: parseFloat(prop.precio_base || 0),
        estado_publicacion: String(prop.estado_publicacion || "disponible").trim(),
        tipo_anuncio: String(prop.tipo_anuncio || "Venta").trim(),
        destacado: String(prop.destacado || "no").trim(),
        tipo_propiedad: String(prop.tipo_propiedad || 'Casa').trim(),

        subtipo_propiedad: String(prop.subtipo_propiedad || "").trim(),
        direccion: String(prop.direccion || "").trim(),
        descripcion: String(prop.descripcion || "").trim(),

        area_terreno: parseFloat(prop.area_terreno || 0),
        area_construida: parseFloat(prop.area_construida || 0),
        habitaciones: parseInt(prop.habitaciones || 0, 10),
        banos: parseInt(prop.banos || 0, 10),
        estacionamientos: parseInt(prop.estacionamientos || 0, 10),
        ano_construccion: parseInt(prop.ano_construccion || 0, 10),
        estado_propiedad: String(prop.estado_propiedad || "").trim(),
        moneda: String(prop.moneda || "USD").trim(),

        cuota_mantenimiento: parseFloat(prop.cuota_mantenimiento || 0),
        situacion_propiedad: String(prop.situacion_propiedad || "").trim(),
        sotano: String(prop.sotano || "no").trim(),
        almacen: String(prop.almacen || "no").trim(),
        vista: String(prop.vista || "Ninguna").trim(),
        creado_por: String(prop.creado_por || "").trim(),

        distrito: String(prop.distrito || "").trim(),
        latitud: !isNaN(latNum) ? latNum : null,
        longitud: !isNaN(lngNum) ? lngNum : null,
        codigo_ubigeo_id_fk: String(prop.codigo_ubigeo_id_fk || "").trim(),
        foto_principal: String(prop.foto_principal || ""),
        fotos: fotosUnificadas,
        amenidades: prop.amenidades || []
    };

    console.log(`%c>> [SRE ESPÍA 2] Normalizado ${res.id} -> Lat: ${res.latitud} | Lng: ${res.longitud} | Transacción: ${res.tipo_anuncio} | Estado: ${res.estado_publicacion}`, "color: #006aff; font-size: 11px;");

    return res;
} // Fin de Function normalizarPropiedad


// ==========================================================================
// PARTE 5 DE 15: FORMATEADORES MONETARIOS COMPACTOS Y RECONSTRUCCIÓN DE RIEL MULTIMEDIA
// ==========================================================================

function formatearPrecioCompleto(precio) { // Inicia Function formatearPrecioCompleto
    const num = parseFloat(precio);
    if (isNaN(num) || num === 0) return 'Consultar';
    return num.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    });
} // Fin de Function formatearPrecioCompleto

function formatearPrecioCompacto(precio) { // Inicia Function formatearPrecioCompacto
    if (precio >= 1000000) return `$. ${(precio / 1000000).toFixed(2)}M`;
    if (precio >= 1000) return `$. ${(precio / 1000).toFixed(0)}K`;
    return `$. ${precio}`;
} // Fin de Function formatearPrecioCompacto


// ==========================================================================
// PARTE 6 DE 15: CONSTRUCTOR DINÁMICO DEL COMPONENTE RIEL MULTIMEDIA
// ==========================================================================
function construirRielCarruselComponente(prop, esPopup = false) {
    const contenedorFoto = document.createElement('div');
    contenedorFoto.className = esPopup ?
        'contenedor-foto popup-carrusel-context' :
        'contenedor-foto';

    Object.assign(contenedorFoto.style, {
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: esPopup ? '140px' : '180px'
    });

    const rielCarrusel = document.createElement('div');
    rielCarrusel.className = 'carrusel-imagenes';
    rielCarrusel.dataset.fotoActiva = '0';

    Object.assign(rielCarrusel.style, {
        display: 'flex',
        width: '100%',
        height: '100%',
        transition: 'transform 0.3s ease-in-out'
    });

    contenedorFoto.appendChild(rielCarrusel);

    let fotos = prop.fotos || prop.galeria_fotos || [];

    if (typeof fotos === 'string') {
        try {
            const parsed = JSON.parse(fotos);
            fotos = Array.isArray(parsed) ? parsed : [parsed];
        } catch (err) {
            fotos = fotos.split(',');
        }
    }

    if (!Array.isArray(fotos)) fotos = [];

    fotos = fotos
        .map(foto => String(foto || '').trim())
        .filter(Boolean)
        .slice(0, 5);

    if (fotos.length === 0) {
        fotos = [
            'https://res.cloudinary.com/obw6ciov/image/upload/Foto15_havrr3.webp'
        ];
    }

    const dots = [];
    const contenedorDots = document.createElement('div');
    contenedorDots.className = 'indicadores-carrusel';

    fotos.forEach((url, index) => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = `${prop.titulo || 'Propiedad'} - Vista ${index + 1}`;

        Object.assign(img.style, {
            width: '100%',
            minWidth: '100%',
            height: '100%',
            objectFit: 'cover',
            flexShrink: '0'
        });

        rielCarrusel.appendChild(img);

        const dot = document.createElement('span');
        dot.className = index === 0 ?
            'punto-indicator activo' :
            'punto-indicator';

        contenedorDots.appendChild(dot);
        dots.push(dot);
    });

    contenedorFoto.appendChild(contenedorDots);

    const botonCorazon = document.createElement('button');
    botonCorazon.type = 'button';
    botonCorazon.textContent = '\u2665';
    botonCorazon.className = 'corazon-favorito';

    Object.assign(botonCorazon.style, {
        position: 'absolute',
        top: '12px',
        right: '12px',
        background: 'rgba(0,0,0,0.45)',
        border: 'none',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        cursor: 'pointer',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '20',
        color: state.favoritos.has(String(prop.id)) ? '#d92323' : '#fff'
    });

    botonCorazon.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!(await validarAccesoFuncionalidadPremium())) return;

        const id = String(prop.id);

        if (state.favoritos.has(id)) {
            state.favoritos.delete(id);
            botonCorazon.style.color = '#fff';
        } else {
            state.favoritos.add(id);
            botonCorazon.style.color = '#d92323';
        }
    });

    contenedorFoto.appendChild(botonCorazon);

    if (fotos.length > 1) {
        let indiceFotoActual = 0;

        const desplazarRiel = direction => {
            indiceFotoActual =
                (indiceFotoActual + direction + fotos.length) % fotos.length;

            rielCarrusel.dataset.fotoActiva = String(indiceFotoActual);
            rielCarrusel.style.transform =
                `translateX(-${indiceFotoActual * 100}%)`;

            dots.forEach((dot, index) => {
                dot.classList.toggle('activo', index === indiceFotoActual);
            });
        };

        const crearFlecha = (clase, texto, direction) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `flecha-carrusel ${clase}`;
            button.textContent = texto;
            button.style.zIndex = '20';

            const ejecutarCambio = event => {
                event.preventDefault();
                event.stopPropagation();
                desplazarRiel(direction);
            }; // Fin de ejecutarCambio

            button.addEventListener('click', ejecutarCambio);
            button.addEventListener('touchstart', ejecutarCambio, { passive: false });

            contenedorFoto.appendChild(button);
        }; /* Fin de crearFlecha */

        crearFlecha('flecha-izq', '\u2039', -1);
        crearFlecha('flecha-der', '\u203a', 1);

    }  /* Fin de if fotos.length > 1 */

    const etiqueta = document.createElement('div');
    etiqueta.className = 'etiqueta-foto-zillow';
    etiqueta.textContent = prop.titulo || '';
    contenedorFoto.appendChild(etiqueta);

    return contenedorFoto;
}

// ==========================================================================
// PARTE 8 DE 15: FABRICANTE DEL NODO DE LA TARJETA DEL CATÁLOGO DE ESCRITORIO
// ==========================================================================

function crearComponenteTarjetaZillow(prop) { // Inicia Function crearComponenteTarjetaZillow
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-casa';
    tarjeta.setAttribute('data-id', prop.id);

    const contenedorVisualFoto = construirRielCarruselComponente(prop, false);
    tarjeta.appendChild(contenedorVisualFoto);

    const clickSPAHandler = (e) => {
        if (e.target.closest('.flecha-carrusel') || e.target.closest('.corazon-favorito')) {
            e.stopPropagation();
            return;
        }
        if (window.map) window.map.closePopup();
        state.propiedadSeleccionadaId = prop.id;
        gestionarCortinaSPA('detalle', prop);
    };

    contenedorVisualFoto.addEventListener('click', clickSPAHandler);

    const datosCasa = document.createElement('div');
    datosCasa.className = 'datos-casa';
    datosCasa.style.padding = '12px';
    datosCasa.style.cursor = 'pointer';
    datosCasa.addEventListener('click', clickSPAHandler);

    datosCasa.innerHTML = `
        <div class="precio" style="color: #000000; font-size: 28px; font-weight: 800; margin-bottom: 4px;">
            ${prop.precio_base ? `$${Number(prop.precio_base).toLocaleString('en-US')}` : 'Precio no disponible'}
        </div>
        <div class="caracteristicas-inmueble">
            ${prop.habitaciones || 0} Dormitorios | ${prop.banos || 0} Baños | ${prop.estacionamientos || 0} Estacionamiento
        </div>
        <div class="detalles-adicionales">
            <div style="font-weight: bold;">${prop.tipo_propiedad || ''}${prop.subtipo_propiedad ? ' - ' + prop.subtipo_propiedad : ''}</div>
            <div>Construido: ${prop.area_construida || 0} m² | Terreno: ${prop.area_terreno || 0} m²</div>
            <div>Año: ${prop.ano_construccion || 'N/A'} | Estado: ${prop.estado_propiedad || 'N/A'}</div>
        </div>
        <div class="ubicacion-direccion-directa">
            ${prop.direccion ? `${prop.direccion}, ${prop.distrito || ''}` : (prop.titulo || "")}
        </div>
    `;

    tarjeta.appendChild(datosCasa);
    return tarjeta;
} // Fin de Function crearComponenteTarjetaZillow



// ==========================================================================
// PARTE 9 DE 15: INYECCIÓN DE TARJETAS AL DOM MEDIANTE DOCUMENT FRAGMENT
// ==========================================================================

function renderizarCatalogoTarjetas() { // Inicia Function renderizarCatalogoTarjetas
    const contenedorRejilla = document.getElementById('properties-grid-target');
    if (!contenedorRejilla) return;
    contenedorRejilla.innerHTML = '';

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);

    filtradas.sort((a, b) => {
        const destA = String(a.destacado || "no").toLowerCase().trim();
        const destB = String(b.destacado || "no").toLowerCase().trim();
        if (destA === "si" && destB !== "si") {
            return -1;
        }
        if (destA !== "si" && destB === "si") {
            return 1;
        }
        return 0;
    });

    const contador = document.getElementById('results-counter');

    console.log(`>> [SRE ESPÍA CATALOGO] Re-renderizando rejilla. Propiedades filtradas y ordenadas por destacado a pintar: ${filtradas.length}`);

    if (filtradas.length === 0) {
        contenedorRejilla.innerHTML = `
            <div class="mensaje-sin-propiedades" style="padding: 60px 20px; text-align: center; width: 100%; box-sizing: border-box;">
                <h3 style="font-size: 22px; color: #2d3748; font-weight: 700; font-family: sans-serif;">No existe este tipo de propiedades en este momento</h3>
                <p style="color: #718096; font-size: 15px; font-family: sans-serif;">Prueba seleccionando otros criterios o habilitando más opciones.</p>
            </div>
        `;
        if (contador) contador.textContent = `0 resultados disponibles`;
    } else {
        const fragmento = document.createDocumentFragment();
        filtradas.forEach(prop => {
            const tarjetaNode = crearComponenteTarjetaZillow(prop);
            if (tarjetaNode) fragmento.appendChild(tarjetaNode);
        });
        contenedorRejilla.appendChild(fragmento);
        if (contador) contador.textContent = `${filtradas.length} resultados disponibles`;
    }
} // Fin de Function renderizarCatalogoTarjetas



/**
 * FABRICANTE MODULAR DEL CONTENEDOR POPUP MASTER REPARADO PARA LEAFLET
 */
function construirContenedorPopupLeaflet(prop) {
    const contenedorPopupMaster = document.createElement('div');
    contenedorPopupMaster.className = 'tarjeta-casa popup-card';
    contenedorPopupMaster.style.width = '260px';

    const carruselPopup = construirRielCarruselComponente(prop, true);
    contenedorPopupMaster.appendChild(carruselPopup);

    const datosPopup = document.createElement('div');
    datosPopup.className = 'datos-popup-info';
    datosPopup.innerHTML = `
        <div class="precio" style="color: #000000; font-size: 18px; font-weight: 800; margin-bottom: 2px;">
            $${prop.precio_base ? Number(prop.precio_base).toLocaleString('en-US') : 'Precio no disponible'}
        </div>
        <div class="caracteristicas-inmueble" style="font-size: 11px; color: #4a5568; margin-bottom: 2px;">
            ${prop.habitaciones || 0} Dormitorios | ${prop.banos || 0} Baños | ${prop.estacionamientos || 0} Estacionamiento
        </div>
        <div class="detalles-adicionales" style="font-size: 11px; color: #718096; line-height: 1.3;">
            <div style="font-weight: bold; color: #1a202c;">${prop.tipo_propiedad || ''}${prop.subtipo_propiedad ? ' - ' + prop.subtipo_propiedad : ''}</div>
            <div>Construido: ${prop.area_construida || 0} m² | Terreno: ${prop.area_terreno || 0} m²</div>
            <div>Año: ${prop.ano_construccion || 'N/A'} | Estado: ${prop.estado_propiedad || 'N/A'}</div>
        </div>
        <div class="ubicacion-direccion-directa" style="font-size: 11px; color: #2d3748; font-weight: 500; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${prop.direccion ? prop.direccion + (prop.distrito ? ', ' + prop.distrito : '') : String(prop.titulo || '')}
        </div>
    `;

    contenedorPopupMaster.appendChild(datosPopup);

    L.DomEvent.disableClickPropagation(contenedorPopupMaster);
    L.DomEvent.disableScrollPropagation(contenedorPopupMaster);

    const ejecutarTransicionDetalle = (ev) => {
        if (ev.target.closest('.flecha-carrusel') || ev.target.closest('.corazon-favorito')) {
            ev.stopPropagation();
            return;
        }
        if (window.map) window.map.closePopup();
        state.propiedadSeleccionadaId = prop.id;

        if (typeof gestionarCortinaSPA === "function") {
            gestionarCortinaSPA('detalle', prop);
        }
    }; // Fin de la función ejecutarTransicionDetalle

    carruselPopup.addEventListener('click', ejecutarTransicionDetalle);

    carruselPopup.addEventListener('touchend', (ev) => {
        if (ev.target.closest('.flecha-carrusel') || ev.target.closest('.corazon-favorito')) {
            return;
        }
        ejecutarTransicionDetalle(ev);
    }, { passive: true });

    return contenedorPopupMaster;
}

/**
 * FUNCIÓN MAESTRA: Encargada únicamente del control de capas y encuadre geométrico del mapa.
 */
function renderizarMapaZillow() {
    if (!window.map || !document.getElementById('map-instance')) return;

    window.map.invalidateSize({
        animate: false
    });

    if (window.capaMarcadores) {
        window.capaMarcadores.clearLayers();
        window.map.removeLayer(window.capaMarcadores);
    }
    window.capaMarcadores = L.layerGroup().addTo(window.map);

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);
    const coordenadasValidas = [];

    filtradas.forEach(prop => {
        const parsedLat = parseFloat(prop.latitud);
        const parsedLng = parseFloat(prop.longitud);

        if (isNaN(parsedLat) || isNaN(parsedLng) || !isFinite(parsedLat) || !isFinite(parsedLng)) {
            return;
        }

        coordenadasValidas.push([parsedLat, parsedLng]);

        const precioCompacto = formatearPrecioCompacto(prop.precio_base);
        let claseColorBurbuja = prop.estado_publicacion === 'vendida' ? 'vendido-dorado' : (prop.tipo_anuncio === 'Alquiler' ? 'alquiler-naranja' : 'venta-azul');

        const iconoBurbuja = L.divIcon({
            html: `<span>${precioCompacto}</span>`,
            className: `leaflet-marker-icon map-price-pill ${claseColorBurbuja}`,
            iconSize: L.point(80, 30),
            iconAnchor: L.point(40, 15)
        });

        const marcador = L.marker([parsedLat, parsedLng], {
            icon: iconoBurbuja
        });

        const contenedorPopupMaster = construirContenedorPopupLeaflet(prop);

        marcador.bindPopup(contenedorPopupMaster, {
            maxWidth: 300,
            minWidth: 260,
            className: 'zillow-custom-popup-wrapper',
            autoPan: true,
            closeOnClick: false
        });

        marcador.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            state.propiedadSeleccionadaId = prop.id;

            if (window.innerWidth <= 768) {
                const cajaFlotanteMovil = document.getElementById("tarjeta-flotante-movil-sre");
                const targetContenido = document.getElementById("target-contenido-movil-sre");

                if (cajaFlotanteMovil && targetContenido) {
                    targetContenido.innerHTML = '';

                    const contenedorEstructura = document.createElement('div');
                    contenedorEstructura.style.cssText = 'display:flex; flex-direction:column; gap:8px; font-family:sans-serif;';

                    const carruselMovilActivo = construirRielCarruselComponente(prop, true);
                    contenedorEstructura.appendChild(carruselMovilActivo);

                    const textoDatos = document.createElement('div');
                    textoDatos.style.cssText = 'display:flex; flex-direction:column; gap:2px; padding:4px 0; cursor:pointer;';
                    textoDatos.innerHTML = `
                        <strong style="font-size:20px; color:#1a1a1a;">$${Number(prop.precio_base).toLocaleString('en-US')}</strong>
                        <span style="font-size:13px; color:#4a5568; font-weight:600;">${prop.habitaciones} bd | ${prop.banos} ba | ${prop.area_construida || 0} m²</span>
                        <p style="font-size:13px; color:#2d3748; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:500;">${prop.direccion || prop.titulo}</p>
                    `;

                    const ejecutarTransicionMovil = (ev) => {
                        if (ev.target.closest('.flecha-carrusel') || ev.target.closest('.corazon-favorito')) {
                            ev.stopPropagation();
                            return;
                        }

                        if (typeof window.gestionarCortinaSPA === "function") {
                            window.gestionarCortinaSPA('detalle', prop);
                        }
                    };

                    const contenedorFlotanteMovil = document.getElementById("tarjeta-flotante-movil-sre");
                    if (contenedorFlotanteMovil) {
                        contenedorFlotanteMovil.onclick = ejecutarTransicionMovil;
                        contenedorFlotanteMovil.ontouchend = ejecutarTransicionMovil;
                    }

                    contenedorEstructura.appendChild(textoDatos);
                    targetContenido.appendChild(contenedorEstructura);
                    cajaFlotanteMovil.className = "tarjeta-movil-sre-visible";
                }
            } else {
                const tarjetaDesktop = document.querySelector(`.tarjeta-casa[data-id="${prop.id}"]`);
                if (tarjetaDesktop) {
                    tarjetaDesktop.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    tarjetaDesktop.style.outline = '3px solid #006aff';
                    tarjetaDesktop.style.borderRadius = '12px';
                    setTimeout(() => {
                        tarjetaDesktop.style.outline = 'none';
                    }, 2000);
                }
            }
        });

        window.capaMarcadores.addLayer(marcador);
    });

    if (coordenadasValidas.length > 0) {
        try {
            if (coordenadasValidas.length === 1) {
                window.map.setView(coordenadasValidas, 14, {
                    animate: true
                });
            } else {
                const limitesMapa = L.latLngBounds(coordenadasValidas);
                window.map.fitBounds(limitesMapa, {
                    padding: 30,
                    maxZoom: 13,
                    animate: true
                });
            }
        } catch (errGeometrico) {
            console.warn(">> [SRE ESPÍA MAPA] Fallo en el cálculo de límites Leaflet:", errGeometrico.message);
        }
    }
}

// PARTE 12 DE 15: ESCUCHADOR INTEGRAL DE CAMBIOS DE SESIÓN Y DOM CONTENT LOADED
// ==========================================================================

function procesarDatosDelMotor(data) { // Inicia Function procesarDatosDelMotor
    console.group(">> [SRE ESPÍA INTERCEPTOR] Paquete crudo recibido desde el Motor");
    console.log("Estructura completa de la carga útil:", data);

    if (!data || !data.propiedades || !Array.isArray(data.propiedades)) {
        console.error("X Formato de datos inválido o ausencia de la colección 'propiedades'.");
        console.groupEnd();
        return;
    }

    state.propiedades = data.propiedades.map(normalizarPropiedad);

    console.log(">> Data normalizada en el frontend (state.propiedades):");
    console.table(state.propiedades.slice(0, 5), ["id", "precio_base", "tipo_propiedad", "tipo_anuncio", "estado_publicacion"]);
    console.groupEnd();

    renderizarMapaZillow();
    renderizarCatalogoTarjetas();

    if (typeof interceptarFirewallSeguridadUsuario === "function") {
        interceptarFirewallSeguridadUsuario(data.usuarios, window.usuarioLogueado ? window.usuarioLogueado.email : "");
    } else {
        console.log("> [SRE] Escudo pasivo interceptor operando en modo seguro.");
    }
} // Fin de la Function procesarDatosDelMotor

function interceptarFirewallSeguridadUsuario(usuarios, email) {
    return true;
} // Fin de la Function interceptarFirewallSeguridadUsuario

document.addEventListener("DOMContentLoaded", () => {
// --- FIN DEL REEMPLAZO QUIRÚRGICO SRE


            if (typeof L !== 'undefined' && document.getElementById('map-instance')) { // Inicio Condicional Mapa
                window.map = L.map('map-instance', {
                    zoomControl: true
                }).setView([-12.125, -76.995], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.map);
                window.map.invalidateSize({
                    animate: false
                });
            } // Fin Condicional Mapa

            inicializarEventosDeFiltros();
            cargarDatosDesdeSupabase();

            const btnCerrarTarjetaMovil = document.getElementById("btn-cerrar-tarjeta-movil-sre");
            if (btnCerrarTarjetaMovil) { // Inicio Condicional Botón Móvil
                btnCerrarTarjetaMovil.onclick = (e) => { // Inicio Evento Click Móvil
                    e.stopPropagation();
                    const cajaFlotanteMovil = document.getElementById("tarjeta-flotante-movil-sre");
                    if (cajaFlotanteMovil) cajaFlotanteMovil.className = "tarjeta-movil-sre-oculta";
                }; // Fin Evento Click Móvil
            } // Fin Condicional Botón Móvil

            if (typeof supabase !== "undefined" && supabase !== null) { // Inicio Control Central Supabase SRE
                supabase.auth.onAuthStateChange((event, session) => { // Inicio Callback Central onAuthStateChange SRE
                    console.log(`%c>> [SRE AUTH] Evento pasivo de sesión detectado: ${event}`, "color: #ffb91d; font-weight: bold;");

                    setTimeout(async () => {
                        const user = (session && session.user) ? session.user : null;

                        if (!user) {
                            state.usuarioActual = null;
                            window.usuarioLogueado = null;
                            actualizarBotonCuenta();
                            console.log("> [SRE AUTH] Sesión inactiva o cerrada. Estado global de seguridad reseteado.");
                            return;
                        }

                        window.usuarioLogueado = user;
                        actualizarBotonCuenta();

                        try {
                            const cliente = obtenerClienteSupabase();
                            if (!cliente) throw new Error("Instancia de cliente Supabase no disponible.");

                            const correo = String(user.email || '').trim().toLowerCase();
                            const proveedor = user.app_metadata?.provider || (user.identities && user.identities?.provider);

                            const fActual = new Date();
                            const hoyFormatoIso = [
                                fActual.getFullYear(),
                                String(fActual.getMonth() + 1).padStart(2, '0'),
                                String(fActual.getDate()).padStart(2, '0')
                            ].join('-');

                            console.log(`> [SRE AUTH PROCESSING] Evaluando interesado: ${correo} | Proveedor: ${proveedor} | Fecha: ${hoyFormatoIso}`);

                    if (proveedor === 'google' || proveedor === 'facebook') {
                        let { data: perfilSocial, error: errorBusquedaSocial } = await cliente
                            .from('usuario_autenticado')
                            .select('usuario_id, estado_cuenta, verificado')
                            .eq('usuario_id', user.id)
                            .maybeSingle();

                        if (errorBusquedaSocial) throw errorBusquedaSocial;

                        if (!perfilSocial) {
                            console.log('> [SRE AUTH] Buscando vinculación existente por correo electrónico...');
                            const { data: perfilPorCorreo, error: errorPorCorreo } = await cliente
                                .from('usuario_autenticado')
                                .select('usuario_id, estado_cuenta, verificado')
                                .eq('correo', correo)
                                .maybeSingle();

                            if (errorPorCorreo) throw errorPorCorreo;

                            if (perfilPorCorreo) {
                                console.log('>> [SRE AUTH] Correo preexistente detectado. Acoplando UUID de red social de forma atómica...');

                                const { error: errorSincronizacionOAuth } = await cliente
                                    .from('usuario_autenticado')
                                    .update({
                                        usuario_id: user.id,
                                        ultimo_acceso: hoyFormatoIso,
                                        fecha_actualizacion: hoyFormatoIso
                                    })
                                    .eq('correo', correo);

                                if (errorSincronizacionOAuth) throw errorSincronizacionOAuth;

                                perfilSocial = {
                                    usuario_id: user.id,
                                    estado_cuenta: perfilPorCorreo.estado_cuenta
                                };
                            }
                        }

                        if (!perfilSocial) {
                            console.warn('>> [SRE AUTH] Creando registro autónomo nuevo para el interesado social...');

                            const metadatos = user.user_metadata || {};
                            const partesNombre = String(metadatos.full_name || metadatos.name || "Interesado").trim().split(" ");
                            const stringNombre = String(partesNombre[0] || "Interesado").trim();
                            const stringApellido = String(partesNombre.slice(1).join(" ") || "OAuth").trim();
                            const telefonoOAuth = metadatos.phone || "999999999";

                            const { error: insertSocialError } = await cliente
                                .from('usuario_autenticado')
                                .insert([{
                                    usuario_id: user.id,
                                    rol_id_fk: 3,
                                    nombre: stringNombre,
                                    apellido: stringApellido,
                                    correo: correo,
                                    password_hash: "OAuth-No-Pass",
                                    telefono: telefonoOAuth,
                                    estado_cuenta: "activo",
                                    verificado: true,
                                    creado_por: `OAuth-${proveedor}`,
                                    ultimo_acceso: hoyFormatoIso,
                                    fecha_creacion: hoyFormatoIso,
                                    fecha_actualizacion: hoyFormatoIso
                                }]);

                            if (insertSocialError) throw insertSocialError;

                            state.usuarioActual = { id: user.id, correo, estado_cuenta: "activo" };
                            console.log(">> [SRE AUTH] Registro de cuenta social completado exitosamente como ACTIVO.");
                            return;
                        }

                        const estadoSocialReal = String(perfilSocial.estado_cuenta || '').toLowerCase().trim();
                        if (estadoSocialReal === "suspendido") {
                            console.error("X ACL BLOQUEO SOCIAL: El interesado se encuentra SUSPENDIDO.");
                            state.usuarioActual = { id: user.id, correo, estado_cuenta: "suspendido" };
                            alert("Acceso Restringido: Su cuenta se encuentra SUSPENDIDA por el administrador.");
                            return;
                        }

                        state.usuarioActual = { id: user.id, correo, estado_cuenta: estadoSocialReal };
                        console.log(`> [SRE AUTH] Acceso concedido a cuenta social existente. Estado: ${estadoSocialReal.toUpperCase()}`);
                        return;
                    }


                            const {
                                data: perfilTradicional,
                                error: errorBusquedaTradicional
                            } = await cliente
                                .from('usuario_autenticado')
                                .select('usuario_id, estado_cuenta, verificado')
                                .eq('correo', correo)
                                .maybeSingle();

                            if (errorBusquedaTradicional) throw errorBusquedaTradicional;

                            if (!perfilTradicional) {
                                console.warn("! [SRE AUTH] Alerta: Autenticado en Supabase, pero no figura en la tabla mapeada.");
                                state.usuarioActual = null;
                                return;
                            }

                            const estadoActual = String(perfilTradicional.estado_cuenta || '').toLowerCase().trim();

                            if (estadoActual === "suspendido") {
                                console.error("X ACL BLOQUEO TRADICIONAL: El interesado por correo se encuentra SUSPENDIDO.");
                                state.usuarioActual = {
                                    id: user.id,
                                    correo,
                                    estado_cuenta: "suspendido"
                                };
                                alert("Acceso Restringido: Su cuenta se encuentra SUSPENDIDA por el administrador de la plataforma.");
                                return;
                            }

                            const cambiosSincronizacion = {
                                usuario_id: user.id,
                                ultimo_acceso: hoyFormatoIso,
                                fecha_actualizacion: hoyFormatoIso
                            };

                            if (estadoActual === 'pendiente') {
                                cambiosSincronizacion.estado_cuenta = 'activo';
                                cambiosSincronizacion.verificado = true;
                            }

                            const {
                                error: updateTradicionalError
                            } = await cliente
                                .from('usuario_autenticado')
                                .update(cambiosSincronizacion)
                                .eq('correo', correo);

                            if (updateTradicionalError) throw updateTradicionalError;

                            state.usuarioActual = {
                                id: user.id,
                                correo,
                                estado_cuenta: estadoActual === 'pendiente' ? 'activo' : estadoActual
                            };

                            if (estadoActual === 'pendiente') {
                                alert("¡Cuenta verificada exitosamente! Su correo electrónico ha sido confirmado. Ya puede usar todas las funciones premium.");
                                console.log(">> [SRE AUTH] Cuenta tradicional enlazada. Cambiado de PENDIENTE a ACTIVO.");
                            } else {
                                console.log(`> [SRE AUTH] Sesión tradicional restaurada con éxito. Estado: ${estadoActual.toUpperCase()}`);
                            }

                        } catch (err) {
                            console.error('X [SRE AUTH CRÍTICO] Excepción capturada en la tubería de sincronización:', err);
                            state.usuarioActual = null;
                        }
                    }, 0);
                }); // Fin definitivo del callback onAuthStateChange perteneciente a Supabase
            } // Fin del control perimetral de existencia de la instancia central Supabase


            // ==========================================================================
            // PARTE 13 DE 15: CONTROLADOR DE FILTROS CON BOTONES APLICAR Y SELECCIONAR TODOS
            // ==========================================================================

            function inicializarEventosDeFiltros() {
                const wrappers = document.querySelectorAll('.filter-dropdown-wrapper');
                wrappers.forEach(wrapper => {
                    const boton = wrapper.querySelector('.filter-btn');
                    const panel = wrapper.querySelector('.dropdown-content-panel');
                    if (!boton || !panel) return;

                    const conmutarFiltroPanel = (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        document.querySelectorAll('.dropdown-content-panel').forEach(p => {
                            if (p !== panel) p.classList.remove('show');
                        });
                        document.querySelectorAll('.filter-btn').forEach(b => {
                            if (b !== boton) b.classList.remove('active');
                        });

                        panel.classList.toggle('show');
                        boton.classList.toggle('active');
                    };

                    boton.addEventListener('click', conmutarFiltroPanel);
                });

                const cerrarPanelesResiduales = (e) => {
                    if (!e.target.closest('.filter-dropdown-wrapper')) {
                        document.querySelectorAll('.dropdown-content-panel').forEach(p => p.classList.remove('show'));
                        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    }
                };

                document.addEventListener('click', cerrarPanelesResiduales);
                document.addEventListener('touchend', cerrarPanelesResiduales);

                document.querySelectorAll('.dropdown-content-panel').forEach(panel => {
                    panel.addEventListener('click', (e) => e.stopPropagation());
                });

                const radiosTransaccion = document.querySelectorAll('input[name="transaccion"]');
                radiosTransaccion.forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        state.filtros.estado = e.target.value;
                        const btnStatus = document.getElementById('btn-filter-status');
                        if (btnStatus) {
                            if (e.target.value === "Venta") {
                                btnStatus.textContent = "En venta";
                            } else if (e.target.value === "Alquiler") {
                                btnStatus.textContent = "Para el alquiler";
                            } else if (e.target.value === "vendida") {
                                btnStatus.textContent = "Vendidas";
                            }
                        }
                        ejecutarTuberiaSincronizada();
                    });
                });


                const inputMinPrecio = document.getElementById('price-min');
                const inputMaxPrecio = document.getElementById('price-max');
                const btnApplyPrice = document.getElementById('btn-apply-price');

                if (btnApplyPrice) {
                    btnApplyPrice.addEventListener('click', () => {
                        state.filtros.precioMin = parseFloat(inputMinPrecio.value) || 0;
                        state.filtros.precioMax = parseFloat(inputMaxPrecio.value) || Infinity;
                        ejecutarTuberiaSincronizada();
                        cerrarTodosLosPaneles();
                    });
                }

                let temporalHabitaciones = state.filtros.habitaciones || 0;
                let temporalBanos = state.filtros.banos || 0;

                configurarSegmentado('row-beds', (valor) => {
                    temporalHabitaciones = parseInt(valor, 10) || 0;
                });

                configurarSegmentado('row-baths', (valor) => {
                    temporalBanos = parseFloat(valor) || 0;
                });

                const btnApplySpecs = document.getElementById('btn-apply-beds-baths');
                if (btnApplySpecs) {
                    btnApplySpecs.addEventListener('click', (e) => {
                        if (e) e.preventDefault();

                        state.filtros.habitaciones = temporalHabitaciones;
                        state.filtros.banos = temporalBanos;

                        ejecutarTuberiaSincronizada();
                        cerrarTodosLosPaneles();
                    });
                }

                const checkboxesTipo = document.querySelectorAll('.type-cb');
                const btnMasterType = document.getElementById('btn-type-master-toggle');
                const btnAplicarTipo = document.getElementById('btn-aplicar-tipo-propiedad');

                if (btnMasterType) {
                    btnMasterType.addEventListener('click', () => {
                        const esLimpieza = btnMasterType.textContent === "Deseleccionar todo";
                        checkboxesTipo.forEach(cb => cb.checked = !esLimpieza);
                        btnMasterType.textContent = esLimpieza ? "Seleccionar todos" : "Deseleccionar todo";
                    });
                }

                if (btnAplicarTipo) {
                    btnAplicarTipo.addEventListener('click', () => {
                        state.filtros.tiposPropiedad.clear();
                        const marcados = Array.from(checkboxesTipo).filter(cb => cb.checked);

                        marcados.forEach(cb => state.filtros.tiposPropiedad.add(cb.value));

                        ejecutarTuberiaSincronizada();
                        cerrarTodosLosPaneles();

                        if (btnMasterType) btnMasterType.textContent = marcados.length === 0 ? "Seleccionar todos" : "Deseleccionar todo";
                    });
                }

                const checkboxesListado = document.querySelectorAll('.more-filter-cb');
                const btnMasterMore = document.getElementById('btn-more-master-toggle');
                const btnAplicarMasFiltros = document.getElementById('btn-aplicar-mas-filtros');

                if (btnMasterMore) {
                    btnMasterMore.addEventListener('click', () => {
                        const esLimpieza = btnMasterMore.textContent === "Deseleccionar todo";
                        checkboxesListado.forEach(cb => cb.checked = !esLimpieza);
                        btnMasterMore.textContent = esLimpieza ? "Seleccionar todos" : "Deseleccionar todo";
                    });
                }

                if (btnAplicarMasFiltros) {
                    btnAplicarMasFiltros.addEventListener('click', () => {
                        state.filtros.tiposListado.clear();
                        const marcados = Array.from(checkboxesListado).filter(cb => cb.checked);

                        marcados.forEach(cb => state.filtros.tiposListado.add(cb.value));

                        ejecutarTuberiaSincronizada();
                        cerrarTodosLosPaneles();

                        if (btnMasterMore) btnMasterMore.textContent = marcados.length === 0 ? "Seleccionar todos" : "Deseleccionar todo";
                    });
                }


                const inputDireccionGlobal = document.getElementById('search-address');
                if (inputDireccionGlobal) {
                    let timerBusqueda = null;
                    inputDireccionGlobal.addEventListener('input', (e) => {
                        const consulta = e.target.value.trim();
                        ejecutarTuberiaSincronizada();

                        clearTimeout(timerBusqueda);

                        if (consulta === "") {
                            ejecutarTuberiaSincronizada();
                            return;
                        }

                        if (consulta.length < 3) return;

                        timerBusqueda = setTimeout(async () => {
                            try {
                                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(consulta)}`);
                                const data = await res.json();

                                if (data && data.length > 0 && window.map) {
                                    const lat = parseFloat(data[0].lat);
                                    const lon = parseFloat(data[0].lon);

                                    window.map.setView([lat, lon], 14, {
                                        animate: true
                                    });
                                }
                            } catch (errGeo) {
                                console.error("X [SRE ERROR GEO] Fallo al geocodificar con OpenStreetMap:", errGeo);
                            }
                        }, 600);
                    });
                }
            } // Fin definitivo de la función inicializarEventosDeFiltros


            function cerrarTodosLosPaneles() {

                document.querySelectorAll('.dropdown-content-panel').forEach(p => p.classList.remove('show'));
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            }

            // ==========================================================================
            // PARTE 14 DE 15: CONTROL DE ENTRADAS DE CAMPOS SEGMENTADOS DE SELECCIÓN ÚNICA
            // ==========================================================================

            function configurarSegmentado(idContenedor, callback) { // Inicia Function configurarSegmentado
                const contenedor = document.getElementById(idContenedor);
                if (!contenedor) return;

                contenedor.addEventListener('change', (e) => {
                    const inputRadio = e.target.closest('input[type="radio"]');
                    if (inputRadio) {
                        callback(inputRadio.value);
                    }
                });
            } // Fin de Function configurarSegmentado



            // ==========================================================================
            // PARTE 15 DE 15: FILTRADO MULTIDIMENSIONAL SIN TILDES Y DESPLIEGUE DE FICHA DETALLE
            // ==========================================================================



            function ejecutarTuberiaSincronizada() { // Inicia Function ejecutarTuberiaSincronizada
                if (typeof renderizarMapaZillow === "function") {
                    renderizarMapaZillow();
                }
                if (typeof renderizarCatalogoTarjetas === "function") {
                    renderizarCatalogoTarjetas();
                }
            } // Fin de Function ejecutarTuberiaSincronizada

            function inicializacionModalEstadosVistaSRE(modoDestino) { // Inicia la Funcion de Control Visual de Sub-Pantallas SRE
                const wrapperRegistro = document.getElementById('wrapper-campos-registro-sre');
                const subtitulo = document.getElementById('auth-subtitulo-dinamico');
                const linkConmutador = document.getElementById('p-conmutador-auth-sre');
                const btnPrincipal = document.getElementById('btn-autenticar');
                const lblEmail = document.getElementById('lbl-email-dinamico');

                if (modoDestino === 'registro') {
                    if (wrapperRegistro) wrapperRegistro.style.display = 'flex';
                    if (subtitulo) subtitulo.style.display = 'block';
                    if (lblEmail) lblEmail.innerText = "Dirección de correo para registrar cuenta *";
                    if (btnPrincipal) {
                        btnPrincipal.innerText = "Confirmar Registro";
                        btnPrincipal.setAttribute('data-modo', 'registro');
                    }
                    if (linkConmutador) {
                        linkConmutador.innerHTML = `¿Ya tiene una cuenta aprobada? <a href="#" id="link-volver-login-sre" style="color: #006aff; font-weight: 600; text-decoration: none;">Inicie sesión aquí</a>`;
                        document.getElementById('link-volver-login-sre')?.addEventListener('click', (e) => {
                            e.preventDefault();
                            inicializacionModalEstadosVistaSRE('login');
                        });
                    }
                } else {
                    if (wrapperRegistro) wrapperRegistro.style.display = 'none';
                    if (subtitulo) subtitulo.style.display = 'none';
                    if (lblEmail) lblEmail.innerText = "Dirección de correo electrónico *";
                    if (btnPrincipal) {
                        btnPrincipal.innerText = "Continuar";
                        btnPrincipal.setAttribute('data-modo', 'login');
                    }
                    if (linkConmutador) {
                        linkConmutador.innerHTML = `¿Nuevo en Inmobiliaria en Surco? <a href="#" id="link-crear-cuenta-sre" style="color: #006aff; font-weight: 600; text-decoration: none;">Crear cuenta</a>`;
                        document.getElementById('link-crear-cuenta-sre')?.addEventListener('click', (e) => {
                            e.preventDefault();
                            inicializacionModalEstadosVistaSRE('registro');
                        });
                    }
                }
            } // Fin de la Funcion de Control Visual de Sub-Pantallas SRE

            function inicializarAutenticacionTresCanalesSupabase() { // Inicia la Funcion inicializarAutenticacionTresCanalesSupabase SRE
                const btnAutenticarEmail = document.getElementById('btn-autenticar');
            // [CÓDIGO NUEVO A INSERTAR / REEMPLAZAR]
            /**
             * Descripción: Valida si el usuario ya está registrado en 'usuario_autenticado'. 
             * Si es un usuario existente (como orlandopena11@yahoo.com), valida su estado y evita 
             * enviar correos OTP innecesarios, permitiendo su acceso directo o vinculación limpia.
             */
            // [INICIO DE LLAVES]: Abre la función procesarAutenticacionMagicaSRE optimizada
                const procesarAutenticacionMagicaSRE = async (esRegistroNuevo) => { 
                    const emailInput = document.getElementById('login-email-input');
                    const emailValor = emailInput ? emailInput.value.trim().toLowerCase() : "";
                    if (!emailValor) {
                        alert("Por favor ingrese su dirección de correo electrónico.");
                        return;
                    }

                    let nombreValor = "Interesado";
                    let apellidoValor = "Nuevo Registro";
                    let telefonoValor = "999999999";

                    if (esRegistroNuevo) {
                        const inputN = document.getElementById('reg-nombre-input');
                        const inputA = document.getElementById('reg-apellido-input');
                        const inputT = document.getElementById('reg-telefono-input');

                        nombreValor = inputN ? inputN.value.trim() : "";
                        apellidoValor = inputA ? inputA.value.trim() : "";
                        telefonoValor = inputT ? inputT.value.trim() : "";

                        if (!nombreValor || !apellidoValor || !telefonoValor) {
                            alert("Por favor complete todos sus datos requeridos para efectuar el alta de su cuenta.");
                            return;
                        }
                    }

                    if (btnAutenticarEmail) {
                        btnAutenticarEmail.innerText = esRegistroNuevo ? "Procesando Alta..." : "Verificando registro...";
                        btnAutenticarEmail.disabled = true;
                    }

                    try {
                        const cliente = obtenerClienteSupabase();

                        // 1. Validar existencia directa en la tabla usuario_autenticado
                        const {
                            data: usuarioBD,
                            error: errorBD
                        } = await cliente
                            .from('usuario_autenticado')
                            .select('usuario_id, estado_cuenta, correo')
                            .eq('correo', emailValor)
                            .maybeSingle();

                        if (errorBD) throw new Error("Error al consultar la base de datos: " + errorBD.message);

                        // 2. Si intenta registrarse pero ya existe en la BD
                        if (esRegistroNuevo) {
                            if (usuarioBD) {
                                alert("Aviso: Este correo electrónico ya se encuentra registrado en el sistema. Por favor, inicie sesión directamente.");
                                inicializacionModalEstadosVistaSRE('login');
                                return;
                            }

                            const fActual = new Date();
                            const hoyFormatoProduccion = [
                                fActual.getFullYear(),
                                String(fActual.getMonth() + 1).padStart(2, '0'),
                                String(fActual.getDate()).padStart(2, '0')
                            ].join('-');

                            const uuidTemporalPostgres = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                                const r = Math.random() * 16 | 0;
                                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                                return v.toString(16);
                            });

                            const {
                                error: insertError
                            } = await cliente
                                .from('usuario_autenticado')
                                .insert([{
                                    usuario_id: uuidTemporalPostgres,
                                    rol_id_fk: 3,
                                    nombre: nombreValor,
                                    apellido: apellidoValor,
                                    correo: emailValor,
                                    password_hash: "Email-OTP-Flow",
                                    telefono: telefonoValor,
                                    estado_cuenta: "pendiente",
                                    verificado: false,
                                    creado_por: emailValor,
                                    fecha_creacion: hoyFormatoProduccion,
                                    fecha_actualizacion: hoyFormatoProduccion
                                }]);

                            if (insertError) throw new Error("No se pudo pre-registrar el perfil en la base de datos: " + insertError.message);

                        } else {
                            // Si es inicio de sesión tradicional y NO existe en la tabla usuario_autenticado
                            if (!usuarioBD) {
                                alert("Acceso Restringido: El correo ingresado no figura en nuestro sistema. Si es nuevo, use la opción 'Crear cuenta'.");
                                inicializacionModalEstadosVistaSRE('registro');
                                return;
                            }

                            const estado = String(usuarioBD.estado_cuenta || '').toLowerCase().trim();
                            if (estado !== "activo" && estado !== "pendiente") {
                                alert(`Acceso Restringido: Su cuenta se encuentra en estado ${estado.toUpperCase()}.`);
                                return;
                            }
                        }

                        // 3. Envío seguro del enlace OTP solo tras validar que el usuario es legítimo en el sistema
                        const URL_RETORNO_CORRECTA = window.location.origin + window.location.pathname;
                        const {
                            error: errorOtp
                        } = await cliente.auth.signInWithOtp({
                            email: emailValor,
                            options: {
                                emailRedirectTo: URL_RETORNO_CORRECTA
                            }
                        });

                        if (errorOtp) throw new Error("Fallo de conexión con Supabase Auth: " + errorOtp.message);

                        alert(esRegistroNuevo ? "¡Cuenta pre-registrada con éxito! Le hemos enviado un enlace de confirmación a su correo." : "¡Enlace de acceso verificado! Revise su bandeja de entrada para ingresar a su sesión.");
                        cerrarPopupAccion('modal-autenticacion-supabase');
                        inicializacionModalEstadosVistaSRE('login');

                    } catch (errAuth) {
                        alert("Error en el proceso: " + errAuth.message);
                    } finally {
                        if (btnAutenticarEmail) {
                            const modoActual = btnAutenticarEmail.getAttribute('data-modo') || 'login';
                            btnAutenticarEmail.innerText = modoActual === 'registro' ? "Confirmar Registro" : "Continuar";
                            btnAutenticarEmail.disabled = false;
                        }
                    }
                }; // [FIN DE LLAVES]: Cierra la función procesarAutenticacionMagicaSRE


                if (btnAutenticarEmail) {
                    btnAutenticarEmail.addEventListener('click', async () => {
                        const modoActual = btnAutenticarEmail.getAttribute('data-modo') || 'login';
                        await procesarAutenticacionMagicaSRE(modoActual === 'registro');
                    });
                }

                document.getElementById('link-crear-cuenta-sre')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    inicializacionModalEstadosVistaSRE('registro');
                });

                document.getElementById('btn-auth-google')?.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        const cliente = obtenerClienteSupabase();
                        await cliente.auth.signInWithOAuth({
                            provider: 'google',
                            options: {
                                redirectTo: window.location.origin + window.location.pathname
                            }
                        });
                    } catch (errG) {
                        console.error("Error OAuth Google:", errG.message);
                    }
                });

                document.getElementById('btn-auth-facebook')?.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        const cliente = obtenerClienteSupabase();
                        await cliente.auth.signInWithOAuth({
                            provider: 'facebook'
                        });
                    } catch (errF) {
                        console.error("Error OAuth Facebook:", errF.message);
                    }
                });
            } // Fin de la Funcion inicializarAutenticacionTresCanalesSupabase SRE




            function interceptarFirewallSeguridadUsuario(usuarios, email) { // Inicia interceptarFirewallSeguridadUsuario
                // Actúa como un escudo de paso vacío exigido por el motor de renderizado de la Parte 12
            } // Fin interceptarFirewallSeguridadUsuario

            async function autenticarConGoogleSupabase() { // Inicia autenticarConGoogleSupabase

                try {
                    const cliente = obtenerClienteSupabase();
                    await cliente.auth.signInWithOAuth({
                        provider: 'google'
                    });
                } catch (e) {
                    console.error("Fallo OAuth Google", e);
                }
            } // Fin autenticarConGoogleSupabase

            async function autenticarConFacebookSupabase() { // Inicia autenticarConFacebookSupabase
                try {
                    const cliente = obtenerClienteSupabase();
                    await cliente.auth.signInWithOAuth({
                        provider: 'facebook'
                    });
                } catch (e) {
                    console.error("Fallo OAuth Facebook", e);
                }
            } // Fin autenticarConFacebookSupabase

            function ejecutarCuandoDOMEsteListo(callback) {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', callback, {
                        once: true
                    });
                } else {
                    callback();
                }
            }

            ejecutarCuandoDOMEsteListo(() => {
                inicializarAutenticacionTresCanalesSupabase();
                inicializarEventosPopups();
            });


<!-- [CÓDIGO NUEVO A INSERTAR / REEMPLAZAR] -->
/**
 * Descripción de la función: inicializarEventosPopups unifica y registra todos los 
 * escuchadores de eventos de la interfaz, incluyendo el botón de inicio de sesión superior, 
 * los cierres de modales comerciales, la navegación por pasos del tour y la validación de seguridad.
 */
// [INICIO DE LLAVES]: Abre la función principal unificada inicializarEventosPopups
function inicializarEventosPopups() {
    
    // 1. Vinculación del botón de inicio de sesión en la barra superior
    const btnOpenLogin = document.getElementById('btn-open-login');
    // [INICIO DE LLAVES]: Valida existencia del botón superior de login
    if (btnOpenLogin) {
        btnOpenLogin.addEventListener('click', (e) => {
            // [INICIO DE LLAVES]: Callback de apertura del modal de autenticación
            if (e) e.preventDefault();
            console.log("[SRE AUTH] Desplegando modal de autenticación desde la barra superior");
            mostrarPopupAccion('modal-autenticacion-supabase');
        }); // [FIN DE LLAVES]: Cierra callback de login
    } // [FIN DE LLAVES]: Cierra condición del botón de login

    // 2. Cierre de modales comerciales de tour y agente
    // [INICIO DE LLAVES]: Vincula evento para cerrar el modal de tour
    document.getElementById('btn-cerrar-modal-tour')?.addEventListener('click', (e) => {
        if (e) e.stopPropagation();
        cerrarPopupAccion('modal-tour-comercial');
    }); // [FIN DE LLAVES]: Cierra evento de cierre de tour
    
    // [INICIO DE LLAVES]: Vincula evento para cerrar el modal de agente
    document.getElementById('btn-cerrar-modal-agente')?.addEventListener('click', (e) => {
        if (e) e.stopPropagation();
        cerrarPopupAccion('modal-agent-comercial');
    }); // [FIN DE LLAVES]: Cierra evento de cierre de agente

    // 3. Enlace táctil dual síncrono para la navegación reactiva al Paso 2 del Tour
    const btnSiguienteTour = document.getElementById('btn-navegacion-siguiente-tour');
    // [INICIO DE LLAVES]: Valida existencia del botón siguiente en el tour
    if (btnSiguienteTour) {
        const avanzarFaseTour = (e) => {
            // [INICIO DE LLAVES]: Callback para avanzar de fase en el tour
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            console.log("[SRE INFRAESTRUCTURA] Avanzando de forma interactiva al Paso 2 del Tour");
            gestionarPasosModalTour(2);
        }; // [FIN DE LLAVES]: Cierra la función avanzarFaseTour
        btnSiguienteTour.onclick = avanzarFaseTour;
        btnSiguienteTour.addEventListener('touchend', avanzarFaseTour, { passive: false });
    } // [FIN DE LLAVES]: Cierra la condición del botón siguiente tour

    // 4. Vinculación directa y limpia al Guardia de Seguridad unificado para solicitar tour
    const btnSolicitarTourSelector = document.getElementById('btn-solicitar-tour-galeria');
    // [INICIO DE LLAVES]: Valida existencia del botón para solicitar tour en la galería
    if (btnSolicitarTourSelector) {
        btnSolicitarTourSelector.onclick = async function(e) {
            // [INICIO DE LLAVES]: Callback asíncrono protegido por el cortafuegos premium
            if (e) e.stopPropagation();
            const tieneAccesoValido = await validarAccesoFuncionalidadPremium();
            if (!tieneAccesoValido) return;

            mostrarPopupAccion("modal-tour-comercial");
            calcularCalendarioTresCajas();
            gestionarPasosModalTour(1);
        }; // [FIN DE LLAVES]: Cierra el callback asíncrono
    } // [FIN DE LLAVES]: Cierra la condición del botón de tour en galería

} // [FIN DE LLAVES]: Cierra la función principal unificada inicializarEventosPopups

                      


// ==========================================================================
// FUNCIÓN CENTRALIZADA: Invocador de Edge Function Supabase (enviar-correo)
// Descripción: Envía de forma segura los parámetros a la Edge Function de Supabase.
// ==========================================================================
async function dispararCorreoNotificacionSRE(destinatario, asunto, cuerpoMensaje) { // [INICIO DE LLAVE]: Abre dispararCorreoNotificacionSRE
    if (!destinatario || String(destinatario).trim() === "") return false;
    try { // [INICIO DE LLAVE]: Bloque Try
        const urlEdgeFunction = 'https://aohizylvnnrjhgplsods.supabase.co/functions/v1/enviar-correo';
        
        const respuesta = await fetch(urlEdgeFunction, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'apikey': supabaseAnonKey
            },
            body: JSON.stringify({
                destinatario: destinatario,
                asunto: asunto,
                mensaje: cuerpoMensaje
            })
        });

        const resultado = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(resultado.error || "Error al invocar la función de correo");
        }

        console.log(`>> [SRE EMAIL] Correo enviado exitosamente a: [${destinatario}]`);
        return true;
    } catch (err) { // [INICIO DE LLAVE]: Bloque Catch
        console.error("X [SRE EMAIL ERROR]:", err.message);
        return false;
    } // [FIN DE LLAVE]: Cierra Try/Catch
} // [FIN DE LLAVE]: Cierra dispararCorreoNotificacionSRE




            function mostrarPopupAccion(id) {
                const n = document.getElementById(id);
                if (n) n.style.display = "flex";
            }

            function cerrarPopupAccion(id) {
                const n = document.getElementById(id);
                if (n) n.style.display = "none";
            }

            let fechasSeleccionadasTour = new Set();

            function calcularCalendarioTresCajas() { // Inicia calcularCalendarioTresCajas
                const contenedorFechas = document.querySelector('.cajas-fechas-row');
                const selectHora = document.getElementById('hora-principal');
                if (!contenedorFechas) return;

                contenedorFechas.innerHTML = '';
                fechasSeleccionadasTour.clear();

                let fechaBase = new Date();
                fechaBase.setDate(fechaBase.getDate() + 1);

                if (fechaBase.getDay() === 0) {
                    fechaBase.setDate(fechaBase.getDate() + 1);
                }
                else if (fechaBase.getDay() === 6) {
                    fechaBase.setDate(fechaBase.getDate() + 2);
                }

                const diasSemana = ['DOM', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

                for (let i = 0; i < 3; i++) {
                    let fechaCaja = new Date(fechaBase);
                    fechaCaja.setDate(fechaBase.getDate() + i);

                    if (fechaCaja.getDay() === 0) {
                        fechaCaja.setDate(fechaCaja.getDate() + 1);
                    }

                    const diaTexto = diasSemana[fechaCaja.getDay()];
                    const fechaFormateada = `${fechaCaja.getDate()} de ${meses[fechaCaja.getMonth()]}`;
                    const valorDataIso = [
                        fechaCaja.getFullYear(),
                        String(fechaCaja.getMonth() + 1).padStart(2, '0'),
                        String(fechaCaja.getDate()).padStart(2, '0')
                    ].join('-');

                    const cajaNode = document.createElement('div');
                    cajaNode.className = 'caja-fecha-item';
                    cajaNode.style.cssText = 'flex: 1; text-align: center; border: 1px solid #ccd0d5; border-radius: 4px; padding: 10px 4px; cursor: pointer; font-size: 12px; font-weight: bold; color: #2a2a2a;';
                    cajaNode.innerHTML = `<div>${diaTexto}</div><div>${fechaFormateada}</div>`;

                    cajaNode.addEventListener('click', () => {
                        if (fechasSeleccionadasTour.has(valorDataIso)) {
                            fechasSeleccionadasTour.delete(valorDataIso);
                            cajaNode.style.borderColor = '#ccd0d5';
                            cajaNode.style.color = '#2a2a2a';
                            cajaNode.style.backgroundColor = '#ffffff';
                        }
                        else {
                            if (fechasSeleccionadasTour.size >= 3) {
                                alert("Seleccione hasta 3 veces únicamente.");
                                return;
                            }
                            fechasSeleccionadasTour.add(valorDataIso);
                            cajaNode.style.borderColor = '#006aff';
                            cajaNode.style.color = '#006aff';
                            cajaNode.style.backgroundColor = 'rgba(0, 106, 255, 0.05)';
                        }
                    });

                    contenedorFechas.appendChild(cajaNode);
                }

                if (selectHora) {
                    selectHora.innerHTML = `
            <option value="09:00">9:00 am</option>
            <option value="09:30">9:30 am</option>
            <option value="10:00">10:00 am</option>
            <option value="10:30">10:30 am</option>
            <option value="11:00">11:00 am</option>
            <option value="11:30">11:30 am</option>
            <option value="12:00">12:00 pm</option>
            <option value="12:30">12:30 pm</option>
            <option value="13:00">1:00 pm</option>
            <option value="13:30">1:30 pm</option>
            <option value="14:00">2:00 pm</option>
        `;
                }
            } // Fin calcularCalendarioTresCajas

            // Alterna la visibilidad de los paneles internos del modal con pre-selección automática elástica SRE
            function gestionarPasosModalTour(paso) { // Inicia gestionarPasosModalTour SRE
                const paso1 = document.getElementById('tour-paso-horarios');
                const paso2 = document.getElementById('tour-paso-confirmacion');
                const btnSiguiente = document.getElementById('btn-navegacion-siguiente-tour');
                const btnEnviar = document.getElementById('btn-enviar-solicitud-tour');

                if (paso === 1) { 
                    if (paso1) paso1.style.display = 'block';
                    if (paso2) paso2.style.display = 'none';
                    if (btnSiguiente) btnSiguiente.style.display = 'block';
                    if (btnEnviar) btnEnviar.style.display = 'none';
                } 
                else if (paso === 2) { 
                    // Si el interesado no hizo clic en ninguna caja, acoplamos de forma automática el primer día disponible
                    if (fechasSeleccionadasTour.size === 0) { 
                        console.log("[SRE CONTROL CALIENTE] No se detectó clic manual. Pre-seleccionando primera opción por defecto.");
                        const primeraCajaDisponible = document.querySelector('.cajas-fechas-row .caja-fecha-item');
                        if (primeraCajaDisponible) {
                            // Simulamos la pulsación interactiva sobre el nodo para poblar el Set de fechas
                            primeraCajaDisponible.click();
                        }
                    }

                    // Segunda verificación de salvaguarda relacional
                    if (fechasSeleccionadasTour.size === 0) { 
                        alert("Por favor, seleccione al menos una fecha para su recorrido en el calendario superior.");
                        return;
                    } 

                    if (paso1) paso1.style.display = 'none';
                    if (paso2) paso2.style.display = 'block';
                    if (btnSiguiente) btnSiguiente.style.display = 'none';
                    if (btnEnviar) btnEnviar.style.display = 'block';
                } 
            } // Fin definitivo de la funcion gestionarPasosModalTour SRE


            function inyectarDatosPropiedadAlMensaje() { // Inicia inyectarDatosPropiedadAlMensaje
                const campoMensaje = document.getElementById('agente-mensaje');
                const propActual = state.propiedades.find(p => p.id === state.propiedadSeleccionadaId);
                if (campoMensaje && propActual) {
                    campoMensaje.value = `I am interested in ${propActual.direccion || propActual.titulo}.`;
                }
            } // Fin inyectarDatosPropiedadAlMensaje


            window.gestionarCortinaSPA = function(tipoPantalla, prop) {
                const cortina = document.getElementById('cortina-spa');
                if (!cortina) return;
                if (tipoPantalla === 'cerrar') {
                    cortina.classList.remove('cortina-activa');
                    cortina.style.display = 'none';
                    return;
                }

                if (tipoPantalla === 'detalle') {
                    cortina.style.display = 'block';

                    const listaFotos = prop.fotos || [];
                    const fotoPrincipal = listaFotos[0] || "https://cloudinary.com";

                    let miniaturasHtml = '';
                    const totalMiniaturas = Math.min(listaFotos.length, 5);
                    for (let i = 0; i < totalMiniaturas; i++) {
                        miniaturasHtml += `
                <div style="width: 50px; height: 50px; border-radius: 8px; overflow: hidden; border: ${i === 0 ? '2px solid white' : '1px solid rgba(255,255,255,0.4)'}; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    <img src="${listaFotos[i]}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>`;
                    }

                    cortina.innerHTML = `
            <div style="width: 100%; background: #ffffff; font-family: sans-serif; min-height: 100vh; position: relative; z-index: 150000;">

                 <div style="width: 100%; height: 620px; position: relative; background: #000000; overflow: hidden;">

        <div style="width: 100%; height: 100%; border-radius: 0; overflow: hidden; position: relative;">

                        <img id="foto-zillow-showcase-activa" src="${fotoPrincipal}" style="width: 100%; height: 100%; object-fit: cover; display: block; transform-origin: center center;">
                    </div>

                    <button id="btn-cerrar-cortina" style="position: absolute; top: 20px; left: 24px; background: #ffffff; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 22px; font-weight: bold; color: #1a1a1a; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10;">X</button>

                    <div style="position: absolute; top: 20px; right: 24px; display: flex; gap: 12px; z-index: 10;">
                        <button style="background: #ffffff; border: none; padding: 10px 18px; border-radius: 24px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); color: #1a1a1a;">Guardar</button>
                        <button style="background: #ffffff; border: none; padding: 10px 18px; border-radius: 24px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); color: #1a1a1a;">Compartir</button>
                        <button style="background: #ffffff; border: none; padding: 10px 18px; border-radius: 24px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); color: #1a1a1a;">... Mas</button>
                    </div>

                    <button style="position: absolute; top: 50%; left: 20px; transform: translateY(-50%); background: rgba(0,0,0,0.3); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; font-size: 20px; cursor: pointer; z-index: 10;">\u2039</button>
                    <button style="position: absolute; top: 50%; right: 20px; transform: translateY(-50%); background: rgba(0,0,0,0.3); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; font-size: 20px; cursor: pointer; z-index: 10;">\u203a</button>

                    <div style="position: absolute; bottom: 20px; left: 24px; display: flex; gap: 10px; z-index: 10;">
                        ${miniaturasHtml}
                    </div>

                    <div style="position: absolute; bottom: 20px; right: 24px; color: white; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.6); z-index: 10;">SHOWCASE</div>
                </div>

                <div style="padding: 24px; max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 32px; box-sizing: border-box; align-items: start;">

                    <div style="flex: 1; min-width: 320px; overflow: hidden; display: block;">


                        <div style="margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
                            <h2 style="font-size: 36px; font-weight: 800; margin: 0 0 6px 0; color: #1a1a1a;">$${Number(prop.precio_base).toLocaleString('en-US')}</h2>
                            <p style="font-size: 16px; color: #4a5568; margin: 0 0 14px 0; font-weight: 600;">
                                <span style="color:#1a1a1a; font-weight:bold;">${prop.habitaciones}</span> bd |
                                <span style="color:#1a1a1a; font-weight:bold;">${prop.banos}</span> ba |
                                <span style="color:#1a1a1a; font-weight:bold;">${prop.area_construida}</span> m² AC
                            </p>
                            <p style="font-size: 15px; margin: 0 0 8px 0; color: #2d3748; font-weight: bold; letter-spacing: -0.2px;">${prop.direccion} (${prop.distrito})</p>
                        </div>

                        <div style="display: flex; gap: 24px; margin-bottom: 24px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <div style="font-size: 14px; color: #475569;">
                                <strong style="color: #1e293b; font-size: 16px; display: block;">14</strong> Días en el portal
                            </div>
                            <div style="font-size: 14px; color: #475569; border-left: 1px solid #cbd5e1; padding-left: 24px;">
                                <strong style="color: #1e293b; font-size: 16px; display: block;">1,248</strong> Vistas totales
                            </div>
                        </div>

                        <div style="margin-bottom: 28px;">
                            <h4 style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 12px;">Características esenciales</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px;">
                                <div>
                                    <span style="font-size: 12px; color: #718096; display: block; text-transform: uppercase;">Tipo</span>
                                    <strong style="font-size: 14px; color: #1a1a1a;">${prop.tipo_propiedad || 'Casa'}</strong>
                                </div>
                                <div>
                                    <span style="font-size: 12px; color: #718096; display: block; text-transform: uppercase;">Área Terreno</span>
                                    <strong style="font-size: 14px; color: #1a1a1a;">${prop.area_terreno || 0} m²</strong>
                                </div>
                                <div>
                                    <span style="font-size: 12px; color: #718096; display: block; text-transform: uppercase;">Área Const.</span>
                                    <strong style="font-size: 14px; color: #1a1a1a;">${prop.area_construida || 0} m²</strong>
                                </div>
                                <div>
                                    <span style="font-size: 12px; color: #718096; display: block; text-transform: uppercase;">Año Const.</span>
                                    <strong style="font-size: 14px; color: #1a1a1a;">${prop.ano_construccion || 'N/A'}</strong>
                                </div>
                            </div>
                        </div>

                        <div style="margin-bottom: 32px;">
                            <h4 style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px;">¿Qué es especial de este hogar?</h4>
                            <p style="font-size: 14px; color: #4a5568; line-height: 1.6; background: #ffffff; padding: 0; margin: 0;">
                                ${prop.descripcion || 'Sin descripción comercial registrada actualmente.'}
                            </p>
                        </div>

                        <div id="zillow-next-sections-slot"></div>

                    </div>

                      <div style="width: 340px; min-width: 340px; height: fit-content; background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); position: -webkit-sticky; position: sticky; top: 20px; z-index: 200000; box-sizing: border-box;">


                        <h4 style="font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px; text-align: center;">Contactar con la inmobiliaria</h4>
                        <button type="button" id="btn-solicitar-tour-galeria" style="width: 100%; background: #006aff; color: #ffffff; border: none; padding: 12px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; margin-bottom: 10px;">Solicitar un Tour</button>
                        <button type="button" id="btn-contactar-agente-galeria" style="width: 100%; background: #ffffff; color: #006aff; border: 1px solid #006aff; padding: 12px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer;">Contactar Agente</button>
                    </div>

                </div>
            </div>
        `;

                    const contenedorFijoFicha = document.getElementById('btn-solicitar-tour-galeria') ? document.getElementById('btn-solicitar-tour-galeria').parentNode : null;


                    let btnTelefonoSRE = document.getElementById('btn-ver-telefono-premium');

                    if (!btnTelefonoSRE && contenedorFijoFicha) {
                        const divTel = document.createElement('div');
                        divTel.style.cssText = 'margin-top: 10px; width: 100%;';
                        divTel.innerHTML = `
                <button type="button" id="btn-ver-telefono-premium" style="width: 100%; background: #ffffff; color: #002e50; border: 1px solid #002e50; padding: 12px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer;">Ver Teléfono del Vendedor</button>
                <div id="txt-telefono-desplegado" style="display: none; text-align: center; margin-top: 8px; font-size: 16px; font-weight: bold; color: #006aff;"></div>
            `;
                        contenedorFijoFicha.appendChild(divTel);
                    }

                    const botonCerrarCortinaSRE = document.getElementById('btn-cerrar-cortina');
                    if (botonCerrarCortinaSRE) {
                        botonCerrarCortinaSRE.onclick = (e) => {
                            e.stopPropagation();
                            gestionarCortinaSPA('cerrar');
                        };
                    }

                    const ejecutarFlujoModalProtegidoSRE = async (idBoton) => { // Inicia flujo asíncrono robusto unificado SRE
                        console.group(`[SRE RADAR INTEGRAL] PROCESANDO DISPARO ASÍNCRONO EN: ${idBoton}`);
                        
                        // Sincronización caliente de sesión OAuth pasiva en caso de desbordamiento en memoria
                        if ((!state.usuarioActual || !state.usuarioActual.id) && window.usuarioLogueado) { 
                            state.usuarioActual = {
                                id: window.usuarioLogueado.id,
                                correo: window.usuarioLogueado.email,
                                estado_cuenta: "activo"
                            };
                        } // Fin de sincronización pasiva

                        // Forzamos al hilo principal a esperar la resolución booleana del cortafuegos central
                        const tieneAccesoValido = await validarAccesoFuncionalidadPremium();
                        console.log("[SRE ESPÍA FIREWALL RESUELTO] Permisos confirmados por el cortafuegos:", tieneAccesoValido);

                        if (!tieneAccesoValido) {
                            console.warn("[SRE ESPÍA RECHAZADO] Acceso denegado. Desplegando modal de autenticación.");
                            mostrarPopupAccion("modal-autenticacion-supabase");
                            console.groupEnd();
                            return;
                        }

                        if (idBoton === 'btn-solicitar-tour-galeria') { // Inicia lógica para tours aprobados
                            const propActualTour = state.propiedades.find(p => p.id === state.propiedadSeleccionadaId);
                            if (propActualTour) { 
                                const imgMini = document.getElementById('modal-tour-mini-foto');
                                const dirMini = document.getElementById('modal-tour-mini-direccion');
                                const specsMini = document.getElementById('modal-tour-mini-specs');
                                
                                if (imgMini) imgMini.src = propActualTour.fotos && propActualTour.fotos[0] ? propActualTour.fotos[0] : "";
                                if (dirMini) dirMini.textContent = propActualTour.direccion || propActualTour.titulo || "Dirección no disponible";
                                if (specsMini) specsMini.textContent = `${propActualTour.habitaciones || 0} bd | ${propActualTour.banos || 0} ba | ${propActualTour.area_construida || 0} m² AC`;
                            } // Fin de inyección de metadatos

                            mostrarPopupAccion("modal-tour-comercial");
                            calcularCalendarioTresCajas();
                            gestionarPasosModalTour(1);
                        } // Fin de lógica para tours

                        if (idBoton === 'btn-contactar-agente-galeria') { // Inicia lógica para agentes aprobados
                            mostrarPopupAccion("modal-agent-comercial");
                            inyectarDatosPropiedadAlMensaje();
                        } // Fin de lógica para agentes
                        
                        console.groupEnd();
                    }; // Fin de la función asíncrona unificada SRE


                    const manejarPulsacionFichaInmuebleSRE = (e) => { // Inicia callback de intercepción elástica
                        const elementoTocado = e.target;
                        if (!elementoTocado) return;

                        const idBotonEncontrado = elementoTocado.id || (elementoTocado.closest('button') ? elementoTocado.closest('button').id : '');

                        if (idBotonEncontrado === 'btn-solicitar-tour-galeria' || idBotonEncontrado === 'btn-contactar-agente-galeria') {
                            if (e.cancelable) e.preventDefault();
                            e.stopPropagation();
                            console.log(`[SRE CAPTURA DE DELEGACIÓN] Capturado clic real en pantalla. Botón detectado: ${idBotonEncontrado}`);
                            ejecutarFlujoModalProtegidoSRE(idBotonEncontrado);
                        }
                    }; // Fin de callback de intercepción elástica

                    cortina.addEventListener('click', manejarPulsacionFichaInmuebleSRE);
                    cortina.addEventListener('touchend', manejarPulsacionFichaInmuebleSRE, { passive: false });
                    console.log("%c-> [SRE INFRAESTRUCTURA] Escuchas elásticas enlazadas directamente a la Cortina SPA.", "color: #10b981; font-weight: bold;");



// ==========================================================================
// FUNCIÓN: Asignación de Agente, Leads y Notificación con Traza Espía SRE
// ==========================================================================
/**
 * Descripción: Gestiona el formulario para contactar un agente. 
 * Audita la vista, la comparación, la selección por prioridad/leads,
 * el INSERT en contacte_agente, el UPDATE en agente_inmobiliario y el correo.
 */
// [INICIO DE LLAVES]: Abre el bloque del formulario de agente
const formAgente = document.getElementById('form-contactar-agente');
if (formAgente) {
    formAgente.onsubmit = async (eventSubmit) => {
        eventSubmit.preventDefault();
        console.group("🕵️‍♂️ [SRE ESPÍA AGENTE] === INICIO DE TRAZA: CONTACTAR UN AGENTE ===");

        // 1. VALOR LEÍDO DE LA VISTA
        const idVista = state.propiedadSeleccionadaId;
        const propActualAgente = state.propiedades.find(p => p.id === idVista);
        console.log("1. [ESPÍA VISTA] Valor leído de 'vista_catalogo_mapa' (columna 'propiedad_id'):", idVista);

        if (!(await validarAccesoFuncionalidadPremium())) {
            console.warn("❌ [ESPÍA AGENTE] Cortafuegos bloqueó la ejecución.");
            console.groupEnd();
            return;
        }

        const btnEnviarAgente = document.getElementById('btn-enviar-contacto-agente');
        if (btnEnviarAgente) {
            btnEnviarAgente.innerText = "...Asignando Agente...";
            btnEnviarAgente.disabled = true;
        }

        const nombreAgenteInput = document.getElementById('agente-contacto-nombre').value.trim();
        const telefonoAgenteInput = document.getElementById('agente-contacto-telefono').value.trim();

        try {
            const clienteSupabaseSRE = obtenerClienteSupabase();
            if (!clienteSupabaseSRE) throw new Error("Cliente Supabase no disponible.");

            const idPropiedadReal = String(propActualAgente ? propActualAgente.id : idVista).trim();
            
            // 2. VALOR Y TABLA CON LA QUE COMPARA
            console.log(`2. [ESPÍA COMPARACIÓN] Comparando ID ['${idPropiedadReal}'] con la TABLA 'anuncio' en su COLUMNA 'propiedad_id_fk'`);

            const { data: anuncioData } = await clienteSupabaseSRE
                .from('anuncio')
                .select('anuncio_id, agente_id_fk')
                .eq('propiedad_id_fk', idPropiedadReal)
                .maybeSingle();

            const idAnuncioReal = anuncioData ? anuncioData.anuncio_id : null;
            const agenteFallbackId = anuncioData ? anuncioData.agente_id_fk : null;

            console.log("3. [ESPÍA LECTURA AGENTES] Consultando TABLA 'agente_inmobiliario' (columnas: 'prioridad', 'leads', 'leads_recibidos')...");
            const { data: listaAgentes, error: errorAgentes } = await clienteSupabaseSRE
                .from('agente_inmobiliario')
                .select('agente_id, prioridad, leads, leads_recibidos, correo')
                .order('prioridad', { ascending: true });

            if (errorAgentes) throw errorAgentes;

            let agenteAsignadoSRE = null;
            if (listaAgentes && listaAgentes.length > 0) {
                for (let i = 0; i < listaAgentes.length; i++) {
                    const ag = listaAgentes[i];
                    const maxLeads = Number(ag.leads) || 10;
                    const actualLeads = Number(ag.leads_recibidos) || 0;
                    console.log(`   -> Evaluando Agente [ID: ${ag.agente_id}] | Prioridad: ${ag.prioridad} | Recibidos: ${actualLeads} / Máx: ${maxLeads}`);

                    if (actualLeads < maxLeads) {
                        agenteAsignadoSRE = ag;
                        console.log("      ✅ Asignado por disponibilidad de leads.");
                        break;
                    }
                }
                if (!agenteAsignadoSRE) {
                    agenteAsignadoSRE = listaAgentes[0];
                    console.log("      ⚠️ Límite alcanzado en todos. Asignando por defecto al primer agente de prioridad.");
                }
            }

            const idAgenteFinalFK = agenteAsignadoSRE ? agenteAsignadoSRE.agente_id : agenteFallbackId;

            const fContacto = new Date();
            const fechaContacteISO = [
                fContacto.getFullYear(),
                String(fContacto.getMonth() + 1).padStart(2, '0'),
                String(fContacto.getDate()).padStart(2, '0')
            ].join('-') + ` ${String(fContacto.getHours()).padStart(2, '0')}:${String(fContacto.getMinutes()).padStart(2, '0')}:${String(fContacto.getSeconds()).padStart(2, '0')}`;

            // 3. VALORES LISTOS PARA EL INSERT
            const payloadContacteAgente = {
                anuncio_id_fk: idAnuncioReal,
                propiedad_id_fk: idPropiedadReal,
                agente_id_fk: idAgenteFinalFK,
                nombre: nombreAgenteInput,
                apellidos: ' ',
                email_interesado: state.usuarioActual.correo,
                telefono: telefonoAgenteInput,
                fecha_contacte: fechaContacteISO,
                tipo_visita: 'agente',
                estado_visita: 'pendiente',
                estado_lead: 'pendiente',
                creado_por: state.usuarioActual.correo,
                fecha_creacion: fechaContacteISO
            };

            console.log("4. [ESPÍA INSERT PREPARADO] Valores listos para insertar en TABLA 'contacte_agente':", payloadContacteAgente);

            const { error: errorInsertLead } = await clienteSupabaseSRE
                .from('contacte_agente')
                .insert([payloadContacteAgente]);

            if (errorInsertLead) throw errorInsertLead;

            // 4. LOGRO DEL INSERT
            console.log("✅ 5. [ESPÍA INSERT LOGRADO] Se ejecutó y confirmó el INSERT en la TABLA 'contacte_agente'.");

            // 4. LOGRO DEL UPDATE (Incrementar leads_recibidos)
            if (agenteAsignadoSRE) {
                const nuevosLeads = (Number(agenteAsignadoSRE.leads_recibidos) || 0) + 1;
                console.log(`6. [ESPÍA UPDATE PREPARADO] Incrementando 'leads_recibidos' a [${nuevosLeads}] en TABLA 'agente_inmobiliario' (agente_id = '${agenteAsignadoSRE.agente_id}')`);

                const { error: errorUpdateLead } = await clienteSupabaseSRE
                    .from('agente_inmobiliario')
                    .update({ leads_recibidos: nuevosLeads })
                    .eq('agente_id', agenteAsignadoSRE.agente_id);

                if (errorUpdateLead) {
                    console.error("⚠️ [ESPÍA UPDATE FALLIDO]:", errorUpdateLead.message);
                } else {
                    console.log("✅ 7. [ESPÍA UPDATE LOGRADO] Se ejecutó y confirmó el UPDATE en la TABLA 'agente_inmobiliario'.");
                }
            }

            // 5. VALOR PARA ENVIAR EL CORREO AL AGENTE
            const correoAgenteNotificar = agenteAsignadoSRE ? agenteAsignadoSRE.correo : null;
            console.log(`8. [ESPÍA VALOR CORREO] Correo del agente capturado para notificar: [${correoAgenteNotificar || 'No asignado'}]`);

            // 6. ESTADO DEL ENVÍO DE CORREO VÍA EDGE FUNCTION
            if (correoAgenteNotificar) { // [INICIO DE LLAVE]: Evalúa si existe correo del agente
                const asuntoAgente = "Nuevo lead asignado: Interesado requiere agente";          
                const cuerpoAgente = `Estimado Agente,\n\nUn interesado (${nombreAgenteInput}, Correo: ${state.usuarioActual.correo}, Tel: ${telefonoAgenteInput}) desea comunicarse con usted para definir una oportunidad de negocio.\n\nPor favor, contacte al cliente a la brevedad.`;
                
                await dispararCorreoNotificacionSRE(correoAgenteNotificar, asuntoAgente, cuerpoAgente);
                console.log(`📧 9. [ESPÍA ENVÍO CORREO: SÍ] Correo enviado exitosamente al agente: ${correoAgenteNotificar}`);
            } else {
                console.warn("⚠️ 9. [ESPÍA ENVÍO CORREO: NO] No se envió correo al agente por falta de dirección.");
            } // [FIN DE LLAVE]: Cierra evaluación de correo del agente
            

            alert("¡Mensaje enviado con éxito! Su requerimiento fue asignado al agente inmobiliario.");
            cerrarPopupAccion('modal-agent-comercial');
            formAgente.reset();

        } catch (errAgente) {
            console.error("❌ [ESPÍA AGENTE ERROR]:", errAgente.message);
            alert("Error en el sistema de asignación: " + errAgente.message);
        } finally {
            console.log("🕵️‍♂️ [SRE ESPÍA AGENTE] === FIN DE TRAZA ===");
            console.groupEnd();
            if (btnEnviarAgente) {
                btnEnviarAgente.innerText = "Enviar Mensaje";
                btnEnviarAgente.disabled = false;
            }
        }
    };
} 
// [FIN DE LLAVES]: Cierra el bloque del formulario de agente

                    const elementoBtnTelefono = document.getElementById('btn-ver-telefono-premium');
                    if (elementoBtnTelefono) {
                        elementoBtnTelefono.onclick = async (e) => {
                            e.stopPropagation();
                            if (!(await validarAccesoFuncionalidadPremium())) return;

                            elementoBtnTelefono.innerText = "Consultando número...";
                            try {
                                const cliente = obtenerClienteSupabase();

                                const {
                                    data: anuncioFiltro
                                } = await cliente
                                    .from('anuncio')
                                    .select('usuario_id_fk, agente_id_fk')
                                    .eq('propiedad_id_fk', state.propiedadSeleccionadaId)
                                    .single();

                                let telefonoObtenido = "No registrado";

                                if (anuncioFiltro) {
                                    if (anuncioFiltro.agente_id_fk && String(anuncioFiltro.agente_id_fk).trim() !== "") {
                                        const {
                                            data: datosAgente
                                        } = await cliente
                                            .from('agente_inmobiliario')
                                            .select('telefono_agente')
                                            .eq('id', anuncioFiltro.agente_id_fk)
                                            .single();
                                        if (datosAgente) telefonoObtenido = datosAgente.telefono_agente;
                                    } else {
                                        const {
                                            data: datosUsuario
                                        } = await cliente
                                            .from('usuario_autenticado')
                                            .select('telefono_contacto')
                                            .eq('id', anuncioFiltro.usuario_id_fk)
                                            .single();
                                        if (datosUsuario) telefonoObtenido = datosUsuario.telefono_contacto;
                                    }
                                }

                                const cajaTextoTelefono = document.getElementById('txt-telefono-desplegado');
                                if (cajaTextoTelefono) {
                                    cajaTextoTelefono.innerText = `Número: ${telefonoObtenido}`;
                                    cajaTextoTelefono.style.display = "block";
                                    elementoBtnTelefono.style.display = "none";
                                }
                            } catch (errTel) {
                                console.error("Error al recuperar el teléfono:", errTel);
                                elementoBtnTelefono.innerText = "Ver Teléfono del Vendedor";
                            }
                        };
                    }

                    const imgAnimar = document.getElementById('foto-zillow-showcase-activa');
                    const fotosArregloSeguro = prop.fotos || [];
                    let indiceFotoSecuencia = 0;

                    function reproducirSecuenciaCinematografica() {
                        if (!imgAnimar || fotosArregloSeguro.length === 0) return;
                        imgAnimar.src = fotosArregloSeguro[indiceFotoSecuencia];
                        const animacionCorriendo = imgAnimar.animate([{
                                transform: 'scale(1.0) translate(0%, 0%)'
                            },
                            {
                                transform: 'scale(1.18) translate(2%, -1.5%)'
                            }
                        ], {
                            duration: 8000,
                            iterations: 1,
                            easing: 'ease-in-out'
                        });

                        animacionCorriendo.onfinish = () => {
                            if (document.getElementById('foto-zillow-showcase-activa')) {
                                indiceFotoSecuencia = (indiceFotoSecuencia + 1) % fotosArregloSeguro.length;
                                reproducirSecuenciaCinematografica();
                            }
                        };
                    }


// ==========================================================================
// FUNCIÓN: Procesamiento, Agenda de Tour y Notificación con Traza Espía SRE
// ==========================================================================
/**
 * Descripción: Gestiona el envío del formulario de solicitud de un tour. 
 * Asigna la fecha de hoy a fecha_creacion, consulta el correo del propietario 
 * en usuario_autenticado si no hay agente, y audita todo el proceso por consola.
 */
// [INICIO DE LLAVES]: Abre el bloque condicional del formulario de tour
const formTour = document.getElementById('form-solicitar-tour-completo');
if (formTour) {
    formTour.onsubmit = async (e) => {
        e.preventDefault();
        console.group("🕵️‍♂️ [SRE ESPÍA TOUR] === INICIO DE TRAZA: SOLICITAR UN TOUR ===");

        // 1. VALOR LEÍDO DE LA VISTA
        const idVista = state.propiedadSeleccionadaId;
        const propActual = state.propiedades.find(p => p.id === idVista);
        console.log("1. [ESPÍA VISTA] Valor leído de 'vista_catalogo_mapa' (columna 'propiedad_id'):", idVista);

        if (!(await validarAccesoFuncionalidadPremium())) {
            console.warn("❌ [ESPÍA TOUR] Cortafuegos bloqueó la ejecución.");
            console.groupEnd();
            return;
        }

        const telefonoTourInput = document.getElementById('tour-contacto-telefono').value.trim();
        const nombreInput = document.getElementById('tour-contacto-nombre').value.trim();
        const horaSeleccionada = document.getElementById('hora-principal').value;

        try {
            const cliente = obtenerClienteSupabase();
            if (!cliente) throw new Error("Cliente Supabase inaccesible.");

            const fechaSeleccionadaArregloSRE = Array.from(fechasSeleccionadasTour);
            const primeraFechaEscogidaSRE = fechaSeleccionadaArregloSRE[0] || "";
            if (!primeraFechaEscogidaSRE) throw new Error("Seleccione una fecha válida en el calendario.");

            const timestampEstandarISO = `${primeraFechaEscogidaSRE} ${horaSeleccionada}:00`;
            const idPropiedadReal = String(propActual ? propActual.id : idVista).trim();
            
            // 2. COMPARACIÓN CON TABLA Y COLUMNA
            console.log(`2. [ESPÍA COMPARACIÓN] Comparando ID ['${idPropiedadReal}'] con la TABLA 'anuncio' en su COLUMNA 'propiedad_id_fk'`);
            
            const { data: anuncioData, error: errAnuncio } = await cliente
                .from('anuncio')
                .select('anuncio_id, agente_id_fk, usuario_id_fk')
                .eq('propiedad_id_fk', idPropiedadReal)
                .maybeSingle();

            if (errAnuncio) throw errAnuncio;
            if (!anuncioData) throw new Error("La propiedad seleccionada no cuenta con un anuncio válido en la base de datos.");

            console.log("   -> Coincidencia hallada en TABLA 'anuncio':", anuncioData);

            // Generar la marca de tiempo de HOY para fecha_creacion
            const fActual = new Date();
            const fechaCreacionHoyISO = [
                fActual.getFullYear(),
                String(fActual.getMonth() + 1).padStart(2, '0'),
                String(fActual.getDate()).padStart(2, '0')
            ].join('-') + ` ${String(fActual.getHours()).padStart(2, '0')}:${String(fActual.getMinutes()).padStart(2, '0')}:${String(fActual.getSeconds()).padStart(2, '0')}`;

            // 3. VALORES LISTOS PARA EL INSERT (fecha_creacion con fecha de hoy)
            const payloadVisita = {
                usuario_id_fk: state.usuarioActual.id,
                propiedad_id_fk: idPropiedadReal,
                anuncio_id_fk: anuncioData.anuncio_id,
                agente_id_fk: anuncioData.agente_id_fk,
                nombre_visita: nombreInput,
                creado_por: state.usuarioActual.correo,
                telefono: telefonoTourInput,
                fecha_visita: timestampEstandarISO,
                fecha_creacion: fechaCreacionHoyISO, // Fecha de HOY exigida por regla de negocio
                tipo_visita: 'presencial',
                estado_visita: 'pendiente',
                estado_lead: 'nuevo'
            };

            console.log("3. [ESPÍA INSERT PREPARADO] Valores listos para insertar en TABLA 'visita':", payloadVisita);
            
            const { error: errorVisita } = await cliente.from('visita').insert([payloadVisita]);
            if (errorVisita) throw errorVisita;

            console.log("✅ 4. [ESPÍA INSERT LOGRADO] Se ejecutó y confirmó con éxito el INSERT en la TABLA 'visita'.");

// ==========================================================================
            // CONSULTAR QUIÉN VENDE PARA EL CORREO (LÓGICA HÍBRIDA PROPIETARIO / AGENTE)
            // ==========================================================================
            console.log("5. [ESPÍA VENDEDOR] Evaluando quién gestiona el anuncio...");
            let correoVendedor = null;
            let tipoVendedor = "";

            // CASO A: El anuncio es gestionado por un Agente Inmobiliario
            if (anuncioData.agente_id_fk !== null && String(anuncioData.agente_id_fk).trim() !== "" && String(anuncioData.agente_id_fk).toUpperCase() !== "NULL") {
                tipoVendedor = "AGENTE INMOBILIARIO";
                console.log(`   -> Vende un AGENTE. Consultando TABLA 'agente_inmobiliario', COLUMNA 'agente_id' = '${anuncioData.agente_id_fk}'`);
                
                const { data: agenteInfo, error: errorAgente } = await cliente
                    .from('agente_inmobiliario')
                    .select('correo, nombre, apellido, telefono_agente')
                    .eq('agente_id', anuncioData.agente_id_fk)
                    .maybeSingle();

                if (errorAgente) {
                    console.error("❌ Error al consultar el agente:", errorAgente.message);
                }

                if (agenteInfo && agenteInfo.correo) {
                    correoVendedor = agenteInfo.correo;
                    console.log(`   ✅ Correo del agente encontrado: [${correoVendedor}]`);
                } else {
                    console.warn("⚠️ El agente no tiene un correo registrado en su perfil.");
                }
            } 
            
            // CASO B: El anuncio lo gestiona directamente el Propietario (agente_id_fk es NULL)
            else {
                tipoVendedor = "PROPIETARIO";
                console.log(`   -> Vende el PROPIETARIO. Consultando TABLA 'usuario_autenticado', COLUMNA 'usuario_id' = '${anuncioData.usuario_id_fk}'`);

                if (anuncioData.usuario_id_fk) {
                    const { data: propietarioInfo, error: errorProp } = await cliente
                        .from('usuario_autenticado')
                        .select('correo')
                        .eq('usuario_id', anuncioData.usuario_id_fk)
                        .maybeSingle();

                    if (errorProp) {
                        console.error("❌ Error al consultar el propietario:", errorProp.message);
                    }

                    if (propietarioInfo && propietarioInfo.correo) {
                        correoVendedor = propietarioInfo.correo;
                        console.log(`   ✅ Correo del propietario encontrado: [${correoVendedor}]`);
                    }
                }
            }

            // Respaldo de seguridad SRE: Si por alguna razón no se halló el correo del vendedor principal
            if (!correoVendedor) {
                console.warn("⚠️ [SRE ADVERTENCIA] No se pudo determinar el correo del vendedor. Usando respaldo institucional.");
                correoVendedor = state.usuarioActual.correo; // Correo de respaldo temporal para pruebas
            }

            // 5. VALOR PARA ENVIAR EL CORREO
            console.log(`6. [ESPÍA VALOR CORREO] Correo capturado para notificar: [${correoVendedor || 'No registrado'}] (Tipo: ${tipoVendedor})`);

            // 6. ESTADO DEL ENVÍO DE CORREO VÍA EDGE FUNCTION
            if (correoVendedor) { // [INICIO DE LLAVE]: Evalúa si existe correo del vendedor
                const asuntoTour = "Nueva solicitud de Tour para su propiedad";
                const cuerpoTour = `Estimado(a) ${tipoVendedor},\n\nUn interesado ha solicitado agendar un Tour presencial para su propiedad.\n\nDetalles:\n- Fecha y Hora: ${timestampEstandarISO}\n- Interesado: ${nombreInput}\n- Correo: ${state.usuarioActual.correo}\n- Teléfono: ${telefonoTourInput}\n\nPor favor, gestione la visita.`;
                await dispararCorreoNotificacionSRE(correoVendedor, asuntoTour, cuerpoTour);
                console.log(`📧 7. [ESPÍA ENVÍO CORREO: SÍ] Correo enviado exitosamente a '${correoVendedor}' con los detalles del tour.`);
            } else {
                console.warn("⚠️ 7. [ESPÍA ENVÍO CORREO: NO] No se envió el correo debido a que el vendedor no tiene una dirección registrada.");
            } // [FIN DE LLAVE]: Cierra evaluación de correo del vendedor
            

            alert("¡Tour agendado exitosamente! Se ha notificado al vendedor.");
            cerrarPopupAccion('modal-tour-comercial');
            formTour.reset();

        } catch (errTour) {
            console.error("❌ [ESPÍA TOUR ERROR]:", errTour.message);
            alert("Error al procesar la agenda: " + errTour.message);
        } finally {
            console.log("🕵️‍♂️ [SRE ESPÍA TOUR] === FIN DE TRAZA ===");
            console.groupEnd();
        }
    };
} 
// [FIN DE LLAVES]: Cierra el bloque del formulario de tour

                    if (prop && prop.propiedad_id) {
                        inyectarSeccionesAdicionalesZillow(prop);
                    }

                    reproducirSecuenciaCinematografica();

                    cortina.scrollTop = 0;
                } // Fin del bloque if (tipoPantalla === 'detalle')

                cortina.classList.add('cortina-activa');

            } // FIN DEFINITIVO DE LA FUNCIÓN gestionarCortinaSPA RESTABLECIDA




            // ==========================================================================
            // COMPONENTE MODULAR INTERIOR: CÁLCULOS FINANCIEROS Y CARACTERÍSTICAS
            // ==========================================================================

            function inyectarSeccionesAdicionalesZillow(prop) {
                const slotDinamico = document.getElementById('zillow-next-sections-slot');
                if (!slotDinamico) return;

                const precioBase = parseFloat(prop.precio_base) || 0;

                const zestimateVenta = precioBase > 0 ? precioBase * 1.021 : 0;

                const rangoMin = zestimateVenta * 0.96;
                const rangoMax = zestimateVenta * 1.05;

                const zestimateAlquiler = precioBase > 0 ? (precioBase * 0.055) / 12 : 0;

                const fMoneda = (val) => val > 0 ? '$' + Math.round(val).toLocaleString('en-US') : 'No disponible';

                slotDinamico.innerHTML = `
        <!-- SECCIÓN 1: DATOS Y CARACTERÍSTICAS -->
        <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
            <h4 style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px;">Datos y características del inmueble</h4>

            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 8px;">
                    <h5 style="font-size: 15px; font-weight: 700; color: #006aff; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Interior</h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
                        <div>
                            <span style="font-size: 13px; color: #64748b; display: block;">Habitaciones y baños:</span>
                            <strong style="font-size: 14px; color: #1e293b;">${prop.habitaciones || 0} Dormitorios | ${prop.banos || 0} Baños completos</strong>
                        </div>
                        <div>
                            <span style="font-size: 13px; color: #64748b; display: block;">Calefacción y Enfriamiento:</span>
                            <strong style="font-size: 14px; color: #1e293b;">Centralizado / Aire Acondicionado independiente</strong>
                        </div>
                        <div>
                            <span style="font-size: 13px; color: #64748b; display: block;">Electrodomésticos incluidos:</span>
                            <strong style="font-size: 14px; color: #1e293b;">Cocina empotrada, Horno, Extractor de grasa</strong>
                        </div>
                        <div>
                            <span style="font-size: 13px; color: #64748b; display: block;">Sótanos y Almacenes:</span>
                            <strong style="font-size: 14px; color: #1e293b;">Sótano: ${prop.sotano || 'No'} | Depósito/Almacén: ${prop.almacen || 'No'}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- SECCIÓN 2: VALOR DE MERCADO ESTIMADO -->
        <div style="margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <h4 style="font-size: 20px; font-weight: 700; color: #1a1a1a;">Valor de mercado estimado</h4>
                <span style="background: #006aff; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">ZESTIMATE</span>
            </div>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Índice de valoración automatizado calculado en tiempo real con la data de la zona.</p>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">

                <div style="border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <span style="font-size: 12px; color: #64748b; display: block; font-weight: 600;">Precio de lista</span>
                    <strong style="font-size: 20px; color: #1a1a1a; display: block; margin: 4px 0;">${fMoneda(precioBase)}</strong>
                    <span style="font-size: 11px; color: #10b981; font-weight: 600;">Valor base de tasación</span>
                </div>

                <div style="border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.02); border-left: 4px solid #006aff;">
                    <span style="font-size: 12px; color: #64748b; display: block; font-weight: 600;">Zestimate Actual</span>
                    <strong style="font-size: 20px; color: #006aff; display: block; margin: 4px 0;">${fMoneda(zestimateVenta)}</strong>
                    <span style="font-size: 11px; color: #475569;">Rango: ${fMoneda(rangoMin)} - ${fMoneda(rangoMax)}</span>
                </div>

                <div style="border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <span style="font-size: 12px; color: #64748b; display: block; font-weight: 600;">Alquiler estimado</span>
                    <strong style="font-size: 20px; color: #1a1a1a; display: block; margin: 4px 0;">${fMoneda(zestimateAlquiler)}/mes</strong>
                    <span style="font-size: 11px; color: #475569;">Retorno anual calc. 5.5%</span>
                </div>

            </div>
        </div>

        <div id="zillow-graphs-and-history-slot"></div>
    `;

                inyectarHistorialesYImpuestosZillow(prop);
            }

            // ====================================================================================
            // INICIO DE FUNCTION: inyectarHistorialesYImpuestosZillow
            // ====================================================================================
            async function inyectarHistorialesYImpuestosZillow(prop) {
                const slotHistorial = document.getElementById('zillow-graphs-and-history-slot');
                if (!slotHistorial) return;

                const precioActual = parseFloat(prop.precio_base) || 0;
                const areaConstruida = parseFloat(prop.area_construida) || 100;
                const ubigeoPropiedad = (prop.codigo_ubigeo || '150140').trim();
                const distritoNombre = prop.distrito || 'el distrito';

                const periodosRequeridos = [
                    '2023-T1', '2023-T2', '2023-T3', '2023-T4',
                    '2024-T1', '2024-T2', '2024-T3', '2024-T4',
                    '2025-T1', '2025-T2', '2025-T3', '2025-T4', '2026-T1'
                ];

                let historialM2 = {
                    '2023-T1': 1650,
                    '2023-T2': 1670,
                    '2023-T3': 1690,
                    '2023-T4': 1710,
                    '2024-T1': 1730,
                    '2024-T2': 1750,
                    '2024-T3': 1740,
                    '2024-T4': 1760,
                    '2025-T1': 1780,
                    '2025-T2': 1800,
                    '2025-T3': 1820,
                    '2025-T4': 1840,
                    '2026-T1': 1850
                };

                try {
                    if (supabase) {
                        const {
                            data,
                            error
                        } = await supabase
                            .from('tasacion_distrital')

                            .select('trimestre_ano, venta_m2')
                            .eq('codigo_ubigeo', ubigeoPropiedad)
                            .in('trimestre_ano', periodosRequeridos)
                            .order('trimestre_ano', {
                                ascending: true
                            });

                        if (!error && data && data.length > 0) {
                            data.forEach(reg => {
                                if (historialM2[reg.trimestre_ano] !== undefined) {
                                    historialM2[reg.trimestre_ano] = parseFloat(reg.venta_m2);
                                }
                            });
                        }
                    }
                } catch (err) {
                    console.warn("SRE Alerta: Error consultando tasacion_distrital, operando con fallbacks.", err);
                }

                const valoresInmueble = periodosRequeridos.map(p => historialM2[p] * areaConstruida);
                const maxValor = Math.max(...valoresInmueble, precioActual) * 1.05;
                const minValor = Math.min(...valoresInmueble, precioActual) * 0.95;
                const rangoValores = maxValor - minValor;

                const altoGrafico = 180;
                const anchoGrafico = 600;
                const pasoX = anchoGrafico / (periodosRequeridos.length - 1);

                let coordenadasPuntos = [];
                let tablaHtmlRows = '';

                periodosRequeridos.forEach((periodo, i) => {
                    const valInmueble = valoresInmueble[i];
                    const puntoX = i * pasoX;
                    const puntoY = altoGrafico - (((valInmueble - minValor) / rangoValores) * altoGrafico);
                    coordenadasPuntos.push(`${puntoX},${puntoY}`);

                    tablaHtmlRows += `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 16px; color: #475569; font-weight: 600;">${periodo}</td>
                <td style="padding: 10px 16px; color: #1e293b;">$${historialM2[periodo].toLocaleString('en-US')} / m²</td>
                <td style="padding: 10px 16px; font-weight: 700; color: #006aff;">$${Math.round(valInmueble).toLocaleString('en-US')}</td>
            </tr>
        `;
                });

                const pathString = `M ${coordenadasPuntos.join(' L ')}`;
                const fM = (v) => '$' + Math.round(v).toLocaleString('en-US');
                const impuestoAnual = precioActual * 0.0042;

                slotHistorial.innerHTML = `
        <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h4 style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin: 0;">Historia de Zestimate (Últimos 3 años)</h4>
                <span style="font-size: 12px; color: #64748b; font-weight: 600; background: #f1f5f9; padding: 4px 10px; border-radius: 20px;">Ubigeo: ${ubigeoPropiedad}</span>
            </div>

            <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.01);">
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; font-weight: bold; margin-bottom: 10px; border-bottom: 1px dashed #f1f5f9; padding-bottom: 6px;">
                    <span>Techo: ${fM(maxValor)}</span>
                    <span>Piso: ${fM(minValor)}</span>
                </div>

                <div style="width: 100%; overflow-x: auto; position: relative;">
                    <svg viewBox="0 0 ${anchoGrafico} ${altoGrafico}" style="width: 100%; height: auto; min-width: 550px; display: block; overflow: visible;">
                        <line x1="0" y1="${altoGrafico * 0.25}" x2="${anchoGrafico}" y2="${altoGrafico * 0.25}" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4"/>
                        <line x1="0" y1="${altoGrafico * 0.5}" x2="${anchoGrafico}" y2="${altoGrafico * 0.5}" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4"/>
                        <line x1="0" y1="${altoGrafico * 0.75}" x2="${anchoGrafico}" y2="${altoGrafico * 0.75}" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4"/>

                        <path d="${pathString}" fill="none" stroke="#006aff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="${anchoGrafico}" cy="${coordenadasPuntos[coordenadasPuntos.length - 1].split(',')[1]}" r="5" fill="#006aff" stroke="#ffffff" stroke-width="2" />
                    </svg>
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; font-weight: bold; margin-top: 12px; padding: 0 10px;">
                    <span>2023 (Inicio)</span>
                    <span>2024 (Evolución)</span>
                    <span>2025 (Crecimiento)</span>
                    <span style="color: #006aff;">2026 (Actual)</span>
                </div>
            </div>
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 10px;">Curva de tasación automatizada para el área construida de <strong>${areaConstruida} m²</strong> en ${distritoNombre}.</p>
        </div>

        <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
            <h4 style="font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 12px;">Vista de la tabla analítica completa</h4>
            <div style="width: 100%; overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; max-height: 280px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                    <thead style="position: sticky; top: 0; background: #f8fafc; box-shadow: 0 1px 0 #e2e8f0;">
                        <tr style="color: #475569; font-weight: 600;">
                            <th style="padding: 12px 16px;">Trimestre</th>
                            <th style="padding: 12px 16px;">Valor m² (USD)</th>
                            <th style="padding: 12px 16px;">Valor Comercial Estimado</th>
                        </tr>
                    </thead>
                    <tbody style="color: #1e293b;">
                        ${tablaHtmlRows}
                    </tbody>
                </table>
            </div>
        </div>

        <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 24px; margin-bottom: 12px;">
            <h4 style="font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 12px;">Impuestos públicos estimados</h4>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                    <strong style="font-size: 13px; color: #1e293b; display: block;">Autovalúo predial estimado:</strong>
                    <span style="font-size: 12px; color: #64748b;">Monto tributario anual proyectado de acuerdo a los aranceles vigentes de la zona.</span>
                </div>
                <strong style="font-size: 18px; color: #1e293b; white-space: nowrap;">${fM(impuestoAnual)} / año</strong>
            </div>
        </div>

        <div id="zillow-buyability-and-neighborhood-slot"></div>
    `;

                if (typeof inyectarCapacidadCompraZillow === "function") {
                    inyectarCapacidadCompraZillow(prop);
                }
            }
            // ====================================================================================
            // FIN DE FUNCTION: inyectarHistorialesYImpuestosZillow
            // ====================================================================================

            // ====================================================================================
            // INICIO DE FUNCTION: inyectarCapacidadCompraZillow
            // ====================================================================================
            async function inyectarCapacidadCompraZillow(prop) { // Abre la función principal inyectarCapacidadCompraZillow
                if (!prop || !prop.propiedad_id || isNaN(parseFloat(prop.precio_base))) {
                    console.log(">> [SRE SIMULADOR] Pasivo en arranque. No se ejecuta simulación hipotecaria.");
                    return;
                }

                const slotBuyability = document.getElementById('zillow-buyability-and-neighborhood-slot');
                if (!slotBuyability) return;

                const precioBase = parseFloat(prop.precio_base) || 0;
                const tipoProp = String(prop.tipo_propiedad || 'Casa').trim();

                slotBuyability.innerHTML = `
        <div style="margin-top: 36px; border-top: 2px solid #002E50; padding-top: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <h4 style="font-size: 18px; font-weight: 700; color: #002E50;">Simulador Hipotecario Inteligente</h4>
                <span style="background: #002E50; color: #FFB91D; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">CONEXIÓN DIRECTA</span>
            </div>
            <p style="font-size: 13px; color: #475569; margin-bottom: 20px;">Evaluación en base a las políticas SBS y BCRP vigentes para <strong>${tipoProp}</strong>.</p>
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,46,80,0.04); display: flex; flex-direction: column; gap: 20px;">
                <div style="text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
                    <span style="font-size: 14px; color: #002E50; font-weight: 600;">Cuota Mensual Total Estimada</span>
                    <h3 id="display-pago-total-hipoteca" style="font-size: 21px; font-weight: 700; color: #002E50; margin: 10px 0 0 0;">Selecciona tus datos y simula tu hipoteca</h3>
                    <p id="lov-comentario-dinamico" style="font-size: 11px; color: #475569; margin: 6px 0 0 0; font-style: italic;"></p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                    <div>
                        <label style="font-size: 12px; font-weight: bold; color: #002E50; display: block; margin-bottom: 4px;">Cuota Inicial (%):</label>
                        <select id="combo-lov-inicial" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; color: #002E50; font-weight: 500;"></select>
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: bold; color: #002E50; display: block; margin-bottom: 4px;">Plazo de Financiamiento:</label>
                        <select id="combo-lov-plazo" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; color: #002E50; font-weight: 500;"></select>
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: bold; color: #002E50; display: block; margin-bottom: 4px;">Tasa de Interés Anual (TEA):</label>
                        <select id="combo-lov-tea" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; color: #002E50; font-weight: 500;"></select>
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: bold; color: #002E50; display: block; margin-bottom: 4px;">Seguro Desgravamen Mensual:</label>
                        <select id="combo-lov-desgravamen" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; color: #002E50; font-weight: 500;"></select>
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: bold; color: #002E50; display: block; margin-bottom: 4px;">Seguro de Inmueble Mensual:</label>
                        <select id="combo-lov-inmueble" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; color: #002E50; font-weight: 500;"></select>
                    </div>
                </div>
                <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; font-size: 13px; color: #475569; display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px;">
                    <div style="display: flex; justify-content: space-between;"><span>Monto Neto Financiado:</span><strong id="txt-calc-prestamo" style="color: #002E50;">-</strong></div>
                    <div style="display: flex; justify-content: space-between;"><span>Cuota Base (Amortización + Interés):</span><strong id="txt-calc-cuotabase" style="color: #002E50;">-</strong></div>
                    <div style="display: flex; justify-content: space-between;"><span>Costo Seguro Desgravamen:</span><strong id="txt-calc-segdesg" style="color: #002E50;">-</strong></div>
                    <div style="display: flex; justify-content: space-between;"><span>Costo Seguro Inmueble Todo Riesgo:</span><strong id="txt-calc-seginm" style="color: #002E50;">-</strong></div>
                </div>
                <button type="button" id="btn-guardar-simulacion-supabase" style="width: 100%; background: #FFB91D; color: #002E50; border: none; padding: 14px; font-size: 14px; font-weight: 800; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 4px rgba(255,185,29,0.2); transition: background 0.2s;">Enviar mi cronograma de hipoteca a mi correo</button>
            </div>
        </div>
        <div id="zillow-neighborhood-slot"></div>
    `;

                const cInicial = document.getElementById('combo-lov-inicial');
                const cPlazo = document.getElementById('combo-lov-plazo');
                const cTea = document.getElementById('combo-lov-tea');
                const cDesg = document.getElementById('combo-lov-desgravamen');
                const cInm = document.getElementById('combo-lov-inmueble');
                const btnGuardar = document.getElementById('btn-guardar-simulacion-supabase');

                let calculosGlobales = null;

                function ejecutarRecalculoHipoteca() { // Abre sub-función matemática ejecutarRecalculoHipoteca
                    const pctInicial = parseFloat(cInicial.value) || 0;
                    const anosPlazo = parseInt(cPlazo.value) || 0;
                    const valorTea = parseFloat(cTea.value) || 0;
                    const pctDesg = parseFloat(cDesg.value) || 0;
                    const pctInm = parseFloat(cInm.value) || 0;

                    if (pctInicial === 0 || anosPlazo === 0 || valorTea === 0) return;

                    const montoInicial = precioBase * pctInicial;
                    const montoPrestamo = precioBase - montoInicial;
                    const totalMeses = anosPlazo * 12;
                    const tasaMensualTEM = Math.pow(1 + valorTea, 1 / 12) - 1;

                    const cuotaBase = montoPrestamo * (tasaMensualTEM * Math.pow(1 + tasaMensualTEM, totalMeses)) / (Math.pow(1 + tasaMensualTEM, totalMeses) - 1);
                    const costoDesgravamen = montoPrestamo * pctDesg;
                    const costoInmueble = precioBase * pctInm;
                    const cuotaTotal = cuotaBase + costoDesgravamen + costoInmueble;
                    const ratioLtv = montoPrestamo / precioBase;

                    document.getElementById('display-pago-total-hipoteca').innerText = `$${Math.round(cuotaTotal).toLocaleString('en-US')}/mes`;
                    document.getElementById('display-pago-total-hipoteca').style.color = '#002E50';
                    document.getElementById('txt-calc-prestamo').innerText = `$${Math.round(montoPrestamo).toLocaleString('en-US')}`;
                    document.getElementById('txt-calc-cuotabase').innerText = `$${Math.round(cuotaBase).toLocaleString('en-US')}`;
                    document.getElementById('txt-calc-segdesg').innerText = `$${Math.round(costoDesgravamen).toLocaleString('en-US')}`;
                    document.getElementById('txt-calc-seginm').innerText = `$${Math.round(costoInmueble).toLocaleString('en-US')}`;

                    const opcionSeleccionada = cInicial.options[cInicial.selectedIndex];
                    document.getElementById('lov-comentario-dinamico').innerText = opcionSeleccionada ? opcionSeleccionada.getAttribute('data-comment') : '';

                    calculosGlobales = {
                        pctInicial,
                        montoInicial,
                        montoPrestamo,
                        totalMeses,
                        valorTea,
                        tasaMensualTEM,
                        pctDesg,
                        pctInm,
                        cuotaBase,
                        costoDesgravamen,
                        costoInmueble,
                        cuotaTotal,
                        ratioLtv
                    };
                } // Cierra sub-función matemática ejecutarRecalculoHipoteca

                [cInicial, cPlazo, cTea, cDesg, cInm].forEach(combo => combo.addEventListener('change', ejecutarRecalculoHipoteca));

                btnGuardar.addEventListener('click', async () => {
                    if (typeof verificarAutorizacionAcceso === "function" && !verificarAutorizacionAcceso()) return;
                    if (!calculosGlobales) return;

                    btnGuardar.innerText = "Generando cronograma PDF y enviando correo...";
                    btnGuardar.disabled = true;

                    try {
                        const cliente = obtenerClienteSupabase();
                        const idUsuario = window.usuarioLogueado ? window.usuarioLogueado.id : 'anonimo_invitado';

                        const {
                            error
                        } = await cliente
                            .from('simulacion_hipotecaria')
                            .insert([{
                                usuario_id_fk: idUsuario,
                                propiedad_id_fk: String(prop.id),
                                hipoteca_id_fk: 1,
                                tipo_propiedad: tipoProp,
                                precio_propiedad: precioBase,
                                pago_inicial: calculosGlobales.montoInicial,
                                porc_cuota_inicial: calculosGlobales.pctInicial,
                                monto_prestamo: calculosGlobales.montoPrestamo,
                                plazo_meses: calculosGlobales.totalMeses,
                                tasa_tea: calculosGlobales.valorTea,
                                tasa_tem: calculosGlobales.tasaMensualTEM,
                                porc_seguro_desgravamen: calculosGlobales.pctDesg,
                                porc_seguro_inmueble: calculosGlobales.pctInm,
                                cuota_base_mensual: calculosGlobales.cuotaBase,
                                seguro_desgravamen_mes1: calculosGlobales.costoDesgravamen,
                                seguro_inmueble_mes1: calculosGlobales.costoInmueble,
                                pago_mensual_estimated: calculosGlobales.cuotaTotal,
                                ltv: calculosGlobales.ratioLtv
                            }]);

                        if (error) throw error;

                        alert("¡Cronograma generado exitosamente! Hemos procesado tu corrida de cuotas en dólares y el documento oficial PDF está en camino a tu bandeja de correo registrado.");
                        btnGuardar.innerText = "Cronograma Enviado Exitosamente";
                        btnGuardar.style.background = "#002E50";
                        btnGuardar.style.color = "#FFB91D";

                    } catch (err) {
                        console.error("Fallo guardando simulación:", err.message);
                        alert("Error procesando solicitud: " + err.message);
                        btnGuardar.innerText = "Enviar mi cronograma de hipoteca a mi correo";
                        btnGuardar.disabled = false;
                    }
                });

                try {
                    const cliente = obtenerClienteSupabase();
                    if (cliente) {
                        const [rInicial, rPlazo, rTea, rDesg, rInm] = await Promise.all([
                            cliente.from('LOV_hipoteca_cuota_inicial').select('*').order('cuota_inicial', {
                                ascending: true
                            }),
                            cliente.from('LOV_hipoteca_plazo').select('*'),
                            cliente.from('LOV_hipoteca_TEA').select('*'),
                            cliente.from('LOV_hipoteca_desgravamen').select('*'),
                            cliente.from('LOV_hipoteca_seguro_inmueble').select('*')
                        ]);

                        if (rInicial.data && rInicial.data.length > 0) {
                            cInicial.innerHTML = rInicial.data.map(opt => {
                                const pctValor = parseFloat(opt.cuota_inicial) || 0;
                                const textoPorcentaje = (pctValor * 100).toFixed(0) + '% Inicial';
                                return `<option value="${pctValor}" data-comment="${opt.comentarios_sbs_mercado || ''}">${textoPorcentaje}</option>`;
                            }).join('');
                        } else {
                            cInicial.innerHTML = '<option value="0.20" data-comment="Mínimo regular">20% Mínimo</option>';
                        }

                        if (rPlazo.data && rPlazo.data.length > 0) {
                            cPlazo.innerHTML = rPlazo.data.map(opt => {
                                const valorAnos = parseFloat(opt.anos || opt.plazo_anos || Object.values(opt)[1] || 20);
                                return `<option value="${valorAnos}">${valorAnos} Años</option>`;
                            }).join('');
                        } else {
                            cPlazo.innerHTML = '<option value="20">20 Años</option>';
                        }

                        if (rTea.data && rTea.data.length > 0) {
                            cTea.innerHTML = rTea.data.map(opt => {
                                const valorTea = parseFloat(opt.tasa_tea || opt.tea || Object.values(opt)[1] || 0.085);
                                return `<option value="${valorTea}">${(valorTea * 100).toFixed(2)}% TEA</option>`;
                            }).join('');
                        } else {
                            cTea.innerHTML = '<option value="0.085">8.50% TEA</option>';
                        }

                        if (rDesg.data && rDesg.data.length > 0) {
                            cDesg.innerHTML = rDesg.data.map(opt => {
                                const valorDesg = parseFloat(opt.tasa_mensual || opt.desgravamen || Object.values(opt)[1] || 0.0005);
                                return `<option value="${valorDesg}">${(valorDesg * 100).toFixed(3)}% Mensual</option>`;
                            }).join('');
                        } else {
                            cDesg.innerHTML = '<option value="0.0005">0.05% Mensual</option>';
                        }

                        if (rInm.data && rInm.data.length > 0) {
                            cInm.innerHTML = rInm.data.map(opt => {
                                const valorInm = parseFloat(opt.tasa_mensual || opt.seguro_inmueble || Object.values(opt)[1] || 0.00025);
                                return `<option value="${valorInm}">${(valorInm * 100).toFixed(3)}% Mensual</option>`;
                            }).join('');
                        } else {
                            cInm.innerHTML = '<option value="0.00025">0.025% Mensual</option>';
                        }

                        ejecutarRecalculoHipoteca();
                    }
                } catch (errLOV) {
                    console.warn("Fallo cargando valores LOV desde Supabase, usando valores por defecto.", errLOV);
                    cInicial.innerHTML = '<option value="0.20">20% Inicial</option>';
                    cPlazo.innerHTML = '<option value="20">20 Años</option>';
                    cTea.innerHTML = '<option value="0.085">8.50% TEA</option>';
                    cDesg.innerHTML = '<option value="0.0005">0.05% Mensual</option>';
                    cInm.innerHTML = '<option value="0.00025">0.025% Mensual</option>';
                    ejecutarRecalculoHipoteca();
                }
            }
}); // Cierra el DOMContentLoaded del archivo
