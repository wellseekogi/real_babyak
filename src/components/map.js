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

export function renderMap(container, onRestaurantSelect) {
    container.innerHTML = `
    <div class="map-container">
      <div class="section-header">
        <div class="section-title">📍 장소 조율</div>
      </div>
      <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:10px">
        경북대 대학로 근처 식당을 검색합니다. 마커를 클릭하여 장소를 제안하세요.
      </div>
      <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" id="btn-search-restaurants">🔍 주변 식당 검색</button>
        <span id="search-status" style="font-size:0.82rem;color:var(--text-muted);display:flex;align-items:center"></span>
      </div>
      <div class="map-wrap" id="map"></div>
      <div class="restaurant-list" id="restaurant-list"></div>
    </div>
  `;

    // Initialize map
    setTimeout(() => {
        if (mapInstance) {
            mapInstance.remove();
            mapInstance = null;
        }

        mapInstance = L.map('map', {
            center: KNU_CENTER,
            zoom: 16,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(mapInstance);

        // Add KNU marker
        const knuMarker = L.marker(KNU_CENTER, {
            icon: L.divIcon({
                className: '',
                html: '<div style="font-size:24px;text-align:center">🏫</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15],
            })
        }).addTo(mapInstance);
        knuMarker.bindPopup('<strong>경북대학교</strong>');

        // Add search radius circle
        L.circle(KNU_CENTER, {
            radius: SEARCH_RADIUS,
            color: 'rgba(26, 107, 60, 0.5)',
            fillColor: 'rgba(26, 107, 60, 0.08)',
            fillOpacity: 0.3,
            weight: 1,
        }).addTo(mapInstance);
    }, 100);

    // Search button
    document.getElementById('btn-search-restaurants')?.addEventListener('click', () => {
        searchRestaurants(onRestaurantSelect);
    });
}

async function searchRestaurants(onRestaurantSelect) {
    const statusEl = document.getElementById('search-status');
    const listEl = document.getElementById('restaurant-list');

    if (statusEl) statusEl.textContent = '검색중...';

    // Overpass API query for restaurants near KNU Daehak-ro
    const query = `
    [out:json][timeout:10];
    (
      node["amenity"="restaurant"](around:${SEARCH_RADIUS},${KNU_CENTER[0]},${KNU_CENTER[1]});
      node["amenity"="cafe"](around:${SEARCH_RADIUS},${KNU_CENTER[0]},${KNU_CENTER[1]});
      node["amenity"="fast_food"](around:${SEARCH_RADIUS},${KNU_CENTER[0]},${KNU_CENTER[1]});
      node["cuisine"](around:${SEARCH_RADIUS},${KNU_CENTER[0]},${KNU_CENTER[1]});
    );
    out body;
  `;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
        });

        const data = await response.json();

        // Clear old markers
        markers.forEach(m => mapInstance.removeLayer(m));
        markers = [];

        const restaurants = data.elements
            .filter(el => el.tags && (el.tags.name || el.tags['name:ko']))
            .map(el => ({
                id: el.id,
                name: el.tags['name:ko'] || el.tags.name,
                address: el.tags['addr:full'] || el.tags['addr:street'] || el.tags['addr:city'] || '주소 미제공',
                cuisine: el.tags.cuisine || '',
                lat: el.lat,
                lon: el.lon,
            }));

        // Deduplicate by name
        const seen = new Set();
        const unique = restaurants.filter(r => {
            if (seen.has(r.name)) return false;
            seen.add(r.name);
            return true;
        });

        if (statusEl) statusEl.textContent = `${unique.length}개 식당 발견`;

        // Add markers
        unique.forEach(r => {
            const marker = L.marker([r.lat, r.lon]).addTo(mapInstance);
            marker.bindPopup(`
        <div class="popup-name">${r.name}</div>
        <div class="popup-addr">${r.address}${r.cuisine ? ` · ${r.cuisine}` : ''}</div>
        <button class="btn btn-accent btn-sm" onclick="window.__selectRestaurant('${r.id}')">이 장소 선택</button>
      `);
            markers.push(marker);
        });

        // Build list
        if (listEl) {
            listEl.innerHTML = unique.length === 0
                ? '<div style="text-align:center;color:var(--text-muted);padding:20px">검색 결과가 없습니다. 다시 시도해주세요.</div>'
                : unique.map(r => `
          <div class="restaurant-item" data-restaurant-id="${r.id}" data-name="${r.name}" data-addr="${r.address}" data-lat="${r.lat}" data-lon="${r.lon}">
            <div>
              <div class="restaurant-name">🍽️ ${r.name}</div>
              <div class="restaurant-addr">${r.address}${r.cuisine ? ` · ${r.cuisine}` : ''}</div>
            </div>
            <button class="btn btn-accent btn-sm btn-select-restaurant">선택</button>
          </div>
        `).join('');

            // Click handlers for list
            listEl.querySelectorAll('.btn-select-restaurant').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const item = btn.closest('.restaurant-item');
                    const restaurant = {
                        id: item.dataset.restaurantId,
                        name: item.dataset.name,
                        address: item.dataset.addr,
                        lat: parseFloat(item.dataset.lat),
                        lon: parseFloat(item.dataset.lon),
                    };

                    // Highlight selected
                    listEl.querySelectorAll('.restaurant-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');

                    if (onRestaurantSelect) onRestaurantSelect(restaurant);
                });
            });
        }

        // Global function for popup button
        window.__selectRestaurant = (id) => {
            const r = unique.find(r => String(r.id) === String(id));
            if (r && onRestaurantSelect) {
                onRestaurantSelect(r);
                // Highlight in list
                if (listEl) {
                    listEl.querySelectorAll('.restaurant-item').forEach(i => i.classList.remove('selected'));
                    const item = listEl.querySelector(`[data-restaurant-id="${id}"]`);
                    if (item) item.classList.add('selected');
                }
            }
        };
    } catch (err) {
        console.error('Overpass API error:', err);
        if (statusEl) statusEl.textContent = '검색 실패. 다시 시도해주세요.';

        // Fallback: show hardcoded restaurants near KNU
        showFallbackRestaurants(listEl, onRestaurantSelect);
    }
}

function showFallbackRestaurants(listEl, onRestaurantSelect) {
    const fallback = [
        { id: 'f1', name: '대학로 김밥천국', address: '대구 북구 대학로 80길', lat: 35.8892, lon: 128.6115 },
        { id: 'f2', name: '경대 돈까스', address: '대구 북구 대학로 78길', lat: 35.8880, lon: 128.6108 },
        { id: 'f3', name: '한우마을', address: '대구 북구 산격동 대학로', lat: 35.8895, lon: 128.6098 },
        { id: 'f4', name: '경대 순대국밥', address: '대구 북구 대학로 82길', lat: 35.8878, lon: 128.6120 },
        { id: 'f5', name: '대학로 파스타', address: '대구 북구 대학로 76길', lat: 35.8884, lon: 128.6095 },
    ];

    // Add markers
    fallback.forEach(r => {
        const marker = L.marker([r.lat, r.lon]).addTo(mapInstance);
        marker.bindPopup(`
      <div class="popup-name">${r.name}</div>
      <div class="popup-addr">${r.address}</div>
      <button class="btn btn-accent btn-sm" onclick="window.__selectRestaurant('${r.id}')">이 장소 선택</button>
    `);
        markers.push(marker);
    });

    if (listEl) {
        listEl.innerHTML = `
      <div style="font-size:0.82rem;color:var(--status-pending);margin-bottom:10px;padding:8px 12px;background:rgba(232,168,56,0.1);border-radius:6px">
        ⚠️ API 연결 실패. 기본 식당 목록을 표시합니다.
      </div>
    ` + fallback.map(r => `
      <div class="restaurant-item" data-restaurant-id="${r.id}" data-name="${r.name}" data-addr="${r.address}" data-lat="${r.lat}" data-lon="${r.lon}">
        <div>
          <div class="restaurant-name">🍽️ ${r.name}</div>
          <div class="restaurant-addr">${r.address}</div>
        </div>
        <button class="btn btn-accent btn-sm btn-select-restaurant">선택</button>
      </div>
    `).join('');

        listEl.querySelectorAll('.btn-select-restaurant').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = btn.closest('.restaurant-item');
                const restaurant = {
                    id: item.dataset.restaurantId,
                    name: item.dataset.name,
                    address: item.dataset.addr,
                    lat: parseFloat(item.dataset.lat),
                    lon: parseFloat(item.dataset.lon),
                };
                listEl.querySelectorAll('.restaurant-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                if (onRestaurantSelect) onRestaurantSelect(restaurant);
            });
        });

        window.__selectRestaurant = (id) => {
            const r = fallback.find(r => r.id === id);
            if (r && onRestaurantSelect) {
                onRestaurantSelect(r);
                listEl.querySelectorAll('.restaurant-item').forEach(i => i.classList.remove('selected'));
                const item = listEl.querySelector(`[data-restaurant-id="${id}"]`);
                if (item) item.classList.add('selected');
            }
        };
    }
}

export function destroyMap() {
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
    markers = [];
}
