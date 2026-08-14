/**
 * ==========================================================================
 * ARQUITECTURA BUSCADOR INMOBILIARIO (Encapsulado - ES6 Estricto V2)
 * ==========================================================================
 */
const AppInmobiliaria = (function() {
    // Estado interno protegido (Evita inyecciones externas y variables globales)
    const state = {
        map: null,
        markersGroup: [],
        propertiesData: [],
        filteredData: [],
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
            builtMin: null,
            builtMax: null,
            lotMin: null,
            lotMax: null,
            yearMin: null,
            yearMax: null,
            basement: false,
            storage: false,
            view: false,
            days: "any"
        },
        cloudinaryBase: "https://res.cloudinary.com/obw6ciov/image/upload/v1785207128/"
    };

    // 1. Inicialización de la Instancia de Leaflet + OpenStreetMap
    function initMap() {
        state.map = L.map('map-instance', {
            zoomControl: true,
            doubleClickZoom: true
        }).setView([-12.125, -76.995], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        }).addTo(state.map);
    }

    // 2. Conectividad Segura con Google Apps Script (JSONP)
    function fetchSpreadsheetData() {
        window.procesarDatosDelMotor = function(response) {
            if (response && response.propiedades) {
                state.propertiesData = response.propiedades;
                state.filteredData = [...response.propiedades];
                buildPriceHistogram();
                renderAppContent();
                attachInterfaceEventHandlers();
            } else {
                document.getElementById('results-counter').textContent = "No se encontraron propiedades.";
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
        if (!publicId) {
            return "https://unsplash.com";
        }
        return `${state.cloudinaryBase}${String(publicId).trim().replace(/\s+/g, "_")}`;
    }

    function formatCompactPrice(priceValue) {
        const num = Number(priceValue || 0);
        if (num >= 1000000) return `S/. ${(num / 1000000).toFixed(2)}M`;
        if (num >= 1000) return `S/. ${(num / 1000).toFixed(0)}K`;
        return `S/. ${num}`;
    }

    function sanitizeHtmlString(unsafeText) {
        if (!unsafeText) return '';
        return String(unsafeText)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function buildPriceHistogram() {
        const histogramBox = document.getElementById('price-histogram-box');
        if (!histogramBox) return;
        histogramBox.innerHTML = '';
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 24; i++) {
            const bar = document.createElement('div');
            bar.className = 'histogram-bar-node in-range';
            bar.style.height = `${Math.floor(Math.random() * 45) + 15}px`;
            fragment.appendChild(bar);
        }
        histogramBox.appendChild(fragment);
    }
    // 6. Generador Dinámico de Micro-Carrusel Seguro (Doble Instancia: Rejilla y Popups)
    function buildSecureCarouselComponent(property) {
        const imageBox = document.createElement('div');
        imageBox.className = 'card-image-box';

        // Estructuración del pool de 5 fotos del registro
        const imagesCollection = [];
        if (property.foto_principal) imagesCollection.push(property.foto_principal);
        
        if (property.imagenes_secundarias) {
            String(property.imagenes_secundarias).split(',').forEach(img => {
                if (img.trim() && imagesCollection.length < 5) imagesCollection.push(img.trim());
            });
        }
        while (imagesCollection.length < 1) imagesCollection.push("");

        let activeIndex = 0;
        const totalImages = imagesCollection.length;

        const trackContainer = document.createElement('div');
        trackContainer.className = 'carousel-track-container';
        
        const imageNodes = [];
        imagesCollection.forEach((imgId, idx) => {
            const imgElement = document.createElement('img');
            imgElement.src = buildCloudinaryUrl(imgId);
            imgElement.className = 'carousel-img';
            imgElement.alt = 'Vivienda';
            if (idx === 0) imgElement.classList.add('carousel-img--active');
            trackContainer.appendChild(imgElement);
            imageNodes.push(imgElement);
        });
        imageBox.appendChild(trackContainer);

        // Capas flotantes Zillow
        if (property.estado) {
            const badge = document.createElement('div');
            badge.className = String(property.estado).toLowerCase() === 'nuevo' ? 'card-badge card-badge--new' : 'card-badge';
            badge.textContent = sanitizeHtmlString(property.estado);
            imageBox.appendChild(badge);
        }

        if (property.frase_descriptiva) {
            const infoBanner = document.createElement('div');
            infoBanner.className = 'card-info-banner';
            infoBanner.textContent = sanitizeHtmlString(property.frase_descriptiva);
            imageBox.appendChild(infoBanner);
        }

        // Corazón reactivo inmutable
        const favButton = document.createElement('button');
        favButton.className = 'card-fav-btn';
        const propertyKey = property.direccion;
        const isFav = state.favoritosUsuario.includes(propertyKey);
        favButton.textContent = isFav ? '♥' : '♡';
        if (isFav) favButton.classList.add('card-fav-btn--active');

        const favClickHandler = function(e) {
            e.stopPropagation(); e.preventDefault();
            const index = state.favoritosUsuario.indexOf(propertyKey);
            if (index > -1) {
                state.favoritosUsuario = state.favoritosUsuario.filter(k => k !== propertyKey);
            } else {
                state.favoritosUsuario = [...state.favoritosUsuario, propertyKey];
            }
            synchronizeFavoriteInterfaceNodes(propertyKey);
        };
        favButton.addEventListener('click', favClickHandler);
        state.activeListeners.push({ element: favButton, type: 'click', handler: favClickHandler });
        imageBox.appendChild(favButton);

        // Flechas con lógica aritmética modular
        if (totalImages > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'carousel-nav-btn carousel-nav-btn--prev';
            prevBtn.textContent = '‹';
            const nextBtn = document.createElement('button');
            nextBtn.className = 'carousel-nav-btn carousel-nav-btn--next';
            nextBtn.textContent = '›';

            const shiftCarouselIndex = function(offset) {
                imageNodes[activeIndex].classList.remove('carousel-img--active');
                activeIndex = (activeIndex + offset + totalImages) % totalImages;
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
    function synchronizeFavoriteInterfaceNodes(targetKey) {
        const isFav = state.favoritosUsuario.includes(targetKey);
        document.querySelectorAll('.card-fav-btn').forEach(btn => {
            const parent = btn.closest('.property-card') || btn.closest('.popup-custom-container');
            if (parent) {
                const addressNode = parent.querySelector('.prop-address');
                if (addressNode && addressNode.textContent === targetKey) {
                    btn.textContent = isFav ? '♥' : '♡';
                    if (isFav) btn.classList.add('card-fav-btn--active');
                    else btn.classList.remove('card-fav-btn--active');
                }
            }
        });
    }

    // 7. Renderizador de Rejilla y Burbujas DivIcon en el Mapa
    function renderAppContent() {
        const gridTarget = document.getElementById('properties-grid-target');
        const counterTarget = document.getElementById('results-counter');
        
        clearActiveListeners();
        gridTarget.innerHTML = '';
        clearActiveMarkers();

        counterTarget.textContent = `${state.filteredData.length} Viviendas Disponibles`;
        const documentFragment = document.createDocumentFragment();

        state.filteredData.forEach(function(property) {
            const safeAddress = sanitizeHtmlString(property.direccion);
            const safePrice = Number(property.precio_base || 0).toLocaleString('es-PE');
            const compactPriceLabel = formatCompactPrice(property.precio_base);
            
            // Creación de Tarjeta Derecha
            const card = document.createElement('div');
            card.className = 'property-card';
            card.appendChild(buildSecureCarouselComponent(property));

            const contentBox = document.createElement('div');
            contentBox.className = 'card-content';
            contentBox.innerHTML = `
                <div>
                    <div class="prop-price">S/. ${safePrice}</div>
                    <div class="prop-specs">${property.habitaciones || 0} bd | ${property.banos || 0} ba | ${property.area_construida || 0} m²</div>
                    <div class="prop-address">${safeAddress}</div>
                </div>
            `;
            card.appendChild(contentBox);
            documentFragment.appendChild(card);

            // Marcadores e Inyección de Popups Interactivos a la Izquierda
            if (property.latitud && property.longitud) {
                const isNew = String(property.estado).toLowerCase() === 'nuevo';
                
                // Configuración de la burbuja con dimensiones de centrado fijas
                const bubbleMarkerIcon = L.divIcon({
                    className: isNew ? 'marker-bubble marker-bubble--new' : 'marker-bubble',
                    html: `<span>${compactPriceLabel}</span>`,
                    iconSize:,
                    iconAnchor: [35, 12]
                });

                const popupRoot = document.createElement('div');
                popupRoot.className = 'popup-custom-container';
                popupRoot.appendChild(buildSecureCarouselComponent(property));

                const popupContent = document.createElement('div');
                popupContent.className = 'card-content';
                popupContent.innerHTML = `
                    <div class="prop-price" style="font-size:16px;">S/. ${safePrice}</div>
                    <div class="prop-address" style="font-size:11px;">${safeAddress}</div>
                `;
                popupRoot.appendChild(popupContent);

                const marker = L.marker([property.latitud, property.longitud], { icon: bubbleMarkerIcon })
                    .addTo(state.map)
                    .bindPopup(popupRoot, { maxWidth: 250, minWidth: 250 });

                state.markersGroup.push(marker);
            }

        });

        gridTarget.appendChild(documentFragment);
    }
    // Pipeline Analítico que procesa el cruce relacional de datos de las Sheets
    function executeFilterEnginePipeline() {
        const querySearch = document.getElementById('search-address').value.toLowerCase().trim();

        state.filteredData = state.propertiesData.filter(function(prop) {
            // A) Filtro de Dirección Geográfica
            if (querySearch && !String(prop.direccion).toLowerCase().includes(querySearch)) return false;

            // B) Cruce relacional Estado Publicación y Anuncio (Zillow V2 Matrix)
            const stPub = String(prop.estado_publicacion).toLowerCase();
            const tpAnuncio = String(prop.tipo_anuncio).toLowerCase();

            if (state.activeFilters.transaccion === "venta") {
                if (stPub !== "disponible" || tpAnuncio !== "venta") return false;
            } else if (state.activeFilters.transaccion === "alquiler") {
                if (stPub !== "disponible" || tpAnuncio !== "alquiler") return false;
            } else if (state.activeFilters.transaccion === "vendida") {
                if (stPub !== "vendida") return false;
            }

            // C) Rangos de Precios Básicos
            const price = Number(prop.precio_base || 0);
            if (state.activeFilters.priceMin !== null && price < state.activeFilters.priceMin) return false;
            if (state.activeFilters.priceMax !== null && price > state.activeFilters.priceMax) return false;

            // D) Reglas de Dormitorios y Coincidencia Exacta
            const beds = Number(prop.habitaciones || 0);
            if (state.activeFilters.beds > 0) {
                if (state.activeFilters.bedsExact && beds !== state.activeFilters.beds) return false;
                if (!state.activeFilters.bedsExact && beds < state.activeFilters.beds) return false;
            }

            // E) Reglas de Baños
            const baths = Number(prop.banos || 0);
            if (state.activeFilters.baths > 0 && baths < state.activeFilters.baths) return false;

            // F) Categoría de Propiedad
            if (state.activeFilters.types.length > 0 && !state.activeFilters.types.includes(prop.tipo_propiedad)) return false;

            // G) Megapanel Extendida (Filtros Avanzados)
            if (state.activeFilters.hoa !== "any") {
                const hoaVal = Number(prop.cuota_mantenimiento || 0);
                if (state.activeFilters.hoa === "0" && hoaVal > 0) return false;
                if (state.activeFilters.hoa !== "0" && hoaVal > Number(state.activeFilters.hoa)) return false;
            }

            if (state.activeFilters.listTypes.length > 0 && !state.activeFilters.listTypes.includes(prop.situacion_propiedad)) return false;
            if (state.activeFilters.tour3d && !prop.tour_3d) return false;
            if (state.activeFilters.parking !== "any" && Number(prop.estacionamientos || 0) < Number(state.activeFilters.parking)) return false;

            // Rangos Estructurales m²
            const builtArea = Number(prop.area_construida || 0);
            if (state.activeFilters.builtMin !== null && builtArea < state.activeFilters.builtMin) return false;
            if (state.activeFilters.builtMax !== null && builtArea > state.activeFilters.builtMax) return false;

            const lotArea = Number(prop.area_terreno || 0);
            if (state.activeFilters.lotMin !== null && lotArea < state.activeFilters.lotMin) return false;
            if (state.activeFilters.lotMax !== null && lotArea > state.activeFilters.lotMax) return false;

            const yearConst = Number(prop.ano_construccion || 0);
            if (state.activeFilters.yearMin !== null && yearConst < state.activeFilters.yearMin) return false;
            if (state.activeFilters.yearMax !== null && yearConst > state.activeFilters.yearMax) return false;

            // Booleans
            if (state.activeFilters.basement && !prop.sotano) return false;
            if (state.activeFilters.storage && !prop.almacen) return false;
            if (state.activeFilters.view && !prop.vista) return false;

            // Operación de Días Publicados Calculados
            if (state.activeFilters.days !== "any" && prop.fecha_publicacion) {
                const diffTime = Math.abs(new Date() - new Date(prop.fecha_publicacion));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > Number(state.activeFilters.days)) return false;
            }

            return true;
        });

        renderAppContent();
        
        // Auto-reubicación del mapa si existen resultados en la muestra
        if (state.filteredData.length > 0 && state.filteredData[0].latitud) {
            state.map.panTo([state.filteredData[0].latitud, state.filteredData[0].longitud]);
        }

        // REINICIO AUTOMÁTICO DE LOS INPUTS VISUALES (Restablecimiento post-renderizado)
        autoResetInterfaceFormFields();
    }
    // Reinicia los campos visibles de la pantalla conservando las variables de estado en memoria
    function autoResetInterfaceFormFields() {
        document.getElementById('price-min').value = '';
        document.getElementById('price-max').value = '1300000';
        document.getElementById('beds-exact').checked = false;
        document.getElementById('built-min').value = '';
        document.getElementById('built-max').value = '';
        document.getElementById('lot-min').value = '';
        document.getElementById('lot-max').value = '';
        document.getElementById('year-min').value = '';
        document.getElementById('year-max').value = '';
        document.getElementById('filter-tour3d').checked = false;
        document.getElementById('feat-basement').checked = false;
        document.getElementById('feat-storage').checked = false;
        document.getElementById('feat-view').checked = false;
        document.getElementById('filter-hoa').value = 'any';
        document.getElementById('filter-parking').value = 'any';
        document.getElementById('filter-days').value = 'any';
    }

    function attachInterfaceEventHandlers() {
        // Gestión de apertura de menús desplegables
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const currentPanel = this.nextElementSibling;
                document.querySelectorAll('.dropdown-content-panel').forEach(p => {
                    if (p !== currentPanel) p.classList.remove('show');
                });
                if (currentPanel) currentPanel.classList.toggle('show');
            });
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-content-panel').forEach(p => p.classList.remove('show'));
        });

        document.querySelectorAll('.dropdown-content-panel').forEach(p => {
            p.addEventListener('click', (e) => e.stopPropagation());
        });

        // Buscador reactivo por dirección texto o distrito
        document.getElementById('search-address').addEventListener('input', executeFilterEnginePipeline);

        // Control de Transacción (Radio buttons)
        document.getElementsByName('transaccion').forEach(radio => {
            radio.addEventListener('change', function() {
                state.activeFilters.transaccion = this.value;
                document.getElementById('btn-filter-status').textContent = `${this.parentElement.textContent.trim()} ▾`;
                executeFilterEnginePipeline();
            });
        });

        // Botones segmentados de Camas y Baños
        const registerSegmentedClicks = function(containerId, filterKey) {
            document.querySelectorAll(`#${containerId} .segmented-btn`).forEach(btn => {
                btn.addEventListener('click', function() {
                    this.parentElement.querySelectorAll('.segmented-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    state.activeFilters[filterKey] = Number(this.dataset.val);
                    executeFilterEnginePipeline();
                });
            });
        };
        registerSegmentedClicks('row-beds', 'beds');
        registerSegmentedClicks('row-baths', 'baths');

        document.getElementById('beds-exact').addEventListener('change', function() {
            state.activeFilters.bedsExact = this.checked;
            executeFilterEnginePipeline();
        });

        // Eventos para el Megapanel de Control
        document.getElementById('master-apply-btn').addEventListener('click', function() {
            state.activeFilters.priceMin = document.getElementById('price-min').value ? Number(document.getElementById('price-min').value) : null;
            state.activeFilters.priceMax = document.getElementById('price-max').value ? Number(document.getElementById('price-max').value) : null;
            state.activeFilters.hoa = document.getElementById('filter-hoa').value;
            state.activeFilters.parking = document.getElementById('filter-parking').value;
            state.activeFilters.tour3d = document.getElementById('filter-tour3d').checked;
            state.activeFilters.builtMin = document.getElementById('built-min').value ? Number(document.getElementById('built-min').value) : null;
            state.activeFilters.builtMax = document.getElementById('built-max').value ? Number(document.getElementById('built-max').value) : null;
            state.activeFilters.lotMin = document.getElementById('lot-min').value ? Number(document.getElementById('lot-min').value) : null;
            state.activeFilters.lotMax = document.getElementById('lot-max').value ? Number(document.getElementById('lot-max').value) : null;
            state.activeFilters.yearMin = document.getElementById('year-min').value ? Number(document.getElementById('year-min').value) : null;
            state.activeFilters.yearMax = document.getElementById('year-max').value ? Number(document.getElementById('year-max').value) : null;
            state.activeFilters.basement = document.getElementById('feat-basement').checked;
            state.activeFilters.storage = document.getElementById('feat-storage').checked;
            state.activeFilters.view = document.getElementById('feat-view').checked;
            state.activeFilters.days = document.getElementById('filter-days').value;

            executeFilterEnginePipeline();
            document.querySelectorAll('.dropdown-content-panel').forEach(p => p.classList.remove('show'));
        });

        document.getElementById('master-reset-btn').addEventListener('click', function() {
            state.activeFilters.priceMin = null;
            state.activeFilters.priceMax = 1300000;
            state.activeFilters.beds = 0;
            state.activeFilters.baths = 0;
            state.activeFilters.hoa = "any";
            state.activeFilters.parking = "any";
            state.activeFilters.tour3d = false;
            state.activeFilters.builtMin = null; state.activeFilters.builtMax = null;
            state.activeFilters.lotMin = null; state.activeFilters.lotMax = null;
            state.activeFilters.yearMin = null; state.activeFilters.yearMax = null;
            state.activeFilters.basement = false; state.activeFilters.storage = false; state.activeFilters.view = false;
            state.activeFilters.days = "any";
            
            executeFilterEnginePipeline();
        });
    }

    function clearActiveListeners() {
        state.activeListeners.forEach(listener => {
            listener.element.removeEventListener(listener.type, listener.handler);
        });
        state.activeListeners = [];
    }

    function clearActiveMarkers() {
        state.markersGroup.forEach(marker => state.map.removeLayer(marker));
        state.markersGroup = [];
    }

    return {
        initialize: function() {
            initMap();
            fetchSpreadsheetData();
        }
    };
})();

document.addEventListener("DOMContentLoaded", () => AppInmobiliaria.initialize());
