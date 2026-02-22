// ===== Landing Page =====
import Store from '../store.js';

export function renderLanding(app, navigateTo) {
  app.innerHTML = `
    <div class="landing page-enter">
      <div class="landing-content">
        <div class="landing-hero">
          <div class="landing-badge">KNU Meal Meetup</div>
          <h1 class="landing-title">경북대 선후배<br/><span class="text-gradient">밥약 매칭 서비스</span></h1>
          <p class="landing-subtitle">
            따뜻한 밥 한 끼와 함께 경험을 나누고 새로운 인연을 시작해 보세요.
          </p>
        </div>

        <div class="role-selection">
          <div class="role-card role-card--senior" id="card-senior">
            <div class="role-glass"></div>
            <div class="role-content">
              <div class="role-icon">🎓</div>
              <h2 class="role-name">선배님</h2>
              <p class="role-desc">밥약을 올리고 후배들에게<br/>다양한 경험을 나눠주세요</p>
              <button class="btn btn-primary btn-lg w-full">글 쓰러 가기</button>
            </div>
          </div>

          <div class="role-card role-card--junior" id="card-junior">
            <div class="role-glass"></div>
            <div class="role-content">
              <div class="role-icon">🙋</div>
              <h2 class="role-name">후배님</h2>
              <p class="role-desc">관심 있는 선배님들에게<br/>익명으로 밥약을 신청해 보세요</p>
              <button class="btn btn-accent btn-lg w-full">선배 찾기</button>
            </div>
          </div>
        </div>

        <div class="landing-footer">
          <p>© 2026 KNU Meal Meetup. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('card-senior').addEventListener('click', () => {
    navigateTo('senior');
  });

  document.getElementById('card-junior').addEventListener('click', () => {
    navigateTo('junior');
  });
}
