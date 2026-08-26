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
        estado: 'Venta', // Predeterminado para carga inicial
        /*estado: 'Todos', */ 
        precioMin: 0, 
        precioMax: Infinity, 
        camas: 0, 
        camasExactas: false, 
        baños: 0, 
        tiposPropiedad: new Set(['Casa', 'Departamento', 'Terreno', 'Local', 'Oficina', 'Edificio', 'Lote']),
        tiposListado: new Set()
        
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
        precio_base: parseFloat(prop.precio_base || 350000), // Mapeado a precio_base del backend
        
        // ---------------------------------------------------------------------
        // COLUMNAS REALES DE TUS EXCEL (HOJA "anuncio" Y HOJA "propiedad")
        // Captura directa y estricta sin toLowerCase() para no deformar tus datos
        // ¡MODIFICADO CON BLINDAJE POR DEFECTO! Evita que queden vacíos si el Apps Script no cruza las hojas
        // ---------------------------------------------------------------------
        estado_publicacion: String(prop.estado_publicacion || prop.estado_anuncio || "disponible").trim(), 
        tipo_anuncio: String(prop.tipo_anuncio || prop.tipoAnuncio || "Venta").trim(),             
        // ---------------------------------------------------------------------

        estadoListado: prop.estado_publicacion || "Venta", // Mapeado a estado_publicacion del backend
        titulo: String(prop.titulo || '').trim(), // Mantiene tu título original limpio
        tipo_propiedad: String(prop.tipo_propiedad || 'Casa').trim(), // Mapeado a tipo_propiedad del backend
        subtipo_propiedad: String(prop.subtipo_propiedad || "").trim(),
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
        // Dentro de normalizarPropiedad:
        situacion_propiedad: String(prop.situacion_propiedad || "").toLowerCase().trim(),
        /*situacion_propiedad: prop.situacion_propiedad || "", */
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
state.filtros = 
{ // -->Aqui inicia Objeto state.filtros reestructurado
    estado: 'Venta', 
    precioMin: 0, 
    precioMax: Infinity, 
    camas: 0, 
    camasExactas: false, 
    baños: 0, 
    tiposPropiedad: new Set(['Casa', 'Departamento', 'Terreno', 'Local', 'Oficina', 'Edificio', 'Lote']),
    tiposListado: new Set(['propietario', 'agente', 'nueva construccion', 'ejecucion hipoteca', 'subasta', 'embargo', 'pre ejecucion hipoteca'])
}; // <--Aqui finaliza Objeto state.filtros reestructurado
  


function formatearPrecioCompacto(precio) 
{ // -->Aqui inicia Función formatearPrecioCompacto
    if (precio >= 1000000) return `$. ${(precio / 1000000).toFixed(2)}M`;
    if (precio >= 1000) return `$. ${(precio / 1000).toFixed(0)}K`;
    return `$. ${precio}`;
} // <--Aqui finaliza Función formatearPrecioCompacto


// CONSTRUCTOR SEMÁNTICO DEL MICRO-CARRUSEL (SRE PRODUCTION - CERO ESTILOS EN JS)
function construirRielCarruselComponente(prop, esPopup = false) 
{ // -->Aqui inicia Función construirRielCarruselComponente
    const propiedad = prop;

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
        img.src = prop.fotos[i];
        img.alt = `${prop.titulo} - Vista ${i + 1}`;
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
        state.limpiadoresDOM.set(`${propiedad.id}_arrows`, () => 
        { // -->Aqui inicia Callback Garbage Collector flechas carrusel
            btnlzq.removeEventListener('click', clicklzq);
            btnDer.removeEventListener('click', clickDer);
        }); // <--Aqui finaliza Callback Garbage Collector flechas carrusel

        contenedorFoto.appendChild(btnlzq);
        contenedorFoto.appendChild(btnDer);
    } // <--Aqui finaliza Condicional si tiene más de 1 foto

    // Inyección de la etiqueta flotante usando el campo exacto de la Google Sheet
    const etiquetaFlotante = document.createElement('div');
    etiquetaFlotante.className = 'etiqueta-foto-zillow';
    etiquetaFlotante.textContent = prop.titulo || '';
    contenedorFoto.appendChild(etiquetaFlotante);
    
    return contenedorFoto;
} // <--Aqui finaliza Función construirRielCarruselComponente

/**
 * @description Crea el componente visual de la tarjeta de propiedad (Catalogo Derecho - Pantalla 1).
 *              Sincroniza los datos con el Excel y maneja la transición SPA hacia las Pantallas 2 y 3.
 * @param {Object} prop - Objeto plano inmutable con las columnas reales de Google Sheets.
 * @returns {HTMLElement} Tarjeta construida y lista para insertarse en el DOM.
 */
function crearComponenteTarjetaZillow(prop) { // Apertura crearComponenteTarjetaZillow
        // ESPÍA 1: Monitorea qué datos entran exactamente a cada tarjeta
    console.log(`%c [TARJETA INICIO] Procesando ID: ${prop?.id}`, "background: #1e3a8a; color: #fff; padding: 2px 6px;");
    console.log("Campos críticos en la tarjeta:", { precio_base: prop?.precio_base, titulo: prop?.titulo });

    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-casa';
    tarjeta.setAttribute('data-id', prop.id);

    // Contenedor visual del Riel de Fotos / Carrusel
    const contenedorVisualFoto = construirRielCarruselComponente(prop, false);
    tarjeta.appendChild(contenedorVisualFoto);

    /**
     * @description Manejador de navegación SPA interno de la tarjeta.
     *              SISTEMA SIMPLIFICADO: Dispara la cortina pasando el objeto unificado 'prop'.
     */
    const clickSPAHandler = (e) => { // Apertura clickSPAHandler
        // Exclusiones mecánicas para evitar saltos si se pulsa en el corazón o las flechas
        if (e.target.closest('.flecha-carrusel') || e.target.closest('.corazon-favorito')) { // Apertura IF exclusiones
            return;
        } // Cierre IF exclusiones

        // Cerramos el popup nativo de Leaflet si estuviera activo para limpiar la Pantalla 1
        if (state.mapa) { // Apertura IF mapa
            state.mapa.closePopup();
        } // Cierre IF mapa

        // Persistencia inmutable del ID seleccionado en la raíz del estado global
        state.propiedadSeleccionadaId = prop.id;
        
        /**
         * @description Activación en caliente de la Pantalla 2.
         *              Envía el flujo directo hacia el panel cortina pasándole el objeto real 'prop'.
         */
        gestionarCortinaSPA('detalle', prop);
    }; // Cierre clickSPAHandler

    // Asignación de Pointerdown a la imagen para eludir fallas de compatibilidad de mouse
    contenedorVisualFoto.addEventListener('pointerdown', clickSPAHandler);

        // Bloque contenedor de descripciones y textos informativos
    const datosCasa = document.createElement('div');
    datosCasa.className = 'datos-casa';
    datosCasa.style.padding = '12px';
    datosCasa.addEventListener('pointerdown', clickSPAHandler);

    // 1. Inyección del Precio Base formateado en dólares desde la raíz
    const precioTexto = document.createElement('div');
    precioTexto.className = 'precio';
    precioTexto.style.fontSize = '18px';
    precioTexto.style.fontWeight = 'bold';
    precioTexto.style.color = '#1e293b';
    
    precioTexto.textContent = prop.precio_base ? `$/., ${Number(prop.precio_base).toLocaleString('en-US')}` : 'Precio no disponible';

    
    // ESPÍA 2: Monitorea qué evalúa la tarjeta para el precio
    console.log(`[TARJETA PRECIO] Evaluando prop.precio_base para ID ${prop?.id}:`, prop?.precio_base);
      
    console.log(`[TARJETA PRECIO RESULTADO] Texto asignado: "${precioTexto.textContent}"`);

    
    datosCasa.appendChild(precioTexto);

    // 2. Inyección de Dormitorios, Baños y Áreas leídas de forma plana del Excel
    const caracteristicasTexto = document.createElement('div');
    caracteristicasTexto.className = 'caracteristicas-inmueble';
    caracteristicasTexto.style.fontSize = '13px';
    caracteristicasTexto.style.color = '#475569';
    caracteristicasTexto.style.marginTop = '4px';
    caracteristicasTexto.textContent = `${prop.habitaciones || 0} Dorm | ${prop.banos || 0} Baños | AC: ${prop.area_construida || 0} m² | AT: ${prop.area_terreno || 0} m²`;
    datosCasa.appendChild(caracteristicasTexto);

    // 3. Inyección de Información complementaria (Tipo de propiedad y Año)
    const adicionalesTexto = document.createElement('div');
    adicionalesTexto.className = 'adicionales-inmueble';
    adicionalesTexto.style.fontSize = '12px';
    adicionalesTexto.style.color = '#64748b';
    adicionalesTexto.style.marginTop = '2px';
    adicionalesTexto.textContent = `${prop.tipo_propiedad || 'Inmueble'} | Estacionamientos: ${prop.estacionamientos || 0} | Año: ${prop.ano_construccion || 0}`;
    datosCasa.appendChild(adicionalesTexto);

    // 4. Inyección de la Dirección física real de la Columna G de la pestaña propiedad
    const ubicacionTexto = document.createElement('div');
    ubicacionTexto.className = 'ubicacion-direccion-directa';
    ubicacionTexto.style.fontSize = '14px';
    ubicacionTexto.style.color = '#1e293b';
    ubicacionTexto.style.fontWeight = '600';
    ubicacionTexto.style.marginTop = '4px';
    ubicacionTexto.textContent = prop.direccion ? `${prop.direccion} (${prop.distrito || ''})` : (prop.titulo || "");

    datosCasa.appendChild(ubicacionTexto);

    // Acople de los textos estructurados en la tarjeta principal
    tarjeta.appendChild(datosCasa);

    // Recolector de basura interno para mitigar fugas de memoria RAM en filtros masivos
    if (state.limpiadoresDOM) { // Apertura IF limpiadoresDOM
        state.limpiadoresDOM.set(prop.id, () => { // Apertura callback set
            contenedorVisualFoto.removeEventListener('pointerdown', clickSPAHandler);
            datosCasa.removeEventListener('pointerdown', clickSPAHandler);
        }); // Cierre callback set
    } // Cierre IF limpiadoresDOM

    // ESPÍA 3: Confirma que la tarjeta se construyó por completo sin romperse
    console.log(`%c [TARJETA FIN] Éxito total construyendo tarjeta para ID: ${prop?.id}`, "background: #065f46; color: #fff; padding: 2px 6px;");


    return tarjeta;
} // Cierre crearComponenteTarjetaZillow

        
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

    // =========================================================================
    // MOTOR DE INTERSECCIÓN FILTRADA PARA LAS BURBUJAS DEL MAPA
    // =========================================================================
    const filtradas = state.propiedades.map(normalizarPropiedad).filter(evaluarCriteriosDeFiltrado);


    filtradas.forEach(prop =>
    { // -->Aqui inicia Callback forEach de propiedades filtradas en mapa
        if (!prop.latitud || !prop.longitud) return;

        const precioCompacto = formatearPrecioCompacto(prop.precio_base);
        
        const htmlBurbuja = `<span>${precioCompacto}</span>`;

        // DETERMINACIÓN DINÁMICA DE LA CLASE DE COLOR (Fiel al Excel sin mutaciones)
        const estadoPub = String(prop.estado_publicacion || "").trim();
        const tipoAnuncio = String(prop.tipo_anuncio || "").trim();

        // DETERMINACIÓN DINÁMICA DE LA CLASE DE COLOR (ESTRICTO SIN MINÚSCULAS)
        let claseColorBurbuja = "";

        if (prop.estado_publicacion === 'vendida') {
            claseColorBurbuja = 'vendido-dorado'; // Burbuja Dorada para históricas
        } else if (prop.estado_publicacion === 'disponible' && prop.tipo_anuncio === 'Alquiler') {
            claseColorBurbuja = 'alquiler-naranja'; // Burbuja Naranja para alquileres
        } else {
            claseColorBurbuja = 'venta-azul'; // Burbuja Azul por defecto para ventas disponibles
        }

        // Centrado geométrico nativo estricto mediante constructores L.point(80, 30) y L.point(40, 15)
        const iconoBurbuja = L.divIcon({ // -->Aqui inicia Configuración objeto divIcon Leaflet
            html: htmlBurbuja,
            className: `leaflet-marker-icon map-price-pill ${claseColorBurbuja}`,
            iconSize: L.point(80, 30),
            iconAnchor: L.point(40, 15)
        }); // <--Aqui finaliza Configuración objeto divIcon Leaflet

        const marcador = L.marker([prop.latitud, prop.longitud], { icon: iconoBurbuja });

        // 1. FABRICAMOS EL CONTENEDOR MODULAR AISLADO PARA EL POPUP (Preservado intacto)
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
        pPrice.textContent = prop.precio_base.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
        datosPopup.appendChild(pPrice);

        // Inyección de especificaciones técnicas (Dormitorios / Baños)
        const pSpecs = document.createElement('div');
        pSpecs.className = 'specs-popup';
        pSpecs.style.fontSize = '12px';
        pSpecs.style.color = '#475569';
        pSpecs.style.marginTop = '4px';
        pSpecs.textContent = `${prop.habitaciones} Dorm | ${prop.banos} Baños | ${prop.area_construida} m²`;
        datosPopup.appendChild(pSpecs);

        // Fila de Datos Adicionales: Subtipo, Estacionamientos, Año y Estado del Inmueble
        const pAdicionales = document.createElement('div');
        pAdicionales.style.fontSize = '11px';
        pAdicionales.style.color = '#64748b';
        pAdicionales.style.marginTop = '2px';
        // CÓDIGO CORREGIDO:
        pAdicionales.textContent = `${prop.subtipo_propiedad} | Estacionamientos: ${prop.estacionamientos} | Año: ${prop.ano_construccion} | Estado: ${prop.estado_propiedad}`;
                
        datosPopup.appendChild(pAdicionales);

        // Inyección del título / dirección de la propiedad
        const pDireccion = document.createElement('div');
        pDireccion.className = 'direccion-popup';
        pDireccion.style.fontSize = '12px';
        pDireccion.style.color = '#1e293b';
        pDireccion.style.fontWeight = '500';
        pDireccion.textContent = prop.direccion || prop.titulo || "Inmueble Premium";

      /*  pDireccion.textContent = prop.fraseDescriptiva; */ // Tu columna de título unificada
        datosPopup.appendChild(pDireccion);

        contenedorPopupMaster.appendChild(datosPopup);

        // Enlace nativo directo del Popup (Estabilizado sin inyecciones visuales en JS)
        marcador.bindPopup(contenedorPopupMaster, {
            maxWidth: 300,
            minWidth: 260,
            className: 'zillow-custom-popup-wrapper',
            autoPan: true,
            closeOnClick: false // <-- ESTO ELIMINA EL AUTOCIERRE POR PÉRDIDA DE FOCO DE RAÍZ
        });

        // 2. Escucha e Interceptor de clic para reorganizar el Catalogo Derecho
        marcador.on('click', (e) => { // Apertura marcador.on('click'
            L.DomEvent.stopPropagation(e);

            const idPropiedadActual = prop.id;

            // Modificamos el orden en la memoria RAM de forma inmutable
            /*const indicePropiedad = state.propiedades.findIndex(p => p.id === idPropiedadActual);
            if (indicePropiedad > 0) { 
                const [propiedadSeleccionada] = state.propiedades.splice(indicePropiedad, 1);
                state.propiedades.unshift(propiedadSeleccionada);
            } */
            
            // SRE FIX: Buscamos la propiedad por referencia sin alterar ni reordenar el arreglo global
            const propiedadSeleccionada = state.propiedades.find(p => p.id === idPropiedadActual);


            // Desplazamiento visual suave hacia la tarjeta derecha existente sin destruir la UI
            const tarjetaDerecha = document.querySelector(`.tarjeta-casa[data-id="${idPropiedadActual}"]`);
            if (tarjetaDerecha) { 
                tarjetaDerecha.scrollIntoView({ behavior: 'smooth', block: 'start' });
                tarjetaDerecha.style.outline = '3px solid var(--azul-zillow)';
                tarjetaDerecha.style.borderRadius = '12px';

                setTimeout(() => { 
                    tarjetaDerecha.style.outline = 'none';
                }, 2000); 
            }
        }); // Cierre marcador.on('click'

        // 3. Bloqueador de rebotes interactivos para clics internos en el carrusel
        marcador.on('popupopen', (e) => {
            const popupElement = marcador.getPopup().getElement();
            if (popupElement) {
                L.DomEvent.disableClickPropagation(popupElement);
                L.DomEvent.disableScrollPropagation(popupElement);
            }
        });

        carruselPopup.addEventListener('pointerdown', (e) => { // Apertura carruselPopup pointerdown
            e.stopPropagation();

            if (e.target.closest('.flecha-carrusel') || e.target.closest('.corazon-favorito')) { 
                return;
            }

            if (state.mapa) { 
                state.mapa.closePopup();
            } 

            state.propiedadSeleccionadaId = prop.id;
            gestionarCortinaSPA('detalle', prop);
        }); // Cierre definitivo carruselPopup pointerdown

        window.capaMarcadores.addLayer(marcador);
    }); // <--Aqui finaliza Callback forEach de propiedades filtradas en mapa
} // <--Aqui finaliza Función renderizarMapaZillow

/**
 * RENDERIZADOR DE CATÁLOGO DERECHO Y CALLBACK PRINCIPAL DE RED (ESCONCOR)
 * Utiliza DocumentFragment para una inyección atómica de alta velocidad en el DOM.
 */
function renderizarCatalogoTarjetas() 
{ // -->Aqui inicia Función renderizarCatalogoTarjetas
    // Vinculación corregida apuntando de forma natural al ID: 'properties-grid-target'
    const contenedorRejilla = document.getElementById('properties-grid-target');
    if (!contenedorRejilla) return;

    // LIMPIEZA ATÓMICA ULTRA-RÁPIDA: Erradica textos residuales y evita colisiones de getAttribute
    contenedorRejilla.innerHTML = '';

    // SINCRONIZACIÓN REAL CON EL MOTOR DE FILTRADO MULTIDIMENSIONAL
    const filtradas = state.propiedades.map(normalizarPropiedad).filter(evaluarCriteriosDeFiltrado);

    const contador = document.getElementById('results-counter');

    // =========================================================================
    // CONTROL DE FLUJO UNIFICADO (CON O SIN RESULTADOS)
    // =========================================================================
    if (filtradas.length === 0) 
    { // -->Aqui inicia Bloque pantalla sin resultados por filtros activos
        contenedorRejilla.innerHTML = `
            <div class="mensaje-sin-propiedades" style="padding: 60px 20px; text-align: center; width: 100%; box-sizing: border-box;">
                <h3 style="font-size: 22px; color: #2d3748; font-weight: 700; margin-bottom: 12px; line-height: 1.4; font-family: sans-serif;">
                    No existe este tipo de propiedades en este momento
                </h3>
                <p style="color: #718096; font-size: 15px; font-family: sans-serif; margin: 0;">
                    Prueba seleccionando otros criterios o habilitando más tipos de propiedad en el menú flotante.
                </p>
            </div>
        `;
        
        if (contador) {
            contador.textContent = `0 resultados disponibles`;
        }
    } // <--Aqui finaliza Bloque pantalla sin resultados por filtros activos
    else 
    { // -->Aqui inicia Bloque con resultados activos en el sistema
        const fragmento = document.createDocumentFragment();

        // Inyección atómica de los nodos puros en el fragmento flotante
        filtradas.forEach(prop => 
        { // -->Aqui inicia Callback forEach inyección de tarjetas
            const tarjetaNode = crearComponenteTarjetaZillow(prop);
            if (tarjetaNode) {
                fragmento.appendChild(tarjetaNode);
            }
        }); // <--Aqui finaliza Callback forEach inyección de tarjetas

        contenedorRejilla.appendChild(fragmento);

        if (contador) 
        { // -->Aqui inicia Condicional actualizar contador en pantalla
            contador.textContent = `${filtradas.length} resultados disponibles`;
        } // <--Aqui finaliza Condicional actualizar contador en pantalla
    } // <--Aqui finaliza Bloque con resultados activos en el sistema
} // <--Aqui finaliza Función renderizarCatalogoTarjetas


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
    renderizarCatalogoTarjetas();

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
            state.filtros.banos = parseFloat(valor) || 0;
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
 
        // 5. FILTRO 5: TIPO DE PROPIEDAD (MODULO CON BOTÓN APLICAR DE ALTA SRE)
    const checkSelectAll = document.getElementById('type-select-all');
    const checkboxesTipo = document.querySelectorAll('.type-cb');
    const btnAplicarTipo = document.getElementById('btn-aplicar-tipo-propiedad');

    // =========================================================================
    // SRE DEFINITIVE FIX: DECLARACIÓN EN EL TOPE Y MARCADO INICIAL COMPLETO
    // Se declara la constante en el momento justo para erradicar el ReferenceError.
    // =========================================================================
    const checkboxesFisicosListadoInicial = document.querySelectorAll('.more-filter-cb');
    if (checkboxesFisicosListadoInicial) 
    { // --> Aqui inicia Bloque seguro de encendido visual de inicio
        checkboxesFisicosListadoInicial.forEach(cb => {
            cb.checked = true;
        });
    } // <-- Aqui finaliza Bloque seguro de encendido visual de inicio

    // Sincronización nativa para tipos de propiedad de fábrica
    checkboxesTipo.forEach(cb => {
        if (cb.checked) {
            state.filtros.tiposPropiedad.add(cb.value);
        }
    });

    // =========================================================================

    
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
        }); // <--Aqui finaliza Callback marcar/desmarcar todos los tipos
    } // <--Aqui finaliza Condicional listener seleccionar todos

    checkboxesTipo.forEach(cb => 
    { // -->Aqui inicia Callback forEach enlaces individuales multiselect
        cb.addEventListener('change', (e) => 
        { // -->Aqui inicia Callback actualizar set de tipos de propiedad
            if (e.target.checked) state.filtros.tiposPropiedad.add(e.target.value);
            else state.filtros.tiposPropiedad.delete(e.target.value);
            
            if (!e.target.checked && checkSelectAll) checkSelectAll.checked = false;
        }); // <--Aqui finaliza Callback actualizar set de tipos de propiedad
    }); // <--Aqui finaliza Callback forEach enlaces individuales multiselect

    // DISPARADOR ÚNICO ATÓMICO DESDE EL BOTÓN APLICAR
    if (btnAplicarTipo) 
    { // -->Aqui inicia Condicional listener boton aplicar
        btnAplicarTipo.addEventListener('click', () => 
        { // -->Aqui inicia Callback ejecucion sincronizada boton aplicar
            if (typeof ejecutarTuberiaSincronizada === 'function') {
                ejecutarTuberiaSincronizada();
            }
            
            // Cierra el panel de filtros retirando la clase show nativa
            const panelDropdown = document.getElementById('dropdown-type');
            if (panelDropdown) {
                panelDropdown.classList.remove('show');
            }
        }); // <--Aqui finaliza Callback ejecucion sincronizada boton aplicar
    } // <--Aqui finaliza Condicional listener boton aplicar

    
    // 6. BOTONES DE ACCIÓN: Limpiador maestro y aplicador del menú expandido
    // =========================================================================
    // =========================================================================
    // SRE INITIALIZATION FIX: Declaración prioritaria de selectores avanzados
    // =========================================================================
    const checkboxesListado = document.querySelectorAll('.more-filter-cb');

    const btnReset = document.getElementById('master-reset-btn');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            // Restablecemos los componentes visuales del HTML de forma limpia
            if (inputMinPrecio) inputMinPrecio.value = "";
            if (inputMaxPrecio) inputMaxPrecio.value = ""; // Vaciamos para que asuma cualquier monto
            if (checkSelectAll) checkSelectAll.checked = true;
 
            // SRE FIX DEFINITIVO: Captura local en tiempo de ejecución para evitar errores de inicialización
            const checkboxesFisicosListado = document.querySelectorAll('.more-filter-cb');
            if (checkboxesFisicosListado) 
            { // --> Aqui inicia Encendido forzado de casillas al resetear
                checkboxesFisicosListado.forEach(cb => cb.checked = true);
            } // <-- Aqui finaliza Encendido forzado de casillas al resetear

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

    // =========================================================================
    // ENLACE MAESTRO: CAPTURA REACTIVA E INTEGRAL PARA TIPO DE LISTADO
    // =========================================================================
    const checkTodos = document.getElementById('check-todos-listados');
    // ¡ADAPTADO! Ahora busca exactamente la clase de tu HTML: "more-filter-cb"
    

    // =========================================================================
    // SRE REFACTOR: CONTROLADOR DIRECTO PARA EL BOTÓN "SELECCIONE TODOS"
    // Sincroniza la UI y la RAM de forma simétrica para que ninguna función
    // del catálogo asuma que el panel avanzado se encuentra vacío.
    // =========================================================================
    if (checkTodos) 
    { // --> Aqui inicia Condicional de existencia del nodo checkTodos
        checkTodos.addEventListener('change', (e) => 
        { // --> Aqui inicia Evento de escucha para el botón maestro del panel
            if (e.target.checked) 
            { // --> Aqui inicia Activación total: Enciende todo el panel
                // Vaciar la RAM para reconstruir de forma limpia y consistente
                state.filtros.tiposListado.clear();
                
                checkboxesListado.forEach(cb => 
                { // --> Aqui inicia Seteo visual y almacenamiento en RAM síncrono
                    cb.checked = true;
                    // SRE FIX: Guardamos el string literal en el Set de la memoria RAM
                    state.filtros.tiposListado.add(cb.value);
                }); // <-- Aqui finaliza Seteo visual y almacenamiento en RAM síncrono
            } // <-- Aqui finaliza Activación total: Enciende todo el panel
            else 
            { // --> Aqui inicia Desactivación total: Apaga todo el panel
                checkboxesListado.forEach(cb => 
                { // --> Aqui inicia Seteo visual negativo inferior
                    cb.checked = false;
                }); // <-- Aqui finaliza Seteo visual negativo inferior
                
                state.filtros.tiposListado.clear();
            } // <-- Aqui finaliza Desactivación total: Apaga todo el panel
            
            // Forzar la actualización inmediata de la interfaz cartográfica y catálogo
            if (typeof ejecutarTuberiaSincronizada === 'function') 
            { // --> Aqui inicia Refresco atómico de componentes visuales
                ejecutarTuberiaSincronizada();
            } // <-- Aqui finaliza Refresco atómico de componentes visuales
        }); // <-- Aqui finaliza Evento de escucha para el botón maestro del panel
    } // <-- Aqui finaliza Condicional de existencia del nodo checkTodos


    // =========================================================================
    // ENLACE MAESTRO: CAPTURA REACTIVA CON EXCLUSIÓN MUTUA PARA SELECCIÓN ÚNICA
    // Este bloque intercepta los clicks en los checkboxes avanzados de situación
    // y desmarca automáticamente a los demás para forzar un único valor activo.
    // =========================================================================
    checkboxesListado.forEach(cb => 
    { // --> Aqui inicia Callback forEach para checkboxes de exclusión mutua
        cb.addEventListener('change', (e) => 
        { // --> Aqui inicia Callback al cambiar un check individual
            if (e.target.checked) 
            { // --> Aqui inicia Condicional si el usuario activa el elemento
                // Apagar el botón maestro de selección total porque ahora manda un check específico
                if (checkTodos) 
                { // --> Aqui inicia Apagado del control maestro superior
                    checkTodos.checked = false;
                } // <-- Aqui finaliza Apagado del control maestro superior

                // Desmarcar físicamente todos los demás checkboxes del panel visual
                checkboxesListado.forEach(otroCb => 
                { // --> Aqui inicia Limpieza de controles hermanos
                    if (otroCb !== e.target) 
                    { // --> Aqui inicia Validación de exclusión
                        otroCb.checked = false;
                        state.filtros.tiposListado.delete(otroCb.value);
                    } // <-- Aqui finaliza Validación de exclusión
                }); // <-- Aqui finaliza Limpieza de controles hermanos
                
                // Forzar que en la memoria RAM (state) solo viva este valor único
                state.filtros.tiposListado.clear();
                state.filtros.tiposListado.add(e.target.value);
            } // <-- Aqui finaliza Condicional si el usuario activa el elemento
            else 
            { // --> Aqui inicia Bloque else por si el usuario desmarca la opción activa
                state.filtros.tiposListado.delete(e.target.value);
            } // <-- Aqui finaliza Bloque else por si el usuario desmarca la opción activa
            
            // Actualizar instantáneamente los componentes cartográficos y el catálogo derecho
            if (typeof ejecutarTuberiaSincronizada === 'function') 
            { // --> Aqui inicia Disparo de actualización del DOM
                ejecutarTuberiaSincronizada();
            } // <-- Aqui finaliza Disparo de actualización del DOM
        }); // <-- Aqui finaliza Callback al cambiar un check individual
    }); // <-- Aqui finaliza Callback forEach para checkboxes de exclusión mutua

    
} // <--Aqui finaliza Función inicializarEventosDeFiltros




    
    
    
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
{ // --> Aqui inicia Funcion evaluarCriteriosDeFiltrado
    const filtroTransaccion = state.filtros.estado || "Venta";
    const inputDireccionNode = document.getElementById('search-address');
   
    // =========================================================================
    // BUENAS PRÁCTICAS SRE: CORTOCIRCUITO TOTAL PARA BUSCADOR DE MAPAS
    // =========================================================================
    const textoBuscarDireccion = ""; 
    
    // =========================================================================
    const estado_publicacion = String(prop.estado_publicacion || "").trim();
    const tipo_anuncio = String(prop.tipo_anuncio || "").trim();
    const titulo_direccion = prop.direccion; 
    /*const titulo_direccion = String(prop.fraseDescriptiva || "").trim(); */


    console.warn(`[FILTRO DIAGNOSTIC] ID: ${prop.id} | estado_publicacion = "${estado_publicacion}"`);

    // REGLA DE VACÍO ABSOLUTO INTERNA: Si el usuario desmarca todo en la UI, cortamos el flujo inmediatamente
    if (!state.filtros.tiposListado || state.filtros.tiposListado.size === 0)
    
    {
        return false; 
    }

    
    console.log(`✅ ESPÍA PASÓ PRIMER CONTROL | ID: ${prop.id} continúa evaluación.`);
    
    // =========================================================================
    // SEGUNDO FILTRO: REGLA DE TRANSACCIÓN DIRECTA Y ESTRICTA (SIN MINÚSCULAS)
    // =========================================================================
    if (filtroTransaccion === "Venta" || filtroTransaccion === "En venta") 
    { // --> Aqui inicia Condicional Transaccion Venta
        if (prop.tipo_anuncio !== "Venta" || prop.estado_publicacion !== "disponible") 
        {
            return false;
        }
    } // <-- Aqui finaliza Condicional Transaccion Venta
    else if (filtroTransaccion === "Alquiler" || filtroTransaccion === "Para el alquiler") 
    { // --> Aqui inicia Condicional Transaccion Alquiler
        if (prop.tipo_anuncio !== "Alquiler" || prop.estado_publicacion !== "disponible") 
        {
            return false;
        }
    } // <-- Aqui finaliza Condicional Transaccion Alquiler
    else if (filtroTransaccion === "Vendido" || filtroTransaccion === "Vendidas") 
    { // --> Aqui inicia Condicional Transaccion Vendido
        if (prop.estado_publicacion !== "vendida") 
        {
            return false;
        }
    } // <-- Aqui finaliza Condicional Transaccion Vendido

    // =========================================================================
    // PRIMER FILTRO: REGLA DE LOCALIDAD (CALLE / AV / DISTRITO) - SOLUCIÓN NATIVA
    // =========================================================================
    if (textoBuscarDireccion !== "") 
    {
        if (!titulo_direccion.includes(textoBuscarDireccion)) 
        {
            return false;
        }
    }

    // =========================================================================
    // TERCER FILTRO: RANGO DE PRECIOS
    // =========================================================================
    if (prop.precio_base < state.filtros.precioMin || prop.precio_base > state.filtros.precioMax) 
    {
        return false;
    }

    // =========================================================================
    // NUEVO FILTRO COMPLEMENTARIO: EVALUACIÓN DE CAMAS (DORMITORIOS)
    // =========================================================================
    if (state.filtros.camas && state.filtros.camas > 0) 
    { // --> Aqui inicia Condicional filtro de camas activo
        const camasPropiedad = parseInt(prop.habitaciones) || 0;
        
        if (state.filtros.camasExactas) 
        {
            if (camasPropiedad !== state.filtros.camas) 
            {
                return false;
            }
        }
        else 
        {
            if (camasPropiedad < state.filtros.camas) 
            {
                return false;
            }
        }
    } // <-- Aqui finaliza Condicional filtro de camas activo

    // =========================================================================
    // NUEVO FILTRO COMPLEMENTARIO: EVALUACIÓN DE BAÑOS
    // =========================================================================
    if (state.filtros.banos && state.filtros.banos > 0) 
    { // --> Aqui inicia Condicional filtro de banos activo
        const banosPropiedad = parseFloat(prop.banos) || 0;
        
        if (banosPropiedad < state.filtros.banos) 
        {
            return false;
        }
    } // <-- Aqui finaliza Condicional filtro de banos activo

    // =========================================================================
    // CUARTO FILTRO: INTERSECCIÓN LOGÍSTICA PARA TIPO DE PROPIEDAD
    // =========================================================================
        if (state.filtros.tiposPropiedad.size > 0) 
    { // --> Aqui inicia Condicional set tipos de propiedad activo
        const tipoLimpioBD = String(prop.tipo_prop_propiedad || prop.tipo_propiedad || '').toLowerCase().trim();
        
        const cumpleTipo = Array.from(state.filtros.tiposPropiedad).some(filtroActivo => 
        {
            const filtroNorm = filtroActivo.toLowerCase().trim();
            return filtroNorm.includes(tipoLimpioBD) || tipoLimpioBD.includes(filtroNorm);
        });

        if (!cumpleTipo) 
        {
            return false;
        }
    } // <-- Aqui finaliza Condicional set tipos de propiedad activo

    
    // =========================================================================
    // SRE MOTOR DE INTERSECCIÓN DIRECTA Y PUREZA ABSOLUTA DE DATOS
    // Prioridad Absoluta al Canal Maestro: Si "Seleccione todos" está activo,
    // se aprueba la propiedad inmediatamente para mostrar los datos base (5, 2 o 3).
    // =========================================================================
    const checkboxesFisicosEnPantalla = document.querySelectorAll('.more-filter-cb');
    const checkboxActivo = Array.from(checkboxesFisicosEnPantalla).find(cb => cb.checked);
    const checkMaestro = document.getElementById('check-todos-listados');
    const cantidadDeChecksMarcados = Array.from(checkboxesFisicosEnPantalla).filter(cb => cb.checked).length;

    // A. CONDICIÓN DE CANAL ABIERTO MAESTRO ("Seleccione todos")
    // Si el botón superior está encendido, el motor ignora las restricciones individuales inferiores
    // y aprueba la propiedad de inmediato para que fluyan las 5 de Venta hacia tus espías azules.
    if (checkMaestro && checkMaestro.checked === true) 
    { // --> Aqui inicia Aprobación por Canal Maestro Activo
        // Deja pasar la propiedad directamente al flujo inferior de aprobación
    } // <-- Aqui finaliza Aprobación por Canal Maestro Activo
    
    // B. REGLA DE EXCLUSIÓN TOTAL (FRENO DE MANO)
    // Si el maestro está apagado y tampoco hay ninguna casilla individual marcada, se oculta todo.
    else if (cantidadDeChecksMarcados === 0) 
    { // --> Aqui inicia Bloqueo por desmarcado explícito (Freno de mano)
        return false; 
    } // <-- Aqui finaliza Bloqueo por desmarcado explícito (Freno de mano)

    
    // =========================================================================
    // SRE DEFINITIVE FIX: EXTRACCIÓN DE CONSTANTES AL ÁMBITO GLOBAL DE LA FUNCIÓN
    // Declaración sin cortocircuitos para alimentar correctamente tus espías inferiores.
    // =========================================================================
    const situacionBD = String(prop.situacion_propiedad || "").toLowerCase().trim();
    const filtroUnicoUI = checkboxActivo ? String(checkboxActivo.value).toLowerCase().trim() : "";
    const txActual = String(filtroTransaccion || "Venta").toLowerCase().trim();

    // INTERSECCIÓN 2: REGLA DE EXCLUSIÓN TOTAL (FRENO DE MANO)
    // Si el maestro está apagado y el panel quedó con 0 casillas marcadas, se oculta todo.
    if (checkMaestro && checkMaestro.checked === false && cantidadDeChecksMarcados === 0) 
    { // --> Aqui inicia Bloqueo por desmarcado explícito (Freno de mano)
        return false; 
    } // <-- Aqui finaliza Bloqueo por desmarcado explícito (Freno de mano)

    // INTERSECCIÓN 3: EVALUACIÓN DE CASILLAS INDIVIDUALES DE SELECCIÓN ÚNICA
    // Si no está activo el botón maestro "Seleccione todos", procesamos el filtro individual.
    if (checkMaestro && checkMaestro.checked === false) 
    { // --> Aqui inicia Bloque de evaluación por check individual activo
        // ESCENARIO MAESTRO: "VENTA"
        if (txActual === "venta" || txActual === "en venta") 
        { // --> Aqui inicia Evaluación estricta para Ventas
            if (situacionBD === "nueva construccion" || situacionBD === "embargo") 
            {
                return false;
            }
            if (filtroUnicoUI === "pre ejecucion hipoteca") 
            {
                if (situacionBD !== "pre ejecucion hipoteca") return false;
            }
            else 
            {
                if (situacionBD !== filtroUnicoUI) return false;
            }
        } // <-- Aqui finaliza Evaluación estricta para Ventas

        // ESCENARIO MAESTRO: "ALQUILER"
        else if (txActual === "alquiler" || txActual === "para el alquiler") 
        { // --> Aqui inicia Evaluación estricta para Alquileres
            if (situacionBD === "nueva construccion" && filtroUnicoUI === "nueva construccion") { /* Pasa */ }
            else if (situacionBD === "embargo" && filtroUnicoUI === "embargo") { /* Pasa */ }
            else return false;
        } // <-- Aqui finaliza Evaluación estricta para Alquileres

        // ESCENARIO MAESTRO: "VENDIDO"
        else if (txActual === "vendido" || txActual === "vendidas") 
        { // --> Aqui inicia Evaluación estricta para Vendidas
            if (situacionBD !== "propietario" || filtroUnicoUI !== "propietario") return false;
        } // <-- Aqui finaliza Evaluación estricta para Vendidas
    } // <-- Aqui finaliza Bloque de evaluación por check individual activo

    
    // ESPÍA DE INTERFACES: Inspecciona qué filtros siguen vivos en el Set de la RAM antes de aprobar
    console.log(`🔍 DIAGNÓSTICO DE MEMORIA | ID: ${prop.id} | Situación en Excel: "${situacionBD}" | Filtros que siguen activos en el Set:`, Array.from(state.filtros.tiposListado));

    // Aprobación final unificada
    console.log(`%c ¡PROPIEDAD TOTALMENTE APROBADA! ID: ${prop.id} pasa al catalogo y mapa.`, "color: #008000; font-weight: bold;");
    return true;
} // <-- Aqui finaliza Funcion evaluarCriteriosDeFiltrado de forma correcta

    
function ejecutarTuberiaSincronizada() 
{ // -->Aqui inicia Función ejecutarTuberiaSincronizada
    renderizarMapaZillow();
    renderizarCatalogoTarjetas();
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
    if (areaTextoMensaje && state?.propiedades && state.propiedadSeleccionadaId) {
        const propiedadActiva = state.propiedades.find(p => p.id === state.propiedadSeleccionadaId);
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

    if (!state.propiedadSeleccionadaId) return;
    const propiedadActiva = state.propiedades.find(p => p.id === state.propiedadSeleccionadaId);

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

    if (!state.propiedadSeleccionadaId) return;
    const propiedadActiva = state.propiedades.find(p => p.id === state.propiedadSeleccionadaId);

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
        console.error("Fallo crítico en la tuberia de red Apps Script:", error);
        alert("Hubo un error de conexión con el servidor. Por favor, intente nuevamente.");
    });
}

/**
 * @description Controlador maestro del panel tipo cortina (SPA Simplificado).
 *              Gestiona la inyección dinámica de HTML para las Pantallas 2 y 3
 *              y activa las transiciones de deslizamiento nativas en el CSS.
 * @param {String} tipoPantalla - Determina la vista a renderizar ('detalle' o 'galeria').
 * @param {Object} prop - El objeto de datos unificado de la propiedad seleccionada.
 */
function gestionarCortinaSPA(tipoPantalla, prop) { // Apertura gestionarCortinaSPA
    const cortina = document.getElementById('cortina-spa');
    if (!cortina) { // Apertura IF validacion
        return;
    } // Cierre IF validacion

    // CASO DE CIERRE: Retornar al mapa base (Pantalla 1)
    if (tipoPantalla === 'cerrar') { // Apertura IF cerrar
        cortina.classList.remove('cortina-activa');
        return;
    } // Cierre IF cerrar
        // Formateo y sanitización del precio del inmueble (SRE FIX: Corrige el valor $N/A en pantalla)
    const precioNumericoReal = prop.precio_base || prop.precio;
    const precioFormateadoParaVista = precioNumericoReal ? Number(precioNumericoReal).toLocaleString('en-US', { maximumFractionDigits: 0 }) : 'Precio no disponible';


    // Aseguramos la extracción del arreglo real de fotos leídas del Excel
    const fotoPortadaReal = (prop.fotos && prop.fotos.length > 0) ? prop.fotos[0] : './img/casa-placeholder.jpg';

    // RUTA A: RENDERIZAR PANTALLA 2 (Ficha de Detalle - Layout Fiel a Zillow)
    if (tipoPantalla === 'detalle') { // Apertura IF detalle
        // Extraemos las primeras 5 fotos del arreglo real de forma segura
        const arregloFotos = Array.isArray(prop.fotos) ? prop.fotos : (typeof prop.fotos === 'string' ? prop.fotos.split(',') : []);
        const f1 = arregloFotos[0] || './img/casa-placeholder.jpg';
        const f2 = arregloFotos[1] || './img/casa-placeholder.jpg';
        const f3 = arregloFotos[2] || './img/casa-placeholder.jpg';
        const f4 = arregloFotos[3] || './img/casa-placeholder.jpg';
        const f5 = arregloFotos[4] || './img/casa-placeholder.jpg';

        cortina.innerHTML = `
            <!-- Barra superior limpia idéntica a Zillow -->
            <div class="nav-ficha-zillow" style="position: fixed; top: 0; left: 0; width: 100vw; height: 60px; background: white; border-bottom: 1px solid #ddd; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; z-index: 6000; box-sizing: border-box;">
                <button class="btn-nav-accion" id="btn-cerrar-cortina" style="cursor:pointer; background:none; border:none; color:#006aff; font-weight:600; font-size:15px;">‹ Volver a buscar</button>
               <img src="./logo.jpg" alt="Logo Inmobiliario" style="height:32px; object-fit:contain; border-radius:4px;">
                        <div style="display:flex; gap:16px; color:#54565a; font-size:14px; font-weight:500;">
                    <span style="cursor:pointer;">♡ ¡Guardar</span>
                    <span style="cursor:pointer;">⤻ Compartir</span>
                    <span style="cursor:pointer;">⊘ ¡Escóndete</span>
                </div>
            </div>
            
            <div class="cuerpo-ficha-detalle" style="margin-top: 60px; padding: 0; box-sizing: border-box;">
                <!-- Mosaico de 5 Fotos Estilo Retícula Zillow -->
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 4px; height: 420px; width: 100%; background: #fff; overflow: hidden; position: relative;">
                    
                    <!-- Columna Izquierda: Foto Principal Grande -->
                    <div id="foto-disparador-1" style="grid-row: span 2; background-image: url('${f1}'); background-size: cover; background-position: center; cursor: pointer;"></div>
                    
                    <!-- Columnas Derechas: Cuadrícula de 4 fotos pequeñas -->
                    <div id="foto-disparador-2" style="background-image: url('${f2}'); background-size: cover; background-position: center; cursor: pointer;"></div>
                    <div id="foto-disparador-3" style="background-image: url('${f3}'); background-size: cover; background-position: center; cursor: pointer;"></div>
                    <div id="foto-disparador-4" style="background-image: url('${f4}'); background-size: cover; background-position: center; cursor: pointer;"></div>
                    <div id="foto-disparador-5" style="background-image: url('${f5}'); background-size: cover; background-position: center; cursor: pointer; position: relative;"></div>
                    
                    <!-- Botón Flotante de Conteo de Fotos en la esquina inferior derecha -->
                    <button id="btn-flotante-galeria" style="position: absolute; bottom: 16px; right: 16px; background: rgba(255,255,255,0.95); color: #1a1a1a; border: 1px solid #1a1a1a; padding: 10px 16px; border-radius: 4px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; z-index: 10;">
                        ⚃ Ver todas las ${arregloFotos.length || 0} fotos
                    </button>
                </div>

                <!-- Bloque de Datos del Excel e Interacción Comercial -->
                <div style="display: flex; padding: 30px 40px; gap: 40px; box-sizing: border-box; max-width: 1300px; margin: 0 auto;">
                    <div style="flex: 2;">
                        <div style="display:flex; align-items: baseline; gap: 12px; margin-bottom: 8px;">
<h2 style="font-size: 36px; font-weight: 800; margin:0; color:#1a1a1a;">$${precioFormateadoParaVista}</h2>
                            <div style="font-size:18px; color:#1a1a1a; font-weight:500;">
                                <strong style="font-size:22px;">${prop.habitaciones || 0}</strong> <span style="color:#666;">habitaciones</span> | 
                                <strong style="font-size:22px;">${prop.banos || 0}</strong> <span style="color:#666;">baños</span> | 
                                <strong style="font-size:22px;">${prop.area_construida || 0}</strong> <span style="color:#666;">m²</span>
                            </div>
                        </div>
                        <p style="font-size: 16px; color: #2a2a2a; font-weight: 500; margin: 0;">${prop.direccion || prop.titulo || ''}</p>
                        <p style="font-size: 14px; color: #666; margin-top: 4px;">Distrito de ${prop.distrito || 'Lima'} • <span style="color:#ca8a04; font-weight:600;">Reducción de precio: $5K</span></p>
                    </div>
                    <div style="flex: 1; background: #ffffff; padding: 24px; border: 1px solid #ddd; border-radius: 8px; height: fit-content; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                        <button style="width: 100%; background: #006aff; color: white; border: none; padding: 14px; border-radius: 4px; font-weight: bold; font-size: 16px; margin-bottom: 12px; cursor: pointer;">Solicitar un tour</button>
                        <button style="width: 100%; background: white; color: #006aff; border: 1px solid #006aff; padding: 14px; border-radius: 4px; font-weight: bold; font-size: 16px; cursor: pointer;">Contacte con un agente</button>
                    </div>
                </div>
            </div>
        `;

        // Vinculación unificada de disparadores hacia la Pantalla 1 y la Pantalla 3
        document.getElementById('btn-cerrar-cortina')?.addEventListener('click', () => gestionarCortinaSPA('cerrar'));
        document.getElementById('btn-flotante-galeria')?.addEventListener('click', () => gestionarCortinaSPA('galeria', prop));
        for (let i = 1; i <= 5; i++) { // Bucle de vinculación táctil para las 5 fotos
            document.getElementById(`foto-disparador-${i}`)?.addEventListener('click', () => gestionarCortinaSPA('galeria', prop));
        } // Cierre bucle fotos
    } // Cierre IF detalle

    
    // RUTA B: RENDERIZAR PANTALLA 3 (Galería Expandida Split Compacto)
    else if (tipoPantalla === 'galeria') { // Apertura ELSE IF galeria
        // Aseguramos la extracción del arreglo real de fotos leídas del Excel
        const fotoPortadaReal = (prop.fotos && prop.fotos.length > 0) ? prop.fotos[0] : './img/casa-placeholder.jpg';

        cortina.innerHTML = `
            <!-- Barra superior limpia e idéntica a la ficha detalle -->
            <div class="nav-ficha-zillow" style="position: fixed; top: 0; left: 0; width: 100vw; height: 60px; background: white; border-bottom: 1px solid #ddd; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; z-index: 6000; box-sizing: border-box;">
                <button class="btn-nav-accion" id="btn-regresar-detalle" style="cursor:pointer; background:none; border:none; color:#006aff; font-weight:600; font-size:15px;">‹ Volver al detalle</button>
                <img src="./logo.jpg" alt="Logo Inmobiliario" style="height:32px; object-fit:contain; border-radius:4px;">
                <div style="display:flex; gap:16px; color:#54565a; font-size:14px; font-weight:500;">
                    <span>♡ ¡Guardar</span>
                    <span>⤻ Compartir</span>
                    <span>⊘ ¡Escóndete</span>
                </div>
            </div>
            
            <!-- Estructura Split con ancho reducido a la derecha para asemejarse a la captura de Zillow -->
            <div class="galeria-split-zillow" style="display: flex; width: 100vw; height: calc(100vh - 60px); margin-top: 60px; overflow: hidden;">
                
                <!-- Lado Izquierdo Amplio: Mosaico vertical scrollable de fotos (73% del ancho) -->
                <div class="galeria-izquierda-mosaico" style="width: 73%; height: 100%; overflow-y: scroll; background-color: #111111; padding: 20px; box-sizing: border-box;">
                    ${(prop.fotos || [fotoPortadaReal]).map(img => `<img src="${img}" style="width:100%; max-height:85vh; object-fit:contain; margin-bottom:12px; border-radius:4px;">`).join('')}
                </div>
                
                <!-- Lado Derecho Compacto: Columna comercial estilizada y angosta (27% del ancho exacto) -->
                <div class="panel-derecho-comercial" style="width: 27%; height: 100%; background-color: #ffffff; border-left: 1px solid #e2e8f0; padding: 24px; box-sizing: border-box; overflow-y: auto; display: flex; flex-direction: column; justify-content: flex-start;">
                    
                    <!-- Bloque de Precio Base y Datos de la Hoja -->
                    <div style="margin-bottom: 24px;">
<h2 style="font-size: 28px; font-weight: 800; margin: 0 0 6px 0; color: #1a1a1a;">$${precioFormateadoParaVista}</h2>
<div style="font-size: 14px; color: #1a1a1a; font-weight: 500; margin-bottom: 12px; display: flex; gap: 8px;">
                            <span><strong>${prop.habitaciones || 0}</strong> bd</span>
                            <span><strong>${prop.banos || 0}</strong> ba</span>
                            <span><strong>${prop.area_construida || 0}</strong> m²</span>
                        </div>
                        <p style="font-size: 14px; color: #2a2a2a; margin: 0; line-height: 1.4; font-weight: 500;">
                            ${prop.direccion || prop.titulo || ''}, Distrito de ${prop.distrito || ''}
                        </p>
                    </div>
                    
                    <!-- Botonera de Acción Comercial Fiel a la Retícula de tu Captura -->
                    <div style="width: 100%; display: flex; flex-direction: column; gap: 10px;">
                        <button style="width: 100%; background: #006aff; color: white; border: none; padding: 14px; border-radius: 4px; font-weight: bold; font-size: 15px; cursor: pointer; text-align: center;">
                            Solicitar un tour<br><span style="font-size:11px; font-weight:normal; opacity:0.9;">Ya hoy a las 5:30 pm</span>
                        </button>
                        <button style="width: 100%; background: white; color: #006aff; border: 1px solid #006aff; padding: 14px; border-radius: 4px; font-weight: bold; font-size: 15px; cursor: pointer;">
                            Contacte con un agente
                        </button>
                    </div>

                </div>
            </div>
        `;

        // Enlace inmediato del botón de retorno hacia la Pantalla 2
        document.getElementById('btn-regresar-detalle')?.addEventListener('click', () => gestionarCortinaSPA('detalle', prop));
    } // Cierre ELSE IF galeria

    
    // Deslizamos la cortina de forma nativa hacia adentro añadiendo la clase CSS
    cortina.classList.add('cortina-activa');
} // Cierre gestionarCortinaSPA
