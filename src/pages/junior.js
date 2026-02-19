// ===== Junior Browse Page =====
import Store from '../store.js';
import { showToast } from '../utils.js';

export function renderJunior(app, navigateTo) {
    const posts = Store.getAllPosts().filter(p => p.status === 'open');
    const allRequests = Store.getAllRequests();

    // Get junior's sent requests
    const user = Store.getCurrentUser();
    const myRequests = allRequests; // In local demo, show all requests

    app.innerHTML = `
    <div class="page-enter">
      ${renderNavbar(navigateTo)}
      <div class="dashboard">
        <div class="dashboard-header">
          <div class="dashboard-title">선배 밥약 둘러보기 🔍</div>
          <div class="dashboard-subtitle">관심 있는 선배에게 익명으로 밥약을 신청해보세요!</div>
        </div>

        <!-- Search -->
        <div style="margin-bottom:24px">
          <input type="text" class="form-input" id="search-input" placeholder="🔍 선배 이름, 학과, 태그로 검색..." style="max-width:400px" />
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab-btn active" data-tab="browse">🍽️ 밥약 글</button>
          <button class="tab-btn" data-tab="my-requests">📋 내 신청 현황</button>
        </div>

        <!-- Browse Tab -->
        <div id="tab-browse" class="tab-content">
          ${posts.length === 0
            ? `<div class="empty-state"><div class="emoji">🍽️</div><p>아직 올라온 밥약 글이 없어요.</p></div>`
            : `<div class="post-grid" id="post-grid">${posts.map(p => renderSeniorPostCard(p)).join('')}</div>`
        }
        </div>

        <!-- My Requests Tab -->
        <div id="tab-my-requests" class="tab-content hidden">
          <div class="section-header">
            <div class="section-title">내 신청 현황</div>
          </div>
          ${renderMyRequests(myRequests, navigateTo)}
        </div>
      </div>
    </div>
  `;

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
        });
    });

    // Search
    const searchInput = document.getElementById('search-input');
    searchInput?.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        const cards = document.querySelectorAll('#post-grid .post-card');
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? '' : 'none';
        });
    });

    // Post card click → open request modal
    document.querySelectorAll('.post-card[data-post-id]').forEach(card => {
        card.addEventListener('click', () => {
            const postId = card.dataset.postId;
            const post = Store.getPost(postId);
            if (post) showRequestModal(post, app, navigateTo);
        });
    });

    // Match card link
    document.querySelectorAll('.match-card-link').forEach(card => {
        card.addEventListener('click', () => {
            navigateTo(`match/${card.dataset.matchId}`);
        });
    });

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        Store.clearCurrentUser();
        navigateTo('');
    });
    document.getElementById('nav-home')?.addEventListener('click', () => {
        Store.clearCurrentUser();
        navigateTo('');
    });
}

function renderNavbar(navigateTo) {
    return `
    <nav class="navbar">
      <div class="navbar-brand" id="nav-home">
        <span class="emoji">🍚</span>
        <span>경북대 밥약</span>
      </div>
      <div class="navbar-actions">
        <span style="font-size:0.85rem;color:var(--text-secondary)">🙋 익명 후배</span>
        <button class="btn btn-ghost btn-sm" id="btn-logout">로그아웃</button>
      </div>
    </nav>
  `;
}

function renderSeniorPostCard(post) {
    const senior = Store.getSenior(post.seniorId);
    if (!senior) return '';

    const date = new Date(post.createdAt).toLocaleDateString('ko-KR');

    return `
    <div class="post-card" data-post-id="${post.id}">
      <div class="post-card-header">
        <div class="post-avatar">${senior.emoji || '🎓'}</div>
        <div>
          <div class="post-author-name">${senior.name}</div>
          <div class="post-author-dept">${senior.department}</div>
        </div>
      </div>
      <div class="post-title">${post.title}</div>
      <div class="post-desc">${post.description}</div>
      <div class="post-tags">
        ${(post.tags || []).map(t => `<span class="badge badge-tag">#${t}</span>`).join('')}
      </div>
      <div class="post-meta">
        <span>${date}</span>
        <span style="color:var(--primary-light);font-weight:600">밥약 신청하기 →</span>
      </div>
    </div>
  `;
}

function renderMyRequests(requests, navigateTo) {
    if (requests.length === 0) {
        return `<div class="empty-state"><div class="emoji">📋</div><p>아직 신청한 밥약이 없어요.</p></div>`;
    }

    return requests.map(req => {
        const post = Store.getPost(req.postId);
        const senior = post ? Store.getSenior(post.seniorId) : null;
        const statusMap = {
            pending: '<span class="badge badge-pending">⏳ 대기중</span>',
            accepted: '<span class="badge badge-accepted">✅ 수락됨</span>',
            rejected: '<span class="badge badge-rejected">❌ 거절됨</span>',
        };

        // Check if there's a match for accepted requests
        let matchLink = '';
        if (req.status === 'accepted') {
            const matches = Store.getMatchesByRequest(req.id);
            if (matches.length > 0) {
                matchLink = `<div class="match-card-link mt-2" data-match-id="${matches[0].id}" style="cursor:pointer;color:var(--accent);font-weight:600;font-size:0.88rem">🤝 시간·장소 조율하기 →</div>`;
            }
        }

        return `
      <div class="request-card">
        <div class="request-header">
          <div class="request-anon">
            <div class="post-avatar" style="width:36px;height:36px;font-size:0.9rem">${senior?.emoji || '🎓'}</div>
            <div>
              <div class="request-anon-name">${senior?.name || '선배'} · ${post?.title || ''}</div>
              <div style="font-size:0.78rem;color:var(--text-muted)">${senior?.department || ''}</div>
            </div>
          </div>
          ${statusMap[req.status] || ''}
        </div>
        <div class="request-connection">
          <strong style="color:var(--text);display:block;margin-bottom:4px">💬 내가 적은 접점</strong>
          ${req.connectionNote}
        </div>
        ${matchLink}
      </div>
    `;
    }).join('');
}

function showRequestModal(post, app, navigateTo) {
    const senior = Store.getSenior(post.seniorId);
    if (!senior) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">🙋 밥약 신청</div>
        <button class="modal-close" id="modal-close">&times;</button>
      </div>

      <div style="background:var(--bg-glass);border-radius:var(--radius-sm);padding:16px;margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <div class="post-avatar" style="width:42px;height:42px;font-size:1.1rem">${senior.emoji}</div>
          <div>
            <div style="font-weight:600">${senior.name}</div>
            <div style="font-size:0.82rem;color:var(--text-secondary)">${senior.department}</div>
          </div>
        </div>
        <div style="font-weight:600;margin-bottom:4px">${post.title}</div>
        <div style="font-size:0.85rem;color:var(--text-secondary)">${post.description}</div>
      </div>

      <div style="background:rgba(52,152,219,0.08);border:1px solid rgba(52,152,219,0.2);border-radius:var(--radius-sm);padding:12px;margin-bottom:16px;font-size:0.85rem;color:var(--junior-color)">
        🔒 후배님의 정보는 익명으로 처리됩니다. 선배와의 접점만 적어주세요.
      </div>

      <div class="form-group">
        <label class="form-label">선배와의 접점 & 밥약 신청 이유</label>
        <textarea class="form-textarea" id="connection-note" placeholder="예: 같은 동아리 'ABC'에서 활동했습니다. 전공 진로에 대해 여쭤보고 싶어요!"></textarea>
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" id="modal-cancel">취소</button>
        <button class="btn btn-accent" id="modal-submit">🍚 밥약 신청하기</button>
      </div>
    </div>
  `;
    document.body.appendChild(overlay);

    overlay.querySelector('#modal-close').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    overlay.querySelector('#modal-submit').addEventListener('click', () => {
        const connectionNote = overlay.querySelector('#connection-note').value.trim();

        if (!connectionNote) {
            showToast('접점을 적어주세요!', 'error');
            return;
        }

        Store.createRequest({
            postId: post.id,
            juniorAlias: '익명 후배',
            connectionNote,
        });

        overlay.remove();
        showToast('밥약 신청이 완료되었어요! 🎉');
        renderJunior(app, navigateTo);
    });
}
