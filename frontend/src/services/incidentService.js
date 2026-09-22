import API from './api';

/**
 * Fetch all incidents with optional query filters (severity, status, search, type)
 * @param {Object} filters - { severity, status, search, type }
 * @returns {Promise<Object>} { success, count, incidents }
 */
export const getIncidents = async (filters = {}) => {
  const params = {};
  if (filters.severity && filters.severity !== 'All') {
    params.severity = filters.severity;
  }
  if (filters.status && filters.status !== 'All') {
    params.status = filters.status;
  }
  if (filters.search) {
    params.search = filters.search;
  }
  if (filters.type && filters.type !== 'All') {
    params.type = filters.type;
  }
  if (filters.page) {
    params.page = filters.page;
  }
  if (filters.limit) {
    params.limit = filters.limit;
  }

  const response = await API.get('/incidents', { params });
  return response.data;
};

/**
 * Fetch single incident details by ID
 * @param {string} id - Incident Mongo ID
 * @returns {Promise<Object>} { success, incident }
 */
export const getIncidentById = async (id) => {
  const response = await API.get(`/incidents/${id}`);
  return response.data;
};

/**
 * Create a new security incident
 * @param {Object} data - { title, description, severity, threatVector, affectedSystems, impact, assignedTo }
 * @returns {Promise<Object>} { success, message, incident }
 */
export const createIncident = async (data) => {
  const response = await API.post('/incidents', data);
  return response.data;
};

/**
 * Update incident details
 * @param {string} id - Incident ID
 * @param {Object} data - Updatable fields
 * @returns {Promise<Object>} { success, message, incident }
 */
export const updateIncident = async (id, data) => {
  const response = await API.patch(`/incidents/${id}`, data);
  return response.data;
};

/**
 * Update incident status
 * @param {string} id - Incident ID
 * @param {string} status - New status ('active', 'under_investigation', 'containment', 'resolved')
 * @returns {Promise<Object>} { success, message, incident }
 */
export const updateIncidentStatus = async (id, status) => {
  const response = await API.patch(`/incidents/${id}/status`, { status });
  return response.data;
};

/**
 * Assign users to incident (Admin or Lead Investigator)
 * @param {string} id - Incident ID
 * @param {Array<string>} assignedTo - Array of User IDs
 * @returns {Promise<Object>} { success, message, incident }
 */
export const assignIncident = async (id, assignedTo) => {
  const response = await API.patch(`/incidents/${id}/assign`, { assignedTo });
  return response.data;
};
