/* jshint esversion: 11 */
// PARTE 1 DE 15: ARQUITECTURA DE CONTROL DE ESTADO GLOBAL INMUTABLE
let usuarioAutenticado = false;
let correoUsuarioLogueado = "";
if (typeof window.usuarioAutenticado === "undefined") { window.usuarioAutenticado = false; }
if (typeof window.correoUsuarioLogueado === "undefined") { window.correoUsuarioLogueado = ""; }

if (typeof actualizarBotonCuenta !== "function") {
    var actualizarBotonCuenta = function() { console.log("[SRE] Simulación de actualización de botón de cuenta."); };
}

const state = {
    propiedades: [],
    favoritos: new Set(),
    filtros: {
        estado: 'Venta', 
        precioMin: 0, 
        precioMax: Infinity, 
        camas: 0, 
        camasExactas: false, 
        baños: 0, 
        tiposPropiedad: new Set(['Casa', 'Departamento', 'Terreno', 'Local', 'Oficina', 'Edificio', 'Lote']),
        tiposListado: new Set(['propietario', 'agente', 'nueva construccion', 'ejecucion hipoteca', 'subasta', 'embargo', 'pre ejecucion hipoteca'])
    },
    limpiadoresDOM: new Map()
};

// PARTE 2 DE 15: INITIALIZACIÓN CORE DEL CLIENTE SUPABASE CON FILTROS DE RED
const supabaseUrl = 'https://aohizylvnnrjhgplsods.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_uNtOayIxxDaxozSL4uA7Qw_j8adfYS1'; 

console.warn("?? [SRE ESPÍA 1] Iniciando traza de compilación en el hilo principal...");

let supabase = null;
function obtenerClienteSupabase() {
    if (supabase) return supabase;
    if (typeof createClient !== "undefined") {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    } else if (typeof window.supabase !== "undefined" && typeof window.supabase.createClient === "function") {
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabase;
}
obtenerClienteSupabase();

// PARTE 3 DE 15: FIREWALLS DE ACCESO ACL Y TRANSPORTE JSONP APPS SCRIPT
function verificarAutorizacionAcceso() {
    if (!state.usuarioActual || !state.usuarioActual.id) {
        alert("Acceso Restringido: Debe iniciar sesión con su cuenta para realizar esta acción.");
        if (typeof mostrarPopupAccion === "function") {
            mostrarPopupAccion("modal-autenticacion-supabase");
        }
        return false;
    }
    if (state.usuarioActual && state.usuarioActual.estado_cuenta === "suspendido") {
        alert("Cuenta Suspendida: No tiene autorización para realizar esta acción.");
        return false;
    }
    return true;
}

const urlMiScriptGoogle = "https://script.google.com/macros/s/AKfycbxCuTcsZYP7ayyvckIJDh7Ute_Epr9gPxGw1AieEmRAtxOaJ6zM6tOvp-TXa_3ormGhrw/exec";

function cargarDatosDesdeAppsScript() {
    const script = document.createElement('script');
    script.src = `${urlMiScriptGoogle}?callback=procesarDatosDelMotor`; 
    document.body.appendChild(script);
}

// PARTE 4 DE 15: MOTOR DE NORMALIZACIÓN RELACIONAL Y CONCATENACIÓN DE IMÁGENES
function normalizarPropiedad(prop) {
    const id = prop.id || String(Math.random());
    const urlBaseCloudinary = "https://res.cloudinary.com/obw6ciov/image/upload/";

    const asegurarUrlCompleta = (ruta) => {
        if (!ruta) return "";
        let texto = String(ruta).trim();
        if (texto.startsWith('http://') || texto.startsWith('https://')) {
            return texto;
        }
        texto = texto.replace(/\s+/g, '_');
        if (!texto.toLowerCase().endsWith('.jpg') && !texto.toLowerCase().endsWith('.png')
        && !texto.toLowerCase().endsWith('.webp') && !texto.toLowerCase().endsWith('.jpeg')) {
            texto = texto + '.jpg';
        }
        return urlBaseCloudinary + texto;
    };

    let fotosUnificadas = [];
    if (prop.fotos && Array.isArray(prop.fotos)) {
        fotosUnificadas = prop.fotos.map(f => asegurarUrlCompleta(f)).filter(Boolean);
    }
    if (fotosUnificadas.length === 0) {
        fotosUnificadas.push("https://cloudinary.comFoto15_havrr3.webp");
    }

    return {
        id: String(id),
        anuncio_id: prop.anuncio_id || "",
        precio_base: parseFloat(prop.precio_base || 350000),
        estado_publicacion: String(prop.estado_publicacion || prop.estado_anuncio || "disponible").trim(), 
        tipo_anuncio: String(prop.tipo_anuncio || prop.tipoAnuncio || "Venta").trim(),             
        estadoListado: prop.estado_publicacion || "Venta", 
        titulo: String(prop.titulo || '').trim(), 
        tipo_propiedad: String(prop.tipo_propiedad || 'Casa').trim(), 
        subtipo_propiedad: String(prop.subtipo_propiedad || "").trim(),
        area_terreno: parseFloat(prop.area_terreno || 0),
        estacionamientos: parseInt(prop.estacionamientos, 10) || 0,
        ano_construccion: parseInt(prop.ano_construccion, 10) || 0,
        estado_propiedad: String(prop.estado_propiedad || "").trim(),
        fotos: fotosUnificadas, 
        latitud: parseFloat(prop.latitud || -12.125),
        longitud: parseFloat(prop.longitud || -76.995),
        habitaciones: parseInt(prop.habitaciones || 0, 10),
        banos: parseInt(prop.banos || 0, 10),
        area_construida: parseFloat(prop.area_construida || 0),
        situacion_propiedad: String(prop.situacion_propiedad || ""),
        sotano: prop.sotano || "no",
        almacen: prop.almacen || "no",
        vista: prop.vista || "Ninguna",
        creado_por: prop.creado_por || "",
        telefono: prop.telefono || "",
        contacto_nombre: prop.contacto_nombre || "Contacto"
    };
}

// PARTE 5 DE 15: FORMATEADORES MONETARIOS COMPACTOS Y RECONSTRUCCIÓN DE RIEL MULTIMEDIA
function formatearPrecioCompleto(precio) {
    const num = parseFloat(precio);
    if (isNaN(num) || num === 0) return 'Consultar';
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function formatearPrecioCompacto(precio) {
    if (precio >= 1000000) return `$. ${(precio / 1000000).toFixed(2)}M`;
    if (precio >= 1000) return `$. ${(precio / 1000).toFixed(0)}K`;
    return `$. ${precio}`;
}

// PARTE 6 DE 15: CONSTRUCTOR DINÁMICO DEL COMPONENTE RIEL MULTIMEDIA CON CORAZÓN ACL
function construirRielCarruselComponente(prop, esPopup = false) {
    const propiedad = prop;
    const contenedorFoto = document.createElement('div');
    contenedorFoto.className = esPopup ? 'contenedor-foto popup-carrusel-context' : 'contenedor-foto';

    const rielCarrusel = document.createElement('div');
    rielCarrusel.className = 'carrusel-imagenes';
    rielCarrusel.setAttribute('data-foto-activa', '0');
    contenedorFoto.appendChild(rielCarrusel);

    const totalFotos = Math.min(propiedad.fotos.length, 5);
    const dotsArray = [];
    const contenedorDots = document.createElement('div');
    contenedorDots.className = 'indicadores-carrusel';

    for (let i = 0; i < totalFotos; i++) {
        const img = document.createElement('img');
        img.src = prop.fotos[i];
        img.alt = `${prop.titulo} - Vista ${i + 1}`;
        rielCarrusel.appendChild(img);

        const dot = document.createElement('span');
        dot.className = i === 0 ? 'punto-indicator activo' : 'punto-indicator';
        contenedorDots.appendChild(dot);
        dotsArray.push(dot);
    }
    contenedorFoto.appendChild(contenedorDots);

    // PARTE 7 DE 15: CANDADO DEL BOTÓN CORAZÓN DE FAVORITOS Y DESPLAZADORES CIRCULARES
    contenedorFoto.style.position = 'relative';
    const botonCorazon = document.createElement('button');
    botonCorazon.innerHTML = '♡'; 
    botonCorazon.className = 'corazon-favorito';
    botonCorazon.style = "position:absolute; top:12px; right:12px; background:rgba(0,0,0,0.45); border:none; border-radius:50%; width:32px; height:32px; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; z-index:10; color:#fff;";

    botonCorazon.addEventListener('pointerdown', (e) => {
        if (e) {
            e.preventDefault(); e.stopPropagation();
            if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        }
        if (typeof verificarAutorizacionAcceso === "function" && !verificarAutorizacionAcceso()) return;

        if (botonCorazon.innerHTML === '♡') {
            botonCorazon.innerHTML = '♥'; botonCorazon.style.color = '#d92323'; botonCorazon.style.background = 'rgba(255, 255, 255, 0.95)';
        } else {
            botonCorazon.innerHTML = '♡'; botonCorazon.style.color = '#ffffff'; botonCorazon.style.background = 'rgba(0, 0, 0, 0.45)';
        }
    });
    contenedorFoto.appendChild(botonCorazon);

    if (totalFotos > 1) {
        let indiceFotoActual = 0;
        const btnlzq = document.createElement('button');
        btnlzq.className = 'flecha-carrusel flecha-izq'; btnlzq.textContent = '<';
        const btnDer = document.createElement('button');
        btnDer.className = 'flecha-carrusel flecha-der'; btnDer.textContent = '>';

        const desplazarRiel = (direction) => {
            indiceFotoActual = (indiceFotoActual + direction + totalFotos) % totalFotos;
            rielCarrusel.setAttribute('data-foto-activa', String(indiceFotoActual));
            dotsArray.forEach((d, idx) => {
                if (idx === indiceFotoActual) d.classList.add('activo');
                else d.classList.remove('activo');
            });
        };
        btnlzq.addEventListener('click', (e) => { e.stopPropagation(); desplazarRiel(-1); });
        btnDer.addEventListener('click', (e) => { e.stopPropagation(); desplazarRiel(1); });
        contenedorFoto.appendChild(btnlzq); contenedorFoto.appendChild(btnDer);
    }

    const etiquetaFlotante = document.createElement('div');
    etiquetaFlotante.className = 'etiqueta-foto-zillow';
    etiquetaFlotante.textContent = prop.titulo || '';
    contenedorFoto.appendChild(etiquetaFlotante);
    return contenedorFoto;
}

// PARTE 8 DE 15: FABRICANTE DEL NODO DE LA TARJETA DEL CATÁLOGO DE ESCRITORIO
function crearComponenteTarjetaZillow(prop) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-casa'; tarjeta.setAttribute('data-id', prop.id);

    const contenedorVisualFoto = construirRielCarruselComponente(prop, false);
    tarjeta.appendChild(contenedorVisualFoto);

    const clickSPAHandler = (e) => {
        if (e.target.closest('.flecha-carrusel') || e.target.closest('.corazon-favorito')) return;
        if (window.map) window.map.closePopup();
        state.propiedadSeleccionadaId = prop.id;
        gestionarCortinaSPA('detalle', prop);
    };
    contenedorVisualFoto.addEventListener('pointerdown', clickSPAHandler);

    const datosCasa = document.createElement('div');
    datosCasa.className = 'datos-casa'; datosCasa.style.padding = '12px';
    datosCasa.addEventListener('pointerdown', clickSPAHandler);

    const precioTexto = document.createElement('div');
    precioTexto.className = 'precio'; style = "font-size:18px; font-weight:bold; color:#1e293b;";
    precioTexto.textContent = prop.precio_base ? `$/., ${Number(prop.precio_base).toLocaleString('en-US')}` : 'Precio no disponible';
    datosCasa.appendChild(precioTexto);

    const caracteristicasTexto = document.createElement('div');
    caracteristicasTexto.className = 'caracteristicas-inmueble'; style = "font-size:13px; color:#475569; margin-top:4px;";
    caracteristicasTexto.textContent = `${prop.habitaciones || 0} Dorm | ${prop.banos || 0} Baños | AC: ${prop.area_construida || 0} m² | AT: ${prop.area_terreno || 0} m²`;
    datosCasa.appendChild(caracteristicasTexto);

    const adicionalesTexto = document.createElement('div');
    adicionalesTexto.className = 'adicionales-inmueble'; style = "font-size:12px; color:#64748b; margin-top:2px;";
    adicionalesTexto.textContent = `${prop.tipo_propiedad || 'Inmueble'} | Estacionamientos: ${prop.estacionamientos || 0} | Año: ${prop.ano_construccion || 0}`;
    datosCasa.appendChild(adicionalesTexto);

    const ubicacionTexto = document.createElement('div');
    ubicacionTexto.className = 'ubicacion-direccion-directa'; style = "font-size:14px; color:#1e293b; font-weight:600; margin-top:4px;";
    ubicacionTexto.textContent = prop.direccion ? `${prop.direccion} (${prop.distrito || ''})` : (prop.titulo || "");
    datosCasa.appendChild(ubicacionTexto);

    tarjeta.appendChild(datosCasa);
    return tarjeta;
}

// PARTE 9 DE 15: INYECCIÓN DE TARJETAS AL DOM MEDIANTE DOCUMENT FRAGMENT
function renderizarCatalogoTarjetas() {
    const contenedorRejilla = document.getElementById('properties-grid-target');
    if (!contenedorRejilla) return;
    contenedorRejilla.innerHTML = '';

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);
    const contador = document.getElementById('results-counter');

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
}

// PARTE 10 DE 15: CONTROLADOR CARTOGRÁFICO CON DESVÍO DE EVENTO CELULAR OVERLAY
function renderizarMapaZillow() {
    if (typeof window.capaMarcadores === 'undefined') window.capaMarcadores = null;
    if (!window.map || !document.getElementById('map-instance')) return;

    if (!window.capaMarcadores) {
        window.capaMarcadores = L.layerGroup().addTo(window.map);
    } else {
        window.capaMarcadores.clearLayers();
    }

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);

    filtradas.forEach(prop => {
        if (!prop.latitud || !prop.longitud) return;

        const precioCompacto = formatearPrecioCompacto(prop.precio_base);
        let claseColorBurbuja = prop.estado_publicacion === 'vendida' ? 'vendido-dorado' : (prop.tipo_anuncio === 'Alquiler' ? 'alquiler-naranja' : 'venta-azul');

        const iconoBurbuja = L.divIcon({
            html: `<span>${precioCompacto}</span>`,
            className: `leaflet-marker-icon map-price-pill ${claseColorBurbuja}`,
            iconSize: L.point(80, 30), iconAnchor: L.point(40, 15)
        });

        const marcador = L.marker([prop.latitud, prop.longitud], { icon: iconoBurbuja });

        const contenedorPopupMaster = document.createElement('div');
        contenedorPopupMaster.className = 'tarjeta-casa popup-card'; contenedorPopupMaster.style.width = '260px';
        const carruselPopup = construirRielCarruselComponente(prop, true);
        contenedorPopupMaster.appendChild(carruselPopup);

        const datosPopup = document.createElement('div');
        datosPopup.innerHTML = `<div class="precio" style="font-size:16px; font-weight:bold; color:#002E50;">$${Number(prop.precio_base).toLocaleString('en-US')}</div><div style="font-size:12px; color:#475569; margin-top:4px;">${prop.habitaciones} Dorm | ${prop.banos} Baños</div><div style="font-size:12px; color:#1e293b; font-weight:500;">${prop.direccion || prop.titulo}</div>`;
        contenedorPopupMaster.appendChild(datosPopup);

        if (window.innerWidth > 768) {
            marcador.bindPopup(contenedorPopupMaster, { maxWidth: 300, minWidth: 260, className: 'zillow-custom-popup-wrapper', autoPan: true, closeOnClick: false });
        }

                              // PARTE 11 DE 15: DESLIZAMIENTO DE TARJETA FLOTANTE OVERLAY PARA PANTALLAS CELULARES
        marcador.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            state.propiedadSeleccionadaId = prop.id;

            if (window.innerWidth <= 768) {
                const cajaFlotanteMovil = document.getElementById("tarjeta-flotante-movil-sre");
                const targetContenido = document.getElementById("target-contenido-movil-sre");

                if (cajaFlotanteMovil && targetContenido) {
                    targetContenido.innerHTML = `
                        <div class="sre-movil-overlay-card" style="display:flex; gap:14px; padding:6px 0; align-items:center; font-family:sans-serif;">
                            <img src="${prop.fotos[0]}" style="width:105px; height:85px; object-fit:cover; border-radius:6px; background-color:#f0f2f5;">
                            <div style="display:flex; flex-direction:column; gap:3px; flex:1; overflow:hidden;">
                                <strong style="font-size:19px; color:#1a1a1a;">$${Number(prop.precio_base).toLocaleString('en-US')}</strong>
                                <span style="font-size:13px; color:#4a5568; font-weight:600;">${prop.habitaciones} bd | ${prop.banos} ba | ${prop.area_construida} m²</span>
                                <p style="font-size:13px; color:#2d3748; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:500;">${prop.direccion || prop.titulo}</p>
                                <span style="font-size:11px; font-weight:bold; text-transform:uppercase; color:${prop.estado_publicacion === 'vendida' ? '#b58900' : '#006aff'};">${prop.estado_publicacion === 'vendida' ? 'Vendida' : 'Disponible'}</span>
                            </div>
                        </div>
                    `;
                    targetContenido.onclick = () => { gestionarCortinaSPA('detalle', prop); };
                    cajaFlotanteMovil.className = "tarjeta-movil-sre-visible";
                }
            } else {
                const tarjetaDesktop = document.querySelector(`.tarjeta-casa[data-id="${prop.id}"]`);
                if (tarjetaDesktop) { 
                    tarjetaDesktop.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    tarjetaDesktop.style.outline = '3px solid #006aff'; tarjetaDesktop.style.borderRadius = '12px';
                    setTimeout(() => { tarjetaDesktop.style.outline = 'none'; }, 2000); 
                }
            }
        });

        carruselPopup.addEventListener('pointerdown', (ev) => {
            ev.stopPropagation();
            if (ev.target.closest('.flecha-carrusel') || ev.target.closest('.corazon-favorito')) return;
            if (window.map) window.map.closePopup();
            state.propiedadSeleccionadaId = prop.id;
            gestionarCortinaSPA('detalle', prop);
        });

        window.capaMarcadores.addLayer(marcador);
    });
}

// PARTE 12 DE 15: ESCUCHADOR INTEGRAL DE CAMBIOS DE SESIÓN Y DOM CONTENT LOADED
function procesarDatosDelMotor(data) {
    if (!data || !data.propiedades || !Array.isArray(data.propiedades)) return;
    state.propiedades = data.propiedades.map(normalizarPropiedad);
    renderizarMapaZillow(); renderizarCatalogoTarjetas();
    interceptarFirewallSeguridadUsuario(data.usuarios, window.usuarioLogueado ? window.usuarioLogueado.email : "");
}

document.addEventListener("DOMContentLoaded", () => {
    if (typeof supabase !== "undefined" && supabase !== null) {
        supabase.auth.onAuthStateChange((event, session) => {
            if (session && session.user) {
                const correoUsuario = String(session.user.email).trim();
                window.usuarioLogueado = session.user;

                const idScriptSeguridad = "sre-jsonp-firewall-auth";
                let scriptExistente = document.getElementById(idScriptSeguridad);
                if (scriptExistente) scriptExistente.remove();
                
                window.procesarVerificacionEstadoACL = async (datosUsuarioSheet) => {
                    if (datosUsuarioSheet && datosUsuarioSheet.estado_cuenta === "suspendido") {
                        state.usuarioActual = null; window.usuarioLogueado = null;
                        alert("Acceso Denegado: Su cuenta se encuentra SUSPENDIDA por el administrador.");
                        await supabase.auth.signOut(); return;
                    }
                    state.usuarioActual = {
                        id: String(session.user.id).trim(), correo: correoUsuario,
                        nombre: String(session.user.user_metadata?.full_name || session.user.user_metadata?.name || "Usuario Activo").trim(),
                        estado_cuenta: datosUsuarioSheet?.estado_cuenta || "activo"
                    };
                    if (typeof ejecutarTuberiaSincronizada === 'function') ejecutarTuberiaSincronizada();
                };

                const scriptp = document.createElement('script');
                scriptp.id = idScriptSeguridad;
                scriptp.src = `${urlMiScriptGoogle}?accion=leer_estado_usuario&correo=${encodeURIComponent(correoUsuario)}&callback=procesarVerificacionEstadoACL`;
                document.body.appendChild(scriptp);
            } else {
                state.usuarioActual = null; window.usuarioLogueado = null;
            }
        });
    }

                              // PARTE 13 DE 15: ESTABILIZADOR CARTOGRÁFICO INVALIDATE SIZE Y LISTENERS DROPDOWNS
    if (typeof L !== 'undefined' && document.getElementById('map-instance')) {
        window.map = L.map('map-instance', { zoomControl: true }).setView([-12.125, -76.995], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.map);
    }

    setTimeout(() => {
        inicializarEventosDeFiltros();
        if (window.map) {
            window.map.on('moveend', renderizarMapaZillow);
            window.map.invalidateSize(); // Forzado síncrono para asegurar la carga completa en el celular
        }
        cargarDatosDesdeAppsScript();

        const btnCerrarTarjetaMovil = document.getElementById("btn-cerrar-tarjeta-movil-sre");
        if (btnCerrarTarjetaMovil) {
            btnCerrarTarjetaMovil.onclick = (e) => {
                e.stopPropagation();
                const cajaFlotanteMovil = document.getElementById("tarjeta-flotante-movil-sre");
                if (cajaFlotanteMovil) cajaFlotanteMovil.className = "tarjeta-movil-sre-oculta";
            };
        }
    }, 100);
});

function inicializarEventosDeFiltros() {
    const wrappers = document.querySelectorAll('.filter-dropdown-wrapper');
    wrappers.forEach(wrapper => {
        const boton = wrapper.querySelector('.filter-btn');
        const panel = wrapper.querySelector('.dropdown-content-panel');
        if (!boton || !panel) return;

        boton.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-content-panel').forEach(p => { if (p !== panel) p.classList.remove('show'); });
            document.querySelectorAll('.filter-btn').forEach(b => { if (b !== boton) b.classList.remove('active'); });
            panel.classList.toggle('show'); boton.classList.toggle('active');
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-content-panel').forEach(p => p.classList.remove('show'));
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    });

    const radiosTransaccion = document.querySelectorAll('input[name="transaccion"]');
    radiosTransaccion.forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.filtros.estado = e.target.value;
            const btnStatus = document.getElementById('btn-filter-status');
            if (btnStatus) {
                if (e.target.value === "Venta") btnStatus.textContent = "En venta ▾";
                else if (e.target.value === "Alquiler") btnStatus.textContent = "Para el alquiler ▾";
                else if (e.target.value === "Vendido") btnStatus.textContent = "Vendidas ▾";
            }
            if (typeof ejecutarTuberiaSincronizada === 'function') ejecutarTuberiaSincronizada();
        });
    });

    // PARTE 14 DE 15: CAPTURA DEL BOTÓN APLICAR DE TIPOS DE PROPIEDAD Y FILTROS AVANZADOS
    const inputMinPrecio = document.getElementById('price-min');
    const inputMaxPrecio = document.getElementById('price-max');
    const handlerPrecios = () => {
        state.filtros.precioMin = parseFloat(inputMinPrecio.value) || 0;
        state.filtros.precioMax = parseFloat(inputMaxPrecio.value) || Infinity;
        if (typeof ejecutarTuberiaSincronizada === 'function') ejecutarTuberiaSincronizada();
    };
    if (inputMinPrecio) inputMinPrecio.addEventListener('input', handlerPrecios);
    if (inputMaxPrecio) inputMaxPrecio.addEventListener('input', handlerPrecios);

    if (typeof configurarSegmentado === 'function') {
        configurarSegmentado('row-beds', (valor) => { state.filtros.camas = parseInt(valor) || 0; ejecutarTuberiaSincronizada(); });
        configurarSegmentado('row-baths', (valor) => { state.filtros.banos = parseFloat(valor) || 0; ejecutarTuberiaSincronizada(); });
    }

    const checkboxesTipo = document.querySelectorAll('.type-cb');
    const btnAplicarTipo = document.getElementById('btn-aplicar-tipo-propiedad');

    if (btnAplicarTipo) {
        btnAplicarTipo.addEventListener('click', () => {
            state.filtros.tiposPropiedad.clear();
            const cantidadTiposMarcados = Array.from(checkboxesTipo).filter(cb => cb.checked).length;
            if (cantidadTiposMarcados === 0) {
                state.filtros.tiposPropiedad.add("ninguno");
            } else {
                checkboxesTipo.forEach(cb => { if (cb.checked) state.filtros.tiposPropiedad.add(cb.value); });
            }
            ejecutarTuberiaSincronizada();
        });
    }

    const checkboxesListado = document.querySelectorAll('.more-filter-cb');
    const checkTodos = document.getElementById('check-todos-listados');

    if (checkTodos) {
        checkTodos.addEventListener('change', (e) => {
            state.filtros.tiposListado.clear();
            if (e.target.checked) {
                checkboxesListado.forEach(cb => { cb.checked = true; state.filtros.tiposListado.add(cb.value); });
            } else {
                checkboxesListado.forEach(cb => cb.checked = false);
            }
            ejecutarTuberiaSincronizada();
        });
    }

    checkboxesListado.forEach(cb => {
        cb.addEventListener('change', (e) => {
            if (e.target.checked) {
                if (checkTodos) checkTodos.checked = false;
                checkboxesListado.forEach(otroCb => { if (otroCb !== e.target) { otroCb.checked = false; state.filtros.tiposListado.delete(otroCb.value); } });
                state.filtros.tiposListado.clear(); state.filtros.tiposListado.add(e.target.value);
            } else {
                state.filtros.tiposListado.delete(e.target.value);
            }
            ejecutarTuberiaSincronizada();
        });
    });
}

function configurarSegmentado(idContenedor, callback) {
    const contenedor = document.getElementById(idContenedor); if (!contenedor) return;
    contenedor.addEventListener('click', (e) => {
        const botonNode = e.target.closest('.segmented-btn'); if (!botonNode) return;
        contenedor.querySelectorAll('.segmented-btn').forEach(btn => btn.classList.remove('active'));
        botonNode.classList.add('active'); callback(botonNode.getAttribute('data-val'));
    });
}

// PARTE 15 DE 15: FILTRADO MULTIDIMENSIONAL SIN TILDES Y DESPLIEGUE DE FICHA DETALLE
function evaluarCriteriosDeFiltrado(prop) {
    const filtroTransaccion = state.filtros.estado || "Venta";
    if (filtroTransaccion === "Venta" || filtroTransaccion === "En venta") {
        if (prop.tipo_anuncio !== "Venta" || prop.estado_publicacion !== "disponible") return false;
    } else if (filtroTransaccion === "Alquiler" || filtroTransaccion === "Para el alquiler") {
        if (prop.tipo_anuncio !== "Alquiler" || prop.estado_publicacion !== "disponible") return false;
    } else if (filtroTransaccion === "Vendido" || filtroTransaccion === "Vendidas") {
        if (prop.estado_publicacion !== "vendida") return false;
    }

    if (prop.precio_base < state.filtros.precioMin || prop.precio_base > state.filtros.precioMax) return false;
    if (state.filtros.camas && (parseInt(prop.habitaciones) || 0) < state.filtros.camas) return false;
    if (state.filtros.banos && (parseFloat(prop.banos) || 0) < state.filtros.banos) return false;

    if (state.filtros.tiposPropiedad.size > 0) {
        if (!Array.from(state.filtros.tiposPropiedad).some(f => f === String(prop.tipo_propiedad || ''))) return false;
    }

    // Solución de Carga en Frío: Validación dinámica de Filtros Avanzados sin congelamiento
    const checkboxesFisicosEnPantalla = document.querySelectorAll('.more-filter-cb');
    const checkboxesMarcados = Array.from(checkboxesFisicosEnPantalla).filter(cb => cb.checked);
    const checkMaestro = document.getElementById('check-todos-listados');

    // Regla de Negocio: Si "Seleccione todos" está activo o no se ha interactuado, no se bloquea la data
    if (checkMaestro && checkMaestro.checked === true) {
        return true;
    } 
    
    // Si el usuario desmarcó todo manualmente en la UI, se aplica el firewall visual restrictivo
    if (checkboxesMarcados.length === 0) {
        return false;
    }

    // Filtrar de forma natural evaluando la columna situacion_propiedad de Supabase PostgreSQL
    if (checkboxesMarcados.length > 0 && (!checkMaestro || !checkMaestro.checked)) {
        const situacionBD = String(prop.situacion_propiedad || "").toLowerCase().trim();
        // Evaluar si la situación de la propiedad está contenida en el set de filtros activos
        const coincideFiltro = checkboxesMarcados.some(cb => String(cb.value).toLowerCase().trim() === situacionBD);
        if (!coincideFiltro) return false;
    }

    return true;
    
} // <-- Cierra de forma limpia evaluarCriteriosDeFiltrado


// Declaración e inicialización robusta de la tubería de sincronización mutua
function ejecutarTuberiaSincronizada() { 
    if (typeof renderizarMapaZillow === "function") {
        renderizarMapaZillow(); 
    }
    if (typeof renderizarCatalogoTarjetas === "function") {
        renderizarCatalogoTarjetas(); 
    }
} // <-- Cierra ejecutarTuberiaSincronizada

function interceptarFirewallSeguridadUsuario(l, em) {}

function inicializarEventosPopups() {
    document.getElementById("btn-solicitar-tour-galeria")?.addEventListener("click", () => {
        mostrarPopupAccion("modal-tour-comercial"); calcularCalendarioTresCajas(); gestionarPasosModalTour(1);
    });
    document.getElementById("btn-contactar-agente-galeria")?.addEventListener("click", () => {
        mostrarPopupAccion("modal-agente-comercial"); inyectarDatosPropiedadAlMensaje();
    });
}

function mostrarPopupAccion(id) { const n = document.getElementById(id); if (n) n.style.display = "flex"; }
function cerrarPopupAccion(id) { const n = document.getElementById(id); if (n) n.style.display = "none"; }
function calcularCalendarioTresCajas() {}
function gestionarPasosModalTour(p) {}
function inyectarDatosPropiedadAlMensaje() {}
function ejecutarEnvioAppsScript(p, m, f, mx) {}

function gestionarCortinaSPA(tipoPantalla, prop) {
    const cortina = document.getElementById('cortina-spa'); if (!cortina) return;
    if (tipoPantalla === 'cerrar') { cortina.classList.remove('cortina-activa'); return; }

    if (tipoPantalla === 'detalle') {
        cortina.innerHTML = `
            <div class="nav-ficha-zillow" style="position:fixed; top:0; left:0; width:100vw; height:60px; background:white; display:flex; align-items:center; justify-content:space-between; padding:0 24px; z-index:6000; border-bottom:1px solid #ddd;">
                <button id="btn-cerrar-cortina" style="color:#006aff; font-weight:bold; background:none; border:none; cursor:pointer;">‹ Volver a buscar</button>
                <img src="./logo.jpg" style="height:32px;">
                <div><span>Ficha Detalle</span></div>
            </div>
            <div style="margin-top:60px; padding:24px; max-width:1200px; margin-left:auto; margin-right:auto; font-family:sans-serif;">
                <img src="${prop.fotos[0]}" style="width:100%; max-height:410px; object-fit:cover; border-radius:8px; margin-bottom:16px;">
                <h2 style="font-size:32px; margin:0 0 8px 0;">$${Number(prop.precio_base).toLocaleString('en-US')}</h2>
                <p style="font-size:18px; color:#4a5568; margin:0 0 16px 0;">${prop.habitaciones} bd | ${prop.banos} ba | ${prop.area_construida} m²</p>
                <p style="font-size:16px; margin:0 0 24px 0; font-weight:bold;">${prop.direccion || prop.titulo}</p>
            </div>
        `;
        document.getElementById('btn-cerrar-cortina')?.addEventListener('click', () => gestionarCortinaSPA('cerrar'));
    }
    cortina.classList.add('cortina-activa');
}
