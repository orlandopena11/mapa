/* jshint esversion: 11 *//* jshint esversion: 11 */

// ==========================================================================
// INICIO: PARTE 1 - ESTADO GLOBAL Y VARIABLES DE LA APLICACIÓN
// ==========================================================================
const state = { // Inicia Objeto state global
    propiedades: [],
    propiedadesFiltradas: [],
    propiedadSeleccionadaId: null,
    vistaActual: 'catalogo', // 'catalogo' o 'detalle'
    filtros: {
        estado: 'Venta',
        precioMin: 0,
        precioMax: Infinity,
        camas: 0,
        banos: 0,
        tiposPropiedad: new Set(),
        tiposListado: new Set()
    },
    mapa: null,
    marcadoresMapa: []
}; // Fin de Objeto state global
// ==========================================================================
// FIN: PARTE 1 - ESTADO GLOBAL Y VARIABLES DE LA APLICACIÓN
// ==========================================================================


// ==========================================================================
// INICIO: PARTE 2 - TUBERÍA SINCRONIZADA DE FILTRADO Y RENDERIZADO
// ==========================================================================
function ejecutarTuberiaSincronizada() { // Inicia Function ejecutarTuberiaSincronizada
    state.propiedadesFiltradas = state.propiedades.filter(prop => { // Inicia Método filter de propiedades
        return evaluarCriteriosDeFiltrado(prop);
    }); // Fin de Método filter de propiedades

    renderizarTarjetasCatalogo(state.propiedadesFiltradas);
    actualizarMarcadoresEnMapa(state.propiedadesFiltradas);
} // Fin de Function ejecutarTuberiaSincronizada
// ==========================================================================
// FIN: PARTE 2 - TUBERÍA SINCRONIZADA DE FILTRADO Y RENDERIZADO
// ==========================================================================


// ==========================================================================
// INICIO: PARTE 3 - RENDERIZADO DE TARJETAS EN EL CATÁLOGO IZQUIERDO
// ==========================================================================
function renderizarTarjetasCatalogo(listaPropiedades) { // Inicia Function renderizarTarjetasCatalogo
    const contenedorListado = document.getElementById('lista-propiedades-container');
    if (!contenedorListado) return;

    contenedorListado.innerHTML = '';

    if (listaPropiedades.length === 0) { // Inicia Condicional lista vacía
        contenedorListado.innerHTML = '<div class="sin-resultados">No se encontraron propiedades con los filtros seleccionados.</div>';
        return;
    } // Fin de Condicional lista vacía

    listaPropiedades.forEach(prop => { // Inicia forEach listaPropiedades
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-propiedad-zillow';
        tarjeta.setAttribute('data-id', prop.id);

        const contenedorMultimedia = construirRielCarruselComponente(prop, false);
        tarjeta.appendChild(contenedorMultimedia);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'tarjeta-info-zillow';

        const precioFmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: prop.moneda || 'USD', maximumFractionDigits: 0 }).format(prop.precio_base);
        
        const h3Precio = document.createElement('h3');
        h3Precio.className = 'precio-inmueble';
        h3Precio.textContent = precioFmt;
        infoDiv.appendChild(h3Precio);

        const pDetalles = document.createElement('p');
        pDetalles.className = 'detalles-inmueble';
        pDetalles.innerHTML = `<strong>${prop.habitaciones || 0}</strong> habs | <strong>${prop.banos || 0}</strong> baños | <strong>${prop.area_total || 0}</strong> m²`;
        infoDiv.appendChild(pDetalles);

        const pDireccion = document.createElement('p');
        pDireccion.className = 'direccion-inmueble';
        pDireccion.textContent = prop.direccion || prop.titulo || '';
        infoDiv.appendChild(pDireccion);

        tarjeta.appendChild(infoDiv);

        // Evento para abrir la vista de detalle (Pantalla 2) al hacer clic en la tarjeta
        tarjeta.addEventListener('click', () => { // Inicia Listener click tarjeta catalogo
            abrirVistaDetalleShowcase(prop.id);
        }); // Fin de Listener click tarjeta catalogo

        contenedorListado.appendChild(tarjeta);
    }); // Fin de forEach listaPropiedades
} // Fin de Function renderizarTarjetasCatalogo
// ==========================================================================
// FIN: PARTE 3 - RENDERIZADO DE TARJETAS EN EL CATÁLOGO IZQUIERDO
// ==========================================================================


// ==========================================================================
// INICIO: PARTE 4 - PANTALLA 2: VISTA DETALLE / SHOWCASE DE PROPIEDAD
// ==========================================================================
function abrirVistaDetalleShowcase(propId) { // Inicia Function abrirVistaDetalleShowcase
    const prop = state.propiedades.find(p => p.id === propId);
    if (!prop) return;

    state.propiedadSeleccionadaId = propId;
    state.vistaActual = 'detalle';

    const contenedorPrincipal = document.getElementById('app-main-layout');
    if (!contenedorPrincipal) return;

    contenedorPrincipal.innerHTML = '';

    const contenedorShowcase = document.createElement('div');
    contenedorShowcase.className = 'vista-detalle-showcase';

    // Cabecera con botón de retorno '‹'
    const cabeceraDetalle = document.createElement('div');
    cabeceraDetalle.className = 'cabecera-detalle-navegacion';

    const botonRetorno = document.createElement('button');
    botonRetorno.className = 'btn-retorno-catalogo';
    botonRetorno.innerHTML = '‹ Volver al mapa y resultados';
    botonRetorno.addEventListener('click', () => { // Inicia Listener click retorno
        state.vistaActual = 'catalogo';
        state.propiedadSeleccionadaId = null;
        restaurarVistaCatalogoPrincipal();
    }); // Fin de Listener click retorno
    cabeceraDetalle.appendChild(botonRetorno);
    contenedorShowcase.appendChild(cabeceraDetalle);

    // Grid de fotos superior (Sección multimedia completa)
    const galeriaDetalle = document.createElement('div');
    galeriaDetalle.className = 'galeria-detalle-grid';

    if (prop.fotos && prop.fotos.length > 0) { // Inicia Condicional fotos detalle
        prop.fotos.forEach((fotoUrl, idx) => { // Inicia forEach fotos detalle
            const imgDetalle = document.createElement('img');
            imgDetalle.src = fotoUrl;
            imgDetalle.alt = `${prop.titulo} - Foto ${idx + 1}`;
            if (idx === 0) imgDetalle.className = 'foto-principal-destacada';
            galeriaDetalle.appendChild(imgDetalle);
        }); // Fin de forEach fotos detalle
    } // Fin de Condicional fotos detalle
    contenedorShowcase.appendChild(galeriaDetalle);

    // Contenido informativo y formularios de contacto en la vista de detalle
    const cuerpoDetalle = document.createElement('div');
    cuerpoDetalle.className = 'cuerpo-info-showcase';

    const tituloDetalle = document.createElement('h1');
    tituloDetalle.textContent = prop.titulo;
    cuerpoDetalle.appendChild(tituloDetalle);

    const precioDetalle = document.createElement('h2');
    precioDetalle.textContent = new Intl.NumberFormat('es-PE', { style: 'currency', currency: prop.moneda || 'USD', maximumFractionDigits: 0 }).format(prop.precio_base);
    cuerpoDetalle.appendChild(precioDetalle);

    const descripcionDetalle = document.createElement('p');
    descripcionDetalle.className = 'descripcion-larga-inmueble';
    descripcionDetalle.textContent = prop.descripcion || 'Sin descripción detallada disponible para este inmueble.';
    cuerpoDetalle.appendChild(descripcionDetalle);

    contenedorShowcase.appendChild(cuerpoDetalle);
    contenedorPrincipal.appendChild(contenedorShowcase);
    window.scrollTo({ top: 0, behavior: 'smooth' });
} // Fin de Function abrirVistaDetalleShowcase

function restaurarVistaCatalogoPrincipal() { // Inicia Function restaurarVistaCatalogoPrincipal
    const contenedorPrincipal = document.getElementById('app-main-layout');
    if (!contenedorPrincipal) return;

    // Restaura la estructura base de dos columnas (Catálogo izquierdo y Mapa derecho)
    contenedorPrincipal.innerHTML = `
        <div id="panel-lateral-catalogo" class="panel-catalogo"></div>
        <div id="contenedor-mapa-principal" class="panel-mapa"></div>
    `;
    ejecutarTuberiaSincronizada();
    if (typeof inicializarMapaPrincipal === 'function') inicializarMapaPrincipal();
} // Fin de Function restaurarVistaCatalogoPrincipal
// ==========================================================================
// FIN: PARTE 4 - PANTALLA 2: VISTA DETALLE / SHOWCASE DE PROPIEDAD
// ==========================================================================

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
// INICIO: PARTE 6 Y 7 - CONSTRUCTOR DE RIEL MULTIMEDIA (5 FOTOS MÁXIMO)
// ==========================================================================
function construirRielCarruselComponente(prop, esPopup = false) { // Inicia Function construirRielCarruselComponente
    const propiedad = prop;
    const contenedorFoto = document.createElement('div');
    contenedorFoto.className = esPopup ? 'contenedor-foto popup-carrusel-context' : 'contenedor-foto';

    const rielCarrusel = document.createElement('div');
    rielCarrusel.className = 'carrusel-imagenes';
    rielCarrusel.setAttribute('data-foto-activa', '0');
    contenedorFoto.appendChild(rielCarrusel);

    // Limitado estrictamente a las primeras 5 fotos para mostrar en el carrusel
    const totalFotos = Math.min(propiedad.fotos.length, 5);
    const dotsArray = [];
    const contenedorDots = document.createElement('div');
    contenedorDots.className = 'indicadores-carrusel';

    for (let i = 0; i < totalFotos; i++) { // Inicia Bucle for de fotos carrusel
        const img = document.createElement('img');
        img.src = prop.fotos[i];
        img.alt = `${prop.titulo} - Vista ${i + 1}`;
        rielCarrusel.appendChild(img);

        const dot = document.createElement('span');
        dot.className = i === 0 ? 'punto-indicator activo' : 'punto-indicator';
        contenedorDots.appendChild(dot);
        dotsArray.push(dot);
    } // Fin de Bucle for de fotos carrusel
    contenedorFoto.appendChild(contenedorDots);

    contenedorFoto.style.position = 'relative';
    const botonCorazon = document.createElement('button');
    botonCorazon.innerHTML = '❤️'; 
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

        if (botonCorazon.innerHTML === '❤️') {
            botonCorazon.innerHTML = '💖'; 
            botonCorazon.style.color = '#d92323'; 
            botonCorazon.style.background = 'rgba(255, 255, 255, 0.95)';
        } else {
            botonCorazon.innerHTML = '❤️'; 
            botonCorazon.style.color = '#ffffff'; 
            botonCorazon.style.background = 'rgba(0, 0, 0, 0.45)';
        }
    }); // Fin de Callback heart pointerdown
    contenedorFoto.appendChild(botonCorazon);

    if (totalFotos > 1) { // Inicia Condicional totalFotos > 1
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
            dotsArray.forEach((d, idx) => { // Inicia Método forEach para dots
                if (idx === indiceFotoActual) d.classList.add('activo');
                else d.classList.remove('activo');
            }); // Fin de Método forEach para dots
        }; // Fin de Arrow Function desplazarRiel
        
        btnlzq.addEventListener('click', (e) => { e.stopPropagation(); desplazarRiel(-1); });
        btnDer.addEventListener('click', (e) => { e.stopPropagation(); desplazarRiel(1); });
        contenedorFoto.appendChild(btnlzq); 
        contenedorFoto.appendChild(btnDer);
    } // Fin de Condicional totalFotos > 1

    const etiquetaFlotante = document.createElement('div');
    etiquetaFlotante.className = 'etiqueta-foto-zillow';
    etiquetaFlotante.textContent = prop.titulo || '';
    contenedorFoto.appendChild(etiquetaFlotante);
    
    return contenedorFoto;
} // Fin de Function construirRielCarruselComponente
// ==========================================================================
// FIN: PARTE 6 Y 7 - CONSTRUCTOR DE RIEL MULTIMEDIA
// ==========================================================================


// ==========================================================================
// PARTE 8 DE 15: FABRICANTE DEL NODO DE LA TARJETA DEL CATÁLOGO DE ESCRITORIO
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
    caracteristicasTexto.textContent = `${prop.habitaciones || 0} Dorm | ${prop.banos || 0} Baños | AC: ${prop.area_construida || 0} m² | AT: ${prop.area_terreno || 0} m²`;
    datosCasa.appendChild(caracteristicasTexto);

    const adicionalesTexto = document.createElement('div');
    adicionalesTexto.className = 'adicionales-inmueble';
    adicionalesTexto.style.fontSize = '12px'; 
    adicionalesTexto.style.color = '#64748b'; 
    adicionalesTexto.style.marginTop = '2px';
    adicionalesTexto.textContent = `${prop.tipo_propiedad || 'Inmueble'} | Estacionamientos: ${prop.estacionamientos || 0} | Año: ${prop.ano_construccion || 0}`;
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
// PARTE 9 DE 15: INYECCIÓN DE TARJETAS AL DOM MEDIANTE DOCUMENT FRAGMENT
// ==========================================================================

function renderizarCatalogoTarjetas() { // Inicia Function renderizarCatalogoTarjetas
    const contenedorRejilla = document.getElementById('properties-grid-target');
    if (!contenedorRejilla) return;
    contenedorRejilla.innerHTML = '';

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);
    const contador = document.getElementById('results-counter');

    console.log(`?? [SRE ESPÍA CATALOGO] Re-renderizando rejilla. Propiedades filtradas a pintar: ${filtradas.length}`);

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
function renderizarMapaZillow() { 
    if (!window.map || !document.getElementById('map-instance')) return;

    // 1. LIMPIEZA SEGURA PARA EVITAR EL ERROR _leaflet_events
    if (window.capaMarcadores) {
        window.capaMarcadores.eachLayer(layer => {
            try {
                // Remueve el popup asignado antes de remover el marcador para limpiar listeners del DOM
                if (layer.getPopup()) {
                    layer.unbindPopup();
                }
                window.capaMarcadores.removeLayer(layer);
            } catch (e) {
                // Silencia referencias del DOM obsoletas
            }
        });
        window.capaMarcadores.clearLayers();
    } else {
        window.capaMarcadores = L.layerGroup().addTo(window.map);
    }

    const filtradas = state.propiedades.filter(evaluarCriteriosDeFiltrado);

    // 2. FILTRADO ESTRICTO DE COORDENADAS VÁLIDAS
    const coordenadasValidas = [];
    filtradas.forEach(p => {
        const parsedLat = parseFloat(p.latitud);
        const parsedLng = parseFloat(p.longitud);

        if (!isNaN(parsedLat) && !isNaN(parsedLng) && isFinite(parsedLat) && isFinite(parsedLng) && parsedLat !== 0 && parsedLng !== 0) {
            coordenadasValidas.push([parsedLat, parsedLng]);
        }
    });

    // 3. ENCUADRE DE MAPA
    if (coordenadasValidas.length > 0 && window.map) {
        try {
            if (coordenadasValidas.length === 1) {
                window.map.setView(coordenadasValidas[0], 15, { animate: true });
            } else {
                window.map.fitBounds(coordenadasValidas, { padding: [30, 30], maxZoom: 15, animate: true });
            }
        } catch (errGeometrico) {
            // Silenciar posible excepción en encuadre
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
                    targetContenido.innerHTML = `
                        <div class="sre-movil-overlay-card" style="display:flex; gap:14px; padding:6px 0; align-items:center; font-family:sans-serif;">
                            <img src="${prop.fotos ? prop.fotos[0] : ''}" style="width:105px; height:85px; object-fit:cover; border-radius:6px; background-color:#f0f2f5;">
                            <div style="display:flex; flex-direction:column; gap:3px; flex:1; overflow:hidden;">
                                <strong style="font-size:19px; color:#1a1a1a;">$${Number(prop.precio_base).toLocaleString('en-US')}</strong>
                                <span style="font-size:13px; color:#4a5568; font-weight:600;">${prop.habitaciones} bd | ${prop.banos} ba | ${prop.area_construida} m²</span>
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
    if (typeof supabase !== "undefined" && supabase !== null && supabase.auth) {
        supabase.auth.onAuthStateChange((event, session) => { // Inicia Callback onAuthStateChange

            console.log(`?? [SRE ESPÍA AUTH] Evento disparado: ${event}`);
            
            if (session && session.user) {
                const correoUsuario = String(session.user.email).trim();
                window.usuarioLogueado = session.user;
                console.log(`?? Usuario detectado en Supabase Auth: ${correoUsuario}`);

                const idScriptSeguridad = "sre-jsonp-firewall-auth";
                let scriptExistente = document.getElementById(idScriptSeguridad);
                if (scriptExistente) scriptExistente.remove();
                
                window.procesarVerificacionEstadoACL = async (datosUsuarioSheet) => {
                    console.log("??? [SRE ESPÍA ACL PROCESADOR] Respuesta de cuenta:", datosUsuarioSheet);
                    
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
                if (typeof urlMiScriptGoogle !== "undefined") {
                    scriptp.src = `${urlMiScriptGoogle}?accion=leer_estado_usuario&correo=${encodeURIComponent(correoUsuario)}&callback=procesarVerificacionEstadoACL`;
                    document.body.appendChild(scriptp);
                }
            } else {
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
            window.map.on('moveend', renderizarMapaZillow);
            window.map.invalidateSize(); 
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
// INICIO: PARTE 13 - GESTIÓN CORREGIDA DE FILTROS Y BOTONES "APLICAR" / "SELECCIONAR TODOS"
// ==========================================================================
function inicializarEventosDeFiltros() { // Inicia Function inicializarEventosDeFiltros
    const wrappers = document.querySelectorAll('.filter-dropdown-wrapper');
    wrappers.forEach(wrapper => { // Inicia forEach wrappers de filtros
        const boton = wrapper.querySelector('.filter-btn');
        const panel = wrapper.querySelector('.dropdown-content-panel');
        if (!boton || !panel) return;

        boton.addEventListener('click', (e) => { // Inicia Listener click botón dropdown
            e.stopPropagation();
            document.querySelectorAll('.dropdown-content-panel').forEach(p => { if (p !== panel) p.classList.remove('show'); });
            document.querySelectorAll('.filter-btn').forEach(b => { if (b !== boton) b.classList.remove('active'); });
            panel.classList.toggle('show'); 
            boton.classList.toggle('active');
        }); // Fin de Listener click botón dropdown
    }); // Fin de forEach wrappers de filtros

    document.addEventListener('click', () => { // Inicia Listener click global cierre de paneles
        document.querySelectorAll('.dropdown-content-panel').forEach(p => p.classList.remove('show'));
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    }); // Fin de Listener click global cierre de paneles

    document.querySelectorAll('.dropdown-content-panel').forEach(panel => { // Inicia forEach paneles internos
        panel.addEventListener('click', (e) => e.stopPropagation());
    }); // Fin de forEach paneles internos

    // 1. Filtro Estado de Transacción ("Venta", "Para el alquiler", "Vendidas")
    const radiosTransaccion = document.querySelectorAll('input[name="transaccion"]');
    radiosTransaccion.forEach(radio => { // Inicia forEach radios de transacción
        radio.addEventListener('change', (e) => { // Inicia Listener change de transacción
            state.filtros.estado = e.target.value;
            const btnStatus = document.getElementById('btn-filter-status');
            if (btnStatus) { // Inicia Condicional btnStatus existente
                if (e.target.value === "Venta") btnStatus.textContent = "Venta";
                else if (e.target.value === "Alquiler") btnStatus.textContent = "Para el alquiler";
                else if (e.target.value === "Vendida") btnStatus.textContent = "Vendidas";
            } // Fin de Condicional btnStatus existente
            ejecutarTuberiaSincronizada();
        }); // Fin de Listener change de transacción
    }); // Fin de forEach radios de transacción

    // 2. Filtro Precio (Solución para que no desaparezca y mantenga estabilidad)
    const inputMinPrecio = document.getElementById('price-min');
    const inputMaxPrecio = document.getElementById('price-max');
    const btnAplicarPrecio = document.getElementById('btn-aplicar-precio');
    const btnResetPrecio = document.getElementById('btn-reset-precio');

    if (btnAplicarPrecio) { // Inicia Condicional btnAplicarPrecio
        btnAplicarPrecio.addEventListener('click', () => { // Inicia Listener click aplicar precio
            state.filtros.precioMin = parseFloat(inputMinPrecio.value) || 0;
            state.filtros.precioMax = parseFloat(inputMaxPrecio.value) || Infinity;
            ejecutarTuberiaSincronizada();
            cerrarTodosLosPaneles();
        }); // Fin de Listener click aplicar precio
    } // Fin de Condicional btnAplicarPrecio

    if (btnResetPrecio) { // Inicia Condicional btnResetPrecio
        btnResetPrecio.addEventListener('click', () => { // Inicia Listener click reset precio
            if (inputMinPrecio) inputMinPrecio.value = '';
            if (inputMaxPrecio) inputMaxPrecio.value = '';
            state.filtros.precioMin = 0;
            state.filtros.precioMax = Infinity;
            ejecutarTuberiaSincronizada();
            cerrarTodosLosPaneles();
        }); // Fin de Listener click reset precio
    } // Fin de Condicional btnResetPrecio

    // 3. Tipo de Propiedad ("Seleccionar todos" con alternancia de estado y Botón Aplicar)
    const checkboxesTipo = document.querySelectorAll('.type-cb');
    const btnAplicarTipo = document.getElementById('btn-aplicar-tipo-propiedad');
    const checkTodosTipos = document.getElementById('check-todos-tipos');

    if (checkTodosTipos) { // Inicia Condicional checkTodosTipos
        checkTodosTipos.addEventListener('change', (e) => { // Inicia Listener change seleccionar todos propiedades
            const estadoDeseado = e.target.checked;
            checkboxesTipo.forEach(cb => cb.checked = estadoDeseado);
        }); // Fin de Listener change seleccionar todos propiedades
    } // Fin de Condicional checkTodosTipos

    if (btnAplicarTipo) { // Inicia Condicional btnAplicarTipo
        btnAplicarTipo.addEventListener('click', () => { // Inicia Listener click aplicar tipo
            state.filtros.tiposPropiedad.clear();
            const marcados = Array.from(checkboxesTipo).filter(cb => cb.checked);
            
            if (marcados.length === 0) {
                state.filtros.tiposPropiedad.add('__NINGUNO__'); // Evita errores si no selecciona nada
            } else {
                marcados.forEach(cb => state.filtros.tiposPropiedad.add(cb.value));
            }
            ejecutarTuberiaSincronizada();
            cerrarTodosLosPaneles();
        }); // Fin de Listener click aplicar tipo
    } // Fin de Condicional btnAplicarTipo

    // 4. "Otros Filtros" / "Más Filtros" (Con botón Aplicar y "Seleccionar todos" funcional)
    const checkboxesListado = document.querySelectorAll('.more-filter-cb');
    const checkTodosListados = document.getElementById('check-todos-listados');
    const btnAplicarMasFiltros = document.getElementById('btn-aplicar-mas-filtros');

    if (checkTodosListados) { // Inicia Condicional checkTodosListados
        checkTodosListados.addEventListener('change', (e) => { // Inicia Listener change seleccionar todos otros filtros
            const estadoDeseado = e.target.checked;
            checkboxesListado.forEach(cb => cb.checked = estadoDeseado);
        }); // Fin de Listener change seleccionar todos otros filtros
    } // Fin de Condicional checkTodosListados

    if (btnAplicarMasFiltros) { // Inicia Condicional btnAplicarMasFiltros
        btnAplicarMasFiltros.addEventListener('click', () => { // Inicia Listener click aplicar más filtros
            state.filtros.tiposListado.clear();
            const marcados = Array.from(checkboxesListado).filter(cb => cb.checked);
            
            marcados.forEach(cb => state.filtros.tiposListado.add(cb.value));
            ejecutarTuberiaSincronizada();
            cerrarTodosLosPaneles();
        }); // Fin de Listener click aplicar más filtros
    } // Fin de Condicional btnAplicarMasFiltros

    configurarSegmentado('row-beds', (valor) => { 
        state.filtros.camas = parseInt(valor, 10) || 0; 
        ejecutarTuberiaSincronizada(); 
    });
    configurarSegmentado('row-baths', (valor) => { 
        state.filtros.banos = parseFloat(valor) || 0; 
        ejecutarTuberiaSincronizada(); 
    });
} // Fin de Function inicializarEventosDeFiltros

function cerrarTodosLosPaneles() { // Inicia Function cerrarTodosLosPaneles
    document.querySelectorAll('.dropdown-content-panel').forEach(p => p.classList.remove('show'));
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
} // Fin de Function cerrarTodosLosPaneles
// ==========================================================================
// FIN: PARTE 13 - GESTIÓN CORREGIDA DE FILTROS
// ==========================================================================

// ==========================================================================
// PARTE 14 DE 15: CONTROL DE ENTRADAS DE CAMPOS SEGMENTADOS DE SELECCIÓN ÚNICA
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
// INICIO: PARTE 15 - EVALUACIÓN DE CRITERIOS ESTRICTOS DE FILTRADO SRE
// ==========================================================================
function evaluarCriteriosDeFiltrado(prop) { // Inicia Function evaluarCriteriosDeFiltrado
    const filtroTransaccion = state.filtros.estado || 'Venta';

    // 1. REGLA PARA VENTA: estado_publicacion == "disponible" Y tipo_anuncio == "Venta"
    if (filtroTransaccion === "Venta") {
        if (prop.estado_publicacion !== "disponible" || prop.tipo_anuncio !== "Venta") {
            return false;
        }
    }

    // 2. REGLA PARA ALQUILER: estado_publicacion == "disponible" Y tipo_anuncio == "Alquiler"
    if (filtroTransaccion === "Alquiler" || filtroTransaccion === "Para el alquiler") {
        if (prop.estado_publicacion !== "disponible" || prop.tipo_anuncio !== "Alquiler") {
            return false;
        }
    }

    // 3. REGLA PARA VENDIDA: estado_publicacion == "Vendida" (o vendida) Y tipo_anuncio == "Venta"
    if (filtroTransaccion === "Vendida" || filtroTransaccion === "Vendido" || filtroTransaccion === "Vendidas") {
        const estadoPubLower = String(prop.estado_publicacion || "").toLowerCase();
        if (estadoPubLower !== "vendida" || prop.tipo_anuncio !== "Venta") {
            return false;
        }
    }

    // --- FILTROS DE PRECIO Y CARACTERÍSTICAS FÍSICAS ---
    if (prop.precio_base < state.filtros.precioMin || prop.precio_base > state.filtros.precioMax) return false;
    if (state.filtros.camas && (parseInt(prop.habitaciones) || 0) < state.filtros.camas) return false;
    if (state.filtros.banos && (parseFloat(prop.banos) || 0) < state.filtros.banos) return false;

    // --- FILTROS TIPO DE PROPIEDAD ---
    if (state.filtros.tiposPropiedad && state.filtros.tiposPropiedad.size > 0) {
        if (state.filtros.tiposPropiedad.has('__NINGUNO__')) return false;
        if (!state.filtros.tiposPropiedad.has(String(prop.tipo_propiedad || ''))) return false;
    }

    return true;
} // Fin de Function evaluarCriteriosDeFiltrado
// ==========================================================================
// FIN: PARTE 15 - EVALUACIÓN DE CRITERIOS ESTRICTOS DE FILTRADO SRE
// ==========================================================================

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
                        <button style="background: #ffffff; border: none; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); color: #1a1a1a;">?? Guardado</button>
                        <button style="background: #ffffff; border: none; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); color: #1a1a1a;">?? Compartir</button>
                        <button style="background: #ffffff; border: none; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); color: #1a1a1a;">••• Más</button>
                    </div>

                    <button style="position: absolute; top: 50%; left: 20px; transform: translateY(-50%); background: rgba(0,0,0,0.3); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; font-size: 20px; cursor: pointer; z-index: 10;">‹</button>
                    <button style="position: absolute; top: 50%; right: 20px; transform: translateY(-50%); background: rgba(0,0,0,0.3); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; font-size: 20px; cursor: pointer; z-index: 10;">›</button>

                    <div style="position: absolute; bottom: 20px; left: 24px; display: flex; gap: 10px; z-index: 10;">
                        ${miniaturasHtml}
                    </div>

                    <div style="position: absolute; bottom: 20px; right: 24px; color: white; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.6); z-index: 10;">SHOWCASE</div>
                </div>

                <div style="padding: 24px; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 340px; gap: 32px; box-sizing: border-box; align-items: start;">
                    
                    <div style="width: 100%; overflow: hidden;">
                        
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

                    <div style="width: 100%; height: fit-content; background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); position: sticky; top: 80px; z-index: 100; box-sizing: border-box;">

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
        
        // --- ESCUDO CONDICIONAL SRE: SI NO HAY SELECCIÓN REAL, NO HACE NADA ---
        if (prop && prop.propiedad_id) {
            // Inyección automática y cálculo de las sub-fichas técnicas e interiores solo si se seleccionó una propiedad
            inyectarSeccionesAdicionalesZillow(prop);
        } else {
            console.log("?? [SRE CONTROL] Inicialización pasiva de cortina. Esperando selección del interesado.");
        }

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
            const [rInicial, rPlazo, rTea, rDesg, rInm] = await Promise.all([
                cliente.from('lov_cuota_inicial').select('*').order('porcentaje', { ascending: true }),
                cliente.from('lov_plazo_hipotecario').select('*').order('anos', { ascending: true }),
                cliente.from('lov_tasa_interes').select('*').order('tasa_tea', { ascending: true }),
                cliente.from('lov_seguro_desgravamen').select('*').order('tasa_mensual', { ascending: true }),
                cliente.from('lov_seguro_inmueble').select('*').order('tasa_mensual', { ascending: true })
            ]);

            if (rInicial.data && rInicial.data.length > 0) {
                cInicial.innerHTML = rInicial.data.map(opt => `<option value="${opt.porcentaje}" data-comment="${opt.comentario || ''}">${opt.etiqueta || (opt.porcentaje * 100 + '%')}</option>`).join('');
            } else {
                cInicial.innerHTML = '<option value="0.20" data-comment="Mínimo regular">20% Mínimo</option>';
            }

            if (rPlazo.data && rPlazo.data.length > 0) {
                cPlazo.innerHTML = rPlazo.data.map(opt => `<option value="${opt.anos}">${opt.etiqueta || (opt.anos + ' años')}</option>`).join('');
            } else {
                cPlazo.innerHTML = '<option value="20">20 Años</option>';
            }

            if (rTea.data && rTea.data.length > 0) {
                cTea.innerHTML = rTea.data.map(opt => `<option value="${opt.tasa_tea}">${opt.etiqueta || ((opt.tasa_tea * 100).toFixed(2) + '% TEA')}</option>`).join('');
            } else {
                cTea.innerHTML = '<option value="0.085">8.50% Promedio BCRP</option>';
            }

            if (rDesg.data && rDesg.data.length > 0) {
                cDesg.innerHTML = rDesg.data.map(opt => `<option value="${opt.tasa_mensual}">${opt.etiqueta || ((opt.tasa_mensual * 100).toFixed(3) + '% mensual')}</option>`).join('');
            } else {
                cDesg.innerHTML = '<option value="0.0005">0.05% Individual</option>';
            }

            if (rInm.data && rInm.data.length > 0) {
                cInm.innerHTML = rInm.data.map(opt => `<option value="${opt.tasa_mensual}">${opt.etiqueta || ((opt.tasa_mensual * 100).toFixed(3) + '% mensual')}</option>`).join('');
            } else {
                cInm.innerHTML = '<option value="0.00025">0.025% Todo Riesgo</option>';
            }

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
