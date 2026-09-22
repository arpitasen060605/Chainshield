import API from './api';

/**
 * Fetch all investigation reports
 * @param {Object} params - { search, status }
 * @returns {Promise<Object>} { success, count, reports }
 */
export const getReports = async (params = {}) => {
  const response = await API.get('/reports', { params });
  return response.data;
};

/**
 * Fetch single investigation report by ID (reportId, Mongo ID, or incidentId)
 * @param {string} id
 * @returns {Promise<Object>} { success, report }
 */
export const getReportById = async (id) => {
  const response = await API.get(`/reports/${id}`);
  return response.data;
};

/**
 * Generate a new investigation report from live database records
 * @param {Object} data - { incidentId, title, summary, executiveSummary, threatAnalysis, recommendations, status }
 * @returns {Promise<Object>} { success, message, report }
 */
export const generateReport = async (data) => {
  const response = await API.post('/reports/generate', data);
  return response.data;
};
