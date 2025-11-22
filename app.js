// Mock data for seats
const floors = ['1/F', 'G/F', 'LG1', 'LG3', 'LG4', 'LG5'];
const zones = ['quiet', 'group', 'computer'];
const seatStatuses = ['available', 'occupied', 'hogging', 'reserved'];

let seats = [];
let cameraActive = false;
let detectionInterval = null;
let seatUpdateInterval = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    generateLibraryMap();
    initializeSeats();
    setupEventListeners();
    initializeMapControls();
    startSeatUpdates();
    initializeCharts();
    initializeVideo();
    
    // Initialize zoom indicator after a short delay to ensure DOM is ready
    setTimeout(() => {
        updateZoomIndicator();
    }, 200);
});

// Generate mock seats
function initializeSeats() {
    seats = [];
    let seatId = 1;
    
    floors.forEach(floor => {
        zones.forEach(zone => {
            for (let i = 0; i < 12; i++) {
                const status = seatStatuses[Math.floor(Math.random() * 4)];
                const lastUpdate = Date.now() - Math.random() * 3600000; // Random time in last hour
                
                // Create seat ID with floor name (handle special characters like /)
                const floorId = floor.replace('/', '-');
                seats.push({
                    id: `${floorId}-${zone.charAt(0).toUpperCase()}-${seatId++}`,
                    floor: floor,
                    zone: zone,
                    status: status,
                    lastUpdate: lastUpdate,
                    occupiedTime: status === 'occupied' || status === 'hogging' ? 
                        Math.floor(Math.random() * 120) : 0 // minutes
                });
            }
        });
    });
    
    renderSeats();
    updateHeaderStats();
}

// Setup event listeners
function setupEventListeners() {
    // Tab switching (top navigation)
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });

    // Filter controls - only floor filter for map view
    document.getElementById('floor-filter').addEventListener('change', () => {
        generateLibraryMap();
        renderSeats();
    });

    // Camera toggle
    document.getElementById('toggle-camera').addEventListener('click', toggleCamera);
    
    // Fullscreen toggle for camera feed - will be attached in DOMContentLoaded
}

// Tab switching
function switchTab(tabName) {
    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });

    // Initialize charts when analytics tab is opened
    if (tabName === 'analytics') {
        setTimeout(initializeCharts, 100);
    }
}

// Library map configuration
const mapConfig = {
    zoom: 0.8, // Start zoomed out to see more of the map
    minZoom: 0.25,
    maxZoom: 4,
    panX: 0,
    panY: 0,
    isPanning: false,
    startX: 0,
    startY: 0,
    mapScale: 1.5, // Map is 1.5x larger than viewport
    isZooming: false,
    zoomStep: 0.15 // Smoother zoom increments
};

// Initialize map controls
function initializeMapControls() {
    const map = document.getElementById('library-map');
    const container = document.getElementById('library-map-container');
    
    // Improved zoom function - zooms towards a specific point
    function zoomToPoint(zoomDelta, pointX, pointY) {
        const oldZoom = mapConfig.zoom;
        const newZoom = Math.min(Math.max(mapConfig.zoom + zoomDelta, mapConfig.minZoom), mapConfig.maxZoom);
        
        if (oldZoom === newZoom) return; // Already at limit
        
        const rect = container.getBoundingClientRect();
        const relativeX = pointX - rect.left;
        const relativeY = pointY - rect.top;
        
        // Calculate zoom factor
        const zoomFactor = newZoom / oldZoom;
        
        // Adjust pan to keep the point under cursor fixed
        mapConfig.panX = relativeX - (relativeX - mapConfig.panX) * zoomFactor;
        mapConfig.panY = relativeY - (relativeY - mapConfig.panY) * zoomFactor;
        
        mapConfig.zoom = newZoom;
        updateMapTransform(true);
        updateZoomIndicator();
    }
    
    // Zoom controls with smooth animation
    document.getElementById('zoom-in').addEventListener('click', () => {
        const containerRect = container.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        zoomToPoint(mapConfig.zoomStep, centerX, centerY);
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
        const containerRect = container.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        zoomToPoint(-mapConfig.zoomStep, centerX, centerY);
    });
    
    document.getElementById('reset-view').addEventListener('click', () => {
        mapConfig.zoom = 0.8;
        mapConfig.panX = 0;
        mapConfig.panY = 0;
        updateMapTransform(true);
        updateZoomIndicator();
    });
    
    // Fullscreen functionality
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (!fullscreenBtn) {
        console.error('Fullscreen button not found!');
        return;
    }
    
    // Add click handler with proper event handling
    fullscreenBtn.addEventListener('click', (e) => {
        console.log('Fullscreen button clicked!');
        toggleFullscreen(e);
    }, { capture: false });
    
    // Also handle touch events for mobile
    fullscreenBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        console.log('Fullscreen button touched!');
        toggleFullscreen(e);
    }, { passive: false });
    
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    function toggleFullscreen(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (!container) {
            console.error('Map container not found!');
            return;
        }
        
        const isFullscreen = !!(document.fullscreenElement || 
                                document.webkitFullscreenElement || 
                                document.mozFullScreenElement || 
                                document.msFullscreenElement ||
                                container.classList.contains('fullscreen-active'));
        
        console.log('Toggle fullscreen, current state:', isFullscreen);
        
        if (!isFullscreen) {
            // Enter fullscreen
            // Try standard API first
            if (container.requestFullscreen) {
                container.requestFullscreen().catch(err => {
                    console.log('Fullscreen API error:', err);
                    // Fallback to manual fullscreen for mobile
                    enterManualFullscreen();
                });
            } else if (container.webkitRequestFullscreen) {
                // iOS Safari
                container.webkitRequestFullscreen().catch(err => {
                    console.log('Webkit fullscreen error:', err);
                    enterManualFullscreen();
                });
            } else if (container.mozRequestFullScreen) {
                container.mozRequestFullScreen().catch(err => {
                    console.log('Moz fullscreen error:', err);
                    enterManualFullscreen();
                });
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen().catch(err => {
                    console.log('MS fullscreen error:', err);
                    enterManualFullscreen();
                });
            } else {
                // Fallback for browsers that don't support Fullscreen API
                console.log('No fullscreen API support, using manual fullscreen');
                enterManualFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => {
                    console.log('Exit fullscreen error:', err);
                    exitManualFullscreen();
                });
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen().catch(err => {
                    console.log('Exit webkit fullscreen error:', err);
                    exitManualFullscreen();
                });
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen().catch(err => {
                    console.log('Exit moz fullscreen error:', err);
                    exitManualFullscreen();
                });
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen().catch(err => {
                    console.log('Exit MS fullscreen error:', err);
                    exitManualFullscreen();
                });
            } else {
                // Exit manual fullscreen
                exitManualFullscreen();
            }
        }
    }
    
    // Manual fullscreen fallback for mobile browsers
    function enterManualFullscreen() {
        console.log('Entering manual fullscreen');
        if (!container) return;
        container.classList.add('fullscreen-active');
        document.body.classList.add('map-fullscreen-active');
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        // Update button
        if (fullscreenBtn) {
            fullscreenBtn.textContent = '⛶';
            fullscreenBtn.title = 'Exit Fullscreen';
        }
        // Recalculate map size
        setTimeout(() => {
            updateMapTransform();
        }, 100);
    }
    
    function exitManualFullscreen() {
        console.log('Exiting manual fullscreen');
        if (!container) return;
        container.classList.remove('fullscreen-active');
        document.body.classList.remove('map-fullscreen-active');
        // Restore body scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        // Update button
        if (fullscreenBtn) {
            fullscreenBtn.textContent = '⛶';
            fullscreenBtn.title = 'Fullscreen';
        }
        // Recalculate map size
        setTimeout(() => {
            updateMapTransform();
        }, 100);
    }
    
    function handleFullscreenChange() {
        const isFullscreen = !!(document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.mozFullScreenElement || 
                               document.msFullscreenElement);
        
        console.log('Fullscreen change detected, isFullscreen:', isFullscreen);
        
        if (isFullscreen) {
            container.classList.add('fullscreen-active');
            document.body.classList.add('map-fullscreen-active');
            // Prevent body scroll on mobile
            document.body.style.overflow = 'hidden';
            if (fullscreenBtn) {
                fullscreenBtn.textContent = '⛶';
                fullscreenBtn.title = 'Exit Fullscreen';
            }
            // Recalculate map size for fullscreen
            setTimeout(() => {
                updateMapTransform();
            }, 100);
        } else {
            container.classList.remove('fullscreen-active');
            document.body.classList.remove('map-fullscreen-active');
            // Restore body scroll
            document.body.style.overflow = '';
            if (fullscreenBtn) {
                fullscreenBtn.textContent = '⛶';
                fullscreenBtn.title = 'Fullscreen';
            }
            // Recalculate map size after exiting fullscreen
            setTimeout(() => {
                updateMapTransform();
            }, 100);
        }
    }
    
    // Handle orientation changes in fullscreen
    window.addEventListener('orientationchange', () => {
        if (container.classList.contains('fullscreen-active')) {
            setTimeout(() => {
                updateMapTransform();
            }, 200);
        }
    });
    
    // Handle resize events for better mobile support
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (container.classList.contains('fullscreen-active')) {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                updateMapTransform();
            }, 150);
        }
    });
    
    // Update fullscreen button state on load
    handleFullscreenChange();
    
    // Double-click to zoom in (desktop only)
    let lastClickTime = 0;
    let clickTimeout;
    container.addEventListener('dblclick', (e) => {
        if (e.target.closest('.map-seat') || e.target.closest('.map-btn')) return;
        e.preventDefault();
        zoomToPoint(mapConfig.zoomStep * 2, e.clientX, e.clientY);
    });
    
    // Enhanced mouse wheel zoom with smooth scaling
    container.addEventListener('wheel', (e) => {
        // Allow zoom with Ctrl/Cmd+wheel or just wheel (if not panning)
        if (e.ctrlKey || e.metaKey || (!e.shiftKey && !e.altKey)) {
            e.preventDefault();
            
            // Calculate zoom delta with exponential scaling for smoother feel
            // More sensitive for better control
            const zoomSensitivity = 0.002;
            const delta = -e.deltaY * zoomSensitivity * mapConfig.zoom;
            
            // Zoom towards mouse position
            zoomToPoint(delta, e.clientX, e.clientY);
        }
    }, { passive: false });
    
    // Update zoom indicator on initial load
    setTimeout(() => updateZoomIndicator(), 100);
    
    // Pan with mouse drag
    let isDragging = false;
    let startPanX = 0;
    let startPanY = 0;
    
    container.addEventListener('mousedown', (e) => {
        if (e.target.closest('.map-seat') || e.target.closest('.map-btn')) return;
        isDragging = true;
        startPanX = e.clientX - mapConfig.panX;
        startPanY = e.clientY - mapConfig.panY;
        container.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        mapConfig.panX = e.clientX - startPanX;
        mapConfig.panY = e.clientY - startPanY;
        updateMapTransform();
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });
    
    // Enhanced touch support for mobile - improved pinch zoom
    let touchStartX = 0;
    let touchStartY = 0;
    let lastDistance = 0;
    let touchStartTime = 0;
    let isPinching = false;
    let initialZoom = 1;
    let initialPanX = 0;
    let initialPanY = 0;
    let initialPinchCenterX = 0;
    let initialPinchCenterY = 0;
    
    // Prevent double-tap zoom on mobile
    let lastTap = 0;
    container.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0 && e.touches.length === 0) {
            e.preventDefault();
        }
        lastTap = currentTime;
    }, { passive: false });
    
    container.addEventListener('touchstart', (e) => {
        // Don't interfere with seat clicks or button clicks
        if (e.target.closest('.map-seat') || e.target.closest('.map-btn')) {
            return;
        }
        
        if (e.touches.length === 1) {
            // Single touch - pan
            const touch = e.touches[0];
            const rect = container.getBoundingClientRect();
            touchStartX = touch.clientX - rect.left - mapConfig.panX;
            touchStartY = touch.clientY - rect.top - mapConfig.panY;
            touchStartTime = Date.now();
            isDragging = true;
            isPinching = false;
            lastDistance = 0;
        } else if (e.touches.length === 2) {
            // Two touches - start pinch zoom
            e.preventDefault();
            isDragging = false;
            isPinching = true;
            
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const rect = container.getBoundingClientRect();
            
            // Calculate initial pinch center in container coordinates
            const centerX = (touch1.clientX + touch2.clientX) / 2;
            const centerY = (touch1.clientY + touch2.clientY) / 2;
            initialPinchCenterX = centerX - rect.left;
            initialPinchCenterY = centerY - rect.top;
            
            // Store initial distance and zoom/pan state
            lastDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
            initialZoom = mapConfig.zoom;
            initialPanX = mapConfig.panX;
            initialPanY = mapConfig.panY;
        }
    }, { passive: false });
    
    container.addEventListener('touchmove', (e) => {
        // Don't interfere with seat clicks or button clicks
        if (e.target.closest('.map-seat') || e.target.closest('.map-btn')) {
            return;
        }
        
        if (e.touches.length === 1 && isDragging && !isPinching) {
            // Single touch pan
            e.preventDefault();
            const touch = e.touches[0];
            const rect = container.getBoundingClientRect();
            mapConfig.panX = touch.clientX - rect.left - touchStartX;
            mapConfig.panY = touch.clientY - rect.top - touchStartY;
            updateMapTransform();
        } else if (e.touches.length === 2) {
            // Pinch zoom - always prevent default for smooth operation
            e.preventDefault();
            
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
            
            // Initialize if this is the first move after touchstart
            if (lastDistance === 0 || !isPinching) {
                const rect = container.getBoundingClientRect();
                const centerX = (touch1.clientX + touch2.clientX) / 2;
                const centerY = (touch1.clientY + touch2.clientY) / 2;
                initialPinchCenterX = centerX - rect.left;
                initialPinchCenterY = centerY - rect.top;
                lastDistance = distance;
                initialZoom = mapConfig.zoom;
                initialPanX = mapConfig.panX;
                initialPanY = mapConfig.panY;
                isPinching = true;
                return;
            }
            
            // Calculate zoom based on distance change
            const scale = distance / lastDistance;
            const newZoom = Math.min(Math.max(initialZoom * scale, mapConfig.minZoom), mapConfig.maxZoom);
            const zoomFactor = newZoom / initialZoom;
            
            // Adjust pan to keep the initial pinch center point fixed
            // This ensures zoom happens toward the point where pinch started
            mapConfig.panX = initialPinchCenterX - (initialPinchCenterX - initialPanX) * zoomFactor;
            mapConfig.panY = initialPinchCenterY - (initialPinchCenterY - initialPanY) * zoomFactor;
            
            mapConfig.zoom = newZoom;
            updateMapTransform();
            updateZoomIndicator();
            
            lastDistance = distance;
        }
    }, { passive: false });
    
    container.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) {
            // All touches ended
            isDragging = false;
            isPinching = false;
            lastDistance = 0;
        } else if (e.touches.length === 1) {
            // One touch remaining, switch to pan mode
            isPinching = false;
            const touch = e.touches[0];
            const rect = container.getBoundingClientRect();
            touchStartX = touch.clientX - rect.left - mapConfig.panX;
            touchStartY = touch.clientY - rect.top - mapConfig.panY;
            isDragging = true;
            lastDistance = 0;
        } else if (e.touches.length === 2) {
            // Still two touches - continue pinch
            // Recalculate initial values for the remaining touches
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const rect = container.getBoundingClientRect();
            const centerX = (touch1.clientX + touch2.clientX) / 2;
            const centerY = (touch1.clientY + touch2.clientY) / 2;
            initialPinchCenterX = centerX - rect.left;
            initialPinchCenterY = centerY - rect.top;
            lastDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
            initialZoom = mapConfig.zoom;
            initialPanX = mapConfig.panX;
            initialPanY = mapConfig.panY;
        }
    }, { passive: false });
}

function updateMapTransform(animate = false) {
    const map = document.getElementById('library-map');
    const container = document.getElementById('library-map-container');
    
    // Add smooth transition for zoom operations
    if (animate) {
        map.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
        map.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    
    // Constrain panning to keep map within reasonable bounds
    const containerRect = container.getBoundingClientRect();
    const scaledWidth = containerRect.width * mapConfig.mapScale * mapConfig.zoom;
    const scaledHeight = containerRect.height * mapConfig.mapScale * mapConfig.zoom;
    
    // Limit panning to map boundaries
    const maxPanX = Math.max(0, (scaledWidth - containerRect.width) / (2 * mapConfig.zoom));
    const maxPanY = Math.max(0, (scaledHeight - containerRect.height) / (2 * mapConfig.zoom));
    
    mapConfig.panX = Math.max(-maxPanX, Math.min(maxPanX, mapConfig.panX));
    mapConfig.panY = Math.max(-maxPanY, Math.min(maxPanY, mapConfig.panY));
    
    // Apply transform with zoom and pan
    map.style.transform = `translate(${mapConfig.panX}px, ${mapConfig.panY}px) scale(${mapConfig.zoom})`;
    
    // Remove transition after animation completes
    if (animate) {
        setTimeout(() => {
            map.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
        }, 400);
    }
}

// Update zoom level indicator
function updateZoomIndicator() {
    const zoomPercent = Math.round(mapConfig.zoom * 100);
    const indicator = document.getElementById('zoom-indicator');
    if (indicator) {
        indicator.textContent = `${zoomPercent}%`;
        
        // Update button states
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        
        if (zoomInBtn) {
            zoomInBtn.disabled = mapConfig.zoom >= mapConfig.maxZoom;
            zoomInBtn.style.opacity = mapConfig.zoom >= mapConfig.maxZoom ? '0.5' : '1';
        }
        if (zoomOutBtn) {
            zoomOutBtn.disabled = mapConfig.zoom <= mapConfig.minZoom;
            zoomOutBtn.style.opacity = mapConfig.zoom <= mapConfig.minZoom ? '0.5' : '1';
        }
    }
}

// Floor-specific map layouts - complete floor plans showing all rooms
const floorLayouts = {
    '1/F': {
        // Seat zones
        quiet: { 
            x: 5, y: 8, width: 32, height: 45, 
            label: 'Quiet Zone',
            shape: 'l-shape',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 80%, 70% 80%, 70% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        group: { 
            x: 40, y: 8, width: 28, height: 45, 
            label: 'Group Study',
            shape: 'rectangle',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        computer: { 
            x: 71, y: 8, width: 26, height: 45, 
            label: 'Computer Zone',
            shape: 'rectangle',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        // Facilities
        facilities: [
            { x: 5, y: 55, width: 12, height: 15, label: 'Staff Room', type: 'staff' },
            { x: 20, y: 55, width: 10, height: 15, label: 'Toilet', type: 'toilet' },
            { x: 33, y: 55, width: 10, height: 15, label: 'Toilet', type: 'toilet' },
            { x: 46, y: 55, width: 12, height: 15, label: 'Storage', type: 'storage' },
            { x: 61, y: 55, width: 10, height: 15, label: 'Toilet', type: 'toilet' },
            { x: 74, y: 55, width: 10, height: 15, label: 'Toilet', type: 'toilet' },
            { x: 87, y: 55, width: 10, height: 15, label: 'Stairs', type: 'stairs' }
        ],
        corridors: [
            { x: 37, y: 8, width: 3, height: 45, type: 'vertical' },
            { x: 68, y: 8, width: 3, height: 45, type: 'vertical' },
            { x: 5, y: 53, width: 92, height: 2, type: 'horizontal' },
            { x: 17, y: 55, width: 3, height: 15, type: 'vertical' },
            { x: 30, y: 55, width: 3, height: 15, type: 'vertical' },
            { x: 43, y: 55, width: 3, height: 15, type: 'vertical' },
            { x: 58, y: 55, width: 3, height: 15, type: 'vertical' },
            { x: 71, y: 55, width: 3, height: 15, type: 'vertical' },
            { x: 84, y: 55, width: 3, height: 15, type: 'vertical' }
        ],
        entrances: [
            { x: 48, y: 0, width: 4, height: 2, type: 'main' },
            { x: 25, y: 0, width: 3, height: 2, type: 'side' }
        ]
    },
    'G/F': {
        quiet: { 
            x: 5, y: 10, width: 30, height: 40, 
            label: 'Quiet Zone',
            shape: 'rectangle',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        group: { 
            x: 38, y: 10, width: 33, height: 40, 
            label: 'Group Study',
            shape: 'u-shape',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 18% 100%, 18% 72%, 82% 72%, 82% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        computer: { 
            x: 74, y: 10, width: 23, height: 40, 
            label: 'Computer Zone',
            shape: 'rectangle',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        facilities: [
            { x: 5, y: 52, width: 15, height: 18, label: 'Reception', type: 'reception' },
            { x: 23, y: 52, width: 10, height: 18, label: 'Toilet', type: 'toilet' },
            { x: 36, y: 52, width: 10, height: 18, label: 'Toilet', type: 'toilet' },
            { x: 49, y: 52, width: 12, height: 18, label: 'Staff Room', type: 'staff' },
            { x: 64, y: 52, width: 10, height: 18, label: 'Toilet', type: 'toilet' },
            { x: 77, y: 52, width: 10, height: 18, label: 'Toilet', type: 'toilet' },
            { x: 90, y: 52, width: 7, height: 18, label: 'Elevator', type: 'elevator' }
        ],
        corridors: [
            { x: 35, y: 10, width: 3, height: 40, type: 'vertical' },
            { x: 71, y: 10, width: 3, height: 40, type: 'vertical' },
            { x: 5, y: 50, width: 92, height: 2, type: 'horizontal' },
            { x: 20, y: 52, width: 3, height: 18, type: 'vertical' },
            { x: 33, y: 52, width: 3, height: 18, type: 'vertical' },
            { x: 46, y: 52, width: 3, height: 18, type: 'vertical' },
            { x: 61, y: 52, width: 3, height: 18, type: 'vertical' },
            { x: 74, y: 52, width: 3, height: 18, type: 'vertical' },
            { x: 87, y: 52, width: 3, height: 18, type: 'vertical' }
        ],
        entrances: [
            { x: 47, y: 0, width: 6, height: 3, type: 'main' }
        ]
    },
    'LG1': {
        quiet: { 
            x: 5, y: 5, width: 33, height: 50, 
            label: 'Quiet Zone',
            shape: 't-shape',
            clipPath: 'polygon(0% 0%, 58% 0%, 58% 38%, 100% 38%, 100% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        group: { 
            x: 41, y: 5, width: 30, height: 50, 
            label: 'Group Study',
            shape: 'rectangle',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        computer: { 
            x: 74, y: 5, width: 23, height: 50, 
            label: 'Computer Zone',
            shape: 'rectangle',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        facilities: [
            { x: 5, y: 57, width: 12, height: 15, label: 'Staff Room', type: 'staff' },
            { x: 20, y: 57, width: 10, height: 15, label: 'Toilet', type: 'toilet' },
            { x: 33, y: 57, width: 10, height: 15, label: 'Storage', type: 'storage' },
            { x: 46, y: 57, width: 10, height: 15, label: 'Toilet', type: 'toilet' },
            { x: 59, y: 57, width: 12, height: 15, label: 'Storage', type: 'storage' },
            { x: 74, y: 57, width: 10, height: 15, label: 'Toilet', type: 'toilet' },
            { x: 87, y: 57, width: 10, height: 15, label: 'Stairs', type: 'stairs' }
        ],
        corridors: [
            { x: 38, y: 5, width: 3, height: 50, type: 'vertical' },
            { x: 71, y: 5, width: 3, height: 50, type: 'vertical' },
            { x: 5, y: 55, width: 92, height: 2, type: 'horizontal' },
            { x: 17, y: 57, width: 3, height: 15, type: 'vertical' },
            { x: 30, y: 57, width: 3, height: 15, type: 'vertical' },
            { x: 43, y: 57, width: 3, height: 15, type: 'vertical' },
            { x: 56, y: 57, width: 3, height: 15, type: 'vertical' },
            { x: 71, y: 57, width: 3, height: 15, type: 'vertical' },
            { x: 84, y: 57, width: 3, height: 15, type: 'vertical' }
        ],
        entrances: [
            { x: 50, y: 0, width: 4, height: 2, type: 'main' }
        ]
    },
    'LG3': {
        quiet: { 
            x: 5, y: 8, width: 28, height: 40, 
            label: 'Quiet Zone',
            shape: 'rectangle',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        group: { 
            x: 36, y: 8, width: 36, height: 40, 
            label: 'Group Study',
            shape: 'l-shape',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 58%, 68% 58%, 68% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        computer: { 
            x: 75, y: 8, width: 22, height: 40, 
            label: 'Computer Zone',
            shape: 'rectangle',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        facilities: [
            { x: 5, y: 50, width: 12, height: 18, label: 'Staff Room', type: 'staff' },
            { x: 20, y: 50, width: 10, height: 18, label: 'Toilet', type: 'toilet' },
            { x: 33, y: 50, width: 10, height: 18, label: 'Toilet', type: 'toilet' },
            { x: 46, y: 50, width: 12, height: 18, label: 'Storage', type: 'storage' },
            { x: 61, y: 50, width: 10, height: 18, label: 'Toilet', type: 'toilet' },
            { x: 74, y: 50, width: 10, height: 18, label: 'Toilet', type: 'toilet' },
            { x: 87, y: 50, width: 10, height: 18, label: 'Stairs', type: 'stairs' }
        ],
        corridors: [
            { x: 33, y: 8, width: 3, height: 40, type: 'vertical' },
            { x: 72, y: 8, width: 3, height: 40, type: 'vertical' },
            { x: 5, y: 48, width: 92, height: 2, type: 'horizontal' },
            { x: 17, y: 50, width: 3, height: 18, type: 'vertical' },
            { x: 30, y: 50, width: 3, height: 18, type: 'vertical' },
            { x: 43, y: 50, width: 3, height: 18, type: 'vertical' },
            { x: 58, y: 50, width: 3, height: 18, type: 'vertical' },
            { x: 71, y: 50, width: 3, height: 18, type: 'vertical' },
            { x: 84, y: 50, width: 3, height: 18, type: 'vertical' }
        ],
        entrances: [
            { x: 48, y: 0, width: 4, height: 2, type: 'main' }
        ]
    },
    'LG4': {
        quiet: { 
            x: 5, y: 8, width: 34, height: 42, 
            label: 'Quiet Zone',
            shape: 'u-shape',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 22% 100%, 22% 76%, 78% 76%, 78% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        group: { 
            x: 42, y: 8, width: 28, height: 42, 
            label: 'Group Study',
            shape: 'rectangle',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        computer: { 
            x: 73, y: 8, width: 24, height: 42, 
            label: 'Computer Zone',
            shape: 'rectangle',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        facilities: [
            { x: 5, y: 52, width: 12, height: 16, label: 'Staff Room', type: 'staff' },
            { x: 20, y: 52, width: 10, height: 16, label: 'Toilet', type: 'toilet' },
            { x: 33, y: 52, width: 10, height: 16, label: 'Toilet', type: 'toilet' },
            { x: 46, y: 52, width: 12, height: 16, label: 'Storage', type: 'storage' },
            { x: 61, y: 52, width: 10, height: 16, label: 'Toilet', type: 'toilet' },
            { x: 74, y: 52, width: 10, height: 16, label: 'Toilet', type: 'toilet' },
            { x: 87, y: 52, width: 10, height: 16, label: 'Stairs', type: 'stairs' }
        ],
        corridors: [
            { x: 39, y: 8, width: 3, height: 42, type: 'vertical' },
            { x: 70, y: 8, width: 3, height: 42, type: 'vertical' },
            { x: 5, y: 50, width: 92, height: 2, type: 'horizontal' },
            { x: 17, y: 52, width: 3, height: 16, type: 'vertical' },
            { x: 30, y: 52, width: 3, height: 16, type: 'vertical' },
            { x: 43, y: 52, width: 3, height: 16, type: 'vertical' },
            { x: 58, y: 52, width: 3, height: 16, type: 'vertical' },
            { x: 71, y: 52, width: 3, height: 16, type: 'vertical' },
            { x: 84, y: 52, width: 3, height: 16, type: 'vertical' }
        ],
        entrances: [
            { x: 49, y: 0, width: 4, height: 2, type: 'main' }
        ]
    },
    'LG5': {
        quiet: { 
            x: 5, y: 8, width: 32, height: 38, 
            label: 'Quiet Zone',
            shape: 'rectangle',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        group: { 
            x: 40, y: 8, width: 31, height: 38, 
            label: 'Group Study',
            shape: 't-shape',
            clipPath: 'polygon(0% 0%, 63% 0%, 63% 34%, 100% 34%, 100% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        computer: { 
            x: 74, y: 8, width: 23, height: 38, 
            label: 'Computer Zone',
            shape: 'rectangle',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            type: 'seat-zone'
        },
        facilities: [
            { x: 5, y: 48, width: 12, height: 20, label: 'Staff Room', type: 'staff' },
            { x: 20, y: 48, width: 10, height: 20, label: 'Toilet', type: 'toilet' },
            { x: 33, y: 48, width: 10, height: 20, label: 'Toilet', type: 'toilet' },
            { x: 46, y: 48, width: 12, height: 20, label: 'Storage', type: 'storage' },
            { x: 61, y: 48, width: 10, height: 20, label: 'Toilet', type: 'toilet' },
            { x: 74, y: 48, width: 10, height: 20, label: 'Toilet', type: 'toilet' },
            { x: 87, y: 48, width: 10, height: 20, label: 'Stairs', type: 'stairs' }
        ],
        corridors: [
            { x: 37, y: 8, width: 3, height: 38, type: 'vertical' },
            { x: 71, y: 8, width: 3, height: 38, type: 'vertical' },
            { x: 5, y: 46, width: 92, height: 2, type: 'horizontal' },
            { x: 17, y: 48, width: 3, height: 20, type: 'vertical' },
            { x: 30, y: 48, width: 3, height: 20, type: 'vertical' },
            { x: 43, y: 48, width: 3, height: 20, type: 'vertical' },
            { x: 58, y: 48, width: 3, height: 20, type: 'vertical' },
            { x: 71, y: 48, width: 3, height: 20, type: 'vertical' },
            { x: 84, y: 48, width: 3, height: 20, type: 'vertical' }
        ],
        entrances: [
            { x: 48, y: 0, width: 4, height: 2, type: 'main' }
        ]
    }
};

// Default layout (fallback)
const defaultLayout = {
    quiet: { 
        x: 5, y: 5, width: 30, height: 40, 
        label: 'Quiet Zone',
        shape: 'rectangle',
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
    },
    group: { 
        x: 40, y: 5, width: 30, height: 40, 
        label: 'Group Study',
        shape: 'rectangle',
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
    },
    computer: { 
        x: 75, y: 5, width: 20, height: 40, 
        label: 'Computer Zone',
        shape: 'rectangle',
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
    },
    corridors: []
};

// Generate library map structure
function generateLibraryMap() {
    const mapZones = document.getElementById('map-zones');
    const mapLabels = document.getElementById('map-labels');
    const floorFilter = document.getElementById('floor-filter').value;
    
    // Clear existing content
    mapZones.innerHTML = '';
    mapLabels.innerHTML = '';
    
    // Get layout for selected floor (always a specific floor)
    const layout = floorLayouts[floorFilter] || defaultLayout;
    const { quiet, group, computer, corridors = [], facilities = [], entrances = [] } = layout;
    
    // Create corridors first (so they appear behind everything)
    corridors.forEach(corridor => {
        const corridorEl = document.createElement('div');
        corridorEl.className = 'map-corridor';
        corridorEl.style.left = `${corridor.x}%`;
        corridorEl.style.top = `${corridor.y}%`;
        corridorEl.style.width = `${corridor.width}%`;
        corridorEl.style.height = `${corridor.height}%`;
        mapZones.appendChild(corridorEl);
    });
    
    // Create seat zones with custom shapes
    [quiet, group, computer].forEach(config => {
        if (!config) return;
        
        const zone = document.createElement('div');
        const zoneName = config === quiet ? 'quiet' : config === group ? 'group' : 'computer';
        zone.className = `map-zone zone-${zoneName}`;
        zone.style.left = `${config.x}%`;
        zone.style.top = `${config.y}%`;
        zone.style.width = `${config.width}%`;
        zone.style.height = `${config.height}%`;
        
        // Apply custom clip-path for varied shapes
        if (config.clipPath) {
            zone.style.clipPath = config.clipPath;
            zone.style.webkitClipPath = config.clipPath;
        }
        
        mapZones.appendChild(zone);
        
        // Add zone label - position at top center of zone
        const label = document.createElement('div');
        label.className = 'zone-label';
        label.textContent = config.label;
        label.style.left = `${config.x + config.width / 2}%`;
        label.style.top = `${config.y + 1}%`;
        label.style.transform = 'translateX(-50%)';
        mapLabels.appendChild(label);
    });
    
    // Create facilities (staff rooms, toilets, etc.)
    facilities.forEach(facility => {
        const facilityEl = document.createElement('div');
        facilityEl.className = `map-facility facility-${facility.type}`;
        facilityEl.style.left = `${facility.x}%`;
        facilityEl.style.top = `${facility.y}%`;
        facilityEl.style.width = `${facility.width}%`;
        facilityEl.style.height = `${facility.height}%`;
        mapZones.appendChild(facilityEl);
        
        // Add facility label - position at center of facility
        const label = document.createElement('div');
        label.className = 'facility-label';
        label.textContent = facility.label;
        label.style.left = `${facility.x + facility.width / 2}%`;
        label.style.top = `${facility.y + facility.height / 2}%`;
        label.style.transform = 'translate(-50%, -50%)';
        mapLabels.appendChild(label);
    });
    
    // Create entrances
    entrances.forEach(entrance => {
        const entranceEl = document.createElement('div');
        entranceEl.className = `map-entrance entrance-${entrance.type}`;
        entranceEl.style.left = `${entrance.x}%`;
        entranceEl.style.top = `${entrance.y}%`;
        entranceEl.style.width = `${entrance.width}%`;
        entranceEl.style.height = `${entrance.height}%`;
        mapZones.appendChild(entranceEl);
    });
    
    // Add structural elements (columns, walls)
    addStructuralElements(mapZones, floorFilter);
}

// Add structural elements to make it look more realistic
function addStructuralElements(container, floor) {
    // Add columns at strategic positions (varied by floor)
    const columnPositions = {
        '1/F': [
            { x: 18, y: 28, size: 1.2 },
            { x: 48, y: 32, size: 1.2 },
            { x: 78, y: 28, size: 1.2 },
            { x: 32, y: 62, size: 1.2 },
            { x: 68, y: 62, size: 1.2 }
        ],
        'G/F': [
            { x: 20, y: 30, size: 1.2 },
            { x: 50, y: 32, size: 1.2 },
            { x: 80, y: 30, size: 1.2 },
            { x: 35, y: 60, size: 1.2 },
            { x: 65, y: 60, size: 1.2 }
        ],
        'LG1': [
            { x: 19, y: 30, size: 1.2 },
            { x: 48, y: 32, size: 1.2 },
            { x: 78, y: 30, size: 1.2 },
            { x: 33, y: 64, size: 1.2 },
            { x: 67, y: 64, size: 1.2 }
        ],
        'LG3': [
            { x: 18, y: 28, size: 1.2 },
            { x: 50, y: 30, size: 1.2 },
            { x: 80, y: 28, size: 1.2 },
            { x: 35, y: 58, size: 1.2 },
            { x: 65, y: 58, size: 1.2 }
        ],
        'LG4': [
            { x: 20, y: 28, size: 1.2 },
            { x: 50, y: 30, size: 1.2 },
            { x: 78, y: 28, size: 1.2 },
            { x: 35, y: 60, size: 1.2 },
            { x: 65, y: 60, size: 1.2 }
        ],
        'LG5': [
            { x: 19, y: 26, size: 1.2 },
            { x: 50, y: 28, size: 1.2 },
            { x: 79, y: 26, size: 1.2 },
            { x: 35, y: 56, size: 1.2 },
            { x: 65, y: 56, size: 1.2 }
        ]
    };
    
    const columns = columnPositions[floor] || columnPositions['1/F'];
    
    columns.forEach(col => {
        const column = document.createElement('div');
        column.className = 'map-column';
        column.style.left = `${col.x}%`;
        column.style.top = `${col.y}%`;
        column.style.width = `${col.size}%`;
        column.style.height = `${col.size}%`;
        container.appendChild(column);
    });
}

// Calculate seat positions within zones
function getSeatPosition(seat, index, totalInZone) {
    const floorFilter = document.getElementById('floor-filter').value;
    
    // Get layout for selected floor (always a specific floor)
    const layout = floorLayouts[floorFilter] || defaultLayout;
    const config = layout[seat.zone];
    if (!config) return { x: 0, y: 0, width: 3, height: 3 };
    
    // Arrange seats in a grid within the zone
    // More columns for larger zones, fewer for computer zone
    const cols = seat.zone === 'computer' ? 2 : (seat.zone === 'group' ? 4 : 3);
    const rows = Math.ceil(totalInZone / cols);
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    // Calculate position with padding (seats arranged like tables in a library)
    const padding = 1.5;
    const seatWidth = Math.max(3, (config.width - padding * (cols + 1)) / cols);
    const seatHeight = Math.max(3, (config.height - padding * (rows + 1)) / rows);
    
    const x = config.x + padding + col * (seatWidth + padding);
    const y = config.y + padding + row * (seatHeight + padding);
    
    return { x, y, width: seatWidth, height: seatHeight };
}

// Render seats on map
function renderSeats() {
    const floorFilter = document.getElementById('floor-filter').value;

    // Filter by selected floor - show all zones and all statuses on the selected floor
    // Status is already color-coded on the map
    const filteredSeats = seats.filter(seat => {
        return seat.floor === floorFilter;
    });

    // Group seats by zone
    const seatsByZone = {};
    filteredSeats.forEach(seat => {
        if (!seatsByZone[seat.zone]) {
            seatsByZone[seat.zone] = [];
        }
        seatsByZone[seat.zone].push(seat);
    });

    // Clear existing seats
    document.querySelectorAll('.map-seat').forEach(seat => seat.remove());

    // Render seats in each zone
    Object.entries(seatsByZone).forEach(([zone, zoneSeats]) => {
        zoneSeats.forEach((seat, index) => {
            const position = getSeatPosition(seat, index, zoneSeats.length);
        const timeText = seat.status === 'occupied' || seat.status === 'hogging' ? 
            `${seat.occupiedTime}m` : '';
        
            const seatEl = document.createElement('div');
            seatEl.className = `map-seat seat-${seat.status}`;
            seatEl.dataset.seatId = seat.id;
            seatEl.style.left = `${position.x}%`;
            seatEl.style.top = `${position.y}%`;
            seatEl.style.width = `${position.width}%`;
            seatEl.style.height = `${position.height}%`;
            
            seatEl.innerHTML = `
                <div class="seat-id">${seat.id}</div>
                ${seat.status === 'hogging' ? '<div class="seat-badge">⚠️</div>' : ''}
                ${timeText ? `<div class="seat-time">${timeText}</div>` : ''}
        `;

            // Add click handler
        seatEl.addEventListener('click', () => {
                showSeatDetails(seat);
            });
            
            document.getElementById('map-zones').appendChild(seatEl);
        });
    });
}

function getStatusText(status) {
    const statusMap = {
        'available': 'Available',
        'occupied': 'Occupied',
        'hogging': 'Hogging',
        'reserved': 'Reserved'
    };
    return statusMap[status] || status;
}

// Update header statistics
function updateHeaderStats() {
    const available = seats.filter(s => s.status === 'available').length;
    const occupied = seats.filter(s => s.status === 'occupied').length;
    const hogging = seats.filter(s => s.status === 'hogging').length;

    document.getElementById('total-available').textContent = available;
    document.getElementById('total-occupied').textContent = occupied;
    document.getElementById('total-hogging').textContent = hogging;
}

// Simulate real-time seat updates
function startSeatUpdates() {
    seatUpdateInterval = setInterval(() => {
        // Randomly update some seats
        seats.forEach(seat => {
            if (Math.random() < 0.1) { // 10% chance to update
                updateSeatStatus(seat);
            }
        });
        
        renderSeats();
        updateHeaderStats();
    }, 3000); // Update every 3 seconds
}

function updateSeatStatus(seat) {
    // Simulate status changes
    if (seat.status === 'available') {
        if (Math.random() < 0.3) {
            seat.status = 'occupied';
            seat.occupiedTime = 0;
        }
    } else if (seat.status === 'occupied') {
        seat.occupiedTime += 1;
        // If occupied for more than 15 minutes without activity, mark as hogging
        if (seat.occupiedTime > 15 && Math.random() < 0.2) {
            seat.status = 'hogging';
        }
    } else if (seat.status === 'hogging') {
        seat.occupiedTime += 1;
        // Sometimes clear hogging (person returns or seat is freed)
        if (Math.random() < 0.15) {
            seat.status = 'available';
            seat.occupiedTime = 0;
        }
    } else if (seat.status === 'reserved') {
        if (Math.random() < 0.4) {
            seat.status = 'available';
        }
    }
}

// Camera functionality
function toggleCamera() {
    cameraActive = !cameraActive;
    const btn = document.getElementById('toggle-camera');
    const status = document.getElementById('camera-status');
    const feed = document.getElementById('camera-feed');
    const overlay = document.getElementById('detection-overlay');

    if (cameraActive) {
        const btnText = btn.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'Stop Detection';
        btn.classList.add('active');
        status.classList.add('active');
        const statusText = status.querySelector('span:last-child');
        if (statusText) statusText.textContent = 'Online';
        feed.classList.add('active');
        
        // Cartoon will show automatically via CSS when .camera-feed.active is applied
        startCameraDetection();
    } else {
        const btnText = btn.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'Start Detection';
        btn.classList.remove('active');
        status.classList.remove('active');
        const statusText = status.querySelector('span:last-child');
        if (statusText) statusText.textContent = 'Offline';
        feed.classList.remove('active');
        overlay.innerHTML = '';
        
        // Cartoon will hide automatically via CSS when .camera-feed.active is removed
        stopCameraDetection();
    }
}

function startCameraDetection() {
    const overlay = document.getElementById('detection-overlay');
    const detectionList = document.getElementById('detection-list');
    
    // Clear previous detections
    overlay.innerHTML = '';
    detectionList.innerHTML = '';

    // Play the video when detection starts
    const video = document.querySelector('.seat-demo[data-seat="5"] video');
    if (video) {
        console.log('🎬 Starting video playback...');
        
        // Force load if not loaded
        if (video.readyState < 2) {
            video.load();
        }
        
        // Ensure muted for autoplay (required on HTTPS/GitHub Pages)
        video.muted = true;
        video.volume = 0;
        
        // Try to play with better error handling for GitHub Pages
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('✓ Video playing successfully!');
            }).catch(err => {
                console.warn('Autoplay blocked (common on GitHub Pages):', err.message);
                console.log('Click the video to play manually');
                
                // Add click handler as fallback
                video.addEventListener('click', function playOnClick() {
                    video.play();
                    video.removeEventListener('click', playOnClick);
                }, { once: true });
            });
        }
    } else {
        console.warn('Video element not found in startCameraDetection');
    }

    // Update detection list and stats periodically
    detectionInterval = setInterval(() => {
        // Update detection list
        updateDetectionList();
        updateCVStats();
    }, 2000);
}

function stopCameraDetection() {
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
}

function updateDetectionList() {
    const detectionList = document.getElementById('detection-list');
    const hoggingSeats = seats.filter(s => s.status === 'hogging').slice(0, 5);
    
    detectionList.innerHTML = hoggingSeats.map(seat => `
        <div class="detection-item">
            <div class="detection-icon">👤</div>
            <div class="detection-info">
                <div class="detection-title">${seat.id}</div>
                <div class="detection-details">Person detected - No activity for ${seat.occupiedTime}+ min</div>
                <div class="detection-time">Last seen: ${Math.floor(Math.random() * 5) + 1} minutes ago</div>
            </div>
            <div class="detection-status hogging">⚠️ Seat Hogging</div>
        </div>
    `).join('');
}

function updateCVStats() {
    const detections = seats.filter(s => s.status === 'hogging').length;
    const avgTime = seats.filter(s => s.status === 'hogging')
        .reduce((sum, s) => sum + s.occupiedTime, 0) / Math.max(detections, 1);
    
    document.getElementById('cv-detections').textContent = detections;
    document.getElementById('cv-avg-time').textContent = `${Math.floor(avgTime)}m`;
}

// Show seat details (could be expanded to a modal)
function showSeatDetails(seat) {
    alert(`Seat: ${seat.id}\nFloor: ${seat.floor}\nZone: ${seat.zone}\nStatus: ${getStatusText(seat.status)}\nOccupied Time: ${seat.occupiedTime} minutes`);
}

// Initialize charts
function initializeCharts() {
    // Occupancy Rate Chart (24h)
    const occupancyCtx = document.getElementById('occupancy-chart');
    if (occupancyCtx) {
        const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
        const occupancyData = hours.map(() => 50 + Math.random() * 40);
        
        new Chart(occupancyCtx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Occupancy %',
                    data: occupancyData,
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Distribution Chart
    const distributionCtx = document.getElementById('distribution-chart');
    if (distributionCtx) {
        const available = seats.filter(s => s.status === 'available').length;
        const occupied = seats.filter(s => s.status === 'occupied').length;
        const hogging = seats.filter(s => s.status === 'hogging').length;
        const reserved = seats.filter(s => s.status === 'reserved').length;
        
        new Chart(distributionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Available', 'Occupied', 'Seat Hogging', 'Reserved'],
                datasets: [{
                    data: [available, occupied, hogging, reserved],
                    backgroundColor: [
                        '#28a745',
                        '#ffc107',
                        '#dc3545',
                        '#6c757d'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Peak Hours Chart
    const peakHoursCtx = document.getElementById('peak-hours-chart');
    if (peakHoursCtx) {
        const hours = ['8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'];
        const peakData = hours.map((_, i) => {
            if (i >= 2 && i <= 5) { // Peak hours
                return 80 + Math.random() * 15;
            }
            return 40 + Math.random() * 30;
        });
        
        new Chart(peakHoursCtx, {
            type: 'bar',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Seats Occupied',
                    data: peakData,
                    backgroundColor: '#0066cc'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Hogging Trend Chart
    const hoggingTrendCtx = document.getElementById('hogging-trend-chart');
    if (hoggingTrendCtx) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const hoggingData = days.map(() => Math.floor(Math.random() * 30) + 5);
        
        new Chart(hoggingTrendCtx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Hogging Incidents',
                    data: hoggingData,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Fullscreen functionality - Mobile and Desktop with real API
function toggleFullscreen() {
    const container = document.getElementById('camera-feed-container');
    const btn = document.getElementById('camera-fullscreen-btn');
    const icon = btn?.querySelector('.fullscreen-icon');
    
    if (!container || !btn || !icon) {
        console.error('Camera fullscreen elements not found:', { container: !!container, btn: !!btn, icon: !!icon });
        return;
    }
    
    // Check if currently in fullscreen
    const isFullscreen = container.classList.contains('fullscreen') ||
                        document.fullscreenElement ||
                        document.webkitFullscreenElement ||
                        document.mozFullScreenElement ||
                        document.msFullscreenElement;
    
    if (!isFullscreen) {
        // Enter fullscreen
        console.log('Entering fullscreen mode...');
        
        // Detect mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        // Try real Fullscreen API first
        const requestFullscreen = container.requestFullscreen || 
                                 container.webkitRequestFullscreen || 
                                 container.webkitEnterFullscreen ||
                                 container.mozRequestFullScreen || 
                                 container.msRequestFullscreen;
        
        let apiSuccess = false;
        
        if (requestFullscreen) {
            // Try the native API
            const fullscreenPromise = requestFullscreen.call(container, 
                // Pass options for mobile devices
                isIOS ? { navigationUI: 'hide' } : undefined
            );
            
            if (fullscreenPromise && fullscreenPromise.then) {
                fullscreenPromise.then(() => {
                    console.log('✅ Native fullscreen API activated');
                    container.classList.add('fullscreen');
                    document.body.classList.add('fullscreen-active');
                    icon.textContent = '✕';
                    apiSuccess = true;
                    
                    // Hide address bar on mobile
                    if (isMobile) {
                        setTimeout(() => window.scrollTo(0, 1), 100);
                    }
                }).catch(err => {
                    console.warn('❌ Fullscreen API failed:', err.message);
                    // Fallback to CSS
                    useCSSFullscreen();
                });
            } else {
                // Old API without promise
                container.classList.add('fullscreen');
                document.body.classList.add('fullscreen-active');
                icon.textContent = '✕';
                apiSuccess = true;
                console.log('✅ Native fullscreen API activated (legacy)');
            }
        } else {
            // No API support, use CSS fallback
            useCSSFullscreen();
        }
        
        function useCSSFullscreen() {
            container.classList.add('fullscreen');
            document.body.classList.add('fullscreen-active');
            icon.textContent = '✕';
            console.log('📱 Using CSS fullscreen (fallback)');
            
            // Hide address bar on mobile
            if (isMobile) {
                setTimeout(() => window.scrollTo(0, 1), 100);
            }
        }
        
    } else {
        // Exit fullscreen
        console.log('Exiting fullscreen mode...');
        
        // Try native API exit first
        if (document.fullscreenElement || document.webkitFullscreenElement || 
            document.mozFullScreenElement || document.msFullscreenElement) {
            
            const exitFullscreen = document.exitFullscreen || 
                                  document.webkitExitFullscreen || 
                                  document.webkitCancelFullScreen ||
                                  document.mozCancelFullScreen || 
                                  document.msExitFullscreen;
            
            if (exitFullscreen) {
                const exitPromise = exitFullscreen.call(document);
                
                if (exitPromise && exitPromise.then) {
                    exitPromise.then(() => {
                        console.log('✅ Exited native fullscreen');
                        exitCleanup();
                    }).catch(err => {
                        console.warn('❌ Exit fullscreen failed:', err.message);
                        exitCleanup();
                    });
                } else {
                    exitCleanup();
                }
            } else {
                exitCleanup();
            }
        } else {
            // CSS fullscreen only
            exitCleanup();
        }
        
        function exitCleanup() {
            container.classList.remove('fullscreen');
            document.body.classList.remove('fullscreen-active');
            icon.textContent = '⛶';
            console.log('📱 Fullscreen deactivated');
        }
    }
}

// Attach event listener to camera fullscreen button
document.addEventListener('DOMContentLoaded', () => {
    const cameraFullscreenBtn = document.getElementById('camera-fullscreen-btn');
    if (cameraFullscreenBtn) {
        cameraFullscreenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Camera fullscreen button clicked!');
            toggleFullscreen();
        });
        
        // Also handle touch events for mobile
        cameraFullscreenBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Camera fullscreen button touched!');
            toggleFullscreen();
        }, { passive: false });
    } else {
        console.warn('Camera fullscreen button not found!');
    }
});

// Handle fullscreen change events (for all browsers including mobile)
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);
// iOS specific events
document.addEventListener('webkitbeginfullscreen', handleFullscreenChange);
document.addEventListener('webkitendfullscreen', handleFullscreenChange);

function handleFullscreenChange(event) {
    const container = document.getElementById('camera-feed-container');
    const btn = document.getElementById('camera-fullscreen-btn');
    const icon = btn?.querySelector('.fullscreen-icon');
    
    if (!container || !btn || !icon) return;
    
    // Check all possible fullscreen states
    const isInNativeFullscreen = document.fullscreenElement || 
                                 document.webkitFullscreenElement || 
                                 document.mozFullScreenElement || 
                                 document.msFullscreenElement ||
                                 document.webkitIsFullScreen ||
                                 document.webkitDisplayingFullscreen;
    
    console.log('Fullscreen change event:', event.type, 'In fullscreen:', isInNativeFullscreen);
    
    if (isInNativeFullscreen) {
        // Sync CSS class with native fullscreen
        if (!container.classList.contains('fullscreen')) {
            container.classList.add('fullscreen');
            document.body.classList.add('fullscreen-active');
            icon.textContent = '✕';
            console.log('✅ Fullscreen activated (event handler)');
        }
    } else {
        // Native fullscreen was exited (e.g., via ESC key or back button)
        if (container.classList.contains('fullscreen')) {
            container.classList.remove('fullscreen');
            document.body.classList.remove('fullscreen-active');
            icon.textContent = '⛶';
            console.log('📱 Fullscreen deactivated (event handler)');
        }
    }
}

// Handle ESC key to exit CSS fullscreen
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
        const container = document.getElementById('camera-feed-container');
        const btn = document.getElementById('camera-fullscreen-btn');
        const icon = btn?.querySelector('.fullscreen-icon');
        
        if (container?.classList.contains('fullscreen')) {
            container.classList.remove('fullscreen');
            document.body.classList.remove('fullscreen-active');
            if (icon) icon.textContent = '⛶';
            console.log('Exited fullscreen via ESC key');
        }
    }
});

// Prevent body scroll when in fullscreen on mobile (but allow container scroll)
document.addEventListener('touchmove', (e) => {
    if (document.body.classList.contains('fullscreen-active')) {
        const container = document.getElementById('camera-feed-container');
        // Only prevent if touch is outside the camera feed container
        if (container && !container.contains(e.target)) {
            e.preventDefault();
        }
    }
}, { passive: false });

// Initialize video element
function initializeVideo() {
    const video = document.querySelector('.seat-demo[data-seat="5"] video');
    const container = document.querySelector('.seat-demo[data-seat="5"]');
    
    if (video) {
        console.log('✓ Video initialized successfully');
        
        // Ensure video plays when camera is active
        video.addEventListener('loadedmetadata', () => {
            console.log('✓ Video loaded:', video.videoWidth + 'x' + video.videoHeight, '(' + video.duration.toFixed(1) + 's)');
        });
        
        video.addEventListener('loadeddata', () => {
            console.log('✓ Video data loaded');
        });
        
        video.addEventListener('canplay', () => {
            console.log('✓ Video can play');
            // Try to play when it's ready
            video.play().catch(err => {
                console.log('Cannot autoplay yet:', err.message);
            });
        });
        
        video.addEventListener('playing', () => {
            console.log('✓✓ VIDEO IS PLAYING!');
        });
        
        video.addEventListener('error', (e) => {
            console.error('✗ Video failed to load');
            const source = video.querySelector('source');
            if (source && source.error) {
                console.error('Error code:', source.error.code);
            }
        });
        
        // Load and play the video
        video.load();
        setTimeout(() => {
            video.play().catch(err => console.log('Autoplay prevented'));
        }, 100);
    } else {
        console.error('✗ Video element not found');
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (seatUpdateInterval) clearInterval(seatUpdateInterval);
    if (detectionInterval) clearInterval(detectionInterval);
});

