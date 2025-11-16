// Mock data for seats
const floors = ['G', '1', '2', '3'];
const zones = ['quiet', 'group', 'computer'];
const seatStatuses = ['available', 'occupied', 'hogging', 'reserved'];

let seats = [];
let cameraActive = false;
let detectionInterval = null;
let seatUpdateInterval = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeSeats();
    setupEventListeners();
    startSeatUpdates();
    initializeCharts();
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
                
                seats.push({
                    id: `${floor}-${zone.charAt(0).toUpperCase()}-${seatId++}`,
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
    // Tab switching (bottom navigation)
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });

    // Filter controls
    document.getElementById('floor-filter').addEventListener('change', renderSeats);
    document.getElementById('zone-filter').addEventListener('change', renderSeats);

    // Camera toggle
    document.getElementById('toggle-camera').addEventListener('click', toggleCamera);
    
    // Fullscreen toggle
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    
    // Update time in status bar
    updateTime();
    setInterval(updateTime, 60000); // Update every minute
}

// Tab switching
function switchTab(tabName) {
    // Update navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabName);
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

// Update time in status bar
function updateTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeString = `${hours}:${minutes.toString().padStart(2, '0')}`;
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Render seats grid
function renderSeats() {
    const grid = document.getElementById('seat-grid');
    const floorFilter = document.getElementById('floor-filter').value;
    const zoneFilter = document.getElementById('zone-filter').value;

    const filteredSeats = seats.filter(seat => {
        const floorMatch = floorFilter === 'all' || seat.floor === floorFilter;
        const zoneMatch = zoneFilter === 'all' || seat.zone === zoneFilter;
        return floorMatch && zoneMatch;
    });

    grid.innerHTML = filteredSeats.map(seat => {
        const timeText = seat.status === 'occupied' || seat.status === 'hogging' ? 
            `${seat.occupiedTime}m` : '';
        
        return `
            <div class="seat ${seat.status}" data-seat-id="${seat.id}">
                <div class="seat-id">${seat.id}</div>
                <div class="seat-status">${getStatusText(seat.status)}</div>
                ${timeText ? `<div class="seat-time">${timeText}</div>` : ''}
                ${seat.status === 'hogging' ? '<div class="seat-badge">⚠️</div>' : ''}
            </div>
        `;
    }).join('');

    // Add click handlers
    grid.querySelectorAll('.seat').forEach(seatEl => {
        seatEl.addEventListener('click', () => {
            const seatId = seatEl.dataset.seatId;
            const seat = seats.find(s => s.id === seatId);
            if (seat) {
                showSeatDetails(seat);
            }
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

    // Update detection list and stats periodically
    // No need for moving boxes since we have cartoon characters showing the seats
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

// Fullscreen functionality
function toggleFullscreen() {
    const container = document.getElementById('camera-feed-container');
    const btn = document.getElementById('fullscreen-btn');
    const icon = btn.querySelector('.fullscreen-icon');
    
    if (!document.fullscreenElement && !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && !document.msFullscreenElement) {
        // Enter fullscreen
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
            container.mozRequestFullScreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        }
        container.classList.add('fullscreen');
        icon.textContent = '⛶';
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        container.classList.remove('fullscreen');
        icon.textContent = '⛶';
    }
}

// Handle fullscreen change events
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

function handleFullscreenChange() {
    const container = document.getElementById('camera-feed-container');
    const btn = document.getElementById('fullscreen-btn');
    const icon = btn.querySelector('.fullscreen-icon');
    
    if (document.fullscreenElement || document.webkitFullscreenElement || 
        document.mozFullScreenElement || document.msFullscreenElement) {
        container.classList.add('fullscreen');
        icon.textContent = '⛶';
    } else {
        container.classList.remove('fullscreen');
        icon.textContent = '⛶';
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (seatUpdateInterval) clearInterval(seatUpdateInterval);
    if (detectionInterval) clearInterval(detectionInterval);
});

