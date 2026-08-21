/* jshint esversion: 11 */
// PARTE: 1-5 (ESTADO Y CONFIGURACIONES)
/**
* ARQUITECTURA DE CONTROL DE ESTADO INMUTABLE Y CONFIGURACIÓN GLOBAL ZILLOW V2
* Centraliza el almacenamiento y protege el flujo contra variables mutables globales.
*/
const state = 
{ // -->Aqui inicia Objeto state global
    propiedades: [],
    favoritos: new Set(),
    filtros: 
    { // -->Aqui inicia Sub-objeto filtros
        estado: 'Todos',
        precioMin: 0,
        precioMax: Infinity,
        camas: 0,
        camasExactas: false,
        baños: 0,
        tiposPropiedad: new Set(['Casa', 'Departamento'])
    }, // <--Aqui finaliza Sub-objeto filtros
    // Registro interno para la remoción explícita de Listeners (Garbage Collector)
    limpiadoresDOM: new Map()
}; // <--Aqui finaliza Objeto state global

// URL de conexión segura con el backend relacional de Google Apps Script
const urlMiScriptGoogle ="https://script.google.com/macros/s/AKfycbxyu_R99qk6KhemOCiUUEjUIl_i34mphAdYVmeE6ETQSp6NXtrfpFLJs-KwtfPwhb32aA/exec";

/**
* Lector asíncrono seguro mediante inyección controlada de JSONP
*/
function cargarDatosDesdeAppsScript() {
    const script = document.createElement('script');
    //  ¡Corregido! Ahora lee correctamente la variable global
    script.src = `${urlMiScriptGoogle}?callback=procesarDatosDelMotor`; 
    document.body.appendChild(script);
} // <--Aqui finaliza Función cargarDatosDesdeAppsScript
// PARTE: 1-5 (ESTADO Y CONFIGURACIONES)

// =========================================================================
// PARTE: 2-5 (NORMALIZACIÓN RELACIONAL - CONEXIÓN CON MOTOR BACKEND V2)
// =========================================================================
function normalizarPropiedad(prop) 
{ // -->Aqui inicia Función normalizarPropiedad
    const id = prop.id || String(Math.random());
    const urlBaseCloudinary = "https://res.cloudinary.com/obw6ciov/image/upload/";

    // Helper purista interno para limpiar, quitar espacios y forzar la URL absoluta de Cloudinary
    const asegurarUrlCompleta = (ruta) => 
    { // -->Aqui inicia Helper asegurarUrlCompleta
        if (!ruta) return "";
        let texto = String(ruta).trim();
        
        // Si ya viene con el enlace completo de internet (como Unsplash), la dejamos pasar intacta
        if (texto.startsWith('http://') || texto.startsWith('https://')) 
        { // -->Aqui inicia Condicional enlace completo internet
            return texto;
        } // <--Aqui finaliza Condicional enlace completo internet
        // 🛑 Error original corregido: <span style="color:red; font-weight:bold;">Aqui falta la llave de cierre } que aislaba el código inferior</span>

        // Limpieza de arquitectura: Reemplaza espacios intermedios por guiones bajos
        texto = texto.replace(/\s+/g, '_');

        // Fuerza la extensión si el string no cuenta con ella
        if (!texto.toLowerCase().endsWith('.jpg') && !texto.toLowerCase().endsWith('.png')
        && !texto.toLowerCase().endsWith('.webp') && !texto.toLowerCase().endsWith('.jpeg')) 
        { // -->Aqui inicia Condicional forzar extensión .jpg
            texto = texto + '.jpg';
        } // <--Aqui finaliza Condicional forzar extensión .jpg

        // CONCATENACIÓN ABSOLUTA OBLIGATORIA: Evita que el navegador busque de forma local en GitHub Pages
        return urlBaseCloudinary + texto;
    }; // <--Aqui finaliza Helper asegurarUrlCompleta

    // LEER EXACTAMENTE EL ARREGLO 'fotos' QUE ENVIÓ TU NUEVO BACKEND UNIFICADO
    let fotosUnificadas = [];
    if (prop.fotos && Array.isArray(prop.fotos)) 
    { // -->Aqui inicia Condicional mapear arreglo de fotos
        fotosUnificadas = prop.fotos.map(f => asegurarUrlCompleta(f)).filter(Boolean);
    } // <--Aqui finaliza Condicional mapear arreglo de fotos

    // FORCE MAJEURE: Si por algún motivo el arreglo quedó vacío, forzamos tu foto de Cloudinary de respaldo
    if (fotosUnificadas.length === 0) 
    { // -->Aqui inicia Condicional arreglo fotos vacío
        fotosUnificadas.push("https://res.cloudinary.com/obw6ciov/image/upload/Foto15_havrr3.webp");
    } // <--Aqui finaliza Condicional arreglo fotos vacío

    // RETORNO CON BLINDAJE DE SEGURIDAD ABSOLUTO ACOPLADO AL JSON REAL DE TU CONSOLA
    return { // -->Aqui inicia Objeto de retorno normalizarPropiedad
        id: String(id),
        anuncio_id: prop.anuncio_id || "",
        precio: parseFloat(prop.precio_base || 350000), // Mapeado a precio_base del backend
        
        // ---------------------------------------------------------------------
        // COLUMNAS REALES DE TUS EXCEL (HOJA "anuncio" Y HOJA "propiedad")
        // Captura directa y estricta sin toLowerCase() para no deformar tus datos
        // ---------------------------------------------------------------------
        estado_publicacion: String(prop.estado_publicacion || "").trim(), // Almacena estrictamente "disponible" o "vendida"
        tipo_anuncio: String(prop.tipo_anuncio || "").trim(),             // Almacena estrictamente "Venta" o "Alquiler"
        // ---------------------------------------------------------------------

        estadoListado: prop.estado_publicacion || "Venta", // Mapeado a estado_publicacion del backend
        fraseDescriptiva: String(prop.titulo || '').trim(), // Mantiene tu título original limpio
        tipoPropiedad: String(prop.tipo_propiedad || 'Casa').trim(), // Mapeado a tipo_propiedad del backend
        subtipoPropiedad: String(prop.subtipo_propiedad || "").trim(),
        area_terreno: parseFloat(prop.area_terreno || 0),
        estacionamientos: parseInt(prop.estacionamientos, 10) || 0,
        ano_construccion: parseInt(prop.ano_construccion, 10) || 0,
        estado_propiedad: String(prop.estado_propiedad || "").trim(),
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
        telefono: prop.telefono || "",
        contacto_nombre: prop.contacto_nombre || "Contacto"
    }; // <--Aqui finaliza Objeto de retorno normalizarPropiedad
   } 
    
function formatearPrecioCompleto(precio) 
{ // -->Aqui inicia Función formatearPrecioCompleto
    const num = parseFloat(precio);
    if (isNaN(num) || num === 0) return 'Consultar';
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
} // <--Aqui finaliza Función formatearPrecioCompleto

// PARTE: 1-5 (EXTENSIÓN DE CONTROL DE FILTROS EN EL ESTADO)
/**
* Modelo de datos unificado para la captura reactiva de parámetros de búsqueda.
*/
state.filtros = 
{ // -->Aqui inicia Objeto state.filtros reestructurado
    estado: 'Venta', // Tipo de Transacción (Radio: Venta, Alquiler, Vendido)
    precioMin: 0, // Rango de precio mínimo
    precioMax: Infinity, // Rango de precio máximo
    camas: 0, // Cantidad mínima de dormitorios (0 = Cualquiera)
    camasExactas: false, // Switch de coincidencia exacta para dormitorios
    baños: 0, // Cantidad mínima de baños completos
    //  ¡Corregido! Incluimos TODOS los tipos reales de tu catálogo LOV_tipo_propiedad
    tiposPropiedad: new Set(['Casa', 'Departamento', 'Terreno', 'Local', 'Oficina', 'Edificio', 'Lote']) 
}; // <--Aqui finaliza Objeto state.filtros reestructurado

// ALIAS DE SEGURIDAD ARQUITECTÓNICA SRE (BLINDAJE ANTIDESFASE)
// Mapea y unifica todas las variaciones ortográficas de la tubería central.
// Elimina de raíz los errores sintácticos de consola por falta de tildes o mayúsculas.
if (typeof ejecutarTuberiaSincronizada === 'function') 
{ // -->Aqui inicia Condicional alias de seguridad SRE
    window.ejecutarTuberíaSincronizada = ejecutarTuberiaSincronizada;
    window.ejecutarTuberiasincronizada = ejecutarTuberiaSincronizada;
    window.ejecutarTuberiaSincronizada = ejecutarTuberiaSincronizada;
} // <--Aqui finaliza Condicional alias de seguridad SRE

// PARTE: 2-5 (NORMALIZACIÓN RELACIONAL RESTRUCTURADA DE PRODUCCIÓN)
/**
* REGLAS DE NEGOCIO PARA CRUCE DE TABLAS (GOOGLE SHEETS -> STATE)
* Consume el arreglo unificado 'fotos' y el sub-objeto 'specs' directamente desde el backend.
*/
function normalizarPropiedadProduccion(prop) 
{ // -->Aqui inicia Función normalizarPropiedadProduccion
    const id = prop.id || prop.propiedad_id || String(Math.random());
    
    // 1. Extraer la galería unificada que ya viene procesada con éxito desde Código.gs
    const fotosUnicas = Array.isArray(prop.fotos) && prop.fotos.length > 0 ? prop.fotos : ['https://cloudinary.com'];

    // 2. Clasificación exacta basada en las columnas de las Sheets
    let estadoZillow = 'Venta';
    const publicacion = String(prop.estado_publicacion || "").trim();
    if (publicacion === 'vendida' || publicacion === 'vendido') 
    { // -->Aqui inicia Condicional asignación Vendido
        estadoZillow = 'Vendido';
    } // <--Aqui finaliza Condicional asignación Vendido
    else if (publicacion === 'alquiler') 
    { // -->Aqui inicia Condicional asignación Alquiler
        estadoZillow = 'Alquiler';
    } // <--Aqui finaliza Condicional asignación Alquiler
    else if (publicacion === 'venta') 
    { // -->Aqui inicia Condicional asignación Venta
        estadoZillow = 'Venta';
    } // <--Aqui finaliza Condicional asignación Venta

    // 3. Retorno simétrico inmutable acoplado al Join de tu backend relacional
    return { // -->Aqui inicia Objeto de retorno normalizarPropiedadProduccion
        id: String(id),
        anuncio_id: String(prop.anuncio_id || ""),
        titulo: String(prop.titulo || 'Inmueble Premium').trim(),
        precio_base: parseFloat(prop.precio_base || 0),
        tipo_propiedad: String(prop.tipo_propiedad || 'Casa').trim(),
        estado_publicacion: estadoZillow,
        fotos: fotosUnicas,
        latitud: parseFloat(prop.latitud || -12.125),
        longitud: parseFloat(prop.longitud || -76.995),
        telefono: String(prop.telefono || "").trim(),
        contacto_nombre: String(prop.contacto_nombre || 'Contacto').trim(),
        specs: 
        { // -->Aqui inicia Sub-objeto specs
            habitaciones: parseInt(prop.specs?.habitaciones || 3),
            banos: parseFloat(prop.specs?.banos || 2),
            area_construida: parseFloat(prop.specs?.area_construida || 120),
            sotano: String(prop.specs?.sotano || 'no'),
            almacen: String(prop.specs?.almacen || 'no'),
            vista: String(prop.specs?.vista || 'Interna')
        } // <--Aqui finaliza Sub-objeto specs
    }; // <--Aqui finaliza Objeto de retorno normalizarPropiedadProduccion
} // <--Aqui finaliza Función normalizarPropiedadProduccion

function formatearPrecioCompacto(precio) 
{ // -->Aqui inicia Función formatearPrecioCompacto
    if (precio >= 1000000) return `$. ${(precio / 1000000).toFixed(2)}M`;
    if (precio >= 1000) return `$. ${(precio / 1000).toFixed(0)}K`;
    return `$. ${precio}`;
} // <--Aqui finaliza Función formatearPrecioCompacto


// CONSTRUCTOR SEMÁNTICO DEL MICRO-CARRUSEL (SRE PRODUCTION - CERO ESTILOS EN JS)
function construirRielCarruselComponente(propiedad, esPopup = false) 
{ // -->Aqui inicia Función construirRielCarruselComponente
    const contenedorFoto = document.createElement('div');
    contenedorFoto.className = esPopup ? 'contenedor-foto popup-carrusel-context' : 'contenedor-foto';

    const rielCarrusel = document.createElement('div');
    rielCarrusel.className = 'carrusel-imagenes';
    // Establecemos el estado inicial del índice mediante un atributo de datos nativo
    rielCarrusel.setAttribute('data-foto-activa', '0');
    contenedorFoto.appendChild(rielCarrusel);

    const totalFotos = Math.min(propiedad.fotos.length, 5);
    const dotsArray = [];

    const contenedorDots = document.createElement('div');
    contenedorDots.className = 'indicadores-carrusel';

    for (let i = 0; i < totalFotos; i++) 
    { // -->Aqui inicia Ciclo for renderizar fotos e indicadores
        const img = document.createElement('img');
        img.src = propiedad.fotos[i];
        img.alt = `${propiedad.titulo} - Vista ${i + 1}`;
        rielCarrusel.appendChild(img);

        const dot = document.createElement('span');
        dot.className = i === 0 ? 'punto-indicator activo' : 'punto-indicator';
        contenedorDots.appendChild(dot);
        // =========================================================================
        // BUENAS PRÁCTICAS SRE: BOTÓN DE CORAZÓN "ME GUSTA" INTEGRADO AL CONTENEDOR
        // =========================================================================
        contenedorFoto.style.position = 'relative';

        const botonCorazon = document.createElement('button');
        botonCorazon.innerHTML = '🤍';
        botonCorazon.style.position = 'absolute';
        botonCorazon.style.top = '12px';
        botonCorazon.style.right = '12px';
        botonCorazon.style.background = 'rgba(0, 0, 0, 0.35)';
        botonCorazon.style.border = 'none';
        botonCorazon.style.borderRadius = '50%';
        botonCorazon.style.width = '30px';
        botonCorazon.style.height = '30px';
        botonCorazon.style.cursor = 'pointer';
        botonCorazon.style.fontSize = '15px';
        botonCorazon.style.display = 'flex';
        botonCorazon.style.alignItems = 'center';
        botonCorazon.style.justifyContent = 'center';
        botonCorazon.style.zIndex = '10';
        botonCorazon.style.transition = 'background 0.2s, transform 0.1s';

        // Evento interactivo para cambiar el estado del corazón al hacer clic
        botonCorazon.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita clics no deseados hacia la tarjeta base
            if (botonCorazon.innerHTML === '🤍') {
                botonCorazon.innerHTML = '❤️';
                botonCorazon.style.background = 'rgba(255, 255, 255, 0.9)';
            } else {
                botonCorazon.innerHTML = '🤍';
                botonCorazon.style.background = 'rgba(0, 0, 0, 0.35)';
            }
        });

        contenedorFoto.appendChild(botonCorazon);

        dotsArray.push(dot);
    } // <--Aqui finaliza Ciclo for renderizar fotos e indicadores
    contenedorFoto.appendChild(contenedorDots);

    if (totalFotos > 1) 
    { // -->Aqui inicia Condicional si tiene más de 1 foto
        let indiceFotoActual = 0;

        const btnlzq = document.createElement('button');
        btnlzq.className = 'flecha-carrusel flecha-izq';
        btnlzq.textContent = '<';

        const btnDer = document.createElement('button');
        btnDer.className = 'flecha-carrusel flecha-der';
        btnDer.textContent = '>';

        const desplazarRiel = (direction) => 
        { // -->Aqui inicia Función flecha desplazarRiel
            // Aritmética modular para navegación circular infinita
            indiceFotoActual = (indiceFotoActual + direction + totalFotos) % totalFotos;
            // Pasamos el control al CSS: actualizamos el atributo sin inyectar estilos en línea
            rielCarrusel.setAttribute('data-foto-activa', String(indiceFotoActual));
            
            // Sincronizar los puntos indicadores (dots) cambiando clases semánticas
            dotsArray.forEach((d, idx) => 
            { // -->Aqui inicia Callback forEach sincronizar puntos
                if (idx === indiceFotoActual) d.classList.add('activo');
                else d.classList.remove('activo');
            }); // <--Aqui finaliza Callback forEach sincronizar puntos
        }; // <--Aqui finaliza Función flecha desplazarRiel

        const clicklzq = (e) => { e.stopPropagation(); desplazarRiel(-1); };
        const clickDer = (e) => { e.stopPropagation(); desplazarRiel(1); };

        btnlzq.addEventListener('click', clicklzq);
        btnDer.addEventListener('click', clickDer);

        // Registro explícito en el Garbage Collector para evitar fugas de memoria
        state.limpiadoresDOM.set(`\${propiedad.id}_arrows`, () => 
        { // -->Aqui inicia Callback Garbage Collector flechas carrusel
            btnlzq.removeEventListener('click', clicklzq);
            btnDer.removeEventListener('click', clickDer);
        }); // <--Aqui finaliza Callback Garbage Collector flechas carrusel

        contenedorFoto.appendChild(btnlzq);
        contenedorFoto.appendChild(btnDer);
    } // <--Aqui finaliza Condicional si tiene más de 1 foto

    return contenedorFoto;
} // <--Aqui finaliza Función construirRielCarruselComponente

// FÁBRICA ATÓMICA DE TARJETAS PARA EL CATÁLOGO DERECHO (SRE PRODUCTION)
function crearComponenteTarjetaZillow(propiedad) 
{ // -->Aqui inicia Función crearComponenteTarjetaZillow
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-casa';
    tarjeta.setAttribute('data-id', propiedad.id);

    // 1. Instanciamos el viewport rígido del carrusel unificado de Cloudinary
    const contenedorVisualFoto = construirRielCarruselComponente(propiedad, false);
    tarjeta.appendChild(contenedorVisualFoto);

    // 2. Interceptor SPA inmutable hacia la Ficha de Detalle (Pantalla 2)
    const clickSPAHandler = (e) => 
    { // -->Aqui inicia Callback clickSPAHandler de la tarjeta
        if (e.target.closest('.flecha-carrusel') || e.target.closest('.corazon-favorito')) return;
        // Cerramos popups activos consumiendo el estado encapsulado seguro
        if (state.mapa) state.mapa.closePopup();
        state.propiedadSeleccionadald = propiedad.id;
        alternarPantallaZillow('detalle-ficha');
        renderizarFichaDetalleZillow(propiedad);
    }; // <--Aqui finaliza Callback clickSPAHandler de la tarjeta

    contenedorVisualFoto.addEventListener('click', clickSPAHandler);

    // 3. Bloque Inferior de Contenido de Texto Plano Puro (Blindado contra XSS)
    const datosCasa = document.createElement('div');
    datosCasa.className = 'datos-casa';
    datosCasa.style.padding = '12px';
    
    const precioTexto = document.createElement('div');
    precioTexto.className = 'precio';
    precioTexto.style.fontSize = '18px';
    precioTexto.style.fontWeight = 'bold';
    // Mapeo simétrico en Dólares USD de acuerdo a tu Sheets real
    precioTexto.textContent = propiedad.precio.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    datosCasa.appendChild(precioTexto);

        // 2. Especificaciones de Habitaciones, Baños y Terrenos
    const specsTexto = document.createElement('div');
    specsTexto.style.fontSize = '13px';
    specsTexto.style.color = '#475569';
    specsTexto.style.marginTop = '4px';
    specsTexto.textContent = `${propiedad.habitaciones} Dorm | ${propiedad.banos} Baños | AC: ${propiedad.area_construida} m² | AT: ${propiedad.area_terreno} m²`;
    datosCasa.appendChild(specsTexto);

    // 3. Nuevos Campos complementarios
    const adicionalesTexto = document.createElement('div');
    adicionalesTexto.style.fontSize = '12px';
    adicionalesTexto.style.color = '#64748b';
    adicionalesTexto.style.marginTop = '2px';
    adicionalesTexto.textContent = `${propiedad.subtipoPropiedad} | Estacionamientos: ${propiedad.estacionamientos} | Año: ${propiedad.ano_construccion} | Estado: ${propiedad.estado_propiedad}`;

    datosCasa.appendChild(adicionalesTexto);

    // 4. Frase Descriptiva / Título
    const tituloTexto = document.createElement('div');
    tituloTexto.style.fontSize = '14px';
    tituloTexto.style.color = '#1e293b';
    tituloTexto.style.fontWeight = '600';
    tituloTexto.style.marginTop = '4px';
    tituloTexto.textContent = propiedad.fraseDescriptiva;
    datosCasa.appendChild(tituloTexto);


    tarjeta.appendChild(datosCasa);

    // 4. Registro en el Garbage Collector interno para evitar Memory Leaks
    state.limpiadoresDOM.set(propiedad.id, () => 
    { // -->Aqui inicia Callback Garbage Collector de la tarjeta entera
        contenedorVisualFoto.removeEventListener('click', clickSPAHandler);
    }); // <--Aqui finaliza Callback Garbage Collector de la tarjeta entera

    return tarjeta;
} // <--Aqui finaliza Función crearComponenteTarjetaZillow

// PARTE: 5-5 (MOTOR DE BURBUJAS DE PRECIO DINÁMICAS NATIVAS EN MAPA - SRE REFACTOR)
// Mapea dinámicamente el color de los marcadores según tus estados reales: Azul, Naranja o Dorado.
function renderizarMapaZillow() 
{ // -->Aqui inicia Función renderizarMapaZillow
    if (typeof window.capaMarcadores === 'undefined') 
    { // -->Aqui inicia Condicional verificar capaMarcadores indefinida
        window.capaMarcadores = null;
    } // <--Aqui finaliza Condicional verificar capaMarcadores indefinida

    if (!window.map || !document.getElementById('map-instance')) return;

    if (!window.capaMarcadores) 
    { // -->Aqui inicia Condicional inicializar capa de marcadores
        window.capaMarcadores = L.layerGroup().addTo(window.map);
    } // <--Aqui finaliza Condicional inicializar capa de marcadores
    else 
    { // -->Aqui inicia Bloque else limpiar marcadores activos
        window.capaMarcadores.clearLayers();
    } // <--Aqui finaliza Bloque else limpiar marcadores activos

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);

    filtradas.forEach(prop => 
    { // -->Aqui inicia Callback forEach de propiedades filtradas en mapa
        if (!prop.latitud || !prop.longitud) return;

        const precioCompacto = formatearPrecioCompacto(prop.precio);
        const htmlBurbuja = `<span>${precioCompacto}</span>`;

        // DETERMINACIÓN DINÁMICA DE LA CLASE DE COLOR (Fiel al Excel sin mutaciones)
        const estadoPub = String(prop.estado_publicacion || "").trim();
        const tipoAnuncio = String(prop.tipo_anuncio || "").trim();

        // ---------------------------------------------------------------------
        // DETERMINACIÓN DINÁMICA DE LA CLASE DE COLOR (ESTRICTO SIN MINÚSCULAS)
        // ---------------------------------------------------------------------
        let claseColorBurbuja = "";

        if (prop.estado_publicacion === 'vendida') {
            claseColorBurbuja = 'vendido-dorado'; // Burbuja Dorada para históricas
        } else if (prop.estado_publicacion === 'disponible' && prop.tipo_anuncio === 'Alquiler') {
            claseColorBurbuja = 'alquiler-naranja'; // Burbuja Naranja para alquileres
        } else {
            claseColorBurbuja = 'venta-azul'; // Burbuja Azul por defecto para ventas disponibles
        }
        // ---------------------------------------------------------------------
     
        // Centrado geométrico nativo estricto mediante constructores L.point(80, 30) y L.point(40, 15)
        const iconoBurbuja = L.divIcon({ // -->Aqui inicia Configuración objeto divIcon Leaflet
            html: htmlBurbuja,
            className: `leaflet-marker-icon map-price-pill \${claseColorBurbuja}`,
            iconSize: L.point(80, 30),
            iconAnchor: L.point(40, 15)
        }); // <--Aqui finaliza Configuración objeto divIcon Leaflet

        const marcador = L.marker([prop.latitud, prop.longitud], { icon: iconoBurbuja });

        // 1. FABRICAMOS EL CONTENEDOR MODULAR ASILADO PARA EL POPUP (Preservado intacto)
        const contenedorPopupMaster = document.createElement('div');
        contenedorPopupMaster.className = 'tarjeta-casa popup-card';
        contenedorPopupMaster.style.width = '260px';

        // 2. INSTANCIAMOS EL MICRO-CARRUSEL DOBLE INTERACTIVO (Preservado intacto)
        const carruselPopup = construirRielCarruselComponente(prop, true);
        contenedorPopupMaster.appendChild(carruselPopup);

        // 3. BLOQUE DE DATOS INFERIOR INTERNO DEL POPUP (BLINDADO CONTRA XSS - Preservado intacto)
        const datosPopup = document.createElement('div');
        datosPopup.className = 'datos-casa';
        datosPopup.style.padding = '8px';

        const pPrice = document.createElement('div');
        pPrice.className = 'precio';
        pPrice.style.fontSize = '16px';
        pPrice.style.fontWeight = 'bold';
        pPrice.style.color = '#002E50';

        // FORMATEO MONETARIO FIEL (SRE REFACTOR): Configura el valor en Dólares Americanos ($ USD) alineado al Excel
        pPrice.textContent = prop.precio.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
        datosPopup.appendChild(pPrice);
                //  AGREGAR AQUÍ: Inyección de especificaciones técnicas (Dormitorios / Baños)
        const pSpecs = document.createElement('div');
        pSpecs.className = 'specs-popup';
        pSpecs.style.fontSize = '12px';
        pSpecs.style.color = '#475569';
        pSpecs.style.marginTop = '4px';
        pSpecs.textContent = `${prop.habitaciones} Dorm | ${prop.banos} Baños | ${prop.area_construida} m²`;
        datosPopup.appendChild(pSpecs);

        // 3. Fila de Datos Adicionales: Subtipo, Estacionamientos, Año y Estado del Inmueble
        const pAdicionales = document.createElement('div');
        pAdicionales.style.fontSize = '11px';
        pAdicionales.style.color = '#64748b';
        pAdicionales.style.marginTop = '2px';
        pAdicionales.textContent = `${prop.subtipoPropiedad} | Estacionamientos: ${prop.estacionamientos} | Año: ${prop.ano_construccion} | Estado: ${prop.estado_propiedad}`;

        
        //  AGREGAR AQUÍ: Inyección del título / dirección de la propiedad
        const pDireccion = document.createElement('div');
        pDireccion.className = 'direccion-popup';
        pDireccion.style.fontSize = '12px';
        pDireccion.style.color = '#1e293b';
        pDireccion.style.fontWeight = '500';
        pDireccion.textContent = prop.fraseDescriptiva; // Tu columna de título unificada
        datosPopup.appendChild(pDireccion);

        contenedorPopupMaster.appendChild(datosPopup);

        // =====================================================================
        // [SRE REFACTOR] - INTERCEPTOR ESTABLE Y ORDENAMIENTO EN VIVO EN RAM
        // =====================================================================
        
        // 1. Enlace nativo directo del Popup (Estabilizado sin inyecciones visuales en JS)
        marcador.bindPopup(contenedorPopupMaster, {
            maxWidth: 300,
            minWidth: 260,
            className: 'zillow-custom-popup-wrapper',
            autoPan: true,
            closeOnClick: false // <--- ESTO ELIMINA EL AUTOCIERRE POR PÉRDIDA DE FOCO DE RAÍZ
        });

   // 2. Escucha e Interceptor de clic para reorganizar el Catálogo Derecho
marcador.on('click', (e) => { // Apertura marcador.on('click'
    // Detiene la propagación para evitar conflictos con las capas del mapa
    L.DomEvent.stopPropagation(e);

    const idPropiedadActual = prop.id;

    // 1. Modificamos el orden en la memoria RAM de forma inmutable
    const indicePropiedad = state.propiedades.findIndex(p => p.id === idPropiedadActual);
    if (indicePropiedad > 0) { // Apertura if (indicePropiedad > 0)
        const [propiedadSeleccionada] = state.propiedades.splice(indicePropiedad, 1);
        state.propiedades.unshift(propiedadSeleccionada);
        // Mantener renderizarCatálogoTarjetas fuera si causa parpadeo en tu plantilla nativa
    } // Cierre if (indicePropiedad > 0)

    // 2. Desplazamiento visual suave hacia la tarjeta derecha existente sin destruir la UI
    const tarjetaDerecha = document.querySelector(`.tarjeta-casa[data-id="${idPropiedadActual}"]`);
    if (tarjetaDerecha) { // Apertura if (tarjetaDerecha)
        tarjetaDerecha.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Aplicamos el resalte estético oficial
        tarjetaDerecha.style.outline = '3px solid var(--azul-zillow)';
        tarjetaDerecha.style.borderRadius = '12px';
        
        // Limpieza del contorno al finalizar el enfoque
        setTimeout(() => { // Apertura setTimeout
            tarjetaDerecha.style.outline = 'none'; 
        }, 2000); // Cierre setTimeout
    } // Cierre if (tarjetaDerecha)

    // NOTA SENIOR: Se remueve por completo la navegación SPA de este bloque. 
    // La etiqueta del mapa abrirá de forma nativa con el carrusel y el mapa permanecerá visible.
}); // Cierre marcador.on('click'
     
        // 3. Bloqueador de rebotes interactivos para clics internos en el carrusel
        marcador.on('popupopen', (e) => {
            const popupElement = marcador.getPopup().getElement();
            if (popupElement) {
                // Detiene nativamente que el avance de fotos o toques cierren el marcador
                L.DomEvent.disableClickPropagation(popupElement);
                L.DomEvent.disableScrollPropagation(popupElement);
            }
        });

// 4. Redirección hacia la pantalla de detalle (Pantalla 3) al presionar la foto
carruselPopup.addEventListener('click', (e) => { // Apertura carruselPopup click
    e.stopPropagation();
    if (e.target.closest('.flecha-carrusel') || e.target.closest('.corazon-favorito')) return;
    
    if (window.map) window.map.closePopup();
    
    // Estandarización de puntero SRE
    state.propiedadSeleccionadald = prop.id;
    alternarPantallaZillow('detalle-ficha');
    
    const panelFichaDetalle = document.getElementById('contenedor-detalle-zillow');
    if (panelFichaDetalle) { // Apertura validación de panel
        panelFichaDetalle.innerHTML = ""; 
        // PASO CLAVE: Invocamos pasando 'prop' de forma idéntica a tu bucle mapeador
        renderizarFichaDetalleZillow(prop); 
    } // Cierre validación de panel
}); // Cierre definitivo carruselPopup click

        
        window.capaMarcadores.addLayer(marcador);
    }); // <--Aqui finaliza Callback forEach de propiedades filtradas en mapa
} // <--Aqui finaliza Función renderizarMapaZillow

/**
* RENDERIZADOR DE CATÁLOGO DERECHO Y CALLBACK PRINCIPAL DE RED (ESCONCOR)
* Utiliza DocumentFragment y libera explícitamente los Event Listeners viejos para evitar fugas de memoria.
*/
function renderizarCatálogoTarjetas() 
{ // -->Aqui inicia Función renderizarCatálogoTarjetas
    // Vinculación corregida apuntando de forma natural al ID: 'properties-grid-target'
    const contenedorRejilla = document.getElementById('properties-grid-target');
    if (!contenedorRejilla) return;

    // Garbage Collector interno activo: Remueve de la memoria RAM los Listeners de tarjetas previas
    while (contenedorRejilla.firstChild) 
    { // -->Aqui inicia Bucle while remover listeners antiguos
        const id = contenedorRejilla.firstChild.getAttribute('data-id');
        if (id && state.limpiadoresDOM.has(id)) 
        { // -->Aqui inicia Condicional ejecutar limpiador de listeners
            state.limpiadoresDOM.get(id)(); // Remoción limpia garantizada
        } // <--Aqui finaliza Condicional ejecutar limpiador de listeners
        state.limpiadoresDOM.delete(id);
        contenedorRejilla.removeChild(contenedorRejilla.firstChild);
    } // <--Aqui finaliza Bucle while remover listeners antiguos

    const fragmento = document.createDocumentFragment();
    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);

    // Inyección atómica de los nodos puros en el fragmento flotante
    filtradas.forEach(prop => 
    { // -->Aqui inicia Callback forEach inyección de tarjetas
        const tarjetaNode = crearComponenteTarjetaZillow(prop);
        fragmento.appendChild(tarjetaNode);
    }); // <--Aqui finaliza Callback forEach inyección de tarjetas

    contenedorRejilla.appendChild(fragmento);

    // Vinculación corregida apuntando de forma natural al ID contador: 'results-counter'
    const contador = document.getElementById('results-counter');
    if (contador) 
    { // -->Aqui inicia Condicional actualizar contador en pantalla
        contador.textContent = `${filtradas.length} resultados disponibles`;
    } // <--Aqui finaliza Condicional actualizar contador en pantalla
} // <--Aqui finaliza Función renderizarCatálogoTarjetas

/**
* ESPÍA CONTROLADO (Estrategia ESCONCOR): Callback de red global de Google Apps Script
*/
// PARTE: 5-5 (CALLBACK DE RED CON ESPÍA CABEZÓN ACTIVADO)
function procesarDatosDelMotor(data) 
{ // -->Aqui inicia Función procesarDatosDelMotor
    // ESPÍA CABEZÓN 1: Inspecciona el JSON crudo del Apps Script antes de tocarlo
    console.log("====================================================");
    console.warn(" [ESPÍA CABEZÓN 1] - RECIBIENDO DATOS CRUDOS DE GOOGLE SHEETS:");
    console.log("Estructura completa entrante:", data);
    
    if (data && data.propiedades) 
    { // -->Aqui inicia Condicional mostrar tabla interactiva
        console.table(data.propiedades); 
    } // <--Aqui finaliza Condicional mostrar tabla interactiva
    console.log("====================================================");

    if (!data || !data.propiedades || !Array.isArray(data.propiedades)) 
    { // -->Aqui inicia Condicional validar estructura rota
        console.error("X [ESPÍA CABEZÓN] - ERROR: Estructura del backend corrupta.");
        return;
    } // <--Aqui finaliza Condicional validar estructura rota

    // Ejecuta el mapeo relacional hacia Cloudinary
    state.propiedades = data.propiedades.map(normalizarPropiedad);

    // ESPÍA CABEZÓN 2: Inspecciona cómo quedó el estado protegido después de la limpieza
    console.log("====================================================");
    console.info(" [ESPÍA CABEZÓN 2] - ESTADO PURIFICADO EN MEMORIA RAM (STATE):");
    console.log("Arreglo procesado final:", state.propiedades);

    if (state.propiedades.length > 0) 
    { // -->Aqui inicia Condicional comprobar fotos del primer índice
        console.log(" REVISIÓN DE FOTOS DE LA PRIMERA CASA (PROP-001):");
        console.log("¿Qué tiene el arreglo de fotos adentro?:", state.propiedades[0].fotos);
    } // <--Aqui finaliza Condicional comprobar fotos del primer índice


    // Ejecuta el renderizado sincronizado de las vistas
    renderizarMapaZillow();
    renderizarCatálogoTarjetas();

    // Invoca el firewall pasando la lista y el correo del usuario logueado en Supabase
    interceptarFirewallSeguridadUsuario(data.usuarios, window.usuarioLogueado ? window.usuarioLogueado.email : "");
} // <--Aqui finaliza Función procesarDatosDelMotor

// Inicializador estructural del ecosistema al estar el árbol DOM listo
document.addEventListener("DOMContentLoaded", () => 
{ // -->Aqui inicia Callback principal DOMContentLoaded
        // Sincronización nativa con el ID real del contenedor del mapa: 'map-instance'
        if (typeof L !== 'undefined' && document.getElementById('map-instance')) 
        { // -->Aqui inicia Condicional inicializar mapa Leaflet
            window.map = L.map('map-instance', { zoomControl: true }).setView([-12.125, -76.995], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.map);
        } // <--Aqui finaliza Condicional inicializar mapa Leaflet

        //  ¡BUENAS PRÁCTICAS SRE! Retardo controlado para asegurar que el DOM y el Mapa estén listos
        setTimeout(() => {
            console.log("⏱️ [SRE] Inicializando eventos y listeners del ecosistema...");
            
            // 1. Enlazamos los eventos de los menús desplegables (Dropdowns)
            inicializarEventosDeFiltros();

            // ===================================================================
            // ENLACE AGREGADO: Inicializa los listeners de tus nuevos popups
            // ===================================================================
            //inicializarEventosPopups();
            
            // 2. Sincroniza dinámicamente las burbujas al arrastrar o cambiar el zoom del mapa
            if (window.map) {
                window.map.on('moveend', renderizarMapaZillow);
            }
            
            // 3. Disparo inicial asincronizado de red para traer los datos del Excel
            cargarDatosDesdeAppsScript();
            
        }, 100);

    }); // <--Aqui finaliza Callback principal DOMContentLoaded

// PARTE: 6-5 (MOTOR REACTIVO DE INTERFAZ Y MENÚS FLOTANTES)
function inicializarEventosDeFiltros() 
{ // -->Aqui inicia Función inicializarEventosDeFiltros


    // =========================================================================
    // 1. CONTROL EXCLUSIVO DE PANELES DESPLEGABLES (DROPDOWNS) - SOLUCIÓN ANTIBUCLE
    // =========================================================================
    const wrappers = document.querySelectorAll('.filter-dropdown-wrapper');
    
    wrappers.forEach(wrapper => {
        const boton = wrapper.querySelector('.filter-btn');
        const panel = wrapper.querySelector('.dropdown-content-panel');
        if (!boton || !panel) return;

        boton.addEventListener('click', (e) => {
            // Evitamos que el clic se propague y active el cierre global por error
            e.stopPropagation();
            
            // ¡REGLA DE EXCLUSIVIDAD! Cerramos todos los demás paneles antes de abrir el actual
            document.querySelectorAll('.dropdown-content-panel').forEach(p => {
                if (p !== panel) p.classList.remove('show');
            });
            document.querySelectorAll('.filter-btn').forEach(b => {
                if (b !== boton) b.classList.remove('active');
            });

            // Alternamos únicamente el estado del panel al que le hicimos clic
            panel.classList.toggle('show');
            boton.classList.toggle('active');
        });
    });


    // Cierre natural al hacer clic en cualquier zona vacía de la pantalla
    document.addEventListener('click', () => 
    { // -->Aqui inicia Callback clic fuera de los filtros
        document.querySelectorAll('.dropdown-content-panel').forEach(p => p.classList.remove('show'));
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    }); // <--Aqui finaliza Callback clic fuera de los filtros

    // Evita que el menú se cierre solo al interactuar con los controles internos
    document.querySelectorAll('.dropdown-content-panel').forEach(panel => 
    { // -->Aqui inicia Callback forEach proteger clics internos del panel
        panel.addEventListener('click', (e) => e.stopPropagation());
    }); // <--Aqui finaliza Callback forEach proteger clics internos del panel

    // 2. FILTRO 2: CAPTURA REACTIVA DEL TIPO DE TRANSACCIÓN (SRE REFACTOR)
    const radiosTransaccion = document.querySelectorAll('input[name="transaccion"]');
    radiosTransaccion.forEach(radio => 
    { // -->Aqui inicia Callback forEach botones de radio de tipo de transacción
        radio.addEventListener('change', (e) => 
        { // -->Aqui inicia Callback al cambiar el radio de la transacción
            state.filtros.estado = e.target.value;
            const btnStatus = document.getElementById('btn-filter-status');
            if (btnStatus) 
            { // -->Aqui inicia Condicional cambiar etiqueta del header
                if (e.target.value === "Venta") btnStatus.textContent = "En venta ▾";
                else if (e.target.value === "Alquiler") btnStatus.textContent = "Para el alquiler ▾";
                else if (e.target.value === "Vendido") btnStatus.textContent = "Vendidas ▾";
            } // <--Aqui finaliza Condicional cambiar etiqueta del header
            
            const panelDropdown = document.getElementById('dropdown-status');
            if (panelDropdown) panelDropdown.classList.remove('show', 'active');
            
            if (typeof ejecutarTuberiaSincronizada === 'function') ejecutarTuberiaSincronizada();
            else renderizarMapaZillow();
        }); // <--Aqui finaliza Callback al cambiar el radio de la transacción
    }); // <--Aqui finaliza Callback forEach botones de radio de tipo de transacción

    // 3. FILTRO 3: CAPTURA DEL RANGO DE PRECIOS
    const inputMinPrecio = document.getElementById('price-min');
    const inputMaxPrecio = document.getElementById('price-max');
    const handlerPrecios = () => 
    { // -->Aqui inicia Callback handlerPrecios de las cajas numéricas
        state.filtros.precioMin = parseFloat(inputMinPrecio.value) || 0;
        state.filtros.precioMax = parseFloat(inputMaxPrecio.value) || Infinity;
        if (typeof ejecutarTuberiaSincronizada === 'function') ejecutarTuberiaSincronizada();
    }; // <--Aqui finaliza Callback handlerPrecios de las cajas numéricas

    if (inputMinPrecio) inputMinPrecio.addEventListener('input', handlerPrecios);
    if (inputMaxPrecio) inputMaxPrecio.addEventListener('input', handlerPrecios);

    // 4. FILTRO 4: CONTROL SEGMENTADO DE CAMAS Y BAÑOS
    if (typeof configurarSegmentado === 'function') 
    { // -->Aqui inicia Condicional validar existencia del helper segmentado
        configurarSegmentado('row-beds', (valor) => 
        { // -->Aqui inicia Callback segmentar cantidad de habitaciones
            state.filtros.camas = parseInt(valor) || 0;
            if (typeof ejecutarTuberiaSincronizada === 'function') ejecutarTuberiaSincronizada();
        }); // <--Aqui finaliza Callback segmentar cantidad de habitaciones

        configurarSegmentado('row-baths', (valor) => 
        { // -->Aqui inicia Callback segmentar cantidad de baños
            state.filtros.baños = parseFloat(valor) || 0;
            if (typeof ejecutarTuberiaSincronizada === 'function') ejecutarTuberiaSincronizada();
        }); // <--Aqui finaliza Callback segmentar cantidad de baños
    } // <--Aqui finaliza Condicional validar existencia del helper segmentado

    const checkCamasExactas = document.getElementById('beds-exact');
    if (checkCamasExactas) 
    { // -->Aqui inicia Condicional listener interruptor exacto
        checkCamasExactas.addEventListener('change', (e) => 
        { // -->Aqui inicia Callback cambiar coincidencia exacta
            state.filtros.camasExactas = e.target.checked;
            if (typeof ejecutarTuberiaSincronizada === 'function') ejecutarTuberiaSincronizada();
        }); // <--Aqui finaliza Callback cambiar coincidencia exacta
    } // <--Aqui finaliza Condicional listener interruptor exacto

    // 5. FILTRO 5: TIPO DE PROPIEDAD (CHECKBOXES MULTISELECT)
    const checkSelectAll = document.getElementById('type-select-all');
    const checkboxesTipo = document.querySelectorAll('.type-cb');

    if (checkSelectAll) 
    { // -->Aqui inicia Condicional listener seleccionar todos
        checkSelectAll.addEventListener('change', (e) => 
        { // -->Aqui inicia Callback marcar/desmarcar todos los tipos
            checkboxesTipo.forEach(cb => 
            { // -->Aqui inicia Callback forEach sincronizar checkboxes
                cb.checked = e.target.checked;
                if (e.target.checked) state.filtros.tiposPropiedad.add(cb.value);
                else state.filtros.tiposPropiedad.delete(cb.value);
            }); // <--Aqui finaliza Callback forEach sincronizar checkboxes
            if (typeof ejecutarTuberiaSincronizada === 'function') ejecutarTuberiaSincronizada();
        }); // <--Aqui finaliza Callback marcar/desmarcar todos los tipos
    } // <--Aqui finaliza Condicional listener seleccionar todos

    checkboxesTipo.forEach(cb => 
    { // -->Aqui inicia Callback forEach enlaces individuales multiselect
        cb.addEventListener('change', (e) => 
        { // -->Aqui inicia Callback actualizar set de tipos de propiedad
            if (e.target.checked) state.filtros.tiposPropiedad.add(e.target.value);
            else state.filtros.tiposPropiedad.delete(e.target.value);
            
            if (!e.target.checked && checkSelectAll) checkSelectAll.checked = false;
            if (typeof ejecutarTuberiaSincronizada === 'function') ejecutarTuberiaSincronizada();
        }); // <--Aqui finaliza Callback actualizar set de tipos de propiedad
    }); // <--Aqui finaliza Callback forEach enlaces individuales multiselect

    // 6. BOTONES DE ACCIÓN: Limpiador maestro y aplicador del menú expandido
    // =========================================================================
    // 6. REINICIALIZACIÓN SIMÉTRICA Y LIMPIEZA MAESTRA DE FILTROS (CORREGIDO)
    // =========================================================================
    const btnReset = document.getElementById('master-reset-btn');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            // Restablecemos los componentes visuales del HTML de forma limpia
            if (inputMinPrecio) inputMinPrecio.value = "";
            if (inputMaxPrecio) inputMaxPrecio.value = ""; // Vaciamos para que asuma cualquier monto
            if (checkSelectAll) checkSelectAll.checked = true;
            
            if (checkboxesTipo) {
                checkboxesTipo.forEach(cb => {
                    cb.checked = true;
                    state.filtros.tiposPropiedad.add(cb.value);
                });
            }

            // Inicializamos la memoria RAM liberando los topes monetarios fijos
            state.filtros.precioMin = 0;
            state.filtros.precioMax = Infinity; // Permite que cualquier propiedad pase el filtro sin trabarse
            
            // Forzamos el redibujado instantáneo de la rejilla y marcadores
            if (typeof ejecutarTuberiaSincronizada === 'function') {
                ejecutarTuberiaSincronizada();
            }
        });
    }

    
    const btnApply = document.getElementById('master-apply-btn');
    if (btnApply) 
    { // -->Aqui inicia Condicional listener cerrar panel interactivo
        btnApply.addEventListener('click', () => 
        { // -->Aqui inicia Callback click botón aplicar
            document.querySelectorAll('.dropdown-content-panel').forEach(p => p.classList.remove('show'));
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            if (typeof ejecutarTuberiaSincronizada === 'function') ejecutarTuberiaSincronizada();
        }); // <--Aqui finaliza Callback click botón aplicar
    } // <--Aqui finaliza Condicional listener cerrar panel interactivo
   
    // =========================================================================
    // BUENAS PRÁCTICAS SRE: MOTOR ÚNICO DE REDIRECCIÓN CARTOGRÁFICA POR FILTRO
    // =========================================================================
    const inputDireccionNode = document.getElementById('search-address');
    
    if (inputDireccionNode) {
        let debounceTimer;
        
        inputDireccionNode.addEventListener('input', (e) => {
            const direccionTexto = e.target.value.trim();
            clearTimeout(debounceTimer);
            
            // Filtro de seguridad inicial: evita consultas innecesarias con textos cortos
            if (direccionTexto.length < 4) return;
            
            // Debounce de 800ms: espera a que el usuario termine de escribir antes de consultar la API
            debounceTimer = setTimeout(() => {
                if (window.ultimaDireccionBuscada === direccionTexto) return;
                window.ultimaDireccionBuscada = direccionTexto;
                
                console.log("🔍 [MOTOR GEOCODING] Buscando ubicación para:", direccionTexto);
                const urlNominatim = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(direccionTexto) + "&countrycodes=pe&limit=1";
                
                
                fetch(urlNominatim)
                    .then(res => res.json())
                    .then(resultados => {
                        // Verificación estricta de la estructura del arreglo devuelto por OpenStreetMap
                        if (resultados && resultados.length > 0) {
                            const lugar = resultados[0]; // Extrae limpiamente el primer resultado válido
                            const lat = parseFloat(lugar.lat);
                            const lon = parseFloat(lugar.lon);
                            
                            if (window.map) {
                                console.log("📍 [MOTOR GEOCODING] Redirigiendo mapa a con éxito:", lat, lon);
                                window.map.flyTo([lat, lon], 14, { animate: true, duration: 1.5 });
                            }
                        } else {
                            console.warn("⚠️ [MOTOR GEOCODING] No se encontraron coordenadas para esta dirección.");
                        }
                    })
                    .catch(err => console.error("❌ [MOTOR GEOCODING] Error de conexión con el servidor cartográfico:", err));
            }, 800);
        });
    }
    
} // <--Aqui finaliza Función inicializarEventosDeFiltros


/**
 * FUNCIÓN: alternarPantallaZillow
 * DESCRIPCIÓN: Controlador maestro de navegación SPA. Administra clases de visibilidad
 *              y asegura que los contenedores queden limpios y listos para el renderizado.
 */
function alternarPantallaZillow(pantalla) { // Apertura alternarPantallaZillow
    const contenedorSplit = document.querySelector('.split-view');
    let contenedorDetalle = document.getElementById('contenedor-detalle-zillow');
    const vistaGaleria = document.getElementById('vista-galeria-expandida');
    const headerGlobal = document.getElementById('header-ficha-global'); 

    // CASO 1: ACTIVAR SEGUNDA O TERCERA PANTALLA
    if (pantalla === 'galeria-expandida' || pantalla === 'detalle-ficha') { // Apertura IF Principal
        
        // Encendemos de inmediato la cabecera fija superior global
        if (headerGlobal) { // Apertura if (headerGlobal)
            headerGlobal.classList.remove('oculta-global');
        } // Cierre if (headerGlobal)
        
        // Transición específica a la... Tercera Pantalla (Galería en Mosaico)
        if (pantalla === 'galeria-expandida') { // Apertura IF Galería
            if (contenedorSplit) contenedorSplit.classList.add('hidden-layout');
            if (contenedorDetalle) contenedorDetalle.classList.add('hidden');
            if (vistaGaleria) vistaGaleria.classList.remove('oculta');
        } // Cierre IF Galería
        // Transición específica a la... Segunda Pantalla (Ficha Detalle SPA)
        else { // Apertura ELSE Detalle
            if (contenedorSplit) contenedorSplit.classList.add('hidden-layout');
            if (contenedorDetalle) { // Apertura IF Detalle Panel
                contenedorDetalle.classList.remove('hidden');
                contenedorDetalle.classList.add('visible-panel');
                
                // Compensación milimétrica para pasar por debajo del encabezado fijo de 60px
                contenedorDetalle.style.paddingTop = "60px"; 
            } // Cierre IF Detalle Panel
            if (vistaGaleria) vistaGaleria.classList.add('oculta');
        } // Cierre ELSE Detalle

    } // Cierre IF Principal
    // CASO 2: RETORNO AL MAPA BASE (Primera Pantalla)
    else { // Apertura ELSE Retorno Mapa
        
        // Apagamos firmemente la cabecera comercial para que no tape los filtros del buscador inicial
        if (headerGlobal) { // Apertura if (headerGlobal)
            headerGlobal.classList.add('oculta-global');
        } // Cierre if (headerGlobal)
        
        // Restauramos los paneles iniciales del mapa de Leaflet
        if (contenedorSplit) contenedorSplit.classList.remove('hidden-layout');
        if (contenedorDetalle) { // Apertura IF Ocultar Panel Detalle
            contenedorDetalle.classList.add('hidden');
            contenedorDetalle.classList.remove('visible-panel');
            contenedorDetalle.style.paddingTop = "0px";
        } // Cierre IF Ocultar Panel Detalle
        if (vistaGaleria) vistaGaleria.classList.add('oculta');

    } // Cierre ELSE Retorno Mapa
} // Cierre definitivo alternarPantallaZillow

/**
 * FUNCIÓN: renderizarFichaDetalleZillow (ESTANDARIZADA SRE)
 * DESCRIPCIÓN: Construye dinámicamente el layout de imágenes y la metadata comercial
 *              utilizando únicamente la variable estandarizada 'prop' alineada al Sheets.
 */
function renderizarFichaDetalleZillow(prop) { // Apertura renderizarFichaDetalleZillow con variable unificada 'prop'
    // Captura estricta del contenedor SPA oficial de la segunda pantalla
    const panelFicha = document.getElementById('contenedor-detalle-zillow');
    if (!panelFicha) return;
    
    // Limpieza purista total para recibir el nuevo inmueble seleccionado
    panelFicha.innerHTML = ""; 

    // 1. SINCRONIZACIÓN INMEDIATA DE LOS BOTONES DE LA CABECERA GLOBAL FIJA
    const btnCompartirGlobal = document.getElementById("btn-compartir-global");
    const btnFavoritoGlobal = document.getElementById("btn-favorito-global");
    const iconCorazonGlobal = document.getElementById("icon-corazon-global");
    const textFavoritoGlobal = document.getElementById("text-favorito-global");

    // Seteamos el estado visual inicial del corazón basado en la RAM
    if (state && state.favoritos && iconCorazonGlobal && textFavoritoGlobal) { // Apertura validación favoritos
        const esFavoritoActivo = state.favoritos.has(prop.id);
        if (iconCorazonGlobal) iconCorazonGlobal.textContent = esFavoritoActivo ? "❤️" : "♡";
        if (textFavoritoGlobal) textFavoritoGlobal.textContent = esFavoritoActivo ? "Ahorrado" : "Ahorrar";
        if (btnFavoritoGlobal) {
            if (esFavoritoActivo) btnFavoritoGlobal.classList.add("favorito-salvado");
            else btnFavoritoGlobal.classList.remove("favorito-salvado");
        }
    } // Cierre validación favoritos

    // 2. CONSTRUCCIÓN DEL MOSAICO DE IMÁGENES (SPLIT 50/50)
    const contenedorMosaico = document.createElement('div');
    contenedorMosaico.className = 'mosaico-galeria-zillow';

    // Panel Izquierdo: Foto Principal Grande
    const bloquelzquierdo = document.createElement('div');
    bloquelzquierdo.className = 'bloque-foto-principal';
    const imgPrincipal = document.createElement('img');
    imgPrincipal.src = prop.fotos && prop.fotos[0] ? prop.fotos[0] : "https://cloudinary.com";
    imgPrincipal.alt = prop.titulo || "Inmueble Principal";
    bloquelzquierdo.appendChild(imgPrincipal);
    contenedorMosaico.appendChild(bloquelzquierdo);

    // Panel Derecho: Matriz Grid 2x2 para Miniaturas
    const bloqueDerechoGrid = document.createElement('div');
    bloqueDerechoGrid.className = 'bloque-secundarias-grid';

    // Bucle unificado para rellenar las 4 fotos secundarias fijas
    for (let i = 1; i < 5; i++) { // Apertura ciclo fotos secundarias
        const cajaMinifoto = document.createElement('div');
        cajaMinifoto.className = 'caja-minifoto-item';
        
        const imgSec = document.createElement('img');
        // Consumimos el arreglo plano 'prop.fotos' estandarizado de Cloudinary
        imgSec.src = prop.fotos && prop.fotos[i] ? prop.fotos[i] : (prop.fotos && prop.fotos[0] ? prop.fotos[0] : "https://cloudinary.com");
        imgSec.alt = `Vista secundaria ${i}`;
        cajaMinifoto.appendChild(imgSec);

        // Inyección atómica del botón interactivo comercial en la última celda del grid (Índice 4 del bucle)
        if (i === 4) { // Apertura inyección botón ver más
            const btnVerMas = document.createElement('button');
            btnVerMas.className = 'btn-ver-mas-fotos';
            btnVerMas.textContent = `Ver las ${prop.fotos ? prop.fotos.length : 0} fotos`;
            
            // Listener blindado para saltar a la Tercera Pantalla
            btnVerMas.addEventListener('click', (e) => { // Apertura clic ver más fotos
                e.stopPropagation();
                state.propiedadSeleccionadald = prop.id;
                alternarPantallaZillow('galeria-expandida');
                
                const contenedorMosaico3ra = document.getElementById("mosaico-imagenes-scroll");
                if (contenedorMosaico3ra && prop.fotos) { // Apertura llenado 3ra pantalla
                    contenedorMosaico3ra.innerHTML = ""; 
                    prop.fotos.forEach((urlFoto, idx) => {
                        const nodoImg = document.createElement('img');
                        nodoImg.src = urlFoto;
                        nodoImg.alt = `Foto de galería extendida ${idx + 1}`;
                        contenedorMosaico3ra.appendChild(nodoImg);
                    });
                } // Cierre llenado 3ra pantalla
            }); // Cierre clic ver más fotos
            cajaMinifoto.appendChild(btnVerMas);
        } // Cierre inyección botón ver más

        bloqueDerechoGrid.appendChild(cajaMinifoto);
    } // Cierre ciclo fotos secundarias

    contenedorMosaico.appendChild(bloqueDerechoGrid);
    panelFicha.appendChild(contenedorMosaico);

    // 3. BLOQUE DE INFORMACIÓN INFERIOR Y TEXTOS COMERCIALES
    const contenedorFichaDatos = document.createElement('div');
    contenedorFichaDatos.className = 'contenedor-ficha-datos-texto';

    const filaMetricas = document.createElement('div');
    filaMetricas.className = 'fila-metricas-zillow';

    // Inyección de precio basado en la raíz limpia (precio_base) de tu Sheets
    const spanPrecio = document.createElement('span');
    spanPrecio.className = 'texto-precio-ficha';
    spanPrecio.textContent = prop.precio_base 
        ? Number(prop.precio_base).toLocaleString('es-PE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) 
        : 'Precio a consultar';

    // Inyección de especificaciones técnicas directo de la raíz purificada
    const spanSpecs = document.createElement('span');
    spanSpecs.className = 'texto-specs-ficha';
    spanSpecs.textContent = `${prop.specs?.habitaciones || 3} Dormitorios | ${prop.specs?.banos || 2} Baños | AC: ${prop.specs?.area_construida || 0} m²`;

    filaMetricas.appendChild(spanPrecio);
    filaMetricas.appendChild(spanSpecs);
    contenedorFichaDatos.appendChild(filaMetricas);

    // Fila de Dirección / Título
    const filaDireccion = document.createElement('div');
    filaDireccion.className = 'fila-direccion-ficha';
    filaDireccion.textContent = prop.titulo || "Inmueble Premium en Surco";
    contenedorFichaDatos.appendChild(filaDireccion);

    // Tarjeta estática de contacto con el agente
    const bloqueContacto = document.createElement('div');
    bloqueContacto.className = 'bloque-contacto-ficha';
    bloqueContacto.style.marginTop = '20px';
    bloqueContacto.style.padding = '16px';
    bloqueContacto.style.backgroundColor = '#f8fafc';
    bloqueContacto.style.borderRadius = '8px';
    bloqueContacto.style.border = '1px solid #e2e8f0';

    const labelContacto = document.createElement('div');
    labelContacto.style.fontWeight = 'bold';
    labelContacto.style.color = '#475569';
    labelContacto.style.fontSize = '14px';
    labelContacto.textContent = `Contacto Comercial: ${prop.contacto_nombre || 'Asesor Asignado'}`;
    bloqueContacto.appendChild(labelContacto);

    // Botón interactivo para ver teléfono con validador de Supabase integrado
    const btnVerTelefono = document.createElement('button');
    btnVerTelefono.className = 'filter-btn';
    btnVerTelefono.style.marginTop = '10px';
    btnVerTelefono.style.backgroundColor = '#006aff';
    btnVerTelefono.style.color = '#ffffff';
    btnVerTelefono.style.border = 'none';
    btnVerTelefono.style.padding = '8px 16px';
    btnVerTelefono.style.borderRadius = '4px';
    btnVerTelefono.style.cursor = 'pointer';
    btnVerTelefono.textContent = 'Ver número de teléfono';

    btnVerTelefono.addEventListener('click', () => { // Apertura clic verificar teléfono
        if (state.usuarioActual && state.usuarioActual.estado_cuenta === 'suspendido') { // Apertura bloqueo cuenta
            alert("Su cuenta ha sido suspendida por incumplir con las políticas de la aplicación. Por favor, contacte con soporte técnico.");
            return;
        } // Cierre bloqueo cuenta

        btnVerTelefono.textContent = prop.telefono ? prop.telefono : "Teléfono no disponible";
        btnVerTelefono.style.backgroundColor = '#002e50';
        btnVerTelefono.disabled = true;
    }); // Cierre clic verificar teléfono

    bloqueContacto.appendChild(btnVerTelefono);
    contenedorFichaDatos.appendChild(bloqueContacto);
    panelFicha.appendChild(contenedorFichaDatos);

} // Cierre definitivo de la función renderizarFichaDetalleZillow


function configurarSegmentado(idContenedor, callback) 
{ // -->Aqui inicia Función configurarSegmentado
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;
    contenedor.addEventListener('click', (e) => 
    { // -->Aqui inicia Callback clics en botones de control de barras fijas
        const botonNode = e.target.closest('.segmented-btn');
        if (!botonNode) return;
        contenedor.querySelectorAll('.segmented-btn').forEach(btn => btn.classList.remove('active'));
        botonNode.classList.add('active');
        const valorAtributo = botonNode.getAttribute('data-val');
        callback(valorAtributo);
    }); // <--Aqui finaliza Callback clics en botones de control de barras fijas
} // <--Aqui finaliza Función configurarSegmentado

// PARTE: 6-5 (MOTOR DE FILTRADO MULTIDIMENSIONAL INDESTRUCTIBLE Y FLEXIBLE)
function evaluarCriteriosDeFiltrado(prop)
{ // -->Aqui inicia Función evaluarCriteriosDeFiltrado
    const filtroTransaccion = state.filtros.estado || "Venta";
    const inputDireccionNode = document.getElementById('search-address');
   
    // =========================================================================
    // BUENAS PRÁCTICAS SRE: CORTOCIRCUITO TOTAL PARA BUSCADOR DE MAPAS
    // =========================================================================
    // Si hay texto en el input, asumimos que es una búsqueda de ubicación geográfica para el mapa.
    // Al forzar esta variable como vacía para la evaluación de datos, anulamos por completo
    // el filtro estricto de texto en la base de datos de RAM, permitiendo que las burbujas sigan vivas.
    const textoBuscarDireccion = ""; 
    
    // =========================================================================

    const columna_estado_publicacion = String(prop.estadoListado || "").trim();
    const columna_tipo_anuncio = String(prop.subtipoPropiedad || "").trim();
    const columna_titulo_direccion = String(prop.fraseDescriptiva || "").trim();

    console.warn(`[FILTRO DIAGNOSTIC] ID: ${prop.id} | estado_publicacion = "${columna_estado_publicacion}"`);


    // =========================================================================
    // SEGUNDO FILTRO: REGLA DE TRANSACCIÓN DIRECTA Y ESTRICTA (SIN MINÚSCULAS)
    // =========================================================================
    
    // Si el usuario hace clic en "Venta" o "En venta" en la interfaz de la web
    if (filtroTransaccion === "Venta" || filtroTransaccion === "En venta") { 
        // Pasa únicamente si tipo_anuncio es EXACTAMENTE "Venta" Y estado_publicacion es EXACTAMENTE "disponible"
        if (prop.tipo_anuncio !== "Venta" || prop.estado_publicacion !== "disponible") { 
            return false;
        } 
    } 
    // Si el usuario hace clic en "Alquiler" o "Para el alquiler" en la interfaz de la web
    else if (filtroTransaccion === "Alquiler" || filtroTransaccion === "Para el alquiler") {
        // Pasa únicamente si tipo_anuncio es EXACTAMENTE "Alquiler" Y estado_publicacion es EXACTAMENTE "disponible"
        if (prop.tipo_anuncio !== "Alquiler" || prop.estado_publicacion !== "disponible") {
            return false;
        }
    } 
    // Si el usuario hace clic en "Vendido" o "Vendidas" en la interfaz de la web
    else if (filtroTransaccion === "Vendido" || filtroTransaccion === "Vendidas") {
        // Pasa únicamente si el estado_publicacion es EXACTAMENTE "vendida"
        if (prop.estado_publicacion !== "vendida") {
            return false;
        }
    }

    
    // =========================================================================
    // PRIMER FILTRO: REGLA DE LOCALIDAD (CALLE / AV / DISTRITO) - SOLUCIÓN NATIVA
    // =========================================================================
    if (textoBuscarDireccion !== "") {
        // Compara de manera natural si el título del Excel contiene la palabra escrita por el usuario
        if (!columna_titulo_direccion.includes(textoBuscarDireccion)) {
            return false;
        }
    }

    if (prop.precio < state.filtros.precioMin || prop.precio > state.filtros.precioMax) 
    { // -->Aqui inicia Escape falso rango límite de precios
        return false;
    } // <--Aqui finaliza Escape falso rango límite de precios

    console.log(`%c ¡PROPIEDAD TOTALMENTE APROBADA! ID: \${prop.id} pasa al catálogo y mapa.`, "color: #008000; font-weight: bold;");
    return true;
} // <--Aqui finaliza Función evaluarCriteriosDeFiltrado

function ejecutarTuberiaSincronizada() 
{ // -->Aqui inicia Función ejecutarTuberiaSincronizada
    renderizarMapaZillow();
    renderizarCatálogoTarjetas();
} // <--Aqui finaliza Función ejecutarTuberiaSincronizada

function interceptarFirewallSeguridadUsuario(listaUsuariosBackend, emailUsuarioLogueado) 
{ // -->Aqui inicia Función interceptarFirewallSeguridadUsuario
    if (!emailUsuarioLogueado || !Array.isArray(listaUsuariosBackend)) 
    { // -->Aqui inicia Condicional salir por credenciales vacías
        state.usuarioActual = null;
        return;
    } // <--Aqui finaliza Condicional salir por credenciales vacías

    const usuarioEncontrado = listaUsuariosBackend.find(u => String(u.correo || u.email).trim().toLowerCase() === String(emailUsuarioLogueado).trim().toLowerCase());
    state.usuarioActual = usuarioEncontrado ? usuarioEncontrado : null;

    const idBanner = 'banner-suspension-global-id';
    let banner = document.getElementById(idBanner);

    if (state.usuarioActual && state.usuarioActual.estado_cuenta === 'suspendido') 
    { // -->Aqui inicia Condicional pintar banner si el usuario está penalizado
        if (!banner) 
        { // -->Aqui inicia Condicional crear nodo HTML del banner
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
            banner.textContent = "Su cuenta ha sido suspendida por violar las políticas de la aplicación.";
            document.body.prepend(banner);
        } // <--Aqui finaliza Condicional crear nodo HTML del banner
    } // <--Aqui finaliza Condicional pintar banner si el usuario está penalizado
    else 
    { // -->Aqui inicia Bloque else remover banner si está limpio
        if (banner) banner.remove();
    } // <--Aqui finaliza Bloque else remover banner si está limpio
} // <--Aqui finaliza Función interceptarFirewallSeguridadUsuario

/**
 * ========================================================================
 * MÓDULO SRE: CONTROLADOR DE POPUPS COMERCIALES DE ACCIÓN (PRODUCCIÓN)
 * Conexión asíncrona directa con la pestaña "visita" de Google Sheets.
 * ========================================================================
 */

function inicializarEventosPopups() {
    const btnTourGaleria = document.getElementById("btn-solicitar-tour-galeria");
    const btnAgenteGaleria = document.getElementById("btn-contactar-agente-galeria");

    if (btnTourGaleria) {
        btnTourGaleria.addEventListener("click", () => {
            const hoy = new Date();
            hoy.setDate(hoy.getDate() + 1);
            const inputFecha = document.getElementById("tour-fecha");
            if (inputFecha) inputFecha.min = hoy.toISOString().split('T');
            mostrarPopupAccion("modal-tour-comercial");
        });
    }

    if (btnAgenteGaleria) {
        btnAgenteGaleria.addEventListener("click", () => {
            mostrarPopupAccion("modal-agente-comercial");
            inyectarDatosPropiedadAlMensaje();
        });
    }

    const botonesCerrar = document.querySelectorAll(".modal-accion-overlay .btn-cerrar-popup");
    botonesCerrar.forEach((boton) => {
        boton.addEventListener("click", (e) => {
            const overlayAncestro = e.target.closest(".modal-accion-overlay");
            if (overlayAncestro) cerrarPopupAccion(overlayAncestro.id);
        });
    });

    window.addEventListener("click", (e) => {
        if (e.target === document.getElementById("modal-tour-comercial")) cerrarPopupAccion("modal-tour-comercial");
        if (e.target === document.getElementById("modal-agente-comercial")) cerrarPopupAccion("modal-agente-comercial");
    });

    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            cerrarPopupAccion("modal-tour-comercial");
            cerrarPopupAccion("modal-agente-comercial");
        }
    });

    const formTour = document.getElementById("form-solicitar-tour");
    const formAgente = document.getElementById("form-contactar-agente");

    if (formTour) formTour.addEventListener("submit", (e) => { procesarFormularioTour(e); });
    if (formAgente) formAgente.addEventListener("submit", (e) => { procesarFormularioAgente(e); });
}

function mostrarPopupAccion(idPopup) {
    const popupElemento = document.getElementById(idPopup);
    if (popupElemento) {
        popupElemento.classList.add("modal-activo");
        popupElemento.setAttribute("aria-hidden", "false");
    }
}

function cerrarPopupAccion(idPopup) {
    const popupElemento = document.getElementById(idPopup);
    if (popupElemento) {
        popupElemento.classList.remove("modal-activo");
        popupElemento.setAttribute("aria-hidden", "true");
    }
}

function inyectarDatosPropiedadAlMensaje() {
    const areaTextoMensaje = document.getElementById("agente-mensaje");
    if (areaTextoMensaje && state?.propiedades && state.propiedadSeleccionadald) {
        const propiedadActiva = state.propiedades.find(p => p.id === state.propiedadSeleccionadald);
        if (propiedadActiva) {
            const precioFormateado = propiedadActiva.precio_base 
                ? Number(propiedadActiva.precio_base).toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }) 
                : 'Precio a consultar';
            areaTextoMensaje.value = `Hola, estoy interesado en recibir más información sobre la propiedad "${propiedadActiva.titulo || 'Inmueble'}" con precio base de ${precioFormateado}. Quedo atento a su respuesta.`;
        }
    }
}

/**
 * PROCESAMIENTO ASÍNCRONO: FORMULARIO DE TOUR GUIADO
 */
function procesarFormularioTour(event) {
    event.preventDefault();

    if (!state.propiedadSeleccionadald) return;
    const propiedadActiva = state.propiedades.find(p => p.id === state.propiedadSeleccionadald);

    const campoFecha = document.getElementById("tour-fecha").value;
    const campoHora = document.getElementById("tour-hora").value;
    const campoTipo = document.getElementById("tour-tipo").value;

    // Construcción del Payload emparejado estrictamente con las columnas de tu Sheets
    // Ejemplo de estructura para el formulario de Tour
    const payloadTour = {
        target_sheet: "visita", // <--- Esta bandera activa el desvío seguro en tu doPost
        usuario_id_fk: state.usuarioActual?.id || "fb2d21c8-b6ad-436b-a3b8-bc5cddbff70d",
        propiedad_id_fk: state.propiedadSeleccionadald,
        anuncio_id_fk: propiedadActiva?.anuncio_id || "ANUN-CORTE",
        fecha_visita: fechaFormateada, 
        tipo_visita: campoTipo.toLowerCase(), 
        estado_visita: "pendiente",
        creado_por: state.usuarioActual?.correo || window.usuarioLogueado?.email || "orlandopena11@gmail.com"
    };


    ejecutarEnvioAppsScript(payloadTour, "modal-tour-comercial", "form-solicitar-tour");
}

/**
 * PROCESAMIENTO ASÍNCRONO: FORMULARIO DE CONTACTAR AGENTE
 */
function procesarFormularioAgente(event) {
    event.preventDefault();

    if (!state.propiedadSeleccionadald) return;
    const propiedadActiva = state.propiedades.find(p => p.id === state.propiedadSeleccionadald);

    const campoMensaje = document.getElementById("agente-mensaje").value;
    const campoTelefono = document.getElementById("agente-telefono").value;

    // Captura inmediata del momento del contacto en formato legible para tu Sheet (DD/MM/AAAA HH:MM)
    const fechaAhora = new Date();
    const fechaFormateadaAhora = String(fechaAhora.getDate()).padStart(2, '0') + '/' + 
                                 String(fechaAhora.getMonth() + 1).padStart(2, '0') + '/' + 
                                 fechaAhora.getFullYear() + ' ' + 
                                 String(fechaAhora.getHours()).padStart(2, '0') + ':' + 
                                 String(fechaAhora.getMinutes()).padStart(2, '0');

    // PAYLOAD DEL AGENTE INMOBILIARIO EN ESTRICTA SIMETRÍA RELACIONAL
    const payloadContacto = {
        target_sheet: "visita",              // Mismo destino controlado por el interceptor
        usuario_id_fk: state.usuarioActual?.id || "fb2d21c8-b6ad-436b-a3b8-bc5cddbff70d",
        propiedad_id_fk: state.propiedadSeleccionadald,
        anuncio_id_fk: propiedadActiva?.anuncio_id || "ANUN-CORTE",
        fecha_visita: fechaFormateadaAhora,  // Fecha y hora del envío del mensaje
        tipo_visita: "agente",               // Clasificación directa solicitada para tu columna
        estado_visita: "pendiente",
        creado_por: state.usuarioActual?.correo || window.usuarioLogueado?.email || "orlandopena11@gmail.com",
        // Parámetros adicionales que tu función 'registrarVisitaComercialAislada' guardará en columnas extras si existen
        mensaje_usuario: campoMensaje,
        telefono_usuario: campoTelefono
    };

    ejecutarEnvioAppsScript(payloadContacto, "modal-agente-comercial", "form-contactar-agente");
}

/**
 * HELPER PURISTA DE TRANSMISIÓN DE DATOS VIA FETCH (CERO RELOADS)
 */
function ejecutarEnvioAppsScript(payload, idModal, idForm) {
    // URL nativa segura leída desde la raíz de tu Página 1 de app.js
    if (typeof urlMiScriptGoogle === "undefined") {
        alert("Error: La URL del servidor de Google Apps Script no está definida.");
        return;
    }

    console.log(`Iniciando transmisión hacia la pestaña "visita"...`, payload);

    // Petición asíncrona robusta con manejo de errores
    fetch(urlMiScriptGoogle, {
        method: "POST",
        mode: "no-cors", // Requerido por Google Apps Script al no retornar cabeceras CORS estándar
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(() => {
        // Al usar 'no-cors', la respuesta siempre será opaca. Asumimos éxito si no cae en el catch.
        alert("¡Registro completado de forma exitosa en el servidor inmobiliario!");
        
        // Cierre y limpieza limpia de componentes visuales en caliente
        cerrarPopupAccion(idModal);
        const formulario = document.getElementById(idForm);
        if (formulario) formulario.reset();
    })
    .catch(error => {
        console.error("Fallo crítico en la tubería de red Apps Script:", error);
        alert("Hubo un error de conexión con el servidor. Por favor, intente nuevamente.");
    });
}
