import API from './api';

/**
 * Fetch system audit telemetry logs (Filterable & Paginated)
 * @param {Object} params - { action, user, resourceType, search, page, limit }
 * @returns {Promise<Object>} { success, count, total, logs }
 */
export const getAuditLogs = async (params = {}) => {
  const response = await API.get('/audit-logs', { params });
  return response.data;
};
