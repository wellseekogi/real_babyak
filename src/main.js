// ===== KNU Meal Meetup – Main Entry (SPA Router) =====
import './style.css';
import { renderLanding } from './pages/landing.js';
import { renderSenior } from './pages/senior.js';
import { renderJunior } from './pages/junior.js';
import { renderMatch } from './pages/match.js';
import { renderLogin, renderSignup } from './pages/auth.js';
import Store from './store.js';

const app = document.querySelector('#app');

// Simple Router
async function router() {
  const app = document.querySelector('#app');
  if (!app) {
    console.error('Critical Error: #app element not found!');
    return;
  }

  const path = window.location.hash.slice(1) || '/';
  const segments = path.split('/').filter(Boolean);
  let route = segments[0] || 'landing';
  if (path === '/') route = 'landing';

  console.log('[Router] Path:', path, 'Route:', route);

  // Set initial loading state
  app.innerHTML = `
    <div id="loading-indicator" style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;color:var(--text-secondary);gap:20px;">
      <div style="font-size:3rem;animation: pulse 1.5s infinite">🍚</div>
      <div style="font-size:1.1rem;font-weight:500">KNU Meal Meetup 로딩 중...</div>
    </div>
  `;

  try {
    // 1. Match Detail (public/shared link)
    if (route === 'match' && segments[1]) {
      await renderMatch(app, navigateTo, segments[1]);
      return;
    }

    // 2. Main Pages
    const user = Store.getCurrentUser();

    if (route === 'landing') {
      renderLanding(app, navigateTo);
    } else if (route === 'senior') {
      if (user && user.role === 'senior') {
        await renderSenior(app, navigateTo);
      } else {
        renderLogin(app, navigateTo);
      }
    } else if (route === 'junior') {
      if (user && user.role === 'junior') {
        await renderJunior(app, navigateTo);
      } else {
        // Explicitly show signup for juniors when they click from landing
        renderSignup(app, navigateTo, 'junior');
      }
    } else {
      // Unknown route - fallback to landing or 404
      renderLanding(app, navigateTo);
    }
  } catch (error) {
    console.error('Routing error:', error);
    app.innerHTML = `
      <div style="text-align:center;margin-top:100px;padding:20px;color:var(--text)">
        <div style="font-size:3rem;margin-bottom:20px">⚠️</div>
        <h2 style="margin-bottom:10px">문제가 발생했습니다</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px;border:1px solid var(--border);padding:10px;background:var(--bg-secondary);border-radius:4px;font-family:monospace;font-size:0.9rem;">${error.message || '알 수 없는 오류'}</p>
        <button onclick="location.reload()" class="btn btn-primary">새로고침</button>
      </div>
    `;
  }
}

// Global error listener for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global Error:', event.error || event.message);
  const app = document.querySelector('#app');
  if (app && (!app.innerText || app.innerText.includes('로딩 중'))) {
    app.innerHTML = `
      <div style="text-align:center;margin-top:100px;padding:20px;color:var(--text)">
        <div style="font-size:3rem;margin-bottom:20px">🚫</div>
        <h2 style="margin-bottom:10px">스크립트 오류</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px;background:rgba(255,0,0,0.1);padding:15px;border-radius:8px;font-family:monospace">${event.message}</p>
        <button onclick="location.reload()" class="btn btn-primary">다시 시도</button>
      </div>
    `;
  }
});

// Handle async errors (unhandled promises)
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise Rejection:', event.reason);
  const app = document.querySelector('#app');
  if (app) {
    app.innerHTML = `
      <div style="text-align:center;margin-top:100px;padding:20px;color:var(--text)">
        <div style="font-size:3rem;margin-bottom:20px">💨</div>
        <h2 style="margin-bottom:10px">네트워크 또는 로직 오류</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px;font-family:monospace">${event.reason}</p>
        <button onclick="location.reload()" class="btn btn-primary">다시 시도</button>
      </div>
    `;
  }
});

function navigateTo(path) {
  if (window.location.hash === '#' + path) {
    router(); // Force reload if already on that hash
  } else {
    window.location.hash = path;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);



