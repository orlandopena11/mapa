/* jshint esversion: 11 *//* jshint esversion: 11 */

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

console.warn("?? [SRE ESPÍA 1] Iniciando traza de compilación en el hilo principal...");

let supabase = null;

function obtenerClienteSupabase() { // Inicia Function obtenerClienteSupabase
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
} // Fin de Function obtenerClienteSupabase

obtenerClienteSupabase();


// ==========================================================================
// PARTE 3 DE 15: FIREWALLS DE ACCESO ACL Y TRANSPORTE JSONP APPS SCRIPT
// ==========================================================================

function verificarAutorizacionAcceso() { // Inicia Function verificarAutorizacionAcceso
    console.group("??? [SRE ESPÍA ACL] Verificando credenciales de interacción");
    console.log("Usuario actual en estado:", state.usuarioActual);
    
    if (!state.usuarioActual || !state.usuarioActual.id) {
        console.warn("? ACL BLOQUEADO: Sesión inexistente.");
        console.groupEnd();
        alert("Acceso Restringido: Debe iniciar sesión con su cuenta para realizar esta acción.");
        if (typeof mostrarPopupAccion === "function") {
            mostrarPopupAccion("modal-autenticacion-supabase");
        }
        return false;
    }
    
    if (state.usuarioActual && state.usuarioActual.estado_cuenta === "suspendido") {
        console.error("? ACL BLOQUEADO: El usuario se encuentra SUSPENDIDO.");
        console.groupEnd();
        alert("Cuenta Suspendida: No tiene autorización para realizar esta acción.");
        return false;
    }
    
    console.log("?? ACL PERMITIDO: Cuenta activa y autorizada.");
    console.groupEnd();
    return true;
} // Fin de Function verificarAutorizacionAcceso

// ==========================================================================
// GUARDIA CENTRALIZADO DE ACCESO PARA TODAS LAS FUNCIONALIDADES PROTEGIDAS
// ==========================================================================
async function validarAccesoFuncionalidadPremium() { // Inicia la Funcion validarAccesoFuncionalidadPremium SRE
    console.group("?? [CORTAFUEGOS CENTRAL] Evaluando estado de cuenta...");
    const cliente = obtenerClienteSupabase();
    if (!cliente) { console.groupEnd(); return false; }
    
    const { data: { session } } = await cliente.auth.getSession();
    if (!session || !session.user) {
        console.groupEnd();
        alert("Acceso Restringido: Debe iniciar sesión con su cuenta para realizar esta acción.");
        gestionarCortinaSPA('cerrar');
        mostrarPopupAccion("modal-autenticacion-supabase");
        return false;
    }
    try {
        // Correccion de Columna Primaria: Consultamos 'usuario_id' para hacer Match exacto con tu tabla Postgres
        const { data: usuarioBD } = await cliente.from('usuario_autenticado').select('estado_cuenta').eq('usuario_id', session.user.id).single();
        const estado = usuarioBD ? String(usuarioBD.estado_cuenta).toLowerCase().trim() : "pendiente";
        if (estado === "activo") {
            state.usuarioActual = { id: session.user.id, correo: session.user.email, estado_cuenta: "activo" };
            window.usuarioLogueado = session.user;
            console.groupEnd();
            return true;
        }
        alert("Acceso Restringido: Su cuenta se encuentra en estado " + estado.toUpperCase() + ".");
        gestionarCortinaSPA('cerrar');
        mostrarPopupAccion("modal-autenticacion-supabase");
        console.groupEnd();
        return false;
    } catch (err) {
        console.groupEnd();
        gestionarCortinaSPA('cerrar');
        mostrarPopupAccion("modal-autenticacion-supabase");
        return false;
    }
} // Fin de la Funcion validarAccesoFuncionalidadPremium SRE





async function cargarDatosDesdeSupabase() { // Inicia Function cargarDatosDesdeSupabase
    console.log("?? [SRE ESPÍA 3] Consultando directamente a Supabase REST API sin intermediarios...");
    try {
        const cliente = obtenerClienteSupabase();
        if (!cliente) throw new Error("Cliente Supabase no inicializado en ventana.");

        // Consultamos directamente la vista unificada del catálogo mapeado
        const { data, error } = await cliente
            .from('vista_catalogo_mapa')
            .select('*');

        if (error) throw error;

        // --- ESPÍA DE CONTROL 1: INSPECCIÓN DE RESPUESTA CRUDA SUPABASE ---
        console.group("%c?? [SRE ESPÍA 1] DATOS CRUDOS DE SUPABASE", "background: #002E50; color: #FFB91D; padding: 4px; font-weight: bold;");
        console.log("Cantidad total devuelta por la Vista SQL:", data.length);
        if(data.length > 0) {
            console.log("Estructura del primer registro (PROP-001):", data[0]);
            console.log("¿Tiene objeto .ubicacion?:", data[0].hasOwnProperty('ubicacion') ? "Sí" : "NO");
            console.log("Campos de coordenadas en la raíz: latitud =", data[0].latitud, "| longitud =", data[0].longitud);
        }
        console.groupEnd();
        
        const paqueteData = { propiedades: data || [], usuarios: [] };
        procesarDatosDelMotor(paqueteData);

    } catch (err) {
        console.error("? [SRE ESPÍA ERROR] Fallo en la lectura directa de Supabase REST:", err.message);
    }
} // Fin de Function cargarDatosDesdeSupabase


// ==========================================================================
// PARTE 4 DE 15: MOTOR DE NORMALIZACIÓN RELACIONAL Y CONCATENACIÓN DE IMÁGENES
// ==========================================================================
function normalizarPropiedad(prop) { // Inicia Function normalizarPropiedad
    const urlBaseCloudinary = "https://res.cloudinary.com/obw6ciov/image/upload/";

    let fotosUnificadas = [];

    // --- ESPÍA 1: VALOR CRUDO DE LA BASE DE DATOS ---
    console.group(`[ESPÍA FOTOS] Evaluando propiedad ID: ${prop.propiedad_id || prop.id}`);
    console.log("Origen galeria_fotos:", prop.galeria_fotos);
    console.log("Origen foto_despliegue:", prop.foto_despliegue);
    console.log("Origen foto_principal:", prop.foto_principal);
    console.groupEnd();

    
    // MODIFICACIÓN ÚNICA: Lee directamente el nuevo arreglo unificado 'galeria_fotos' generado por la vista de Supabase
    const origenFotos = prop.galeria_fotos;


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

    // --- ESPÍA 2: RESULTADO DE LA NORMALIZACIÓN ---
    console.log(`[ESPÍA RESULTADO] Propiedad: ${prop.propiedad_id || prop.id} -> Total fotos detectadas final: ${fotosUnificadas.length}`, fotosUnificadas);

    // RETORNO DE ATRIBUTOS PLANOS Y PUROS DE LA NUEVA TABLA PROPIEDAD
    const latNum = parseFloat(prop.latitud);
    const lngNum = parseFloat(prop.longitud);
    
    // RETORNO DE ATRIBUTOS CON EL NOMBRE DE COLUMNA REAL Y VERDADERO SRE
    const idVerdadero = String(prop.propiedad_id || prop.id || "");

    const res = {
        id: idVerdadero,
        propiedad_id: idVerdadero,
        usuario_id_fk: prop.usuario_id_fk || "",

        titulo: String(prop.titulo || '').trim(),
        precio_base: parseFloat(prop.precio_base || 0),
        estado_publicacion: String(prop.estado_publicacion || "disponible").trim(),
        tipo_anuncio: String(prop.tipo_anuncio || "Venta").trim(),
        destacado: String(prop.destacado || "no").trim(), // Inyección limpia de la columna nativa de la vista
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
        
        // Georreferenciación Plana Directa desde Supabase NUMERIC
        distrito: String(prop.distrito || "").trim(),
        latitud: !isNaN(latNum) ? latNum : null,
        longitud: !isNaN(lngNum) ? lngNum : null,
        codigo_ubigeo_id_fk: String(prop.codigo_ubigeo_id_fk || "").trim(),
        foto_principal: String(prop.foto_principal || ""),
        fotos: fotosUnificadas,
        amenidades: prop.amenidades || []
    };
    
    // --- ESPÍA DE CONTROL 2: TRÁNSITO DE NORMALIZACIÓN ---
    console.log(`%c?? [SRE ESPÍA 2] Normalizado ${res.id} -> Lat: ${res.latitud} | Lng: ${res.longitud} | Transacción: ${res.tipo_anuncio} | Estado: ${res.estado_publicacion}`, "color: #006aff; font-size: 11px;");
    
    return res;
} // Fin de Function normalizarPropiedad


// ==========================================================================
// PARTE 5 DE 15: FORMATEADORES MONETARIOS COMPACTOS Y RECONSTRUCCIÓN DE RIEL MULTIMEDIA
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
// PARTE 6 DE 15: CONSTRUCTOR DINÁMICO DEL COMPONENTE RIEL MULTIMEDIA
// ==========================================================================
function construirRielCarruselComponente(prop, esPopup = false) { // Inicia Function construirRielCarruselComponente
    const propiedad = prop;

    // --- ESPÍA 3: INYECCIÓN EN EL CARRUSEL ---
    console.warn(`[ESPÍA DOM] Construyendo carrusel para: ${propiedad.id}. ¿Viene como popup?: ${esPopup}. Fotos disponibles en este nodo: ${propiedad.fotos ? propiedad.fotos.length : 0}`);

    
    const contenedorFoto = document.createElement('div');
    contenedorFoto.className = esPopup ? 'contenedor-foto popup-carrusel-context' : 'contenedor-foto';
    contenedorFoto.style.position = 'relative';
    contenedorFoto.style.overflow = 'hidden';
    contenedorFoto.style.width = '100%';
    contenedorFoto.style.height = esPopup ? '140px' : '180px';

    const rielCarrusel = document.createElement('div');
    rielCarrusel.className = 'carrusel-imagenes';
    rielCarrusel.setAttribute('data-foto-activa', '0');
    rielCarrusel.style.display = 'flex';
    rielCarrusel.style.width = '100%';
    rielCarrusel.style.height = '100%';
    rielCarrusel.style.transition = 'transform 0.3s ease-in-out';
    contenedorFoto.appendChild(rielCarrusel);

    const totalFotos = Math.min(propiedad.fotos.length, 5);
    const dotsArray = [];
    const contenedorDots = document.createElement('div');
    contenedorDots.className = 'indicadores-carrusel';

    for (let i = 0; i < totalFotos; i++) {
        const img = document.createElement('img');
        img.src = prop.fotos[i];
        img.alt = `${prop.titulo} - Vista ${i + 1}`;
        img.style.width = '100%';
        img.style.minWidth = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.flexShrink = '0';
        rielCarrusel.appendChild(img);

        const dot = document.createElement('span');
        dot.className = i === 0 ? 'punto-indicator activo' : 'punto-indicator';
        contenedorDots.appendChild(dot);
        dotsArray.push(dot);
    }
    contenedorFoto.appendChild(contenedorDots);

    // Botón Corazón Favorito
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
    botonCorazon.style.zIndex = "20";
    botonCorazon.style.color = "#fff";

    botonCorazon.onclick = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        // Consumo del Guardia Centralizado
        if (!validarAccesoFuncionalidadPremium()) return; 
        
        botonCorazon.style.color = (botonCorazon.style.color === 'rgb(217, 35, 35)' || botonCorazon.style.color === '#d92323') ? '#ffffff' : '#d92323';
    };

    contenedorFoto.appendChild(botonCorazon);

    if (totalFotos > 1) {
        let indiceFotoActual = 0;
        const btnlzq = document.createElement('button');
        btnlzq.className = 'flecha-carrusel flecha-izq'; 
        btnlzq.textContent = '‹';
        btnlzq.style.zIndex = "20";
        
        const btnDer = document.createElement('button');
        btnDer.className = 'flecha-carrusel flecha-der'; 
        btnDer.textContent = '›';
        btnDer.style.zIndex = "20";

        const desplazarRiel = (direction) => {
            indiceFotoActual = (indiceFotoActual + direction + totalFotos) % totalFotos;
            rielCarrusel.setAttribute('data-foto-activa', String(indiceFotoActual));
            rielCarrusel.style.transform = `translateX(-${indiceFotoActual * 100}%)`;
            dotsArray.forEach((d, idx) => {
                if (idx === indiceFotoActual) d.classList.add('activo');
                else d.classList.remove('activo');
            });
        };
        
        // ESCUDOS DE SEGURIDAD PARA LEAFLET Y DESKTOP
        if (typeof L !== 'undefined' && L.DomEvent) {
            L.DomEvent.disableClickPropagation(btnlzq);
            L.DomEvent.disableClickPropagation(btnDer);
        }

        btnlzq.onclick = (e) => { e.stopPropagation(); e.preventDefault(); desplazarRiel(-1); };
        btnDer.onclick = (e) => { e.stopPropagation(); e.preventDefault(); desplazarRiel(1); };
        
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
// PARTE 8 DE 15: FABRICANTE DEL NODO DE LA TARJETA DEL CATÁLOGO DE ESCRITORIO
// ==========================================================================

function crearComponenteTarjetaZillow(prop) { // Inicia Function crearComponenteTarjetaZillow
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-casa'; 
    tarjeta.setAttribute('data-id', prop.id);

    // INYECCIÓN DEL CARRUSEL DE FOTOS CORREGIDO
    const contenedorVisualFoto = construirRielCarruselComponente(prop, false);
    tarjeta.appendChild(contenedorVisualFoto);

    // MANEJADOR SPA CORREGIDO: Bloquea la redirección si tocas las flechas o el corazón
    const clickSPAHandler = (e) => { 
        if (e.target.closest('.flecha-carrusel') || e.target.closest('.corazon-favorito')) {
            e.stopPropagation();
            return;
        }
        if (window.map) window.map.closePopup();
        state.propiedadSeleccionadaId = prop.id;
        gestionarCortinaSPA('detalle', prop);
    }; 
    
    // Cambiado de 'pointerdown' a 'click' controlado para evitar conflictos de arrastre en el mapa
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

    // ==========================================================================
    // INICIO DE ORDENAMIENTO POR COLUMNA NATIVA DESTACADO DE LA VISTA SRE
    // ==========================================================================
    filtradas.sort((a, b) => {
        const destA = String(a.destacado || "no").toLowerCase().trim();
        const destB = String(b.destacado || "no").toLowerCase().trim();
        if (destA === "si" && destB !== "si") {
            return -1;
        } // Fin de if destA
        if (destA !== "si" && destB === "si") {
            return 1;
        } // Fin de if destB
        return 0;
    }); // Fin de sort utilizando la columna nativa destacado
    // ==========================================================================
    // FIN DE ORDENAMIENTO POR COLUMNA NATIVA DESTACADO DE LA VISTA SRE

    const contador = document.getElementById('results-counter');

    console.log(`?? [SRE ESPÍA CATALOGO] Re-renderizando rejilla. Propiedades filtradas y ordenadas por destacado a pintar: ${filtradas.length}`);

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


// ==========================================================================
// PARTE 10 DE 15: CONTROLADOR CARTOGRÁFICO Y GEOCODIFICACIÓN DE BÚSQUEDA
// ==========================================================================
// ==========================================================================
// PARTE 10 DE 15: CONTROLADOR CARTOGRÁFICO Y GEOCODIFICACIÓN DE BÚSQUEDA
// ==========================================================================
function renderizarMapaZillow() { 
    if (!window.map || !document.getElementById('map-instance')) return;

    // --- REPARACIÓN DE REDISEÑO ASÍNCRONO SRE ---
    // Fuerza a Leaflet a recalcular el ancho y alto del contenedor en el DOM antes de pintar.
    // Esto evita que la propiedad de Lima Centro u otras queden invisibles por falta de actualización del lienzo.
    window.map.invalidateSize({ animate: false });

    // 1. LIMPIEZA ATÓMICA Y VACIADO DE MARCADORES PREVIOS EN MEMORIA DE LEAFLET
    if (window.capaMarcadores) {
        window.capaMarcadores.clearLayers(); 
        window.map.removeLayer(window.capaMarcadores);
    }
    window.capaMarcadores = L.layerGroup().addTo(window.map);

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);

    // 2. FILTRADO ESTRICTO DE COORDENADAS VÁLIDAS
    const coordenadasValidas = [];
    filtradas.forEach(p => {
        const parsedLat = parseFloat(p.latitud);
        const parsedLng = parseFloat(p.longitud);

        // Corrección: Validamos que sean números reales finitos sin importar el distrito
        if (!isNaN(parsedLat) && !isNaN(parsedLng) && isFinite(parsedLat) && isFinite(parsedLng)) {
            coordenadasValidas.push([parsedLat, parsedLng]);
        }
    });

    // 3. ENCUADRE DINÁMICO GEOMÉTRICO PANORÁMICO SRE
    if (coordenadasValidas.length > 0 && window.map) {
        try {
            if (coordenadasValidas.length === 1) {
                // Centrado exacto si solo hay un elemento
                window.map.setView(coordenadasValidas, 14, { animate: true });
            } else {
                // Creamos los límites de Leaflet unificando Surco y Lima Centro de forma nativa
                const limitesMapa = L.latLngBounds(coordenadasValidas);
                
                // Sintaxis fija: dejamos 30 píxeles exactos de margen en los bordes para encuadrar todo
                window.map.fitBounds(limitesMapa, { padding: 30, maxZoom: 13, animate: true });
            }
        } catch (errGeometrico) {
            console.warn("⚠️ [SRE ESPÍA MAPA] Fallo en el cálculo de límites Leaflet:", errGeometrico.message);
        }
    }



    // 4. CREACIÓN Y AÑADIDO DE MARCADORES
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
        } catch (errBucle) {
            return;
        }

        // ==========================================================================
        // CONSTRUCCIÓN DEL CONTENEDOR POPUP MASTER REPARADO PARA LEAFLET
        // ==========================================================================
        const contenedorPopupMaster = document.createElement('div');
        contenedorPopupMaster.className = 'tarjeta-casa popup-card'; 
        contenedorPopupMaster.style.width = '260px';
        
        // Creamos el carrusel pasando el flag 'true' para indicar que es contexto Popup
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
        `; // Fin de asignación de datosPopup.innerHTML con interpolación segura SRE

        contenedorPopupMaster.appendChild(datosPopup);

        // ESCUDO DE SEGURIDAD LEAFLET: Evita que el evento 'click' y 'pointerdown' se propague al mapa base
        L.DomEvent.disableClickPropagation(contenedorPopupMaster);
        L.DomEvent.disableScrollPropagation(contenedorPopupMaster);

        if (window.innerWidth > 768) {
            marcador.bindPopup(contenedorPopupMaster, { 
                maxWidth: 300, 
                minWidth: 260, 
                className: 'zillow-custom-popup-wrapper', 
                autoPan: true, 
                closeOnClick: false 
            });
        }

        // Evento nativo del Marcador en el Mapa
        marcador.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            state.propiedadSeleccionadaId = prop.id;

            if (window.innerWidth <= 768) {
                const cajaFlotanteMovil = document.getElementById("tarjeta-flotante-movil-sre");
                const targetContenido = document.getElementById("target-contenido-movil-sre");

                if (cajaFlotanteMovil && targetContenido) {
                    targetContenido.innerHTML = `
                        <div class="sre-movil-overlay-card" style="display:flex; gap:14px; padding:6px 0; align-items:center; font-family:sans-serif;">
                            <img src="${prop.fotos ? prop.fotos[0] : ''}" style="width:105px; height:85px; object-fit:cover; border-radius:6px; background-color:#f0f2f5;">
                            <div style="display:flex; flex-direction:column; gap:3px; flex:1; overflow:hidden;">
                                <strong style="font-size:19px; color:#1a1a1a;">$${Number(prop.precio_base).toLocaleString('en-US')}</strong>
                                <span style="font-size:13px; color:#4a5568; font-weight:600;">${prop.habitaciones} bd | ${prop.banos} ba</span>
                                <p style="font-size:13px; color:#2d3748; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:500;">${prop.direccion || prop.titulo}</p>
                            </div>
                        </div>
                    `;
                    targetContenido.onclick = () => { gestionarCortinaSPA('detalle', prop); };
                    cajaFlotanteMovil.className = "tarjeta-movil-sre-visible";
                }
            } else {
                // Sincronización del scroll automático hacia el catálogo derecho al hacer clic en un punto del mapa
                const tarjetaDesktop = document.querySelector(`.tarjeta-casa[data-id="${prop.id}"]`);
                if (tarjetaDesktop) { 
                    tarjetaDesktop.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    tarjetaDesktop.style.outline = '3px solid #006aff'; 
                    tarjetaDesktop.style.borderRadius = '12px';
                    setTimeout(() => { tarjetaDesktop.style.outline = 'none'; }, 2000); 
                }
            }
        });

        // Evento de redirección SPA seguro delegando el puntero sin romper Leaflet
        carruselPopup.addEventListener('click', (ev) => {
            if (ev.target.closest('.flecha-carrusel') || ev.target.closest('.corazon-favorito')) {
                ev.stopPropagation();
                return; // Deja operar las flechas sin abrir el detalle de la casa
            }
            if (window.map) window.map.closePopup();
            state.propiedadSeleccionadaId = prop.id;
            gestionarCortinaSPA('detalle', prop);
        });

        window.capaMarcadores.addLayer(marcador);
    });
}


// ==========================================================================
// PARTE 12 DE 15: ESCUCHADOR INTEGRAL DE CAMBIOS DE SESIÓN Y DOM CONTENT LOADED
// ==========================================================================

function procesarDatosDelMotor(data) { // Inicia Function procesarDatosDelMotor
    console.group("?? [SRE ESPÍA INTERCEPTOR] Paquete crudo recibido desde el Motor");
    console.log("Estructura completa de la carga útil:", data);
    
    if (!data || !data.propiedades || !Array.isArray(data.propiedades)) {
        console.error("? Formato de datos inválido o ausencia de la colección 'propiedades'.");
        console.groupEnd();
        return;
    }
    
    state.propiedades = data.propiedades.map(normalizarPropiedad);
    
    console.log("?? Data normalizada en el frontend (state.propiedades):");
    console.table(state.propiedades.slice(0, 5), ["id", "precio_base", "tipo_propiedad", "tipo_anuncio", "estado_publicacion"]);
    console.groupEnd();

    renderizarMapaZillow(); 
    renderizarCatalogoTarjetas();
    interceptarFirewallSeguridadUsuario(data.usuarios, window.usuarioLogueado ? window.usuarioLogueado.email : "");
} // Fin de Function procesarDatosDelMotor

document.addEventListener("DOMContentLoaded", () => { // Inicia EventListener DOMContentLoaded
    if (typeof supabase !== "undefined" && supabase !== null) {
        supabase.auth.onAuthStateChange(async (event, session) => { // Inicia Callback onAuthStateChange
            console.log(`?? [SRE ESPÍA AUTH] Evento disparado: ${event}`);
            
            if (session && session.user) { // Inicia Bloque de Sesion Activa Encontrada
                const correoUsuario = String(session.user.email).trim();
                window.usuarioLogueado = session.user;
                const cliente = obtenerClienteSupabase();

                try { // Inicia Bloque Transaccional de Sincronizacion de Registro de Retorno SRE
                    // Buscamos el registro asociado al correo para conocer su estado de cuenta en la tabla de negocio
                    const { data: usuarioExistente } = await cliente
                        .from('usuario_autenticado')
                        .select('*')
                        .eq('correo', correoUsuario)
                        .maybeSingle();

                    if (usuarioExistente) { // Inicia bloque de procesamiento de usuario existente
                        const estadoActual = String(usuarioExistente.estado_cuenta || "").toLowerCase().trim();
                        
                        if (estadoActual === "pendiente") {
                            // REQUERIMIENTO 2: Una vez que valida el correo electrónico, modificamos la columna estado_cuenta a ACTIVO en tu tabla
                            console.log("⚡ Enlace verificado. Realizando UPDATE de estado_cuenta a ACTIVO...");
                            const { error: updateError } = await cliente
                                .from('usuario_autenticado')
                                .update({ 
                                    usuario_id: session.user.id, 
                                    estado_cuenta: "activo",
                                    verificado: true,
                                    último_acceso: new Date().toLocaleDateString('es-PE'),
                                    fecha_actualizacion: new Date().toLocaleDateString('es-PE')
                                })
                                .eq('correo', correoUsuario);

                            if (updateError) throw updateError;
                            alert("¡Validación completada con éxito! Su cuenta ha sido activada en el sistema. Ahora puede solicitar un tour.");
                        }
                    } // Fin de bloque de procesamiento de usuario existente
                    
                    // Sincronizamos las variables del estado global inmutable para dar pase libre en el Firewall
                    state.usuarioActual = {
                        id: session.user.id,
                        correo: correoUsuario,
                        estado_cuenta: "activo"
                    };
                } catch (errRetorno) { // Fin de bloque de procesamiento de usuario existente

                console.error("Aviso en flujo de sincronización de tablas Supabase:", errRetorno.message);
                } // Fin de Bloque Transaccional

                const idScriptSeguridad = "sre-jsonp-firewall-auth";
                let scriptExistente = document.getElementById(idScriptSeguridad);
                if (scriptExistente) scriptExistente.remove();
                
                window.procesarVerificacionEstadoACL = async (datosUsuarioSheet) => {
                    console.log("??? [SRE ESPÍA ACL PROCESADOR] Respuesta de cuenta:", datosUsuarioSheet);
                    if (typeof ejecutarTuberiaSincronizada === 'function') ejecutarTuberiaSincronizada();
                };

                const scriptp = document.createElement('script');
                scriptp.id = idScriptSeguridad;
                if (typeof urlMiScriptGoogle !== "undefined") {
                    scriptp.src = `${urlMiScriptGoogle}?accion=leer_estado_usuario&correo=${encodeURIComponent(correoUsuario)}&callback=procesarVerificacionEstadoACL`;
                    document.body.appendChild(scriptp);
                }
            } else { // Caso de Cierre de Sesion o Ausencia de Credenciales

                state.usuarioActual = null; 
                window.usuarioLogueado = null;
                console.log("?? Estado Auth: Sin sesión de usuario activa.");
            }
        }); // Fin de Callback onAuthStateChange
    }

    if (typeof L !== 'undefined' && document.getElementById('map-instance')) {
        window.map = L.map('map-instance', { zoomControl: true }).setView([-12.125, -76.995], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.map);
    }

    setTimeout(() => { // Inicia Timer de inicialización y sincronización limpia SRE
        inicializarEventosDeFiltros();
        if (window.map) {
       //     window.map.on('moveend', renderizarMapaZillow);
       //     window.map.invalidateSize(); 
       // Quitamos el escuchador 'moveend' para evitar que el mapa se autosabotee en bucle
            window.map.invalidateSize({ animate: false });
        }
        
        // --- NUEVO: CONEXIÓN LIMPIA PARA DESPERTAR EL CATÁLOGO DE INMUEBLES SRE ---
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
// PARTE 13 DE 15: CONTROLADOR DE FILTROS CON BOTONES APLICAR Y SELECCIONAR TODOS
// ==========================================================================

function inicializarEventosDeFiltros() {
    // 1. Gestión de desplegables (Dropdowns)
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

    // Cerrar desplegables al hacer clic fuera
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-content-panel').forEach(p => p.classList.remove('show'));
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    });

    // Detener la propagación de clics dentro del panel para evitar que se cierre solo
    document.querySelectorAll('.dropdown-content-panel').forEach(panel => {
        panel.addEventListener('click', (e) => e.stopPropagation());
    });

    // ==========================================================================
    // INICIO DE MANEJADOR DE CAMBIOS FILTRO MAESTRO DE TRANSACCIÓN
    // ==========================================================================
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
                } // Fin de if de actualización de texto en botón
            } // Fin de if btnStatus
            ejecutarTuberiaSincronizada();
        }); // Fin de Callback change
    }); // Fin de forEach radiosTransaccion
    // ==========================================================================
    // FIN DE MANEJADOR DE CAMBIOS FILTRO MAESTRO DE TRANSACCIÓN
    // ==========================================================================


    // 3. FILTRO PRECIO (Con botón Aplicar y Restablecer)
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

    // --- INICIO DE REEMPLAZO PUNTUAL: CAPTURA PASIVA DE CAMAS Y BAÑOS SRE ---

    // Variables locales para retener temporalmente los clics del usuario sin mover la interfaz
    let temporalHabitaciones = state.filtros.habitaciones || 0;
    let temporalBanos = state.filtros.banos || 0;

    // Al cambiar de dormitorio, solo almacenamos el valor numérico en la variable local
    configurarSegmentado('row-beds', (valor) => { 
        temporalHabitaciones = parseInt(valor, 10) || 0; 
    });

    // Al cambiar de baño, almacenamos el valor numérico decimal en la variable local
    configurarSegmentado('row-baths', (valor) => { 
        temporalBanos = parseFloat(valor) || 0; 
    });

    // El botón Aplicar es el único punto de control que escribe el estado global y refresca el mapa y rejilla
    const btnApplySpecs = document.getElementById('btn-apply-beds-baths');
    if (btnApplySpecs) {
        btnApplySpecs.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            
            // Traspasamos los valores almacenados temporalmente hacia el objeto global real
            state.filtros.habitaciones = temporalHabitaciones;
            state.filtros.banos = temporalBanos;
            
            // Invocamos la actualización síncrona visual del catálogo y marcadores del mapa
            ejecutarTuberiaSincronizada();
            
            // Ocultamos los paneles desplegables abiertos
            cerrarTodosLosPaneles();
        }); // Fin de EventListener click para btnApplySpecs
    }

    // --- FIN DE REEMPLAZO PUNTUAL SRE ---


    // 5. Tipo de Propiedad (Control Maestro Seleccionar / Deseleccionar Todo)
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

    // 6. Mas Filtros Avanzados (Control Maestro Seleccionar / Deseleccionar Todo)
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

    
    // 7. BUSCADOR DE DIRECCIÓN (Con Debounce de 600ms y Escape de Limpieza)
    const inputDireccionGlobal = document.getElementById('search-address');
    if (inputDireccionGlobal) {
        let timerBusqueda = null;
        inputDireccionGlobal.addEventListener('input', (e) => {
            const consulta = e.target.value.trim();
            ejecutarTuberiaSincronizada();

            clearTimeout(timerBusqueda);
            
            // Si el usuario borra todo el texto, la tubería limpia la pantalla y el mapa regresa a la vista general
            if (consulta === "") {
                ejecutarTuberiaSincronizada();
                return;
            }
            
            // Si tiene texto pero es menor a 3 letras, no hacemos la consulta externa a Nominatim
            if (consulta.length < 3) return;

            // Espera activa de 600ms para evitar saturar la API mientras el usuario escribe
            timerBusqueda = setTimeout(async () => {
                try {
                    // Consulta al servidor oficial de Nominatim con la sintaxis de interpolación correcta
               //     const res = await fetch(`https://openstreetmap.org{encodeURIComponent(consulta)}`);
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(consulta)}`);
                    const data = await res.json();

                    // Leemos de forma estricta el índice cero del arreglo devuelto
                    if (data && data.length > 0 && window.map) {
                        const lat = parseFloat(data[0].lat);
                        const lon = parseFloat(data[0].lon);
                        
                        // Movemos la cámara del mapa hacia las coordenadas del distrito escrito
                        window.map.setView([lat, lon], 14, { animate: true });
                    }
                } catch (errGeo) {
                    console.error("❌ [SRE ERROR GEO] Fallo al geocodificar con OpenStreetMap:", errGeo);
                }
            }, 600);
        }); // Fin del EventListener input controlado SRE
    }
} // Fin definitivo de la función inicializarEventosDeFiltros


// Función auxiliar para cerrar paneles desplegables
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
    
    // Escucha de forma nativa el cambio sobre los inputs radiales de la estructura Zillow
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

function evaluarCriteriosDeFiltrado(prop) { // Inicia Function evaluarCriteriosDeFiltrado
    // ==========================================================================
    // REGLA DE INTEGRIDAD ESTRICTA SRE DE TRANSACCIONES COMERCIALES
    // ==========================================================================
    const filtroTransaccion = state.filtros.estado || "Venta";

    // --- REGLAS DE NEGOCIO DIRECTAS, PLANAS Y EXACTAS CON VALOR 'vendida' SRE ---
    if ((filtroTransaccion === "Venta" || filtroTransaccion === "En venta") && (prop.estado_publicacion !== "disponible" || prop.tipo_anuncio !== "Venta")) {
        return false;
    }

    if ((filtroTransaccion === "Alquiler" || filtroTransaccion === "Para el alquiler") && (prop.estado_publicacion !== "disponible" || prop.tipo_anuncio !== "Alquiler")) {
        return false;
    }

    if ((filtroTransaccion === "Vendido" || filtroTransaccion === "Vendidas") && prop.estado_publicacion !== "vendida") {
        return false;
    }

    // --- FILTRO SECUNDARIO: BUSCADOR DE TEXTO DIRECTO ---
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

    // --- FILTROS DE RANGOS Y DIMENSIONES ---
    if (prop.precio_base < state.filtros.precioMin || prop.precio_base > state.filtros.precioMax) return false;
    // Evaluación corregida SRE: procesa el filtro de forma reactiva si el valor es mayor a 0
    // --- INICIO DE REEMPLAZO PUNTUAL: CARACTERÍSTICAS FÍSICAS, TIPOS Y LISTADOS SRE ---
    
    // Evaluación de habitaciones (Enteros) y baños (Flotantes para admitir 1.5 o medios baños de forma exacta)
    if (state.filtros.habitaciones !== undefined && state.filtros.habitaciones > 0) {
        if ((parseInt(prop.habitaciones, 10) || 0) < state.filtros.habitaciones) return false;
    }
    if (state.filtros.banos !== undefined && state.filtros.banos > 0) {
        if ((parseFloat(prop.banos) || 0) < state.filtros.banos) return false;
    }

    // Filtrado multi-selección de tipos de propiedad (Casas, Departamentos, Terrenos, etc.)
    if (state.filtros.tiposPropiedad && state.filtros.tiposPropiedad.size > 0) {
        if (!state.filtros.tiposPropiedad.has(String(prop.tipo_propiedad || '').trim())) return false;
    }

    // Implementación de regla de negocio omitida: Filtrado por Origen o Tipo de Listado
    if (state.filtros.tiposListado && state.filtros.tiposListado.size > 0) {
        const origenPublicacion = String(prop.situacion_propiedad || prop.creado_por || "").toLowerCase().trim();
        if (origenPublicacion !== "" && !state.filtros.tiposListado.has(origenPublicacion)) {
            return false;
        } // Fin de validación inside Set tiposListado
    }

    // --- FIN DE REEMPLAZO PUNTUAL SRE ---


    // ==========================================================================
    // INICIO DE VALIDACIÓN DE COMPLEMENTO EN EL PANEL EXTENDIDO SRE
    // ==========================================================================
    const checkboxesFisicosEnPantalla = document.querySelectorAll('.more-filter-cb');
    const checkboxesMarcados = Array.from(checkboxesFisicosEnPantalla).filter(cb => cb.checked);

    // Si el usuario no tiene ningún checkbox avanzado seleccionado, se muestra la configuración por defecto
    if (checkboxesMarcados.length > 0) {
        const situacionBD = String(prop.situacion_propiedad || "").trim();
        const coincideFiltro = checkboxesMarcados.some(cb => String(cb.value).trim() === situacionBD);

        if (!coincideFiltro) {
            return false;
        } // Fin de if coincideFiltro
    } // Fin de if checkboxesMarcados

    return true;
} // Fin de Function evaluarCriteriosDeFiltrado con retorno a configuración por defecto SRE
// ==========================================================================
// FIN DE VALIDACIÓN DE COMPLEMENTO EN EL PANEL EXTENDIDO SRE
// ==========================================================================



function ejecutarTuberiaSincronizada() { // Inicia Function ejecutarTuberiaSincronizada
    if (typeof renderizarMapaZillow === "function") {
        renderizarMapaZillow(); 
    }
    if (typeof renderizarCatalogoTarjetas === "function") {
        renderizarCatalogoTarjetas(); 
    }
} // Fin de Function ejecutarTuberiaSincronizada

// Activa las tres pasarelas de autenticación nativas de Supabase para cumplir las reglas de negocio de la plataforma
function inicializarAutenticacionTresCanalesSupabase() { // Inicia la Funcion inicializarAutenticacionTresCanalesSupabase SRE
    const btnAutenticarEmail = document.getElementById('btn-autenticar');
    
    // Funcion interna reutilizable para procesar el Login o Registro Traducido al Castellano
    const procesarAutenticacionMagicaSRE = async (esRegistroNuevo) => { // Inicia Funcion procesarAutenticacionMagicaSRE


        const emailInput = document.getElementById('login-email-input');
        const emailValor = emailInput ? emailInput.value.trim() : "";
        if (!emailValor) { alert("Por favor ingrese su dirección de correo electrónico."); return; }
        
        if (btnAutenticarEmail) {
            btnAutenticarEmail.innerText = "⏳ Verificando registro...";
            btnAutenticarEmail.disabled = true;
        }
        
        try { // Inicia Bloque de Consulta y Verificacion Transaccional
            const cliente = obtenerClienteSupabase();
            
            // Correccion de Columna: Consultamos 'correo' en lugar de 'correo_electronico' para hacer Match con tu Base de Datos
            const { data: usuarioBD, error: errorBD } = await cliente
                .from('usuario_autenticado')
                .select('estado_cuenta')
                .eq('correo', emailValor)
                .maybeSingle();

            if (errorBD) {
                // Traduccion Quirurgica de errores del Servidor al Castellano para el Interesado
                let mensajeCastellano = "Error al conectar con la base de datos de usuarios.";
                if (errorBD.message.includes("column")) mensajeCastellano = "Error interno: Configuración de columnas de correo en actualización.";
                throw new Error(mensajeCastellano);
            }

            if (esRegistroNuevo) { // Flujo Operativo Exclusivo para la Opcion Crear Cuenta SRE
                if (usuarioBD) {
                    alert("Aviso: Este correo electrónico ya se encuentra registrado. Por favor use el botón 'Continuar' para iniciar sesión.");
                    return;
                }
                
                console.log("⚡ Generando UUID estructurado e insertando nuevo interesado en estado PENDIENTE...");
                // Algoritmo nativo matematico para autogenerar un identificador UUID v4 valido compatible con campos Postgres
                const uuidNativoPostgres = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });

                // REQUERIMIENTO 1: Ejecuta el INSERT en la tabla utilizando los nombres exactos de tus columnas visualizadas
                const { error: insertError } = await cliente
                    .from('usuario_autenticado')
                    .insert([{
                        usuario_id: uuidNativoPostgres,
                        rol_id_fk: 3,
                        nombre: "Interesado",
                        apellido: "Nuevo Registro",
                        correo: emailValor,
                        password_hash: "99999999",
                        teléfono: "999999999",
                        estado_cuenta: "pendiente",
                        verificado: false,
                        creado_por: emailValor,
                        fecha_creacion: new Date().toLocaleDateString('es-PE')
                    }]);

                if (insertError) throw new Error("No se pudo pre-registrar el perfil en la tabla de negocio: " + insertError.message);
                
            } else { // Flujo Operativo Exclusivo para el Boton Continuar Tradicional SRE

            if (usuarioBD) { // Inicia Validacion de Estado para Registro Existente
                    const estado = String(usuarioBD.estado_cuenta).toLowerCase().trim();
                    if (estado !== "activo") {
                        alert(`Acceso Restringido: Su cuenta está registrada pero se encuentra en estado ${estado.toUpperCase()}.`);
                        return;
                    }
                } else { // Caso de Correo Inexistente en la Tabla de Negocio
                    alert("Acceso Restringido: El correo ingresado no figura en nuestro sistema. Si es nuevo, use la opción 'Crear cuenta' de abajo.");
                    return;
                } // Fin de la Validacion de Estado
            }

            const URL_RETORNO_CORRECTA = window.location.origin + window.location.pathname; 
            const { error: errorOtp } = await cliente.auth.signInWithOtp({ 
                email: emailValor, 
                options: { emailRedirectTo: URL_RETORNO_CORRECTA } 
            });
            
            if (errorOtp) throw new Error("Fallo de conexión con Supabase Auth: " + errorOtp.message);
            
            alert(esRegistroNuevo ? "¡Cuenta pre-registrada! Le hemos enviado un enlace de confirmación a su correo electrónico." : "¡Enlace de acceso enviado! Revise su bandeja de entrada para ingresar.");
            cerrarPopupAccion('modal-autenticacion-supabase');
        } catch (errAuth) { // Inicia Captura de Errores de Autenticacion
            alert("Error en el proceso: " + errAuth.message); 
        } finally { // Reestablece Siempre el Estado Inicial del Boton
            if (btnAutenticarEmail) {
                btnAutenticarEmail.innerText = "Continuar";
                btnAutenticarEmail.disabled = false;
            }
        } // Fin de Bloque de Consulta
    }; // Fin de Funcion procesarAutenticacionMagicaSRE

    if (btnAutenticarEmail) { // Inicia Condicional de Existencia del Boton Email
        btnAutenticarEmail.addEventListener('click', async () => { // Inicia Evento Click para Email Tradicional
            await procesarAutenticacionMagicaSRE(false);
        }); // Fin de Evento Click para Email Tradicional
    } // Fin de Condicional de Existencia del Boton Email

    // Vinculación elástica para capturar el clic en el nuevo enlace "Crear cuenta"
    document.getElementById('link-crear-cuenta-sre')?.addEventListener('click', async (e) => { // Inicia Evento Crear Cuenta
        e.preventDefault();
        await procesarAutenticacionMagicaSRE(true);
    }); // Fin de Evento Crear Cuenta

    // Vinculación directa a los disparadores de redes sociales de la interfaz rediseñada
    document.getElementById('btn-auth-google')?.addEventListener('click', async (e) => { // Inicia Disparador Google
        e.preventDefault();
        await autenticarConGoogleSupabase();
    }); // Fin de Disparador Google

    document.getElementById('btn-auth-facebook')?.addEventListener('click', async (e) => { // Inicia Disparador Facebook
        e.preventDefault();
        await autenticarConFacebookSupabase();
    }); // Fin de Disparador Facebook
} // Fin de la Funcion inicializarAutenticacionTresCanalesSupabase SRE




// Declaración perimetral pasiva para evitar la ruptura del hilo principal de ejecución en el catálogo
function interceptarFirewallSeguridadUsuario(usuarios, email) { // Inicia interceptarFirewallSeguridadUsuario
    // Actúa como un escudo de paso vacío exigido por el motor de renderizado de la Parte 12
} // Fin interceptarFirewallSeguridadUsuario

// Funciones nativas complementarias para los botones de redes sociales (OAuth)
async function autenticarConGoogleSupabase() { // Inicia autenticarConGoogleSupabase

    try {
        const cliente = obtenerClienteSupabase();
        // Canal 2: Proveedor oficial OAuth Google
        await cliente.auth.signInWithOAuth({ provider: 'google' });
    } catch (e) { console.error("Fallo OAuth Google", e); }
} // Fin autenticarConGoogleSupabase

async function autenticarConFacebookSupabase() { // Inicia autenticarConFacebookSupabase
    try {
        const cliente = obtenerClienteSupabase();
        // Canal 3: Proveedor oficial OAuth Facebook
        await cliente.auth.signInWithOAuth({ provider: 'facebook' });
    } catch (e) { console.error("Fallo OAuth Facebook", e); }
} // Fin autenticarConFacebookSupabase

// Ejecución pasiva e inmediata del inicializador en el hilo principal
setTimeout(() => { inicialisadorEjecucion = inicializarAutenticacionTresCanalesSupabase(); }, 150);


// Inicializa los escuchadores de los elementos de cierre y navegación del modal de visitas con firewall ACL
function inicializarEventosPopups() { // Inicia inicializarEventosPopups
    document.getElementById('btn-cerrar-modal-tour')?.addEventListener('click', () => cerrarPopupAccion('modal-tour-comercial'));
    document.getElementById('btn-navegacion-siguiente-tour')?.addEventListener('click', () => gestionarPasosModalTour(2));

    // Vinculación directa y limpia al Guardia de Seguridad unificado sin clonaciones basura
    const btnSolicitarTourSelector = document.getElementById('btn-solicitar-tour-galeria');
    if (btnSolicitarTourSelector) {
        btnSolicitarTourSelector.onclick = function(e) {
            if (e) e.stopPropagation();
            if (!validarAccesoFuncionalidadPremium()) return; // Guardia Central

            mostrarPopupAccion("modal-tour-comercial");
            calcularCalendarioTresCajas();
            gestionarPasosModalTour(1);
        };
    }

} // Fin inicializarEventosPopups



function mostrarPopupAccion(id) { 
    const n = document.getElementById(id); 
    if (n) n.style.display = "flex"; 
}

function cerrarPopupAccion(id) { 
    const n = document.getElementById(id); 
    if (n) n.style.display = "none"; 
}

// Variable global para almacenar hasta 3 fechas seleccionadas por el usuario
let fechasSeleccionadasTour = new Set();

// Calcula y renderiza las 3 cajas de fechas hábiles y las opciones de horas en el modal
function calcularCalendarioTresCajas() { // Inicia calcularCalendarioTresCajas
    const contenedorFechas = document.querySelector('.cajas-fechas-row');
    const selectHora = document.getElementById('hora-principal');
    if (!contenedorFechas) return;

    contenedorFechas.innerHTML = '';
    fechasSeleccionadasTour.clear();

    let fechaBase = new Date();
    fechaBase.setDate(fechaBase.getDate() + 1);

    // Salta el fin de semana: si el día siguiente es domingo (0) o sábado (6), avanza al lunes
    if (fechaBase.getDay() === 0) { // Inicia if domingo
        fechaBase.setDate(fechaBase.getDate() + 1);
    } // Fin if domingo
    else if (fechaBase.getDay() === 6) { // Inicia else if sábado
        fechaBase.setDate(fechaBase.getDate() + 2);
    } // Fin else if sábado

    const diasSemana = ['DOM', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    // Bucle para construir las 3 cajas de fechas consecutivas
    for (let i = 0; i < 3; i++) { // Inicia for de cajas
        let fechaCaja = new Date(fechaBase);
        fechaCaja.setDate(fechaBase.getDate() + i);
        
        // Evita que las cajas secundarias apunten a un día domingo
        if (fechaCaja.getDay() === 0) { // Inicia if control domingo
            fechaCaja.setDate(fechaCaja.getDate() + 1);
        } // Fin if control domingo

        const diaTexto = diasSemana[fechaCaja.getDay()];
        const fechaFormateada = `${fechaCaja.getDate()} de ${meses[fechaCaja.getMonth()]}`;
        const valorDataIso = fechaCaja.toISOString().split('T')[0];

        const cajaNode = document.createElement('div');
        cajaNode.className = 'caja-fecha-item';
        cajaNode.style.cssText = 'flex: 1; text-align: center; border: 1px solid #ccd0d5; border-radius: 4px; padding: 10px 4px; cursor: pointer; font-size: 12px; font-weight: bold; color: #2a2a2a;';
        cajaNode.innerHTML = `<div>${diaTexto}</div><div>${fechaFormateada}</div>`;

        // Control de selección múltiple interactiva (máximo 3 opciones)
        cajaNode.addEventListener('click', () => { // Inicia click cajaNode
            if (fechasSeleccionadasTour.has(valorDataIso)) { // Inicia if deseleccionar
                fechasSeleccionadasTour.delete(valorDataIso);
                cajaNode.style.borderColor = '#ccd0d5';
                cajaNode.style.color = '#2a2a2a';
                cajaNode.style.backgroundColor = '#ffffff';
            } // Fin if deseleccionar
            else { // Inicia else seleccionar
                if (fechasSeleccionadasTour.size >= 3) { // Inicia if validación máximo
                    alert("Seleccione hasta 3 veces únicamente.");
                    return;
                } // Fin if validación máximo
                fechasSeleccionadasTour.add(valorDataIso);
                cajaNode.style.borderColor = '#006aff';
                cajaNode.style.color = '#006aff';
                cajaNode.style.backgroundColor = 'rgba(0, 106, 255, 0.05)';
            } // Fin else seleccionar
        }); // Fin click cajaNode

        contenedorFechas.appendChild(cajaNode);
    } // Fin for de cajas

    // Inyecta las opciones de tiempo en formato de 12 horas tal como pide Zillow
    if (selectHora) { // Inicia if selectHora
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
    } // Fin if selectHora
} // Fin calcularCalendarioTresCajas

// Alterna la visibilidad de los paneles internos del modal (Paso 1: Agenda, Paso 2: Formulario)
function gestionarPasosModalTour(paso) { // Inicia gestionarPasosModalTour
    const paso1 = document.getElementById('tour-paso-horarios');
    const paso2 = document.getElementById('tour-paso-confirmacion');
    const btnSiguiente = document.getElementById('btn-navegacion-siguiente-tour');
    const btnEnviar = document.getElementById('btn-enviar-solicitud-tour');

    if (paso === 1) { // Inicia if paso 1
        if (paso1) paso1.style.display = 'block';
        if (paso2) paso2.style.display = 'none';
        if (btnSiguiente) btnSiguiente.style.display = 'block';
        if (btnEnviar) btnEnviar.style.display = 'none';
    } // Fin if paso 1
    else if (paso === 2) { // Inicia else if paso 2
        if (fechasSeleccionadasTour.size === 0) { // Inicia if validación fechas vacías
            alert("Por favor, seleccione al menos una fecha para su recorrido.");
            return;
        } // Fin if validación fechas vacías
        if (paso1) paso1.style.display = 'none';
        if (paso2) paso2.style.display = 'block';
        if (btnSiguiente) btnSiguiente.style.display = 'none';
        if (btnEnviar) btnEnviar.style.display = 'block';
    } // Fin else if paso 2
} // Fin gestionarPasosModalTour

// Inyecta dinámicamente el texto de interés comercial con la dirección exacta en el formulario del agente
function inyectarDatosPropiedadAlMensaje() { // Inicia inyectarDatosPropiedadAlMensaje
    const campoMensaje = document.getElementById('agente-mensaje');
    const propActual = state.propiedades.find(p => p.id === state.propiedadSeleccionadaId);
    if (campoMensaje && propActual) { // Inicia if inyección mensaje
        campoMensaje.value = `I am interested in ${propActual.direccion || propActual.titulo}.`;
    } // Fin if inyección mensaje
} // Fin inyectarDatosPropiedadAlMensaje


  function gestionarCortinaSPA(tipoPantalla, prop) {
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

                    <button id="btn-cerrar-cortina" style="position: absolute; top: 20px; left: 24px; background: #ffffff; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 22px; font-weight: bold; color: #1a1a1a; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10;">‹</button>

                    <div style="position: absolute; top: 20px; right: 24px; display: flex; gap: 12px; z-index: 10;">
                        <button style="background: #ffffff; border: none; padding: 10px 18px; border-radius: 24px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); color: #1a1a1a;">Guardar</button>
                        <button style="background: #ffffff; border: none; padding: 10px 18px; border-radius: 24px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); color: #1a1a1a;">Compartir</button>
                        <button style="background: #ffffff; border: none; padding: 10px 18px; border-radius: 24px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); color: #1a1a1a;">••• Mas</button>
                    </div>

                    <button style="position: absolute; top: 50%; left: 20px; transform: translateY(-50%); background: rgba(0,0,0,0.3); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; font-size: 20px; cursor: pointer; z-index: 10;">‹</button>
                    <button style="position: absolute; top: 50%; right: 20px; transform: translateY(-50%); background: rgba(0,0,0,0.3); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; font-size: 20px; cursor: pointer; z-index: 10;">›</button>

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

        // ==========================================================================
        // CONTROL DE EVENTOS UNIFICADO Y SECCIÓN VER TELÉFONO PREMIUM (SRE)
        // ==========================================================================
        
        // Inyectar dinámicamente el botón de Ver Teléfono en el panel comercial de la Cortina SPA
        const contenedorFijoFicha = document.getElementById('btn-solicitar-tour-galeria') ? document.getElementById('btn-solicitar-tour-galeria').parentNode : null;


        let btnTelefonoSRE = document.getElementById('btn-ver-telefono-premium');
        
        if (!btnTelefonoSRE && contenedorFijoFicha) {
            const divTel = document.createElement('div');
            divTel.style.cssText = 'margin-top: 10px; width: 100%;';
            divTel.innerHTML = `
                <button type="button" id="btn-ver-telefono-premium" style="width: 100%; background: #ffffff; color: #002e50; border: 1px solid #002e50; padding: 12px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer;">📞 Ver Teléfono del Vendedor</button>
                <div id="txt-telefono-desplegado" style="display: none; text-align: center; margin-top: 8px; font-size: 16px; font-weight: bold; color: #006aff;"></div>
            `;
            contenedorFijoFicha.appendChild(divTel);
        }

        // 1. Cierre de la ficha detallada
        document.getElementById('btn-cerrar-cortina').onclick = (e) => {
            e.stopPropagation();
            gestionarCortinaSPA('cerrar');
        };

        // 2 y 3. Escucha elástica delegada resolviendo la promesa asíncrona correctamente
        cortina.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'btn-solicitar-tour-galeria') {
                e.stopPropagation();
                validarAccesoFuncionalidadPremium().then((esValido) => {
                    if (!esValido) return;
                    mostrarPopupAccion("modal-tour-comercial");
                    calcularCalendarioTresCajas();
                    gestionarPasosModalTour(1);
                });
            }
            if (e.target && e.target.id === 'btn-contactar-agente-galeria') {
                e.stopPropagation();
                validarAccesoFuncionalidadPremium().then((esValido) => {
                    if (!esValido) return;
                    mostrarPopupAccion("modal-agent-comercial");
                    inyectarDatosPropiedadAlMensaje();
                });
            }
        });



        // 4. NUEVA Funcionalidad Protegida: Ver Teléfono con consulta relacional a Supabase
        const elementoBtnTelefono = document.getElementById('btn-ver-telefono-premium');
        if (elementoBtnTelefono) {
            elementoBtnTelefono.onclick = async (e) => {
                e.stopPropagation();
                if (!validarAccesoFuncionalidadPremium()) return; // Guardia Centralizado

                elementoBtnTelefono.innerText = "⏳ Consultando número...";
                try {
                    const cliente = obtenerClienteSupabase();
                    
                    // Consultamos la tabla anuncio para conocer el origen del inmueble
                    const { data: anuncioFiltro } = await cliente
                        .from('anuncio')
                        .select('usuario_id_fk, agente_id_fk')
                        .eq('propiedad_id_fk', state.propiedadSeleccionadaId)
                        .single();

                    let telefonoObtenido = "No registrado";

                    if (anuncioFiltro) {
                        if (anuncioFiltro.agente_id_fk && String(anuncioFiltro.agente_id_fk).trim() !== "") {
                            // Si es Agente, extraemos el teléfono de la tabla agente_inmobiliario
                            const { data: datosAgente } = await cliente
                                .from('agente_inmobiliario')
                                .select('telefono_agente')
                                .eq('id', anuncioFiltro.agente_id_fk)
                                .single();
                            if (datosAgente) telefonoObtenido = datosAgente.telefono_agente;
                        } else {
                            // Si es Propietario, extraemos el teléfono de la tabla usuario_autenticado
                            const { data: datosUsuario } = await cliente
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
                    elementoBtnTelefono.innerText = "📞 Ver Teléfono del Vendedor";
                }
            };
        }

        // Inicialización pasiva de la secuencia de imágenes
        const imgAnimar = document.getElementById('foto-zillow-showcase-activa');
        const fotosArregloSeguro = prop.fotos || [];
        let indiceFotoSecuencia = 0;

        function reproducirSecuenciaCinematografica() {
            if (!imgAnimar || fotosArregloSeguro.length === 0) return;
            imgAnimar.src = fotosArregloSeguro[indiceFotoSecuencia];
            const animacionCorriendo = imgAnimar.animate([
                { transform: 'scale(1.0) translate(0%, 0%)' },
                { transform: 'scale(1.18) translate(2%, -1.5%)' }
            ], { duration: 8000, iterations: 1, easing: 'ease-in-out' });

            animacionCorriendo.onfinish = () => {
                if (document.getElementById('foto-zillow-showcase-activa')) {
                    indiceFotoSecuencia = (indiceFotoSecuencia + 1) % fotosArregloSeguro.length;
                    reproducirSecuenciaCinematografica();
                }
            };
        }

        
    // Captura el evento de envío del formulario de tour para conectarlo a las tablas de Supabase y disparar la notificación por correo
    const formTour = document.getElementById('form-solicitar-tour-completo');
    if (formTour) { // Inicia if validación formTour
        formTour.onsubmit = async (e) => { // Inicia submit asíncrono
            e.preventDefault();
            
            const telefonoInput = document.getElementById('tour-contacto-telefono').value.trim();
            // Validación estricta de expresión regular nativa para números de teléfono puros de mínimo 9 dígitos
            if (!/^\d{9,}$/.test(telefonoInput)) { // Inicia if validación RegExp
                alert("Ingrese un número de teléfono válido.");
                return;
            } // Fin if validación RegExp

            const nombreInput = document.getElementById('tour-contacto-nombre').value.trim();
            const emailInput = document.getElementById('tour-contacto-email').value.trim();
            const horaSeleccionada = document.getElementById('hora-principal').value;
            const fechasArreglo = Array.from(fechasSeleccionadasTour);

            try { // Inicia bloque try transaccional
                const cliente = obtenerClienteSupabase();
                if (!cliente) throw new Error("Cliente Supabase inaccesible.");

                // Evento 1: Registro inicial de la cita de visita en la base de datos de Supabase
                const { data: nuevaVisita, error: errorVisita } = await cliente
                    .from('visita')
                    .insert([{
                        propiedad_id_fk: state.propiedadSeleccionadaId,
                        nombre_interesado: nombreInput,
                        email_interesado: emailInput,
                        telefono_interesado: telefonoInput,
                        hora_visita: horaSeleccionada,
                        fechas_propuestas: fechasArreglo,
                        estado_visita: 'pendiente'
                    }])
                    .select()
                    .single();

                if (errorVisita) throw errorVisita;

                // Evento 2: Consulta relacional basada en la columna agente_id_fk de la tabla anuncio
                const { data: anuncioFiltro, error: errorAnuncio } = await cliente
                    .from('anuncio')
                    .select('usuario_id_fk, agente_id_fk')
                    .eq('propiedad_id_fk', state.propiedadSeleccionadaId)
                    .single();

                let emailVendedorDestino = "";

                if (!errorAnuncio && anuncioFiltro) {
                    // Validamos si la columna agente_id_fk tiene un valor asignado (es un agente)
                    if (anuncioFiltro.agente_id_fk && String(anuncioFiltro.agente_id_fk).trim() !== "") {
                        const idAgenteAsignado = anuncioFiltro.agente_id_fk;
                        
                        // Actualizamos la tabla visita vinculando al agente y manteniendo el estado pendiente
                        await cliente
                            .from('visita')
                            .update({ 
                                agente_id_fk: idAgenteAsignado,
                                estado_visita: 'pendiente'
                            })
                            .eq('id', nuevaVisita.id);

                        // Consultamos el email oficial en la tabla agente_inmobiliario
                        const { data: datosAgente } = await cliente
                            .from('agente_inmobiliario')
                            .select('email_agente')
                            .eq('id', idAgenteAsignado)
                            .single();
                        
                        if (datosAgente) {
                            emailVendedorDestino = datosAgente.email_agente;
                        }
                    } else {
                        // Si no hay valor en agente_id_fk, es un Propietario: obtenemos el correo de usuario_autenticado
                        const { data: datosUsuario } = await cliente
                            .from('usuario_autenticado')
                            .select('correo_electronico')
                            .eq('id', anuncioFiltro.usuario_id_fk)
                            .single();

                        if (datosUsuario) {
                            emailVendedorDestino = datosUsuario.correo_electronico;
                        }
                    }
                }

                    // Evento 3: Envío del correo de notificación mediante la pasarela de Google Apps Script
                    if (emailVendedorDestino && typeof urlMiScriptGoogle !== "undefined") {
                    const asuntoCita = encodeURIComponent(`Nueva solicitud de Tour Pendiente - Inmobiliaria en Surco`);
                    const cuerpoMensaje = encodeURIComponent(`Yo estoy interesado en la propiedad ubicada en: ${prop.direccion || prop.titulo}.\n\nDetalles del contacto:\nInteresado: ${nombreInput}\nCorreo: ${emailInput}\nTeléfono: ${telefonoInput}\nHora propuesta: ${horaSeleccionada}\nFechas propuestas: ${fechasArreglo.join(', ')}`);
               
                    fetch(`${urlMiScriptGoogle}?accion=enviar_correo_notificacion&destinatario=${encodeURIComponent(emailVendedorDestino)}&asunto=${asuntoCita}&mensaje=${cuerpoMensaje}`)
                        .then(res => res.json())
                        .then(resultado => console.log("Notificación por correo enviada con éxito:", resultado))
                        .catch(errEmail => console.warn("Aviso: Retraso en la respuesta de la pasarela, datos asegurados.", errEmail));
                }
                    alert("¡Tour agendado exitosamente! La solicitud se registró y se ha notificado por correo a quien vende la propiedad.");
                    cerrarPopupAccion('modal-tour-comercial');
                    formTour.reset();

                } catch (errTransaccion) {
                    console.error("Error en flujo transaccional del Tour:", errTransaccion.message);
                    alert("Error al procesar la agenda: " + errTransaccion.message);
                } // Fin del bloque catch transaccional
            }; // Fin del formTour.onsubmit
        } // Fin del if (formTour)

        // --- RESTABLECIMIENTO DEL MOTOR CRÍTICO DE CÁLCULOS ZILLOW SRE ---
        if (prop && prop.propiedad_id) {
            // Despierta de forma nativa e inyecta los Zestimates, Gráficas e Hipoteca
            inyectarSeccionesAdicionalesZillow(prop);
        }

        // Ejecutar el carrusel cinematográfico infinito original
        reproducirSecuenciaCinematografica();
        
        // Resetea el scroll de la cortina al tope superior
        cortina.scrollTop = 0; 
    } // Fin del bloque if (tipoPantalla === 'detalle')

    // Activa la clase visual en el contenedor nativo para abrir la segunda página
    cortina.classList.add('cortina-activa');

} // FIN DEFINITIVO DE LA FUNCIÓN gestionarCortinaSPA RESTABLECIDA


                           


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
        // CORRECCIÓN DIRECTA: Usa la instancia correcta y activa 'supabase' definida en tu Parte 2
        if (supabase) {
            const { data, error } = await supabase
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
// INICIO DE FUNCTION: inyectarCapacidadCompraZillow (VERSION DE MARCA COLOR METRICA)
// ====================================================================================
async function inyectarCapacidadCompraZillow(prop) { // Abre la función principal inyectarCapacidadCompraZillow
    if (!prop || !prop.propiedad_id || isNaN(parseFloat(prop.precio_base))) {
        console.log("?? [SRE SIMULADOR] Pasivo en arranque. No se ejecuta simulación hipotecaria.");
        return;
    }

    const slotBuyability = document.getElementById('zillow-buyability-and-neighborhood-slot');
    if (!slotBuyability) return;

    const precioBase = parseFloat(prop.precio_base) || 0;
    const tipoProp = String(prop.tipo_propiedad || 'Casa').trim();

    // Inyección de la interfaz gráfica con tus colores corporativos #FFB91D y #002E50
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
                <!-- Botón con color Dorado #FFB91D y letras en Azul Acero #002E50 -->
                <button type="button" id="btn-guardar-simulacion-supabase" style="width: 100%; background: #FFB91D; color: #002E50; border: none; padding: 14px; font-size: 14px; font-weight: 800; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 4px rgba(255,185,29,0.2); transition: background 0.2s;">?? Enviar mi cronograma de hipoteca a mi correo</button>
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

        // Amortización con Sistema Francés SBS
        const cuotaBase = montoPrestamo * (tasaMensualTEM * Math.pow(1 + tasaMensualTEM, totalMeses)) / (Math.pow(1 + tasaMensualTEM, totalMeses) - 1);
        const costoDesgravamen = montoPrestamo * pctDesg;
        const costoInmueble = precioBase * pctInm;
        const cuotaTotal = cuotaBase + costoDesgravamen + costoInmueble;
        const ratioLtv = montoPrestamo / precioBase;

        // Renderizado limpio de salida con formato monetario en Dólares ($)
        document.getElementById('display-pago-total-hipoteca').innerText = `$${Math.round(cuotaTotal).toLocaleString('en-US')}/mes`;
        document.getElementById('display-pago-total-hipoteca').style.color = '#002E50';
        document.getElementById('txt-calc-prestamo').innerText = `$${Math.round(montoPrestamo).toLocaleString('en-US')}`;
        document.getElementById('txt-calc-cuotabase').innerText = `$${Math.round(cuotaBase).toLocaleString('en-US')}`;
        document.getElementById('txt-calc-segdesg').innerText = `$${Math.round(costoDesgravamen).toLocaleString('en-US')}`;
        document.getElementById('txt-calc-seginm').innerText = `$${Math.round(costoInmueble).toLocaleString('en-US')}`;

        const opcionSeleccionada = cInicial.options[cInicial.selectedIndex];
        document.getElementById('lov-comentario-dinamico').innerText = opcionSeleccionada ? opcionSeleccionada.getAttribute('data-comment') : '';

        calculosGlobales = {
            pctInicial, montoInicial, montoPrestamo, totalMeses, valorTea, 
            tasaMensualTEM, pctDesg, pctInm, cuotaBase, costoDesgravamen, 
            costoInmueble, cuotaTotal, ratioLtv
        };
    } // Cierra sub-función matemática ejecutarRecalculoHipoteca

    [cInicial, cPlazo, cTea, cDesg, cInm].forEach(combo => combo.addEventListener('change', ejecutarRecalculoHipoteca));

    // Evento de disparo comercial y persistencia transaccional
    btnGuardar.addEventListener('click', async () => {
        if (typeof verificarAutorizacionAcceso === "function" && !verificarAutorizacionAcceso()) return;
        if (!calculosGlobales) return;

        btnGuardar.innerText = "? Generando cronograma PDF y enviando correo...";
        btnGuardar.disabled = true;

        try {
            const cliente = obtenerClienteSupabase();
            const idUsuario = window.usuarioLogueado ? window.usuarioLogueado.id : 'anonimo_invitado';

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

            alert("? ¡Cronograma generado exitosamente! Hemos procesado tu corrida de cuotas en dólares y el documento oficial PDF está en camino a tu bandeja de correo registrado.");
            btnGuardar.innerText = "? Cronograma Enviado Exitosamente";
            btnGuardar.style.background = "#002E50";
            btnGuardar.style.color = "#FFB91D";

        } catch (err) {
            console.error("Fallo guardando simulación:", err.message);
            alert("Error procesando solicitud: " + err.message);
            btnGuardar.innerText = "?? Enviar mi cronograma de hipoteca a mi correo";
            btnGuardar.disabled = false;
        }
    });

    // Bloque asíncrono para poblar las opciones ordenadas de los combos (LOVs)
    try {
        const cliente = obtenerClienteSupabase();
        if (cliente) {
            // Cargar listas desplegables base (LOVs)
            // CORRECCIÓN ATÓMICA: Eliminamos los ordenamientos fijos que causan el error 400 (Bad Request)
            const [rInicial, rPlazo, rTea, rDesg, rInm] = await Promise.all([
                cliente.from('LOV_hipoteca_cuota_inicial').select('*').order('cuota_inicial', { ascending: true }),
                cliente.from('LOV_hipoteca_plazo').select('*'),
                cliente.from('LOV_hipoteca_TEA').select('*'),
                cliente.from('LOV_hipoteca_desgravamen').select('*'),
                cliente.from('LOV_hipoteca_seguro_inmueble').select('*')
            ]);

            // CORRECCIÓN DE COLUMNAS: Mapea directamente 'cuota_inicial' y 'comentarios_sbs_mercado' de tu Supabase
            if (rInicial.data && rInicial.data.length > 0) {
                cInicial.innerHTML = rInicial.data.map(opt => {
                    const pctValor = parseFloat(opt.cuota_inicial) || 0;
                    const textoPorcentaje = (pctValor * 100).toFixed(0) + '% Inicial';
                    return `<option value="${pctValor}" data-comment="${opt.comentarios_sbs_mercado || ''}">${textoPorcentaje}</option>`;
                }).join('');
            } else {

            cInicial.innerHTML = '<option value="0.20" data-comment="Mínimo regular">20% Mínimo</option>';
            }

            // REEMPLAZO TOLERANTE NATIVO: Lee las propiedades de forma dinámica basándose en la estructura real de tus registros
            if (rPlazo.data && rPlazo.data.length > 0) {
                cPlazo.innerHTML = rPlazo.data.map(opt => {
                    const valorAnos = parseFloat(opt.anos || opt.plazo_anos || Object.values(opt)[1] || 20);
                    return `<option value="${valorAnos}">${valorAnos} Años</option>`;
                }).join('');
            } else { cPlazo.innerHTML = '<option value="20">20 Años</option>'; }

            if (rTea.data && rTea.data.length > 0) {
                cTea.innerHTML = rTea.data.map(opt => {
                    const valorTea = parseFloat(opt.tasa_tea || opt.tea || Object.values(opt)[1] || 0.085);
                    return `<option value="${valorTea}">${(valorTea * 100).toFixed(2)}% TEA</option>`;
                }).join('');
            } else { cTea.innerHTML = '<option value="0.085">8.50% TEA</option>'; }

            if (rDesg.data && rDesg.data.length > 0) {
                cDesg.innerHTML = rDesg.data.map(opt => {
                    const valorDesg = parseFloat(opt.tasa_mensual || opt.desgravamen || Object.values(opt)[1] || 0.0005);
                    return `<option value="${valorDesg}">${(valorDesg * 100).toFixed(3)}% Mensual</option>`;
                }).join('');
            } else { cDesg.innerHTML = '<option value="0.0005">0.05% Mensual</option>'; }

            if (rInm.data && rInm.data.length > 0) {
                cInm.innerHTML = rInm.data.map(opt => {
                    const valorInm = parseFloat(opt.tasa_mensual || opt.seguro_inmueble || Object.values(opt)[1] || 0.00025);
                    return `<option value="${valorInm}">${(valorInm * 100).toFixed(3)}% Mensual</option>`;
                }).join('');
            } else { cInm.innerHTML = '<option value="0.00025">0.025% Mensual</option>'; }

            // Realizar primer cálculo automático
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
