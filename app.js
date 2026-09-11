/* jshint esversion: 11, esnext: true, devel: true, browser: true */

// ==========================================================================
// PARTE 1 DE 15: ARQUITECTURA DE CONTROL DE ESTADO GLOBAL INMUTABLE
// ==========================================================================

let usuarioAutenticado = false;
let correoUsuarioLogueado = "";
const urlMiScriptGoogle = window.urlMiScriptGoogle || "https://script.google.com/macros/s/AKfycbxCuTcsZYP7ayyvckIJDh7Ute_Epr9gPxGw1AieEmRAtxOaJ6zM6tOvp-TXa_3ormGhrw/exec";

if (typeof window.usuarioAutenticado === "undefined") { 
    window.usuarioAutenticado = false; 
}

if (typeof window.correoUsuarioLogueado === "undefined") { 
    window.correoUsuarioLogueado = ""; 
}

if (typeof actualizarBotonCuenta !== "function") {
    var actualizarBotonCuenta = function() {
        console.log("[SRE] Simulación de actualización de botón de cuenta."); 
    };
}

const state = {
    propiedades: [],
    favoritos: new Set(),
    usuarioActual: window.usuarioLogueado || null,
    propiedadSeleccionadaId: null,
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

// ==========================================================================
// PARTE 2 DE 15: INITIALIZACIÓN CORE DEL CLIENTE SUPABASE CON FILTROS DE RED
// ==========================================================================

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
    if (supabase) {
        console.log("? [SRE ESPÍA 2] Cliente Supabase vinculado y listo para peticiones.");
    } else {
        console.error("? [SRE ESPÍA 2] No se pudo instanciar el cliente Supabase. Verifique CDN.");
    }
    return supabase;
}

obtenerClienteSupabase();

// ==========================================================================
// PARTE 3 DE 15: FIREWALLS DE ACCESO ACL Y TRANSPORTE JSONP APPS SCRIPT
// ==========================================================================

function verificarAutorizacionAcceso() {
    const usuarioActual = state.usuarioActual || window.usuarioLogueado || null;
    console.group("ðŸ›¡ï¸  [SRE ESPÃ A ACL] Verificando credenciales de interacciÃ³n");
    console.log("Usuario actual en estado:", usuarioActual);
    
    if (!usuarioActual || !usuarioActual.id) {
        console.warn("â›” ACL BLOQUEADO: SesiÃ³n inexistente.");
        console.groupEnd();
        alert("Acceso Restringido: Debe iniciar sesiÃ³n con su cuenta para realizar esta acciÃ³n.");
        if (typeof mostrarPopupAccion === "function") {
            mostrarPopupAccion("modal-autenticacion-supabase");
        }
        return false;
    }
    
    if (usuarioActual.estado_cuenta === "suspendido") {
        console.error("â›” ACL BLOQUEADO: El usuario se encuentra SUSPENDIDO.");
        console.groupEnd();
        alert("Cuenta Suspendida: No tiene autorizaciÃ³n para realizar esta acciÃ³n.");
        return false;
    }
    
    console.log("ðŸŸ¢ ACL PERMITIDO: Cuenta activa y autorizada.");
    console.groupEnd();
    return true;
}

async function cargarDatosDesdeSupabase() {
    console.log("[SRE] Consultando directamente a Supabase REST API...");
    try {
        const cliente = obtenerClienteSupabase();
        if (!cliente) throw new Error("Cliente Supabase no inicializado.");

        const { data, error } = await cliente
            .from('vista_catalogo_mapa')
            .select('*');

        if (error) throw error;

        const propiedades = Array.isArray(data) ? data : [];

        console.group("[SRE] Datos crudos de Supabase");
        console.log("Cantidad total devuelta por la Vista SQL:", propiedades.length);
        if (propiedades.length > 0) {
            const primeraPropiedad = propiedades[0];
            console.log("Estructura del primer registro (PROP-001):", primeraPropiedad);
            console.log("¿Tiene objeto .ubicacion?:", Object.prototype.hasOwnProperty.call(primeraPropiedad, 'ubicacion') ? "Sí" : "No");
            console.log("Campos de coordenadas en la raíz: latitud =", primeraPropiedad.latitud, "| longitud =", primeraPropiedad.longitud);
        }
        console.groupEnd();
        
        procesarDatosDelMotor({ propiedades, usuarios: [] });

    } catch (error) {
        console.error("? [SRE ESPÍA ERROR] Fallo en la lectura directa de Supabase REST:", error.message);
    }
}

// ==========================================================================
// PARTE 4 DE 15: MOTOR DE NORMALIZACIÃ“N RELACIONAL Y CONCATENACIÃ“N DE IMÃ GENES
// ==========================================================================
function normalizarPropiedad(prop) {
    const id = prop.propiedad_id || String(Math.random());
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

    const res = {
        id: idVerdadero,
        propiedad_id: idVerdadero,
        usuario_id_fk: prop.usuario_id_fk || "",
        titulo: String(prop.titulo || '').trim(),
        precio_base: parseFloat(prop.precio_base || 0),
        estado_publicacion: String(prop.estado_publicacion || "disponible").trim(),
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
    
    console.log(`%c?? [SRE ESPÍA 2] Normalizado ${res.id} -> Lat: ${res.latitud} | Lng: ${res.longitud}`, "color: #006aff; font-size: 11px;");
    return res;
}

// ==========================================================================
// PARTE 5 DE 15: FORMATEADORES MONETARIOS COMPACTOS Y RECONSTRUCCIÃ“N DE RIEL MULTIMEDIA
// ==========================================================================
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

// ==========================================================================
// PARTE 6 DE 15: CONSTRUCTOR DINÃ MICO DEL COMPONENTE RIEL MULTIMEDIA CON CORAZÃ“N ACL
// ==========================================================================
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

    botonCorazon.addEventListener('pointerdown', (e) => {
        if (e) {
            e.preventDefault(); 
            e.stopPropagation();
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
    });
    contenedorFoto.appendChild(botonCorazon);

    if (totalFotos > 1) {
        let indiceFotoActual = 0;
        const btnlzq = document.createElement('button');
        btnlzq.className = 'flecha-carrusel flecha-izq'; 
        btnlzq.textContent = '<';
        
        const btnDer = document.createElement('button');
        btnDer.className = 'flecha-carrusel flecha-der'; 
        btnDer.textContent = '>';

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
        contenedorFoto.appendChild(btnlzq); 
        contenedorFoto.appendChild(btnDer);
    }

    const etiquetaFlotante = document.createElement('div');
    etiquetaFlotante.className = 'etiqueta-foto-zillow';
    etiquetaFlotante.textContent = prop.titulo || '';
    contenedorFoto.appendChild(etiquetaFlotante);
    
    return contenedorFoto;
}

// ==========================================================================
// PARTE 8 DE 15: FABRICANTE DEL NODO DE LA TARJETA DEL CATÃ LOGO DE ESCRITORIO
// ==========================================================================
function crearComponenteTarjetaZillow(prop) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-casa'; 
    tarjeta.setAttribute('data-id', prop.id);

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
}

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
}

// ==========================================================================
// PARTE 10 DE 15: CONTROLADOR CARTOGRÁFICO CON DESVÍO DE EVENTO CELULAR OVERLAY
// ==========================================================================
function renderizarMapaZillow() {
    if (typeof window.L === 'undefined' || !window.map || !document.getElementById('map-instance')) {
        return;
    }
    if (typeof window.capaMarcadores === 'undefined') {
        window.capaMarcadores = null;
    }
    if (!window.capaMarcadores) {
        window.capaMarcadores = L.layerGroup().addTo(window.map);
    } else {
        window.capaMarcadores.clearLayers();
    }

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);
    const coordenadasValidas = [];

    filtradas.forEach((p, index) => {
        const latRaw = p.latitud;
        const lngRaw = p.longitud;
        const parsedLat = parseFloat(latRaw);
        const parsedLng = parseFloat(lngRaw);
        
        if (!isNaN(parsedLat) && !isNaN(parsedLng) && isFinite(parsedLat) && isFinite(parsedLng)) {
            if (parsedLat !== 0 && parsedLng !== 0) {
                coordenadasValidas.push([parsedLat, parsedLng]);
            }
        }
    });

    if (coordenadasValidas.length > 0) {
        try {
            window.map.fitBounds(coordenadasValidas, { padding: 30, maxZoom: 15, animate: true });
        } catch (errGeometrico) {
            console.error("? Error interno de Leaflet al procesar límites geométricos:", errGeometrico.message);
        }
    }

    filtradas.forEach(prop => {
        const latitud = Number(prop.latitud);
        const longitud = Number(prop.longitud);

        if (!Number.isFinite(latitud) || !Number.isFinite(longitud) || latitud === 0 || longitud === 0) {
            return;
        }

        const precioCompacto = formatearPrecioCompacto(prop.precio_base);
        let claseColorBurbuja = prop.estado_publicacion === 'vendida' ? 'vendido-dorado' : (prop.tipo_anuncio === 'Alquiler' ? 'alquiler-naranja' : 'venta-azul');

        const iconoBurbuja = L.divIcon({
            html: `<span>${precioCompacto}</span>`,
            className: `leaflet-marker-icon map-price-pill ${claseColorBurbuja}`,
            iconSize: L.point(80, 30), 
            iconAnchor: L.point(40, 15)
        });

        const marcador = L.marker([latitud, longitud], { icon: iconoBurbuja });
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

        marcador.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            state.propiedadSeleccionadaId = prop.id;

            if (window.innerWidth <= 768) {
                const cajaFlotanteMovil = document.getElementById("tarjeta-flotante-movil-sre");
                const targetContenido = document.getElementById("target-contenido-movil-sre");

                if (cajaFlotanteMovil && targetContenido) {
                    let urlFotoMóvil = (prop.fotos && prop.fotos.length > 0) ? prop.fotos[0] : "";
                    targetContenido.innerHTML = `
                        <div class="sre-movil-overlay-card" style="display:flex; gap:14px; padding:6px 0; align-items:center; font-family:sans-serif;">
                            <img src="${urlFotoMóvil}" style="width:105px; height:85px; object-fit:cover; border-radius:6px; background-color:#f0f2f5;">
                            <div style="display:flex; flex-direction:column; gap:3px; flex:1; overflow:hidden;">
                                <strong style="font-size:19px; color:#1a1a1a;">$${Number(prop.precio_base).toLocaleString('en-US')}</strong>
                                <span style="font-size:13px; color:#4a5568; font-weight:600;">${prop.habitaciones} bd | ${prop.banos} ba | ${prop.area_construida} m²</span>
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
    const inputDireccionGlobal = document.getElementById('search-address');
    
    const handlerPrecios = () => {
        state.filtros.precioMin = inputMinPrecio ? (parseFloat(inputMinPrecio.value) || 0) : 0;
        state.filtros.precioMax = inputMaxPrecio ? (parseFloat(inputMaxPrecio.value) || Infinity) : Infinity;
        ejecutarTuberiaSincronizada();
    };
    
    if (inputMinPrecio) inputMinPrecio.addEventListener('input', handlerPrecios);
    if (inputMaxPrecio) inputMaxPrecio.addEventListener('input', handlerPrecios);
    if (inputDireccionGlobal) {
        inputDireccionGlobal.addEventListener('input', () => { ejecutarTuberiaSincronizada(); });
    }

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
                checkboxesListado.forEach(cb => { 
                    cb.checked = true; 
                    state.filtros.tiposListado.add(cb.value); 
                });
            } else {
                checkboxesListado.forEach(cb => cb.checked = false);
            }
            ejecutarTuberiaSincronizada();
        });
    }

    checkboxesListado.forEach(cb => {
        cb.addEventListener('change', (e) => {
            if (checkTodos) checkTodos.checked = false;
            if (e.target.checked) state.filtros.tiposListado.add(e.target.value);
            else state.filtros.tiposListado.delete(e.target.value);
            ejecutarTuberiaSincronizada();
        });
    });
}

function configurarSegmentado(idContenedor, callback) {
    const contenedor = document.getElementById(idContenedor); 
    if (!contenedor) return;
    contenedor.addEventListener('click', (e) => {
        const botonNode = e.target.closest('.segmented-btn'); 
        if (!botonNode) return;
        contenedor.querySelectorAll('.segmented-btn').forEach(btn => btn.classList.remove('active'));
        botonNode.classList.add('active'); 
        callback(botonNode.getAttribute('data-val'));
    });
}

function evaluarCriteriosDeFiltrado(prop) {
    const filtroTransaccion = state.filtros.estado || "Venta";
    if ((filtroTransaccion === "Venta" || filtroTransaccion === "En venta") && (prop.estado_publicacion !== "disponible" || prop.tipo_anuncio !== "Venta")) return false;
    if ((filtroTransaccion === "Alquiler" || filtroTransaccion === "Para el alquiler") && (prop.estado_publicacion !== "disponible" || prop.tipo_anuncio !== "Alquiler")) return false;
    if ((filtroTransaccion === "Vendido" || filtroTransaccion === "Vendidas") && prop.estado_publicacion !== "vendida") return false;
    
    const inputDireccion = document.getElementById('search-address');
    if (inputDireccion && inputDireccion.value.trim() !== "") {
        const textoBusqueda = inputDireccion.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const direccionProp = String(prop.direccion || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const distritoProp = String(prop.distrito || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const tituloProp = String(prop.titulo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (!direccionProp.includes(textoBusqueda) && !distritoProp.includes(textoBusqueda) && !tituloProp.includes(textoBusqueda)) return false;
    }

    if (prop.precio_base < state.filtros.precioMin || prop.precio_base > state.filtros.precioMax) return false;
    if (state.filtros.camas && (parseInt(prop.habitaciones) || 0) < state.filtros.camas) return false;
    if (state.filtros.banos && (parseFloat(prop.banos) || 0) < state.filtros.banos) return false;

    if (state.filtros.tiposPropiedad && state.filtros.tiposPropiedad.size > 0) {
        if (!Array.from(state.filtros.tiposPropiedad).some(f => f === String(prop.tipo_propiedad || ''))) return false;
    }

    const checkboxesFisicos EnPantalla = document.querySelectorAll('.more-filter-cb');
    const checkboxesMarcados = Array.from(checkboxesFisicosEnPantalla).filter(cb => cb.checked);
    const checkMaestro = document.getElementById('check-todos-listados');

    if (checkMaestro && checkMaestro.checked === true) return true;
    if (checkboxesMarcados.length > 0) {
        const situacionBD = String(prop.situacion_propiedad || "").trim();
        if (!checkboxesMarcados.some(cb => String(cb.value).trim() === situacionBD)) return false;
    } else {
        return false;
    }
    return true;
}

function ejecutarTuberiaSincronizada() {
    if (typeof renderizarMapaZillow === "function") renderizarMapaZillow(); 
    if (typeof renderizarCatalogoTarjetas === "function") renderizarCatalogoTarjetas(); 
}

function interceptarFirewallSeguridadUsuario(l, em) {}
function inicializarEventosPopups() {
    document.getElementById("btn-solicitar-tour-galeria")?.addEventListener("click", () => {
        mostrarPopupAccion("modal-tour-comercial"); 
        if (typeof calcularCalendarioTresCajas === "function") calcularCalendarioTresCajas(); 
        if (typeof gestionarPasosModalTour === "function") gestionarPasosModalTour(1);
    });
    document.getElementById("btn-contactar-agente-galeria")?.addEventListener("click", () => {
        mostrarPopupAccion("modal-agent-comercial"); 
        if (typeof inyectarDatosPropiedadAlMensaje === "function") inyectarDatosPropiedadAlMensaje();
    });
}
function mostrarPopupAccion(id) { const n = document.getElementById(id); if (n) n.style.display = "flex"; }
function cerrarPopupAccion(id) { const n = document.getElementById(id); if (n) n.style.display = "none"; }
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
                <div style="width: 50px; height: 50px; border-radius: 8px; overflow: hidden; border: \${i === 0 ? '2px solid white' : '1px solid rgba(255,255,255,0.4)'}; cursor: pointer;">
                    <img src="\${listaFotos[i]}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>`;
        }

        cortina.innerHTML = `
            <div style="width: 100%; background: #ffffff; font-family: sans-serif; min-height: 100vh; position: relative;">
                <div style="width: 100%; height: 480px; position: relative; background: #000000; overflow: hidden;">
                    <img id="foto-zillow-showcase-activa" src="\${fotoPrincipal}" style="width: 100%; height: 100%; object-fit: cover;">
                    <button id="btn-cerrar-cortina" style="position: absolute; top: 20px; left: 24px; background: #ffffff; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; font-weight: bold; cursor: pointer; z-index: 10;">‹</button>
                    <div style="position: absolute; bottom: 20px; left: 24px; display: flex; gap: 10px; z-index: 10;">\${miniaturasHtml}</div>
                </div>
                <div style="padding: 24px; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 340px; gap: 32px; box-sizing: border-box;">
                    <div>
                        <h2 style="font-size: 36px; font-weight: 800; margin: 0 0 6px 0; color: #1a1a1a;">$\${Number(prop.precio_base).toLocaleString('en-US')}</h2>
                        <p style="font-size: 16px; color: #4a5568; margin: 0 0 14px 0; font-weight: 600;">\${prop.habitaciones} bd | \${prop.banos} ba | \address</p>
                        <p style="font-size: 15px; color: #2d3748;">\${prop.direccion} (\${prop.distrito})</p>
                        <div id="zillow-next-sections-slot"></div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-cerrar-cortina').onclick = () => gestionarCortinaSPA('cerrar');
        if (prop && prop.propiedad_id) {
            inyectarSeccionesAdicionalesZillow(prop);
        }
    }
    cortina.classList.add('cortina-activa');
}

function inyectarSeccionesAdicionalesZillow(prop) {
    const slotDinamico = document.getElementById('zillow-next-sections-slot');
    if (!slotDinamico) return;
    const precioBase = parseFloat(prop.precio_base) || 0;
    const zestimateVenta = precioBase * 1.021;

    slotDinamico.innerHTML = `
        <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                <div style="border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px;">
                    <span>Precio de lista</span><strong>$\${Math.round(precioBase).toLocaleString()}</strong>
                </div>
                <div style="border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px;">
                    <span>Zestimate® Actual</span><strong>$\${Math.round(zestimateVenta).toLocaleString()}</strong>
                </div>
            </div>
        </div>
        <div id="zillow-graphs-and-history-slot"></div>
    `;
    inyectarHistorialesYImpuestosZillow(prop);
}

async function inyectarHistorialesYImpuestosZillow(prop) {
    const slotHistorial = document.getElementById('zillow-graphs-and-history-slot');
    if (!slotHistorial) return;
    slotHistorial.innerHTML = `<div id="zillow-buyability-and-neighborhood-slot"></div>`;
    if (typeof inyectarCapacidadCompraZillow === "function") {
        await inyectarCapacidadCompraZillow(prop);
    }
}

// ====================================================================================
// CORRECCIÓN RADICAL: ELIMINACIÓN DEL TRY/CATCH EXTERNO INCORRECTO
// ====================================================================================
async function inyectarCapacidadCompraZillow(prop) {
    if (!prop || !prop.propiedad_id || Number.isNaN(parseFloat(prop.precio_base))) {
        console.log("[SRE] No se ejecuta el simulador hipotecario.");
        return;
    }

    const slotBuyability = document.getElementById('zillow-buyability-and-neighborhood-slot');
    if (!slotBuyability) return;

    const precioBase = parseFloat(prop.precio_base) || 0;
    const tipoProp = String(prop.tipo_propiedad || 'Casa').trim();

    slotBuyability.innerHTML = `
        <div style="margin-top: 36px; border-top: 2px solid #002E50; padding-top: 24px;">
            <h4 style="font-size: 18px; font-weight: 700; color: #002E50;">Simulador Hipotecario Inteligente</h4>
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 20px;">
                <h3 id="display-pago-total-hipoteca">Selecciona tus datos y simula tu hipoteca</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                    <div><label>Cuota Inicial:</label><select id="combo-lov-inicial" style="width:100%;"></select></div>
                    <div><label>Plazo:</label><select id="combo-lov-plazo" style="width:100%;"></select></div>
                    <div><label>Tasa TEA:</label><select id="combo-lov-tea" style="width:100%;"></select></div>
                    <div><label>Seguro Desgravamen:</label><select id="combo-lov-desgravamen" style="width:100%;"></select></div>
                    <div><label>Seguro Inmueble:</label><select id="combo-lov-inmueble" style="width:100%;"></select></div>
                </div>
                <div style="font-size: 13px; color: #475569; display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; justify-content: space-between;"><span>Monto Neto Financiado:</span><strong id="txt-calc-prestamo">-</strong></div>
                    <div style="display: flex; justify-content: space-between;"><span>Cuota Base:</span><strong id="txt-calc-cuotabase">-</strong></div>
                    <div style="display: flex; justify-content: space-between;"><span>Costo Seguro Desgravamen:</span><strong id="txt-calc-segdesg">-</strong></div>
                    <div style="display: flex; justify-content: space-between;"><span>Costo Seguro Inmueble:</span><strong id="txt-calc-seginm">-</strong></div>
                </div>
                <p id="lov-comentario-dinamico" style="font-size:11px; font-style:italic; color:#475569;"></p>
                <button type="button" id="btn-guardar-simulacion-supabase" style="width: 100%; background: #FFB91D; color: #002E50; border: none; padding: 14px; font-weight: 800; border-radius: 6px; cursor: pointer;">Enviar mi cronograma de hipoteca a mi correo</button>
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

    function ejecutarRecalculoHipoteca() {
        const pctInicial = parseFloat(cInicial.value) || 0;
        const anosPlazo = parseInt(cPlazo.value, 10) || 0;
        const valorTea = parseFloat(cTea.value) || 0;
        const pctDesg = parseFloat(cDesg.value) || 0;
        const pctInm = parseFloat(cInm.value) || 0;

        if (pctInicial <= 0 || pctInicial >= 1 || anosPlazo <= 0) return;

        const montoInicial = precioBase * pctInicial;
        const montoPrestamo = precioBase - montoInicial;
        const totalMeses = anosPlazo * 12;
        const tasaMensualTEM = valorTea > 0 ? Math.pow(1 + valorTea, 1 / 12) - 1 : 0;

        let cuotaBase = 0;
        if (tasaMensualTEM === 0) {
            cuotaBase = montoPrestamo / totalMeses;
        } else {
            const factor = Math.pow(1 + tasaMensualTEM, totalMeses);
            cuotaBase = montoPrestamo * (tasaMensualTEM * factor) / (factor - 1);
        }

        const costoDesgravamen = montoPrestamo * pctDesg;
        const costoInmueble = precioBase * pctInm;
        const cuotaTotal = cuotaBase + costoDesgravamen + costoInmueble;
        const ratioLtv = precioBase > 0 ? (montoPrestamo / precioBase) : 0;

        const moneda = (v) => `$\${Math.round(v).toLocaleString('en-US')}`;

        document.getElementById('display-pago-total-hipoteca').innerText = `\ doors\${moneda(cuotaTotal)}/mes`;
        document.getElementById('txt-calc-prestamo').innerText = moneda(montoPrestamo);
        document.getElementById('txt-calc-cuotabase').innerText = moneda(cuotaBase);
        document.getElementById('txt-calc-segdesg').innerText = moneda(costoDesgravamen);
        document.getElementById('txt-calc-seginm').innerText = moneda(costoInmueble);

        const opcionSeleccionada = cInicial.options[cInicial.selectedIndex];
        document.getElementById('lov-comentario-dinamico').innerText = opcionSeleccionada?.dataset.comment || '';

        calculosGlobales = {
            pctInicial, montoInicial, montoPrestamo, totalMeses, valorTea, 
            tasaMensualTEM, pctDesg, pctInm, cuotaBase, costoDesgravamen, 
            costoInmueble, cuotaTotal, ratioLtv
        };
    }

    [cInicial, cPlazo, cTea, cDesg, cInm].forEach(combo => combo.addEventListener('change', ejecutarRecalculoHipoteca));

    btnGuardar.addEventListener('click', async () => {
        if (typeof verificarAutorizacionAcceso === "function" && !verificarAutorizacionAcceso()) return;
        if (!calculosGlobales) {
            alert('Selecciona los parámetros de la hipoteca primero.');
            return;
        }

        btnGuardar.innerText = "? Generando cronograma...";
        btnGuardar.disabled = true;

        try {
            const cliente = obtenerClienteSupabase();
            if (!cliente) throw new Error("Cliente Supabase no disponible.");
            const idUsuario = window.usuarioLogueado?.id || 'anonimo_invitado';

            const { error } = await cliente
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
            alert("?? ¡Cronograma generado exitosamente! Documento oficial PDF en camino.");
            btnGuardar.innerText = "Cronograma enviado exitosamente";

        } catch (err) {
            console.error("Fallo guardando simulación:", err.message);
            alert("Error procesando solicitud: " + err.message);
            btnGuardar.innerText = "Enviar mi cronograma de hipoteca a mi correo";
            btnGuardar.disabled = false;
        }
    });

    try {
        const cliente = obtenerClienteSupabase();
        if (!cliente) throw new Error("Cliente Supabase no disponible.");
        const { data, error } = await cliente.from('vista_lov_hipoteca_consolidada').select('*').eq('tipo_propiedad', tipoProp);
        if (error) throw error;

        const inicialesSet = new Map(); const plazosSet = new Set(); const teasSet = new Set();
        const desgravamenesSet = new Set(); const inmueblesSet = new Set();

        (data || []).forEach(reg => {
            inicialesSet.set(reg.cuota_inicial, reg.comentario_inicial);
            plazosSet.add(reg.plazo_anos); teasSet.add(reg.tasa_tea);
            desgravamenesSet.add(reg.seguro_desgravamen_mensual); inmueblesSet.add(reg.seguro_inmueble_mensual);
        });

        inicialesSet.forEach((comentario, valor) => {
            const opt = document.createElement('option'); opt.value = valor;
            opt.innerText = `\${(valor * 100).toFixed(0)}%`; opt.dataset.comment = comentario || '';
            cInicial.appendChild(opt);
        });

        [...plazosSet].sort((a,b)=>a-b).forEach(val => {
            const opt = document.createElement('option'); opt.value = val;
            opt.innerText = `\${val} años`; cPlazo.appendChild(opt);
        });

        [...teasSet].sort((a,b)=>a-b).forEach(val => {
            const opt = document.createElement('option'); opt.value = val;
            opt.innerText = `\${(val * 100).toFixed(2)}% TEA`; cTea.appendChild(opt);
        });

        [...desgravamenesSet].sort((a,b)=>a-b).forEach(val => {

                const opt = document.createElement('option'); 
        opt.value = val;
        opt.innerText = `${(val * 100).toFixed(3)}% mensual`; 
        cDesg.appendChild(opt);
    });

    [...inmueblesSet].sort((a, b) => a - b).forEach(val => {
        const opt = document.createElement('option'); 
        opt.value = val;
        opt.innerText = `${(val * 100).toFixed(3)}% mensual`; 
        cInm.appendChild(opt);
    });

    ejecutarRecalculoHipoteca();

    } catch (err) {
        console.error("Error cargando selectores hipotecarios:", err.message);
    }

    await inyectarPropiedadesCercanasZillow(prop);
    inyectarMapaYEscuelasZillow(prop);
}
async function inyectarPropiedadesCercanasZillow(prop) {
    const slotBuyability = document.getElementById('zillow-buyability-and-neighborhood-slot');
    if (!slotBuyability) return;

    let contenedorCercanas = document.getElementById('zillow-nearby-homes-container');
    if (!contenedorCercanas) {
        contenedorCercanas = document.createElement('div');
        contenedorCercanas.id = 'zillow-nearby-homes-container';
        contenedorCercanas.style.marginTop = '40px';
        slotBuyability.appendChild(contenedorCercanas);
    }

    contenedorCercanas.innerHTML = '<div id="grid-cercanas-items"></div>';
    await inyectarPropiedadesSimilaresZillow(prop);
}

async function inyectarPropiedadesSimilaresZillow(prop) {
    const slotDinamico = document.getElementById('zillow-graphs-and-history-slot');
    if (!slotDinamico) return;

    let contenedorSimilares = document.getElementById('zillow-similar-properties-carousel-slot');
    if (!contenedorSimilares) {
        contenedorSimilares = document.createElement('div');
        contenedorSimilares.id = 'zillow-similar-properties-carousel-slot';
        slotDinamico.appendChild(contenedorSimilares);
    }

    contenedorSimilares.innerHTML = '<div id="grid-similares-items"></div>';
}

function inyectarMapaYEscuelasZillow(prop) {
    const slotMapa = document.getElementById('zillow-neighborhood-slot');
    if (!slotMapa) return;

    const lat = parseFloat(prop.latitud);
    const lng = parseFloat(prop.longitud);
    if (isNaN(lat) || isNaN(lng)) return;

    slotMapa.innerHTML = '<div id="mapa-detalle-zillow-container" style="width: 100%; height: 320px;"></div>';

    setTimeout(() => {
        const mapaDiv = document.getElementById('mapa-detalle-zillow-container');
        if (!mapaDiv || typeof L === 'undefined') return;

        try {
            if (window.mapDetalleInstance) {
                window.mapDetalleInstance.remove();
            }

            const mapDetalle = L.map(mapaDiv, { 
                center: [lat, lng], 
                zoom: 15, 
                scrollWheelZoom: false 
            });

            window.mapDetalleInstance = mapDetalle;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapDetalle);
            L.marker([lat, lng]).addTo(mapDetalle);

        } catch (error) {
            console.error("SRE Error al renderizar mapa Leaflet secundario:", error);
        }
    }, 200);
}
