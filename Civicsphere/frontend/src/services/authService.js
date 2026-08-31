import api from './api';

export const authService = {
  // Register new user (CITIZEN or LAWYER)
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user profile
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update profile
  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Get lawyers list
  async getLawyers() {
    const response = await api.get('/auth/lawyers');
    return response.data;
  },

  // Get Citizen Dashboard Data
  async getCitizenDashboard() {
    const response = await api.get('/citizen/dashboard');
    return response.data;
  },

  // Get Lawyer Dashboard Data
  async getLawyerDashboard() {
    const response = await api.get('/lawyer/dashboard');
    return response.data;
  },

  // Get Lawyer Clients
  async getLawyerClients() {
    const response = await api.get('/lawyer/clients');
    return response.data;
  },
};

export default authService;
