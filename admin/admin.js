/* jshint esversion: 11 */

// ==========================================================================
// MÓDULO INDEPENDIENTE: PANEL DE MANTENIMIENTO CRUD (admin/admin.js)
// ==========================================================================

let tablaCrudActiva = 'propiedad';
let catalogoCaracteristicasAdmin = [];

// [INICIO DE LLAVES]: Configuración declarativa de las 7 tablas del panel administrativo
const CONFIGURACION_TABLAS_CRUD = {
    propiedad: {
        titulo: 'Propiedades (Esquema Completo)',
        pk: 'propiedad_id',
        campos: [
            { nombre: 'propiedad_id', label: 'ID Propiedad', tipo: 'text', requerido: true },
            { nombre: 'usuario_id_fk', label: 'ID Usuario FK', tipo: 'text' },
            { nombre: 'tipo_propiedad', label: 'Tipo Propiedad', tipo: 'select', opciones: ['Casa', 'Departamento', 'Terreno', 'Local', 'Oficina', 'Edificio', 'Lote'] },
            { nombre: 'subtipo_propiedad', label: 'Subtipo Propiedad', tipo: 'text' },
            { nombre: 'titulo', label: 'Título de Anuncio', tipo: 'text', requerido: true },
            { nombre: 'codigo_ubigeo_id_fk', label: 'Ubicación Territorial', tipo: 'text' },
            { nombre: 'pais', label: 'País', tipo: 'text' },
            { nombre: 'departamento', label: 'Departamento', tipo: 'text' },
            { nombre: 'provincia', label: 'Provincia', tipo: 'text' },
            { nombre: 'distrito', label: 'Distrito', tipo: 'text' },
            { nombre: 'codigo_postal', label: 'Código Postal y Centro Poblado', tipo: 'select', requerido: true },
            { nombre: 'latitud', label: 'Latitud', tipo: 'number' },
            { nombre: 'longitud', label: 'Longitud', tipo: 'number' },
            { nombre: 'geocode_precision', label: 'Precisión Geocode', tipo: 'text' },
            { nombre: 'referencia_mapa', label: 'Referencia Mapa', tipo: 'text' },
            { nombre: 'enlace_mapa', label: 'Enlace Mapa', tipo: 'text' },
            { nombre: 'direccion', label: 'Dirección', tipo: 'text' },
            { nombre: 'descripcion', label: 'Descripción', tipo: 'text' },
            { nombre: 'area_terreno', label: 'Área Terreno (m²)', tipo: 'number' },
            { nombre: 'area_construida', label: 'Área Construida (m²)', tipo: 'number' },
            { nombre: 'habitaciones', label: 'Habitaciones', tipo: 'number' },
            { nombre: 'banos', label: 'Baños', tipo: 'number' },
            { nombre: 'estacionamientos', label: 'Estacionamientos', tipo: 'number' },
            { nombre: 'ano_construccion', label: 'Año Construcción', tipo: 'number' },
            { nombre: 'estado_propiedad', label: 'Estado Propiedad', tipo: 'select', opciones: ['nueva', 'usada', 'en_construccion', 'remodelada'] },
            { nombre: 'precio_base', label: 'Precio Base ($)', tipo: 'number', requerido: true },
            { nombre: 'moneda', label: 'Moneda', tipo: 'select', opciones: ['USD', 'PEN'] },
            { nombre: 'foto_principal', label: 'Foto Principal', tipo: 'text' },
            { nombre: 'estado_publicacion', label: 'Estado Publicación', tipo: 'select', opciones: ['disponible', 'vendida', 'alquilada', 'reservada'] },
            { nombre: 'cuota_mantenimiento', label: 'Cuota Mantenimiento', tipo: 'number' },
            { nombre: 'situacion_propiedad', label: 'Situación Propiedad', tipo: 'text' },
            { nombre: 'sotano', label: 'Sótano', tipo: 'select', opciones: ['Sí', 'No'] },
            { nombre: 'almacen', label: 'Almacén', tipo: 'select', opciones: ['Sí', 'No'] },
            { nombre: 'vista', label: 'Vista', tipo: 'text' }
        ]
    },
    caracteristica_propiedad: {
        titulo: 'Características de Propiedad',
        pk: 'caracteristica_id',
        campos: [
            { nombre: 'caracteristica_id', label: 'ID Característica', tipo: 'text', requerido: true },
            { nombre: 'propiedad_id_fk', label: 'ID Propiedad FK', tipo: 'text', requerido: true },
            { nombre: 'nombre_caracteristica', label: 'Nombre (Ej: Piscina, Parrilla)', tipo: 'text', requerido: true },
            { nombre: 'valor_caracteristica', label: 'Valor', tipo: 'text' },
            { nombre: 'unidad', label: 'Unidad', tipo: 'text' },
            { nombre: 'tipo_data', label: 'Tipo de Dato', tipo: 'text' }
        ]
    },
    anuncio: {
        titulo: 'Anuncios',
        pk: 'anuncio_id',
        campos: [
            { nombre: 'propiedad_id_fk', label: 'ID Propiedad FK', tipo: 'text', requerido: true },
            { nombre: 'tipo_anuncio', label: 'Tipo de Anuncio', tipo: 'select', opciones: ['Venta', 'Alquiler'], requerido: true },
            { nombre: 'usuario_id_fk', label: 'ID Usuario FK', tipo: 'text' },
            { nombre: 'agente_id_fk', label: 'ID Agente FK', tipo: 'text' },
            { nombre: 'fecha_publicacion', label: 'Fecha Publicación', tipo: 'date' },
            { nombre: 'estado_anuncio', label: 'Estado Anuncio', tipo: 'select', opciones: ['activo', 'pausado', 'cerrado', 'expirado'] }
        ]
    },
    agente_inmobiliario: {
        titulo: 'Agentes Inmobiliarios',
        pk: 'agente_id',
        campos: [
            { nombre: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
            { nombre: 'apellido', label: 'Apellido', tipo: 'text', requerido: true },
            { nombre: 'correo', label: 'Correo Electrónico', tipo: 'email', requerido: true },
            { nombre: 'telefono', label: 'Teléfono Agente', tipo: 'text' },
            { nombre: 'licencia', label: 'Licencia MVCS', tipo: 'text' },
            { nombre: 'zona_servicio', label: 'Zona Servicio', tipo: 'text' },
            { nombre: 'prioridad', label: 'Prioridad', tipo: 'number' },
            { nombre: 'leads', label: 'Máximo Leads', tipo: 'number' },
            { nombre: 'leads_recibidos', label: 'Leads Recibidos', tipo: 'number' }
        ]
    },
    usuario_autenticado: {
        titulo: 'Usuarios y Socios',
        pk: 'usuario_id',
        campos: [
            { nombre: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
            { nombre: 'apellido', label: 'Apellido', tipo: 'text', requerido: true },
            { nombre: 'correo', label: 'Correo Electrónico', tipo: 'email', requerido: true },
            { nombre: 'telefono', label: 'Teléfono', tipo: 'text' },
            { nombre: 'rol_id_fk', label: 'Rol ID (3:Prop, 4:Agente, 5:Cerr, 6:Arrend, 8:Admin, 9:Financ, 10:Anunc)', tipo: 'number', requerido: true },
            { nombre: 'estado_cuenta', label: 'Estado Cuenta', tipo: 'select', opciones: ['activo', 'pendiente', 'suspendido'] }
        ]
    },
    visita: {
        titulo: 'Solicitudes de Tours / Visitas',
        pk: 'visita_id',
        campos: [
            { nombre: 'propiedad_id_fk', label: 'ID Propiedad FK', tipo: 'text', requerido: true },
            { nombre: 'nombre_visita', label: 'Nombre Interesado', tipo: 'text', requerido: true },
            { nombre: 'telefono', label: 'Teléfono', tipo: 'text' },
            { nombre: 'fecha_visita', label: 'Fecha/Hora Visita', tipo: 'text' },
            { nombre: 'estado_visita', label: 'Estado Visita', tipo: 'select', opciones: ['pendiente', 'confirmada', 'cancelada', 'completada'] },
            { nombre: 'estado_lead', label: 'Estado Lead', tipo: 'select', opciones: ['nuevo', 'contactado', 'en_proceso', 'cerrado'] }
        ]
    },
    simulacion_hipotecaria: {
        titulo: 'Simulaciones Hipotecarias',
        pk: 'simulacion_id',
        campos: [
            { nombre: 'propiedad_id_fk', label: 'ID Propiedad FK', tipo: 'text', requerido: true },
            { nombre: 'precio_propiedad', label: 'Precio Propiedad ($)', tipo: 'number' },
            { nombre: 'monto_prestamo', label: 'Monto Préstamo ($)', tipo: 'number' },
            { nombre: 'pago_mensual_estimado', label: 'Cuota Estimada ($)', tipo: 'number' },
            { nombre: 'plazo_meses', label: 'Plazo Meses', tipo: 'number' },
            { nombre: 'tasa_tea', label: 'Tasa TEA', tipo: 'number' }
        ]
    }
}; // [FIN DE LLAVES]: Cierra CONFIGURACION_TABLAS_CRUD

/**
 * Helper centralizado para saber si el usuario logueado es Administrador (rol_id = 8).
 */
// [INICIO DE LLAVES]: Abre esUsuarioAdministrador
function esUsuarioAdministrador() {
    const p = window.APP_AUTH?.permisosActuales || {};
    const u = window.APP_AUTH?.usuarioActual || {};
    return Number(p.rol_id || u.rol_id_fk) === window.APP_CONFIG.ROL_ID_ADMIN
        || String(p.nombres_rol || '').toLowerCase().startsWith('admin');
} // [FIN DE LLAVES]: Cierra esUsuarioAdministrador

/**
 * Punto de entrada del módulo administrativo: protege la ruta y construye las pestañas.
 */
// [INICIO DE LLAVES]: Abre escuchador DOMContentLoaded de admin.js
document.addEventListener('DOMContentLoaded', async () => {
    const auth = await window.inicializarSesionCompartida({
        exigirAccesoCrud: true,
        urlRedireccion: '../index.html'
    });

    if (!auth || !auth.usuarioActual) return;

    const badgeRol = document.getElementById('badge-rol-admin');
    const lblCorreo = document.getElementById('lbl-correo-admin');
    const btnNuevo = document.getElementById('btn-nuevo-registro-crud');

    if (badgeRol) badgeRol.textContent = `Rango Autorizado: ${(auth.permisosActuales.nombres_rol || 'Usuario').toUpperCase()}`;
    if (lblCorreo) lblCorreo.textContent = auth.usuarioActual.correo;

    if (btnNuevo && auth.permisosActuales.permiso_insertar) {
        btnNuevo.style.display = 'inline-block';
        btnNuevo.onclick = () => abrirFormularioEdicionCrud(tablaCrudActiva, null);
    }

    renderizarBarraPestanasCrud();
    await cargarDatosTablaCrud(tablaCrudActiva);
}); // [FIN DE LLAVES]: Cierra DOMContentLoaded

/**
 * Renderiza los botones de pestañas para cambiar entre las 7 tablas del sistema.
 */
// [INICIO DE LLAVES]: Abre renderizarBarraPestanasCrud
function renderizarBarraPestanasCrud() {
    const barra = document.getElementById('barra-tabs-crud');
    if (!barra) return;

    barra.innerHTML = Object.keys(CONFIGURACION_TABLAS_CRUD).map(keyTab => `
        <button type="button" class="btn-tab-crud ${keyTab === tablaCrudActiva ? 'activo' : ''}" data-tabla="${keyTab}">
            ${CONFIGURACION_TABLAS_CRUD[keyTab].titulo}
        </button>
    `).join('');

    // [INICIO DE LLAVES]: Delegación de clic para cambiar de pestaña activa
    barra.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-tab-crud');
        if (!btn) return;
        tablaCrudActiva = btn.getAttribute('data-tabla');

        barra.querySelectorAll('.btn-tab-crud').forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');

        const titulo = document.getElementById('titulo-tabla-crud');
        if (titulo) titulo.textContent = CONFIGURACION_TABLAS_CRUD[tablaCrudActiva].titulo;

        cargarDatosTablaCrud(tablaCrudActiva);
    }); // [FIN DE LLAVES]: Cierra delegación de pestañas
} // [FIN DE LLAVES]: Cierra renderizarBarraPestanasCrud

/**
 * Consulta Supabase y pinta la tabla de registros con sus botones de Editar y Eliminar.
 */
// [INICIO DE LLAVES]: Abre cargarDatosTablaCrud
async function cargarDatosTablaCrud(nombreTabla) {
    const contenedor = document.getElementById('contenedor-tabla-datos-crud');
    const titulo = document.getElementById('titulo-tabla-crud');
    if (!contenedor) return;

    const conf = CONFIGURACION_TABLAS_CRUD[nombreTabla];
    if (titulo) titulo.textContent = conf.titulo;

    contenedor.innerHTML = `<p class="mensaje-carga">Consultando registros de ${nombreTabla}...</p>`;

    try {
        const cliente = window.getSupabaseShared();
        if (!cliente) throw new Error('Cliente Supabase inaccesible.');

        let consulta = cliente.from(nombreTabla).select('*').limit(150);

        if (nombreTabla === 'propiedad' && !esUsuarioAdministrador() && window.APP_AUTH?.usuarioActual?.id) {
            consulta = consulta.eq('usuario_id_fk', window.APP_AUTH.usuarioActual.id);
        }

        const { data, error } = await consulta;
        if (error) throw error;

        if (!data || data.length === 0) {
            contenedor.innerHTML = `<p class="mensaje-carga">No existen registros disponibles en esta tabla.</p>`;
            return;
        }

        const permisos = window.APP_AUTH?.permisosActuales || {};

        contenedor.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background: #002e50; color: #ffffff;">
                        <th style="padding: 12px 10px; font-weight: bold; width: 130px;">Acciones</th>
                        ${conf.campos.map(c => `<th style="padding: 12px 10px; font-weight: bold; white-space: nowrap;">${c.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.map(fila => `
                        <tr style="border-bottom: 1px solid #e2e8f0;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#ffffff'">
                            <td style="padding: 10px; white-space: nowrap;">
                                ${permisos.permiso_modificar ? `<button class="btn-edit-crud" data-id="${fila[conf.pk]}" style="background: #006aff; color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer; margin-right: 4px;">Editar</button>` : ''}
                                ${permisos.permiso_eliminar ? `<button class="btn-delete-crud" data-id="${fila[conf.pk]}" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;">Eliminar</button>` : ''}
                            </td>
                            ${conf.campos.map(c => `<td style="padding: 10px; color: #334155; max-width: 210px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${fila[c.nombre] !== null && fila[c.nombre] !== undefined ? fila[c.nombre] : '-'}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // [INICIO DE LLAVES]: Enlaza botones Editar
        contenedor.querySelectorAll('.btn-edit-crud').forEach(btn => {
            btn.onclick = () => {
                const idReg = btn.getAttribute('data-id');
                const filaObj = data.find(item => String(item[conf.pk]) === String(idReg));
                abrirFormularioEdicionCrud(nombreTabla, filaObj);
            };
        }); // [FIN DE LLAVES]: Cierra botones Editar

        // [INICIO DE LLAVES]: Enlaza botones Eliminar
        contenedor.querySelectorAll('.btn-delete-crud').forEach(btn => {
            btn.onclick = async () => {
                const idReg = btn.getAttribute('data-id');
                if (confirm(`¿Confirma eliminar el registro ${idReg} de ${nombreTabla}?`)) {
                    await eliminarRegistroCrud(nombreTabla, conf.pk, idReg);
                }
            };
        }); // [FIN DE LLAVES]: Cierra botones Eliminar

    } catch (err) {
        contenedor.innerHTML = `<p style="color: #ef4444; text-align: center; padding: 30px;">Error cargando datos: ${err.message}</p>`;
    }
} // [FIN DE LLAVES]: Cierra cargarDatosTablaCrud

// ==========================================================================
// MÓDULO TERRITORIAL: paises_configuracion + ubicaciones_territoriales
// ==========================================================================

const normalizarTextoAdmin = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const COLUMNAS_TERRITORIO_ADMIN = 'id, pais_iso, nivel_jerarquia, nombre, codigo_oficial, parent_id';

/**
 * Rellena un elemento <select> con un texto inicial y un arreglo de opciones {valor, texto}.
 */
// [INICIO DE LLAVES]: Abre poblarSelectCascadaCrud
function poblarSelectCascadaCrud(selectNode, textoPlaceholder, opciones, valorSeleccionado) {
    if (!selectNode) return false;

    selectNode.innerHTML = '';
    selectNode.appendChild(new Option(textoPlaceholder, ''));

    const valorBuscado = String(valorSeleccionado ?? '').trim().toLowerCase();
    let yaSeleccionado = false;

    // [INICIO DE LLAVES]: Recorre opciones y marca la coincidencia
    opciones.forEach(op => {
        const optionNode = new Option(op.texto, op.valor);
        if (!yaSeleccionado && valorBuscado !== '' && String(op.valor).trim().toLowerCase() === valorBuscado) {
            optionNode.selected = true;
            yaSeleccionado = true;
        }
        selectNode.appendChild(optionNode);
    }); // [FIN DE LLAVES]: Cierra bucle de opciones

    if (!yaSeleccionado) selectNode.value = '';
    return yaSeleccionado;
} // [FIN DE LLAVES]: Cierra poblarSelectCascadaCrud

/**
 * Obtiene el nombre del nivel administrativo (Departamento, Provincia, Distrito, etc.) según el país.
 */
// [INICIO DE LLAVES]: Abre etiquetaNivelTerritorial
function etiquetaNivelTerritorial(pais, nivel) {
    if (!pais || !pais.etiquetas_niveles) return `Nivel ${nivel}`;
    const e = pais.etiquetas_niveles;
    const etiqueta = e[nivel] || e[String(nivel)] || (typeof e === 'object' ? Object.values(e)[nivel - 1] : null);
    return String(etiqueta || `Nivel ${nivel}`);
} // [FIN DE LLAVES]: Cierra etiquetaNivelTerritorial

/**
 * Consulta los nodos hijos de un nivel territorial específico en Supabase.
 */
// [INICIO DE LLAVES]: Abre consultarNivelTerritorial
async function consultarNivelTerritorial(cliente, paisIso, nivel, parentId) {
    let consulta = cliente.from('ubicaciones_territoriales')
        .select(COLUMNAS_TERRITORIO_ADMIN)
        .eq('pais_iso', paisIso)
        .eq('nivel_jerarquia', nivel);

    if (nivel > 1) consulta = consulta.eq('parent_id', parentId);

    const { data, error } = await consulta.order('nombre', { ascending: true }).limit(1000);
    if (error) {
        console.warn('Error consultando nivel territorial:', error.message);
        return [];
    }
    return data || [];
} // [FIN DE LLAVES]: Cierra consultarNivelTerritorial

/**
 * Reconstruye la ruta completa [Nivel 1, Nivel 2, Nivel 3] desde un codigo_oficial guardado.
 */
// [INICIO DE LLAVES]: Abre obtenerCadenaTerritorial
async function obtenerCadenaTerritorial(cliente, codigoOficial, paisIso) {
    const codigo = String(codigoOficial || '').trim();
    if (!codigo) return [];

    let consulta = cliente.from('ubicaciones_territoriales').select(COLUMNAS_TERRITORIO_ADMIN).eq('codigo_oficial', codigo);
    if (paisIso) consulta = consulta.eq('pais_iso', paisIso);

    const { data: hojas, error } = await consulta.order('nivel_jerarquia', { ascending: false }).limit(1);
    if (error || !hojas || hojas.length === 0) return [];

    const cadena = [];
    let actual = hojas[0];

    // [INICIO DE LLAVES]: Sube por parent_id hasta llegar al nivel raíz
    for (let seguridad = 0; actual && seguridad < 10; seguridad++) {
        cadena.unshift(actual);
        if (actual.parent_id === null || actual.parent_id === undefined) break;

        const { data: padre } = await cliente.from('ubicaciones_territoriales')
            .select(COLUMNAS_TERRITORIO_ADMIN)
            .eq('id', actual.parent_id)
            .maybeSingle();
        actual = padre;
    } // [FIN DE LLAVES]: Cierra bucle ascendente

    return cadena;
} // [FIN DE LLAVES]: Cierra obtenerCadenaTerritorial

/**
 * Inicializa la cascada territorial: País -> N niveles -> codigo_oficial final en el input hidden.
 * En modo edición precarga y auto-selecciona toda la cadena a partir de codigo_ubigeo_id_fk.
 */
// [INICIO DE LLAVES]: Abre inicializarCascadaTerritorialCompleta
async function inicializarCascadaTerritorialCompleta(cliente, formNode, datosFilaEdicion) {
    const selPais = formNode.querySelector('#sel-lov-pais');
    const contenedor = formNode.querySelector('#contenedor-cascada-territorial');
    const hiddenFinal = formNode.querySelector('#input-hidden-ubicacion-final');
    if (!selPais || !contenedor || !hiddenFinal) return;

    try {
        const { data: paises, error: errPaises } = await cliente
            .from('paises_configuracion')
            .select('pais_iso, nombre_pais, niveles_totales, etiquetas_niveles')
            .order('nombre_pais', { ascending: true });
        if (errPaises) throw errPaises;

        const listaPaises = paises || [];
        const buscarPais = (valor) => listaPaises.find(p =>
            normalizarTextoAdmin(p.nombre_pais) === normalizarTextoAdmin(valor) ||
            normalizarTextoAdmin(p.pais_iso) === normalizarTextoAdmin(valor)) || null;

        const codigoGuardado = datosFilaEdicion ? String(datosFilaEdicion.codigo_ubigeo_id_fk || '').trim() : '';
        let paisInicial = datosFilaEdicion ? buscarPais(datosFilaEdicion.pais) : null;
        let cadenaInicial = [];

        // [INICIO DE LLAVES]: Precarga cadena si estamos editando un registro existente
        if (codigoGuardado) {
            cadenaInicial = await obtenerCadenaTerritorial(cliente, codigoGuardado, paisInicial ? paisInicial.pais_iso : null);
            if (cadenaInicial.length > 0 && !paisInicial) {
                paisInicial = listaPaises.find(p => p.pais_iso === cadenaInicial.pais_iso) || null;
            }
        } // [FIN DE LLAVES]: Cierra precarga de cadena

        if (!paisInicial) paisInicial = buscarPais('Perú') || buscarPais('PE') || listaPaises || null;

        const estiloSelect = 'padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; background: #fff; width: 100%;';

        // [INICIO DE LLAVES]: Subfunción interna para dibujar los N selectores de nivel
        async function renderizarNiveles(pais, cadena) {
            hiddenFinal.value = '';
            if (!pais) {
                contenedor.innerHTML = '<p style="font-size: 12px; color: #64748b; margin: 0;">Seleccione un país para ver los niveles territoriales.</p>';
                hiddenFinal.dispatchEvent(new Event('change'));
                return;
            }

            const total = Number(pais.niveles_totales) || 3;
            contenedor.innerHTML = '';
            const selects = [];

            for (let n = 1; n <= total; n++) {
                const wrap = document.createElement('div');
                wrap.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';
                const lbl = document.createElement('label');
                lbl.style.cssText = 'font-size: 11px; font-weight: bold; color: #002e50;';
                lbl.textContent = `${n}. ${etiquetaNivelTerritorial(pais, n)}`;
                const sel = document.createElement('select');
                sel.className = 'select-territorio-dinamico';
                sel.id = `sel-territorio-nivel-${n}`;
                sel.dataset.nivel = String(n);
                sel.style.cssText = estiloSelect;
                sel._items = [];
                poblarSelectCascadaCrud(sel, `-- Seleccione ${etiquetaNivelTerritorial(pais, n)} --`, [], '');
                sel.disabled = n > 1;
                wrap.append(lbl, sel);
                contenedor.appendChild(wrap);
                selects.push(sel);
            }

            const cargarNivel = async (n, parentId, valorPre) => {
                const sel = selects[n - 1];
                if (!sel) return;
                sel.disabled = true;
                const items = await consultarNivelTerritorial(cliente, pais.pais_iso, n, parentId);
                sel._items = items;
                poblarSelectCascadaCrud(
                    sel, `-- Seleccione ${etiquetaNivelTerritorial(pais, n)} --`,
                    items.map(it => ({ valor: String(it.id), texto: it.nombre })),
                    valorPre
                );
                sel.disabled = items.length === 0;
            };

            const actualizarValorFinal = () => {
                let ultimo = null;
                selects.forEach(sel => {
                    if (!sel.value) return;
                    const it = sel._items.find(x => String(x.id) === sel.value);
                    if (it) ultimo = it;
                });
                hiddenFinal.value = ultimo ? String(ultimo.codigo_oficial || ultimo.id) : '';
                hiddenFinal.dispatchEvent(new Event('change'));
            };

            selects.forEach((sel, idx) => {
                sel.onchange = async () => {
                    for (let j = idx + 1; j < selects.length; j++) {
                        selects[j]._items = [];
                        poblarSelectCascadaCrud(selects[j], `-- Seleccione ${etiquetaNivelTerritorial(pais, j + 1)} --`, [], '');
                        selects[j].disabled = true;
                    }
                    if (sel.value && idx + 1 < selects.length) {
                        await cargarNivel(idx + 2, Number(sel.value), '');
                    }
                    actualizarValorFinal();
                };
            });

            await cargarNivel(1, null, cadena ? String(cadena.id) : '');
            for (let i = 1; i < total; i++) {
                if (!cadena[i - 1]) break;
                await cargarNivel(i + 1, cadena[i - 1].id, cadena[i] ? String(cadena[i].id) : '');
            }
            if (cadena.length > 0) actualizarValorFinal();
        } // [FIN DE LLAVES]: Cierra subfunción renderizarNiveles

        selPais.onchange = async () => { await renderizarNiveles(buscarPais(selPais.value), []); };

        poblarSelectCascadaCrud(
            selPais, '-- Seleccione País --',
            listaPaises.map(p => ({ valor: p.nombre_pais, texto: p.nombre_pais })),
            paisInicial ? paisInicial.nombre_pais : ''
        );

        if (selPais.options.length > 1 && !selPais.value) selPais.selectedIndex = 1;
        await renderizarNiveles(buscarPais(selPais.value), cadenaInicial);

    } catch (errCascada) {
        console.warn('Error al inicializar la cascada territorial:', errCascada);
        contenedor.innerHTML = '<p style="font-size: 12px; color: #ef4444; margin: 0;">Error cargando niveles territoriales.</p>';
    }
} // [FIN DE LLAVES]: Cierra inicializarCascadaTerritorialCompleta

/**
 * Filtra lov_codigo_postal según el codigo_ubigeo_id seleccionado en la cascada territorial.
 */
// [INICIO DE LLAVES]: Abre inicializarCodigoPostalDependiente
async function inicializarCodigoPostalDependiente(cliente, formNode, datosFila) {
    const selPostal = formNode.querySelector('#sel-lov-codigo_postal');
    const hiddenFinal = formNode.querySelector('#input-hidden-ubicacion-final');
    if (!selPostal || !hiddenFinal) return;

    const postalGuardado = datosFila && datosFila.codigo_postal ? String(datosFila.codigo_postal).trim() : '';
    let ultimaConsulta = '';

    // [INICIO DE LLAVES]: Función interna recargar opciones postales
    const recargar = async (preseleccion) => {
        const codigo = hiddenFinal.value.trim();
        if (!codigo) {
            poblarSelectCascadaCrud(selPostal, '-- Seleccione primero la ubicación --', [], '');
            return;
        }
        ultimaConsulta = codigo;
        const { data, error } = await cliente.from('lov_codigo_postal')
            .select('codigo_postal, centro_poblado')
            .eq('codigo_ubigeo_id', codigo)
            .order('centro_poblado', { ascending: true });

        if (ultimaConsulta !== codigo) return;
        if (error) console.warn('Error consultando lov_codigo_postal:', error.message);

        const vistos = new Set();
        const opciones = [];
        (data || []).forEach(r => {
            const clave = `${r.codigo_postal}|${r.centro_poblado}`;
            if (vistos.has(clave)) return;
            vistos.add(clave);
            opciones.push({ valor: r.codigo_postal, texto: `${r.codigo_postal} - ${r.centro_poblado}` });
        });

        if (preseleccion && !opciones.some(o => String(o.valor) === String(preseleccion))) {
            opciones.unshift({ valor: preseleccion, texto: preseleccion });
        }

        poblarSelectCascadaCrud(
            selPostal,
            opciones.length ? '-- Seleccione Código Postal --' : '-- Sin códigos postales para esta ubicación --',
            opciones, preseleccion
        );
    }; // [FIN DE LLAVES]: Cierra subfunción recargar

    hiddenFinal.addEventListener('change', () => recargar(''));
    await recargar(postalGuardado);
} // [FIN DE LLAVES]: Cierra inicializarCodigoPostalDependiente

/**
 * Rellena un <select> existente a partir de filas consultadas de una tabla LOV.
 */
// [INICIO DE LLAVES]: Abre poblarSelectDinamicoFlex
function poblarSelectDinamicoFlex(idSelect, filas, columnasPosibles) {
    const sel = document.getElementById(idSelect);
    if (!sel || !Array.isArray(filas) || filas.length === 0) return;

    const actual = String(sel.getAttribute('data-actual') || '').trim();
    const vistos = new Set();
    const opciones = [];

    filas.forEach(fila => {
        const col = columnasPosibles.find(c => fila[c] !== undefined && fila[c] !== null && String(fila[c]).trim() !== '');
        if (!col) return;
        const valor = String(fila[col]).trim();
        if (vistos.has(valor)) return;
        vistos.add(valor);
        opciones.push({ valor, texto: valor });
    });

    if (actual && !opciones.some(o => o.valor.toLowerCase() === actual.toLowerCase())) {
        opciones.unshift({ valor: actual, texto: actual });
    }

    poblarSelectCascadaCrud(sel, '-- Seleccione --', opciones, actual);
} // [FIN DE LLAVES]: Cierra poblarSelectDinamicoFlex

/**
 * Genera dinámicamente el submodal de creación/edición y carga las relaciones de la propiedad.
 */
// [INICIO DE LLAVES]: Abre abrirFormularioEdicionCrud
async function abrirFormularioEdicionCrud(nombreTabla, datosFila) {
    const conf = CONFIGURACION_TABLAS_CRUD[nombreTabla];
    const esEdicion = datosFila !== null;

    let fotosSecundariasObtenidas = [];
    let caracteristicasObtenidas = [];
    let promocionesObtenidas = [];
    let recorridos3dObtenidos = [];

    // [INICIO DE LLAVES]: Recupera relaciones secundarias en modo edición de propiedad
    if (esEdicion && nombreTabla === 'propiedad' && datosFila[conf.pk]) {
        try {
            const cliente = window.getSupabaseShared();
            if (cliente) {
                const { data: imgsBD } = await cliente
                    .from('imagen_propiedad')
                    .select('ruta_imagen, orden, tipo_imagen')
                    .eq('propiedad_id_fk', datosFila[conf.pk])
                    .order('orden', { ascending: true });

                if (imgsBD && imgsBD.length > 0) {
                    fotosSecundariasObtenidas = imgsBD.map(item => ({ ruta: item.ruta_imagen, tipo: item.tipo_imagen || 'interior' }));
                }

                const { data: caracBD } = await cliente
                    .from('caracteristica_propiedad')
                    .select('nombre_caracteristica, valor_caracteristica')
                    .eq('propiedad_id_fk', datosFila[conf.pk]);

                if (caracBD && caracBD.length > 0) caracteristicasObtenidas = caracBD;

                const { data: anuncioRel } = await cliente
                    .from('anuncio')
                    .select('anuncio_id, tipo_anuncio, estado_anuncio')
                    .eq('propiedad_id_fk', datosFila[conf.pk])
                    .maybeSingle();

                if (anuncioRel && anuncioRel.anuncio_id) {
                    datosFila.tipo_anuncio = anuncioRel.tipo_anuncio || datosFila.tipo_anuncio;
                    datosFila.estado_anuncio = anuncioRel.estado_anuncio || 'pausado';

                    const [resPromos, resRecs] = await Promise.all([
                        cliente.from('promocion').select('*').eq('anuncio_id_fk', anuncioRel.anuncio_id),
                        cliente.from('recorrido_3d').select('*').eq('anuncio_id', anuncioRel.anuncio_id)
                    ]);
                    promocionesObtenidas = resPromos.data || [];
                    recorridos3dObtenidos = resRecs.data || [];
                }
            }
        } catch (errRel) {
            console.warn('Error cargando relaciones de la propiedad:', errRel);
        }
    } // [FIN DE LLAVES]: Cierra recuperación de relaciones

    const idUsuarioActualSugerido = window.APP_AUTH?.usuarioActual?.id || '';
    const valorPkSugerido = esEdicion ? (datosFila[conf.pk] || '') : (nombreTabla === 'propiedad' ? 'AUTO-SEQ' : 'SRE-' + Math.random().toString(36).substring(2, 8).toUpperCase());

    const subModal = document.getElementById('submodal-formulario-crud');
    if (!subModal) return;

    // [INICIO DE LLAVES]: Ordena y filtra campos visibles para la tabla propiedad
    let camposAProcesar = [...conf.campos];
    if (nombreTabla === 'propiedad') {
        const ordenDeseado = [
            'propiedad_id', 'usuario_id_fk', 'tipo_propiedad', 'subtipo_propiedad', 'titulo',
            'pais', 'codigo_ubigeo_id_fk', 'codigo_postal', 'direccion',
            'latitud', 'longitud', 'geocode_precision', 'referencia_mapa', 'enlace_mapa'
        ];
        const esAdminSistema = esUsuarioAdministrador();

        camposAProcesar = camposAProcesar.filter(c => {
            if (['pais', 'departamento', 'provincia', 'distrito'].includes(c.nombre)) return false;
            if (!esAdminSistema && c.nombre === 'estado_publicacion') return false;
            return true;
        });

        camposAProcesar.sort((a, b) => {
            const iA = ordenDeseado.indexOf(a.nombre) === -1 ? 999 : ordenDeseado.indexOf(a.nombre);
            const iB = ordenDeseado.indexOf(b.nombre) === -1 ? 999 : ordenDeseado.indexOf(b.nombre);
            return iA - iB;
        });
    } // [FIN DE LLAVES]: Cierra filtrado y ordenamiento de campos

      let htmlPublicacionMultimedia = '';
    let html30CajasFotos = '';
    let htmlSeccionCaracteristicasEspeciales = '';

    // [INICIO DE LLAVES]: Construye bloques de anuncio, promociones, 3D, galería y características
    if (nombreTabla === 'propiedad') {
        const estiloCampo = 'padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; width: 100%; box-sizing: border-box; background: #fff;';
        const esAdminAnuncio = esUsuarioAdministrador();
        const tipoAnuncioActual = (esEdicion && datosFila) ? (datosFila.tipo_anuncio || 'Venta') : 'Venta';
        const estadoAnuncioActual = (esEdicion && datosFila && datosFila.estado_anuncio) ? datosFila.estado_anuncio : 'pausado';

        htmlPublicacionMultimedia = `
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 14px; margin-bottom: 12px;">
                <label style="font-size: 14px; font-weight: 800; color: #002e50;">Publicación, Promociones y Recorridos Virtuales 3D</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <label style="font-size: 12px; font-weight: bold; color: #334155;">Tipo de Anuncio</label>
                        <select name="tipo_anuncio" id="sel-lov-tipo_anuncio" style="${estiloCampo}">
                            <option value="Venta" ${tipoAnuncioActual === 'Venta' ? 'selected' : ''}>Venta</option>
                            <option value="Alquiler" ${tipoAnuncioActual === 'Alquiler' ? 'selected' : ''}>Alquiler</option>
                        </select>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <label style="font-size: 12px; font-weight: bold; color: #334155;">Estado del Anuncio</label>
                        ${esAdminAnuncio
                            ? `<select name="estado_anuncio" id="sel-lov-estado_anuncio" style="${estiloCampo}">
                                   <option value="pausado" ${estadoAnuncioActual === 'pausado' ? 'selected' : ''}>pausado</option>
                                   <option value="activo" ${estadoAnuncioActual === 'activo' ? 'selected' : ''}>activo</option>
                                   <option value="cerrado" ${estadoAnuncioActual === 'cerrado' ? 'selected' : ''}>cerrado</option>
                                   <option value="expirado" ${estadoAnuncioActual === 'expirado' ? 'selected' : ''}>expirado</option>
                               </select>`
                            : `<input type="text" name="estado_anuncio" value="pausado" readonly style="${estiloCampo} background: #f1f5f9; color: #64748b; cursor: not-allowed;">`
                        }
                    </div>
                </div>
                <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <label style="font-size: 12px; font-weight: 800; color: #002e50;">Promociones / Descuentos del Anuncio (Opcional)</label>
                        <button type="button" id="btn-agregar-promocion-extra" style="background: #006aff; color: #fff; border: none; padding: 5px 10px; border-radius: 5px; font-size: 11px; font-weight: bold; cursor: pointer;">+ Añadir Promoción</button>
                    </div>
                    <div id="contenedor-dinamico-promociones" style="display: flex; flex-direction: column; gap: 8px;"></div>
                </div>
                <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <label style="font-size: 12px; font-weight: 800; color: #002e50;">Recorridos Virtuales 3D (Opcional)</label>
                        <button type="button" id="btn-agregar-recorrido3d-extra" style="background: #006aff; color: #fff; border: none; padding: 5px 10px; border-radius: 5px; font-size: 11px; font-weight: bold; cursor: pointer;">+ Añadir Recorrido 3D</button>
                    </div>
                    <div id="contenedor-dinamico-recorridos3d" style="display: flex; flex-direction: column; gap: 8px;"></div>
                </div>
            </div>
        `;

              html30CajasFotos = `
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-top: 12px; margin-bottom: 12px;">
                <label style="font-size: 14px; font-weight: 800; color: #002e50; display: block; margin-bottom: 8px;">
                    Galería de Fotos y Clasificación (hasta 30 espacios):
                </label>
                <div style="display: flex; flex-direction: column; gap: 8px; max-height: 220px; overflow-y: auto; padding-right: 6px;">
        `;

        const tiposImagenOpciones = ['interior', 'fachada', 'cocina', 'baño', 'patio', 'plano'];
        for (let i = 1; i <= 30; i++) {
            const itemFoto = esEdicion ? fotosSecundariasObtenidas[i - 1] : undefined;
            const nombreFotoActual = itemFoto ? (itemFoto.ruta || '') : '';
            const tipoFotoActual = itemFoto ? (itemFoto.tipo || 'interior') : 'interior';
            const opcionesTipo = tiposImagenOpciones.includes(tipoFotoActual) ? tiposImagenOpciones : [tipoFotoActual, ...tiposImagenOpciones];

            html30CajasFotos += `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; background: #fff; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
                    <div style="display: flex; align-items: center; gap: 6px; width: 48%;">
                        <span style="font-size: 11px; font-weight: bold; color: #006aff; min-width: 20px;">#${i}</span>
                        <input type="text" name="foto_slot_${i}" value="${nombreFotoActual}" placeholder="Ej. foto_fachada.jpg" style="width: 100%; border: 1px solid #cbd5e1; padding: 4px 6px; border-radius: 4px; font-size: 12px;">
                    </div>
                    <div style="width: 48%;">
                        <select name="tipo_slot_${i}" style="width: 100%; border: 1px solid #cbd5e1; padding: 4px 6px; border-radius: 4px; font-size: 12px; background: #fff;">
                            ${opcionesTipo.map(t => `<option value="${t}" ${t === tipoFotoActual ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                </div>
            `;
        }
        html30CajasFotos += `</div></div>`;

        htmlSeccionCaracteristicasEspeciales = `
            <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-top: 16px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <label style="font-size: 14px; font-weight: 800; color: #002e50;">Características Especiales de la Propiedad:</label>
                    <button type="button" id="btn-agregar-caracteristica-extra" style="background: #006aff; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer;">+ Añadir Característica</button>
                </div>
                <div id="contenedor-dinamico-caracteristicas-especiales" style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;"></div>
            </div>
        `;
    } // [FIN DE LLAVES]: Cierra bloques HTML multimedia

      subModal.innerHTML = `
        <div style="background: #ffffff; padding: 24px; border-radius: 12px; width: 92%; max-width: 680px; max-height: 85vh; overflow-y: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                <h4 style="margin: 0; color: #002e50; font-size: 18px; font-weight: 700;">${esEdicion ? 'Editar' : 'Nuevo'} Registro - ${conf.titulo}</h4>
                <button type="button" id="btn-cerrar-submodal-x" style="background: none; border: none; font-size: 22px; font-weight: bold; color: #64748b; cursor: pointer;">&times;</button>
            </div>

            <form id="form-generico-crud" style="display: flex; flex-direction: column; gap: 14px;">
                ${camposAProcesar.map(c => {
                    let valorActual = esEdicion && datosFila[c.nombre] !== null && datosFila[c.nombre] !== undefined ? datosFila[c.nombre] : '';
                    if (!esEdicion && c.nombre === conf.pk) valorActual = valorPkSugerido;
                    if (!esEdicion && c.nombre === 'usuario_id_fk') valorActual = idUsuarioActualSugerido;

                    let inputHtml = '';
                    const esSelectLov = (c.tipo === 'select' || ['tipo_propiedad', 'subtipo_propiedad', 'pais', 'situacion_propiedad', 'vista'].includes(c.nombre));

                    if (c.nombre === 'codigo_ubigeo_id_fk') {
                        inputHtml = `
                            <div style="display: flex; flex-direction: column; gap: 8px; background: #f8fafc; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px;">
                                <label style="font-size: 11px; font-weight: bold; color: #002e50;">Secuencia Territorial: País y Niveles Administrativos</label>
                                <div style="margin-bottom: 4px;">
                                    <label style="font-size: 11px; font-weight: bold; color: #334155;">País *</label>
                                    <select name="pais" id="sel-lov-pais" style="padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; background: #fff; width: 100%;"></select>
                                </div>
                                <div id="contenedor-cascada-territorial" style="display: flex; flex-direction: column; gap: 8px;">
                                    <p style="font-size: 12px; color: #006aff; margin: 0;">Cargando estructura territorial...</p>
                                </div>
                                <input type="hidden" name="codigo_ubigeo_id_fk" id="input-hidden-ubicacion-final" value="${valorActual}">
                            </div>
                        `;
                    } else if (esSelectLov) {
                        inputHtml = `<select name="${c.nombre}" id="sel-lov-${c.nombre}" data-actual="${valorActual}" style="padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; width: 100%;"><option value="">-- Seleccione --</option>`;
                        if (c.opciones) {
                            c.opciones.forEach(op => {
                                inputHtml += `<option value="${op}" ${String(valorActual) === String(op) ? 'selected' : ''}>${op}</option>`;
                            });
                        }
                        inputHtml += `</select>`;
                    } else {
                        const esPkCampo = (c.nombre === conf.pk);
                        const esUsuarioCampo = (c.nombre === 'usuario_id_fk');
                        const debeBloquearse = (esPkCampo && (esEdicion || nombreTabla === 'propiedad')) || esUsuarioCampo;
                        const estilosAdicionales = debeBloquearse ? 'background: #f1f5f9; color: #64748b; cursor: not-allowed;' : '';
                        const atributoLectura = debeBloquearse ? 'readonly' : '';
                        const atributoStep = c.tipo === 'number' ? 'step="any"' : '';

                        inputHtml = `<input type="${c.tipo || 'text'}" name="${c.nombre}" id="input-crud-${c.nombre}" value="${valorActual}" ${c.requerido ? 'required' : ''} ${atributoLectura} ${atributoStep} style="padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; width: 100%; box-sizing: border-box; ${estilosAdicionales}">`;

                        if (c.nombre === 'direccion') {
                            inputHtml += `
                                <div style="margin-top: 8px;">
                                    <button type="button" id="btn-auto-geocodificar" style="background: #006aff; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; width: 100%;">
                                        Geocodificar Automáticamente (Lat, Long y Mapas)
                                    </button>
                                </div>
                            `;
                        }
                    }

                    return `
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <label style="font-size: 12px; font-weight: bold; color: #334155;">${c.label} ${c.requerido ? '*' : ''}</label>
                            ${inputHtml}
                        </div>
                    `;
                }).join('')}

                ${htmlPublicacionMultimedia}
                ${html30CajasFotos}
                ${htmlSeccionCaracteristicasEspeciales}

                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                    <button type="button" id="btn-cancelar-submodal" style="background: #94a3b8; color: white; border: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer;">Cancelar</button>
                    <button type="submit" id="btn-guardar-crud-submit" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 700;">
                        ${esEdicion ? 'Guardar Cambios' : 'Crear Registro'}
                    </button>
                </div>
            </form>
        </div>
    `;

    subModal.classList.add('activo');
    subModal.setAttribute('aria-hidden', 'false');

      // [INICIO DE LLAVES]: Inicialización asíncrona de catálogos LOV, cascadas y geocodificación para propiedad
    if (nombreTabla === 'propiedad') {
        (async () => {
            const clienteSupabase = window.getSupabaseShared();
            if (!clienteSupabase) return;
            const formNode = document.getElementById('form-generico-crud');
            if (!formNode) return;

            try {
                const [
                    resTipoProp, resSubtipo, resEstadoProp, resMoneda,
                    resEstadoPub, resSituacion, resVista, resSino, resCaracteristicasCat
                ] = await Promise.all([
                    clienteSupabase.from('lov_tipo_propiedad').select('*'),
                    clienteSupabase.from('lov_subtipo_propiedad').select('*'),
                    clienteSupabase.from('lov_estado_propiedad').select('*'),
                    clienteSupabase.from('lov_moneda').select('*'),
                    clienteSupabase.from('lov_estado_publicacion').select('*'),
                    clienteSupabase.from('lov_situacion_propiedad').select('*'),
                    clienteSupabase.from('lov_vista').select('*'),
                    clienteSupabase.from('lov_si_no').select('*'),
                    clienteSupabase.from('lov_caracteristica').select('*')
                ]);

                poblarSelectDinamicoFlex('sel-lov-tipo_propiedad', resTipoProp.data, ['tipo_propiedad']);
                poblarSelectDinamicoFlex('sel-lov-subtipo_propiedad', resSubtipo.data, ['subtipo_propiedad']);
                poblarSelectDinamicoFlex('sel-lov-estado_propiedad', resEstadoProp.data, ['estado_propiedad']);
                poblarSelectDinamicoFlex('sel-lov-moneda', resMoneda.data, ['moneda']);
                poblarSelectDinamicoFlex('sel-lov-estado_publicacion', resEstadoPub.data, ['estado_publicacion']);
                poblarSelectDinamicoFlex('sel-lov-situacion_propiedad', resSituacion.data, ['situacion_propiedad']);
                poblarSelectDinamicoFlex('sel-lov-vista', resVista.data, ['vista']);
                poblarSelectDinamicoFlex('sel-lov-sotano', resSino.data, ['si_no']);
                poblarSelectDinamicoFlex('sel-lov-almacen', resSino.data, ['si_no']);

                catalogoCaracteristicasAdmin = (resCaracteristicasCat.data || [])
                    .filter(r => r && String(r.caracteristica || '').trim() !== '');

                const btnAgregarCarac = formNode.querySelector('#btn-agregar-caracteristica-extra');
                const contenedorCarac = formNode.querySelector('#contenedor-dinamico-caracteristicas-especiales');

                // [INICIO DE LLAVES]: Subfunción para añadir fila de característica especial
                const agregarFilaCaracteristica = (nombreSeleccionado = '', valorSeleccionado = 'si') => {
                    if (!contenedorCarac) return;
                    const fila = document.createElement('div');
                    fila.style.cssText = 'display: flex; align-items: center; gap: 8px; background: #fff; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px;';

                    const indice = document.createElement('span');
                    indice.style.cssText = 'font-size: 11px; font-weight: bold; color: #006aff; min-width: 24px;';
                    indice.textContent = `#${contenedorCarac.children.length + 1}`;

                    const selNombre = document.createElement('select');
                    selNombre.className = 'select-caract-nombre';
                    selNombre.style.cssText = 'width: 60%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px;';
                    selNombre.appendChild(new Option('-- Seleccione Característica --', ''));

                    const buscado = normalizarTextoAdmin(nombreSeleccionado);
                    const vistos = new Set();
                    let hallado = false;

                    catalogoCaracteristicasAdmin.forEach(r => {
                        const t = String(r.caracteristica).trim();
                        if (vistos.has(t)) return;
                        vistos.add(t);
                        const op = new Option(t, t);
                        if (buscado && normalizarTextoAdmin(t) === buscado) { op.selected = true; hallado = true; }
                        selNombre.appendChild(op);
                    });

                    if (nombreSeleccionado && !hallado) {
                        selNombre.appendChild(new Option(nombreSeleccionado, nombreSeleccionado, true, true));
                    }

                    const inputValor = document.createElement('input');
                    inputValor.type = 'text';
                    inputValor.className = 'input-caract-valor';
                    inputValor.value = valorSeleccionado;
                    inputValor.placeholder = 'Valor (ej: si / 50m2)';
                    inputValor.style.cssText = 'width: 35%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px;';

                    const btnDel = document.createElement('button');
                    btnDel.type = 'button';
                    btnDel.textContent = 'x';
                    btnDel.style.cssText = 'background: #ef4444; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;';
                    btnDel.onclick = () => fila.remove();

                    fila.append(indice, selNombre, inputValor, btnDel);
                    contenedorCarac.appendChild(fila);
                }; // [FIN DE LLAVES]: Cierra agregarFilaCaracteristica

                if (btnAgregarCarac) btnAgregarCarac.onclick = () => agregarFilaCaracteristica();
                if (caracteristicasObtenidas.length > 0) {
                    caracteristicasObtenidas.forEach(c => agregarFilaCaracteristica(c.nombre_caracteristica, c.valor_caracteristica || 'si'));
                } else {
                    agregarFilaCaracteristica();
                }

                              // [INICIO DE LLAVES]: Consulta catálogos LOV de tipo de promoción y estado de recorrido 3D
                const [resCatPromos, resCatEstRec] = await Promise.all([
                    clienteSupabase.from('lov_tipo_promocion').select('tipo_promocion_id').order('tipo_promocion_id', { ascending: true }),
                    clienteSupabase.from('lov_estado_recorrido').select('estado_recorrido').order('estado_recorrido', { ascending: true })
                ]);

                const listaTiposPromo = (resCatPromos.data || []).map(r => String(r.tipo_promocion_id || '').trim()).filter(Boolean);
                const listaEstadosRec = (resCatEstRec.data || []).map(r => String(r.estado_recorrido || '').trim()).filter(Boolean);
                const estadosRecOpciones = listaEstadosRec.length > 0 ? listaEstadosRec : ['activo', 'inactivo'];
                // [FIN DE LLAVES]: Cierra consulta de catálogos de promoción y recorrido 3D

                const btnAgregarPromo = formNode.querySelector('#btn-agregar-promocion-extra');
                const contPromos = formNode.querySelector('#contenedor-dinamico-promociones');

                // [INICIO DE LLAVES]: Subfunción para añadir fila de promoción dinámica
                const agregarFilaPromocion = (promoObj = null) => {
                    if (!contPromos) return;
                    const fila = document.createElement('div');
                    fila.style.cssText = 'display: grid; grid-template-columns: 1.4fr 1fr 1fr 0.8fr auto; gap: 6px; align-items: center; background: #f8fafc; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px;';

                    const selTipo = document.createElement('select');
                    selTipo.className = 'select-promo-tipo';
                    selTipo.style.cssText = 'padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px;';
                    selTipo.appendChild(new Option('-- Tipo Promoción --', ''));
                    const valActual = promoObj ? String(promoObj.tipo_promocion_id_fk || '').trim() : '';

                    listaTiposPromo.forEach(tipoStr => {
                        const op = new Option(tipoStr, tipoStr);
                        if (valActual && tipoStr.toLowerCase() === valActual.toLowerCase()) op.selected = true;
                        selTipo.appendChild(op);
                    });
                    if (valActual && !selTipo.value) selTipo.appendChild(new Option(valActual, valActual, true, true));

                    const inpIni = document.createElement('input');
                    inpIni.type = 'date';
                    inpIni.className = 'input-promo-inicio';
                    inpIni.value = promoObj?.fecha_inicio || '';
                    inpIni.style.cssText = 'padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px;';

                    const inpFin = document.createElement('input');
                    inpFin.type = 'date';
                    inpFin.className = 'input-promo-fin';
                    inpFin.value = promoObj?.fecha_fin || '';
                    inpFin.style.cssText = 'padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px;';

                    const inpCosto = document.createElement('input');
                    inpCosto.type = 'number';
                    inpCosto.step = 'any';
                    inpCosto.className = 'input-promo-costo';
                    inpCosto.placeholder = 'Descuento $';
                    inpCosto.value = promoObj?.costo ?? '';
                    inpCosto.style.cssText = 'padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px;';

                    const btnDel = document.createElement('button');
                    btnDel.type = 'button';
                    btnDel.textContent = 'x';
                    btnDel.style.cssText = 'background: #ef4444; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;';
                    btnDel.onclick = () => fila.remove();

                    fila.append(selTipo, inpIni, inpFin, inpCosto, btnDel);
                    contPromos.appendChild(fila);
                }; // [FIN DE LLAVES]: Cierra agregarFilaPromocion

                if (btnAgregarPromo) btnAgregarPromo.onclick = () => agregarFilaPromocion();
                promocionesObtenidas.forEach(p => agregarFilaPromocion(p));

                const btnAgregarRec = formNode.querySelector('#btn-agregar-recorrido3d-extra');
                const contRecs = formNode.querySelector('#contenedor-dinamico-recorridos3d');

                // [INICIO DE LLAVES]: Subfunción para añadir fila de recorrido virtual 3D
                const agregarFilaRecorrido3D = (recObj = null) => {
                    if (!contRecs) return;
                    const fila = document.createElement('div');
                    fila.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 0.9fr auto; gap: 6px; align-items: center; background: #f8fafc; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px;';

                    const inpUrl = document.createElement('input');
                    inpUrl.type = 'text';
                    inpUrl.className = 'input-rec3d-url';
                    inpUrl.placeholder = 'https://kuula.co... o matterport';
                    inpUrl.value = recObj?.url_recorrido || '';
                    inpUrl.style.cssText = 'padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px;';

                    const selProv = document.createElement('select');
                    selProv.className = 'select-rec3d-proveedor';
                    selProv.style.cssText = 'padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px;';
                    ['Matterport', 'Kuula', 'Google Sites', 'Otro'].forEach(pv => {
                        const op = new Option(pv, pv);
                        if (recObj?.proveedor && recObj.proveedor.toLowerCase() === pv.toLowerCase()) op.selected = true;
                        selProv.appendChild(op);
                    });

                    const selEst = document.createElement('select');
                    selEst.className = 'select-rec3d-estado';
                    selEst.style.cssText = 'padding: 5px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px;';
                    const estActual = recObj ? String(recObj.estado_recorrido || '').trim() : '';

                    estadosRecOpciones.forEach(est => {
                        const op = new Option(est, est);
                        if (estActual && est.toLowerCase() === estActual.toLowerCase()) op.selected = true;
                        selEst.appendChild(op);
                    });
                    if (estActual && !selEst.value) selEst.appendChild(new Option(estActual, estActual, true, true));

                    const btnDel = document.createElement('button');
                    btnDel.type = 'button';
                    btnDel.textContent = 'x';
                    btnDel.style.cssText = 'background: #ef4444; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;';
                    btnDel.onclick = () => fila.remove();

                    fila.append(inpUrl, selProv, selEst, btnDel);
                    contRecs.appendChild(fila);
                }; // [FIN DE LLAVES]: Cierra agregarFilaRecorrido3D

                if (btnAgregarRec) btnAgregarRec.onclick = () => agregarFilaRecorrido3D();
                recorridos3dObtenidos.forEach(r => agregarFilaRecorrido3D(r));

                await inicializarCascadaTerritorialCompleta(clienteSupabase, formNode, esEdicion ? datosFila : null);
                await inicializarCodigoPostalDependiente(clienteSupabase, formNode, esEdicion ? datosFila : null);

                              // [INICIO DE LLAVES]: Botón de geocodificación automática (Latitud, Longitud y Enlace OSM)
                const btnGeo = formNode.querySelector('#btn-auto-geocodificar');
                if (btnGeo) {
                    btnGeo.onclick = async () => {
                        const dir = formNode.querySelector('#input-crud-direccion')?.value.trim() || '';
                        const pais = formNode.querySelector('#sel-lov-pais')?.value || 'Perú';

                        const partes = [];
                        formNode.querySelectorAll('.select-territorio-dinamico').forEach(sel => {
                            if (sel.value && sel.selectedIndex >= 0) partes.push(sel.options[sel.selectedIndex].text);
                        });

                        if (!dir || partes.length === 0) {
                            alert('Complete los niveles territoriales y la Dirección exacta antes de geocodificar.');
                            return;
                        }

                        const textoOriginal = btnGeo.innerText;
                        btnGeo.innerText = 'Calculando ubicación exacta...';

                        try {
                            const dirLimpia = dir
                                .replace(/\b(condominio|edificio|torre|dpto|departamento|int|interior|piso|mz|manzana|lt|lote|urb|urbanizacion)\b.*$/i, '')
                                .replace(/[,#-]+$/, '')
                                .trim();

                            const zonaTerritorial = `${partes.slice().reverse().join(', ')}, ${pais}`;
                            const consultasEscaladas = [
                                `${dir}, ${zonaTerritorial}`,
                                dirLimpia ? `${dirLimpia}, ${zonaTerritorial}` : null,
                                zonaTerritorial
                            ].filter((v, idx, arr) => v && arr.indexOf(v) === idx);

                            let resultadoGeo = null;

                            for (const consulta of consultasEscaladas) {
                                const res = await fetch(`https://komoot.io{encodeURIComponent(consulta)}&limit=1`);
                                if (!res.ok) continue;
                                const json = await res.json();

                                if (json && Array.isArray(json.features) && json.features.length > 0) {
                                    const feat = json.features[0];
                                    const coords = feat.geometry?.coordinates || [];
                                    const props = feat.properties || {};

                                    if (coords.length >= 2) {
                                        const refTexto = [props.name, props.street, props.housenumber, props.district, props.city, props.state, props.country]
                                            .filter(Boolean)
                                            .join(', ');

                                        resultadoGeo = {
                                            lat: String(coords[1]).replace(',', '.'),
                                            lon: String(coords[0]).replace(',', '.'),
                                            precision: `${String(props.osm_key || 'OSM').toUpperCase()} Type: ${props.osm_value || 'exacta'}`,
                                            referencia: refTexto || consulta
                                        };
                                        break;
                                    }
                                }
                            }

                            if (resultadoGeo) {
                                const asignar = (id, v) => { const n = formNode.querySelector(id); if (n) n.value = v; };
                                asignar('#input-crud-latitud', resultadoGeo.lat);
                                asignar('#input-crud-longitud', resultadoGeo.lon);
                                asignar('#input-crud-geocode_precision', resultadoGeo.precision);
                                asignar('#input-crud-referencia_mapa', resultadoGeo.referencia);
                                asignar('#input-crud-enlace_mapa', `https://openstreetmap.org{resultadoGeo.lat}&mlon=${resultadoGeo.lon}#map=16/${resultadoGeo.lat}/${resultadoGeo.lon}`);
                                alert('Coordenadas, precisión y mapa calculados con éxito.');
                            } else {
                                alert('No se hallaron coordenadas para esta dirección.');
                            }

                        } catch (errGeo) {
                            console.error('Error en geocodificación:', errGeo);
                            alert('Error de conexión al servicio de geocodificación.');
                        } finally {
                            btnGeo.innerText = textoOriginal;
                        }
                    };
                } // [FIN DE LLAVES]: Cierra geocodificación

            } catch (errInit) {
                console.warn('Error inicializando catálogos del formulario:', errInit);
            }
        })();
    } // [FIN DE LLAVES]: Cierra bloque asíncrono de propiedad

    const cerrarSubModal = () => {
        subModal.classList.remove('activo');
        subModal.setAttribute('aria-hidden', 'true');
    };

    const btnCancelarCrud = document.getElementById('btn-cancelar-submodal');
    const btnCerrarCrudX = document.getElementById('btn-cerrar-submodal-x');
    if (btnCancelarCrud) btnCancelarCrud.onclick = cerrarSubModal;
    if (btnCerrarCrudX) btnCerrarCrudX.onclick = cerrarSubModal;

    const formularioCrudDOM = document.getElementById('form-generico-crud');
    // [INICIO DE LLAVES]: Valida y despacha el envío del formulario CRUD
    if (formularioCrudDOM) {
        formularioCrudDOM.onsubmit = async (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btn-guardar-crud-submit');
            if (btnSubmit) {
                btnSubmit.innerText = 'Guardando...';
                btnSubmit.disabled = true;
            }

            const formData = new FormData(e.target);
            const payload = {};
            formData.forEach((val, key) => {
                payload[key] = (key === 'latitud' || key === 'longitud') ? String(val).replace(',', '.').trim() : val;
            });

            const restaurarBoton = () => {
                if (btnSubmit) {
                    btnSubmit.innerText = esEdicion ? 'Guardar Cambios' : 'Crear Registro';
                    btnSubmit.disabled = false;
                }
            };
            const rechazar = (mensaje) => { alert(mensaje); restaurarBoton(); };

            if (nombreTabla === 'propiedad') {
                const nombresNiveles = Array.from(document.querySelectorAll('#contenedor-cascada-territorial .select-territorio-dinamico'))
                    .map(sel => (sel.value && sel.selectedIndex >= 0) ? sel.options[sel.selectedIndex].text : '');

                if (nombresNiveles.length === 0 || nombresNiveles.some(n => !n) || !payload.codigo_ubigeo_id_fk) {
                    return rechazar('Complete todos los niveles territoriales hasta obtener el código de ubicación final.');
                }
                payload.departamento = nombresNiveles[0] || '';
                payload.provincia = nombresNiveles[1] || '';
                payload.distrito = nombresNiveles[2] || nombresNiveles[nombresNiveles.length - 1];

                if (!payload.titulo || String(payload.titulo).trim() === '') return rechazar('Falta ingresar el Título de Anuncio.');
                if (!payload.tipo_propiedad) return rechazar('Seleccione el Tipo de Propiedad.');
                if (!payload.direccion || String(payload.direccion).trim() === '') return rechazar('Falta ingresar la Dirección.');
                if (!payload.precio_base || isNaN(parseFloat(payload.precio_base))) return rechazar('Falta ingresar un valor válido para el Precio Base.');
                if (isNaN(parseFloat(payload.latitud)) || isNaN(parseFloat(payload.longitud))) {
                    return rechazar('Faltan Latitud y Longitud. Use el botón de autocompletar coordenadas.');
                }
            } else {
                Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null; });
            }

            const guardado = await guardarRegistroCrud(nombreTabla, conf.pk, esEdicion, esEdicion ? datosFila[conf.pk] : null, payload);
            if (guardado) cerrarSubModal(); else restaurarBoton();
        };
    } // [FIN DE LLAVES]: Cierra validación y envío del formulario
} // [FIN DE LLAVES]: Cierra abrirFormularioEdicionCrud

/**
 * Coordina el almacenamiento CRUD. Para 'propiedad' invoca la RPC atómica
 * 'guardar_propiedad_completa'. Para las demás tablas ejecuta insert/update directo.
 */
// [INICIO DE LLAVES]: Abre guardarRegistroCrud
async function guardarRegistroCrud(nombreTabla, pkColumna, esEdicion, pkValor, payload) {
    try {
        const cliente = window.getSupabaseShared();
        if (!cliente) throw new Error('Cliente Supabase no disponible.');

        // [INICIO DE LLAVES]: Rama especializada para la tabla propiedad (RPC)
        if (nombreTabla === 'propiedad') {
            const uuidUsuarioAutenticado = window.APP_AUTH?.usuarioActual?.id;
            if (!uuidUsuarioAutenticado) {
                alert('Error de Autenticación: Debe iniciar sesión para registrar o modificar propiedades.');
                return false;
            }

            const payloadLimpio = { ...payload };

            // Recolección de las 30 cajas de fotos
            const arrayFotos = [];
            for (let i = 1; i <= 30; i++) {
                const ruta = String(payloadLimpio[`foto_slot_${i}`] || '').trim();
                const tipo = String(payloadLimpio[`tipo_slot_${i}`] || 'interior').trim();
                if (ruta) arrayFotos.push({ ruta, tipo });
                delete payloadLimpio[`foto_slot_${i}`];
                delete payloadLimpio[`tipo_slot_${i}`];
            }

            // Recolección de características especiales sin duplicados
            const arrayCaracteristicas = [];
            const nombresVistos = new Set();
            document.querySelectorAll('#contenedor-dinamico-caracteristicas-especiales > div').forEach(fila => {
                const nombre = fila.querySelector('.select-caract-nombre')?.value?.trim();
                const valor = fila.querySelector('.input-caract-valor')?.value?.trim() || 'si';
                if (nombre && !nombresVistos.has(nombre.toLowerCase())) {
                    nombresVistos.add(nombre.toLowerCase());
                    arrayCaracteristicas.push({ nombre, valor });
                }
            });

            // Recolección de promociones dinámicas
            const arrayPromociones = [];
            document.querySelectorAll('#contenedor-dinamico-promociones > div').forEach(fila => {
                const tipo = fila.querySelector('.select-promo-tipo')?.value?.trim();
                const inicio = fila.querySelector('.input-promo-inicio')?.value || '';
                const fin = fila.querySelector('.input-promo-fin')?.value || '';
                const costo = fila.querySelector('.input-promo-costo')?.value || '0';
                if (tipo) arrayPromociones.push({ tipo_promocion_id_fk: tipo, fecha_inicio: inicio, fecha_fin: fin, costo });
            });

            // Recolección de recorridos virtuales 3D
            const arrayRecorridos3D = [];
            document.querySelectorAll('#contenedor-dinamico-recorridos3d > div').forEach(fila => {
                const url = fila.querySelector('.input-rec3d-url')?.value?.trim();
                const proveedor = fila.querySelector('.select-rec3d-proveedor')?.value || 'Matterport';
                const estado = fila.querySelector('.select-rec3d-estado')?.value || 'activo';
                if (url) arrayRecorridos3D.push({ url_recorrido: url, proveedor, estado_recorrido: estado });
            });

                      payloadLimpio.promociones = arrayPromociones;
            payloadLimpio.recorridos_3d = arrayRecorridos3D;
            payloadLimpio.fotos = arrayFotos;
            payloadLimpio.caracteristicas = arrayCaracteristicas;

            payloadLimpio.foto_principal = arrayFotos.length > 0
                ? arrayFotos.ruta
                : (String(payloadLimpio.foto_principal || '').trim() || 'principal.jpg');
            payloadLimpio.usuario_id_fk = uuidUsuarioAutenticado;
            payloadLimpio.es_nuevo = !esEdicion;
            if (esEdicion && pkValor) payloadLimpio.propiedad_id = pkValor;

            const { data: resRpc, error } = await cliente.rpc('guardar_propiedad_completa', { p_payload: payloadLimpio });
            if (error) throw error;

            const codigoAnuncio = resRpc?.anuncio_id || 'ANUN-001';
            const estadoAnuncio = resRpc?.estado_anuncio || 'pausado';
            const mensajeConfirmacion = esEdicion
                ? `Se actualizó la propiedad y su anuncio ${codigoAnuncio} (Estado: ${estadoAnuncio.toUpperCase()}).`
                : `Se creó el anuncio ${codigoAnuncio} en estado "${estadoAnuncio.toUpperCase()}" con sus características, fotos, promociones y recorridos 3D.`;

            alert(mensajeConfirmacion);

        } else {
            // [INICIO DE LLAVES]: Bloqueo para que usuarios no admin no activen anuncios manualmente
            if (nombreTabla === 'anuncio' && !esUsuarioAdministrador()) {
                payload.estado_anuncio = 'pausado';
            } // [FIN DE LLAVES]: Cierra validación de anuncio

            if (esEdicion) {
                const { error } = await cliente.from(nombreTabla).update(payload).eq(pkColumna, pkValor);
                if (error) throw error;
            } else {
                const { error } = await cliente.from(nombreTabla).insert([payload]);
                if (error) throw error;
            }
            alert('Registro guardado exitosamente.');
        } // [FIN DE LLAVES]: Cierra bifurcación propiedad vs otras tablas

        await cargarDatosTablaCrud(nombreTabla);
        return true;

    } catch (err) {
        alert('Error al procesar en la Base de Datos: ' + err.message);
        console.error('[Admin CRUD Error]:', err);
        return false;
    }
} // [FIN DE LLAVES]: Cierra guardarRegistroCrud

/**
 * Elimina un registro de la tabla especificada en Supabase.
 */
// [INICIO DE LLAVES]: Abre eliminarRegistroCrud
async function eliminarRegistroCrud(nombreTabla, pkColumna, pkValor) {
    try {
        const cliente = window.getSupabaseShared();
        if (!cliente) throw new Error('Cliente Supabase no disponible.');

        const { error } = await cliente.from(nombreTabla).delete().eq(pkColumna, pkValor);
        if (error) throw error;

        alert(`¡Registro eliminado exitosamente de la tabla ${nombreTabla}!`);
        await cargarDatosTablaCrud(nombreTabla);

    } catch (err) {
        alert('Error al eliminar registro: ' + err.message);
    }
} // [FIN DE LLAVES]: Cierra eliminarRegistroCrud


