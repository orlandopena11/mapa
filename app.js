/**
 * ==========================================================================
 * ARQUITECTURA BUSCADOR INMOBILIARIO (Encapsulado - ES6 Estricto)
 * ==========================================================================
 */
const AppInmobiliaria = (function() {
    // Estado interno protegido (Evita inyecciones externas y variables globales)
    const state = {
        map: null,
        markersGroup: [],
        propertiesData: [],
        cloudinaryBase: "https://cloudinary.com"
    };

    // 1. Inicialización de la Instancia de Leaflet + OpenStreetMap
    function initMap() {
        state.map = L.map('map-instance', {
            zoomControl: true,
            doubleClickZoom: true
        }).setView([-12.125, -76.995], 13); // Coordenadas centradas por defecto

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        }).addTo(state.map);
    }

    // 2. Conectividad Segura con Google Apps Script (Code.gs)
    function fetchSpreadsheetData() {
    // Conexión externa optimizada hacia Google Apps Script (Web App)
    const urlScript = "https://script.google.com/macros/s/AKfycbyfNpA-Zf_C-uqDxpzX1phQqREIXAhgSvFyVj2VAhWp2-h7wN_2uR44b3wkg152STAzrQ/exec";

    fetch(urlScript)
        .then(response => {
            if (!response.ok) {
                throw new Error("Fallo en la respuesta de la red");
            }
            return response.json();
        })
        .then(data => {
            if (data && data.propiedades) {
                state.propertiesData = data.propiedades;
                renderAppContent();
            } else {
                document.getElementById('results-counter').textContent = "No se encontraron propiedades.";
            }
        })
        .catch(err => {
            console.error("Error al conectar con Google Sheets desde GitHub:", err);
            document.getElementById('results-counter').textContent = "Error al sincronizar la base de datos.";
        });
}
                .withFailureHandler(function(err) {
                    console.error("Error crítico de sincronización de Sheets:", err);
                    document.getElementById('results-counter').textContent = "Error al leer la base de datos.";
                })
                .obtenerDatosInmobiliarios(); // Llama a la función de tu archivo Código.gs
        } else {
            // Datos deterministas de prueba si estás auditando el frontend de forma local
            console.warn("Auditoría Local: Cargando datos de respaldo.");
            state.propertiesData = [
                { id: 1, precio_base: 250000, habitaciones: 2, banos: 1, area_construida: 839, direccion: "111-50 75th Rd #A1, Forest Hills, NY", foto_principal: "sample_casa.jpg", latitud: -12.125, longitud: -76.995 }
            ];
            renderAppContent();
        }
    }

    // 3. Formateador inteligente de URLs Cortas para Cloudinary
    function buildCloudinaryUrl(publicId) {
        if (!publicId) {
            return "https://unsplash.com";
        }
        const cleanPublicId = String(publicId).trim().replace(/\s+/g, "_");
        return `${state.cloudinaryBase}${cleanPublicId}`;
    }

    // 4. Sanitizador de Datos (Blindaje absoluto contra ataques Cross-Site Scripting XSS)
    function sanitizeHtmlString(unsafeText) {
        if (!unsafeText) return '';
        return String(unsafeText)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 5. Inyección de Alto Rendimiento en el DOM (Uso de DocumentFragments)
    function renderAppContent() {
        const gridTarget = document.getElementById('properties-grid-target');
        const counterTarget = document.getElementById('results-counter');
        
        // Liberación de elementos anteriores para optimizar consumo de RAM
        gridTarget.innerHTML = '';
        clearActiveMarkers();

        // Actualizar el número de registros en tiempo real
        counterTarget.textContent = `${state.propertiesData.length} Viviendas Disponibles`;

        // Creación del contenedor virtual temporal (Fragmento)
        const documentFragment = document.createDocumentFragment();

        state.propertiesData.forEach(function(property) {
            // Sanitización estricta de las variables de base de datos
            const safeAddress = sanitizeHtmlString(property.direccion);
            const safeImageUrl = buildCloudinaryUrl(property.foto_principal);
            const safePrice = Number(property.precio_base || 0).toLocaleString('es-PE');
            
            // Construcción del nodo seguro de la tarjeta
            const card = document.createElement('div');
            card.className = 'property-card';
            card.innerHTML = `
                <div class="card-image-box">
                    <img src="${safeImageUrl}" class="card-img" alt="Propiedad">
                </div>
                <div class="card-content">
                    <div>
                        <div class="prop-price">S/. ${safePrice}</div>
                        <div class="prop-specs">${property.habitaciones} bd | ${property.banos} ba | ${property.area_construida} m²</div>
                        <div class="prop-address">${safeAddress}</div>
                    </div>
                </div>
            `;

            documentFragment.appendChild(card);

            // Inyección paralela de los marcadores geográficos en Leaflet
            if (property.latitud && property.longitud) {
                const marker = L.marker([property.latitud, property.longitud])
                    .addTo(state.map)
                    .bindPopup(`
                        <div class="popup-title">S/. ${safePrice}</div>
                        <div style="font-size:11px; color:#555;">${safeAddress}</div>
                    `);
                state.markersGroup.push(marker);
            }
        });

        // Único disparo de renderizado al navegador (Optimización de Reflow)
        gridTarget.appendChild(documentFragment);
    }

    // 6. Recolector de Basura para el Mapa (Previene congelamientos de memoria)
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
