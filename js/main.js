// Main JavaScript untuk SIG Klinik Nalumsari

let map;
let markers = [];
let klinikData = [];

// Inisialisasi peta saat dokumen siap
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    loadKlinikData();
});

// Inisialisasi Leaflet Map
function initMap() {
    // Buat map dengan center di Nalumsari
    map = L.map('map').setView([-6.6584, 110.7456], 14);
    
    // Tambahkan tile layer dari OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Custom icon untuk marker
    window.klinikIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
}

// Load data klinik dari API
function loadKlinikData(search = '', jenis = '') {
    let url = 'api/klinik.php';
    let params = [];
    
    if (search) params.push('search=' + encodeURIComponent(search));
    if (jenis) params.push('jenis=' + encodeURIComponent(jenis));
    
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    
    fetch(url)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                klinikData = result.data;
                displayMarkers(klinikData);
                displayKlinikList(klinikData);
            } else {
                console.error('Gagal memuat data klinik');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Tampilkan marker di peta
function displayMarkers(data) {
    // Hapus marker lama
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Tambah marker baru
    data.forEach(klinik => {
        // Pilih warna marker berdasarkan jenis
        let iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
        
        switch(klinik.jenis_klinik) {
            case 'gigi':
                iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
                break;
            case 'bersalin':
                iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';
                break;
            case 'spesialis':
                iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png';
                break;
        }
        
        const customIcon = L.icon({
            iconUrl: iconUrl,
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        
        const marker = L.marker([klinik.latitude, klinik.longitude], { icon: customIcon })
            .addTo(map);
        
        // Buat popup content
        const popupContent = `
            <div class="popup-content">
                <div class="popup-title">${klinik.nama_klinik}</div>
                <div class="popup-info">
                    <p><i class="fas fa-map-marker-alt"></i> ${klinik.alamat}</p>
                    ${klinik.telepon ? `<p><i class="fas fa-phone"></i> ${klinik.telepon}</p>` : ''}
                    ${klinik.jam_operasional ? `<p><i class="fas fa-clock"></i> ${klinik.jam_operasional}</p>` : ''}
                    <p><i class="fas fa-hospital"></i> <span class="badge bg-primary">${klinik.jenis_klinik.toUpperCase()}</span></p>
                    ${klinik.fasilitas ? `<p><i class="fas fa-check-circle"></i> ${klinik.fasilitas}</p>` : ''}
                </div>
                <div class="popup-btn">
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${klinik.latitude},${klinik.longitude}" 
                       target="_blank" class="btn btn-sm btn-primary">
                        <i class="fas fa-directions"></i> Petunjuk Arah
                    </a>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        markers.push(marker);
    });
}

// Tampilkan daftar klinik di sidebar
function displayKlinikList(data) {
    const listContainer = document.getElementById('klinikList');
    
    if (data.length === 0) {
        listContainer.innerHTML = '<p class="text-muted text-center">Tidak ada klinik ditemukan</p>';
        return;
    }
    
    let html = '';
    data.forEach(klinik => {
        let badgeClass = 'bg-primary';
        switch(klinik.jenis_klinik) {
            case 'gigi': badgeClass = 'bg-success'; break;
            case 'bersalin': badgeClass = 'bg-danger'; break;
            case 'spesialis': badgeClass = 'bg-info'; break;
        }
        
        html += `
            <div class="klinik-item fade-in" onclick="focusKlinik(${klinik.latitude}, ${klinik.longitude})">
                <h6><i class="fas fa-hospital"></i> ${klinik.nama_klinik}</h6>
                <small><i class="fas fa-map-marker-alt"></i> ${klinik.alamat}</small>
                <div class="mt-2">
                    <span class="badge ${badgeClass}">${klinik.jenis_klinik}</span>
                </div>
            </div>
        `;
    });
    
    listContainer.innerHTML = html;
}

// Fokus ke klinik tertentu di peta
function focusKlinik(lat, lng) {
    map.setView([lat, lng], 17);
    
    // Buka popup marker yang sesuai
    markers.forEach(marker => {
        const markerLatLng = marker.getLatLng();
        if (markerLatLng.lat === lat && markerLatLng.lng === lng) {
            marker.openPopup();
        }
    });
}

// Apply filter
function applyFilter() {
    const search = document.getElementById('searchInput').value;
    const jenis = document.getElementById('jenisFilter').value;
    
    loadKlinikData(search, jenis);
}

// Event listener untuk enter key di search
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyFilter();
            }
        });
    }
});
