import API from './api';

/**
 * Fetch all users with optional role and status filters
 * @param {Object} filters - { role, status }
 * @returns {Promise<Object>} { success, count, users }
 */
export const getAllUsers = async (config = {}) => {
  const response = await API.get('/users', config);
  return response.data;
};

/**
 * Fetch single user details by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} { success, user }
 */
export const getUserById = async (id) => {
  const response = await API.get(`/users/${id}`);
  return response.data;
};

/**
 * Update user role (Admin only)
 * @param {string} id - User ID
 * @param {string} role - Target role ('admin', 'lead_investigator', 'forensic_analyst', 'auditor', 'incident_responder')
 * @returns {Promise<Object>} { success, message, user }
 */
export const updateUserRole = async (id, role) => {
  const response = await API.patch(`/users/${id}/role`, { role });
  return response.data;
};

/**
 * Update user account status (Admin only)
 * @param {string} id - User ID
 * @param {string} status - Target status ('active', 'inactive')
 * @returns {Promise<Object>} { success, message, user }
 */
export const updateUserStatus = async (id, status) => {
  const response = await API.patch(`/users/${id}/status`, { status });
  return response.data;
};
