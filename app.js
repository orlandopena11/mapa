// PARTE: 1-5 (ESTADO Y CONFIGURACIONES)
/**
 * ARQUITECTURA DE CONTROL DE ESTADO INMUTABLE Y CONFIGURACIÓN GLOBAL ZILLOW V2
 * Centraliza el almacenamiento y protege el flujo contra variables mutables globales.
 */

const state = {
    propiedades: [],
    favoritos: new Set(),
    filtros: {
        estado: 'Venta',
        precioMax: 'Todos',
        habitaciones: 'Todos'
    },
    // Registro interno para la remoción explícita de Listeners (Garbage Collector)
    limpiadoresDOM: new Map()
};

// URL de conexión segura con el backend relacional de Google Apps Script
const urlMiScriptGoogle = "https://google.com";

/**
 * Lector asíncrono seguro mediante inyección controlada de JSONP
 */
function cargarDatosDesdeAppsScript() {
    const script = document.createElement('script');
    script.src = `${urlMiScriptGoogle}?callback=procesarDatosDelMotor`;
    document.body.appendChild(script);
}

// PARTE: 2-5 (NORMALIZACIÓN Y FORMATEO)
/**
 * MOTOR DE PROCESAMIENTO Y HOMOGENEIZACIÓN DE DATOS DEL BACKEND
 * Sanitiza las entradas de Google Sheets y unifica los arreglos de imágenes.
 */

function normalizarPropiedad(prop) {
    const id = prop.propiedad_id || prop.id || String(Math.random());
    
    // Unificación estricta del canal de fotos del backend
    let fotosUnificadas = [];
    if (prop.foto_principal) fotosUnificadas.push(String(prop.foto_principal).trim());
    if (Array.isArray(prop.imagenes_secundarias)) {
        fotosUnificadas.push(...prop.imagenes_secundarias.map(f => String(f).trim()));
    }
    if (Array.isArray(prop.fotos)) {
        fotosUnificadas.push(...prop.fotos.map(f => String(f).trim()));
    }
    
    // Purga de duplicados y valores corruptos en memoria
    const fotosUnicas = [...new Set(fotosUnificadas.filter(Boolean))];
    
    return {
        id: String(id),
        precio: parseFloat(prop.precio_base || prop.precio || 0),
        estadoListado: String(prop.estado_publicacion || prop.estado || 'Venta').trim(), // 'Nuevo', 'Vendido', 'Venta'
        fraseDescriptiva: String(prop.frase_descriptiva || prop.titulo || '').trim(),
        fotos: fotosUnicas.length > 0 ? fotosUnicas : ['https://unsplash.com'],
        latitud: parseFloat(prop.latitud || 0),
        longitud: parseFloat(prop.longitud || 0),
        habitaciones: parseInt(prop.habitaciones || prop.hab || 0)
    };
}

function formatearPrecioCompacto(precio) {
    if (precio >= 1000000) {
        return `S/. ${(precio / 1000000).toFixed(2)}M`;
    } else if (precio >= 1000) {
        return `S/. ${(precio / 1000).toFixed(0)}K`;
    }
    return `S/. ${precio}`;
}

// PARTE: 3-5 (CONSTRUCTOR DE COMPONENTES)
/**
 * FÁBRICA DE TARJETAS MODULARES CON MICRO-CARRUSEL INTERACTIVO DOBLE
 * Uso estricto de la API del DOM nativo (createElement/textContent) libre de XSS.
 * Funciona de forma idéntica en la Rejilla del Catálogo y dentro de los Popups del Mapa.
 */

function crearComponenteTarjetaZillow(propiedad) {
    let indiceFotoActual = 0;
    const totalFotos = Math.min(propiedad.fotos.length, 5); // Máximo 5 fotos según especificación

    // Contenedor principal hermético
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-casa';
    tarjeta.setAttribute('data-id', propiedad.id);

    // Viewport de la fotografía
    const contenedorFoto = document.createElement('div');
    contenedorFoto.className = 'contenedor-foto';

    // Riel deslizante para animación fluida por CSS
    const rielCarrusel = document.createElement('div');
    rielCarrusel.className = 'carrusel-imagenes';
    rielCarrusel.style.width = `${totalFotos * 100}%`;

    const nodosImagenes = [];
    for (let i = 0; i < totalFotos; i++) {
        const img = document.createElement('img');
        img.src = propiedad.fotos[i];
        img.alt = `${propiedad.fraseDescriptiva} - Vista ${i + 1}`;
        img.style.width = `${100 / totalFotos}%`;
        rielCarrusel.appendChild(img);
        nodosImagenes.push(img);
    }
    contenedorFoto.appendChild(rielCarrusel);

    // ETIQUETAS FLOTANTES (Badges Esquina Superior Izquierda)
    if (propiedad.estadoListado === 'Nuevo' || propiedad.estadoListado === 'Vendido') {
        const badgeEstado = document.createElement('span');
        badgeEstado.className = `badge badge-${propiedad.estadoListado.toLowerCase()}`;
        badgeEstado.textContent = propiedad.estadoListado;
        contenedorFoto.appendChild(badgeEstado);
    }

    // BOTÓN DE CORAZÓN REACTIVO INMUTABLE (Esquina Superior Derecha)
    const botonCorazon = document.createElement('button');
    botonCorazon.className = 'corazon-favorito';
    botonCorazon.textContent = state.favoritos.has(propiedad.id) ? '♥' : '♡';
    if (state.favoritos.has(propiedad.id)) botonCorazon.classList.add('activo');

    const handlerFavorito = (e) => {
        e.stopPropagation();
        if (state.favoritos.has(propiedad.id)) {
            state.favoritos.delete(propiedad.id);
            botonCorazon.textContent = '♡';
            botonCorazon.classList.remove('activo');
        } else {
            state.favoritos.add(propiedad.id);
            botonCorazon.textContent = '♥';
            botonCorazon.classList.add('activo');
        }
    };
    botonCorazon.addEventListener('click', handlerFavorito);
    contenedorFoto.appendChild(botonCorazon);

    // CAJA DE TEXTO ATENUADA (Pie de la Foto)
    if (propiedad.fraseDescriptiva) {
        const letreroDescriptivo = document.createElement('div');
        letreroDescriptivo.className = 'letrero-descriptivo';
        letreroDescriptivo.textContent = propiedad.fraseDescriptiva;
        contenedorFoto.appendChild(letreroDescriptivo);
    }

    // ARITMÉTICA MODULAR CIRCULAR INFINITA (Controles de Navegación)
    let handlerFlechaIzq = null;
    let handlerFlechaDer = null;

    if (totalFotos > 1) {
        const btnIzq = document.createElement('button');
        btnIzq.className = 'flecha-carrusel flecha-izq';
        btnIzq.textContent = '<';

        const btnDer = document.createElement('button');
        btnDer.className = 'flecha-carrusel flecha-der';
        btnDer.textContent = '>';

        const contenedorIndicadores = document.createElement('div');
        contenedorIndicadores.className = 'indicadores-carrusel';

        const dots = [];
        for (let i = 0; i < totalFotos; i++) {
            const dot = document.createElement('span');
            dot.className = i === 0 ? 'punto-indicador activo' : 'punto-indicador';
            contenedorIndicadores.appendChild(dot);
            dots.push(dot);
        }
        contenedorFoto.appendChild(contenedorIndicadores);

        const actualizarDesplazamiento = () => {
            const desplazamiento = -(indiceFotoActual * (100 / totalFotos));
            rielCarrusel.style.transform = `translateX(${desplazamiento}%)`;
            dots.forEach((dot, idx) => {
                dot.classList.toggle('activo', idx === indiceFotoActual);
            });
        };

        handlerFlechaIzq = (e) => {
            e.stopPropagation();
            indiceFotoActual = (indiceFotoActual - 1 + totalFotos) % totalFotos;
            actualizarDesplazamiento();
        };

        handlerFlechaDer = (e) => {
            e.stopPropagation();
            indiceFotoActual = (indiceFotoActual + 1) % totalFotos;
            actualizarDesplazamiento();
        };

        btnIzq.addEventListener('click', handlerFlechaIzq);
        btnDer.addEventListener('click', handlerFlechaDer);
        contenedorFoto.appendChild(btnIzq);
        contenedorFoto.appendChild(btnDer);
    }

    tarjeta.appendChild(contenedorFoto);

    // Contenedor semántico de datos descriptivos de la propiedad
    const datosCasa = document.createElement('div');
    datosCasa.className = 'datos-casa';

    const precioTexto = document.createElement('div');
    precioTexto.className = 'precio';
    precioTexto.textContent = propiedad.precio.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 });
    datosCasa.appendChild(precioTexto);

    tarjeta.appendChild(datosCasa);

    // Guardado de punteros para el recolector de basura interno
    state.limpiadoresDOM.set(propiedad.id, () => {
        botonCorazon.removeEventListener('click', handlerFavorito);
        if (totalFotos > 1) {
            btnIzq.removeEventListener('click', handlerFlechaIzq);
            btnDer.removeEventListener('click', handlerFlechaDer);
        }
    });

    return tarjeta;
}

// PARTE: 4-5 (MOTOR DE MAPA Y POPUPS)
/**
 * CONTROL DE RENDERIZADO DE BURBUJAS DINÁMICAS Y POPUPS MODULARES EN LEAFLET
 * Implementa centrado geométrico nativo rígido mediante L.point para mitigar desbordes.
 */

let capaMarcadores = null;

function renderizarMapaZillow() {
    if (!window.map) return;

    if (!capaMarcadores) {
        capaMarcadores = L.layerGroup().addTo(window.map);
    } else {
        capaMarcadores.clearLayers();
    }

    // Filtrado reactivo de las propiedades en base al estado de memoria
    const filtradas = state.propiedades.filter(prop => {
        const matchesEstado = state.filtros.estado === 'Todos' || prop.estadoListado === state.filtros.estado;
        return matchesEstado;
    });

    filtradas.forEach(prop => {
        if (!prop.latitud || !prop.longitud) return;

        const precioCompacto = formatearPrecioCompacto(prop.precio);
        const esNuevo = prop.estadoListado === 'Nuevo';
        const clasePill = esNuevo ? 'map-price-pill nuevo' : 'map-price-pill';

        const htmlBurbuja = `<div class="${clasePill}"><span>${precioCompacto}</span></div>`;

        // Configuración geométrica estricta solicitada para evitar desalineación
        const iconoBurbuja = L.divIcon({
            html: htmlBurbuja,
            className: 'custom-leaflet-container',
            iconSize: L.point(80, 30),
            iconAnchor: L.point(40, 15)
        });

        const marcador = L.marker([prop.latitud, prop.longitud], { icon: iconoBurbuja });

        // Evento de apertura reactiva del Popup inyectando el componente tarjeta modular
        marcador.on('click', () => {
            window.map.panTo(marcador.getLatLng());

            // Construimos la misma estructura de tarjeta con carrusel operativo
            const tarjetaPopup = crearComponenteTarjetaZillow(prop);
            tarjetaPopup.classList.add('popup-card');

            marcador.bindPopup(tarjetaPopup, {
                maxWidth: 300,
                minWidth: 280,
                className: 'zillow-custom-popup-wrapper'
            }).openPopup();
        });

        capaMarcadores.addLayer(marcador);
    });
}

// PARTE: 5-5 (REJILLA Y CONTROLADOR CORE)
/**
 * RENDERIZADOR DE CATÁLOGO DERECHO Y CALLBACK PRINCIPAL DE RED
 * Utiliza DocumentFragment para agrupar mutaciones del DOM de forma eficiente y ordenada.
 */

function renderizarCatálogoTarjetas() {
    const contenedorRejilla = document.getElementById('contenedor-tarjetas');
    if (!contenedorRejilla) return;

    // Liberación estricta de memoria antes de vaciar la pantalla (Previene fugas)
    while (contenedorRejilla.firstChild) {
        const id = contenedorRejilla.firstChild.getAttribute('data-id');
        if (id && state.limpiadoresDOM.has(id)) {
            state.limpiadoresDOM.get(id)(); // Remueve el Event Listener explícitamente
            state.limpiadoresDOM.delete(id);
        }
        contenedorRejilla.removeChild(contenedorRejilla.firstChild);
    }

    const fragmento = document.createDocumentFragment();
    
    // Filtrado idéntico al del mapa para mantener coherencia visual absoluta
    const filtradas = state.propiedades.filter(prop => {
        return state.filtros.estado === 'Todos' || prop.estadoListado === state.filtros.estado;
    });

    // Inyección optimizada de tarjetas en el fragmento flotante
    filtradas.forEach(prop => {
        const tarjetaNode = crearComponenteTarjetaZillow(prop);
        fragmento.appendChild(tarjetaNode);
    });

    contenedorRejilla.appendChild(fragmento);
    
    // Actualización del letrero contador dinámico
    const contador = document.getElementById('contador-propiedades');
    if (contador) {
        contador.textContent = `${filtradas.length} resultados disponibles`;
    }
}

/**
 * ESPÍA CONTROLADO (Estrategia ESCONCOR): Callback global de recepción de red
 */
function procesarDatosDelMotor(data) {
    console.log("[ESPÍA ESCONCOR] Datos crudos del backend interceptados con éxito:", data);
    
    if (!data || !data.propiedades || !Array.isArray(data.propiedades)) {
        console.error("[ESPÍA ESCONCOR] Error catastrófico: Estructura de datos ilegible.");
        return;
    }

    // Normalización masiva hacia el estado controlado protegido
    state.propiedades = data.propiedades.map(normalizarPropiedad);
    
    // Disparo sincronizado de ambas vistas core de la aplicación
    renderizarMapaZillow();
    renderizarCatálogoTarjetas();
    
    console.log("[ESPÍA ESCONCOR] Pipeline finalizado. Estado de memoria purificado.");
}

// Inicializador estructural al levantarse el documento
document.addEventListener("DOMContentLoaded", () => {
    // Inicialización simulada del mapa de Leaflet
    if (typeof L !== 'undefined' && document.getElementById('mapa')) {
        window.map = L.map('mapa', { zoomControl: true }).setView([-12.125, -76.995], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.map);
        
        // Sincronización del mapa con los filtros al arrastrar o cambiar zoom
        window.map.on('moveend', renderizarMapaZillow);
    }
    
    // Carga inicial del flujo de datos
    cargarDatosDesdeAppsScript();
});
