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

if (typeof actualizarBotonCuenta !== "function") {
    var actualizarBotonCuenta = function() { // Inicia Function actualizarBotonCuenta
        console.log("[SRE] Simulación de actualización de botón de cuenta."); 
    }; // Fin de Function actualizarBotonCuenta
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
}; // Fin de asignación del objeto global state


// ==========================================================================
// PARTE 2 DE 15: INITIALIZACIÓN CORE DEL CLIENTE SUPABASE CON FILTROS DE RED
// ==========================================================================

const supabaseUrl = 'https://aohizylvnnrjhgplsods.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_uNtOayIxxDaxozSL4uA7Qw_j8adfYS1';

let supabase = null;

function obtenerClienteSupabase() { // Inicia Function obtenerClienteSupabase
    if (supabase) return supabase;
    if (typeof createClient !== "undefined") {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    } else if (typeof window.supabase !== "undefined" && typeof window.supabase.createClient === "function") {
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabase;
} // Fin de Function obtenerClienteSupabase

obtenerClienteSupabase();


// ==========================================================================
// PARTE 3 DE 15: FIREWALLS DE ACCESO ACL Y TRANSPORTE JSONP APPS SCRIPT
// ==========================================================================

function verificarAutorizacionAcceso() { // Inicia Function verificarAutorizacionAcceso
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
} // Fin de Function verificarAutorizacionAcceso

async function cargarDatosDesdeSupabase() { // Inicia Function cargarDatosDesdeSupabase
    try {
        const cliente = obtenerClienteSupabase();
        if (!cliente) throw new Error("Cliente Supabase no inicializado.");

        const { data, error } = await cliente
            .from('vista_catalogo_mapa')
            .select('*');

        if (error) throw error;
        
        const paqueteData = { propiedades: data || [], usuarios: [] };
        procesarDatosDelMotor(paqueteData);

    } catch (err) {
        console.error("Fallo en la lectura de Supabase:", err.message);
    }
} // Fin de Function cargarDatosDesdeSupabase


// ==========================================================================
// PARTE 4 DE 15: MOTOR DE NORMALIZACIÓN RELACIONAL Y CONCATENACIÓN DE IMÁGENES
// ==========================================================================
function normalizarPropiedad(prop) { // Inicia Function normalizarPropiedad
    const urlBaseCloudinary = "https://res.cloudinary.com/obw6ciov/image/upload/";
    let fotosUnificadas = [];
    
    const origenFotos = prop.galeria_fotos || prop.foto_despliegue || prop.foto_principal;

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

    const latNum = parseFloat(prop.latitud);
    const lngNum = parseFloat(prop.longitud);
    const idVerdadero = String(prop.propiedad_id || prop.id || "");

    return {
        id: idVerdadero,
        propiedad_id: idVerdadero,
        usuario_id_fk: prop.usuario_id_fk || "",
        titulo: String(prop.titulo || '').trim(),
        precio_base: parseFloat(prop.precio_base || 0),
        estado_publicacion: String(prop.estado_publicacion || "disponible").trim().toLowerCase(),
        tipo_anuncio: String(prop.tipo_anuncio || "Venta").trim(),
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
} // Fin de Function normalizarPropiedad


// ==========================================================================
// PARTE 5 DE 15: FORMATEADORES MONETARIOS COMPACTOS
// ==========================================================================

function formatearPrecioCompleto(precio) { // Inicia Function formatearPrecioCompleto
    const num = parseFloat(precio);
    if (isNaN(num) || num === 0) return 'Consultar';
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
} // Fin de Function formatearPrecioCompleto

function formatearPrecioCompacto(precio) { // Inicia Function formatearPrecioCompacto
    if (precio >= 1000000) return `$. ${(precio / 1000000).toFixed(2)}M`;
    if (precio >= 1000) return `$. ${(precio / 1000).toFixed(0)}K`;
    return `$. ${precio}`;
} // Fin de Function formatearPrecioCompacto


// ==========================================================================
// PARTE 6 DE 15: CONSTRUCTOR DEL CARRUSEL DE 5 FOTOS (IZQUIERDA Y DERECHA)
// ==========================================================================

function construirRielCarruselComponente(prop, esPopup = false) { // Inicia Function construirRielCarruselComponente
    const propiedad = prop;
    const contenedorFoto = document.createElement('div');
    contenedorFoto.className = esPopup ? 'contenedor-foto popup-carrusel-context' : 'contenedor-foto';

    const rielCarrusel = document.createElement('div');
    rielCarrusel.className = 'carrusel-imagenes';
    rielCarrusel.setAttribute('data-foto-activa', '0');
    contenedorFoto.appendChild(rielCarrusel);

    // Muestra hasta un máximo de 5 fotos tanto en tarjetas (izquierda) como en popups (derecha)
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

    contenedorFoto.style.position = 'relative';
    const botonCorazon = document.createElement('button');
    botonCorazon.innerHTML = '♥'; 
    botonCorazon.className = 'corazon-favorito';
    botonCorazon.style.position = "absolute";
    botonCorazon.style.top = "12px";
    botonCorazon.style.right = "12px";
    botonCorazon.style.background = "rgba(0,0,0,0.45)";
    botonCorazon.style.border = "none";
    botonCorazon.style.borderRadius = "50%";
    botonCorazon.style.width = "32px";
    botonCorazon.style.height = "32px";
    botonCorazon.style.cursor = "pointer";
    botonCorazon.style.fontSize = "16px";
    botonCorazon.style.display = "flex";
    botonCorazon.style.alignItems = "center";
    botonCorazon.style.justifyContent = "center";
    botonCorazon.style.zIndex = "10";
    botonCorazon.style.color = "#fff";

    botonCorazon.addEventListener('pointerdown', (e) => { // Inicia Callback heart pointerdown
        if (e) {
            e.preventDefault(); 
            e.stopPropagation();
        }
        
        if (typeof verificarAutorizacionAcceso === "function" && !verificarAutorizacionAcceso()) return;

        if (botonCorazon.style.color === 'rgb(217, 35, 35)') {
            botonCorazon.style.color = '#ffffff'; 
            botonCorazon.style.background = 'rgba(0, 0, 0, 0.45)';
        } else {
            botonCorazon.style.color = '#d92323'; 
            botonCorazon.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    }); // Fin de Callback heart pointerdown
    contenedorFoto.appendChild(botonCorazon);

    if (totalFotos > 1) {
        let indiceFotoActual = 0;
        const btnlzq = document.createElement('button');
        btnlzq.className = 'flecha-carrusel flecha-izq'; 
        btnlzq.textContent = '‹';
        
        const btnDer = document.createElement('button');
        btnDer.className = 'flecha-carrusel flecha-der'; 
        btnDer.textContent = '›';

        const desplazarRiel = (direction) => { // Inicia Arrow Function desplazarRiel
            indiceFotoActual = (indiceFotoActual + direction + totalFotos) % totalFotos;
            rielCarrusel.setAttribute('data-foto-activa', String(indiceFotoActual));
            dotsArray.forEach((d, idx) => {
                if (idx === indiceFotoActual) d.classList.add('activo');
                else d.classList.remove('activo');
            });
        }; // Fin de Arrow Function desplazarRiel
        
        btnlzq.addEventListener('click', (e) => { e.stopPropagation(); desplazarRiel(-1); });
        btnDer.addEventListener('click', (e) => { e.stopPropagation(); desplazarRiel(1); });
        contenedorFoto.appendChild(btnlzq); 
        contenedorFoto.appendChild(btnDer);
    }

    const etiquetaFlotante = document.createElement('div');
    etiquetaFlotante.className = 'etiqueta-foto-zillow';
    etiquetaFlotante.textContent = prop.titulo || '';
    contenedorFoto.appendChild(etiquetaFlotante);
    
    return contenedorFoto;
} // Fin de Function construirRielCarruselComponente


// ==========================================================================
// PARTE 8 DE 15: FABRICANTE DEL NODO DE LA TARJETA DEL CATÁLOGO
// ==========================================================================

function crearComponenteTarjetaZillow(prop) { // Inicia Function crearComponenteTarjetaZillow
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-casa'; 
    tarjeta.setAttribute('data-id', prop.id);

    const contenedorVisualFoto = construirRielCarruselComponente(prop, false);
    tarjeta.appendChild(contenedorVisualFoto);

    const clickSPAHandler = (e) => { // Inicia Arrow Function clickSPAHandler
        if (e.target.closest('.flecha-carrusel') || e.target.closest('.corazon-favorito')) return;
        if (window.map) window.map.closePopup();
        state.propiedadSeleccionadaId = prop.id;
        gestionarCortinaSPA('detalle', prop);
    }; // Fin de Arrow Function clickSPAHandler
    
    contenedorVisualFoto.addEventListener('pointerdown', clickSPAHandler);

    const datosCasa = document.createElement('div');
    datosCasa.className = 'datos-casa'; 
    datosCasa.style.padding = '12px';
    datosCasa.addEventListener('pointerdown', clickSPAHandler);

    const precioTexto = document.createElement('div');
    precioTexto.className = 'precio';
    precioTexto.style.fontSize = '18px'; 
    precioTexto.style.fontWeight = 'bold'; 
    precioTexto.style.color = '#1e293b';
    precioTexto.textContent = prop.precio_base ? `$ ${Number(prop.precio_base).toLocaleString('en-US')}` : 'Precio no disponible';
    datosCasa.appendChild(precioTexto);

    const caracteristicasTexto = document.createElement('div');
    caracteristicasTexto.className = 'caracteristicas-inmueble';
    caracteristicasTexto.style.fontSize = '13px'; 
    caracteristicasTexto.style.color = '#475569'; 
    caracteristicasTexto.style.marginTop = '4px';
    caracteristicasTexto.textContent = `${prop.habitaciones || 0} Dorm | ${prop.banos || 0} Baños | AC: ${prop.area_construida || 0} m² | AT: ${prop.area_terreno || 0} m²`;
    datosCasa.appendChild(caracteristicasTexto);

    const adicionalesTexto = document.createElement('div');
    adicionalesTexto.className = 'adicionales-inmueble';
    adicionalesTexto.style.fontSize = '12px'; 
    adicionalesTexto.style.color = '#64748b'; 
    adicionalesTexto.style.marginTop = '2px';
    adicionalesTexto.textContent = `${prop.tipo_propiedad || 'Inmueble'} | Estacionamientos: ${prop.estacionamientos || 0} | Año: ${prop.ano_construccion || 0}`;
    datosCasa.appendChild(adicionalesTexto);

    const ubicacionTexto = document.createElement('div');
    ubicacionTexto.className = 'ubicacion-direccion-directa';
    ubicacionTexto.style.fontSize = '14px'; 
    ubicacionTexto.style.color = '#1e293b'; 
    ubicacionTexto.style.fontWeight = '600'; 
    ubicacionTexto.style.marginTop = '4px';
    ubicacionTexto.textContent = prop.direccion ? `${prop.direccion} (${prop.distrito || ''})` : (prop.titulo || "");
    datosCasa.appendChild(ubicacionTexto);

    tarjeta.appendChild(datosCasa);
    return tarjeta;
} // Fin de Function crearComponenteTarjetaZillow


// ==========================================================================
// PARTE 9 DE 15: INYECCIÓN DE TARJETAS AL DOM
// ==========================================================================

function renderizarCatalogoTarjetas() { // Inicia Function renderizarCatalogoTarjetas
    const contenedorRejilla = document.getElementById('properties-grid-target');
    if (!contenedorRejilla) return;
    contenedorRejilla.innerHTML = '';

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);
    const contador = document.getElementById('results-counter');

    if (filtradas.length === 0) {
        contenedorRejilla.innerHTML = `
            <div class="mensaje-sin-propiedades" style="padding: 60px 20px; text-align: center; width: 100%; box-sizing: border-box;">
                <h3 style="font-size: 22px; color: #2d3748; font-weight: 700;">No existe este tipo de propiedades en este momento</h3>
                <p style="color: #718096; font-size: 15px;">Prueba seleccionando otros criterios o habilitando más opciones.</p>
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


// ==========================================================================
// PARTE 10 DE 15: CONTROLADOR CARTOGRÁFICO Y MARCADORES DEL MAPA
// ==========================================================================

function renderizarMapaZillow() { // Inicia Function renderizarMapaZillow
    if (!window.map || !document.getElementById('map-instance')) return;

    if (window.capaMarcadores) {
        window.capaMarcadores.eachLayer(layer => {
            try {
                if (layer.getPopup()) layer.unbindPopup();
                window.capaMarcadores.removeLayer(layer);
            } catch (e) {}
        });
        window.capaMarcadores.clearLayers();
    } else {
        window.capaMarcadores = L.layerGroup().addTo(window.map);
    }

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);

    const coordenadasValidas = [];
    filtradas.forEach(p => {
        const parsedLat = parseFloat(p.latitud);
        const parsedLng = parseFloat(p.longitud);

        if (!isNaN(parsedLat) && !isNaN(parsedLng) && isFinite(parsedLat) && isFinite(parsedLng) && parsedLat !== 0 && parsedLng !== 0) {
            coordenadasValidas.push([parsedLat, parsedLng]);
        }
    });

    if (coordenadasValidas.length > 0 && window.map) {
        try {
            if (coordenadasValidas.length === 1) {
                window.map.setView(coordenadasValidas[0], 15, { animate: true });
            } else {
                window.map.fitBounds(coordenadasValidas, { padding: [30, 30], maxZoom: 15, animate: true });
            }
        } catch (err) {}
    }

    filtradas.forEach(prop => {
        const parsedLat = parseFloat(prop.latitud);
        const parsedLng = parseFloat(prop.longitud);

        if (isNaN(parsedLat) || isNaN(parsedLng) || !isFinite(parsedLat) || !isFinite(parsedLng)) return;

        const precioCompacto = formatearPrecioCompacto(prop.precio_base);
        let claseColorBurbuja = prop.estado_publicacion === 'vendida' ? 'vendido-dorado' : (prop.tipo_anuncio === 'Alquiler' ? 'alquiler-naranja' : 'venta-azul');

        const iconoBurbuja = L.divIcon({
            html: `<span>${precioCompacto}</span>`,
            className: `leaflet-marker-icon map-price-pill ${claseColorBurbuja}`,
            iconSize: L.point(80, 30), 
            iconAnchor: L.point(40, 15)
        });

        let marcador;
        try {
            marcador = L.marker([parsedLat, parsedLng], { icon: iconoBurbuja });
        } catch (err) {
            return;
        }

        const contenedorPopupMaster = document.createElement('div');
        contenedorPopupMaster.className = 'tarjeta-casa popup-card'; 
        contenedorPopupMaster.style.width = '260px';
        
        const carruselPopup = construirRielCarruselComponente(prop, true);
        contenedorPopupMaster.appendChild(carruselPopup);

        const datosPopup = document.createElement('div');
        datosPopup.innerHTML = `<div class="precio" style="font-size:16px; font-weight:bold; color:#002E50;">$${Number(prop.precio_base).toLocaleString('en-US')}</div><div style="font-size:12px; color:#475569; margin-top:4px;">${prop.habitaciones} Dorm | ${prop.banos} Baños</div><div style="font-size:12px; color:#1e293b; font-weight:500;">${prop.direccion || prop.titulo}</div>`;
        contenedorPopupMaster.appendChild(datosPopup);

        if (window.innerWidth > 768) {
            marcador.bindPopup(contenedorPopupMaster, { maxWidth: 300, minWidth: 260, className: 'zillow-custom-popup-wrapper', autoPan: true, closeOnClick: false });
        }

        marcador.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            state.propiedadSeleccionadaId = prop.id;

            if (window.innerWidth <= 768) {
                const cajaFlotanteMovil = document.getElementById("tarjeta-flotante-movil-sre");
                const targetContenido = document.getElementById("target-contenido-movil-sre");

                if (cajaFlotanteMovil && targetContenido) {
                    targetContenido.innerHTML = `
                        <div class="sre-movil-overlay-card" style="display:flex; gap:14px; padding:6px 0; align-items:center;">
                            <img src="${prop.fotos ? prop.fotos[0] : ''}" style="width:105px; height:85px; object-fit:cover; border-radius:6px; background-color:#f0f2f5;">
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
                    tarjetaDesktop.style.outline = '3px solid #006aff'; 
                    tarjetaDesktop.style.borderRadius = '12px';
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
} // Fin de Function renderizarMapaZillow


// ==========================================================================
// PARTE 12 DE 15: PROCESADOR INTEGRAL DE DATOS Y CARGA DOM
// ==========================================================================

function procesarDatosDelMotor(data) { // Inicia Function procesarDatosDelMotor
    if (!data || !data.propiedades || !Array.isArray(data.propiedades)) return;
    
    state.propiedades = data.propiedades.map(normalizarPropiedad);
    renderizarMapaZillow(); 
    renderizarCatalogoTarjetas();
} // Fin de Function procesarDatosDelMotor

document.addEventListener("DOMContentLoaded", () => { // Inicia EventListener DOMContentLoaded
    if (typeof L !== 'undefined' && document.getElementById('map-instance')) {
        window.map = L.map('map-instance', { zoomControl: true }).setView([-12.125, -76.995], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.map);
    }

    setTimeout(() => { // Inicia Timer de inicialización
        inicializarEventosDeFiltros();
        if (window.map) {
            window.map.on('moveend', renderizarMapaZillow);
            window.map.invalidateSize(); 
        }
        
        cargarDatosDesdeSupabase();

        const btnCerrarTarjetaMovil = document.getElementById("btn-cerrar-tarjeta-movil-sre");
        if (btnCerrarTarjetaMovil) {
            btnCerrarTarjetaMovil.onclick = (e) => {
                e.stopPropagation();
                const cajaFlotanteMovil = document.getElementById("tarjeta-flotante-movil-sre");
                if (cajaFlotanteMovil) {
                    cajaFlotanteMovil.className = "tarjeta-movil-sre-oculta";
                }
            };
        }
    }, 100); // Fin de Timer de inicialización
}); // Fin de EventListener DOMContentLoaded


// ==========================================================================
// PARTE 13 DE 15: CONTROLADOR DE FILTROS REPARADOS
// ==========================================================================

function inicializarEventosDeFiltros() { // Inicia Function inicializarEventosDeFiltros
    // 1. Desplegables Generales
    const wrappers = document.querySelectorAll('.filter-dropdown-wrapper');
    wrappers.forEach(wrapper => {
        const boton = wrapper.querySelector('.filter-btn');
        const panel = wrapper.querySelector('.dropdown-content-panel');
        if (!boton || !panel) return;

        boton.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-content-panel').forEach(p => { if (p !== panel) p.classList.remove('show'); });
            document.querySelectorAll('.filter-btn').forEach(b => { if (b !== boton) b.classList.remove('active'); });
            panel.classList.toggle('show'); 
            boton.classList.toggle('active');
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-content-panel').forEach(p => p.classList.remove('show'));
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    });

    document.querySelectorAll('.dropdown-content-panel').forEach(panel => {
        panel.addEventListener('click', (e) => e.stopPropagation());
    });

    // 2. Filtro Transacción ("Venta", "Para el alquiler", "Vendidas")
    const radiosTransaccion = document.querySelectorAll('input[name="transaccion"]');
    radiosTransaccion.forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.filtros.estado = e.target.value;
            const btnStatus = document.getElementById('btn-filter-status');
            if (btnStatus) {
                if (e.target.value === "Venta") btnStatus.textContent = "Venta";
                else if (e.target.value === "Alquiler") btnStatus.textContent = "Para el alquiler";
                else if (e.target.value === "Vendido" || e.target.value === "Vendidas") btnStatus.textContent = "Vendidas";
            }
            ejecutarTuberiaSincronizada();
        });
    });

    // 3. Filtro Precio (Reparado para persistir correctamente)
    const inputMinPrecio = document.getElementById('price-min');
    const inputMaxPrecio = document.getElementById('price-max');
    const btnAplicarPrecio = document.getElementById('btn-aplicar-precio');
    const btnResetPrecio = document.getElementById('btn-reset-precio');

    if (btnAplicarPrecio) {
        btnAplicarPrecio.addEventListener('click', (e) => {
            e.stopPropagation();
            state.filtros.precioMin = parseFloat(inputMinPrecio.value) || 0;
            state.filtros.precioMax = parseFloat(inputMaxPrecio.value) || Infinity;
            ejecutarTuberiaSincronizada();
            cerrarTodosLosPaneles();
        });
    }

    if (btnResetPrecio) {
        btnResetPrecio.addEventListener('click', (e) => {
            e.stopPropagation();
            if (inputMinPrecio) inputMinPrecio.value = '';
            if (inputMaxPrecio) inputMaxPrecio.value = '';
            state.filtros.precioMin = 0;
            state.filtros.precioMax = Infinity;
            ejecutarTuberiaSincronizada();
            cerrarTodosLosPaneles();
        });
    }

    // 4. Filtro Tipo de Propiedad ("Seleccionar todos" alternable)
    const checkboxesTipo = document.querySelectorAll('.type-cb');
    const btnAplicarTipo = document.getElementById('btn-aplicar-tipo-propiedad');
    const checkTodosTipos = document.getElementById('check-todos-tipos');

    if (checkTodosTipos) {
        checkTodosTipos.addEventListener('change', (e) => {
            const estaMarcado = e.target.checked;
            checkboxesTipo.forEach(cb => cb.checked = estaMarcado);
        });
    }

    if (btnAplicarTipo) {
        btnAplicarTipo.addEventListener('click', (e) => {
            e.stopPropagation();
            state.filtros.tiposPropiedad.clear();
            
            const marcados = Array.from(checkboxesTipo).filter(cb => cb.checked);
            if (marcados.length === 0) {
                checkboxesTipo.forEach(cb => cb.checked = false);
            } else {
                marcados.forEach(cb => state.filtros.tiposPropiedad.add(cb.value));
            }
            
            ejecutarTuberiaSincronizada();
            cerrarTodosLosPaneles();
        });
    }

    // 5. Filtro "Otros Filtros" / "Más Filtros"
    const checkboxesListado = document.querySelectorAll('.more-filter-cb');
    const checkTodosOtros = document.getElementById('check-todos-listados') || document.getElementById('check-todos-otros');
    const btnAplicarOtrosFiltros = document.getElementById('btn-aplicar-mas-filtros') || document.getElementById('btn-aplicar-otros-filtros');

    if (checkTodosOtros) {
        checkTodosOtros.addEventListener('change', (e) => {
            const estaMarcado = e.target.checked;
            checkboxesListado.forEach(cb => cb.checked = estaMarcado);
        });
    }

    if (btnAplicarOtrosFiltros) {
        btnAplicarOtrosFiltros.addEventListener('click', (e) => {
            e.stopPropagation();
            state.filtros.tiposListado.clear();
            
            const marcados = Array.from(checkboxesListado).filter(cb => cb.checked);
            if (marcados.length > 0) {
                marcados.forEach(cb => state.filtros.tiposListado.add(cb.value));
            }

            ejecutarTuberiaSincronizada();
            cerrarTodosLosPaneles();
        });
    }

    // Camas y Baños
    configurarSegmentado('row-beds', (valor) => { 
        state.filtros.camas = parseInt(valor, 10) || 0; 
        ejecutarTuberiaSincronizada(); 
    });
    configurarSegmentado('row-baths', (valor) => { 
        state.filtros.banos = parseFloat(valor) || 0; 
        ejecutarTuberiaSincronizada(); 
    });
} // Fin de Function inicializarEventosDeFiltros

function cerrarTodosLosPaneles() { // Inicia Function cerrarTodosLosPaneles
    document.querySelectorAll('.dropdown-content-panel').forEach(p => p.classList.remove('show'));
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
} // Fin de Function cerrarTodosLosPaneles


// ==========================================================================
// PARTE 14 DE 15: CONTROL DE ENTRADAS SEGMENTADAS
// ==========================================================================

function configurarSegmentado(idContenedor, callback) { // Inicia Function configurarSegmentado
    const contenedor = document.getElementById(idContenedor); 
    if (!contenedor) return;
    contenedor.addEventListener('click', (e) => {
        const botonNode = e.target.closest('.segmented-btn'); 
        if (!botonNode) return;
        contenedor.querySelectorAll('.segmented-btn').forEach(btn => btn.classList.remove('active'));
        botonNode.classList.add('active'); 
        callback(botonNode.getAttribute('data-val'));
    });
} // Fin de Function configurarSegmentado


// ==========================================================================
// PARTE 15 DE 15: EVALUADOR DE FILTROS Y SEGUNDA PANTALLA (SHOWCASE)
// ==========================================================================

function evaluarCriteriosDeFiltrado(prop) { // Inicia Function evaluarCriteriosDeFiltrado
    const filtroTransaccion = state.filtros.estado || "Venta";

    // 1. Regla: Venta -> estado_publicacion = "disponible" Y tipo_anuncio = "Venta"
    if ((filtroTransaccion === "Venta" || filtroTransaccion === "En venta") && (prop.estado_publicacion !== "disponible" || prop.tipo_anuncio !== "Venta")) {
        return false;
    }

    // 2. Regla: Alquiler -> estado_publicacion = "disponible" Y tipo_anuncio = "Alquiler"
    if ((filtroTransaccion === "Alquiler" || filtroTransaccion === "Para el alquiler") && (prop.estado_publicacion !== "disponible" || prop.tipo_anuncio !== "Alquiler")) {
        return false;
    }

    // 3. Regla: Vendida -> estado_publicacion = "vendida" Y tipo_anuncio = "Venta"
    if ((filtroTransaccion === "Vendido" || filtroTransaccion === "Vendidas") && (prop.estado_publicacion !== "vendida" || prop.tipo_anuncio !== "Venta")) {
        return false;
    }

    // Rangos de Precio
    if (prop.precio_base < state.filtros.precioMin || prop.precio_base > state.filtros.precioMax) return false;
    
    // Camas y Baños
    if (state.filtros.camas && (parseInt(prop.habitaciones) || 0) < state.filtros.camas) return false;
    if (state.filtros.banos && (parseFloat(prop.banos) || 0) < state.filtros.banos) return false;

    // Tipos de Propiedad
    if (state.filtros.tiposPropiedad && state.filtros.tiposPropiedad.size > 0) {
        if (!Array.from(state.filtros.tiposPropiedad).includes(String(prop.tipo_propiedad || ''))) return false;
    }

    return true;
} // Fin de Function evaluarCriteriosDeFiltrado


function ejecutarTuberiaSincronizada() { // Inicia Function ejecutarTuberiaSincronizada
    if (typeof renderizarMapaZillow === "function") renderizarMapaZillow(); 
    if (typeof renderizarCatalogoTarjetas === "function") renderizarCatalogoTarjetas(); 
} // Fin de Function ejecutarTuberiaSincronizada


function gestionarCortinaSPA(tipoPantalla, prop) { // Inicia Function gestionarCortinaSPA
    const cortina = document.getElementById('cortina-spa');
    if (!cortina) return;

    if (tipoPantalla === 'cerrar') {
        cortina.classList.remove('cortina-activa');
        return;
    }

    if (tipoPantalla === 'detalle') {
        const listaFotos = prop.fotos || [];
        const fotoPrincipal = listaFotos[0] || "https://res.cloudinary.com/obw6ciov/image/upload/Foto15_havrr3.webp";

        let miniaturasHtml = '';
        listaFotos.forEach((fUrl, idx) => {
            miniaturasHtml += `
                <div class="thumb-showcase-item" data-idx="${idx}" style="width: 50px; height: 50px; border-radius: 8px; overflow: hidden; border: ${idx === 0 ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.4)'}; cursor: pointer;">
                    <img src="${fUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>`;
        });

        cortina.innerHTML = `
            <div style="width: 100%; background: #ffffff; font-family: sans-serif; min-height: 100vh; position: relative;">
                
                <!-- CABECERA Y VISUALIZADOR SHOWCASE (TODAS LAS FOTOS) -->
                <div style="width: 100%; height: 480px; position: relative; background: #000000; overflow: hidden;">
                    <div style="width: 100%; height: 100%; overflow: hidden; position: relative;">
                        <img id="foto-zillow-showcase-activa" src="${fotoPrincipal}" style="width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease;">
                    </div>

                    <!-- BOTÓN SIGNO MENOR '‹' PARA REGRESAR A LA PRIMERA PANTALLA -->
                    <button id="btn-cerrar-cortina" style="position: absolute; top: 20px; left: 24px; background: #ffffff; border: none; width: 38px; height: 38px; border-radius: 50%; font-size: 24px; font-weight: bold; color: #1a1a1a; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.25); z-index: 10;">‹</button>

                    <div style="position: absolute; top: 20px; right: 24px; display: flex; gap: 10px; z-index: 10;">
                        <button style="background: #ffffff; border: none; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer;">♥ Guardado</button>
                        <button style="background: #ffffff; border: none; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer;"> Compartir</button>
                    </div>

                    <button id="btn-prev-showcase" style="position: absolute; top: 50%; left: 20px; transform: translateY(-50%); background: rgba(0,0,0,0.4); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; font-size: 22px; cursor: pointer; z-index: 10;">‹</button>
                    <button id="btn-next-showcase" style="position: absolute; top: 50%; right: 20px; transform: translateY(-50%); background: rgba(0,0,0,0.4); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; font-size: 22px; cursor: pointer; z-index: 10;">›</button>

                    <div style="position: absolute; bottom: 20px; left: 24px; display: flex; gap: 8px; z-index: 10; overflow-x: auto; max-width: calc(100% - 160px); padding-bottom: 4px;">
                        ${miniaturasHtml}
                    </div>

                    <div style="position: absolute; bottom: 20px; right: 24px; color: white; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; z-index: 10;">SHOWCASE</div>
                </div>

                <!-- DETALLES DE LA PROPIEDAD -->
                <div style="padding: 24px; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 340px; gap: 32px; box-sizing: border-box;">
                    <div>
                        <h2 style="font-size: 36px; font-weight: 800; margin: 0 0 6px 0;">$${Number(prop.precio_base).toLocaleString('en-US')}</h2>
                        <p style="font-size: 16px; color: #4a5568; margin: 0 0 14px 0; font-weight: 600;">
                            ${prop.habitaciones} bd | ${prop.banos} ba | ${prop.area_construida} m² AC
                        </p>
                        <p style="font-size: 15px; margin: 0 0 18px 0; color: #2d3748; font-weight: bold;">${prop.direccion} (${prop.distrito})</p>
                        
                        <div style="margin-bottom: 28px;">
                            <h4 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Descripción</h4>
                            <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">${prop.descripcion || 'Sin descripción disponible.'}</p>
                        </div>
                    </div>

                    <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; height: fit-content;">
                        <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 16px; text-align: center;">Contactar Agente</h4>
                        <button type="button" style="width: 100%; background: #006aff; color: #ffffff; border: none; padding: 12px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; margin-bottom: 10px;">Solicitar Tour</button>
                        <button type="button" style="width: 100%; background: #ffffff; color: #006aff; border: 1px solid #006aff; padding: 12px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer;">Enviar Mensaje</button>
                    </div>
                </div>
            </div>
        `;

        // Evento para regresar a la primera pantalla
        document.getElementById('btn-cerrar-cortina').onclick = () => gestionarCortinaSPA('cerrar');

        // Control del carrusel Showcase de todas las fotos
        const imgAnimar = document.getElementById('foto-zillow-showcase-activa');
        let indexActual = 0;

        const cambiarFotoShowcase = (idx) => {
            indexActual = (idx + listaFotos.length) % listaFotos.length;
            if (imgAnimar) imgAnimar.src = listaFotos[indexActual];
        };

        document.getElementById('btn-prev-showcase').onclick = () => cambiarFotoShowcase(indexActual - 1);
        document.getElementById('btn-next-showcase').onclick = () => cambiarFotoShowcase(indexActual + 1);

        document.querySelectorAll('.thumb-showcase-item').forEach(thumb => {
            thumb.onclick = (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
                cambiarFotoShowcase(idx);
            };
        });
    }

    cortina.classList.add('cortina-activa');
} // Fin de Function gestionarCortinaSPA
