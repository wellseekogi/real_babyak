// ===== Senior Dashboard =====
import Store from '../store.js';
import { showToast } from '../utils.js';

export function renderSenior(app, navigateTo) {
  const user = Store.getCurrentUser();
  if (!user || user.role !== 'senior') {
    navigateTo('');
    return;
  }

  const senior = Store.getSenior(user.id);
  if (!senior) {
    navigateTo('');
    return;
  }

  const posts = Store.getPostsBySenior(senior.id);

  // Gather all requests for this senior's posts
  const allRequests = [];
  posts.forEach(post => {
    const reqs = Store.getRequestsByPost(post.id);
    reqs.forEach(r => allRequests.push({ ...r, postTitle: post.title }));
  });

  const pendingRequests = allRequests.filter(r => r.status === 'pending');
  const matches = Store.getMatchesBySenior(senior.id);

  app.innerHTML = `
    <div class="page-enter">
      ${renderNavbar(senior, navigateTo)}
      <div class="dashboard">
        <div class="dashboard-header">
          <div class="dashboard-title">안녕하세요, ${senior.name} 선배님 👋</div>
          <div class="dashboard-subtitle">${senior.department}</div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab-btn active" data-tab="posts">📝 내 밥약 글</button>
          <button class="tab-btn" data-tab="requests">📬 받은 요청 ${pendingRequests.length > 0 ? `<span style="color:var(--accent)">(${pendingRequests.length})</span>` : ''}</button>
          <button class="tab-btn" data-tab="matches">🤝 매칭 현황</button>
        </div>

        <!-- Posts Tab -->
        <div id="tab-posts" class="tab-content">
          <div class="section-header">
            <div class="section-title">내 밥약 글</div>
            <button class="btn btn-primary" id="btn-new-post">+ 새 글 작성</button>
          </div>
          ${posts.length === 0
      ? `<div class="empty-state"><div class="emoji">📝</div><p>아직 작성한 글이 없어요.<br/>밥약 글을 올려 후배들과 만나보세요!</p></div>`
      : `<div class="post-grid">${posts.map(p => renderPostCard(p, senior, true)).join('')}</div>`
    }
        </div>

        <!-- Requests Tab -->
        <div id="tab-requests" class="tab-content hidden">
          <div class="section-header">
            <div class="section-title">받은 요청</div>
          </div>
          ${allRequests.length === 0
      ? `<div class="empty-state"><div class="emoji">📬</div><p>아직 받은 요청이 없어요.</p></div>`
      : allRequests.map(r => renderRequestCard(r)).join('')
    }
        </div>

        <!-- Matches Tab -->
        <div id="tab-matches" class="tab-content hidden">
          <div class="section-header">
            <div class="section-title">매칭 현황</div>
          </div>
          ${matches.length === 0
      ? `<div class="empty-state"><div class="emoji">🤝</div><p>아직 매칭된 밥약이 없어요.</p></div>`
      : matches.map(m => renderMatchCard(m, senior)).join('')
    }
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

  // New post button
  document.getElementById('btn-new-post')?.addEventListener('click', () => {
    showNewPostModal(senior, app, navigateTo);
  });

  // Delete post
  document.querySelectorAll('.btn-delete-post').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      Store.deletePost(btn.dataset.postId);
      showToast('글이 삭제되었습니다.');
      renderSenior(app, navigateTo);
    });
  });

  // Accept / Reject request
  document.querySelectorAll('.btn-accept-request').forEach(btn => {
    btn.addEventListener('click', () => {
      const reqId = btn.dataset.requestId;
      const req = Store.getRequest(reqId);
      Store.updateRequest(reqId, { status: 'accepted' });
      const match = Store.createMatch({ postId: req.postId, requestId: reqId });
      showToast('요청을 수락했습니다! 🎉');
      navigateTo(`match/${match.id}`);
    });
  });

  document.querySelectorAll('.btn-reject-request').forEach(btn => {
    btn.addEventListener('click', () => {
      Store.updateRequest(btn.dataset.requestId, { status: 'rejected' });
      showToast('요청을 거절했습니다.');
      renderSenior(app, navigateTo);
    });
  });

  // Match card click
  document.querySelectorAll('.match-card-link').forEach(card => {
    card.addEventListener('click', () => {
      navigateTo(`match/${card.dataset.matchId}`);
    });
  });

  // Logout & Home
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    Store.clearCurrentUser();
    navigateTo('');
  });
  document.getElementById('nav-home')?.addEventListener('click', () => {
    Store.clearCurrentUser();
    navigateTo('');
  });
}

function renderNavbar(senior, navigateTo) {
  return `
    <nav class="navbar">
      <div class="navbar-brand" id="nav-home">
        <span class="emoji">🍚</span>
        <span>경북대 밥약</span>
      </div>
      <div class="navbar-actions">
        <span style="font-size:0.85rem;color:var(--text-secondary)">${senior.emoji} ${senior.name}</span>
        <button class="btn btn-ghost btn-sm" id="btn-logout">로그아웃</button>
      </div>
    </nav>
  `;
}

function renderPostCard(post, senior, showDelete = false) {
  const requests = Store.getRequestsByPost(post.id);
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const date = new Date(post.createdAt).toLocaleDateString('ko-KR');
  return `
    <div class="post-card">
      <div class="post-card-header">
        <div class="post-avatar">${senior.emoji}</div>
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
        <span class="post-requests-count">${pendingCount > 0 ? `📬 요청 ${pendingCount}건` : '요청 없음'}</span>
      </div>
      ${showDelete ? `<button class="btn btn-danger btn-sm mt-2 btn-delete-post" data-post-id="${post.id}">삭제</button>` : ''}
    </div>
  `;
}

function renderRequestCard(req) {
  const statusMap = {
    pending: '<span class="badge badge-pending">⏳ 대기중</span>',
    accepted: '<span class="badge badge-accepted">✅ 수락됨</span>',
    rejected: '<span class="badge badge-rejected">❌ 거절됨</span>',
  };

  return `
    <div class="request-card">
      <div class="request-header">
        <div class="request-anon">
          <div class="request-anon-avatar">🙋</div>
          <div>
            <div class="request-anon-name">익명 후배</div>
            <div style="font-size:0.78rem;color:var(--text-muted)">📝 "${req.postTitle}" 글에 신청</div>
          </div>
        </div>
        ${statusMap[req.status] || ''}
      </div>
      <div class="request-connection">
        <strong style="color:var(--text);display:block;margin-bottom:4px">💬 접점 및 신청 이유</strong>
        ${req.connectionNote}
      </div>
      ${req.status === 'pending' ? `
        <div class="request-actions">
          <button class="btn btn-primary btn-sm btn-accept-request" data-request-id="${req.id}">✅ 수락</button>
          <button class="btn btn-danger btn-sm btn-reject-request" data-request-id="${req.id}">거절</button>
        </div>
      ` : ''}
    </div>
  `;
}

function renderMatchCard(match, senior) {
  const post = Store.getPost(match.postId);
  const statusLabel = match.status === 'confirmed'
    ? '<span class="badge badge-accepted">확정됨</span>'
    : '<span class="badge badge-pending">조율중</span>';

  return `
    <div class="request-card match-card-link" data-match-id="${match.id}" style="cursor:pointer">
      <div class="request-header">
        <div class="request-anon">
          <div class="request-anon-avatar">🤝</div>
          <div>
            <div class="request-anon-name">${post ? post.title : '밥약'}</div>
            <div style="font-size:0.78rem;color:var(--text-muted)">익명 후배와의 밥약</div>
          </div>
        </div>
        ${statusLabel}
      </div>
      <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px">
        ${match.selectedRestaurant ? `📍 ${match.selectedRestaurant.name}` : '📍 장소 미정'}
      </div>
    </div>
  `;
}

function showNewPostModal(senior, app, navigateTo) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">📝 새 밥약 글 작성</div>
        <button class="modal-close" id="modal-close">&times;</button>
      </div>
      <div class="form-group">
        <label class="form-label">제목</label>
        <input type="text" class="form-input" id="post-title" placeholder="예: 개발 진로 이야기 나눠요" />
      </div>
      <div class="form-group">
        <label class="form-label">설명</label>
        <textarea class="form-textarea" id="post-desc" placeholder="어떤 이야기를 나누고 싶은지, 어떤 후배에게 열려있는지 적어주세요"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">태그 (쉼표로 구분)</label>
        <input type="text" class="form-input" id="post-tags" placeholder="예: 개발, 취업, 진로상담" />
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" id="modal-cancel">취소</button>
        <button class="btn btn-primary" id="modal-submit">올리기</button>
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
    const title = overlay.querySelector('#post-title').value.trim();
    const description = overlay.querySelector('#post-desc').value.trim();
    const tagsRaw = overlay.querySelector('#post-tags').value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    if (!title) {
      showToast('제목을 입력해주세요.', 'error');
      return;
    }

    Store.createPost({ seniorId: senior.id, title, description, tags });
    overlay.remove();
    showToast('밥약 글이 올라갔어요! 🎉');
    renderSenior(app, navigateTo);
  });
}
