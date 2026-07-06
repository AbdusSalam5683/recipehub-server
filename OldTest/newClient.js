// client/src/services/auth.js
import api from './api';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  googleLogin: async (userData) => {
    const response = await api.post('/auth/google', userData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const recipeService = {
  getAll: async (page = 1, limit = 10, category = '') => {
    const response = await api.get(`/recipes?page=${page}&limit=${limit}&category=${category}`);
    return response.data;
  },

  getFeatured: async () => {
    const response = await api.get('/recipes/featured');
    return response.data;
  },

  getPopular: async () => {
    const response = await api.get('/recipes/popular');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/recipes/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/recipes', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/recipes/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/recipes/${id}`);
    return response.data;
  },

  toggleLike: async (id, action) => {
    const response = await api.post(`/recipes/${id}/like?action=${action}`);
    return response.data;
  },

  report: async (id, data) => {
    const response = await api.post(`/recipes/${id}/report`, data);
    return response.data;
  },

  getMyRecipes: async () => {
    const response = await api.get('/recipes/my-recipes');
    return response.data;
  },
};

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },

  getFavorites: async () => {
    const response = await api.get('/users/favorites');
    return response.data;
  },

  toggleFavorite: async (recipeId) => {
    const response = await api.post(`/users/favorites/${recipeId}`);
    return response.data;
  },

  checkFavorite: async (recipeId) => {
    const response = await api.get(`/users/favorites/check/${recipeId}`);
    return response.data;
  },
};

export const paymentService = {
  createPremiumCheckout: async () => {
    const response = await api.post('/payment/create-premium-checkout');
    return response.data;
  },

  createRecipeCheckout: async (recipeId) => {
    const response = await api.post('/payment/create-recipe-checkout', { recipeId });
    return response.data;
  },

  verifyPayment: async (sessionId) => {
    const response = await api.get(`/payment/verify?sessionId=${sessionId}`);
    return response.data;
  },

  getPurchasedRecipes: async () => {
    const response = await api.get('/payment/purchased');
    return response.data;
  },
};

export const adminService = {
  // ===== Dashboard =====
  getOverview: async () => {
    const response = await api.get('/admin/overview');
    return response.data;
  },

  // ===== User Management =====
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  toggleBlockUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/block`);
    return response.data;
  },

  changeUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // ===== Recipe Management =====
  getRecipes: async () => {
    const response = await api.get('/admin/recipes');
    return response.data;
  },

  toggleFeatureRecipe: async (recipeId) => {
    const response = await api.put(`/admin/recipes/${recipeId}/feature`);
    return response.data;
  },

  // ===== Report Management =====
  getReports: async () => {
    const response = await api.get('/admin/reports');
    return response.data;
  },

  handleReport: async (reportId, action) => {
    const response = await api.put(`/admin/reports/${reportId}`, { action });
    return response.data;
  },

  // ===== Activity Log =====
  getActivities: async (page = 1, limit = 20) => {
    const response = await api.get(`/activities?page=${page}&limit=${limit}`);
    return response.data;
  },

  getRecentActivities: async (limit = 10) => {
    const response = await api.get(`/activities/recent?limit=${limit}`);
    return response.data;
  },

  getActivityStats: async () => {
    const response = await api.get('/activities/stats');
    return response.data;
  },
};

// Old
// client/src/services/auth.js
import api from './api';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  googleLogin: async (userData) => {
    const response = await api.post('/auth/google', userData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const recipeService = {
  getAll: async (page = 1, limit = 10, category = '') => {
    const response = await api.get(`/recipes?page=${page}&limit=${limit}&category=${category}`);
    return response.data;
  },

  getFeatured: async () => {
    const response = await api.get('/recipes/featured');
    return response.data;
  },

  getPopular: async () => {
    const response = await api.get('/recipes/popular');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/recipes/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/recipes', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/recipes/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/recipes/${id}`);
    return response.data;
  },

  toggleLike: async (id, action) => {
    const response = await api.post(`/recipes/${id}/like?action=${action}`);
    return response.data;
  },

  report: async (id, data) => {
    const response = await api.post(`/recipes/${id}/report`, data);
    return response.data;
  },

  getMyRecipes: async () => {
    const response = await api.get('/recipes/my-recipes');
    return response.data;
  },
};

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },

  getFavorites: async () => {
    const response = await api.get('/users/favorites');
    return response.data;
  },

  toggleFavorite: async (recipeId) => {
    const response = await api.post(`/users/favorites/${recipeId}`);
    return response.data;
  },

  checkFavorite: async (recipeId) => {
    const response = await api.get(`/users/favorites/check/${recipeId}`);
    return response.data;
  },
};

export const paymentService = {
  createPremiumCheckout: async () => {
    const response = await api.post('/payment/create-premium-checkout');
    return response.data;
  },

  createRecipeCheckout: async (recipeId) => {
    const response = await api.post('/payment/create-recipe-checkout', { recipeId });
    return response.data;
  },

  verifyPayment: async (sessionId) => {
    const response = await api.get(`/payment/verify?sessionId=${sessionId}`);
    return response.data;
  },

  getPurchasedRecipes: async () => {
    const response = await api.get('/payment/purchased');
    return response.data;
  },
};

export const adminService = {
  getOverview: async () => {
    const response = await api.get('/admin/overview');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  toggleBlockUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/block`);
    return response.data;
  },

  getRecipes: async () => {
    const response = await api.get('/admin/recipes');
    return response.data;
  },

  toggleFeatureRecipe: async (recipeId) => {
    const response = await api.put(`/admin/recipes/${recipeId}/feature`);
    return response.data;
  },

  getReports: async () => {
    const response = await api.get('/admin/reports');
    return response.data;
  },

  handleReport: async (reportId, action) => {
    const response = await api.put(`/admin/reports/${reportId}`, { action });
    return response.data;
  },
};