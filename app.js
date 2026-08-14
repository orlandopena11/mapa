/**
 * ==========================================================================
 * PARTE: 1-5 (ÁMBITO DE ESTADO PROTEGIDO E INICIALIZACIÓN DE LEAFLET)
 * ==========================================================================
 */
const AppInmobiliaria = (function() {
    // Estado interno protegido (Evita inyecciones externas y variables globales)
    const state = {
        map: null,
        markersGroup: [],
        propertiesData: [], // Base de datos maestra normalizada
        filteredData: [],   // Colección filtrada en tiempo real
        favoritosUsuario: [],
        activeListeners: [],
        activeFilters: {
            transaccion: "venta",
            priceMin: null,
            priceMax: 1300000,
            beds: 0,
            bedsExact: false,
            baths: 0,
            types: [],
            hoa: "any",
            listTypes: ["Propietario publicado", "Agente listado", "Nueva construccion", "Ejecucion hipotecaria", "Subasta"],
            tour3d: false,
            parking: "any",
            builtMin: null, builtMax: null,
            lotMin: null, lotMax: null,
            yearMin: null, yearMax: null,
            basement: false, storage: false, view: false,
            days: "any"
        },
        cloudinaryBase: "https://res.cloudinary.com/obw6ciov/image/upload/v1785207128/"
    };

    // 1. Inicialización de la Instancia de Leaflet buscando cualquier ID compatible
    function initMap() {
        // Selector elástico: Busca 'mapa', 'map-instance' o 'map' según lo que tenga tu index.html
        const containerId = document.getElementById('mapa') ? 'mapa' : 
                            (document.getElementById('map-instance') ? 'map-instance' : 
                            (document.getElementById('map') ? 'map' : null));
                            
        if (!containerId) {
            console.error("Fallo de maquetación: No se encontró ningún contenedor válido para el mapa ('mapa', 'map-instance' o 'map').");
            return false;
        }

        state.map = L.map(containerId, {
            zoomControl: false,
            doubleClickZoom: true,
            tap: false
        }).setView([-12.125, -76.995], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(state.map);

        L.control.zoom({ position: 'topright' }).addTo(state.map);
        return true;
    }

/**
 * ==========================================================================
 * PARTE: 2-5 (CONECTIVIDAD ASÍNCRONA HÍBRIDA AUTO-LIMPIABLE - EN PRODUCCIÓN)
 * ==========================================================================
 */
    // 2. Sincronización Segura con Google Apps Script (Soporta JSON y JSONP)
    function fetchSpreadsheetData() {
        const urlScript = "https://script.google.com/macros/s/AKfycbyfNpA-Zf_C-uqDxpzX1phQqREIXAhgSvFyVj2VAhWp2-h7wN_2uR44b3wkg152STAzrQ/exec";

        // Usamos la API de texto para capturar la respuesta cruda y limpiarla de envoltorios
        fetch(urlScript)
            .then(response => response.text())
            .then(responseText => {
                let cleanText = responseText.trim();
                
                // Si la respuesta viene envuelta en la función JSONP, removemos el prefijo y el sufijo
                if (cleanText.startsWith("procesarDatosDelMotor")) {
                    cleanText = cleanText.replace(/^procesarDatosDelMotor\s*\(/, "").replace(/\);?$/, "");
                }
                
                // Parseo manual una vez que la cadena ha sido sanitizada y despojada de caracteres JSONP
                const data = JSON.parse(cleanText);
                
                const propiedadesOriginales = data.propiedades || data;
                const tablaImagenes = data.imagenes || [];

                state.propertiesData = propiedadesOriginales.map(function(prop) {
                    const idProp = prop.propiedad_id || prop.id || "";
                    let fotosFiltradas = [];
                    if (idProp) {
                        fotosFiltradas = tablaImagenes
                            .filter(img => String(img.propiedad_id_fk || img.propiedad_id).trim() === String(idProp).trim())
                            .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0))
                            .map(img => img.ruta_imagen || img.url || "");
                    }
                    if (fotosFiltradas.length > 0) {
                        prop.fotos = fotosFiltradas;
                    }
                    return normalizarEstructuraInmueble(prop);
                });

                state.filteredData = [...state.propertiesData];
                buildPriceHistogram();
                renderAppContent();
            })
            .catch(error => {
                const contador = document.getElementById('contador-propiedades') || document.getElementById('results-counter');
                if (contador) contador.textContent = "Error de sincronización con la base de datos.";
            });
    }

    function buildCloudinaryUrl(publicId) {
        if (!publicId) return "https://unsplash.com";
        if (String(publicId).startsWith("http")) return publicId;
        return `${state.cloudinaryBase}${String(publicId).trim().replace(/\s+/g, "_").replace(/^\/+/, "")}`;
    }

    function normalizarEstructuraInmueble(prop) {
        prop.precio_base = parseFloat(prop.precio_base ?? prop.precio ?? 0);
        prop.habitaciones = parseInt(prop.habitaciones ?? prop.hab ?? 0);
        prop.banos = parseFloat(prop.banos ?? prop.baños ?? 0);
        prop.area_construida = parseFloat(prop.area_construida ?? prop.area ?? 0);
        prop.area_terreno = parseFloat(prop.area_terreno ?? 0);
        prop.cuota_mantenimiento = parseFloat(prop.cuota_mantenimiento ?? 0);
        prop.ano_construccion = parseInt(prop.ano_construccion || prop.anio || 0);
        
        prop.direccion = String(prop.direccion || "").trim();
        prop.estado_publicacion = String(prop.estado_publicacion || "").toLowerCase().trim();
        prop.tipo_anuncio = String(prop.tipo_anuncio || "").toLowerCase().trim();
        prop.tipo_propiedad = String(prop.tipo_propiedad || "").trim();
        prop.situacion_propiedad = String(prop.situacion_propiedad || prop.tipo_listado || "").trim();
        
        const fotosPool = [];
        if (prop.foto_principal) fotosPool.push(prop.foto_principal);
        if (Array.isArray(prop.fotos)) fotosPool.push(...prop.fotos);
        prop.fotos_unicas = [...new Set(fotosPool.filter(Boolean))];
        
        return prop;
    }

    function sanitizeHtmlString(unsafeText) {
        if (!unsafeText) return '';
        return String(unsafeText)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function formatCompactPrice(priceValue) {
        const num = Number(priceValue || 0);
        if (num >= 1000000) return `S/. ${(num / 1000000).toFixed(2)}M`;
        if (num >= 1000) return `S/. ${(num / 1000).toFixed(0)}K`;
        return `S/. ${num}`;
    }

    function buildPriceHistogram() {
        const histogramBox = document.getElementById('price-histogram-box');
        if (!histogramBox) return;
        histogramBox.innerHTML = '';
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 24; i++) {
            const bar = document.createElement('div');
            bar.className = 'histogram-bar-node in-range';
            bar.style.height = Math.floor(Math.random() * 45) + 15 + 'px';
            fragment.appendChild(bar);
        }
        histogramBox.appendChild(fragment);
    }

    // ==========================================================================
    // PARTE: 3-5 (CONSTRUCTOR DE MICRO-CARRUSEL INTERACTIVO PARA DOBLE VISTA)
    // ==========================================================================
    function buildSecureCarouselComponent(property) {
        const imageBox = document.createElement('div');
        // Soporta de forma elástica tanto tus clases nativas antiguas como las nuevas de Zillow V2
        imageBox.className = document.querySelector('.contenedor-foto') ? 'contenedor-foto' : 'card-image-box';

        const imagesCollection = property.fotos_unicas.slice(0, 5);
        if (imagesCollection.length === 0) imagesCollection.push("");

        let activeIndex = 0;
        const totalImages = imagesCollection.length;

        const trackContainer = document.createElement('div');
        trackContainer.className = document.querySelector('.carrusel-imagenes') ? 'carrusel-imagenes' : 'carousel-track-container';
        
        const imageNodes = [];
        imagesCollection.forEach((imgId, idx) => {
            const imgElement = document.createElement('img');
            imgElement.src = buildCloudinaryUrl(imgId);
            imgElement.alt = 'Vivienda';
            imgElement.style.width = "100%";
            imgElement.style.height = "100%";
            imgElement.style.objectFit = "cover";
            imgElement.style.display = idx === 0 ? 'block' : 'none';
            // Clases elásticas de compatibilidad visual
            imgElement.className = 'carousel-img';
            if (idx === 0) imgElement.classList.add('carousel-img--active');
            
            trackContainer.appendChild(imgElement);
            imageNodes.push(imgElement);
        });
        imageBox.appendChild(trackContainer);

        if (property.estado) {
            const badge = document.createElement('div');
            badge.className = document.querySelector('.badge') ? 'badge' : 'card-badge';
            badge.textContent = sanitizeHtmlString(property.estado);
            imageBox.appendChild(badge);
        }

        if (property.frase_descriptiva) {
            const infoBanner = document.createElement('div');
            infoBanner.className = 'card-info-banner';
            infoBanner.textContent = sanitizeHtmlString(property.frase_descriptiva);
            imageBox.appendChild(infoBanner);
        }

        const favButton = document.createElement('button');
        favButton.className = document.querySelector('.corazon-favorito') ? 'corazon-favorito' : 'card-fav-btn';
        const propertyKey = property.direccion;
        const isFav = state.favoritosUsuario.includes(propertyKey);
        favButton.textContent = isFav ? '♥' : '♡';
        if (isFav) favButton.style.color = '#d92323';

        const favClickHandler = function(e) {
            e.stopPropagation(); e.preventDefault();
            const index = state.favoritosUsuario.indexOf(propertyKey);
            if (index > -1) {
                state.favoritosUsuario = state.favoritosUsuario.filter(k => k !== propertyKey);
            } else {
                state.favoritosUsuario = [...state.favoritosUsuario, propertyKey];
            }
            
            document.querySelectorAll('.corazon-favorito, .card-fav-btn').forEach(btn => {
                const parent = btn.closest('.tarjeta-casa') || btn.closest('.property-card') || btn.closest('.popup-custom-container');
                if (parent) {
                    const addressNode = parent.querySelector('.direccion-texto') || parent.querySelector('.prop-address');
                    if (addressNode && addressNode.textContent === propertyKey) {
                        const nowFav = state.favoritosUsuario.includes(propertyKey);
                        btn.textContent = nowFav ? '♥' : '♡';
                        btn.style.color = nowFav ? '#d92323' : '#002650';
                    }
                }
            });
        };
        favButton.addEventListener('click', favClickHandler);
        state.activeListeners.push({ element: favButton, type: 'click', handler: favClickHandler });
        imageBox.appendChild(favButton);

        if (totalImages > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = document.querySelector('.flecha-carrusel') ? 'flecha-carrusel flecha-izq' : 'carousel-nav-btn carousel-nav-btn--prev';
            prevBtn.textContent = '‹';
            const nextBtn = document.createElement('button');
            nextBtn.className = document.querySelector('.flecha-carrusel') ? 'flecha-carrusel flecha-der' : 'carousel-nav-btn carousel-nav-btn--next';
            nextBtn.textContent = '›';

            const shiftCarouselIndex = function(offset) {
                imageNodes[activeIndex].style.display = 'none';
                imageNodes[activeIndex].classList.remove('carousel-img--active');
                activeIndex = (activeIndex + offset + totalImages) % totalImages;
                imageNodes[activeIndex].style.display = 'block';
                imageNodes[activeIndex].classList.add('carousel-img--active');
            };

            const prevH = function(e) { e.stopPropagation(); e.preventDefault(); shiftCarouselIndex(-1); };
            const nextH = function(e) { e.stopPropagation(); e.preventDefault(); shiftCarouselIndex(1); };

            prevBtn.addEventListener('click', prevH);
            nextBtn.addEventListener('click', nextH);
            state.activeListeners.push({ element: prevBtn, type: 'click', handler: prevH });
            state.activeListeners.push({ element: nextBtn, type: 'click', handler: nextH });

            imageBox.appendChild(prevBtn);
            imageBox.appendChild(nextBtn);
        }

        return imageBox;
    }
    // ==========================================================================
    // PARTE: 4-5 (MOTOR DE RENDERIZADO DE REJILLA Y BUBBLE PIN EN EL MAPA)
    // ==========================================================================
    function renderAppContent() {
        // Enlaza de forma adaptativa a cualquier ID que tenga tu grilla de resultados
        const gridTarget = document.getElementById('contenedor-tarjetas') || document.getElementById('properties-grid-target');
        const counterTarget = document.getElementById('contador-propiedades') || document.getElementById('results-counter');
        
        clearActiveListeners();
        if (gridTarget) gridTarget.innerHTML = '';
        clearActiveMarkers();

        if (counterTarget) {
            counterTarget.textContent = `${state.filteredData.length} Viviendas Disponibles`;
        }
        
        const documentFragment = document.createDocumentFragment();

        state.filteredData.forEach(function(property) {
            const safeAddress = sanitizeHtmlString(property.direccion);
            const safePrice = property.precio_base.toLocaleString('es-PE');
            const compactPriceLabel = formatCompactPrice(property.precio_base);
            
            const card = document.createElement('div');
            card.className = document.getElementById('contenedor-tarjetas') ? 'tarjeta-casa' : 'property-card';
            card.appendChild(buildSecureCarouselComponent(property));

            const contentBox = document.createElement('div');
            contentBox.className = document.getElementById('contenedor-tarjetas') ? 'datos-casa' : 'card-content';
            
            const precioDiv = document.createElement('div');
            precioDiv.className = document.getElementById('contenedor-tarjetas') ? 'precio' : 'prop-price';
            precioDiv.textContent = 'S/. ' + safePrice;
            contentBox.appendChild(precioDiv);

            const specsDiv = document.createElement('div');
            specsDiv.className = document.getElementById('contenedor-tarjetas') ? 'caracteristicas' : 'prop-specs';
            specsDiv.textContent = (property.habitaciones || 0) + ' bd | ' + (property.banos || 0) + ' ba | ' + (property.area_construida || 0) + ' m²';
            contentBox.appendChild(specsDiv);

            const addressDiv = document.createElement('div');
            addressDiv.className = document.getElementById('contenedor-tarjetas') ? 'direccion-texto' : 'prop-address';
            addressDiv.textContent = safeAddress;
            contentBox.appendChild(addressDiv);

            card.appendChild(contentBox);
            documentFragment.appendChild(card);

            if (state.map && property.latitud && property.longitud) {
                const propEstado = String(property.estado || '').toLowerCase();
                const isNew = propEstado === 'nuevo';
                const isVendido = propEstado === 'vendido' || String(property.estado_publicacion) === 'vendida';

                let bubbleClass = 'map-price-pill marker-bubble';
                if (isNew) bubbleClass += ' nuevo marker-bubble--new';
                if (isVendido) bubbleClass += ' vendido';

                const bubbleMarkerIcon = L.divIcon({
                    className: bubbleClass,
                    html: '<span>' + compactPriceLabel + '</span>',

                    // Configuración recomendada para centrado perfecto de píldoras horizontales
                    iconSize: [null, 30], 
                    iconAnchor: [40, 15] // 40px a la izquierda (mitad de un ancho estimado de 80px) y 15px hacia arriba (mitad exacta de 30px de alto)

                });

                const popupRoot = document.createElement('div');
                popupRoot.className = 'popup-custom-container';
                popupRoot.appendChild(buildSecureCarouselComponent(property));

                const popupContent = document.createElement('div');
                popupContent.className = 'card-content';
                
                const pPrice = document.createElement('div');
                pPrice.className = 'prop-price';
                pPrice.style.fontSize = '16px';
                pPrice.style.fontWeight = '800';
                pPrice.style.marginTop = '6px';
                pPrice.textContent = 'S/. ' + safePrice;
                popupContent.appendChild(pPrice);

                const pAddress = document.createElement('div');
                pAddress.className = 'direccion-texto prop-address';
                pAddress.style.fontSize = '11px';
                pAddress.style.color = '#555';
                pAddress.textContent = safeAddress;
                popupContent.appendChild(pAddress);

                popupRoot.appendChild(popupContent);

                const marker = L.marker([property.latitud, property.longitud], { icon: bubbleMarkerIcon })
                    .addTo(state.map)
                    .bindPopup(popupRoot, { maxWidth: 250, minWidth: 250 });

                state.markersGroup.push(marker);
            }
        });

        if (gridTarget) gridTarget.appendChild(documentFragment);
    }
    
/**
 * ==========================================================================
 * PARTE: 5-5 (PIPELINE DE FILTRADO CONTROLADO LIBRE DE BUCLES INFINITOS)
 * ==========================================================================
 */
    // Pipeline Analítico que procesa el cruce de tablas relacionales (Matrix Cross-Sheet)
    function executeFilterEnginePipeline() {
        const inputBuscador = document.getElementById('buscador-direccion') || document.getElementById('search-address');
        const querySearch = inputBuscador ? inputBuscador.value.toLowerCase().trim() : "";

        state.filteredData = state.propertiesData.filter(function(prop) {
            // A) Filtro Reactivo de Texto (Santiago de Surco, El Derby, etc.)
            const direccionPropiedad = String(prop.direccion || '').toLowerCase();
            if (querySearch && !direccionPropiedad.includes(querySearch)) return false;

            // B) Cruce relacional Estado Publicación y Anuncio (Inmune a mayúsculas)
            const stPub = String(prop.estado_publicacion || '');
            const tpAnuncio = String(prop.tipo_anuncio || '');

            if (state.activeFilters.transaccion === "venta") {
                if (stPub !== "disponible" || (tpAnuncio !== "venta" && tpAnuncio !== "en venta")) return false;
            } else if (state.activeFilters.transaccion === "alquiler") {
                if (stPub !== "disponible" || (tpAnuncio !== "alquiler" && tpAnuncio !== "para el alquiler")) return false;
            } else if (state.activeFilters.transaccion === "vendida") {
                if (stPub !== "vendida" && stPub !== "vendido") return false;
            }

            // C) Rangos de Precios Básicos
            const price = prop.precio_base;
            if (state.activeFilters.priceMin !== null && price < state.activeFilters.priceMin) return false;
            if (state.activeFilters.priceMax !== null && price > state.activeFilters.priceMax) return false;

            // D) Reglas de Dormitorios
            const beds = prop.habitaciones;
            if (state.activeFilters.beds > 0) {
                if (state.activeFilters.bedsExact && beds !== state.activeFilters.beds) return false;
                if (!state.activeFilters.bedsExact && beds < state.activeFilters.beds) return false;
            }

            // E) Reglas de Baños
            if (state.activeFilters.baths > 0 && prop.banos < state.activeFilters.baths) return false;

            return true;
        });

        // Ejecuta el renderizado de alto rendimiento en una sola pasada limpia
        renderAppContent();

        // Auto-reubicación inteligente al primer resultado de forma pasiva sin disparar eventos
        if (state.filteredData.length > 0) {
            const firstCoord = state.filteredData[0];
            if (firstCoord && firstCoord.latitud && firstCoord.longitud && state.map) {
                state.map.setView([firstCoord.latitud, firstCoord.longitud], 14);
            }
        }
    }

    function attachInterfaceEventHandlers() {
        const inputBuscador = document.getElementById('buscador-direccion') || document.getElementById('search-address');
        if (inputBuscador) {
            // Eliminamos cualquier listener previo duplicado para evitar ejecuciones en cascada
            inputBuscador.removeEventListener('input', executeFilterEnginePipeline);
            inputBuscador.addEventListener('input', executeFilterEnginePipeline);
        }

        const radios = document.querySelectorAll('input[name="filtro-estado-publicacion"], input[name="transaccion"]');
        radios.forEach(radio => {
            radio.addEventListener('change', function() {
                const val = this.value.toLowerCase();
                if (val === 'venta') state.activeFilters.transaccion = 'venta';
                else if (val === 'alquiler') state.activeFilters.transaccion = 'alquiler';
                else if (val === 'vendido' || val === 'vendida') state.activeFilters.transaccion = 'vendida';
                
                const textoBtn = document.getElementById('texto-filtro-estado-publicacion') || document.getElementById('btn-filter-status');
                if (textoBtn) textoBtn.textContent = this.parentElement.textContent.trim();
                executeFilterEnginePipeline();
            });
        });
    }

    function clearActiveListeners() {
        state.activeListeners.forEach(l => l.element.removeEventListener(l.type, l.handler));
        state.activeListeners = [];
    }

    function clearActiveMarkers() {
        state.markersGroup.forEach(m => {
            if (state.map) state.map.removeLayer(m);
        });
        state.markersGroup = [];
    }

    window.renderizarMapaZillow = function() {
        executeFilterEnginePipeline();
    };

    // API Pública de Inicialización Profesional
    return {
        initialize: function() {
            const mapSuccess = initMap();
            if (mapSuccess) {
                attachInterfaceEventHandlers();
                fetchSpreadsheetData(); // Llama a los datos asíncronos una única vez al arrancar
            }
        }
    };
})();

// PUNTO DE ENTRADA DETERMINISTA DIRECTO LIBRE DE BUCLES
document.addEventListener("DOMContentLoaded", function() {
    AppInmobiliaria.initialize();
});
