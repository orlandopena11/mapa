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

    // 1. Inicialización Determinista de la Instancia de Leaflet + OpenStreetMap
    function initMap() {
        const mapContainer = document.getElementById('mapa');
        if (!mapContainer) return false;

        state.map = L.map('mapa', {
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
 * PARTE: 2-5 (CONECTIVIDAD ASÍNCRONA, NORMALIZADORES Y BLINDAJE ANTI-XSS)
 * ==========================================================================
 */
    // 2. Sincronización Segura con Google Apps Script (Code.gs)
    function fetchSpreadsheetData() {
        window.procesarDatosDelMotor = function(response) {
            if (response && response.propiedades) {
                const tablaImagenes = response.imagenes || [];

                state.propertiesData = response.propiedades.map(function(prop) {
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
            } else {
                const contador = document.getElementById('contador-propiedades');
                if (contador) contador.textContent = "No se encontraron propiedades.";
            }
            document.getElementById('jsonp-script-bridge')?.remove();
        };

        const urlScript = "https://script.google.com/macros/s/AKfycbyfNpA-Zf_C-uqDxpzX1phQqREIXAhgSvFyVj2VAhWp2-h7wN_2uR44b3wkg152STAzrQ/exec";
        const scriptBridge = document.createElement('script');
        scriptBridge.id = 'jsonp-script-bridge';
        scriptBridge.src = urlScript;
        document.body.appendChild(scriptBridge);
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
        imageBox.className = 'contenedor-foto';

        const imagesCollection = property.fotos_unicas.slice(0, 5);
        if (imagesCollection.length === 0) imagesCollection.push("");

        let activeIndex = 0;
        const totalImages = imagesCollection.length;

        const trackContainer = document.createElement('div');
        trackContainer.className = 'carrusel-imagenes';
        
        const imageNodes = [];
        imagesCollection.forEach((imgId, idx) => {
            const imgElement = document.createElement('img');
            imgElement.src = buildCloudinaryUrl(imgId);
            imgElement.alt = 'Vivienda';
            imgElement.style.width = "100%";
            imgElement.style.height = "100%";
            imgElement.style.objectFit = "cover";
            imgElement.style.display = idx === 0 ? 'block' : 'none';
            trackContainer.appendChild(imgElement);
            imageNodes.push(imgElement);
        });
        imageBox.appendChild(trackContainer);

        if (property.estado) {
            const badge = document.createElement('div');
            badge.className = 'badge';
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
        favButton.className = 'corazon-favorito';
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
            
            document.querySelectorAll('.corazon-favorito').forEach(btn => {
                const parent = btn.closest('.tarjeta-casa') || btn.closest('.popup-custom-container');
                if (parent) {
                    const addressNode = parent.querySelector('.direccion-texto');
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
            prevBtn.className = 'flecha-carrusel flecha-izq';
            prevBtn.textContent = '‹';
            const nextBtn = document.createElement('button');
            nextBtn.className = 'flecha-carrusel flecha-der';
            nextBtn.textContent = '›';

            const shiftCarouselIndex = function(offset) {
                imageNodes[activeIndex].style.display = 'none';
                activeIndex = (activeIndex + offset + totalImages) % totalImages;
                imageNodes[activeIndex].style.display = 'block';
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
        const gridTarget = document.getElementById('contenedor-tarjetas');
        const counterTarget = document.getElementById('contador-propiedades');
        
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
            card.className = 'tarjeta-casa';
            card.appendChild(buildSecureCarouselComponent(property));

            const contentBox = document.createElement('div');
            contentBox.className = 'datos-casa';
            
            const precioDiv = document.createElement('div');
            precioDiv.className = 'precio';
            precioDiv.textContent = 'S/. ' + safePrice;
            contentBox.appendChild(precioDiv);

            const specsDiv = document.createElement('div');
            specsDiv.className = 'caracteristicas';
            specsDiv.textContent = (property.habitaciones || 0) + ' bd | ' + (property.banos || 0) + ' ba | ' + (property.area_construida || 0) + ' m²';
            contentBox.appendChild(specsDiv);

            const addressDiv = document.createElement('div');
            addressDiv.className = 'direccion-texto';
            addressDiv.textContent = safeAddress;
            contentBox.appendChild(addressDiv);

            card.appendChild(contentBox);
            documentFragment.appendChild(card);

            if (state.map && property.latitud && property.longitud) {
                const propEstado = String(property.estado || '').toLowerCase();
                const isNew = propEstado === 'nuevo';
                const isVendido = propEstado === 'vendido' || String(property.estado_publicacion) === 'vendida';

                let bubbleClass = 'map-price-pill';
                if (isNew) bubbleClass += ' nuevo';
                if (isVendido) bubbleClass += ' vendido';

                const bubbleMarkerIcon = L.divIcon({
                    className: bubbleClass,
                    html: '<span>' + compactPriceLabel + '</span>',
                    iconSize: [null, 30],
                    iconAnchor: [35, 15]
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
                pAddress.className = 'direccion-texto';
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

       // ==========================================================================
    // PARTE: 5-5 (PIPELINE DE FILTRADO REACTIVO, LISTENERS Y ENTRADA AL DOM)
    // ==========================================================================
    function executeFilterEnginePipeline() {
        const querySearch = document.getElementById('buscador-direccion').value.toLowerCase().trim();

        state.filteredData = state.propertiesData.filter(function(prop) {
            const direccionPropiedad = String(prop.direccion || '').toLowerCase();
            if (querySearch && !direccionPropiedad.includes(querySearch)) return false;

            const stPub = prop.estado_publicacion;
            const tpAnuncio = prop.tipo_anuncio;

            if (state.activeFilters.transaccion === "venta") {
                if (stPub !== "disponible" || (tpAnuncio !== "venta" && tpAnuncio !== "en venta")) return false;
            } else if (state.activeFilters.transaccion === "alquiler") {
                if (stPub !== "disponible" || (tpAnuncio !== "alquiler" && tpAnuncio !== "para el alquiler")) return false;
            } else if (state.activeFilters.transaccion === "vendida") {
                if (stPub !== "vendida" && stPub !== "vendido") return false;
            }

            const price = prop.precio_base;
            if (state.activeFilters.priceMin !== null && price < state.activeFilters.priceMin) return false;
            if (state.activeFilters.priceMax !== null && price > state.activeFilters.priceMax) return false;

            const beds = prop.habitaciones;
            if (state.activeFilters.beds > 0) {
                if (state.activeFilters.bedsExact && beds !== state.activeFilters.beds) return false;
                if (!state.activeFilters.bedsExact && beds < state.activeFilters.beds) return false;
            }

            if (state.activeFilters.baths > 0 && prop.banos < state.activeFilters.baths) return false;
            if (state.activeFilters.types.length > 0 && !state.activeFilters.types.includes(prop.tipo_propiedad)) return false;
            if (state.activeFilters.tour3d && !prop.tour_3d) return false;

            return true;
        });

        renderAppContent();

        if (state.filteredData.length > 0) {
            const firstCoord = state.filteredData[0];
            if (firstCoord.latitud && firstCoord.longitud) {
                state.map.setView([firstCoord.latitud, firstCoord.longitud], 14);
            }
        }

        autoResetFlotantesFormFields();
    }

    function autoResetFlotantesFormFields() {
        const prMin = document.getElementById('price-min'); if (prMin) prMin.value = '';
    }

    function attachInterfaceEventHandlers() {
        const inputBuscador = document.getElementById('buscador-direccion');
        if (inputBuscador) {
            inputBuscador.addEventListener('input', executeFilterEnginePipeline);
        }

        document.getElementsByName('filtro-estado-publicacion').forEach(radio => {
            radio.addEventListener('change', function() {
                const val = this.value.toLowerCase();
                if (val === 'venta') state.activeFilters.transaccion = 'venta';
                else if (val === 'alquiler') state.activeFilters.transaccion = 'alquiler';
                else if (val === 'vendido') state.activeFilters.transaccion = 'vendida';
                
                const textoBtn = document.getElementById('texto-filtro-estado-publicacion');
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
        state.markersGroup.forEach(m => state.map.removeLayer(m));
        state.markersGroup = [];
    }

    return {
        initialize: function() {
            const mapSuccess = initMap();
            if (mapSuccess) {
                attachInterfaceEventHandlers();
                fetchSpreadsheetData();
            } else {
                console.error("Fallo estructural: El contenedor HTML #mapa no se encuentra listo.");
            }
        }
    };
})();

// PUNTO DE ENTRADA LÓGICO Y DETERMINISTA: Cero parches de tiempo, espera al DOM nativo
document.addEventListener("DOMContentLoaded", function() {
    AppInmobiliaria.initialize();
});
                      
