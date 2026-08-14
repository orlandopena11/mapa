/**
 * ==========================================================================
 * PARTE: 1-5 (ÁMBITO DE ESTADO, INICIALIZADORES MAPA Y CAPTURA JSONP)
 * ==========================================================================
 */
const AppInmobiliaria = (function() {
    // Estado interno protegido (Evita inyecciones externas y variables globales)
    const state = {
        map: null,
        markersGroup: [],
        propertiesData: [], // Base de datos maestra normalizada
        filteredData: [],   // Datos que cumplen los filtros activos
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
        cloudinaryBase: "https://cloudinary.com"
    };

    // 1. Inicialización de la Instancia de Leaflet + OpenStreetMap
    function initMap() {
        // Enlazamos al ID 'mapa' de tu index.html original para restaurar la vista
        state.map = L.map('mapa', {
            zoomControl: false,
            doubleClickZoom: true,
            tap: false
        }).setView([-12.125, -76.995], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(state.map);

        L.control.zoom({ position: 'topright' }).addTo(state.map);
    }

    // 2. Conectividad Secura con Google Apps Script (JSONP)
    function fetchSpreadsheetData() {
        window.procesarDatosDelMotor = function(response) {
            if (response && response.propiedades) {
                // Sincronización analítica cruzada con el esquema original de imágenes
                const tablaImagenes = response.imagenes || [];
                const listaUbicaciones = response.ubicacion || [];

                state.propertiesData = response.propiedades.map(function(prop) {
                    // Inyectamos la búsqueda relacional de imágenes secundarias original
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
                    // Retornamos el objeto normalizado para homogenizar el modelo
                    return normalizarEstructuraInmueble(prop);
                });

                state.filteredData = [...state.propertiesData];
                renderAppContent();
                attachInterfaceEventHandlers();
            } else {
                const contador = document.getElementById('contador-propiedades');
                if (contador) contador.textContent = "No se encontraron propiedades disponibles.";
            }
            document.getElementById('jsonp-script-bridge')?.remove();
        };

        const urlScript = "https://google.com";
        const scriptBridge = document.createElement('script');
        scriptBridge.id = 'jsonp-script-bridge';
        scriptBridge.src = urlScript;
        document.body.appendChild(scriptBridge);
    }

    function buildCloudinaryUrl(publicId) {
        if (!publicId) return "https://unsplash.com";
        if (String(publicId).startsWith("http")) return publicId;
        const cleanId = String(publicId).trim().replace(/\s+/g, "_").replace(/^\/+/, "");
        return `${state.cloudinaryBase}${cleanId}`;
    }
/**
 * ==========================================================================
 * PARTE: 2-5 (NORMALIZADORES DE OBJETO, PARSEADORES Y SANITIZACIÓN ANTI-XSS)
 * ==========================================================================
 */
    function normalizarEstructuraInmueble(prop) {
        // Asegura consistencia de tipos numéricos y de texto para las columnas relacionales
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
/**
 * ==========================================================================
 * PARTE: 3-5 (CONSTRUCTOR DE CARRUSEL DOBLE, BADGES VISUALES Y FAVORITOS)
 * ==========================================================================
 */
    // 6. Generador Dinámico de Micro-Carrusel Seguro (Doble Instancia: Rejilla y Popups)
    function buildSecureCarouselComponent(property) {
        const imageBox = document.createElement('div');
        imageBox.className = 'contenedor-foto'; // Clases originales de tu archivo styles.css

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
            // Manejo dinámico de visualización limpia libre de deformaciones
            imgElement.style.display = idx === 0 ? 'block' : 'none';
            trackContainer.appendChild(imgElement);
            imageNodes.push(imgElement);
        });
        imageBox.appendChild(trackContainer);

        // Inyección de Etiquetas Flotantes Zillow (Badges)
        if (property.estado) {
            const badge = document.createElement('div');
            badge.className = 'badge';
            badge.textContent = sanitizeHtmlString(property.estado);
            imageBox.appendChild(badge);
        }

        // Inyección de Letreros Descriptivos Inferiores de Foto
        if (property.frase_descriptiva) {
            const infoBanner = document.createElement('div');
            infoBanner.className = 'card-info-banner';
            infoBanner.textContent = sanitizeHtmlString(property.frase_descriptiva);
            imageBox.appendChild(infoBanner);
        }

        // Icono de Favoritos Reactivo con mutación encapsulada
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
            synchronizeFavoriteInterfaceNodes(propertyKey);
        };
        favButton.addEventListener('click', favClickHandler);
        state.activeListeners.push({ element: favButton, type: 'click', handler: favClickHandler });
        imageBox.appendChild(favButton);

        // Flechas Laterales de Navegación Infinita Circular
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

    function synchronizeFavoriteInterfaceNodes(targetKey) {
        const isFav = state.favoritosUsuario.includes(targetKey);
        document.querySelectorAll('.corazon-favorito').forEach(btn => {
            const parent = btn.closest('.tarjeta-casa') || btn.closest('.popup-custom-container');
            if (parent) {
                const addressNode = parent.querySelector('.direccion-texto');
                if (addressNode && addressNode.textContent === targetKey) {
                    btn.textContent = isFav ? '♥' : '♡';
                    btn.style.color = isFav ? '#d92323' : '#002650';
                }
            }
        });
    }
/**
 * ==========================================================================
 * PARTE: 4-5 (MOTOR DE RENDERIZADO PRINCIPAL Y PÍLDORAS DIVICON EN MAPA)
 * ==========================================================================
 */
    // 7. Renderizador de Rejilla y Marcadores en forma de Píldora
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
            
            // Construcción del Nodo de la Tarjeta Derecha original
            const card = document.createElement('div');
            card.className = 'tarjeta-casa';
            card.appendChild(buildSecureCarouselComponent(property));

            const contentBox = document.createElement('div');
            contentBox.className = 'datos-casa';
            
            const precioDiv = document.createElement('div');
            precioDiv.className = 'precio';
            precioDiv.textContent = `S/. ${safePrice}`;
            contentBox.appendChild(precioDiv);

            const specsDiv = document.createElement('div');
            specsDiv.className = 'caracteristicas';
            specsDiv.textContent = `${property.habitaciones || 0} bd | ${property.banos || 0} ba | ${property.area_construida || 0} m²`;
            contentBox.appendChild(specsDiv);

            const addressDiv = document.createElement('div');
            addressDiv.className = 'direccion-texto';
            addressDiv.textContent = safeAddress;
            contentBox.appendChild(addressDiv);

            card.appendChild(contentBox);
            documentFragment.appendChild(card);

            // Marcadores en forma de Burbuja de Precio sobre el Mapa de Leaflet
            if (property.latitud && property.longitud) {
                const propEstado = String(property.estado || '').toLowerCase();
                const isNew = propEstado === 'nuevo';
                const isVendido = propEstado === 'vendido' || String(property.estado_publicacion) === 'vendida';

                let bubbleClass = 'map-price-pill';
                if (isNew) bubbleClass += ' nuevo';
                if (isVendido) bubbleClass += ' vendido';

                const bubbleMarkerIcon = L.divIcon({
                    className: bubbleClass,
                    html: `<span>${compactPriceLabel}</span>`,
                    iconSize: [null, 30],
                    iconAnchor:
                });

                // Contenedor del Popup Clonado con Carrusel incluido dentro del Mapa
                const popupRoot = document.createElement('div');
                popupRoot.className = 'popup-custom-container';
                popupRoot.appendChild(buildSecureCarouselComponent(property));

                const popupContent = document.createElement('div');
                popupContent.className = 'card-content';
                popupContent.innerHTML = `
                    <div class="prop-price" style="font-size:16px; font-weight:800; margin-top:6px;">S/. ${safePrice}</div>
                    <div class="direccion-texto" style="font-size:11px; color:#555;">${safeAddress}</div>
                `;
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
 * PARTE: 5-5 (PIPELINE DE FILTRADO REACTIVO, LISTENERS Y RECOLECTOR RAM)
 * ==========================================================================
 */
    // Pipeline Analítico que procesa el cruce de tablas relacionales (Matrix Cross-Sheet)
    function executeFilterEnginePipeline() {
        const querySearch = document.getElementById('buscador-direccion').value.toLowerCase().trim();

        state.filteredData = state.propertiesData.filter(function(prop) {
            // A) Filtro Reactivo de Texto (Avenidas, Distritos, Barrios)
            const direccionPropiedad = String(prop.direccion || '').toLowerCase();
            if (querySearch && !direccionPropiedad.includes(querySearch)) return false;

            // B) Cruce relacional Estado Publicación y Anuncio (Inmune a mayúsculas)
            const stPub = prop.estado_publicacion;
            const tpAnuncio = prop.tipo_anuncio;

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

            // F) Categoría de Tipo de Propiedad
            if (state.activeFilters.types.length > 0 && !state.activeFilters.types.includes(prop.tipo_propiedad)) return false;

            // G) Características avanzadas booleanas del Megapanel
            if (state.activeFilters.tour3d && !prop.tour_3d) return false;

            return true;
        });

        renderAppContent();

        // Auto-reubicación inteligente del mapa al primer resultado encontrado
        if (state.filteredData.length > 0) {
            const firstCoord = state.filteredData;
            if (firstCoord.latitud && firstCoord.longitud) {
                state.map.setView([firstCoord.latitud, firstCoord.longitud], 14);
            }
        }

        // Auto-reinicio controlado únicamente de controles flotantes (Mantiene intacta la cajita)
        autoResetFlotantesFormFields();
    }

    function autoResetFlotantesFormFields() {
        // Restablece los inputs secundarios opcionales sin interferir con la caja de texto activa
        const prMin = document.getElementById('price-min'); if (prMin) prMin.value = '';
        const t3d = document.getElementById('filter-tour3d'); if (t3d) t3d.checked = false;
    }

    function attachInterfaceEventHandlers() {
        // Enlaza la cajita de búsqueda nativa por dirección al pipeline en tiempo real
        const inputBuscador = document.getElementById('buscador-direccion');
        if (inputBuscador) {
            inputBuscador.removeAttribute('oninput'); // Limpieza de código inline residual viejo
            inputBuscador.addEventListener('input', executeFilterEnginePipeline);
        }

        // Vinculación controlada para botones de tipo de anuncio de tu layout
        document.getElementsByName('filtro-estado-publicacion').forEach(radio => {
            radio.removeAttribute('onchange');
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

    // Exposición de puente global seguro para que el index original reciba la consulta JSONP externa
    window.renderizarMapaZillow = function() {
        executeFilterEnginePipeline();
    };

    return {
        initialize: function() {
            initMap();
            fetchSpreadsheetData();
        }
    };
})();

// Disparo seguro e inmune al ciclo de vida del DOM
document.addEventListener("DOMContentLoaded", () => AppInmobiliaria.initialize());
