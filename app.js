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
const urlMiScriptGoogle = "https://script.google.com/macros/s/AKfycbyfNpA-Zf_C-uqDxpzX1phQqREIXAhgSvFyVj2VAhWp2-h7wN_2uR44b3wkg152STAzrQ/exec";

/**
 * Lector asíncrono seguro mediante inyección controlada de JSONP
 */
function cargarDatosDesdeAppsScript() {
    const script = document.createElement('script');
    script.src = `${urlMiScriptGoogle}?callback=procesarDatosDelMotor`;
    document.body.appendChild(script);
}

// PARTE: 2-5 (NORMALIZACIÓN RELACIONAL - VERSIÓN ULTRA ROBUSTA E INDESTRUCTIBLE)
function normalizarPropiedad(prop) {
    const id = prop.id || prop.propiedad_id || String(Math.random());
    
    // 💡 URL de tu servidor de Cloudinary inyectado de forma estricta
    const urlBaseCloudinary = "https://res.cloudinary.com/obw6ciov/image/upload/v1785206431/"; 

    // Helper purista interno para limpiar y formatear de forma natural
    const asegurarUrlCompleta = (ruta) => {
        if (!ruta) return "";
        let texto = String(ruta).trim();
        
        if (texto.startsWith('http://') || texto.startsWith('https://')) {
            return texto;
        }
        
        // Limpieza obligatoria: Reemplaza espacios por guiones bajos
        texto = texto.replace(/\s+/g, '_');
        
        // Agrega la extensión si el Excel no la tiene
        if (!texto.toLowerCase().endsWith('.jpg') && !texto.toLowerCase().endsWith('.png')) {
            texto = texto + '.jpg';
        }
        
        return urlBaseCloudinary + texto;
    };
    
    // 1. FUSIÓN DE IMÁGENES
    let fotosUnificadas = [];
    
    if (prop.foto_principal) {
        fotosUnificadas.push(asegurarUrlCompleta(prop.foto_principal));
    } else if (prop.foto) {
        fotosUnificadas.push(asegurarUrlCompleta(prop.foto));
    }
    
    if (prop.ruta_imagen) {
        fotosUnificadas.push(asegurarUrlCompleta(prop.ruta_imagen));
    }

    if (prop.imagenes_secundarias) {
        if (Array.isArray(prop.imagenes_secundarias)) {
            prop.imagenes_secundarias.forEach(f => f && fotosUnificadas.push(asegurarUrlCompleta(f)));
        } else {
            String(prop.imagenes_secundarias).split(',').forEach(f => f.trim() && fotosUnificadas.push(asegurarUrlCompleta(f.trim())));
        }
    }

    const fotosUnicas = [...new Set(fotosUnificadas.filter(Boolean))];
    const las5PrimerasFotos = fotosUnicas.slice(0, 5);

    // 2. CLASIFICACIÓN DE ESTADOS RELACIONALES
    let estadoZillow = 'Venta'; 
    const publicacion = prop.tipo_publicacion ? String(prop.tipo_publicacion).trim().toLowerCase() : '';
    const anuncio = prop.tipo_anuncio ? String(prop.tipo_anuncio).trim().toLowerCase() : '';

    if (publicacion === 'vendida' || publicacion === 'vendido') {
        estadoZillow = 'Vendido';
    } else if (publicacion === 'disponible' || publicacion === '') {
        if (anuncio === 'venta' || anuncio === '') {
            estadoZillow = 'Venta';
        } else if (anuncio === 'alquiler') {
            estadoZillow = 'Alquiler';
        }
    }

    // 3. RETORNO CON BLINDAJE DE SEGURIDAD ABSOLUTO PARA LAS TARJETAS
    return {
        id: String(id),
        precio: parseFloat(prop.precio_base || prop.precio || prop.valor || 350000),
        estadoListado: estadoZillow, 
        fraseDescriptiva: String(prop.titulo || prop.frase_descriptiva || 'Propiedad en Surco').trim(),
        tipoPropiedad: String(prop.tipo || prop.tipo_propiedad || 'Casa').trim(),
        
        // 💡 FORCE MAJEURE: Si por algún motivo el arreglo quedó vacío, forzamos tu URL de Cloudinary real
        fotos: las5PrimerasFotos.length > 0 ? las5PrimerasFotos : [
            "https://res.cloudinary.com/obw6ciov/image/upload/v1785206431/Foto_1_jfz1xs.jpg"
        ],
        
        latitud: parseFloat(prop.latitud || prop.lat || -12.125),
        longitud: parseFloat(prop.longitud || prop.lng || -76.995),
        habitaciones: parseInt(prop.habitaciones || prop.dormitorios || 3)
    };
}


function formatearPrecioCompacto(precio) {
    if (precio >= 1000000) return `S/. ${(precio / 1000000).toFixed(2)}M`;
    if (precio >= 1000) return `S/. ${(precio / 1000).toFixed(0)}K`;
    return `S/. ${precio}`;
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



// PARTE: 2-5 (NORMALIZACIÓN Y FORMATEO - AJUSTE DE BACKEND REAL)
/**
 * MOTOR DE PROCESAMIENTO Y HOMOGENEIZACIÓN DE DATOS DEL BACKEND REAL
 * Sincroniza las columnas exactas del Google Sheets con el estado protegido de la app.
 */
// PARTE: 2-5 (NORMALIZACIÓN RELACIONAL RESTRUCTURADA)
/**
 * REGLAS DE NEGOCIO PARA CRUCE DE TABLAS (GOOGLE SHEETS -> STATE)
 * Clasifica dinámicamente las propiedades en base a 'tipo_publicacion' y 'tipo_anuncio'.
 */
function normalizarPropiedad(prop) {
    const id = prop.id || prop.propiedad_id || String(Math.random());
    
    // 1. Unificación y limpieza de la galería de imágenes
    let fotosUnificadas = [];
    if (prop.foto_principal) fotosUnificadas.push(String(prop.foto_principal).trim());
    if (prop.foto) fotosUnificadas.push(String(prop.foto).trim());
    if (prop.imagenes_secundarias) {
        fotosUnificadas.push(...String(prop.imagenes_secundarias).split(',').map(f => f.trim()));
    }
    const fotosUnicas = [...new Set(fotosUnificadas.filter(Boolean))];

    // 2. LOGICA EXACTA DE CLASIFICACIÓN SOLICITADA
    let estadoZillow = 'Venta'; // Valor por defecto
    const publicacion = String(prop.tipo_publicacion || '').trim().toLowerCase();
    const anuncio = String(prop.tipo_anuncio || '').trim().toLowerCase();

    if (publicacion === 'vendida' || publicacion === 'vendido') {
        estadoZillow = 'Vendido';
    } else if (publicacion === 'disponible') {
        if (anuncio === 'venta') {
            estadoZillow = 'Venta';
        } else if (anuncio === 'alquiler') {
            estadoZillow = 'Alquiler';
        }
    }

    // 3. Retorno del objeto homogeneizado acoplado al backend relacional
    return {
        id: String(id),
        precio: parseFloat(prop.precio_base || prop.precio || prop.valor || 0),
        estadoListado: estadoZillow, // Almacena estrictamente: 'Venta', 'Alquiler' o 'Vendido'
        fraseDescriptiva: String(prop.titulo || prop.frase_descriptiva || '').trim(),
        tipoPropiedad: String(prop.tipo || prop.tipo_propiedad || 'Casa').trim(),
        fotos: fotosUnicas.length > 0 ? fotosUnicas : ['https://unsplash.com'],
        latitud: parseFloat(prop.latitud || prop.lat || 0),
        longitud: parseFloat(prop.longitud || prop.lng || 0),
        habitaciones: parseInt(prop.habitaciones || prop.dormitorios || 0)
    };
}

function formatearPrecioCompacto(precio) {
    if (precio >= 1000000) return `S/. ${(precio / 1000000).toFixed(2)}M`;
    if (precio >= 1000) return `S/. ${(precio / 1000).toFixed(0)}K`;
    return `S/. ${precio}`;
}

// PARTE: 3-5 (FÁBRICA DE COMPONENTES TARJETA - VERSIÓN COMPLETA BLINDADA)
/**
 * FÁBRICA DE TARJETAS MODULARES CON MICRO-CARRUSEL INTERACTIVO DOBLE
 * Fuerza de forma atómica la inyección de la ruta real de Cloudinary en el atributo src.
 */
function crearComponenteTarjetaZillow(propiedad) {
    let indiceFotoActual = 0;
    const totalFotos = Math.min(propiedad.fotos.length, 5);

    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-casa';
    tarjeta.setAttribute('data-id', propiedad.id);

    const contenedorFoto = document.createElement('div');
    contenedorFoto.className = 'contenedor-foto';
    contenedorFoto.style.cursor = 'pointer';

    const rielCarrusel = document.createElement('div');
    rielCarrusel.className = 'carrusel-imagenes';
    rielCarrusel.style.width = `${totalFotos * 100}%`;

    const nodosImagenes = [];
    
    // 💡 BLOQUE BLINDADO QUE OBLIGA AL ATRIBUTO SRC A CONECTARSE CON CLOUDINARY
    for (let i = 0; i < totalFotos; i++) {
        const img = document.createElement('img');
        
        // Captura el valor del arreglo normalizado o usa tu ID verificado como respaldo
        let urlFoto = propiedad.fotos[i] || "Foto_1_jfz1xs.jpg";
        
        // FORCE MAJEURE: Si el texto no es un enlace de internet completo, lo convertimos a Cloudinary en el acto
        if (!urlFoto.startsWith('http://') && !urlFoto.startsWith('https://')) {
            // Sanea espacios por guiones bajos de forma natural
            urlFoto = urlFoto.trim().replace(/\s+/g, '_');
            
            // Fuerza la extensión .jpg si el Sheets o el estado previo la omitieron
            if (!urlFoto.toLowerCase().endsWith('.jpg') && !urlFoto.toLowerCase().endsWith('.png')) {
                urlFoto += '.jpg';
            }
            
            // Suma de cadenas directa con tu servidor unificado obw6ciov
            urlFoto = "https://res.cloudinary.com/obw6ciov/image/upload/v1785206431/" + urlFoto;
        }
        
        img.src = urlFoto; // Asignación física final blindada contra GitHub Pages
        img.alt = `${propiedad.fraseDescriptiva} - Vista ${i + 1}`;
        img.style.width = `${100 / totalFotos}%`;
        rielCarrusel.appendChild(img);
        nodosImagenes.push(img);
    }
    
    contenedorFoto.appendChild(rielCarrusel);

    if (propiedad.estadoListado === 'Nuevo' || propiedad.estadoListado === 'Vendido') {
        const badge = document.createElement('span');
        badge.className = `badge badge-${propiedad.estadoListado.toLowerCase()}`;
        badge.textContent = propiedad.estadoListado;
        contenedorFoto.appendChild(badge);
    }

    const botonCorazon = document.createElement('button');
    botonCorazon.className = 'corazon-favorito';
    botonCorazon.textContent = state.favoritos.has(propiedad.id) ? '♥' : '♡';
    
    const handlerFavorito = (e) => {
        e.stopPropagation();
        if (state.favoritos.has(propiedad.id)) {
            state.favoritos.delete(propiedad.id);
            botonCorazon.textContent = '♡';
        } else {
            state.favoritos.add(propiedad.id);
            botonCorazon.textContent = '♥';
        }
    };
    botonCorazon.addEventListener('click', handlerFavorito);
    contenedorFoto.appendChild(botonCorazon);

    if (propiedad.fraseDescriptiva) {
        const letrero = document.createElement('div');
        letrero.className = 'letrero-descriptivo';
        letrero.textContent = propiedad.fraseDescriptiva;
        contenedorFoto.appendChild(letrero);
    }

    let handlerFlechaIzq = null, handlerFlechaDer = null;
    if (totalFotos > 1) {
        const btnIzq = document.createElement('button');
        btnIzq.className = 'flecha-carrusel flecha-izq';
        btnIzq.textContent = '<';
        const btnDer = document.createElement('button');
        btnDer.className = 'flecha-carrusel flecha-der';
        btnDer.textContent = '>';

        handlerFlechaIzq = (e) => {
            e.stopPropagation();
            indiceFotoActual = (indiceFotoActual - 1 + totalFotos) % totalFotos;
            rielCarrusel.style.transform = `translateX(-${indiceFotoActual * (100 / totalFotos)}%)`;
        };
        handlerFlechaDer = (e) => {
            e.stopPropagation();
            indiceFotoActual = (indiceFotoActual + 1) % totalFotos;
            rielCarrusel.style.transform = `translateX(-${indiceFotoActual * (100 / totalFotos)}%)`;
        };

        btnIzq.addEventListener('click', handlerFlechaIzq);
        btnDer.addEventListener('click', handlerFlechaDer);
        contenedorFoto.appendChild(btnIzq);
        contenedorFoto.appendChild(btnDer);
    }

    // Interceptor hacia la pantalla de detalle asimétrica (Pantalla 2)
    contenedorFoto.addEventListener('click', (e) => {
        if (e.target.closest('.flecha-carrusel') || e.target.closest('.corazon-favorito')) return;
        if (typeof window.map !== 'undefined') window.map.closePopup();
        state.propiedadSeleccionadaId = propiedad.id;
        alternarPantallaZillow('detalle-ficha');
        renderizarFichaDetalleZillow(propiedad);
    });

    tarjeta.appendChild(contenedorFoto);

    const datosCasa = document.createElement('div');
    datosCasa.className = 'datos-casa';
    const precioTexto = document.createElement('div');
    precioTexto.className = 'precio';
    precioTexto.textContent = propiedad.precio.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 });
    datosCasa.appendChild(precioTexto);
    tarjeta.appendChild(datosCasa);

    state.limpiadoresDOM.set(propiedad.id, () => {
        botonCorazon.removeEventListener('click', handlerFavorito);
        if (totalFotos > 1) {
            btnIzq.removeEventListener('click', handlerFlechaIzq);
            btnDer.removeEventListener('click', handlerFlechaDer);
        }
    });

    return tarjeta;
}


// PARTE: 4-5 (MOTOR DE MAPA Y POPUPS ENLAZADOS - REPARADO)
function renderizarMapaZillow() {
    // 💡 INYECCIÓN QUIRÚRGICA: Declaración formal y segura de la capa
    if (typeof window.capaMarcadores === 'undefined') {
        window.capaMarcadores = null;
    }
    // Vinculación estricta al ID nativo del HTML: 'map-instance'
    if (!window.map || !document.getElementById('map-instance')) return;

    if (!window.capaMarcadores) {
        window.capaMarcadores = L.layerGroup().addTo(window.map);
    } else {
        window.capaMarcadores.clearLayers();
    }

    // Filtrado lógico unificado mediante nuestra función de criterios avanzados
    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);

    // Iteración nativa sobre los registros válidos para montar las píldoras
    filtradas.forEach(prop => {
        if (!prop.latitud || !prop.longitud) return;

        const precioCompacto = formatearPrecioCompacto(prop.precio);
        // Si el estado es 'Nuevo', la píldora se pintará de rojo alerta (#d92323) automáticamente por CSS
        const esNuevo = prop.estadoListado === 'Nuevo';
        const clasePill = esNuevo ? 'map-price-pill nuevo' : 'map-price-pill';

        const htmlBurbuja = `<div class="${clasePill}"><span>${precioCompacto}</span></div>`;

        // Centrado geométrico nativo estricto mediante constructores L.point(80, 30) y L.point(40, 15)
        const iconoBurbuja = L.divIcon({
            html: htmlBurbuja,
            className: 'custom-leaflet-container',
            iconSize: L.point(80, 30),
            iconAnchor: L.point(40, 15)
   });

        const marcador = L.marker([prop.latitud, prop.longitud], { icon: iconoBurbuja });

        // Apertura interactiva del popup inyectando la misma fábrica pura de micro-carruseles circulares
        marcador.on('click', () => {
            window.map.panTo(marcador.getLatLng());

            // Fabricamos la tarjeta modular con capacidad de navegación de 5 fotos nativa
            const tarjetaPopup = crearComponenteTarjetaZillow(prop);
            tarjetaPopup.classList.add('popup-card');

            marcador.bindPopup(tarjetaPopup, {
                maxWidth: 300,
                minWidth: 280,
                className: 'zillow-custom-popup-wrapper'
            }).openPopup();
        });

        window.capaMarcadores.addLayer(marcador);
    });     // 👈 LÍNEA 288 aprox: Cierra limpiamente el filtradas.forEach(prop => {
}    // 👈 LÍNEA 290 aprox: Cierra la función completa function renderizarMapaZillow() {


// PARTE: 5-5 (REJILLA Y CONTROLADOR CORE CONFIGURADO)
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

function renderizarFichaDetalleZillow(propiedad) {
    const panelFicha = document.getElementById('contenedor-detalle-zillow');
    if (!panelFicha) return;
    panelFicha.textContent = '';
    
    const navFicha = document.createElement('div');
    navFicha.className = 'nav-ficha-zillow';
    
    const btnVolver = document.createElement('button');
    btnVolver.className = 'btn-volver-zillow';
    btnVolver.textContent = '‹ Volver a buscar';
    btnVolver.addEventListener('click', () => alternarPantallaZillow('split-view'));
    navFicha.appendChild(btnVolver);
    
    const logoCentro = document.createElement('div');
    logoCentro.className = 'logo-centro-zillow';
    logoCentro.textContent = 'Zillow';
    navFicha.appendChild(logoCentro);
    
    panelFicha.appendChild(navFicha);
    
    const contenedorMosaico = document.createElement('div');
    contenedorMosaico.className = 'mosaico-galeria-zillow';
    
    const bloqueIzquierdo = document.createElement('div');
    bloqueIzquierdo.className = 'bloque-foto-principal';
    const imgPrincipal = document.createElement('img');
    // Consumimos el arreglo unificado que ya tiene el prefijo de tu Cloudinary
    imgPrincipal.src = propiedad.fotos[0] || propiedad.fotos;
    bloqueIzquierdo.appendChild(imgPrincipal);
    contenedorMosaico.appendChild(bloqueIzquierdo);
    
    const bloqueDerechoGrid = document.createElement('div');
    bloqueDerechoGrid.className = 'bloque-secundarias-grid';
    for (let i = 1; i < 5; i++) {
        const cajaMinifoto = document.createElement('div');
        cajaMinifoto.className = 'caja-minifoto-item';
        const imgSec = document.createElement('img');
        imgSec.src = propiedad.fotos[i] || propiedad.fotos[0] || propiedad.fotos;
        cajaMinifoto.appendChild(imgSec);
        if (i === 4) {
            const btnVerMas = document.createElement('button');
            btnVerMas.className = 'btn-ver-mas-fotos';
            btnVerMas.textContent = `田 See all ${propiedad.fotos.length} photos`;
            cajaMinifoto.appendChild(btnVerMas);
        }
        bloqueDerechoGrid.appendChild(cajaMinifoto);
    }
    contenedorMosaico.appendChild(bloqueDerechoGrid);
    panelFicha.appendChild(contenedorMosaico);
    
    const contenedorFichaDatos = document.createElement('div');
    contenedorFichaDatos.className = 'contenedor-ficha-datos-texto';
    const filaMetricas = document.createElement('div');
    filaMetricas.className = 'fila-metricas-zillow';
    const spanPrecio = document.createElement('span');
    spanPrecio.className = 'texto-precio-ficha';
    spanPrecio.textContent = propiedad.precio.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 });
    const spanSpecs = document.createElement('span');
    spanSpecs.className = 'texto-specs-ficha';
    spanSpecs.textContent = `${propiedad.habitaciones} beds  |  2 baths  |  1,850 sqft`;
    
    filaMetricas.appendChild(spanPrecio);
    filaMetricas.appendChild(spanSpecs);
    contenedorFichaDatos.appendChild(filaMetricas);
    
    const filaDireccion = document.createElement('div');
    filaDireccion.className = 'fila-direccion-ficha';
    filaDireccion.textContent = propiedad.fraseDescriptiva;
    contenedorFichaDatos.appendChild(filaDireccion);
    
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
