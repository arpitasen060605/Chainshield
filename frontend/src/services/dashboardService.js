import API from './api';

/**
 * Fetch consolidated dashboard analytics metrics from backend MongoDB
 * @returns {Promise<Object>} { success, stats, severityBreakdown, recentIncidents, recentActivity }
 */
export const getDashboardStats = async () => {
  const response = await API.get('/dashboard/stats');
  return response.data;
};
