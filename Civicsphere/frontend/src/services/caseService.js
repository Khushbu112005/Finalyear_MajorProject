import api from './api';

export const caseService = {
  // Get cases with query filters
  async getCases(params = {}) {
    const response = await api.get('/cases', { params });
    return response.data;
  },

  // Get single case details
  async getCaseById(id) {
    const response = await api.get(`/cases/${id}`);
    return response.data;
  },

  // Create new case (Citizen)
  async createCase(caseData) {
    const response = await api.post('/cases', caseData);
    return response.data;
  },

  // Update case
  async updateCase(id, caseData) {
    const response = await api.put(`/cases/${id}`, caseData);
    return response.data;
  },

  // Assign lawyer or accept case
  async assignCase(id, data = {}) {
    const response = await api.put(`/cases/${id}/assign`, data);
    return response.data;
  },

  // Delete case (Citizen)
  async deleteCase(id) {
    const response = await api.delete(`/cases/${id}`);
    return response.data;
  },
};

export default caseService;
