/* ================================
   CONFIGURACIÓN DE ZOOM Y PAN
   ================================ */
let currentZoom = 1;
const minZoom = 1;
const maxZoom = 4;
const zoomStep = 0.5;

let panX = 0;
let panY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let startPanX = 0;
let startPanY = 0;
let initialPinchDistance = 0;
let isPinching = false;
let mapRotation = 0;
let rotationEnabled = true;

/* ================================
   LÍMITES DEL MAPA (YA FUNCIONARON ANTES)
   ================================ */
const mapBounds = {
    north: 6.3007,
    south: 6.2907,
    east: -75.5285,
    west: -75.5435
};

/* ================================
   PANEL DEBUG
   ================================ */
let debugPanel = null;
let debugMessageCount = 0;
const MAX_DEBUG_MESSAGES = 50;

function createDebugPanel() {
    const debugDiv = document.createElement('div');
    debugDiv.id = 'debug-panel';
    debugDiv.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.85);
        color: #0f0;
        padding: 10px;
        font-size: 11px;
        max-width: 320px;
        max-height: 300px;
        overflow-y: auto;
        z-index: 99999;
        font-family: monospace;
        border-radius: 8px;
        border: 1px solid #0f0;
    `;
    debugDiv.innerHTML = '<strong>🔍 DEBUG:</strong><br>';
    document.body.appendChild(debugDiv);
    return debugDiv;
}

function logDebug(message) {
    console.log(message);
    if (debugPanel && debugMessageCount < MAX_DEBUG_MESSAGES) {
        const time = new Date().toLocaleTimeString();
        debugPanel.innerHTML += `<div>[${time}] ${message}</div>`;
        debugPanel.scrollTop = debugPanel.scrollHeight;
        debugMessageCount++;
    }
}

/* ================================
   CONVERSIÓN GPS → PORCENTAJES
   ================================ */
function gpsToMapPercent(lat, lng) {
    let latPercent = ((lat - mapBounds.south) / (mapBounds.north - mapBounds.south)) * 100;
    let lngPercent = ((lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * 100;
    
    latPercent = Math.max(0, Math.min(100, latPercent));
    lngPercent = Math.max(0, Math.min(100, lngPercent));
    
    return {
        top: 100 - latPercent,
        left: lngPercent
    };
}

/* ================================
   PUNTOS DE INTERÉS
   ================================ */
const puntoInicio = {
    id: 1,
    tipo: 'inicio',
    nombre: 'Inicio del Recorrido',
    descripcion: 'Bienvenido al Museo Urbano de Memorias.',
    gps: { lat: 6.293042, lng: -75.541518 },
    top: 74.6,
    left: 13.5,
    imagen: 'assets/iconos-mapa/icono-inicio.png',
    activo: true
};

const murales = [
    { id: 2, tipo: 'mural', nombre: 'Antigua casa de las lolas', descripcion: 'Mural ubicado en la antigua casa de las Lolas.', artista: 'Por definir', gps: { lat: 6.293892, lng: -75.542473 }, top: 57.8, left: 37.9, imagen: 'assets/murales/mural-1.jpg', activo: true },
    { id: 3, tipo: 'mural', nombre: 'Antigua casa de Domitila', descripcion: 'Mural ubicado en la antigua casa de Domitila.', artista: 'Por definir', gps: { lat: 6.294827, lng: -75.543142 }, top: 43.5, left: 70.5, imagen: 'assets/murales/mural-2.jpg', activo: true },
    { id: 4, tipo: 'mural', nombre: 'Iván Moreno', descripcion: 'Mural dedicado a Iván Moreno.', artista: 'Por definir', gps: { lat: 6.295162, lng: -75.543475 }, top: 38.0, left: 81.7, imagen: 'assets/murales/mural-3.jpg', activo: true },
    { id: 5, tipo: 'mural', nombre: 'Mural 4', descripcion: 'Descripción del mural 4.', artista: 'Por definir', gps: { lat: 6.295253, lng: -75.5435 }, top: 37.8, left: 82.4, imagen: 'assets/murales/mural-4.jpg', activo: true },
    { id: 6, tipo: 'mural', nombre: 'Mural 5', descripcion: 'Descripción del mural 5.', artista: 'Por definir', gps: { lat: 6.295342, lng: -75.543502 }, top: 37.2, left: 84.5, imagen: 'assets/murales/mural-5.jpg', activo: true },
    { id: 7, tipo: 'mural', nombre: 'Mural 6', descripcion: 'Descripción del mural 6.', artista: 'Por definir', gps: { lat: 6.295342, lng: -75.543502 }, top: 37.0, left: 85.5, imagen: 'assets/murales/mural-6.jpg', activo: true },
    { id: 8, tipo: 'mural', nombre: 'Mural 7', descripcion: 'Descripción del mural 7.', artista: 'Por definir', gps: { lat: 6.295342, lng: -75.543502 }, top: 37.0, left: 87.5, imagen: 'assets/murales/mural-7.jpg', activo: true },
    { id: 9, tipo: 'mural', nombre: 'Mural 8', descripcion: 'Descripción del mural 8.', artista: 'Por definir', gps: { lat: 6.295418, lng: -75.543592 }, top: 36.7, left: 88.9, imagen: 'assets/murales/mural-8.jpg', activo: true },
    { id: 10, tipo: 'mural', nombre: 'Mural 9', descripcion: 'Descripción del mural 9.', artista: 'Por definir', gps: { lat: 6.294952, lng: -75.543772 }, top: 35.2, left: 91.6, imagen: 'assets/murales/mural-9.jpg', activo: true },
    { id: 11, tipo: 'mural', nombre: 'Mural 10', descripcion: 'Descripción del mural 10.', artista: 'Por definir', gps: { lat: 6.294385, lng: -75.543493 }, top: 31.2, left: 75.4, imagen: 'assets/murales/mural-10.jpg', activo: true },
    { id: 12, tipo: 'mural', nombre: 'Mural 11', descripcion: 'Descripción del mural 11.', artista: 'Por definir', gps: { lat: 6.294198, lng: -75.543365 }, top: 37.2, left: 55.2, imagen: 'assets/murales/mural-11.jpg', activo: true },
    { id: 13, tipo: 'mural', nombre: 'Mural 12', descripcion: 'Descripción del mural 12.', artista: 'Por definir', gps: { lat: 6.29444, lng: -75.544202 }, top: 39.5, left: 49.5, imagen: 'assets/murales/mural-12.jpg', activo: true },
    { id: 14, tipo: 'mural', nombre: 'Mural 13', descripcion: 'Descripción del mural 13.', artista: 'Por definir', gps: { lat: 6.29435, lng: -75.544192 }, top: 23.3, left: 57.0, imagen: 'assets/murales/mural-13.jpg', activo: true },
    { id: 15, tipo: 'mural', nombre: 'Mural 14', descripcion: 'Descripción del mural 14.', artista: 'Por definir', gps: { lat: 6.293735, lng: -75.543645 }, top: 23.5, left: 54.5, imagen: 'assets/murales/mural-14.jpg', activo: true },
    { id: 16, tipo: 'mural', nombre: 'Mural 15', descripcion: 'Descripción del mural 15.', artista: 'Por definir', gps: { lat: 6.293735, lng: -75.543645 }, top: 33.0, left: 33.3, imagen: 'assets/murales/mural-15.jpg', activo: true },
    { id: 17, tipo: 'mural', nombre: 'Mural 16', descripcion: 'Descripción del mural 16.', artista: 'Por definir', gps: { lat: 6.293758, lng: -75.54359 }, top: 33.8, left: 33.4, imagen: 'assets/murales/mural-16.jpg', activo: true },
    { id: 18, tipo: 'mural', nombre: 'Mural 17', descripcion: 'Descripción del mural 17.', artista: 'Por definir', gps: { lat: 6.293813, lng: -75.543663 }, top: 34.8, left: 34.0, imagen: 'assets/murales/mural-17.jpg', activo: true },
    { id: 19, tipo: 'mural', nombre: 'Mural 18', descripcion: 'Descripción del mural 18.', artista: 'Por definir', gps: { lat: 6.293813, lng: -75.543663 }, top: 33.8, left: 35.7, imagen: 'assets/murales/mural-18.jpg', activo: true },
    { id: 20, tipo: 'mural', nombre: 'Mural 19', descripcion: 'Descripción del mural 19.', artista: 'Por definir', gps: { lat: 6.293908, lng: -75.543672 }, top: 33.5, left: 38.7, imagen: 'assets/murales/mural-19.jpg', activo: true },
    { id: 21, tipo: 'mural', nombre: 'Mural 20', descripcion: 'Descripción del mural 20.', artista: 'Por definir', gps: { lat: 6.293983, lng: -75.5436 }, top: 34.9, left: 42.0, imagen: 'assets/murales/mural-20.jpg', activo: true },
    { id: 22, tipo: 'mural', nombre: 'Mural 21', descripcion: 'Descripción del mural 21.', artista: 'Por definir', gps: { lat: 6.294067, lng: -75.54356 }, top: 35.7, left: 45.0, imagen: 'assets/murales/mural-21.jpg', activo: true },
    { id: 23, tipo: 'mural', nombre: 'Mural 22', descripcion: 'Descripción del mural 22.', artista: 'Por definir', gps: { lat: 6.29406, lng: -75.54337 }, top: 39.2, left: 44.7, imagen: 'assets/murales/mural-22.jpg', activo: true },
    { id: 24, tipo: 'mural', nombre: 'Mural 23', descripcion: 'Descripción del mural 23.', artista: 'Por definir', gps: { lat: 6.293962, lng: -75.54333 }, top: 39.7, left: 44.1, imagen: 'assets/murales/mural-23.jpg', activo: true },
    { id: 25, tipo: 'mural', nombre: 'Mural 24', descripcion: 'Descripción del mural 24.', artista: 'Por definir', gps: { lat: 6.29406, lng: -75.54337 }, top: 40.4, left: 39.9, imagen: 'assets/murales/mural-24.jpg', activo: true },
    { id: 26, tipo: 'mural', nombre: 'Mural 25', descripcion: 'Descripción del mural 25.', artista: 'Por definir', gps: { lat: 6.293783, lng: -75.543067 }, top: 45.0, left: 34.8, imagen: 'assets/murales/mural-25.jpg', activo: true },
    { id: 27, tipo: 'mural', nombre: 'Mural 26', descripcion: 'Descripción del mural 26.', artista: 'Por definir', gps: { lat: 6.293652, lng: -75.54308 }, top: 45.2, left: 30.5, imagen: 'assets/murales/mural-26.jpg', activo: true },
    { id: 28, tipo: 'mural', nombre: 'Mural 27', descripcion: 'Descripción del mural 27.', artista: 'Por definir', gps: { lat: 6.2936, lng: -75.542995 }, top: 47.4, left: 28.4, imagen: 'assets/murales/mural-27.jpg', activo: true },
    { id: 29, tipo: 'mural', nombre: 'Mural 28', descripcion: 'Descripción del mural 28.', artista: 'Por definir', gps: { lat: 6.293555, lng: -75.542812 }, top: 50.3, left: 27.0, imagen: 'assets/murales/mural-28.jpg', activo: true },
    { id: 30, tipo: 'mural', nombre: 'Mural 29', descripcion: 'Descripción del mural 29.', artista: 'Por definir', gps: { lat: 6.293517, lng: -75.54271 }, top: 52.5, left: 25.4, imagen: 'assets/murales/mural-29.jpg', activo: true },
    { id: 31, tipo: 'mural', nombre: 'Mural 30', descripcion: 'Descripción del mural 30.', artista: 'Por definir', gps: { lat: 6.293478, lng: -75.542617 }, top: 54.3, left: 24.2, imagen: 'assets/murales/mural-30.jpg', activo: true },
    { id: 32, tipo: 'mural', nombre: 'Mural 31', descripcion: 'Descripción del mural 31.', artista: 'Por definir', gps: { lat: 6.293475, lng: -75.54252 }, top: 56.1, left: 24.2, imagen: 'assets/murales/mural-31.jpg', activo: true },
    { id: 33, tipo: 'mural', nombre: 'Mural 32', descripcion: 'Descripción del mural 32.', artista: 'Por definir', gps: { lat: 6.2932, lng: -75.542165 }, top: 62.6, left: 15.1, imagen: 'assets/murales/mural-32.jpg', activo: true },
    { id: 34, tipo: 'mural', nombre: 'Mural 33', descripcion: 'Descripción del mural 33.', artista: 'Por definir', gps: { lat: 6.293393, lng: -75.542258 }, top: 61.3, left: 21.1, imagen: 'assets/murales/mural-33.jpg', activo: true },
];

const puntoFin = {
    id: 35,
    tipo: 'fin',
    nombre: 'Fin del Recorrido',
    descripcion: 'Has completado el recorrido.',
    gps: { lat: 6.293052, lng: -75.541483 },
    top: 74.2,
    left: 9.3,
    imagen: 'assets/iconos-mapa/icono-fin.png',
    activo: true
};

/* ================================
   SENSOR DE ORIENTACIÓN
   ================================ */
let orientationStarted = false;
let currentHeading = 0;
let lastHeading = 0;

// ← AJUSTE DE ROTACIÓN: CAMBIA ESTE VALOR
const ROTATION_OFFSET = 180;  // Prueba: 0, 90, 180, 270, -90

function startOrientation() {
    if (orientationStarted) {
        return;
    }
    
    logDebug('🧭 Iniciando sensor de orientación...');
    orientationStarted = true;
    
    if (typeof DeviceOrientationEvent === 'undefined') {
        logDebug('❌ DeviceOrientationEvent NO existe');
        return;
    }
    
    logDebug('✅ DeviceOrientationEvent disponible');
    
    window.addEventListener('deviceorientation', (event) => {
        let heading = 0;
        
        if (event.webkitCompassHeading) {
            heading = event.webkitCompassHeading;
            logDebug('📱 Usando webkitCompassHeading (iOS)');
        } else if (event.alpha !== null) {
            heading = (360 - event.alpha + ROTATION_OFFSET) % 360;
            logDebug('📱 Usando alpha (Android)');
        } else {
            logDebug('⚠️ No hay datos de orientación');
            return;
        }
        
        currentHeading = heading;
        logDebug(`🧭 Heading: ${heading.toFixed(1)}°`);
        
        rotateUserArrow(heading);
        rotateCompassNeedle(heading);
    }, true);
    
    logDebug('✅ Sensor iniciado - Esperando eventos...');
}

/* ================================
   ROTAR FLECHA GPS
   ================================ */
function rotateUserArrow(heading) {
    const userDot = document.getElementById('user-location');
    
    if (!userDot || userDot.style.display === 'none') {
        return;
    }
    
    userDot.style.transform = `translate(-50%, -50%) rotate(${heading}deg)`;
    logDebug(`🔄 Flecha rotada`);
}

/* ================================
   ROTAR AGUJA BRÚJULA
   ================================ */
function rotateCompassNeedle(heading) {
    const needle = document.querySelector('.compass-needle');
    if (needle) {
        needle.style.transform = `translate(-50%, -50%) rotate(${-heading}deg)`;
    }
}

/* ================================
   ACTUALIZAR POSICIÓN GPS
   ================================ */
function updateUserLocationOnMap(lat, lng) {
    const userDot = document.getElementById('user-location');
    
    if (!userDot) {
        return;
    }
    
    const position = gpsToMapPercent(lat, lng);
    
    logDebug(`📍 GPS recibido: lat=${lat.toFixed(6)}, lng=${lng.toFixed(6)}`);
    logDebug(`📍 GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    logDebug(`📍 Mapa: top=${position.top.toFixed(1)}%, left=${position.left.toFixed(1)}%`);
    
    userDot.style.top = position.top + '%';
    userDot.style.left = position.left + '%';
    userDot.style.display = 'block';
    logDebug(`✅ Punto GPS mostrado en mapa`);
}

/* ================================
   ACTIVAR GPS
   ================================ */
let watchId = null;

function activateGPS() {
    logDebug('🔵 Activando GPS...');
    
    startOrientation();
    
    if (!('geolocation' in navigator)) {
        logDebug('❌ Geolocation NO soportado');
        alert('Tu navegador no soporta geolocalización');
        return;
    }
    
    const userDot = document.getElementById('user-location');
    updateNavActive('nav-ubicacion');
    userDot.style.display = 'block';
    
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            const heading = position.coords.heading;
            
            logDebug(`📍 GPS recibido: lat=${lat.toFixed(6)}, lng=${lng.toFixed(6)}, accuracy=${accuracy.toFixed(1)}m`);
            
            updateUserLocationOnMap(lat, lng);
            
            if (heading !== null && !isNaN(heading)) {
                logDebug(`🧭 GPS heading: ${heading.toFixed(1)}°`);
                rotateUserArrow(heading);
                rotateCompassNeedle(heading);
            }
        },
        (error) => {
            console.error('❌ Error GPS:', error.code, error.message);
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    alert('❌ Permiso de ubicación denegado.');
                    break;
                case error.POSITION_UNAVAILABLE:
                    alert('⚠️ Ubicación no disponible. Acércate a una ventana.');
                    break;
                case error.TIMEOUT:
                    alert('⏱️ Tiempo agotado. Intenta de nuevo.');
                    break;
            }
        },
        {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000
        }
    );
}

/* ================================
   BRÚJULA FLOTANTE
   ================================ */
let compassEnabled = false;

function requestCompassPermission() {
    startOrientation();
    compassEnabled = true;
    alert('✅ Brújula activada. Gira tu celular.');
}

/* ================================
   PANTALLA DE CARGA
   ================================ */
window.addEventListener('load', () => {
    debugPanel = createDebugPanel();
    logDebug('🚀 Página cargada');
    
    const loadingScreen = document.getElementById('loading-screen');
    const appContainer = document.getElementById('app-container');
    let percent = 0;
    
    const interval = setInterval(() => {
        percent += 5;
        document.querySelector('.loading-percent').textContent = percent + '%';
        
        if (percent >= 100) {
            clearInterval(interval);
            loadingScreen.style.display = 'none';
            appContainer.style.display = 'flex';
            initMap();
            startOrientation();
        }
    }, 200);
});

/* ================================
   INICIALIZAR MAPA
   ================================ */
function initMap() {
    applyTransform();
    createHotspots();
    setupGestures();
    setupPan();
    logDebug('✅ Mapa inicializado');
}

/* ================================
   CONTAR PUNTOS
   ================================ */
function contarPuntosActivos() {
    let count = 0;
    if (puntoInicio.activo) count++;
    if (puntoFin.activo) count++;
    count += murales.filter(m => m.activo).length;
    return count;
}

/* ================================
   ZOOM
   ================================ */
function zoomIn() {
    if (currentZoom < maxZoom) {
        currentZoom = Math.min(currentZoom + zoomStep, maxZoom);
        applyTransform();
        updateHotspotSizes();
    }
}

function zoomOut() {
    if (currentZoom > minZoom) {
        currentZoom = Math.max(currentZoom - zoomStep, minZoom);
        applyTransform();
        updateHotspotSizes();
    }
}

function resetZoom() {
    currentZoom = 1;
    panX = 0;
    panY = 0;
    mapRotation = 0;
    applyTransform();
    updateHotspotSizes();
}

function applyTransform() {
    const mapContent = document.getElementById('map-content');
    if (mapContent) {
        mapContent.style.transform = `scale(${currentZoom}) translate(${panX}px, ${panY}px) rotate(${mapRotation}deg)`;
    }
}

/* ================================
   TAMAÑO DE PINS
   ================================ */
function updateHotspotSizes() {
    const hotspots = document.querySelectorAll('.hotspot');
    const baseSize = 40;
    const newSize = baseSize / currentZoom;
    
    hotspots.forEach(hotspot => {
        hotspot.style.width = newSize + 'px';
        hotspot.style.height = newSize + 'px';
    });
    
    const userLocation = document.getElementById('user-location');
    if (userLocation) {
        const gpsBaseSize = 36;
        const gpsNewSize = gpsBaseSize / currentZoom;
        userLocation.style.width = gpsNewSize + 'px';
        userLocation.style.height = gpsNewSize + 'px';
    }
}

/* ================================
   GESTOS TÁCTILES
   ================================ */
function setupGestures() {
    const mapContainer = document.getElementById('map-container');
    
    mapContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            isPinching = true;
            isDragging = false;
            initialPinchDistance = getDistance(e.touches);
        }
    }, { passive: false });
    
    mapContainer.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && isPinching) {
            e.preventDefault();
            const distance = getDistance(e.touches);
            const scale = distance / initialPinchDistance;
            currentZoom = Math.min(Math.max(currentZoom * scale, minZoom), maxZoom);
            applyTransform();
            updateHotspotSizes();
        }
    }, { passive: false });
    
    mapContainer.addEventListener('touchend', () => {
        isPinching = false;
    });
}

function getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

/* ================================
   PAN (ARRASTRAR)
   ================================ */
function setupPan() {
    const mapContainer = document.getElementById('map-container');
    
    mapContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1 && !isPinching) {
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startPanX = panX;
            startPanY = panY;
        }
    }, { passive: false });
    
    mapContainer.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isDragging && !isPinching) {
            e.preventDefault();
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            panX = startPanX + dx;
            panY = startPanY + dy;
            applyTransform();
        }
    }, { passive: false });
    
    mapContainer.addEventListener('touchend', () => {
        isDragging = false;
    });
}

/* ================================
   CREAR PUNTOS
   ================================ */
function createHotspots() {
    const container = document.getElementById('hotspots-container');
    container.innerHTML = '';
    
    if (puntoInicio.activo) {
        const inicioHotspot = document.createElement('div');
        inicioHotspot.className = 'hotspot hotspot-inicio';
        inicioHotspot.style.top = puntoInicio.top + '%';
        inicioHotspot.style.left = puntoInicio.left + '%';
        inicioHotspot.onclick = () => openModal(puntoInicio);
        container.appendChild(inicioHotspot);
    }
    
    if (puntoFin.activo) {
        const finHotspot = document.createElement('div');
        finHotspot.className = 'hotspot hotspot-fin';
        finHotspot.style.top = puntoFin.top + '%';
        finHotspot.style.left = puntoFin.left + '%';
        finHotspot.onclick = () => openModal(puntoFin);
        container.appendChild(finHotspot);
    }
    
    murales.forEach(mural => {
        if (mural.activo) {
            const hotspot = document.createElement('div');
            hotspot.className = 'hotspot hotspot-mural';
            hotspot.style.top = mural.top + '%';
            hotspot.style.left = mural.left + '%';
            hotspot.onclick = () => openModal(mural);
            container.appendChild(hotspot);
        }
    });
    
    updateHotspotSizes();
}

/* ================================
   FILTROS
   ================================ */
function applyFilter(filterType) {
    const allHotspots = document.querySelectorAll('.hotspot');
    
    document.querySelectorAll('.filter-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const selectedFilter = document.getElementById('filter-' + filterType);
    if (selectedFilter) {
        selectedFilter.classList.add('active');
    }
    
    allHotspots.forEach(hotspot => {
        if (filterType === 'todos') {
            hotspot.classList.remove('hidden');
        } else if (filterType === 'inicio' && hotspot.classList.contains('hotspot-inicio')) {
            hotspot.classList.remove('hidden');
        } else if (filterType === 'fin' && hotspot.classList.contains('hotspot-fin')) {
            hotspot.classList.remove('hidden');
        } else if (filterType === 'murales' && hotspot.classList.contains('hotspot-mural')) {
            hotspot.classList.remove('hidden');
        } else {
            hotspot.classList.add('hidden');
        }
    });
    
    closeFilterModal();
}

/* ================================
   MODALES
   ================================ */
function openModal(punto) {
    document.getElementById('modalTitle').textContent = punto.nombre;
    document.getElementById('modalDesc').textContent = punto.descripcion;
    
    if (punto.artista) {
        document.getElementById('modalArtist').textContent = 'Artista: ' + punto.artista;
        document.getElementById('modalArtist').style.display = 'block';
    } else {
        document.getElementById('modalArtist').style.display = 'none';
    }
    
    if (punto.imagen) {
        document.getElementById('modalImg').src = punto.imagen;
        document.getElementById('modalImg').style.display = 'block';
    } else {
        document.getElementById('modalImg').style.display = 'none';
    }
    
    document.getElementById('infoModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('infoModal').style.display = 'none';
}

document.getElementById('infoModal').onclick = (e) => {
    if (e.target.id === 'infoModal') {
        closeModal();
    }
};

function openFilterModal() {
    document.getElementById('filterModal').style.display = 'flex';
    updateNavActive('nav-filtrar');
}

function closeFilterModal() {
    document.getElementById('filterModal').style.display = 'none';
}

function openMuralesModal() {
    document.getElementById('muralesModal').style.display = 'flex';
    loadMuralesList();
    updateNavActive('nav-murales');
}

function closeMuralesModal() {
    document.getElementById('muralesModal').style.display = 'none';
}

function loadMuralesList() {
    const container = document.getElementById('muralesList');
    
    if (murales.length === 0) {
        container.innerHTML = '<p class="loading-murales">Coming soon</p>';
        return;
    }
    
    container.innerHTML = '';
    let muralNumero = 1;
    
    murales.forEach((mural) => {
        if (mural.activo) {
            const muralItem = document.createElement('div');
            muralItem.className = 'mural-item';
            muralItem.onclick = () => {
                closeMuralesModal();
                openModal(mural);
            };
            
            muralItem.innerHTML = `
                <div class="mural-number">${muralNumero}</div>
                <div class="mural-info">
                    <h4>${mural.nombre}</h4>
                    <p>${mural.descripcion.substring(0, 50)}...</p>
                </div>
            `;
            
            container.appendChild(muralItem);
            muralNumero++;
        }
    });
}

function updateNavActive(activeId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.getElementById(activeId);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}