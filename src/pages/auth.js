// ===== Auth Views (Login/Signup) =====
import Store from '../store.js';

export function renderLogin(app, navigateTo, initialRole = 'senior') {
  app.innerHTML = `
    <div class="page-enter" style="max-width:400px;margin:80px auto;padding:20px;">
      <div style="text-align:center;margin-bottom:30px">
        <div style="font-size:3rem;margin-bottom:10px">🍚</div>
        <h1 style="font-size:1.5rem;font-weight:800">밥약 로그인</h1>
        <p style="color:var(--text-secondary)">선배님 또는 후배님 계정으로 로그인하세요.</p>
      </div>

      <div class="card">
        <div class="form-group">
          <label class="form-label">아이디</label>
          <input type="text" class="form-input" id="login-id" placeholder="knu_id" />
        </div>
        <div class="form-group">
          <label class="form-label">비밀번호</label>
          <input type="password" class="form-input" id="login-pw" placeholder="password" />
        </div>
        <button class="btn btn-primary btn-lg" id="btn-login-submit" style="width:100%">로그인</button>
        <div style="margin-top:24px;text-align:center;font-size:0.9rem">
           <span style="color:var(--text-secondary)">아직 계정이 없으신가요?</span><br/>
           <div style="margin-top:10px;display:flex;gap:10px;justify-content:center">
             <a href="#" class="btn btn-outline btn-sm" id="btn-signup-senior">선배 가입</a>
             <a href="#" class="btn btn-outline btn-sm" id="btn-signup-junior">후배 가입 (익명)</a>
           </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-login-submit').addEventListener('click', async () => {
    console.log('[Auth] Login button clicked');
    const username = document.getElementById('login-id').value;
    const password = document.getElementById('login-pw').value;
    console.log('[Auth] Attempting login for:', username);

    try {
      const user = await Store.login(username, password);
      console.log('[Auth] Login success:', user);
      navigateTo(user.role);
    } catch (e) {
      console.error('[Auth] Login error:', e);
      alert('로그인 실패: ' + e.message);
    }
  });

  document.getElementById('btn-signup-senior').addEventListener('click', (e) => {
    e.preventDefault();
    renderSignup(app, navigateTo, 'senior');
  });

  document.getElementById('btn-signup-junior').addEventListener('click', (e) => {
    e.preventDefault();
    renderSignup(app, navigateTo, 'junior');
  });
}

export function renderSignup(app, navigateTo, role) {
  const isSenior = role === 'senior';

  app.innerHTML = `
    <div class="page-enter" style="max-width:400px;margin:40px auto;padding:20px;">
       <div style="text-align:center;margin-bottom:20px">
        <h1 style="font-size:1.5rem;font-weight:800">${isSenior ? '선배' : '후배 (익명)'} 회원가입</h1>
        <p style="color:var(--text-secondary);font-size:0.9rem">${isSenior ? '후배들에게 경험을 나누어 주세요.' : '아이디와 비번만 있으면 됩니다.'}</p>
      </div>
      <div class="card">
         <div class="form-group"><label class="form-label">아이디</label><input type="text" class="form-input" id="signup-id" /></div>
         <div class="form-group"><label class="form-label">비밀번호</label><input type="password" class="form-input" id="signup-pw" /></div>
         
         ${isSenior ? `
           <div class="form-group"><label class="form-label">이름</label><input type="text" class="form-input" id="signup-name" /></div>
           <div class="form-group"><label class="form-label">학과 (학번 포함)</label><input type="text" class="form-input" id="signup-dept" placeholder="예: 컴퓨터학부 18학번" /></div>
           <div class="form-group"><label class="form-label">한줄 소개</label><input type="text" class="form-input" id="signup-intro" /></div>
           <div class="form-group"><label class="form-label">이모지</label><input type="text" class="form-input" id="signup-emoji" placeholder="🎓" value="🎓" /></div>
         ` : ''}
         
         <button class="btn btn-primary btn-lg" id="btn-signup-submit" style="width:100%">${isSenior ? '선배로 가입하기' : '후배로 가입하기'}</button>
         <div style="margin-top:16px;text-align:center;">
          <a href="#" id="btn-back-login">이미 계정이 있나요? 로그인</a>
         </div>
      </div>
    </div>
  `;

  document.getElementById('btn-signup-submit').addEventListener('click', async () => {
    const data = {
      username: document.getElementById('signup-id').value,
      password: document.getElementById('signup-pw').value,
      role: role
    };

    if (isSenior) {
      data.name = document.getElementById('signup-name').value;
      data.department = document.getElementById('signup-dept').value;
      data.intro = document.getElementById('signup-intro').value;
      data.emoji = document.getElementById('signup-emoji').value;
    }

    try {
      await Store.signup(data);
      alert('가입되었습니다!');
      navigateTo(role);
    } catch (e) {
      alert(e.message);
    }
  });

  document.getElementById('btn-back-login').addEventListener('click', (e) => {
    e.preventDefault();
    renderLogin(app, navigateTo);
  });
}
