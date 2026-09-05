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

console.warn("⚠️ [SRE ESPÍA 1] Iniciando traza de compilación en el hilo principal...");

let supabase = null;

function obtenerClienteSupabase() { // Inicia Function obtenerClienteSupabase
    if (supabase) return supabase;
    if (typeof createClient !== "undefined") {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    } else if (typeof window.supabase !== "undefined" && typeof window.supabase.createClient === "function") {
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    }
    if (supabase) {
        console.log("✅ [SRE ESPÍA 2] Cliente Supabase vinculado y listo para peticiones.");
    } else {
        console.error("❌ [SRE ESPÍA 2] No se pudo instanciar el cliente Supabase. Verifique CDN.");
    }
    return supabase;
} // Fin de Function obtenerClienteSupabase

obtenerClienteSupabase();




// ==========================================================================
// PARTE 3 DE 15: FIREWALLS DE ACCESO ACL Y TRANSPORTE JSONP APPS SCRIPT
// ==========================================================================

function verificarAutorizacionAcceso() { // Inicia Function verificarAutorizacionAcceso
    console.group("ðŸ›¡ï¸ [SRE ESPÃA ACL] Verificando credenciales de interacciÃ³n");
    console.log("Usuario actual en estado:", state.usuarioActual);
    
    if (!state.usuarioActual || !state.usuarioActual.id) {
        console.warn("â›” ACL BLOQUEADO: SesiÃ³n inexistente.");
        console.groupEnd();
        alert("Acceso Restringido: Debe iniciar sesiÃ³n con su cuenta para realizar esta acciÃ³n.");
        if (typeof mostrarPopupAccion === "function") {
            mostrarPopupAccion("modal-autenticacion-supabase");
        }
        return false;
    }
    
    if (state.usuarioActual && state.usuarioActual.estado_cuenta === "suspendido") {
        console.error("â›” ACL BLOQUEADO: El usuario se encuentra SUSPENDIDO.");
        console.groupEnd();
        alert("Cuenta Suspendida: No tiene autorizaciÃ³n para realizar esta acciÃ³n.");
        return false;
    }
    
    console.log("ðŸŸ¢ ACL PERMITIDO: Cuenta activa y autorizada.");
    console.groupEnd();
    return true;
} // Fin de Function verificarAutorizacionAcceso

async function cargarDatosDesdeSupabase() { // Inicia Function cargarDatosDesdeSupabase
    console.log("🚀 [SRE ESPÍA 3] Consultando directamente a Supabase REST API sin intermediarios...");
    try {
        const cliente = obtenerClienteSupabase();
        if (!cliente) throw new Error("Cliente Supabase no inicializado en ventana.");

        // Consultamos directamente la vista unificada del catálogo mapeado
        const { data, error } = await cliente
            .from('vista_catalogo_mapa')
            .select('*');

        if (error) throw error;

        console.log("🔥 [SRE ESPÍA REST SUCCESS] Registros crudos obtenidos de Supabase:", data.length);
        
        // Estructuramos el paquete con el formato esperado por tu orquestador de UI
        const paqueteData = { propiedades: data || [], usuarios: [] };
        procesarDatosDelMotor(paqueteData);

    } catch (err) {
        console.error("❌ [SRE ESPÍA ERROR] Fallo en la lectura directa de Supabase REST:", err.message);
    }
} // Fin de Function cargarDatosDesdeSupabase


// ==========================================================================
// PARTE 4 DE 15: MOTOR DE NORMALIZACIÃ“N RELACIONAL Y CONCATENACIÃ“N DE IMÃGENES
// ==========================================================================
function normalizarPropiedad(prop) { // Inicia Function normalizarPropiedad
    const id = prop.propiedad_id || String(Math.random());
    const urlBaseCloudinary = "https://res.cloudinary.com/obw6ciov/image/upload/";

    let fotosUnificadas = [];
    
    // Captura el riel unificado de Postgres o el fallback de la foto principal
    const origenFotos = prop.galeria_fotos || prop.foto_principal;

    if (origenFotos) {
        let coleccionCruda = [];
        
        // Si viene como Array nativo de Postgres (La Vista SQL agrupada)
        if (Array.isArray(origenFotos)) {
            coleccionCruda = origenFotos;
        } else if (typeof origenFotos === 'string') {
            // Si la celda de texto de la tabla arrastra comas internas, las pica en elementos individuales
            coleccionCruda = origenFotos.includes(',') ? origenFotos.split(',') : [origenFotos];
        }

        // Procesamos y limpiamos cada fragmento de imagen obtenido de forma individual
        coleccionCruda.forEach(nombreFoto => {
            if (!nombreFoto) return;
            let texto = String(nombreFoto).trim();
            if (!texto) return;

            if (texto.startsWith('http://') || texto.startsWith('https://')) {
                fotosUnificadas.push(texto);
            } else {
                // Reemplaza los espacios en blanco accidentales por guiones bajos
                texto = texto.replace(/\s+/g, '_');
                fotosUnificadas.push(urlBaseCloudinary + texto);
            }
        });
    }


    if (fotosUnificadas.length === 0) {
        fotosUnificadas.push(urlBaseCloudinary + "Foto15_havrr3.webp");
    }

    // RETORNO DE ATRIBUTOS EXACTOS PROVENIENTES DE POSTGRESQL (SIN ALTERAR NOMENCLATURA)
    return {
        id: String(id),
        propiedad_id: String(id),
        usuario_id_fk: prop.usuario_id_fk || "",
        ubicacion_id_fk: prop.ubicacion_id_fk || "",
        titulo: String(prop.titulo || '').trim(),
        precio_base: parseFloat(prop.precio_base || 0),
        estado_publicacion: String(prop.estado_publicacion || "disponible").trim(),
        tipo_anuncio: String(prop.tipo_anuncio || "Venta").trim(),
        tipo_propiedad: String(prop.tipo_propiedad || 'Casa').trim(),
        subtipo_propiedad: String(prop.subtipo_propiedad || "").trim(),
        direccion: String(prop.direccion || "").trim(),
        descripcion: String(prop.descripcion || "").trim(),
        
        // Características Físicas Sincronizadas
        area_terreno: parseFloat(prop.area_terreno || 0),
        area_construida: parseFloat(prop.area_construida || 0),
        habitaciones: parseInt(prop.habitaciones || 0, 10),
        banos: parseInt(prop.banos || 0, 10),
        estacionamientos: parseInt(prop.estacionamientos || 0, 10),
        ano_construccion: parseInt(prop.ano_construccion || 0, 10),
        estado_propiedad: String(prop.estado_propiedad || "").trim(),
        moneda: String(prop.moneda || "USD").trim(),
        
        // Bloque de Control e Inventario Técnico
        cuota_mantenimiento: parseFloat(prop.cuota_mantenimiento || 0),
        situacion_propiedad: String(prop.situacion_propiedad || "").trim(),
        sotano: String(prop.sotano || "no").trim(),
        almacen: String(prop.almacen || "no").trim(),
        vista: String(prop.vista || "Ninguna").trim(),
        creado_por: String(prop.creado_por || "").trim(),
        
        // Georreferenciación y Colecciones Agregadas
        distrito: String(prop.distrito || "").trim(),
        latitud: parseFloat(prop.latitud || -12.125),
        longitud: parseFloat(prop.longitud || -76.995),
        fotos: fotosUnificadas,
        amenidades: prop.amenidades || []
    };
} // Fin de Function normalizarPropiedad


// ==========================================================================
// PARTE 5 DE 15: FORMATEADORES MONETARIOS COMPACTOS Y RECONSTRUCCIÃ“N DE RIEL MULTIMEDIA
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
// PARTE 6 DE 15: CONSTRUCTOR DINÃMICO DEL COMPONENTE RIEL MULTIMEDIA CON CORAZÃ“N ACL
// ==========================================================================

function construirRielCarruselComponente(prop, esPopup = false) { // Inicia Function construirRielCarruselComponente
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


    // ==========================================================================
    // PARTE 7 DE 15: CANDADO DEL BOTÃ“N CORAZÃ“N DE FAVORITOS Y DESPLAZADORES CIRCULARES
    // ==========================================================================
    
    contenedorFoto.style.position = 'relative';
    const botonCorazon = document.createElement('button');
    botonCorazon.innerHTML = 'â™¡'; 
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
            if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        }
        
        if (typeof verificarAutorizacionAcceso === "function" && !verificarAutorizacionAcceso()) return;

        if (botonCorazon.innerHTML === 'â™¡') {
            botonCorazon.innerHTML = 'â™¥'; 
            botonCorazon.style.color = '#d92323'; 
            botonCorazon.style.background = 'rgba(255, 255, 255, 0.95)';
        } else {
            botonCorazon.innerHTML = 'â™¡'; 
            botonCorazon.style.color = '#ffffff'; 
            botonCorazon.style.background = 'rgba(0, 0, 0, 0.45)';
        }
    }); // Fin de Callback heart pointerdown
    contenedorFoto.appendChild(botonCorazon);

    if (totalFotos > 1) {
        let indiceFotoActual = 0;
        const btnlzq = document.createElement('button');
        btnlzq.className = 'flecha-carrusel flecha-izq'; 
        btnlzq.textContent = '<';
        
        const btnDer = document.createElement('button');
        btnDer.className = 'flecha-carrusel flecha-der'; 
        btnDer.textContent = '>';

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
// PARTE 8 DE 15: FABRICANTE DEL NODO DE LA TARJETA DEL CATÃLOGO DE ESCRITORIO
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
    precioTexto.textContent = prop.precio_base ? `$/., ${Number(prop.precio_base).toLocaleString('en-US')}` : 'Precio no disponible';
    datosCasa.appendChild(precioTexto);

    const caracteristicasTexto = document.createElement('div');
    caracteristicasTexto.className = 'caracteristicas-inmueble';
    caracteristicasTexto.style.fontSize = '13px'; 
    caracteristicasTexto.style.color = '#475569'; 
    caracteristicasTexto.style.marginTop = '4px';
    caracteristicasTexto.textContent = `${prop.habitaciones || 0} Dorm | ${prop.banos || 0} BaÃ±os | AC: ${prop.area_construida || 0} mÂ² | AT: ${prop.area_terreno || 0} mÂ²`;
    datosCasa.appendChild(caracteristicasTexto);

    const adicionalesTexto = document.createElement('div');
    adicionalesTexto.className = 'adicionales-inmueble';
    adicionalesTexto.style.fontSize = '12px'; 
    adicionalesTexto.style.color = '#64748b'; 
    adicionalesTexto.style.marginTop = '2px';
    adicionalesTexto.textContent = `${prop.tipo_propiedad || 'Inmueble'} | Estacionamientos: ${prop.estacionamientos || 0} | AÃ±o: ${prop.ano_construccion || 0}`;
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
// PARTE 9 DE 15: INYECCIÃ“N DE TARJETAS AL DOM MEDIANTE DOCUMENT FRAGMENT
// ==========================================================================

function renderizarCatalogoTarjetas() { // Inicia Function renderizarCatalogoTarjetas
    const contenedorRejilla = document.getElementById('properties-grid-target');
    if (!contenedorRejilla) return;
    contenedorRejilla.innerHTML = '';

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);
    const contador = document.getElementById('results-counter');

    console.log(`ðŸ“Š [SRE ESPÃA CATALOGO] Re-renderizando rejilla. Propiedades filtradas a pintar: ${filtradas.length}`);

    if (filtradas.length === 0) {
        contenedorRejilla.innerHTML = `
            <div class="mensaje-sin-propiedades" style="padding: 60px 20px; text-align: center; width: 100%; box-sizing: border-box;">
                <h3 style="font-size: 22px; color: #2d3748; font-weight: 700; font-family: sans-serif;">No existe este tipo de propiedades en este momento</h3>
                <p style="color: #718096; font-size: 15px; font-family: sans-serif;">Prueba seleccionando otros criterios o habilitando mÃ¡s opciones.</p>
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
// PARTE 10 DE 15: CONTROLADOR CARTOGRÃFICO CON DESVÃO DE EVENTO CELULAR OVERLAY
// ==========================================================================

function renderizarMapaZillow() { // Inicia Function renderizarMapaZillow
    if (typeof window.capaMarcadores === 'undefined') window.capaMarcadores = null;
    if (!window.map || !document.getElementById('map-instance')) return;

    if (!window.capaMarcadores) {
        window.capaMarcadores = L.layerGroup().addTo(window.map);
    } else {
        window.capaMarcadores.clearLayers();
    }

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);
    console.log(`ðŸ—ºï¸ [SRE ESPÃA MAPA] Pintando ${filtradas.length} pines compactos en Leaflet.`);

    filtradas.forEach(prop => { // Inicia Callback forEach filtradas
        if (!prop.latitud || !prop.longitud) return;

        const precioCompacto = formatearPrecioCompacto(prop.precio_base);
        let claseColorBurbuja = prop.estado_publicacion === 'vendida' ? 'vendido-dorado' : (prop.tipo_anuncio === 'Alquiler' ? 'alquiler-naranja' : 'venta-azul');

        const iconoBurbuja = L.divIcon({
            html: `<span>${precioCompacto}</span>`,
            className: `leaflet-marker-icon map-price-pill ${claseColorBurbuja}`,
            iconSize: L.point(80, 30), 
            iconAnchor: L.point(40, 15)
        });

        const marcador = L.marker([prop.latitud, prop.longitud], { icon: iconoBurbuja });

        const contenedorPopupMaster = document.createElement('div');
        contenedorPopupMaster.className = 'tarjeta-casa popup-card'; 
        contenedorPopupMaster.style.width = '260px';
        
        const carruselPopup = construirRielCarruselComponente(prop, true);
        contenedorPopupMaster.appendChild(carruselPopup);

        const datosPopup = document.createElement('div');
        datosPopup.innerHTML = `<div class="precio" style="font-size:16px; font-weight:bold; color:#002E50;">$${Number(prop.precio_base).toLocaleString('en-US')}</div><div style="font-size:12px; color:#475569; margin-top:4px;">${prop.habitaciones} Dorm | ${prop.banos} BaÃ±os</div><div style="font-size:12px; color:#1e293b; font-weight:500;">${prop.direccion || prop.titulo}</div>`;
        contenedorPopupMaster.appendChild(datosPopup);

        if (window.innerWidth > 768) {
            marcador.bindPopup(contenedorPopupMaster, { maxWidth: 300, minWidth: 260, className: 'zillow-custom-popup-wrapper', autoPan: true, closeOnClick: false });
        }


        // ==========================================================================
        // PARTE 11 DE 15: DESLIZAMIENTO DE TARJETA FLOTANTE OVERLAY PARA PANTALLAS CELULARES
        // ==========================================================================
        
        marcador.on('click', (e) => { // Inicia Callback marker click
            L.DomEvent.stopPropagation(e);
            state.propiedadSeleccionadaId = prop.id;
            
            console.log(`ðŸ“± [SRE ESPÃA CLICK MARCADOR] ID Seleccionado: ${prop.id}. Ancho Viewport: ${window.innerWidth}px`);

            if (window.innerWidth <= 768) {
                const cajaFlotanteMovil = document.getElementById("tarjeta-flotante-movil-sre");
                const targetContenido = document.getElementById("target-contenido-movil-sre");

                if (cajaFlotanteMovil && targetContenido) {
                    targetContenido.innerHTML = `
                        <div class="sre-movil-overlay-card" style="display:flex; gap:14px; padding:6px 0; align-items:center; font-family:sans-serif;">
                            <img src="${prop.fotos ? prop.fotos[0] : ''}" style="width:105px; height:85px; object-fit:cover; border-radius:6px; background-color:#f0f2f5;">
                            <div style="display:flex; flex-direction:column; gap:3px; flex:1; overflow:hidden;">
                                <strong style="font-size:19px; color:#1a1a1a;">$${Number(prop.precio_base).toLocaleString('en-US')}</strong>
                                <span style="font-size:13px; color:#4a5568; font-weight:600;">${prop.habitaciones} bd | ${prop.banos} ba | ${prop.area_construida} mÂ²</span>
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
        }); // Fin de Callback marker click

        carruselPopup.addEventListener('pointerdown', (ev) => {
            ev.stopPropagation();
            if (ev.target.closest('.flecha-carrusel') || ev.target.closest('.corazon-favorito')) return;
            if (window.map) window.map.closePopup();
            state.propiedadSeleccionadaId = prop.id;
            gestionarCortinaSPA('detalle', prop);
        });

        window.capaMarcadores.addLayer(marcador);
    }); // Fin de Callback forEach filtradas
} // Fin de Function renderizarMapaZillow


// ==========================================================================
// PARTE 12 DE 15: ESCUCHADOR INTEGRAL DE CAMBIOS DE SESIÃ“N Y DOM CONTENT LOADED
// ==========================================================================

function procesarDatosDelMotor(data) { // Inicia Function procesarDatosDelMotor
    console.group("ðŸ“¥ [SRE ESPÃA INTERCEPTOR] Paquete crudo recibido desde el Motor");
    console.log("Estructura completa de la carga Ãºtil:", data);
    
    if (!data || !data.propiedades || !Array.isArray(data.propiedades)) {
        console.error("âŒ Formato de datos invÃ¡lido o ausencia de la colecciÃ³n 'propiedades'.");
        console.groupEnd();
        return;
    }
    
    state.propiedades = data.propiedades.map(normalizarPropiedad);
    
    console.log("ðŸ“¦ Data normalizada en el frontend (state.propiedades):");
    console.table(state.propiedades.slice(0, 5), ["id", "precio_base", "tipo_propiedad", "tipo_anuncio", "estado_publicacion"]);
    console.groupEnd();

    renderizarMapaZillow(); 
    renderizarCatalogoTarjetas();
    interceptarFirewallSeguridadUsuario(data.usuarios, window.usuarioLogueado ? window.usuarioLogueado.email : "");
} // Fin de Function procesarDatosDelMotor

document.addEventListener("DOMContentLoaded", () => { // Inicia EventListener DOMContentLoaded
    if (typeof supabase !== "undefined" && supabase !== null) {
        supabase.auth.onAuthStateChange((event, session) => { // Inicia Callback onAuthStateChange
            console.log(`ðŸ” [SRE ESPÃA AUTH] Evento disparado: ${event}`);
            
            if (session && session.user) {
                const correoUsuario = String(session.user.email).trim();
                window.usuarioLogueado = session.user;
                console.log(`ðŸ‘¤ Usuario detectado en Supabase Auth: ${correoUsuario}`);

                const idScriptSeguridad = "sre-jsonp-firewall-auth";
                let scriptExistente = document.getElementById(idScriptSeguridad);
                if (scriptExistente) scriptExistente.remove();
                
                window.procesarVerificacionEstadoACL = async (datosUsuarioSheet) => {
                    console.log("ðŸ›¡ï¸ [SRE ESPÃA ACL PROCESADOR] Respuesta de cuenta:", datosUsuarioSheet);
                    
                    if (datosUsuarioSheet && datosUsuarioSheet.estado_cuenta === "suspendido") {
                        state.usuarioActual = null; 
                        window.usuarioLogueado = null;
                        alert("Acceso Denegado: Su cuenta se encuentra SUSPENDIDA por el administrador.");
                        await supabase.auth.signOut(); 
                        return;
                    }
                    state.usuarioActual = {
                        id: String(session.user.id).trim(), 
                        correo: correoUsuario,
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
                state.usuarioActual = null; 
                window.usuarioLogueado = null;
                console.log("ðŸ‘¤ Estado Auth: Sin sesiÃ³n de usuario activa.");
            }
        }); // Fin de Callback onAuthStateChange
    }

    if (typeof L !== 'undefined' && document.getElementById('map-instance')) {
        window.map = L.map('map-instance', { zoomControl: true }).setView([-12.125, -76.995], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.map);
    }

    setTimeout(() => { // Inicia Timer de inicializaciÃ³n
        inicializarEventosDeFiltros();
        if (window.map) {
            window.map.on('moveend', renderizarMapaZillow);
            window.map.invalidateSize(); 
        }
        // Invocación directa optimizada
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
    }, 100); // Fin de Timer de inicializaciÃ³n
}); // Fin de EventListener DOMContentLoaded


// ==========================================================================
// PARTE 13 DE 15: ESTABILIZADOR CARTOGRÃFICO INVALIDATE SIZE Y LISTENERS DROPDOWNS
// ==========================================================================

function inicializarEventosDeFiltros() { // Inicia Function inicializarEventosDeFiltros
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

    const radiosTransaccion = document.querySelectorAll('input[name="transaccion"]');
    radiosTransaccion.forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.filtros.estado = e.target.value;
            const btnStatus = document.getElementById('btn-filter-status');
            if (btnStatus) {
                if (e.target.value === "Venta") btnStatus.textContent = "En venta";
                else if (e.target.value === "Alquiler") btnStatus.textContent = "Para el alquiler";
                else if (e.target.value === "Vendido") btnStatus.textContent = "Vendidas";
            }
            ejecutarTuberiaSincronizada();
        });
    });

    const inputMinPrecio = document.getElementById('price-min');
    const inputMaxPrecio = document.getElementById('price-max');
    
    const handlerPrecios = () => {
        state.filtros.precioMin = parseFloat(inputMinPrecio.value) || 0;
        state.filtros.precioMax = parseFloat(inputMaxPrecio.value) || Infinity;
        ejecutarTuberiaSincronizada();
    };
    if (inputMinPrecio) inputMinPrecio.addEventListener('input', handlerPrecios);
    if (inputMaxPrecio) inputMaxPrecio.addEventListener('input', handlerPrecios);

    configurarSegmentado('row-beds', (valor) => { 
        state.filtros.camas = parseInt(valor, 10) || 0; 
        ejecutarTuberiaSincronizada(); 
    });
    configurarSegmentado('row-baths', (valor) => { 
        state.filtros.banos = parseFloat(valor) || 0; 
        ejecutarTuberiaSincronizada(); 
    });

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
                state.filtros.tiposListado.clear(); 
                state.filtros.tiposListado.add(e.target.value);
            } else {
                state.filtros.tiposListado.delete(e.target.value);
            }
            ejecutarTuberiaSincronizada();
        });
    });
} // Fin de Function inicializarEventosDeFiltros


// ==========================================================================
// PARTE 14 DE 15: CONTROL DE ENTRADAS DE CAMPOS SEGMENTADOS DE SELECCIÃ“N ÃšNICA
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
// PARTE 15 DE 15: FILTRADO MULTIDIMENSIONAL SIN TILDES Y DESPLIEGUE DE FICHA DETALLE
// ==========================================================================

function evaluarCriteriosDeFiltrado(prop) { // Inicia Function evaluarCriteriosDeFiltrado
    const filtroTransaccion = state.filtros.estado || "Venta";
    
    // REGLA DE NEGOCIO ESTRICTA SRE LIMA
    if (filtroTransaccion === "Venta" || filtroTransaccion === "En venta") {
        // Venta requiere: tipo_anuncio = 'Venta' Y estado_publicacion = 'disponible'
        if (prop.tipo_anuncio !== "Venta" || prop.estado_publicacion !== "disponible") return false;
    } else if (filtroTransaccion === "Alquiler" || filtroTransaccion === "Para el alquiler") {
        // Alquiler requiere: tipo_anuncio = 'Alquiler' Y estado_publicacion = 'disponible'
        if (prop.tipo_anuncio !== "Alquiler" || prop.estado_publicacion !== "disponible") return false;
    } else if (filtroTransaccion === "Vendido" || filtroTransaccion === "Vendidas") {
        // Vendido requiere: estado_publicacion = 'vendida'
        if (prop.estado_publicacion !== "vendida") return false;
    }


    if (prop.precio_base < state.filtros.precioMin || prop.precio_base > state.filtros.precioMax) return false;
    if (state.filtros.camas && (parseInt(prop.habitaciones) || 0) < state.filtros.camas) return false;
    if (state.filtros.banos && (parseFloat(prop.banos) || 0) < state.filtros.banos) return false;

    if (state.filtros.tiposPropiedad && state.filtros.tiposPropiedad.size > 0) {
        if (!Array.from(state.filtros.tiposPropiedad).some(f => f === String(prop.tipo_propiedad || ''))) return false;
    }

    const checkboxesFisicosEnPantalla = document.querySelectorAll('.more-filter-cb');
    const checkboxesMarcados = Array.from(checkboxesFisicosEnPantalla).filter(cb => cb.checked);
    const checkMaestro = document.getElementById('check-todos-listados');

    if (checkMaestro && checkMaestro.checked === true) {
        return true;
    } else if (checkboxesMarcados.length === 0) {
        return false;
    } else {
        if (checkboxesMarcados.length > 0) {
            const situacionBD = String(prop.situacion_propiedad || "").toLowerCase().trim();
            const coincideFiltro = checkboxesMarcados.some(cb => String(cb.value).toLowerCase().trim() === situacionBD);
            if (!coincideFiltro) return false;
        }
    }
    return true;
} // Fin de Function evaluarCriteriosDeFiltrado

function ejecutarTuberiaSincronizada() { // Inicia Function ejecutarTuberiaSincronizada
    if (typeof renderizarMapaZillow === "function") {
        renderizarMapaZillow(); 
    }
    if (typeof renderizarCatalogoTarjetas === "function") {
        renderizarCatalogoTarjetas(); 
    }
} // Fin de Function ejecutarTuberiaSincronizada

function interceptarFirewallSeguridadUsuario(l, em) {}

function inicializarEventosPopups() { // Inicia Function inicializarEventosPopups
    document.getElementById("btn-solicitar-tour-galeria")?.addEventListener("click", () => {
        mostrarPopupAccion("modal-tour-comercial"); 
        if (typeof calcularCalendarioTresCajas === "function") calcularCalendarioTresCajas(); 
        if (typeof gestionarPasosModalTour === "function") gestionarPasosModalTour(1);
    });
    document.getElementById("btn-contactar-agente-galeria")?.addEventListener("click", () => {
        mostrarPopupAccion("modal-agent-comercial"); 
        if (typeof inyectarDatosPropiedadAlMensaje === "function") inyectarDatosPropiedadAlMensaje();
    });
} // Fin de Function inicializarEventosPopups

function mostrarPopupAccion(id) { 
    const n = document.getElementById(id); 
    if (n) n.style.display = "flex"; 
}

function cerrarPopupAccion(id) { 
    const n = document.getElementById(id); 
    if (n) n.style.display = "none"; 
}

function calcularCalendarioTresCajas() {}
function gestionarPasosModalTour(p) {}
function inyectarDatosPropiedadAlMensaje() {}
function ejecutarEnvioAppsScript(p, m, f, mx) {}

function gestionarCortinaSPA(tipoPantalla, prop) {
    const cortina = document.getElementById('cortina-spa');
    if (!cortina) return;
    if (tipoPantalla === 'cerrar') {
        cortina.classList.remove('cortina-activa');
        return;
    }

    if (tipoPantalla === 'detalle') {
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
            <div style="width: 100%; background: #ffffff; font-family: sans-serif; min-height: 100vh; position: relative;">
                
                <div style="width: 100%; height: 480px; position: relative; background: #000000; overflow: hidden;">
                    <div style="width: 100%; height: 100%; border-radius: 0; overflow: hidden; position: relative;">
                        <img id="foto-zillow-showcase-activa" src="${fotoPrincipal}" style="width: 100%; height: 100%; object-fit: cover; display: block; transform-origin: center center;">
                    </div>

                    <button id="btn-cerrar-cortina" style="position: absolute; top: 20px; left: 24px; background: #ffffff; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; font-weight: bold; color: #1a1a1a; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10;">‹</button>

                    <div style="position: absolute; top: 20px; right: 24px; display: flex; gap: 10px; z-index: 10;">
                        <button style="background: #ffffff; border: none; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); color: #1a1a1a;">💾 Guardado</button>
                        <button style="background: #ffffff; border: none; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); color: #1a1a1a;">🔄 Compartir</button>
                        <button style="background: #ffffff; border: none; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); color: #1a1a1a;">••• Más</button>
                    </div>

                    <button style="position: absolute; top: 50%; left: 20px; transform: translateY(-50%); background: rgba(0,0,0,0.3); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; font-size: 20px; cursor: pointer; z-index: 10;">‹</button>
                    <button style="position: absolute; top: 50%; right: 20px; transform: translateY(-50%); background: rgba(0,0,0,0.3); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; font-size: 20px; cursor: pointer; z-index: 10;">›</button>

                    <div style="position: absolute; bottom: 20px; left: 24px; display: flex; gap: 10px; z-index: 10;">
                        ${miniaturasHtml}
                    </div>

                    <div style="position: absolute; bottom: 20px; right: 24px; color: white; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.6); z-index: 10;">SHOWCASE</div>
                </div>

                <div style="padding: 24px; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: row; gap: 32px; box-sizing: border-box; flex-wrap: wrap;">
                    
                    <div style="flex: 1; min-width: 300px; max-width: 100%; flex-basis: 65%;">
                        
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

                    <div style="flex: 1; min-width: 300px; flex-basis: 30%; max-width: 100%; height: fit-content; background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                        <h4 style="font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px; text-align: center;">Contactar con la inmobiliaria</h4>
                        <button type="button" id="btn-solicitar-tour-galeria-spa" style="width: 100%; background: #006aff; color: #ffffff; border: none; padding: 12px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; margin-bottom: 10px;">Solicitar un Tour</button>
                        <button type="button" id="btn-contactar-agente-galeria-spa" style="width: 100%; background: #ffffff; color: #006aff; border: 1px solid #006aff; padding: 12px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer;">Contactar Agente</button>
                    </div>

                </div>
            </div>
        `;

            document.getElementById('btn-cerrar-cortina').onclick = () => gestionarCortinaSPA('cerrar');

        document.getElementById('btn-solicitar-tour-galeria-spa').onclick = () => {
            mostrarPopupAccion("modal-tour-comercial");
            if (typeof calcularCalendarioTresCajas === "function") calcularCalendarioTresCajas();
            if (typeof gestionarPasosModalTour === "function") gestionarPasosModalTour(1);
        };

        document.getElementById('btn-contactar-agente-galeria-spa').onclick = () => {
            mostrarPopupAccion("modal-agent-comercial");
            if (typeof inyectarDatosPropiedadAlMensaje === "function") inyectarDatosPropiedadAlMensaje();
        };

        const imgAnimar = document.getElementById('foto-zillow-showcase-activa');
        const fotosArregloSeguro = prop.fotos || [];
        let indiceFotoSecuencia = 0;

        function reproducirSecuenciaCinematografica() {
            if (!imgAnimar || fotosArregloSeguro.length === 0) return;

            imgAnimar.src = fotosArregloSeguro[indiceFotoSecuencia];

            const animacionCorriendo = imgAnimar.animate([
                { transform: 'scale(1.0) translate(0%, 0%)' },
                { transform: 'scale(1.18) translate(2%, -1.5%)' }
            ], {
                duration: 8000,
                iterations: 1,
                easing: 'ease-in-out'
            });

            animacionCorriendo.onfinish = () => {
                indiceFotoSecuencia = (indiceFotoSecuencia + 1) % fotosArregloSeguro.length;
                reproducirSecuenciaCinematografica();
            };
        }
        // Inyección automática y cálculo de las sub-fichas técnicas e interiores
        inyectarSeccionesAdicionalesZillow(prop);

        // Ejecutar el carrusel cinematográfico infinito
        reproducirSecuenciaCinematografica();
    }


    cortina.classList.add('cortina-activa');
}

// ==========================================================================
// COMPONENTE MODULAR INTERIOR: CÁLCULOS FINANCIEROS Y CARACTERÍSTICAS
// ==========================================================================

function inyectarSeccionesAdicionalesZillow(prop) {
    const slotDinamico = document.getElementById('zillow-next-sections-slot');
    if (!slotDinamico) return;

    // --- BLOQUE DE CÁLCULOS MATEMÁTICOS FINANCIEROS DE MERCADO ---
    const precioBase = parseFloat(prop.precio_base) || 0;
    
    // 1. Zestimate de venta aproximado (+2.1% del precio base)
    const zestimateVenta = precioBase > 0 ? precioBase * 1.021 : 0;
    
    // 2. Rango de mercado estimado (Rango del -4% al +5% sobre el Zestimate)
    const rangoMin = zestimateVenta * 0.96;
    const rangoMax = zestimateVenta * 1.05;
    
    // 3. Alquiler estimado mensual (Retorno anualizado basado en una tasa del 5.5% de rentabilidad)
    const zestimateAlquiler = precioBase > 0 ? (precioBase * 0.055) / 12 : 0;

    // --- FORMATEADORES MONETARIOS AUXILIARES ---
    const fMoneda = (val) => val > 0 ? '$' + Math.round(val).toLocaleString('en-US') : 'No disponible';

    slotDinamico.innerHTML = `
        <!-- SECCIÓN 1: DATOS Y CARACTERÍSTICAS (INTERIOR Y EQUIPAMIENTO) -->
        <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
            <h4 style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px;">Datos y características del inmueble</h4>
            
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <!-- Sub-bloque Interior -->
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

        <!-- SECCIÓN 2: PERSPECTIVA DE LA OFERTA Y VALOR DE MERCADO ESTIMADO -->
        <div style="margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <h4 style="font-size: 20px; font-weight: 700; color: #1a1a1a;">Valor de mercado estimado</h4>
                <span style="background: #006aff; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">ZESTIMATE</span>
            </div>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Índice de valoración automatizado calculado en tiempo real con la data de la zona.</p>
            
            <!-- Rejilla de Tarjetas Financieras Calculadas -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                
                <!-- Tarjeta Venta Real -->
                <div style="border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <span style="font-size: 12px; color: #64748b; display: block; font-weight: 600;">Precio de lista</span>
                    <strong style="font-size: 20px; color: #1a1a1a; display: block; margin: 4px 0;">${fMoneda(precioBase)}</strong>
                    <span style="font-size: 11px; color: #10b981; font-weight: 600;">Valor base de tasación</span>
                </div>

                <!-- Tarjeta Zestimate Venta Estimado -->
                <div style="border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.02); border-left: 4px solid #006aff;">
                    <span style="font-size: 12px; color: #64748b; display: block; font-weight: 600;">Zestimate® Actual</span>
                    <strong style="font-size: 20px; color: #006aff; display: block; margin: 4px 0;">${fMoneda(zestimateVenta)}</strong>
                    <span style="font-size: 11px; color: #475569;">Rango: ${fMoneda(rangoMin)} - ${fMoneda(rangoMax)}</span>
                </div>

                <!-- Tarjeta Zestimate Alquiler Estimado -->
                <div style="border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <span style="font-size: 12px; color: #64748b; display: block; font-weight: 600;">Alquiler estimado</span>
                    <strong style="font-size: 20px; color: #1a1a1a; display: block; margin: 4px 0;">${fMoneda(zestimateAlquiler)}/mes</strong>
                    <span style="font-size: 11px; color: #475569;">Retorno anual calc. 5.5%</span>
                </div>

            </div>
        </div>
        
        <!-- CONTENEDOR EN BLANCO EN CADENA PARA LOS PRÓXIMAS COMPONENTES GRAFICOS E HISTORIALES -->
        <div id="zillow-graphs-and-history-slot"></div>
    `;

    // Inyección automática en cadena del historial con Supabase y la calculadora hipotecaria
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
        '2023-T1': 1650, '2023-T2': 1670, '2023-T3': 1690, '2023-T4': 1710,
        '2024-T1': 1730, '2024-T2': 1750, '2024-T3': 1740, '2024-T4': 1760,
        '2025-T1': 1780, '2025-T2': 1800, '2025-T3': 1820, '2025-T4': 1840, '2026-T1': 1850
    };

    try {
        if (window.supabase) {
            const { data, error } = await window.supabase
                .from('tasacion_distrital')
                .select('trimestre_ano, venta_m2')
                .eq('codigo_ubigeo', ubigeoPropiedad)
                .in('trimestre_ano', periodosRequeridos)
                .order('trimestre_ano', { ascending: true });

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
                <h4 style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin: 0;">Historia de Zestimate® (Últimos 3 años)</h4>
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
// INICIO DE FUNCTION: inyectarCapacidadCompraZillow (VERSIÓN COMPLETA CON PERSISTENCIA)
// ====================================================================================
async function inyectarCapacidadCompraZillow(prop) { // Abre la función principal inyectarCapacidadCompraZillow
    const slotBuyability = document.getElementById('zillow-buyability-and-neighborhood-slot');
    if (!slotBuyability) return;

    const precioBase = parseFloat(prop.precio_base) || 0;
    const tipoProp = String(prop.tipo_propiedad || 'vivienda').toLowerCase().trim();

    // 1. Inyección de la maquetación HTML incluyendo el nuevo botón de Guardar
    slotBuyability.innerHTML = `
        <div style="margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <h4 style="font-size: 18px; font-weight: 700; color: #1a1a1a;">Simulador Hipotecario Inteligente</h4>
                <span style="background: #006aff; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">CONEXIÓN DIRECTA</span>
            </div>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 20px;">Evaluación en base a las políticas SBS y BCRP vigentes para <strong>${tipoProp}</strong>.</p>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 20px;">
                <div style="text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
                    <span style="font-size: 14px; color: #475569; font-weight: 600;">Cuota Mensual Total Estimada</span>
                    <h3 id="display-pago-total-hipoteca" style="font-size: 32px; font-weight: 800; color: #10b981; margin: 6px 0 0 0;">Calculando...</h3>
                    <p id="lov-comentario-dinamico" style="font-size: 11px; color: #64748b; margin: 6px 0 0 0; font-style: italic;"></p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                    <div>
                        <label style="font-size: 12px; font-weight: bold; color: #475569; display: block; margin-bottom: 4px;">Cuota Inicial (%):</label>
                        <select id="combo-lov-inicial" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff;"></select>
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: bold; color: #475569; display: block; margin-bottom: 4px;">Plazo de Financiamiento:</label>
                        <select id="combo-lov-plazo" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff;"></select>
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: bold; color: #475569; display: block; margin-bottom: 4px;">Tasa de Interés Anual (TEA):</label>
                        <select id="combo-lov-tea" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff;"></select>
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: bold; color: #475569; display: block; margin-bottom: 4px;">Seguro Desgravamen Mensual:</label>
                        <select id="combo-lov-desgravamen" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff;"></select>
                    </div>
                    <div>
                        <label style="font-size: 12px; font-weight: bold; color: #475569; display: block; margin-bottom: 4px;">Seguro de Inmueble Mensual:</label>
                        <select id="combo-lov-inmueble" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff;"></select>
                    </div>
                </div>
                <div style="border-top: 1px solid #f1f5f9; padding-top: 14px; font-size: 13px; color: #475569; display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px;">
                    <div style="display: flex; justify-content: space-between;"><span>Monto Neto Financiado:</span><strong id="txt-calc-prestamo" style="color: #1e293b;">-</strong></div>
                    <div style="display: flex; justify-content: space-between;"><span>Cuota Base (Amortización + Interés):</span><strong id="txt-calc-cuotabase" style="color: #1e293b;">-</strong></div>
                    <div style="display: flex; justify-content: space-between;"><span>Costo Seguro Desgravamen:</span><strong id="txt-calc-segdesg" style="color: #1e293b;">-</strong></div>
                    <div style="display: flex; justify-content: space-between;"><span>Costo Seguro Inmueble Todo Riesgo:</span><strong id="txt-calc-seginm" style="color: #1e293b;">-</strong></div>
                </div>
                <!-- Botón de acción comercial -->
                <button type="button" id="btn-guardar-simulacion-supabase" style="width: 100%; background: #10b981; color: white; border: none; padding: 12px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; transition: background 0.2s;">💾 Guardar esta Simulación en mi Cuenta</button>
            </div>
        </div>
        <div id="zillow-neighborhood-slot"></div>
    `;

    // 2. Vinculación de variables de control y escucha del DOM
    const cInicial = document.getElementById('combo-lov-inicial');
    const cPlazo = document.getElementById('combo-lov-plazo');
    const cTea = document.getElementById('combo-lov-tea');
    const cDesg = document.getElementById('combo-lov-desgravamen');
    const cInm = document.getElementById('combo-lov-inmueble');
    const btnGuardar = document.getElementById('btn-guardar-simulacion-supabase');

    // Variables numéricas globales al contexto de la función para ser reutilizadas en el salvado
    let calculosGlobales = null;

    function ejecutarRecalculoHipoteca() { // Abre la sub-función matemática ejecutarRecalculoHipoteca
        const pctInicial = parseFloat(cInicial.value) || 0;
        const anosPlazo = parseInt(cPlazo.value) || 0;
        const valorTea = parseFloat(cTea.value) || 0;
        const pctDesg = parseFloat(cDesg.value) || 0;
        const pctInm = parseFloat(cInm.value) || 0;

        if (pctInicial === 0 || anosPlazo === 0 || valorTea === 0) return;

        const montoInicial = precioBase * pctInicial;
        const montoPrestamo = precioBase - montoInicial;
        const totalMeses = anosPlazo * 12;
        
        // Conversión Exponencial SBS (TEA a TEM)
        const tasaMensualTEM = Math.pow(1 + valorTea, 1 / 12) - 1;

        // Fórmula del Sistema Francés para Cuota Fija (Amortización)
        const cuotaBase = montoPrestamo * (tasaMensualTEM * Math.pow(1 + tasaMensualTEM, totalMeses)) / (Math.pow(1 + tasaMensualTEM, totalMeses) - 1);

        const costoDesgravamen = montoPrestamo * pctDesg;
        const costoInmueble = precioBase * pctInm;
        const cuotaTotal = cuotaBase + costoDesgravamen + costoInmueble;
        const ratioLtv = montoPrestamo / precioBase;

        // Renderizado en pantalla de de los resultados en tiempo real
        document.getElementById('display-pago-total-hipoteca').innerText = `$/., ${Math.round(cuotaTotal).toLocaleString('en-US')}/mes`;
        document.getElementById('txt-calc-prestamo').innerText = `$/., ${Math.round(montoPrestamo).toLocaleString('en-US')}`;
        document.getElementById('txt-calc-cuotabase').innerText = `$/., ${Math.round(cuotaBase).toLocaleString('en-US')}`;
        document.getElementById('txt-calc-segdesg').innerText = `$/., ${Math.round(costoDesgravamen).toLocaleString('en-US')}`;
        document.getElementById('txt-calc-seginm').innerText = `$/., ${Math.round(costoInmueble).toLocaleString('en-US')}`;

        const opcionSeleccionada = cInicial.options[cInicial.selectedIndex];
        document.getElementById('lov-comentario-dinamico').innerText = opcionSeleccionada ? opcionSeleccionada.getAttribute('data-comment') : '';

        // Almacenamos el paquete de datos en memoria para el disparo del botón Guardar
        calculosGlobales = {
            pctInicial, montoInicial, montoPrestamo, totalMeses, valorTea, 
            tasaMensualTEM, pctDesg, pctInm, cuotaBase, costoDesgravamen, 
            costoInmueble, cuotaTotal, ratioLtv
        };
    } // Cierra la sub-función matemática ejecutarRecalculoHipoteca

    [cInicial, cPlazo, cTea, cDesg, cInm].forEach(combo => combo.addEventListener('change', ejecutarRecalculoHipoteca));

        // 3. Evento Click para procesar el guardado transaccional en Supabase
    btnGuardar.addEventListener('click', async () => { // Abre el EventListener del botón guardar
        // Candado ACL: Validación obligatoria de seguridad implementada en tu app.js
        if (typeof verificarAutorizacionAcceso === "function" && !verificarAutorizacionAcceso()) return;
        if (!calculosGlobales) return;

        btnGuardar.innerText = "⏳ Procesando registro...";
        btnGuardar.disabled = true;

        try { // Abre el bloque transaccional try
            const cliente = obtenerClienteSupabase();
            // Obtenemos el ID del usuario logueado en la ventana desde tu ecosistema de autenticación
            const idUsuario = window.usuarioLogueado ? window.usuarioLogueado.id : 'anonimo_invitado';

            const { data, error } = await cliente
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
                    pago_mensual_estimado: calculosGlobales.cuotaTotal,
                    ltv: calculosGlobales.ratioLtv
                }])
                .select();

            if (error) throw error;

            alert("🎉 ¡Simulación guardada con éxito! Podrás revisar esta corrida desde tu panel de cuenta en cualquier momento.");
            btnGuardar.innerText = "✅ Simulación Almacenada Correctamente";
            btnGuardar.style.background = "#059669";

        } catch (err) { // Captura de error en inserción
            console.error("Error al registrar simulación:", err.message);
            alert("No se pudo guardar la simulación: " + err.message);
            btnGuardar.innerText = "💾 Guardar esta Simulación en mi Cuenta";
            btnGuardar.disabled = false;
        } // Cierra el bloque transaccional catch
    }); // Cierra el EventListener del botón guardar

    // 4. Poblamiento inicial de combos consumiendo tu Vista SQL optimizada
    try { // Abre bloque try de renderizado de combos
        const cliente = obtenerClienteSupabase();
        const { data, error } = await cliente
            .from('vista_lov_hipoteca_consolidada')
            .select('*')
            .eq('tipo_propiedad', tipoProp);

        if (error) throw error;

        const inicialesSet = new Map();
        const plazosSet = new Set();
        const teasSet = new Set();
        const desgravamenesSet = new Set();
        const inmueblesSet = new Set();

        data?.forEach(reg => {
            inicialesSet.set(reg.cuota_inicial, reg.comentario_inicial);
            plazosSet.add(reg.plazo_anos);
            teasSet.add(reg.tasa_tea);
            desgravamenesSet.add(reg.seguro_desgravamen_mensual);
            inmueblesSet.add(reg.seguro_inmueble_mensual);
        });

        // Poblado ordenado numéricamente en el DOM
        Array.from(inicialesSet.keys()).sort((a,b)=>a-b).forEach(val => {
            const opt = document.createElement('option'); opt.value = val;
            opt.innerText = `${(val * 100).toFixed(0)}%`;
            opt.setAttribute('data-comment', inicialesSet.get(val));
            cInicial.appendChild(opt);
        });

        Array.from(plazosSet).sort((a,b)=>a-b).forEach(val => {
            const opt = document.createElement('option'); opt.value = val;
            opt.innerText = `${val} Años`; cPlazo.appendChild(opt);
        });

        Array.from(teasSet).sort((a,b)=>a-b).forEach(val => {
            const opt = document.createElement('option'); opt.value = val;
            opt.innerText = `${(val * 100).toFixed(2)}% TEA`; cTea.appendChild(opt);
        });

        Array.from(desgravamenesSet).sort((a,b)=>a-b).forEach(val => {
            const opt = document.createElement('option'); opt.value = val;
            opt.innerText = `${(val * 100).toFixed(3)}% mens.`; cDesg.appendChild(opt);
        });

        Array.from(inmueblesSet).sort((a,b)=>a-b).forEach(val => {
            const opt = document.createElement('option'); opt.value = val;
            opt.innerText = `${(val * 100).toFixed(3)}% mens.`; cInm.appendChild(opt);
        });

        // Disparador del recálculo automático inicial
        ejecutarRecalculoHipoteca();

    } catch (err) {
        console.error("Error al poblar selectores financieros:", err.message);
    } // Cierra bloque try de renderizado de combos

    // Encadenamiento nativo de pintado cartográfico de la ficha descriptiva
    inyectarMapaYEscuelasZillow(prop);
} 
// ====================================================================================
// FIN DE FUNCTION: inyectarCapacidadCompraZillow
// ====================================================================================


        
// ====================================================================================
// FIN DE FUNCTION: inyectarCapacidadCompraZillow
// ====================================================================================

// ====================================================================================
// INICIO DE FUNCTION: inyectarMapaYEscuelasZillow
// ====================================================================================
function inyectarMapaYEscuelasZillow(prop) {
    const slotMapa = document.getElementById('zillow-neighborhood-slot');
    if (!slotMapa) return;

    const lat = parseFloat(prop.latitud) || -12.1193; // Fallback Miraflores/Surco si viene vacío
    const lng = parseFloat(prop.longitud) || -77.0294;
    const distrito = prop.distrito || 'Lima';

    slotMapa.innerHTML = `
        <!-- SECCIÓN: MAPA DEL BARRIO INTERACTIVO -->
        <div style="margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
            <h4 style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px;">Barrio y ubicación</h4>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Explora los alrededores y la conectividad urbana en el distrito de ${distrito}.</p>
            
            <!-- Contenedor Físico del Mapa Leaflet -->
            <div id="mapa-detalle-zillow-container" style="width: 100%; height: 320px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; z-index: 1; position: relative;"></div>
        </div>

        <!-- SECCIÓN: ESCUELAS CERCANAS -->
        <div style="margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 24px; margin-bottom: 20px;">
            <h4 style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px;">Escuelas cercanas</h4>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Calificaciones e instituciones educativas asignadas a esta zona residencial.</p>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <!-- Escuela 1 -->
                <div style="display: flex; align-items: center; justify-content: space-between; border: 1px solid #e2e8f0; padding: 14px 16px; border-radius: 8px; background: #ffffff;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <span style="background: #10b981; color: white; font-weight: bold; font-size: 14px; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">8</span>
                        <div>
                            <strong style="font-size: 14px; color: #1e293b; display: block;">Colegio Saco Oliveros</strong>
                            <span style="font-size: 12px; color: #64748b;">Primaria & Secundaria | A 0.4 km</span>
                        </div>
                    </div>
                    <span style="font-size: 12px; color: #475569; font-weight: 600; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">Público calificado</span>
                </div>

                <!-- Escuela 2 -->
                <div style="display: flex; align-items: center; justify-content: space-between; border: 1px solid #e2e8f0; padding: 14px 16px; border-radius: 8px; background: #ffffff;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <span style="background: #10b981; color: white; font-weight: bold; font-size: 14px; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">7</span>
                        <div>
                            <strong style="font-size: 14px; color: #1e293b; display: block;">I.E. Juana Alarco de Dammert</strong>
                            <span style="font-size: 12px; color: #64748b;">Solo Mujeres | A 0.9 km</span>
                        </div>
                    </div>
                    <span style="font-size: 12px; color: #475569; font-weight: 600; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">Estatal</span>
                </div>
            </div>
        </div>

        <!-- RECEPTOR FINAL DE CARRUSELES DE PROPIEDADES CERCANAS/SIMILARES -->
        <div id="zillow-similar-properties-carousel-slot"></div>
    `;

    // --- PROCESAMIENTO SRE: ASIGNACIÓN ASÍNCRONA DE MAPA EN EL DOM ---
    setTimeout(() => {
        const mapaDiv = document.getElementById('mapa-detalle-zillow-container');
        if (!mapaDiv || typeof L === 'undefined') return;

        try {
            // Inicializamos el mapa Leaflet centrado en las coordenadas reales de Supabase
            const mapDetalle = L.map('mapa-detalle-zillow-container', {
                center: [lat, lng],
                zoom: 15,
                zoomControl: true,
                scrollWheelZoom: false
            });

            // Cargamos la capa de diseño base gratuita de OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(mapDetalle);

            // Añadimos un marcador circular estilizado para representar la propiedad
            L.marker([lat, lng]).addTo(mapDetalle)
                .bindPopup(`<strong style="font-family:sans-serif;">Inmueble en detalle</strong><br/>Precio base: $${Number(prop.precio_base).toLocaleString('en-US')}`)
                .openPopup();

            // Forzamos el recalibrado de dimensiones para evitar cortes en el layout
            setTimeout(() => { mapDetalle.invalidateSize(); }, 300);

        } catch (error) {
            console.error("SRE Error al renderizar mapa Leaflet secundario:", error);
        }
    }, 200);
}
// ====================================================================================
// FIN DE FUNCTION: inyectarMapaYEscuelasZillow
// ====================================================================================
