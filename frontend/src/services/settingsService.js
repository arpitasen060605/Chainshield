import API from './api';

/**
 * Fetch current system settings from MongoDB
 * @returns {Promise<Object>} { success, settings }
 */
export const getSettings = async () => {
  const response = await API.get('/settings');
  return response.data;
};

/**
 * Update system settings in MongoDB
 * @param {Object} data - { notifications, department, timezone, language, nodeSettings }
 * @returns {Promise<Object>} { success, message, settings }
 */
export const updateSettings = async (data) => {
  const response = await API.put('/settings', data);
  return response.data;
};
