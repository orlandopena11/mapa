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
const urlMiScriptGoogle = "https://script.google.com/macros/s/AKfycbyfNpA-Zf_C-uqDxpzX1phQqREIXAhgSvFyVj2VAhWp2-h7wN_2uR44b3wkg152STAzrQ/exec";

/**
 * Lector asíncrono seguro mediante inyección controlada de JSONP
 */
function cargarDatosDesdeAppsScript() {
    const script = document.createElement('script');
    script.src = `${urlMiScriptGoogle}?callback=procesarDatosDelMotor`;
    document.body.appendChild(script);
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

// PARTE: 4-5 (MOTOR DE MAPA Y POPUPS ENLAZADOS)
/**
 * CONTROL DE RENDERIZADO DE BURBUJAS DINÁMICAS Y POPUPS MODULARES EN LEAFLET
 * Vincula el componente de micro-carrusel circular dinámico directamente sobre el mapa.
 */

let capaMarcadores = null;

function renderizarMapaZillow() {
    // Vinculación estricta al ID nativo del HTML: 'map-instance'
    if (!window.map || !document.getElementById('map-instance')) return;

    if (!capaMarcadores) {
        capaMarcadores = L.layerGroup().addTo(window.map);
    } else {
        capaMarcadores.clearLayers();
    }

    // Reemplazo exacto dentro de renderizarMapaZillow() y renderizarCatálogoTarjetas()
        const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);

        const matchesEstado = state.filtros.estado === 'Todos' || prop.estadoListado === state.filtros.estado;
        return matchesEstado;
    });

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

        capaMarcadores.addLayer(marcador);
    });
}

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

        return state.filtros.estado === 'Todos' || prop.estadoListado === state.filtros.estado;
    });

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
function procesarDatosDelMotor(data) {
    console.log("[ESPÍA ESCONCOR] Intercepción de red exitosa. Datos crudos:", data);
    
    if (!data || !data.propiedades || !Array.isArray(data.propiedades)) {
        console.error("[ESPÍA ESCONCOR] Formato del backend corrupto o ilegible.");
        return;
    }

    // Actualización inmutable del estado central protegido
    state.propiedades = data.propiedades.map(normalizarPropiedad);
    
    // Disparo unificado y sincronizado de ambas vistas del Split-View
    renderizarMapaZillow();
    renderizarCatálogoTarjetas();
    
    console.log("[ESPÍA ESCONCOR] Proceso finalizado. Interfaz de usuario sincronizada perfectamente.");
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
function evaluarCriteriosDeFiltrado(prop) {
    // A. Filtro por Tipo de Transacción
    const matchTransaccion = state.filtros.estado === 'Todos' || prop.estadoListado === state.filtros.estado;
    
    // B. Filtro por Rango de Precios
    const matchPrecio = prop.precio >= state.filtros.precioMin && prop.precio <= state.filtros.precioMax;
    
    // C. Filtro por Dormitorios (Camas)
    let matchCamas = true;
    if (state.filtros.camas > 0) {
        if (state.filtros.camasExactas) {
            matchCamas = prop.habitaciones === state.filtros.camas;
        } else {
            matchCamas = prop.habitaciones >= state.filtros.camas;
        }
    }
    
    // D. Filtro por Tipo de Propiedad (Uso eficiente de Set.has)
    const matchTipo = state.filtros.tiposPropiedad.size === 0 || state.filtros.tiposPropiedad.has(prop.tipoPropiedad || 'Casa');

    return matchTransaccion && matchPrecio && matchCamas && matchTipo;
}

/**
 * Tubería centralizada (Pipeline): Orquesta el re-renderizado síncrono y limpio de ambas vistas
 */
function ejecutarTuberíaSincronizada() {
    // Redirigimos el renderizado del mapa para que consuma la lógica unificada
    renderizarMapaZillow();
    renderizarCatálogoTarjetas();
}
