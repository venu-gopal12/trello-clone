import api from './api';

const adminApi = {
  // ==================== User Management ====================
  
  getAllUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/admin/users?${queryString}`);
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  suspendUser: async (userId, reason = '') => {
    const response = await api.patch(`/admin/users/${userId}/suspend`, { reason });
    return response.data;
  },

  activateUser: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/activate`);
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // ==================== Organization Management ====================

  getAllOrganizations: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/admin/organizations?${queryString}`);
    return response.data;
  },

  getOrganizationById: async (orgId) => {
    const response = await api.get(`/admin/organizations/${orgId}`);
    return response.data;
  },

  deleteOrganization: async (orgId) => {
    const response = await api.delete(`/admin/organizations/${orgId}`);
    return response.data;
  },

  // ==================== Analytics ====================

  getAnalytics: async () => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },

  // ==================== Audit Logs ====================

  getAuditLogs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/admin/audit-logs?${queryString}`);
    return response.data;
  }
};

export default adminApi;
