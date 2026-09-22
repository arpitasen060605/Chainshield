import API from './api';

/**
 * Fetch all evidence artifacts with optional query filters
 * @param {Object} filters - { incidentId, evidenceType, status, search, page, limit }
 * @returns {Promise<Object>} { success, page, limit, total, totalPages, count, evidence }
 */
export const getEvidence = async (filters = {}) => {
  const params = {};
  if (filters.incidentId && filters.incidentId !== 'All') {
    params.incidentId = filters.incidentId;
  }
  if (filters.evidenceType && filters.evidenceType !== 'All') {
    params.evidenceType = filters.evidenceType;
  }
  if (filters.status && filters.status !== 'All') {
    params.status = filters.status;
  }
  if (filters.search) {
    params.search = filters.search;
  }
  if (filters.page) {
    params.page = filters.page;
  }
  if (filters.limit) {
    params.limit = filters.limit;
  }

  const response = await API.get('/evidence', { params });
  return response.data;
};

/**
 * Fetch single evidence details by ID or evidenceId
 * @param {string} id - Evidence Mongo ID or evidenceId (e.g. EVD-000001)
 * @returns {Promise<Object>} { success, evidence }
 */
export const getEvidenceById = async (id) => {
  const response = await API.get(`/evidence/${id}`);
  return response.data;
};

/**
 * Upload a new digital evidence artifact with Axios upload progress support
 * @param {FormData} formData - Contains file, incidentId, name, description, evidenceType, status
 * @param {Function} [onUploadProgress] - Callback function for upload progress tracking
 * @returns {Promise<Object>} { success, message, evidence }
 */
export const uploadEvidence = async (formData, onUploadProgress) => {
  const response = await API.post('/evidence', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onUploadProgress(percentCompleted);
      }
    },
  });
  return response.data;
};

/**
 * Securely stream and download evidence file
 * @param {string} id - Evidence Mongo ID or evidenceId
 * @param {string} filename - Original filename for saving
 */
export const downloadEvidenceFile = async (id, filename) => {
  const response = await API.get(`/evidence/${id}/download`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || 'evidence-file');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Fetch Chain of Custody history for an evidence artifact
 * @param {string} id - Evidence Mongo ID or evidenceId
 * @returns {Promise<Object>} { success, currentCustodian, custodyHistory }
 */
export const getCustodyHistory = async (id) => {
  const response = await API.get(`/evidence/${id}/custody`);
  return response.data;
};

/**
 * Transfer custody of an evidence artifact to a new custodian
 * @param {string} id - Evidence Mongo ID or evidenceId
 * @param {Object} data - { newCustodian, notes }
 * @returns {Promise<Object>} { success, message, currentCustodian, custodyHistory, evidence }
 */
export const transferCustody = async (id, { newCustodian, notes }) => {
  const response = await API.post(`/evidence/${id}/custody/transfer`, {
    newCustodian,
    notes,
  });
  return response.data;
};

/**
 * Cryptographically verify evidence file integrity against stored baseline SHA-256 hash
 * @param {string} id - Evidence Mongo ID or evidenceId
 * @returns {Promise<Object>} { success, result, isMatch, originalHash, calculatedHash, verifiedBy, timestamp, verificationHistory }
 */
export const verifyEvidence = async (id) => {
  const response = await API.post(`/evidence/${id}/verify`);
  return response.data;
};

/**
 * Fetch verification history for an evidence artifact
 * @param {string} id - Evidence Mongo ID or evidenceId
 * @returns {Promise<Object>} { success, evidenceId, originalHash, verificationHistory }
 */
export const getVerificationHistory = async (id) => {
  const response = await API.get(`/evidence/${id}/verifications`);
  return response.data;
};

/**
 * Fetch verification history stream across all evidence artifacts
 * @param {Object} params - { result, search }
 * @returns {Promise<Object>} { success, count, verifications }
 */
export const getAllVerifications = async (params = {}) => {
  const response = await API.get('/evidence/verifications', { params });
  return response.data;
};
