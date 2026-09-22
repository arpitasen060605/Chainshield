import API from './api';

/**
 * Fetch platform-wide statistics for Platform Admin
 * @returns {Promise<Object>} { success, stats: { totalCompanies, activeCompanyAdmins, inactiveCompanyAdmins, pendingCompanyAdmins } }
 */
export const getPlatformStats = async () => {
  const response = await API.get('/platform/stats');
  return response.data;
};

/**
 * Fetch all companies with associated company admin information
 * @returns {Promise<Object>} { success, count, companies: [...] }
 */
export const getPlatformCompanies = async () => {
  const response = await API.get('/platform/companies');
  return response.data;
};

/**
 * Fetch all pending Company Admin registrations
 * @returns {Promise<Object>} { success, count, pendingAdmins: [...] }
 */
export const getPendingCompanyAdmins = async () => {
  const response = await API.get('/platform/pending-admins');
  return response.data;
};

/**
 * Approve or reject a pending Company Admin registration
 * @param {string} id - Company Admin user Mongo ID
 * @param {string} status - 'active' or 'rejected'
 * @returns {Promise<Object>} { success, message, user }
 */
export const updateCompanyAdminStatus = async (id, status) => {
  const response = await API.put(`/platform/company-admins/${id}/status`, { status });
  return response.data;
};
