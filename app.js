/* jshint esversion: 11, esnext: true, devel: true, browser: true */

// ==========================================================================
// PARTE 1 DE 15: ARQUITECTURA DE CONTROL DE ESTADO GLOBAL INMUTABLE
// ==========================================================================

usuarioAutenticado = false;
correoUsuarioLogueado = "";
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
            rielCarrusel.style.transform = `translateX(-${indiceFotoActual * 100}%)`;
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
    precioTexto.textContent = prop.precio_base ? `$/${Number(prop.precio_base).toLocaleString('en-US')}` : 'Precio no disponible';

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
    ubicacionTexto.textContent = prop?.direccion ? `${prop.direccion} (${prop?.distrito || ''})` : (prop?.titulo || "");

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
                checkboxesTipo.forEach(cb => state.filtros.tiposPropiedad.add(cb.value));
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



// ==========================================================================
// PARTE 5 DE 22: FIREWALL DE INTERACCIÓN DE SEGURIDAD (ACL)
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

// ==========================================================================
// PARTE 6 DE 22: PIPELINE DE CONSULTA DIRECTA A REST API SUPABASE

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
        }
        console.groupEnd();
        
        procesarDatosDelMotor({ propiedades, usuarios: [] });

    } catch (error) {
        console.error("? [SRE ESPÍA ERROR] Fallo en la lectura directa de Supabase REST:", error.message);
    }
}

// ==========================================================================
// PARTE 7 DE 22: MOTOR DE NORMALIZACIÓN RELACIONAL (PARTE A)
// ==========================================================================
function normalizarPropiedad(prop) {
    const id = prop.propiedad_id || String(Math.random());
    const urlBaseCloudinary = "https://cloudinary.com";
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

// ==========================================================================
// PARTE 8 DE 22: MOTOR DE NORMALIZACIÓN RELACIONAL (PARTE B)
// ==========================================================================
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
// PARTE 9 DE 22: FORMATEADORES MONETARIOS COMPACTOS
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
// PARTE 10 DE 22: CONSTRUCTOR DE RIEL MULTIMEDIA ACTIVO (CARRUSEL INLINE)
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

// ==========================================================================
// PARTE 11 DE 22: LÓGICA DE INTERACCIÓN ACL Y BOTONES DEL CARRUSEL
// ==========================================================================
    contenedorFoto.style.position = 'relative';
    const botonCorazon = document.createElement('button');
    botonCorazon.innerHTML = '♡'; 
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
    botonCorazon.style.zIndex = "10";
    botonCorazon.style.color = "#fff";

    botonCorazon.addEventListener('pointerdown', (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (typeof verificarAutorizacionAcceso === "function" && !verificarAutorizacionAcceso()) return;
        if (botonCorazon.innerHTML === '♡') {
            botonCorazon.innerHTML = '♥'; 
            botonCorazon.style.color = '#d92323'; 
            botonCorazon.style.background = 'rgba(255, 255, 255, 0.95)';
        } else {
            botonCorazon.innerHTML = '♡'; 
            botonCorazon.style.color = '#ffffff'; 
            botonCorazon.style.background = 'rgba(0, 0, 0, 0.45)';
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
            rielCarrusel.style.transform = `translateX(-${indiceFotoActual * 100}%)`;
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

// ==========================================================================
// PARTE 12 DE 22: FÁBRICA COMPONENTE TARJETA CATÁLOGO (DESKTOP)
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
    datosCasa.className = 'datos-casa'; datosCasa.style.padding = '12px';
    datosCasa.addEventListener('pointerdown', clickSPAHandler);

    const precioTexto = document.createElement('div');
    precioTexto.className = 'precio'; precioTexto.style.fontSize = '18px'; 
    precioTexto.style.fontWeight = 'bold'; precioTexto.style.color = '#1e293b';
    precioTexto.textContent = prop.precio_base ? `$/${Number(prop.precio_base).toLocaleString('en-US')}` : 'Precio no disponible';
    datosCasa.appendChild(precioTexto);

    const caracteristicasTexto = document.createElement('div');
    caracteristicasTexto.className = 'caracteristicas-inmueble';
    caracteristicasTexto.textContent = `${prop.habitaciones || 0} Dorm | ${prop.banos || 0} Baños | AC: ${prop.area_construida || 0} m²`;
    datosCasa.appendChild(caracteristicasTexto);

    const ubicacionTexto = document.createElement('div');
    ubicacionTexto.className = 'ubicacion-direccion-directa';
    ubicacionTexto.textContent = prop.direccion ? `${prop.direccion} (${prop.distrito || ''})` : prop.titulo;
    datosCasa.appendChild(ubicacionTexto);

    tarjeta.appendChild(datosCasa);
    return tarjeta;
}

// ==========================================================================
// PARTE 13 DE 22: GESTIONAR RENDERIZADO DEL CATÁLOGO GRIDS
// ==========================================================================
function renderizarCatalogoTarjetas() {
    const contenedorRejilla = document.getElementById('properties-grid-target');
    if (!contenedorRejilla) return;
    contenedorRejilla.innerHTML = '';

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);
    const contador = document.getElementById('results-counter');

    if (filtradas.length === 0) {
        contenedorRejilla.innerHTML = `
            <div class="mensaje-sin-propiedades" style="padding: 60px 20px; text-align: center; width: 100%;">
                <h3>No existe este tipo de propiedades en este momento</h3>
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
// PARTE 14 DE 22: RENDERIZADOR CARTOGRÁFICO DE MARCADORES (MAPA)
// ==========================================================================
function renderizarMapaZillow() {
    if (typeof window.L === 'undefined' || !window.map || !document.getElementById('map-instance')) return;
    if (typeof window.capaMarcadores === 'undefined') window.capaMarcadores = null;
    
    if (!window.capaMarcadores) {
        window.capaMarcadores = L.layerGroup().addTo(window.map);
    } else {
        window.capaMarcadores.clearLayers();
    }

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);
    const coordenadasValidas = [];

    filtradas.forEach((p) => {
        const parsedLat = parseFloat(p.latitud);
        const parsedLng = parseFloat(p.longitud);
        if (!isNaN(parsedLat) && !isNaN(parsedLng) && isFinite(parsedLat) && isFinite(parsedLng) && parsedLat !== 0 && parsedLng !== 0) {
            coordenadasValidas.push([parsedLat, parsedLng]);
        }
    });

    if (coordenadasValidas.length > 0) {
        try { window.map.fitBounds(coordenadasValidas, { padding: 30, maxZoom: 15, animate: true }); } catch (e) {}
    }

// ==========================================================================
// PARTE 15 DE 22: EVENTO POPUP Y ADAPTACIÓN EN CAPAS MÓVILES
// ==========================================================================
    filtradas.forEach(prop => {
        const latitud = Number(prop.latitud);
        const longitud = Number(prop.longitud);
        if (!Number.isFinite(latitud) || !Number.isFinite(longitud) || latitud === 0 || longitud === 0) return;

        const precioCompacto = formatearPrecioCompacto(prop.precio_base);
        let claseColorBurbuja = prop.estado_publicacion === 'vendida' ? 'vendido-dorado' : (prop.tipo_anuncio === 'Alquiler' ? 'alquiler-naranja' : 'venta-azul');

        const iconoBurbuja = L.divIcon({
            html: `<span>${precioCompacto}</span>`,
            className: `leaflet-marker-icon map-price-pill ${claseColorBurbuja}`,
            iconSize: L.point(80, 30), iconAnchor: L.point(40, 15)
        });

        const marcador = L.marker([latitud, longitud], { icon: iconoBurbuja });
        const contenedorPopupMaster = document.createElement('div');
        contenedorPopupMaster.className = 'tarjeta-casa popup-card'; contenedorPopupMaster.style.width = '260px';
        
        const carruselPopup = construirRielCarruselComponente(prop, true);
        contenedorPopupMaster.appendChild(carruselPopup);

        const datosPopup = document.createElement('div');
        datosPopup.innerHTML = `<div class="precio" style="font-size:16px; font-weight:bold;">$${Number(prop.precio_base).toLocaleString('en-US')}</div>`;
        contenedorPopupMaster.appendChild(datosPopup);

        if (window.innerWidth > 768) {
            marcador.bindPopup(contenedorPopupMaster, { maxWidth: 300, minWidth: 260, autoPan: true, closeOnClick: false });
        }

        marcador.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            state.propiedadSeleccionadaId = prop.id;
            if (window.innerWidth <= 768) {
                const cajaFlotanteMovil = document.getElementById("tarjeta-flotante-movil-sre");
                const targetContenido = document.getElementById("target-contenido-movil-sre");
                if (cajaFlotanteMovil && targetContenido) {
                    targetContenido.innerHTML = `<strong>$${Number(prop.precio_base).toLocaleString('en-US')}</strong>`;
                    targetContenido.onclick = () => { gestionarCortinaSPA('detalle', prop); };
                    cajaFlotanteMovil.className = "tarjeta-movil-sre-visible";
                }
            }
        });
        window.capaMarcadores.addLayer(marcador);
    });
}

// ==========================================================================
// PARTE 16 DE 22: CONFIGURACIÓN ESCUCHAS DE FILTROS EN DROP-PANELS
// ==========================================================================
function inicializarEventosDeFiltros() {
    const wrappers = document.querySelectorAll('.filter-dropdown-wrapper');
    wrappers.forEach(wrapper => {
        const boton = wrapper.querySelector('.filter-btn');
        const panel = wrapper.querySelector('.dropdown-content-panel');
        if (!boton || !panel) return;

        boton.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-content-panel').forEach(p => { if (p !== panel) p.classList.remove('show'); });
            panel.classList.toggle('show'); boton.classList.toggle('active');
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-content-panel').forEach(p => p.classList.remove('show'));
    });

    const radiosTransaccion = document.querySelectorAll('input[name="transaccion"]');
    radiosTransaccion.forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.filtros.estado = e.target.value;
            ejecutarTuberiaSincronizada();
        });
    });

// ==========================================================================
// PARTE 17 DE 22: HANDLERS DE INPUT PRECIOS Y SELECTORES SEGMENTADOS
// ==========================================================================
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
    if (inputDireccionGlobal) inputDireccionGlobal.addEventListener('input', () => { ejecutarTuberiaSincronizada(); });

    configurarSegmentado('row-beds', (valor) => {
        state.filtros.camas = parseInt(valor, 10) || 0; ejecutarTuberiaSincronizada(); 
    });
    
    configurarSegmentado('row-baths', (valor) => {
        state.filtros.banos = parseFloat(valor) || 0; ejecutarTuberiaSincronizada(); 
    });
}

function configurarSegmentado(idContenedor, callback) {
    const contenedor = document.getElementById(idContenedor); 
    if (!contenedor) return;
    contenedor.addEventListener('click', (e) => {
        const botonNode = e.target.closest('.segmented-btn'); if (!botonNode) return;
        contenedor.querySelectorAll('.segmented-btn').forEach(btn => btn.classList.remove('active'));
        botonNode.classList.add('active'); callback(botonNode.getAttribute('data-val'));
    });
}

// ==========================================================================
// PARTE 18 DE 22: CONTENEDORES AUXILIARES Y POPUPS DE INTERRUPCIÓN
// ==========================================================================
function interceptarFirewallSeguridadUsuario(l, em) {}
function inicializarEventosPopups() {
    document.getElementById("btn-solicitar-tour-galeria")?.addEventListener("click", () => {
        mostrarPopupAccion("modal-tour-comercial"); 
    });
}
function mostrarPopupAccion(id) { const n = document.getElementById(id); if (n) n.style.display = "flex"; }
function cerrarPopupAccion(id) { const n = document.getElementById(id); if (n) n.style.display = "none"; }
function calcularCalendarioTresCajas() {}
function gestionarPasosModalTour(p) {}

// ==========================================================================
// PARTE 19 DE 22: TUBERÍA DE FILTRADO EXACTO (STRINGS CRUDOS DE LA BD)
// ==========================================================================
function evaluarCriteriosDeFiltrado(prop) {
    const filtroTransaccion = state.filtros.estado || "Venta";

    if (filtroTransaccion === "Venta" || filtroTransaccion === "En venta") {
        if (prop.estado_publicacion !== "disponible" || prop.tipo_anuncio !== "Venta") return false;
    }
    if (filtroTransaccion === "Alquiler" || filtroTransaccion === "Para el alquiler") {
        if (prop.estado_publicacion !== "disponible" || prop.tipo_anuncio !== "Alquiler") return false;
    }
    if (filtroTransaccion === "Vendido" || filtroTransaccion === "Vendidas") {
        if (prop.estado_publicacion !== "vendida") return false;
    }
    
    const inputDireccion = document.getElementById('search-address');
    if (inputDireccion && inputDireccion.value.trim() !== "") {
        const textoBusqueda = inputDireccion.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const direccionProp = String(prop.direccion || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (!direccionProp.includes(textoBusqueda)) return false;
    }

    if (prop.precio_base < state.filtros.precioMin || prop.precio_base > state.filtros.precioMax) return false;
    if (state.filtros.camas && (parseInt(prop.habitaciones) || 0) < state.filtros.camas) return false;
    if (state.filtros.banos && (parseFloat(prop.banos) || 0) < state.filtros.banos) return false;

    const checkboxesFisicosEnPantalla = document.querySelectorAll('.more-filter-cb');
    const checkboxesMarcados = Array.from(checkboxesFisicosEnPantalla).filter(cb => cb.checked);
    if (checkboxesMarcados.length > 0) {
        const situacionBD = String(prop.situacion_propiedad || "");
        if (!checkboxesMarcados.some(cb => String(cb.value) === situacionBD)) return false;
    }
    return true;
}

// ==========================================================================
// PARTE 20 DE 22: SINK DE SINCRONIZACIÓN Y PROCESADOR CENTRAL
// ==========================================================================
function ejecutarTuberiaSincronizada() {
    if (typeof renderizarMapaZillow === "function") renderizarMapaZillow(); 
    if (typeof renderizarCatalogoTarjetas === "function") renderizarCatalogoTarjetas(); 
}

function procesarDatosDelMotor(paqueteData) {
    if (!paqueteData || !paqueteData.propiedades) return;
    state.propiedades = paqueteData.propiedades.map(prop => {
        return typeof normalizarPropiedad === "function" ? normalizarPropiedad(prop) : prop;
    });
    ejecutarTuberiaSincronizada();
}

// ==========================================================================
// PARTE 21 DE 22: INTERFAZ SPA (DETALLE SEGUNDA PANTALLA CON EFECTO CINE)
// ==========================================================================
function gestionarCortinaSPA(tipoPantalla, prop) {
    const cortina = document.getElementById('cortina-spa');
    if (!cortina) return;
    if (tipoPantalla === 'cerrar') {
        cortina.classList.remove('cortina-activa');
        if (window.intervaloCineZillow) { clearInterval(window.intervaloCineZillow); window.intervaloCineZillow = null; }
        return;
    }

    if (tipoPantalla === 'detalle') {
        const listaFotos = prop.fotos || [];
        const fotoPrincipal = listaFotos[0] || "https://cloudinary.com";
        let miniaturasHtml = '';
        const totalMiniaturas = Math.min(listaFotos.length, 5);
        for (let i = 0; i < totalMiniaturas; i++) {
            miniaturasHtml += `<div class="miniatura-cine-item" data-idx="${i}" style="width: 50px; height: 50px; cursor: pointer;"><img src="${listaFotos[i]}" style="width: 100%; height: 100%; object-fit: cover;"></div>`;
        }

        cortina.innerHTML = `<div style="width: 100%; background: #fff;"><div style="position: relative; height: 480px;"><img id="foto-zillow-showcase-activa" src="${fotoPrincipal}" style="width:100%; height:100%; object-fit:cover; transition: opacity 0.3s;"><button id="btn-cerrar-cortina">‹</button><div style="position:absolute; bottom:20px; left:24px; display:flex; gap:10px;">${miniaturasHtml}</div></div><div id="zillow-next-sections-slot"></div></div>`;
        document.getElementById('btn-cerrar-cortina').onclick = () => gestionarCortinaSPA('cerrar');

        const nodosMiniaturas = cortina.querySelectorAll('.miniatura-cine-item');
        const imgPrincipal = document.getElementById('foto-zillow-showcase-activa');
        nodosMiniaturas.forEach(minNode => {
            minNode.addEventListener('click', () => {
                const idx = parseInt(minNode.getAttribute('data-idx'), 10);
                if (imgPrincipal && listaFotos[idx]) imgPrincipal.src = listaFotos[idx];
            });
        });

        if (window.intervaloCineZillow) clearInterval(window.intervaloCineZillow);
        let fotoActualCine = 0;
        if (listaFotos.length > 1) {
            window.intervaloCineZillow = setInterval(() => {
                fotoActualCine = (fotoActualCine + 1) % totalMiniaturas;
                if (imgPrincipal && listaFotos[fotoActualCine]) {
                    imgPrincipal.style.opacity = '0.7';
                    setTimeout(() => { imgPrincipal.src = listaFotos[fotoActualCine]; imgPrincipal.style.opacity = '1'; }, 150);
                }
            }, 4000);
        }
        if (prop && prop.propiedad_id) inyectarSeccionesAdicionalesZillow(prop);
    }
    cortina.classList.add('cortina-activa');
}

// ==========================================================================
// PARTE 22 DE 22: SECCIONES HIPOTECARIAS E INICIALIZACIÓN DEL DOM
// ==========================================================================
function inyectarSeccionesAdicionalesZillow(prop) {
    const slotDinamico = document.getElementById('zillow-next-sections-slot');
    if (!slotDinamico) return;
    slotDinamico.innerHTML = `<div id="mapa-detalle-zillow-container" style="width:100%; height:320px;"></div>`;
    
    setTimeout(() => {
        const mapaDiv = document.getElementById('mapa-detalle-zillow-container');
        if (!mapaDiv || typeof L === 'undefined') return;
        try {
            if (window.mapDetalleInstance) window.mapDetalleInstance.remove();
            const mapDetalle = L.map(mapaDiv, { center: [parseFloat(prop.latitud), parseFloat(prop.longitud)], zoom: 15, scrollWheelZoom: false });
            window.mapDetalleInstance = mapDetalle;
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapDetalle);
            L.marker([parseFloat(prop.latitud), parseFloat(prop.longitud)]).addTo(mapDetalle);
        } catch (error) {}
    }, 200);
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('map-instance') && typeof L !== 'undefined') {
        window.map = L.map('map-instance', { center: [-12.0984, -76.9692], zoom: 13, zoomControl: true });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.map);
    }
    inicializarEventosDeFiltros();
    cargarDatosDesdeSupabase();
});
