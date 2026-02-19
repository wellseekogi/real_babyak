// ===== Match Detail Page (Timetable + Map) =====
import Store from '../store.js';
import { showToast } from '../utils.js';
import { renderTimetable, getOverlappingSlots } from '../components/timetable.js';
import { renderMap, destroyMap } from '../components/map.js';

export function renderMatch(app, navigateTo, matchId) {
  const match = Store.getMatch(matchId);
  if (!match) {
    showToast('매칭 정보를 찾을 수 없습니다.', 'error');
    navigateTo('');
    return;
  }

  const user = Store.getCurrentUser();
  const role = user?.role || 'senior';
  const post = Store.getPost(match.postId);
  const senior = post ? Store.getSenior(post.seniorId) : null;
  const request = Store.getRequest(match.requestId);

  const overlaps = getOverlappingSlots(match);

  app.innerHTML = `
    <div class="page-enter">
      ${renderMatchNavbar(role, senior, navigateTo)}
      <div class="match-detail">
        <div class="match-header">
          <div>
            <h1 style="font-size:1.6rem;font-weight:800;margin-bottom:6px">🤝 밥약 조율</h1>
            <p style="color:var(--text-secondary);font-size:0.9rem">${post?.title || '밥약'}</p>
          </div>
          <div class="match-status-bar">
            ${match.status === 'confirmed'
      ? '<span class="badge badge-accepted" style="font-size:0.9rem;padding:8px 16px">✅ 확정됨!</span>'
      : '<span class="badge badge-pending" style="font-size:0.9rem;padding:8px 16px">⏳ 조율중</span>'
    }
          </div>
        </div>

        <!-- Participants -->
        <div class="card" style="margin-bottom:24px">
          <div class="match-participants">
            <div style="display:flex;align-items:center;gap:10px">
              <div class="post-avatar" style="width:42px;height:42px;font-size:1.1rem">${senior?.emoji || '🎓'}</div>
              <div>
                <div style="font-weight:600">${senior?.name || '선배'}</div>
                <div style="font-size:0.82rem;color:var(--text-secondary)">${senior?.department || ''}</div>
              </div>
            </div>
            <div class="match-vs">× 밥약 ×</div>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="request-anon-avatar">🙋</div>
              <div>
                <div style="font-weight:600">익명 후배</div>
                <div style="font-size:0.82rem;color:var(--text-secondary)">접점: ${request?.connectionNote?.slice(0, 30) || ''}...</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Summary -->
        ${match.status === 'confirmed' ? renderConfirmedSummary(match, overlaps) : ''}

        <!-- Overlapping times -->
        ${overlaps.length > 0 ? `
          <div class="card" style="margin-bottom:24px;border-color:rgba(231,76,60,0.3)">
            <div style="font-weight:700;margin-bottom:8px">🔥 겹치는 시간 (${overlaps.length}개)</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${overlaps.map(o => `<span class="badge" style="background:rgba(231,76,60,0.15);color:var(--overlap-color)">${o.label}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Selected Restaurant -->
        ${match.selectedRestaurant ? `
          <div class="card" style="margin-bottom:24px;border-color:rgba(212,168,67,0.3)">
            <div style="font-weight:700;margin-bottom:6px">📍 선택된 장소</div>
            <div style="font-size:1.05rem;font-weight:600">${match.selectedRestaurant.name}</div>
            <div style="font-size:0.85rem;color:var(--text-secondary)">${match.selectedRestaurant.address}</div>
          </div>
        ` : ''}

        <!-- Confirm button -->
        ${match.status !== 'confirmed' && overlaps.length > 0 && match.selectedRestaurant ? `
          <div style="text-align:center;margin-bottom:32px">
            <button class="btn btn-accent btn-lg" id="btn-confirm-match">🎉 밥약 확정하기</button>
          </div>
        ` : ''}

        <!-- Timetable Section -->
        <div class="section-header">
          <div class="section-title">📅 시간 조율</div>
          <div style="font-size:0.82rem;color:var(--text-secondary)">
            ${role === 'senior' ? '🟢 선배 모드' : '🔵 후배 모드'}
          </div>
        </div>
        <div id="timetable-root"></div>

        <div class="section-divider"></div>

        <!-- Map Section -->
        <div id="map-root"></div>

        <!-- Back button -->
        <div style="text-align:center;margin-top:32px">
          <button class="btn btn-outline" id="btn-back">← 돌아가기</button>
        </div>
      </div>
    </div>
  `;

  // Bind events
  document.getElementById('btn-back')?.addEventListener('click', () => {
    destroyMap();
    navigateTo(role);
  });

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    destroyMap();
    Store.clearCurrentUser();
    navigateTo('');
  });

  document.getElementById('nav-home')?.addEventListener('click', () => {
    destroyMap();
    Store.clearCurrentUser();
    navigateTo('');
  });

  document.getElementById('btn-confirm-match')?.addEventListener('click', () => {
    Store.confirmMatch(matchId);
    showToast('밥약이 확정되었습니다! 🎉🍚');
    renderMatch(app, navigateTo, matchId);
  });

  // Render timetable
  const timetableRoot = document.getElementById('timetable-root');
  function handleCellToggle(row, col) {
    Store.toggleTimetableCell(matchId, role, row, col);
    // Re-render the full page to update overlap display + timetable
    destroyMap();
    renderMatch(app, navigateTo, matchId);
  }
  renderTimetable(timetableRoot, match, role, handleCellToggle);

  // Render map
  const mapRoot = document.getElementById('map-root');
  renderMap(mapRoot, (restaurant) => {
    Store.selectRestaurant(matchId, restaurant);
    showToast(`📍 ${restaurant.name} 선택됨!`);
    // Re-render to show selected restaurant card
    destroyMap();
    renderMatch(app, navigateTo, matchId);
  });
}

function renderMatchNavbar(role, senior, navigateTo) {
  return `
    <nav class="navbar">
      <div class="navbar-brand" id="nav-home">
        <span class="emoji">🍚</span>
        <span>경북대 밥약</span>
      </div>
      <div class="navbar-actions">
        <span style="font-size:0.85rem;color:var(--text-secondary)">
          ${role === 'senior' ? `${senior?.emoji || '🎓'} ${senior?.name || '선배'}` : '🙋 익명 후배'}
        </span>
        <button class="btn btn-ghost btn-sm" id="btn-logout">로그아웃</button>
      </div>
    </nav>
  `;
}

function renderConfirmedSummary(match, overlaps) {
  return `
    <div class="card" style="margin-bottom:24px;border-color:rgba(46,204,113,0.4);background:rgba(46,204,113,0.05)">
      <div style="text-align:center">
        <div style="font-size:2.5rem;margin-bottom:8px">🎉</div>
        <div style="font-size:1.2rem;font-weight:800;color:var(--status-accepted);margin-bottom:8px">밥약이 확정되었습니다!</div>
        ${match.selectedRestaurant ? `<div style="font-size:0.95rem">📍 <strong>${match.selectedRestaurant.name}</strong></div>` : ''}
        ${overlaps.length > 0 ? `<div style="font-size:0.9rem;color:var(--text-secondary);margin-top:4px">⏰ ${overlaps.map(o => o.label).join(', ')}</div>` : ''}
      </div>
    </div>
  `;
}
