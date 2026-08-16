// PARTE: 1-5 (ESTADO Y CONFIGURACIONES)
/**
 * ARQUITECTURA DE CONTROL DE ESTADO INMUTABLE Y CONFIGURACIÓN GLOBAL ZILLOW V2
 * Centraliza el almacenamiento y protege el flujo contra variables mutables globales.
 */

const state = {
    propiedades: [],
    favoritos: new Set(),
    filtros: {
        estado: 'Todos', // 💡 Muestra todo el universo de propiedades al arrancar de forma natural
        precioMin: 0,
        precioMax: Infinity,
        camas: 0,
        camasExactas: false,
        baños: 0,
        tiposPropiedad: new Set(['Casa', 'Apartamento'])
    },
    // Registro interno para la remoción explícita de Listeners (Garbage Collector)
    limpiadoresDOM: new Map()
};

// URL de conexión segura con el backend relacional de Google Apps Script
const urlMiScriptGoogle = "https://script.google.com/macros/s/AKfycbysc3BO4zYMXILkIcj0B83lsWkWyvzzmBag3PIZfRsQ_kltdW-koazpOzfdVfNElDJXMw/exec";

/**
 * Lector asíncrono seguro mediante inyección controlada de JSONP
 */
function cargarDatosDesdeAppsScript() {
    const script = document.createElement('script');
    script.src = `${urlMiScriptGoogle}?callback=procesarDatosDelMotor`;
    document.body.appendChild(script);
}

// ==========================================================================
// PARTE: 2-5 (NORMALIZACIÓN RELACIONAL - CONEXIÓN CON MOTOR BACKEND V2)
// ==========================================================================
function normalizarPropiedad(prop) {
    const id = prop.id || String(Math.random());
    const urlBaseCloudinary = "https://res.cloudinary.com/obw6ciov/image/upload/";

    // Helper purista interno para limpiar, quitar espacios y forzar la URL absoluta de Cloudinary
    const asegurarUrlCompleta = (ruta) => {
        if (!ruta) return "";
        
        let texto = String(ruta).trim();
        
        // Si ya viene con el enlace completo de internet (como Unsplash), la dejamos pasar intacta
        if (texto.startsWith('http://') || texto.startsWith('https://')) {
            return texto;
        }
        
        // Limpieza de arquitectura: Reemplaza espacios intermedios por guiones bajos
        texto = texto.replace(/\s+/g, '_');
        
        // Fuerza la extensión si el string no cuenta con ella
        if (!texto.toLowerCase().endsWith('.jpg') && !texto.toLowerCase().endsWith('.png') && !texto.toLowerCase().endsWith('.webp') && !texto.toLowerCase().endsWith('.jpeg')) {
            texto = texto + '.jpg';
        }
        
        // CONCATENACIÓN ABSOLUTA OBLIGATORIA: Evita que el navegador busque de forma local en GitHub Pages
        return urlBaseCloudinary + texto;
    };

    // 💡 LEER EXACTAMENTE EL ARREGLO 'fotos' QUE ENVIÓ TU NUEVO BACKEND UNIFICADO
    let fotosUnificadas = [];
    if (prop.fotos && Array.isArray(prop.fotos)) {
        fotosUnificadas = prop.fotos.map(f => asegurarUrlCompleta(f)).filter(Boolean);
    }

    // FORCE MAJEURE: Si por algún motivo el arreglo quedó vacío, forzamos tu foto de Cloudinary de respaldo
    if (fotosUnificadas.length === 0) {
        fotosUnificadas.push("https://res.cloudinary.com/obw6ciov/image/upload/Foto15_havrr3.webp");
    }

    // RETORNO CON BLINDAJE DE SEGURIDAD ABSOLUTO ACOPLADO AL JSON REAL DE TU CONSOLA
    return {
        id: String(id),
        anuncio_id: prop.anuncio_id || "",
        precio: parseFloat(prop.precio_base || 350000), // Mapeado a precio_base del backend
        estadoListado: prop.estado_publicacion || "Venta", // Mapeado a estado_publicacion del backend
        fraseDescriptiva: String(prop.titulo || 'Propiedad Premium').trim(), // Mapeado a titulo del backend
        tipoPropiedad: String(prop.tipo_propiedad || 'Casa').trim(), // Mapeado a tipo_propiedad del backend
        subtipoPropiedad: String(prop.subtipo_propiedad || '').trim(),
        fotos: fotosUnificadas, // Array purificado con URLs absolutas hacia Cloudinary listo para el carrusel
        
        // GEOLOCALIZACIÓN INTEGRAL ASIGNADA DESDE LAS LLAVES REALES DEL BACKEND
        latitud: parseFloat(prop.latitud || -12.125),
        longitud: parseFloat(prop.longitud || -76.995),
        
        // Datos técnicos del sub-objeto specs o mapeados directamente
        habitaciones: parseInt(prop.specs && prop.specs.habitaciones ? prop.specs.habitaciones : (prop.habitaciones || 3)),
        banos: parseInt(prop.specs && prop.specs.banos ? prop.specs.banos : (prop.banos || 2)),
        area_construida: parseFloat(prop.specs && prop.specs.area_construida ? prop.specs.area_construida : (prop.area_construida || 0)),
        situacion_propiedad: prop.situacion_propiedad || "",
        sotano: prop.sotano || "no",
        almacen: prop.almacen || "no",
        vista: prop.vista || "Ninguna",
        creado_por: prop.creado_por || "",
        
        // Columnas dinámicas inyectadas desde el backend
        telefono: prop.telefono || "",
        contacto_nombre: prop.contacto_nombre || "Contacto"
    };
}

function formatearPrecioCompleto(precio) {
    const num = parseFloat(precio);
    if (isNaN(num) || num === 0) return 'Consultar';
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}


// PARTE: 1-5 (EXTENSIÓN DE CONTROL DE FILTROS EN EL ESTADO)
/**
 * Modelo de datos unificado para la captura reactiva de parámetros de búsqueda.
 */
state.filtros = {
    estado: 'Venta',       // Tipo de Transacción (Radio: Venta, Alquiler, Vendido)
    precioMin: 0,          // Rango de precio mínimo
    precioMax: 1300000,    // Rango de precio máximo
    camas: 0,              // Cantidad mínima de dormitorios (0 = Cualquiera)
    camasExactas: false,   // Switch de coincidencia exacta para dormitorios
    baños: 0,              // Cantidad mínima de baños completos
    tiposPropiedad: new Set(['Casa', 'Apartamento']) // Tipos activos para el filtrado multidimensional
};




// PARTE: 2-5 (NORMALIZACIÓN RELACIONAL RESTRUCTURADA)
/**
 * REGLAS DE NEGOCIO PARA CRUCE DE TABLAS (GOOGLE SHEETS -> STATE)
 * Clasifica dinámicamente las propiedades en base a 'tipo_publicacion' y 'tipo_anuncio'.
 */
// PARTE: 2-5 (NORMALIZACIÓN RELACIONAL RESTRUCTURADA DE PRODUCCIÓN)
/**
 * REGLAS DE NEGOCIO PARA CRUCE DE TABLAS (GOOGLE SHEETS -> STATE)
 * Consume el arreglo unificado 'fotos' y el sub-objeto 'specs' directamente desde el backend.
 */
function normalizarPropiedad(prop) {
    const id = prop.id || prop.propiedad_id || String(Math.random());
    
    // 1. Extraer la galería unificada que ya viene procesada con éxito desde Código.gs
    const fotosUnicas = Array.isArray(prop.fotos) && prop.fotos.length > 0 ? prop.fotos : ['https://res.cloudinary.com/obw6ciov/image/upload/'];

    // 2. Clasificación exacta basada en las columnas de las Sheets
    let estadoZillow = 'Venta';
    const publicacion = String(prop.estado_publicacion || '').trim().toLowerCase();

    if (publicacion === 'vendida' || publicacion === 'vendido') {
        estadoZillow = 'Vendido';
    } else if (publicacion === 'alquiler') {
        estadoZillow = 'Alquiler';
    } else if (publicacion === 'venta') {
        estadoZillow = 'Venta';
    }

    // 3. Retorno simétrico inmutable acoplado al Join de tu backend relacional
    return {
        id: String(id),
        anuncio_id: String(prop.anuncio_id || ''),
        titulo: String(prop.titulo || 'Inmueble Premium').trim(),
        precio_base: parseFloat(prop.precio_base || 0),
        tipo_propiedad: String(prop.tipo_propiedad || 'Casa').trim(),
        estado_publicacion: estadoZillow, 
        fotos: fotosUnicas,
        latitud: parseFloat(prop.latitud || -12.125),
        longitud: parseFloat(prop.longitud || -76.995),
        telefono: String(prop.telefono || '').trim(),
        contacto_nombre: String(prop.contacto_nombre || 'Contacto').trim(),
        specs: {
            habitaciones: parseInt(prop.specs?.habitaciones || 3),
            banos: parseFloat(prop.specs?.banos || 2),
            area_construida: parseFloat(prop.specs?.area_construida || 120),
            sotano: String(prop.specs?.sotano || 'no'),
            almacen: String(prop.specs?.almacen || 'no'),
            vista: String(prop.specs?.vista || 'Interna')
        }
    };
}


function formatearPrecioCompacto(precio) {
    if (precio >= 1000000) return `S/. ${(precio / 1000000).toFixed(2)}M`;
    if (precio >= 1000) return `S/. ${(precio / 1000).toFixed(0)}K`;
    return `S/. ${precio}`;
}

// ==========================================================================
// PARTE: 3-5 (FÁBRICA INDESTRUCTIBLE DE MICRO-CARRUSELES CON NAVEGACIÓN EN INFINITO)
// ==========================================================================
function construirRielCarruselComponente(propiedad, esPopup = false) {
    const contenedorFoto = document.createElement('div');
    contenedorFoto.className = 'contenedor-foto';
    
    // Ajuste geométrico vertical para compactar la etiqueta dentro del mapa izquierdo
    if (esPopup) {
        contenedorFoto.style.height = '150px';
    }

    const rielCarrusel = document.createElement('div');
    rielCarrusel.className = 'carrusel-imagenes';
    
    // Consumimos directamente el array de imágenes que purificó tu nuevo backend unificado
    const fotosColeccion = propiedad.fotos && propiedad.fotos.length > 0 ? propiedad.fotos : ["Foto_1_jfz1xs.jpg"];
    const totalFotos = Math.min(fotosColeccion.length, 5);
    rielCarrusel.style.width = `${totalFotos * 100}%`;

    const urlBaseCloudinary = "https://res.cloudinary.com/obw6ciov/image/upload/";

    // Inyección nativa de las 5 imágenes en el DOM (Blindado contra XSS)
    for (let i = 0; i < totalFotos; i++) {
        const img = document.createElement('img');
        let rutaFinal = String(fotosColeccion[i]).trim();

        // Si la URL no es absoluta (no arranca con http), le soldamos el dominio de Cloudinary y la extensión
        if (!rutaFinal.startsWith('http://') && !rutaFinal.startsWith('https://')) {
            rutaFinal = rutaFinal.replace(/\s+/g, '_');
            if (!rutaFinal.toLowerCase().endsWith('.jpg') && !rutaFinal.toLowerCase().endsWith('.png') && !rutaFinal.toLowerCase().endsWith('.webp') && !rutaFinal.toLowerCase().endsWith('.jpeg')) {
                rutaFinal += ".jpg";
            }
            rutaFinal = urlBaseCloudinary + rutaFinal;
        }

        img.src = rutaFinal;
        img.alt = `${propiedad.fraseDescriptiva || 'Inmueble'} - Vista ${i + 1}`;
        img.style.width = `${100 / totalFotos}%`;
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.flexShrink = '0';
        rielCarrusel.appendChild(img);
    }
    contenedorFoto.appendChild(rielCarrusel);

    // ACTIVACIÓN AUTOMÁTICA DE FLECHAS SI EL INMUEBLE TIENE MÁS DE UNA IMAGEN EN SHEETS
    if (totalFotos > 1) {
        let indiceFotoActual = 0;

        const btnIzq = document.createElement('button');
        btnIzq.className = 'flecha-carrusel flecha-izq';
        btnIzq.textContent = '<';
        
        const btnDer = document.createElement('button');
        btnDer.className = 'flecha-carrusel flecha-der';
        btnDer.textContent = '>';

        // Aritmética Modular para prevención estricta de desbordes de índices
        const desplazarRiel = (direction) => {
            indiceFotoActual = (indiceFotoActual + direction + totalFotos) % totalFotos;
            rielCarrusel.style.transform = `translateX(-${indiceFotoActual * (100 / totalFotos)}%)`;
        };

        btnIzq.addEventListener('click', (e) => { e.stopPropagation(); desplazarRiel(-1); });
        btnDer.addEventListener('click', (e) => { e.stopPropagation(); desplazarRiel(1); });

        contenedorFoto.appendChild(btnIzq);
        contenedorFoto.appendChild(btnDer);
    }

    // Inyección de Badges de Estado en la Esquina Superior Izquierda
    if (propiedad.estadoListado && propiedad.estadoListado !== 'Todos') {
        const badge = document.createElement('span');
        badge.className = `badge badge-${propiedad.estadoListado.toLowerCase()}`;
        badge.textContent = propiedad.estadoListado;
        contenedorFoto.appendChild(badge);
    }

    // Botón Favorito de Corazón Flotante en la Esquina Superior Derecha (Inmutable)
    const botonCorazon = document.createElement('button');
    botonCorazon.className = 'corazon-favorito';
    botonCorazon.textContent = state.favoritos.has(propiedad.id) ? '♥' : '♡';

    botonCorazon.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.usuarioActual && state.usuarioActual.estado_cuenta === 'suspendido') {
            alert("Su cuenta ha sido suspendida por incumplir con las políticas de la aplicación. Por favor, contacte con soporte técnico.");
            return;
        }
        if (state.favoritos.has(propiedad.id)) {
            state.favoritos.delete(propiedad.id);
            botonCorazon.textContent = '♡';
        } else {
            state.favoritos.add(propiedad.id);
            botonCorazon.textContent = '♥';
        }
        renderizarCatálogoTarjetas();
        if (typeof renderizarMapaZillow === 'function') renderizarMapaZillow();
    });
    contenedorFoto.appendChild(botonCorazon);

    // Letrero Descriptivo Atenuado en el Pie Interno de la Foto
    if (propiedad.fraseDescriptiva) {
        const letrero = document.createElement('div');
        letrero.className = 'letrero-descriptivo';
        letrero.textContent = propiedad.fraseDescriptiva;
        contenedorFoto.appendChild(letrero);
    }

    return contenedorFoto;
}

// FÁBRICA ATÓMICA DE TARJETAS PARA EL CATÁLOGO DERECHO (SRE PRODUCTION)
function crearComponenteTarjetaZillow(propiedad) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-casa';
    tarjeta.setAttribute('data-id', propiedad.id);

    // 1. Instanciamos el viewport rígido del carrusel unificado de Cloudinary
    const contenedorVisualFoto = construirRielCarruselComponente(propiedad, false);
    tarjeta.appendChild(contenedorVisualFoto);

    // 2. Interceptor SPA inmutable hacia la Ficha de Detalle (Pantalla 2)
    const clickSPAHandler = (e) => {
        if (e.target.closest('.flecha-carrusel') || e.target.closest('.corazon-favorito')) return;
        
        // Cerramos popups activos consumiendo el estado encapsulado seguro
        if (state.mapa) state.mapa.closePopup();
        
        state.propiedadSeleccionadaId = propiedad.id;
        alternarPantallaZillow('detalle-ficha');
        renderizarFichaDetalleZillow(propiedad);
    };
    contenedorVisualFoto.addEventListener('click', clickSPAHandler);

    // 3. Bloque Inferior de Contenido de Texto Plano Puro (Blindado contra XSS)
    const datosCasa = document.createElement('div');
    datosCasa.className = 'datos-casa';

    const precioTexto = document.createElement('div');
    precioTexto.className = 'precio';
    // Mapeo simétrico en Dólares USD de acuerdo a tu Sheets real
    precioTexto.textContent = propiedad.precio_base.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    datosCasa.appendChild(precioTexto);
    
    tarjeta.appendChild(datosCasa);

    // 4. Registro en el Garbage Collector interno para evitar Memory Leaks
    state.limpiadoresDOM.set(propiedad.id, () => {
        contenedorVisualFoto.removeEventListener('click', clickSPAHandler);
    });

    return tarjeta;
}

// ==========================================================================
// PARTE: 5-5 (MOTOR DE BURBUJAS DE PRECIO DINÁMICAS NATIVAS EN MAPA)
// ==========================================================================
function renderizarMapaZillow() {
    if (typeof window.capaMarcadores === 'undefined') {
        window.capaMarcadores = null;
    }

    if (!window.map || !document.getElementById('map-instance')) return;

    if (!window.capaMarcadores) {
        window.capaMarcadores = L.layerGroup().addTo(window.map);
    } else {
        window.capaMarcadores.clearLayers();
    }

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);

    filtradas.forEach(prop => {
        if (!prop.latitud || !prop.longitud) return;

        const precioCompacto = formatearPrecioCompacto(prop.precio);
        const esNuevo = prop.estadoListado === 'Nuevo';
        const htmlBurbuja = `<span>${precioCompacto}</span>`;

        // Centrado geométrico nativo estricto mediante constructores L.point(80, 30) y L.point(40, 15)
        const iconoBurbuja = L.divIcon({
            html: htmlBurbuja,
            className: `leaflet-marker-icon map-price-pill ${esNuevo ? 'nuevo' : ''}`,
            iconSize: L.point(80, 30),
            iconAnchor: L.point(40, 15)
        });

        const marcador = L.marker([prop.latitud, prop.longitud], { icon: iconoBurbuja });

        // 1. FABRICAMOS EL CONTENEDOR MODULAR ASILADO PARA EL POPUP
        const contenedorPopupMaster = document.createElement('div');
        contenedorPopupMaster.className = 'tarjeta-casa popup-card';
        contenedorPopupMaster.style.width = '260px';

        // 2. INSTANCIAMOS EL MICRO-CARRUSEL DOBLE INTERACTIVO
        const carruselPopup = construirRielCarruselComponente(prop, true);
        contenedorPopupMaster.appendChild(carruselPopup);

        // 3. BLOQUE DE DATOS INFERIOR INTERNO DEL POPUP (BLINDADO CONTRA XSS)
        const datosPopup = document.createElement('div');
        datosPopup.className = 'datos-casa';
        datosPopup.style.padding = '8px';

        const pPrice = document.createElement('div');
        pPrice.className = 'precio';
        pPrice.style.fontSize = '16px';
        pPrice.style.fontWeight = 'bold';
        pPrice.style.color = '#002E50';
        pPrice.textContent = prop.precio.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 });
        
        datosPopup.appendChild(pPrice);
        contenedorPopupMaster.appendChild(datosPopup);

        // 4. INTERCEPTOR SPA PARA SALTAR A LA SEGUNDA PANTALLA AL HACER CLIC EN LA FOTO
        carruselPopup.addEventListener('click', (e) => {
            if (e.target.closest('.flecha-carrusel') || e.target.closest('.corazon-favorito')) return;
            window.map.closePopup();
            state.propiedadSeleccionadaId = prop.id;
            alternarPantallaZillow('detalle-ficha');
            renderizarFichaDetalleZillow(prop);
        });

        // 5. 💡 ENLAZAMOS EL POPUP DE FORMA NATIVA DIRECTA (SIN MARCADOR.ON CLICK)
        // Esto elimina la colisión de eventos y sana el error de Leaflet de raíz
        marcador.bindPopup(contenedorPopupMaster, {
            maxWidth: 300,
            minWidth: 260,
            className: 'zillow-custom-popup-wrapper',
            autoPan: true
        });

        // 6. ADICIONAL: Sincronización bidireccional al abrir el popup
        marcador.on('popupopen', () => {
            // Realiza scroll automático en el catálogo derecho para destacar esta propiedad
            const tarjetaDerecha = document.querySelector(`.tarjeta-casa[data-id="${prop.id}"]`);
            if (tarjetaDerecha) {
                tarjetaDerecha.scrollIntoView({ behavior: 'smooth', block: 'center' });
                tarjetaDerecha.style.outline = '2px solid #006aff';
                setTimeout(() => { tarjetaDerecha.style.outline = 'none'; }, 2000);
            }
        });

        window.capaMarcadores.addLayer(marcador);
    });
}


/**
 * RENDERIZADOR DE CATÁLOGO DERECHO Y CALLBACK PRINCIPAL DE RED (ESCONCOR)
 * Utiliza DocumentFragment y libera explícitamente los Event Listeners viejos para evitar fugas de memoria.
 */

function renderizarCatálogoTarjetas() {
    // Vinculación corregida apuntando de forma natural al ID: 'properties-grid-target'
    const contenedorRejilla = document.getElementById('properties-grid-target');
    if (!contenedorRejilla) return;

    // Garbage Collector interno activo: Remueve de la memoria RAM los Listeners de tarjetas previas
    while (contenedorRejilla.firstChild) {
        const id = contenedorRejilla.firstChild.getAttribute('data-id');
        if (id && state.limpiadoresDOM.has(id)) {
            state.limpiadoresDOM.get(id)(); // Remoción limpia garantizada
            state.limpiadoresDOM.delete(id);
        }
        contenedorRejilla.removeChild(contenedorRejilla.firstChild);
    }

    const fragmento = document.createDocumentFragment();
    // Reemplazo exacto dentro de renderizarMapaZillow() y renderizarCatálogoTarjetas()
    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);


    // Inyección atómica de los nodos puros en el fragmento flotante
    filtradas.forEach(prop => {
        const tarjetaNode = crearComponenteTarjetaZillow(prop);
        fragmento.appendChild(tarjetaNode);
    });

    contenedorRejilla.appendChild(fragmento);
    
    // Vinculación corregida apuntando de forma natural al ID contador: 'results-counter'
    const contador = document.getElementById('results-counter');
    if (contador) {
        contador.textContent = `${filtradas.length} resultados disponibles`;
    }
}

/**
 * ESPÍA CONTROLADO (Estrategia ESCONCOR): Callback de red global de Google Apps Script
 */
// PARTE: 5-5 (CALLBACK DE RED CON ESPÍA CABEZÓN ACTIVADO)
/**
 * CALLBACK CORE DE INTERCEPCIÓN ASÍNCRONA
 * Inyecta un espía masivo en la consola para auditar los cambios del transformador.
 */
function procesarDatosDelMotor(data) {
    // 🧲 ESPÍA CABEZÓN 1: Inspecciona el JSON crudo del Apps Script antes de tocarlo
    console.log("==================================================================");
    console.warn("🚨 [ESPÍA CABEZÓN 1] - RECIBIENDO DATOS CRUDOS DE GOOGLE SHEETS:");
    console.log("Estructura completa entrante:", data);
    if (data && data.propiedades) {
        console.table(data.propiedades); // Muestra las columnas del Excel en una tabla interactiva
    }
    console.log("==================================================================");
    
    if (!data || !data.propiedades || !Array.isArray(data.propiedades)) {
        console.error("❌ [ESPÍA CABEZÓN] - ERROR: Estructura del backend corrupta.");
        return;
    }

    // Ejecuta el mapeo relacional hacia Cloudinary
    state.propiedades = data.propiedades.map(normalizarPropiedad);
    
    // 🧲 ESPÍA CABEZÓN 2: Inspecciona cómo quedó el estado protegido después de la limpieza
    console.log("==================================================================");
    console.info("💡 [ESPÍA CABEZÓN 2] - ESTADO PURIFICADO EN MEMORIA RAM (STATE):");
    console.log("Arreglo procesado final:", state.propiedades);
    if (state.propiedades.length > 0) {
        console.log("🔍 REVISIÓN DE FOTOS DE LA PRIMERA CASA (PROP-001):");
        console.log("¿Qué tiene el arreglo de fotos adentro?:", state.propiedades[0].fotos);
    }
    console.log("==================================================================");

    // Ejecuta el renderizado sincronizado de las vistas
    renderizarMapaZillow();
    renderizarCatálogoTarjetas();
    
    // Invoca el firewall pasando la lista y el correo del usuario logueado en Supabase
interceptarFirewallSeguridadUsuario(data.usuarios, window.usuarioLogueado ? window.usuarioLogueado.email : "");

}


// Inicializador estructural del ecosistema al estar el árbol DOM listo
document.addEventListener("DOMContentLoaded", () => {
    
    // Sincronización nativa con el ID real del contenedor del mapa: 'map-instance'
    if (typeof L !== 'undefined' && document.getElementById('map-instance')) {
        window.map = L.map('map-instance', { zoomControl: true }).setView([-12.125, -76.995], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.map);
        inicializarEventosDeFiltros();
        
        // Sincroniza dinámicamente las burbujas al arrastrar o cambiar el zoom del mapa
        window.map.on('moveend', renderizarMapaZillow);
    }
    
    // Disparo inicial asíncronizado de red
    cargarDatosDesdeAppsScript();
});

// PARTE: 6-5 (MOTOR REACTIVO DE INTERFAZ Y MENÚS FLOTANTES)
/**
 * GESTOR DE APERTURA, CIERRE Y CAPTURA REACTIVA DE FILTROS AVANZADOS
 * Resuelve la interacción de menús y actualiza de forma inmutable el estado del sistema.
 */

function inicializarEventosDeFiltros() {
    // 1. Control de apertura/cierre de los paneles desplegables (Dropdowns)
    const wrappers = document.querySelectorAll('.filter-dropdown-wrapper');
    
    wrappers.forEach(wrapper => {
        const boton = wrapper.querySelector('.filter-btn');
        const panel = wrapper.querySelector('.dropdown-content-panel');
        
        if (!boton || !panel) return;
        
        boton.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Cerramos todos los demás paneles para evitar colisiones visuales
            document.querySelectorAll('.dropdown-content-panel').forEach(p => {
                if (p !== panel) p.classList.remove('show');
            });
            document.querySelectorAll('.filter-btn').forEach(b => {
                if (b !== boton) b.classList.remove('active');
            });
            
            // Alternamos el estado del panel actual
            panel.classList.toggle('show');
            boton.classList.toggle('active');
        });
    });

    // Cierre natural al hacer clic en cualquier zona vacía de la pantalla
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-content-panel').forEach(p => p.classList.remove('show'));
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    });

    // Evita que el menú se cierre solo al interactuar con los controles internos
    document.querySelectorAll('.dropdown-content-panel').forEach(panel => {
        panel.addEventListener('click', (e) => e.stopPropagation());
    });

    // 2. FILTRO 2: Captura del Tipo de Transacción (Radio Buttons)
    const radiosTransaccion = document.querySelectorAll('input[name="transaccion"]');
    radiosTransaccion.forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.filtros.estado = e.target.value;
            
            // Actualizamos dinámicamente el letrero del botón principal
            const btnStatus = document.getElementById('btn-filter-status');
            if (btnStatus) btnStatus.textContent = `${e.target.parentElement.textContent.trim()} ▾`;
            
            ejecutarTuberíaSincronizada();
        });
    });

    // 3. FILTRO 3: Captura del Rango de Precios (Inputs Numéricos)
    const inputMinPrecio = document.getElementById('price-min');
    const inputMaxPrecio = document.getElementById('price-max');
    
    const handlerPrecios = () => {
        state.filtros.precioMin = parseFloat(inputMinPrecio.value) || 0;
        state.filtros.precioMax = parseFloat(inputMaxPrecio.value) || Infinity;
        ejecutarTuberíaSincronizada();
    };

    if (inputMinPrecio) inputMinPrecio.addEventListener('input', handlerPrecios);
    if (inputMaxPrecio) inputMaxPrecio.addEventListener('input', handlerPrecios);

    // 4. FILTRO 4: Control Segmentado de Camas y Baños (Botones)
    configurarSegmentado('row-beds', (valor) => {
        state.filtros.camas = parseInt(valor);
        ejecutarTuberíaSincronizada();
    });

    configurarSegmentado('row-baths', (valor) => {
        state.filtros.baños = parseFloat(valor);
        ejecutarTuberíaSincronizada();
    });

    const checkCamasExactas = document.getElementById('beds-exact');
    if (checkCamasExactas) {
        checkCamasExactas.addEventListener('change', (e) => {
            state.filtros.camasExactas = e.target.checked;
            ejecutarTuberíaSincronizada();
        });
    }

    // 5. FILTRO 5: Tipo de Propiedad (Checkboxes Multiselect)
    const checkSelectAll = document.getElementById('type-select-all');
    const checkboxesTipo = document.querySelectorAll('.type-cb');

    if (checkSelectAll) {
        checkSelectAll.addEventListener('change', (e) => {
            checkboxesTipo.forEach(cb => {
                cb.checked = e.target.checked;
                if (e.target.checked) {
                    state.filtros.tiposPropiedad.add(cb.value);
                } else {
                    state.filtros.tiposPropiedad.delete(cb.value);
                }
            });
            ejecutarTuberíaSincronizada();
        });
    }

    checkboxesTipo.forEach(cb => {
        cb.addEventListener('change', (e) => {
            if (e.target.checked) {
                state.filtros.tiposPropiedad.add(e.target.value);
            } else {
                state.filtros.tiposPropiedad.delete(e.target.value);
            }
            
            // Si deselecciona uno, desactivamos el "Seleccionar Todos" para mantener coherencia
            if (!e.target.checked && checkSelectAll) checkSelectAll.checked = false;
            ejecutarTuberíaSincronizada();
        });
    });

    // 6. BOTONES DE ACCIÓN: Limpiador maestro y aplicador del menú expandido
    const btnReset = document.getElementById('master-reset-btn');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            inputMinPrecio.value = '';
            inputMaxPrecio.value = '1300000';
            if (checkSelectAll) checkSelectAll.checked = true;
            
            checkboxesTipo.forEach(cb => {
                cb.checked = true;
                state.filtros.tiposPropiedad.add(cb.value);
            });
            
            state.filtros.precioMin = 0;
            state.filtros.precioMax = 1300000;
            
            ejecutarTuberíaSincronizada();
        });
    }

    const btnApply = document.getElementById('master-apply-btn');
    if (btnApply) {
        btnApply.addEventListener('click', () => {
            // Cerramos el mega panel de filtros al presionar Aplicar
            document.querySelectorAll('.dropdown-content-panel').forEach(p => p.classList.remove('show'));
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        });
    }
}

// [AQUÍ TERMINAN TUS FILTROS ACTUALES DE LA PARTE 6-5]
// ... llaves de cierre previas

// 💡 PEGA EL NUEVO CÓDIGO EXACTAMENTE AQUÍ, AL FINAL DE TODO TU ARCHIVO APP.JS:

// PARTE: 5-5 (NAVEGACIÓN SPA Y DETALLE ASIMÉTRICO DE PANTALLA 2)
function alternarPantallaZillow(pantalla) {
    const contenedorSplit = document.querySelector('.split-view');
    let contenedorDetalle = document.getElementById('contenedor-detalle-zillow');
    
    if (!contenedorDetalle) {
        contenedorDetalle = document.createElement('div');
        contenedorDetalle.id = 'contenedor-detalle-zillow';
        contenedorDetalle.className = 'contenedor-detalle-zillow hidden';
        document.querySelector('.app-container').appendChild(contenedorDetalle);
    }
    
    if (pantalla === 'detalle-ficha') {
        contenedorSplit.classList.add('hidden-layout');
        contenedorDetalle.classList.remove('hidden');
        contenedorDetalle.classList.add('visible-panel');
    } else {
        contenedorSplit.classList.remove('hidden-layout');
        contenedorDetalle.classList.remove('visible-panel');
        contenedorDetalle.classList.add('hidden');
        contenedorDetalle.textContent = ''; 
    }
}

// ==========================================================================
// PARTE: 5-5 (REPARACIÓN ESTRUCTURAL DE RUTAS SECUENCIALES EN PANTALLA 2)
// ==========================================================================
function renderizarFichaDetalleZillow(propiedad) {
    const panelFicha = document.getElementById('contenedor-detalle-zillow');
    if (!panelFicha) return;
    panelFicha.textContent = ''; // Limpieza purista de control contra duplicados

    // Fila superior de navegación limpia de la ficha Zillow SPA
    const navFicha = document.createElement('div');
    navFicha.className = 'nav-ficha-zillow';

    const btnVolver = document.createElement('button');
    btnVolver.className = 'btn-volver-zillow';
    btnVolver.textContent = '← Volver a buscar';
    btnVolver.addEventListener('click', () => {
        alternarPantallaZillow('split-view');
        if (typeof renderizarMapaZillow === 'function') renderizarMapaZillow();
    });
    navFicha.appendChild(btnVolver);

    const logoCentro = document.createElement('div');
    logoCentro.className = 'logo-centro-zillow';
    logoCentro.textContent = 'Zillow';
    navFicha.appendChild(logoCentro);

    navFicha.appendChild(document.createElement('div')); // Espaciador geométrico derecho
    panelFicha.appendChild(navFicha);

    // Contenedor del Mosaico de Imágenes de Alta Fidelidad (Split 50/50)
    const contenedorMosaico = document.createElement('div');
    contenedorMosaico.className = 'mosaico-galeria-zillow';

    // 1. PANEL IZQUIERDO: FOTO PRINCIPAL GRANDE (OCUPA INDICE 0 SIN REPETICIÓN)
    const bloqueIzquierdo = document.createElement('div');
    bloqueIzquierdo.className = 'bloque-foto-principal';
    const imgPrincipal = document.createElement('img');
    imgPrincipal.src = propiedad.fotos[0];
    bloqueIzquierdo.appendChild(imgPrincipal);
    contenedorMosaico.appendChild(bloqueIzquierdo);

    // 2. PANEL DERECHO: MATRIZ GRID 2X2 DE FOTOS SECUNDARIAS (CONSUME ÍNDICES 1 A 4 EN SECUENCIA)
    const bloqueDerechoGrid = document.createElement('div');
    bloqueDerechoGrid.className = 'bloque-secundarias-grid';

    for (let i = 1; i < 5; i++) {
        const cajaMinifoto = document.createElement('div');
        cajaMinifoto.className = 'caja-minifoto-item';
        const imgSec = document.createElement('img');
        
        // Indexador secuencial puro: toma la foto correspondiente o la anterior si el array es corto
        imgSec.src = propiedad.fotos[i] || propiedad.fotos[i - 1] || propiedad.fotos[0];
        cajaMinifoto.appendChild(imgSec);

        // Conteo de fotos estilo Zillow en la esquina inferior derecha de la última minifoto
        if (i === 4) {
            const btnVerMas = document.createElement('button');
            btnVerMas.className = 'btn-ver-mas-fotos';
            btnVerMas.textContent = `Ver las ${propiedad.fotos.length} fotos`;
            cajaMinifoto.appendChild(btnVerMas);
        }
        bloqueDerechoGrid.appendChild(cajaMinifoto);
    }
    contenedorMosaico.appendChild(bloqueDerechoGrid);
    contenedorMosaico.style.display = 'flex'; // Activación fluida del layout estructurado
    panelFicha.appendChild(contenedorMosaico);

    // 3. Bloque de Información Inferior y Contacto Comercial Privilegiado
    const contenedorFichaDatos = document.createElement('div');
    contenedorFichaDatos.className = 'contenedor-ficha-datos-texto';

    const filaMetricas = document.createElement('div');
    filaMetricas.className = 'fila-metricas-zillow';

    const spanPrecio = document.createElement('span');
    spanPrecio.className = 'texto-precio-ficha';
    spanPrecio.textContent = propiedad.precio.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 });

    const spanSpecs = document.createElement('span');
    spanSpecs.className = 'texto-specs-ficha';
    spanSpecs.textContent = `${propiedad.habitaciones} Dormitorios | ${propiedad.banos} Baños | ${propiedad.area_construida} m²`;

    filaMetricas.appendChild(spanPrecio);
    filaMetricas.appendChild(spanSpecs);
    contenedorFichaDatos.appendChild(filaMetricas);

    const filaDireccion = document.createElement('div');
    filaDireccion.className = 'fila-direccion-ficha';
    filaDireccion.textContent = propiedad.fraseDescriptiva;
    contenedorFichaDatos.appendChild(filaDireccion);

    // Bloque de Contacto Dinámico según procesó tu backend (Propietario vs Agente)
    const bloqueContacto = document.createElement('div');
    bloqueContacto.style.marginTop = '20px';
    bloqueContacto.style.padding = '16px';
    bloqueContacto.style.backgroundColor = '#f8fafc';
    bloqueContacto.style.borderRadius = '8px';
    bloqueContacto.style.border = '1px solid #e2e8f0';

    const labelContacto = document.createElement('div');
    labelContacto.style.fontWeight = 'bold';
    labelContacto.style.color = '#475569';
    labelContacto.style.fontSize = '14px';
    labelContacto.textContent = `Contacto Comercial: ${propiedad.contacto_nombre}`;
    bloqueContacto.appendChild(labelContacto);

    const btnVerTelefono = document.createElement('button');
    btnVerTelefono.className = 'filter-btn';
    btnVerTelefono.style.marginTop = '10px';
    btnVerTelefono.style.backgroundColor = '#006aff';
    btnVerTelefono.style.color = '#ffffff';
    btnVerTelefono.style.border = 'none';
    btnVerTelefono.textContent = 'Ver número de teléfono';

    btnVerTelefono.addEventListener('click', () => {
        // CORTAFUEGOS COMERCIAL: Bloqueo inmediato si el estado_cuenta es suspendido
        if (state.usuarioActual && state.usuarioActual.estado_cuenta === 'suspendido') {
            alert("Su cuenta ha sido suspendida por incumplir con las políticas de la aplicación. Por favor, contacte con soporte técnico.");
            return;
        }
        
        // Despliega de inmediato el teléfono limpio procesado por el servidor
        btnVerTelefono.textContent = propiedad.telefono ? propiedad.telefono : "Teléfono no disponible";
        btnVerTelefono.style.backgroundColor = '#002e50';
        btnVerTelefono.disabled = true;
    });

    bloqueContacto.appendChild(btnVerTelefono);
    contenedorFichaDatos.appendChild(bloqueContacto);
    panelFicha.appendChild(contenedorFichaDatos);
}


/**
 * Helper modular nativo para gestionar la clase active en las filas de controles segmentados
 */
function configurarSegmentado(idContenedor, callback) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;
    
    contenedor.addEventListener('click', (e) => {
        const botonNode = e.target.closest('.segmented-btn');
        if (!botonNode) return;
        
        contenedor.querySelectorAll('.segmented-btn').forEach(btn => btn.classList.remove('active'));
        botonNode.classList.add('active');
        
        const valorAtributo = botonNode.getAttribute('data-val');
        callback(valorAtributo);
    });
}

/**
 * Filtro lógico multidimensional puro: Evalúa si un registro pasa todos los criterios activos
 */
// PARTE: 6-5 (MOTOR DE FILTRADO REACTIVO MULTIDIMENSIONAL PURE)
/**
 * Evalúa las propiedades en memoria RAM contra las selecciones activas de la interfaz.
 */
function evaluarCriteriosDeFiltrado(prop) {
    // A. Filtro por Tipo de Transacción (Si está en 'Todos' no descarta ninguna)
    const matchTransaccion = state.filtros.estado === 'Todos' || prop.estadoListado === state.filtros.estado;
    
    // B. Filtro por Rango de Precios
    const matchPrecio = prop.precio >= state.filtros.precioMin && prop.precio <= state.filtros.precioMax;
    
    // C. Filtro por Dormitorios
    let matchCamas = true;
    if (state.filtros.camas > 0) {
        if (state.filtros.camasExactas) {
            matchCamas = prop.habitaciones === state.filtros.camas;
        } else {
            matchCamas = prop.habitaciones >= state.filtros.camas;
        }
    }

    return matchTransaccion && matchPrecio && matchCamas;
}


/**
 * Tubería centralizada (Pipeline): Orquesta el re-renderizado síncrono y limpio de ambas vistas
 */
function ejecutarTuberíaSincronizada() {
    // Redirigimos el renderizado del mapa para que consuma la lógica unificada
    renderizarMapaZillow();
    renderizarCatálogoTarjetas();
}

// ==========================================================================
// CORTAFUEGOS COMERCIAL: INYECTOR COMPLEMENTARIO DE SEGURIDAD (HOOK DE FIREWALL)
// ==========================================================================
function interceptarFirewallSeguridadUsuario(listaUsuariosBackend, emailUsuarioLogueado) {
    if (!emailUsuarioLogueado || !Array.isArray(listaUsuariosBackend)) {
        state.usuarioActual = null;
        return;
    }
    
    // Buscamos el registro exacto del usuario en la Hoja de Sheets enviada por el backend
    const usuarioEncontrado = listaUsuariosBackend.find(u => String(u.correo || u.email).trim().toLowerCase() === String(emailUsuarioLogueado).trim().toLowerCase());
    state.usuarioActual = usuarioEncontrado ? usuarioEncontrado : null;

    // Pintamos de forma atómica el banner superior de alerta global si está suspendido
    const idBanner = 'banner-suspension-alerta';
    let banner = document.getElementById(idBanner);

    if (state.usuarioActual && state.usuarioActual.estado_cuenta === 'suspendido') {
        if (!banner) {
            banner = document.createElement('div');
            banner.id = idBanner;
            banner.className = 'banner-suspension-global';
            banner.style.backgroundColor = '#d92323';
            banner.style.color = '#ffffff';
            banner.style.padding = '10px';
            banner.style.textAlign = 'center';
            banner.style.fontWeight = 'bold';
            banner.style.position = 'fixed';
            banner.style.top = '0';
            banner.style.left = '0';
            banner.style.right = '0';
            banner.style.zIndex = '99999';
            banner.textContent = "Su cuenta ha sido suspendida por violar las políticas de la aplicación. Por favor, contacte con soporte técnico.";
            document.body.prepend(banner);
        }
    } else {
        if (banner) banner.remove();
    }
}

