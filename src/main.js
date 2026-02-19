// ===== KNU Meal Meetup – Main Entry (SPA Router) =====
import './style.css';
import { seedDemoData } from './store.js';
import { renderLanding } from './pages/landing.js';
import { renderSenior } from './pages/senior.js';
import { renderJunior } from './pages/junior.js';
import { renderMatch } from './pages/match.js';

const app = document.getElementById('app');

// Seed demo data on first visit
seedDemoData();

// ===== Hash-Based Router =====
function navigateTo(path) {
  window.location.hash = `#/${path}`;
}

function getRoute() {
  const hash = window.location.hash.slice(2) || ''; // Remove #/
  return hash;
}

function router() {
  const route = getRoute();

  if (route === '' || route === '/') {
    renderLanding(app, navigateTo);
  } else if (route === 'senior') {
    renderSenior(app, navigateTo);
  } else if (route === 'junior') {
    renderJunior(app, navigateTo);
  } else if (route.startsWith('match/')) {
    const matchId = route.split('/')[1];
    renderMatch(app, navigateTo, matchId);
  } else {
    renderLanding(app, navigateTo);
  }

  // Logout is handled per-page in each render function
}

// Listen for hash changes
window.addEventListener('hashchange', router);

// Listen for storage events from other tabs
window.addEventListener('storage', (e) => {
  if (e.key && e.key.startsWith('knu_')) {
    router(); // Re-render on data changes from another tab
  }
});

// Initial render
router();
