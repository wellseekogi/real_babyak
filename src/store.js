// ===== KNU Meal Meetup – Data Store (localStorage) =====

const STORAGE_KEYS = {
  seniors: 'knu_seniors',
  posts: 'knu_posts',
  requests: 'knu_requests',
  matches: 'knu_matches',
  currentUser: 'knu_current_user',
};

// ===== Helpers =====
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getAll(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function saveAll(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
  // Dispatch a custom event so other tabs/components can react
  window.dispatchEvent(new CustomEvent('store-updated', { detail: { key } }));
}

// ===== Generic CRUD =====
function createItem(key, item) {
  const items = getAll(key);
  const newItem = { ...item, id: genId(), createdAt: new Date().toISOString() };
  items.push(newItem);
  saveAll(key, items);
  return newItem;
}

function getById(key, id) {
  return getAll(key).find(i => i.id === id) || null;
}

function updateItem(key, id, updates) {
  const items = getAll(key);
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates };
  saveAll(key, items);
  return items[idx];
}

function deleteItem(key, id) {
  const items = getAll(key).filter(i => i.id !== id);
  saveAll(key, items);
}

// ===== Domain-Specific API =====
export const Store = {
  // Current user session
  setCurrentUser(role, id) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify({ role, id }));
  },
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
    } catch {
      return null;
    }
  },
  clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  },

  // Seniors
  createSenior(data) {
    return createItem(STORAGE_KEYS.seniors, data);
  },
  getSenior(id) {
    return getById(STORAGE_KEYS.seniors, id);
  },
  getAllSeniors() {
    return getAll(STORAGE_KEYS.seniors);
  },

  // Posts
  createPost(data) {
    return createItem(STORAGE_KEYS.posts, { ...data, status: 'open' });
  },
  getPost(id) {
    return getById(STORAGE_KEYS.posts, id);
  },
  getAllPosts() {
    return getAll(STORAGE_KEYS.posts);
  },
  getPostsBySenior(seniorId) {
    return getAll(STORAGE_KEYS.posts).filter(p => p.seniorId === seniorId);
  },
  updatePost(id, updates) {
    return updateItem(STORAGE_KEYS.posts, id, updates);
  },
  deletePost(id) {
    deleteItem(STORAGE_KEYS.posts, id);
  },

  // Requests
  createRequest(data) {
    return createItem(STORAGE_KEYS.requests, { ...data, status: 'pending' });
  },
  getRequest(id) {
    return getById(STORAGE_KEYS.requests, id);
  },
  getRequestsByPost(postId) {
    return getAll(STORAGE_KEYS.requests).filter(r => r.postId === postId);
  },
  getAllRequests() {
    return getAll(STORAGE_KEYS.requests);
  },
  updateRequest(id, updates) {
    return updateItem(STORAGE_KEYS.requests, id, updates);
  },

  // Matches
  createMatch(data) {
    // Initialize empty timetable: 12 hours (10:00-21:00) x 7 days
    const timetable = {
      senior: Array.from({ length: 12 }, () => Array(7).fill(false)),
      junior: Array.from({ length: 12 }, () => Array(7).fill(false)),
    };
    return createItem(STORAGE_KEYS.matches, {
      ...data,
      timetable,
      selectedRestaurant: null,
      status: 'coordinating',
    });
  },
  getMatch(id) {
    return getById(STORAGE_KEYS.matches, id);
  },
  getAllMatches() {
    return getAll(STORAGE_KEYS.matches);
  },
  getMatchesBySenior(seniorId) {
    return getAll(STORAGE_KEYS.matches).filter(m => {
      const post = getById(STORAGE_KEYS.posts, m.postId);
      return post && post.seniorId === seniorId;
    });
  },
  getMatchesByRequest(requestId) {
    return getAll(STORAGE_KEYS.matches).filter(m => m.requestId === requestId);
  },
  updateMatch(id, updates) {
    return updateItem(STORAGE_KEYS.matches, id, updates);
  },

  // Timetable operations
  toggleTimetableCell(matchId, role, row, col) {
    const match = getById(STORAGE_KEYS.matches, matchId);
    if (!match) return null;
    match.timetable[role][row][col] = !match.timetable[role][row][col];
    return updateItem(STORAGE_KEYS.matches, matchId, { timetable: match.timetable });
  },

  selectRestaurant(matchId, restaurant) {
    return updateItem(STORAGE_KEYS.matches, matchId, { selectedRestaurant: restaurant });
  },

  confirmMatch(matchId) {
    return updateItem(STORAGE_KEYS.matches, matchId, { status: 'confirmed' });
  },
};

// ===== Seed Demo Data =====
export function seedDemoData() {
  if (getAll(STORAGE_KEYS.seniors).length > 0) return; // Already seeded

  const seniors = [
    {
      name: '김민준',
      department: '컴퓨터학부 18학번',
      intro: '안녕하세요! 컴퓨터학부 졸업생이에요. 개발 이야기, 취업 고민, 학교생활 뭐든 편하게 이야기해요 🙂',
      emoji: '💻',
    },
    {
      name: '이서연',
      department: '경영학과 19학번',
      intro: '경영학과 석사 과정 중입니다. 복수전공, 교환학생, 대학원 진학 등 궁금한 점 있으면 밥 먹으면서 이야기해요!',
      emoji: '📊',
    },
    {
      name: '박지호',
      department: '전자공학부 17학번',
      intro: '대기업 반도체 엔지니어로 일하고 있어요. 전공 공부법, 인턴 준비, 면접 팁 나눠드릴게요 💪',
      emoji: '⚡',
    },
    {
      name: '최수아',
      department: '국어국문학과 20학번',
      intro: '출판사에서 편집자로 일하고 있어요. 문과 진로, 글쓰기, 취업 에세이 준비 등 함께 이야기해요 📚',
      emoji: '✏️',
    },
  ];

  const createdSeniors = seniors.map(s => createItem(STORAGE_KEYS.seniors, s));

  const posts = [
    {
      seniorId: createdSeniors[0].id,
      title: '개발자 진로 고민 같이 나눠요',
      description: '프론트엔드, 백엔드, AI 등 분야 선택이 어렵다면 경험 공유해드릴게요. 시험 끝나고 편하게 밥 먹으면서 이야기하자!',
      tags: ['개발', '취업', '진로상담'],
    },
    {
      seniorId: createdSeniors[1].id,
      title: '교환학생 & 복수전공 꿀팁',
      description: '교환학생 다녀온 경험, 복수전공 시간표 짜는 법, 학점 관리 노하우 등 뭐든 물어보세요!',
      tags: ['교환학생', '복수전공', '학점관리'],
    },
    {
      seniorId: createdSeniors[2].id,
      title: '반도체 취업 준비 A to Z',
      description: '인턴 지원부터 면접 준비, 실제 현업 이야기까지. 반도체 업계 관심 있는 후배 환영합니다.',
      tags: ['반도체', '대기업', '면접'],
    },
    {
      seniorId: createdSeniors[3].id,
      title: '문과생 진로 탐색 도와줄게요',
      description: '국문과 졸업 후 출판/미디어 분야로 진출한 경험을 나눕니다. 취업 에세이 첨삭도 해줄게요 😊',
      tags: ['문과', '출판', '에세이'],
    },
  ];

  posts.forEach(p => createItem(STORAGE_KEYS.posts, { ...p, status: 'open' }));
}

export default Store;
