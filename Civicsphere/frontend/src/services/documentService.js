import api from './api';

export const documentService = {
  // Get documents
  async getDocuments(params = {}) {
    const response = await api.get('/documents', { params });
    return response.data;
  },

  // Upload/Register document
  async uploadDocument(documentData) {
    const response = await api.post('/documents', documentData);
    return response.data;
  },

  // Get document by ID
  async getDocumentById(id) {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  // Update document status
  async updateStatus(id, status) {
    const response = await api.put(`/documents/${id}/status`, { status });
    return response.data;
  },

  // Delete document
  async deleteDocument(id) {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },
};

export default documentService;
