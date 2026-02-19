// ===== Landing Page =====
import Store from '../store.js';

export function renderLanding(app, navigateTo) {
    app.innerHTML = `
    <div class="landing page-enter">
      <div class="landing-hero">
        <div class="landing-emoji">🍚</div>
        <h1 class="landing-title">경북대 밥약</h1>
        <p class="landing-subtitle">선후배가 밥 한 끼로 연결되는 곳.<br/>경험을 나누고, 인연을 만들어요.</p>
      </div>

      <div class="role-cards" id="role-cards">
        <div class="role-card role-card--senior" data-role="senior">
          <div class="role-emoji">🎓</div>
          <div class="role-name">선배로 시작</div>
          <div class="role-desc">프로필을 공개하고<br/>후배에게 밥약 글을 올려요</div>
        </div>
        <div class="role-card role-card--junior" data-role="junior">
          <div class="role-emoji">🙋</div>
          <div class="role-name">후배로 시작</div>
          <div class="role-desc">익명으로 선배에게<br/>밥약을 신청해요</div>
        </div>
      </div>

      <div class="profile-form-wrap hidden" id="profile-form-wrap">
        <h2>✨ 선배 프로필 등록</h2>
        <div class="card">
          <div class="form-group">
            <label class="form-label">이름</label>
            <input type="text" class="form-input" id="senior-name" placeholder="예: 홍길동" />
          </div>
          <div class="form-group">
            <label class="form-label">학과 / 학번</label>
            <input type="text" class="form-input" id="senior-dept" placeholder="예: 컴퓨터학부 20학번" />
          </div>
          <div class="form-group">
            <label class="form-label">자기소개</label>
            <textarea class="form-textarea" id="senior-intro" placeholder="후배들에게 한마디! 어떤 이야기를 나누고 싶은지 적어주세요."></textarea>
          </div>
          <button class="btn btn-primary btn-lg w-full mt-4" id="btn-create-profile">프로필 만들기</button>
        </div>
      </div>
    </div>
  `;

    // Role card click
    document.querySelectorAll('.role-card').forEach(card => {
        card.addEventListener('click', () => {
            const role = card.dataset.role;
            if (role === 'junior') {
                Store.setCurrentUser('junior', 'anonymous');
                navigateTo('junior');
            } else {
                // Show profile form
                document.getElementById('role-cards').classList.add('hidden');
                document.getElementById('profile-form-wrap').classList.remove('hidden');
            }
        });
    });

    // Create profile
    const btnCreate = document.getElementById('btn-create-profile');
    if (btnCreate) {
        btnCreate.addEventListener('click', () => {
            const name = document.getElementById('senior-name').value.trim();
            const department = document.getElementById('senior-dept').value.trim();
            const intro = document.getElementById('senior-intro').value.trim();

            if (!name || !department) {
                showToast('이름과 학과를 입력해주세요.', 'error');
                return;
            }

            const emojis = ['🎓', '💼', '🔬', '📖', '🎨', '🏆', '🌟', '💡'];
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];

            const senior = Store.createSenior({ name, department, intro, emoji });
            Store.setCurrentUser('senior', senior.id);
            navigateTo('senior');
        });
    }
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
