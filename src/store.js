// ===== KNU Meal Meetup – Data Store (API) =====

const API_BASE = '/api';

export const Store = {
  // Current user session
  async setCurrentUser(user) {
    localStorage.setItem('knu_current_user', JSON.stringify(user));
  },
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('knu_current_user'));
    } catch {
      return null;
    }
  },
  async clearCurrentUser() {
    localStorage.removeItem('knu_current_user');
  },

  // Auth
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();
    this.setCurrentUser(data.user);
    return data.user;
  },

  async signup(data) {
    const res = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signup', ...data }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const resData = await res.json();
    this.setCurrentUser(resData.user);
    return resData.user;
  },

  // Seniors (Profile)
  async getSenior(id) {
    const res = await fetch(`${API_BASE}/users?id=${id}`);
    if (!res.ok) return { id, name: '선배', emoji: '🎓', department: '경북대학교' };
    return await res.json();
  },

  // Posts
  async createPost(data) {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create post');
    return await res.json();
  },

  async getAllPosts() {
    try {
      const res = await fetch(`${API_BASE}/posts`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error('Fetch posts error:', e);
      return [];
    }
  },

  async getPost(id) {
    const res = await fetch(`${API_BASE}/posts?id=${id}`);
    if (!res.ok) return null;
    return await res.json();
  },

  async getPostsBySenior(seniorId) {
    const res = await fetch(`${API_BASE}/posts?seniorId=${seniorId}`);
    if (!res.ok) return [];
    return await res.json();
  },

  async deletePost(id) {
    const res = await fetch(`${API_BASE}/posts?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete post');
    return await res.json();
  },

  async updatePost(id, data) {
    const res = await fetch(`${API_BASE}/posts?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update post');
    return await res.json();
  },

  // Requests
  async createRequest(data) {
    const user = this.getCurrentUser();
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, juniorId: user?.id }),
    });
    if (!res.ok) throw new Error('Failed to create request');
    return await res.json();
  },

  async getAllRequests() {
    const res = await fetch(`${API_BASE}/requests`);
    if (!res.ok) return [];
    return await res.json();
  },

  async getRequestsByJunior(juniorId) {
    const res = await fetch(`${API_BASE}/requests?type=junior&id=${juniorId}`);
    if (!res.ok) return [];
    return await res.json();
  },

  async getRequest(id) {
    const res = await fetch(`${API_BASE}/requests?id=${id}`);
    if (!res.ok) return null;
    return await res.json();
  },

  async getRequestsByPost(postId) {
    const res = await fetch(`${API_BASE}/requests?type=post&id=${postId}`);
    if (!res.ok) return [];
    return await res.json();
  },

  async confirmMatch(id) {
    return await this.updateMatch(id, { status: 'confirmed' });
  },

  // Matches
  async getMatch(id) {
    const res = await fetch(`${API_BASE}/matches?id=${id}`);
    if (!res.ok) return null;
    return await res.json();
  },

  async getMatchesByRequest(requestId) {
    const res = await fetch(`${API_BASE}/matches?type=request&id=${requestId}`);
    if (!res.ok) return [];
    return await res.json();
  },

  async updateMatch(id, data) {
    const res = await fetch(`${API_BASE}/matches?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update match');
    return await res.json();
  },

  seedDemoData() {
    console.log('Seeding not supported in API mode');
  }
};

export default Store;


