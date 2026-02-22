// ===== Map Component (Leaflet + Overpass API) =====
import L from 'leaflet';

// Fix Leaflet default icon paths for bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// KNU Daehak-ro area center (경북대학교 대학로)
const KNU_CENTER = [35.8886, 128.6102];
const SEARCH_RADIUS = 600; // meters

let mapInstance = null;
let markers = [];

export function renderMap(container, onLocationSelect, match, role) {
    container.innerHTML = `
    <div class="map-container">
      <div class="section-header">
        <div class="section-title">📍 장소 정하기</div>
      </div>
      <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:14px;line-height:1.4">
        지도를 클릭하여 내가 원하는 약속 장소를 제안하세요.<br/>
        <span style="color:#2ecc71;font-weight:700">● 선배 제안</span> &nbsp; <span style="color:#3498db;font-weight:700">● 후배 제안</span>
      </div>
      <div class="map-wrap" id="map" style="height:350px;border-radius:12px"></div>
    </div>
  `;

    let seniorMarker = null;
    let juniorMarker = null;
    let tempMarker = null;

    const seniorLoc = match.senior_location;
    const juniorLoc = match.junior_location;

    // Initialize map
    setTimeout(() => {
        if (mapInstance) {
            mapInstance.remove();
            mapInstance = null;
        }

        mapInstance = L.map('map', {
            center: seniorLoc ? [seniorLoc.lat, seniorLoc.lon] : (juniorLoc ? [juniorLoc.lat, juniorLoc.lon] : KNU_CENTER),
            zoom: 16,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(mapInstance);

        // KNU
        L.marker(KNU_CENTER, {
            icon: L.divIcon({
                className: '',
                html: '<div style="font-size:24px;text-align:center">🏫</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15],
            })
        }).addTo(mapInstance).bindPopup('<strong>경북대학교</strong>');

        // Render existing pins
        if (seniorLoc) {
            seniorMarker = L.marker([seniorLoc.lat, seniorLoc.lon], {
                icon: L.divIcon({
                    className: '',
                    html: '<div style="font-size:32px;text-align:center">🟢</div>',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                })
            }).addTo(mapInstance).bindPopup('<strong>선배님 제안 장소</strong>');
        }

        if (juniorLoc) {
            juniorMarker = L.marker([juniorLoc.lat, juniorLoc.lon], {
                icon: L.divIcon({
                    className: '',
                    html: '<div style="font-size:32px;text-align:center">🔵</div>',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                })
            }).addTo(mapInstance).bindPopup('<strong>후배님 제안 장소</strong>');
        }

        // Click to drop TEMP pin
        if (match.status !== 'confirmed') {
            mapInstance.on('click', (e) => {
                const { lat, lng } = e.latlng;

                if (tempMarker) mapInstance.removeLayer(tempMarker);

                tempMarker = L.marker([lat, lng]).addTo(mapInstance);

                const popupContent = document.createElement('div');
                popupContent.style.padding = '5px';
                popupContent.innerHTML = `
                    <div style="font-weight:600;margin-bottom:8px;font-size:0.9rem">이 장소를 제안할까요?</div>
                    <button class="btn btn-accent btn-sm" id="btn-suggest-this-spot" style="width:100%">📌 ${role === 'senior' ? '선배 장소로 제안' : '후배 장소로 제안'}</button>
                `;

                tempMarker.bindPopup(popupContent).openPopup();

                setTimeout(() => {
                    document.getElementById('btn-suggest-this-spot')?.addEventListener('click', () => {
                        const location = {
                            id: `custom-${role}-${Date.now()}`,
                            name: `${role === 'senior' ? '선배' : '후배'} 제안 장소`,
                            address: `위도: ${lat.toFixed(4)}, 경도: ${lng.toFixed(4)}`,
                            lat,
                            lon: lng
                        };
                        if (onLocationSelect) onLocationSelect(location);
                    });
                }, 10);
            });
        }
    }, 100);
}

export function destroyMap() {
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
    markers = [];
}
