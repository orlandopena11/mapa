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
        favoritosUsuario: [], // Almacén inmutable de identificadores únicos
        activeListeners: [],  // Registro activo para recolección de basura
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
    // 2. Conectividad Segura con Google Apps Script (Code.gs)
    function fetchSpreadsheetData() {
        window.procesarDatosDelMotor = function(response) {
            if (response && response.propiedades) {
                state.propertiesData = response.propiedades;
                renderAppContent();
            } else {
                document.getElementById('results-counter').textContent = "No se encontraron propiedades.";
            }
            document.getElementById('jsonp-script-bridge')?.remove();
        };

        const urlScript = "https://script.google.com/macros/s/AKfycbyfNpA-Zf_C-uqDxpzX1phQqREIXAhgSvFyVj2VAhWp2-h7wN_2uR44b3wkg152STAzrQ/exec";

        const scriptBridge = document.createElement('script');
        scriptBridge.id = 'jsonp-script-bridge';
        scriptBridge.src = urlScript;
        scriptBridge.onerror = function() {
            document.getElementById('results-counter').textContent = "Error al sincronizar la base de datos.";
        };

        document.body.appendChild(scriptBridge);
    }

    // 3. Formateador inteligente de URLs Cortas para Cloudinary
    function buildCloudinaryUrl(publicId) {
        if (!publicId) {
            return "https://unsplash.com";
        }
        const cleanPublicId = String(publicId).trim().replace(/\s+/g, "_");
        return `${state.cloudinaryBase}${cleanPublicId}`;
    }

    // 4. Formateador compacto para Burbujas de Precio (Ej: 250K o 1.13M)
    function formatCompactPrice(priceValue) {
        const num = Number(priceValue || 0);
        if (num >= 1000000) {
            return `S/. ${(num / 1000000).toFixed(2)}M`;
        } else if (num >= 1000) {
            return `S/. ${(num / 1000).toFixed(0)}K`;
        }
        return `S/. ${num}`;
    }

    // 5. Sanitizador de Datos (Blindaje absoluto contra ataques XSS)
    function sanitizeHtmlString(unsafeText) {
        if (!unsafeText) return '';
        return String(unsafeText)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
    // 6. Generador Dinámico de Micro-Carrusel Seguro e Infinito
    function buildSecureCarouselComponent(property) {
        const imageBox = document.createElement('div');
        imageBox.className = 'card-image-box';

        const imagesCollection = [];
        if (property.foto_principal) {
            imagesCollection.push(property.foto_principal);
        }
        if (property.imagenes_secundarias) {
            const secondaryList = String(property.imagenes_secundarias).split(',');
            secondaryList.forEach(img => {
                if (img.trim()) imagesCollection.push(img.trim());
            });
        }
        if (imagesCollection.length === 0) imagesCollection.push("");

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
            if (idx === 0) {
                imgElement.classList.add('carousel-img--active');
            }
            trackContainer.appendChild(imgElement);
            imageNodes.push(imgElement);
        });
        imageBox.appendChild(trackContainer);
        // Inyección de Capas Flotantes de Estado (Badge)
        if (property.estado) {
            const badge = document.createElement('div');
            badge.className = 'card-badge';
            badge.textContent = sanitizeHtmlString(property.estado);
            if (String(property.estado).toLowerCase() === 'nuevo') {
                badge.classList.add('card-badge--new');
            }
            imageBox.appendChild(badge);
        }

        // Inyección de Frases Descriptivas del Inmueble
        if (property.frase_descriptiva) {
            const infoBanner = document.createElement('div');
            infoBanner.className = 'card-info-banner';
            infoBanner.textContent = sanitizeHtmlString(property.frase_descriptiva);
            imageBox.appendChild(infoBanner);
        }

        // Botón de Favoritos Reactivo con mutación encapsulada
        const favButton = document.createElement('button');
        favButton.className = 'card-fav-btn';
        const propertyKey = property.direccion; 
        const isCurrentlyFav = state.favoritosUsuario.includes(propertyKey);
        
        favButton.textContent = isCurrentlyFav ? '♥' : '♡';
        if (isCurrentlyFav) favButton.classList.add('card-fav-btn--active');

        const favClickHandler = function(event) {
            event.stopPropagation();
            event.preventDefault();
            const isFav = state.favoritosUsuario.includes(propertyKey);
            if (isFav) {
                state.favoritosUsuario = state.favoritosUsuario.filter(key => key !== propertyKey);
            } else {
                state.favoritosUsuario = [...state.favoritosUsuario, propertyKey];
            }
            synchronizeFavoriteInterfaceNodes(propertyKey);
        };

        favButton.addEventListener('click', favClickHandler);
        state.activeListeners.push({ element: favButton, type: 'click', handler: favClickHandler });
        imageBox.appendChild(favButton);

        // Flechas de Navegación Interactiva (Aritmética Modular Cíclica)
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

            const prevHandler = function(e) { e.stopPropagation(); e.preventDefault(); shiftCarouselIndex(-1); };
            const nextHandler = function(e) { e.stopPropagation(); e.preventDefault(); shiftCarouselIndex(1); };

            prevBtn.addEventListener('click', prevHandler);
            nextBtn.addEventListener('click', nextHandler);

            state.activeListeners.push({ element: prevBtn, type: 'click', handler: prevHandler });
            state.activeListeners.push({ element: nextBtn, type: 'click', handler: nextHandler });

            imageBox.appendChild(prevBtn);
            imageBox.appendChild(nextBtn);
        }

        return imageBox;
    }
    // Sincronizador de Interfaz Localizado para Favoritos
    function synchronizeFavoriteInterfaceNodes(targetKey) {
        const isFav = state.favoritosUsuario.includes(targetKey);
        const activeButtons = document.querySelectorAll('.card-fav-btn');
        
        activeButtons.forEach(btn => {
            const parentCard = btn.closest('.property-card') || btn.closest('.popup-custom-container');
            if (parentCard) {
                const addressNode = parentCard.querySelector('.prop-address');
                if (addressNode && addressNode.textContent === targetKey) {
                    btn.textContent = isFav ? '♥' : '♡';
                    if (isFav) {
                        btn.classList.add('card-fav-btn--active');
                    } else {
                        btn.classList.remove('card-fav-btn--active');
                    }
                }
            }
        });
    }
    // 7. Inyección de Alto Rendimiento en el DOM (Uso de DocumentFragments)
    function renderAppContent() {
        const gridTarget = document.getElementById('properties-grid-target');
        const counterTarget = document.getElementById('results-counter');
        
        clearActiveListeners();
        gridTarget.innerHTML = '';
        clearActiveMarkers();

        counterTarget.textContent = `${state.propertiesData.length} Viviendas Disponibles`;
        const documentFragment = document.createDocumentFragment();

        state.propertiesData.forEach(function(property) {
            const safeAddress = sanitizeHtmlString(property.direccion);
            const safePrice = Number(property.precio_base || 0).toLocaleString('es-PE');
            const compactPriceLabel = formatCompactPrice(property.precio_base);
            
            const card = document.createElement('div');
            card.className = 'property-card';

            const carouselModule = buildSecureCarouselComponent(property);
            card.appendChild(carouselModule);

            const contentBox = document.createElement('div');
            contentBox.className = 'card-content';

            const priceDiv = document.createElement('div');
            priceDiv.className = 'prop-price';
            priceDiv.textContent = `S/. ${safePrice}`;
            contentBox.appendChild(priceDiv);

            const specsDiv = document.createElement('div');
            specsDiv.className = 'prop-specs';
            specsDiv.textContent = `${property.habitaciones || 0} bd | ${property.banos || 0} ba | ${property.area_construida || 0} m²`;
            contentBox.appendChild(specsDiv);

            const addressDiv = document.createElement('div');
            addressDiv.className = 'prop-address';
            addressDiv.textContent = safeAddress;
            contentBox.appendChild(addressDiv);

            card.appendChild(contentBox);
            documentFragment.appendChild(card);

            // Inyección de Burbujas Dinámicas en el Mapa
            if (property.latitud && property.longitud) {
                const isNewProperty = String(property.estado).toLowerCase() === 'nuevo';

                //  CÓDIGO CORREGIDO (Centrado perfecto de la píldora)
                const bubbleMarkerIcon = L.divIcon({
                className: isNewProperty ? 'marker-bubble marker-bubble--new' : 'marker-bubble',
                html: `<span>${compactPriceLabel}</span>`,
                iconSize: null, // CSS autogestiona el tamaño dinámico
                iconAnchor: [35, 12] // Desplazamiento simétrico para centrar la píldora
            });

                const popupRootContainer = document.createElement('div');
                popupRootContainer.className = 'popup-custom-container';

                const popupCarouselModule = buildSecureCarouselComponent(property);
                const popupContentBox = document.createElement('div');
                popupContentBox.className = 'card-content';

                const pPrice = document.createElement('div');
                pPrice.className = 'prop-price';
                pPrice.textContent = `S/. ${safePrice}`;

                const pSpecs = document.createElement('div');
                pSpecs.className = 'prop-specs';
                pSpecs.textContent = `${property.habitaciones || 0} bd | ${property.banos || 0} ba`;

                const pAddress = document.createElement('div');
                pAddress.className = 'prop-address';
                pAddress.style.fontSize = '11px';
                pAddress.textContent = safeAddress;

                popupContentBox.appendChild(pPrice);
                popupContentBox.appendChild(pSpecs);
                popupContentBox.appendChild(pAddress);
                
                popupRootContainer.appendChild(popupCarouselModule);
                popupRootContainer.appendChild(popupContentBox);

                const marker = L.marker([property.latitud, property.longitud], { icon: bubbleMarkerIcon })
                    .addTo(state.map)
                    .bindPopup(popupRootContainer, {
                        maxWidth: 250,
                        minWidth: 250
                    });

                state.markersGroup.push(marker);
            }
        });

        gridTarget.appendChild(documentFragment);
    }
    // 9. Recolector de Basura Activo (Previene fugas de memoria RAM)
    function clearActiveListeners() {
        state.activeListeners.forEach(listener => {
            listener.element.removeEventListener(listener.type, listener.handler);
        });
        state.activeListeners = [];
    }

    function clearActiveMarkers() {
        state.markersGroup.forEach(function(marker) {
            state.map.removeLayer(marker);
        });
        state.markersGroup = [];
    }

    // API Pública de inicialización
    return {
        initialize: function() {
            initMap();
            fetchSpreadsheetData();
        }
    };
})();

// Disparo seguro al cargar por completo la ventana
document.addEventListener("DOMContentLoaded", function() {
    AppInmobiliaria.initialize();
});
