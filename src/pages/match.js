// ===== Match Detail Page (Timetable + Map) =====
import Store from '../store.js';
import { showToast } from '../utils.js';
import { renderTimetable, getOverlappingSlots } from '../components/timetable.js';
import { renderMap, destroyMap } from '../components/map.js';

export async function renderMatch(app, navigateTo, matchId) {
  const match = await Store.getMatch(matchId);
  if (!match) {
    showToast('매칭 정보를 찾을 수 없습니다.', 'error');
    navigateTo('');
    return;
  }

  const user = Store.getCurrentUser();
  const role = user?.role || 'senior';
  const post = await Store.getPost(match.postId);
  const senior = post ? await Store.getSenior(post.seniorId) : { emoji: '🎓', name: '선배', department: '정보 없음' };

  const request = await Store.getRequest(match.requestId);

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
        ${match.status === 'confirmed' ? renderConfirmedSummary(match) : ''}

        <!-- Overlapping times -->
        ${match.status !== 'confirmed' ? `
          <div class="card" style="margin-bottom:24px;border-color:rgba(231,76,60,0.3)">
            <div style="font-weight:700;margin-bottom:12px">✨ 겹치는 시간 (하나를 선택하세요)</div>
            ${overlaps.length === 0
        ? '<div style="font-size:0.85rem;color:var(--text-muted)">아직 겹치는 시간이 없어요. 시간표를 클릭해 보세요!</div>'
        : `<div class="time-selector-list" style="display:grid;gap:8px">
                  ${overlaps.map(o => `
                    <label class="time-selector-item ${match.confirmed_time?.label === o.label ? 'selected' : ''}" style="display:flex;align-items:center;gap:10px;padding:12px;border:1px solid var(--border);border-radius:8px;cursor:pointer">
                      <input type="radio" name="confirmed-time" value="${o.label}" ${match.confirmed_time?.label === o.label ? 'checked' : ''}>
                      <span style="font-size:0.9rem">${o.label}</span>
                    </label>
                  `).join('')}
                </div>`
      }
          </div>
        ` : ''}

        <!-- Suggested Locations -->
        <div class="card" style="margin-bottom:24px">
          <div style="font-weight:700;margin-bottom:12px">📍 최종 장소 결정</div>
          <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px">선배님과 후배님의 제안 중 하나를 전용 버튼으로 선택해주세요.</p>
          <div class="location-selection-group">
            <label class="location-select-item ${match.confirmed_location?.id === match.senior_location?.id && match.senior_location ? 'selected' : ''}">
              <div style="display:flex;align-items:center;gap:12px;width:100%">
                <input type="radio" name="confirmed-location" value="senior" ${match.confirmed_location?.id === match.senior_location?.id && match.senior_location ? 'checked' : ''} ${!match.senior_location || match.status === 'confirmed' ? 'disabled' : ''}>
                <div style="flex:1">
                  <div style="font-size:0.75rem;color:#2ecc71;font-weight:700">🟢 선배님 제안</div>
                  <div style="font-size:0.9rem;font-weight:600">${match.senior_location?.address || '제안 대기 중'}</div>
                </div>
              </div>
            </label>
            <label class="location-select-item ${match.confirmed_location?.id === match.junior_location?.id && match.junior_location ? 'selected' : ''}">
              <div style="display:flex;align-items:center;gap:12px;width:100%">
                <input type="radio" name="confirmed-location" value="junior" ${match.confirmed_location?.id === match.junior_location?.id && match.junior_location ? 'checked' : ''} ${!match.junior_location || match.status === 'confirmed' ? 'disabled' : ''}>
                <div style="flex:1">
                  <div style="font-size:0.75rem;color:#3498db;font-weight:700">🔵 후배님 제안</div>
                  <div style="font-size:0.9rem;font-weight:600">${match.junior_location?.address || '제안 대기 중'}</div>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Confirm button (Senior Only) -->
        ${match.status !== 'confirmed' ? `
          <div style="text-align:center;margin-bottom:32px">
            ${role === 'senior'
        ? `<button class="btn btn-accent btn-lg" id="btn-confirm-match" ${(!match.confirmed_time || !match.confirmed_location) ? 'disabled' : ''}>🎉 이 시간·장소로 확정하기</button>
                 <p style="font-size:0.82rem;color:var(--text-muted);margin-top:8px">시간과 장소를 모두 선택해야 확정할 수 있습니다.</p>`
        : `<div class="badge badge-pending" style="padding:12px 20px">⏳ 선배님이 확정하기를 기다리고 있습니다.</div>`
      }
          </div>
        ` : ''}

        <!-- Timetable Section -->
        <div class="section-header">
          <div class="section-title">📅 시간 표시</div>
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

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    destroyMap();
    await Store.clearCurrentUser();
    navigateTo('');
  });

  document.getElementById('nav-home')?.addEventListener('click', async () => {
    destroyMap();
    navigateTo('');
  });

  // Time selection (Radio change)
  document.querySelectorAll('input[name="confirmed-time"]').forEach(input => {
    input.addEventListener('change', async (e) => {
      const selectedLabel = e.target.value;
      const selectedSlot = overlaps.find(o => o.label === selectedLabel);
      if (selectedSlot) {
        try {
          await Store.updateMatch(matchId, { confirmed_time: selectedSlot });
          destroyMap();
          renderMatch(app, navigateTo, matchId);
        } catch (err) {
          showToast('시간 선택 실패: ' + err.message, 'error');
        }
      }
    });
  });

  // Location selection (Radio change)
  document.querySelectorAll('input[name="confirmed-location"]').forEach(input => {
    input.addEventListener('change', async (e) => {
      const type = e.target.value;
      const loc = type === 'senior' ? match.senior_location : match.junior_location;
      if (loc) {
        try {
          await Store.updateMatch(matchId, { confirmed_location: loc });
          destroyMap();
          renderMatch(app, navigateTo, matchId);
        } catch (err) {
          showToast('장소 선택 실패: ' + err.message, 'error');
        }
      }
    });
  });

  document.getElementById('btn-confirm-match')?.addEventListener('click', async () => {
    if (role !== 'senior') return;
    try {
      if (confirm('이 시간과 장소로 밥약을 확정하시겠어요?')) {
        await Store.confirmMatch(matchId);
        await Store.updatePost(match.postId, { status: 'closed' });
        showToast('밥약이 확정되었습니다! 🎉');
        destroyMap();
        renderMatch(app, navigateTo, matchId);
      }
    } catch (e) {
      showToast('확정 실패: ' + e.message, 'error');
    }
  });

  // Render timetable
  const timetableRoot = document.getElementById('timetable-root');
  async function handleCellToggle(row, col) {
    const key = role === 'senior' ? 'senior_timetable' : 'junior_timetable';
    const currentTable = match[key] || [];
    const exists = currentTable.find(cell => cell.row === row && cell.col === col);
    let newTable = exists
      ? currentTable.filter(cell => !(cell.row === row && cell.col === col))
      : [...currentTable, { row, col }];

    try {
      await Store.updateMatch(matchId, { [key]: newTable });
      destroyMap();
      renderMatch(app, navigateTo, matchId);
    } catch (e) {
      showToast('시간 업데이트 실패: ' + e.message, 'error');
    }
  }
  renderTimetable(timetableRoot, match, role, handleCellToggle);

  // Render map
  const mapRoot = document.getElementById('map-root');
  renderMap(mapRoot, async (location) => {
    const locKey = role === 'senior' ? 'senior_location' : 'junior_location';
    try {
      await Store.updateMatch(matchId, { [locKey]: location });
      showToast(`📍 내 제안 장소가 업데이트되었습니다.`);
      destroyMap();
      renderMatch(app, navigateTo, matchId);
    } catch (e) {
      showToast('장소 업데이트 실패: ' + e.message, 'error');
    }
  }, match, role);
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

function renderConfirmedSummary(match) {
  return `
    <div class="card" style="margin-bottom:24px;border-color:rgba(46,204,113,0.4);background:rgba(46,204,113,0.05)">
      <div style="text-align:center;padding:10px 0">
        <div style="font-size:2.5rem;margin-bottom:8px">🎉</div>
        <div style="font-size:1.2rem;font-weight:800;color:#2ecc71;margin-bottom:12px">밥약이 확정되었습니다!</div>
        <div style="background:white;padding:16px;border-radius:12px;border:1px solid #2ecc71;display:inline-block;width:100%;max-width:300px">
          <div style="font-size:1rem;font-weight:700;margin-bottom:8px;color:var(--text)">⏰ ${match.confirmed_time?.label || '시간 정보 없음'}</div>
          <div style="font-size:0.85rem;color:var(--text-secondary);text-align:left;line-height:1.6">
            📍 <strong>선배 제안:</strong> ${match.senior_location?.address || '없음'}<br/>
            📍 <strong>후배 제안:</strong> ${match.junior_location?.address || '없음'}
          </div>
        </div>
        <p style="font-size:0.82rem;color:var(--text-muted);margin-top:12px">에브리타임 등에서 만나요! 👋</p>
      </div>
    </div>
  `;
}
