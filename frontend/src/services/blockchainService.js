import API from './api';

/**
 * Fetch blockchain transaction proof and on-chain verification for evidence
 * @param {string} evidenceId
 * @returns {Promise<Object>} { success, evidenceId, sha256Hash, blockchainRecord, onChainVerification }
 */
export const getBlockchainProof = async (evidenceId) => {
  const response = await API.get(`/blockchain/evidence/${evidenceId}`);
  return response.data;
};

/**
 * Register or re-anchor evidence SHA-256 hash on immutable blockchain ledger
 * @param {string} evidenceId
 * @returns {Promise<Object>} { success, message, evidenceId, sha256Hash, blockchainRecord }
 */
export const registerBlockchainProof = async (evidenceId) => {
  const response = await API.post(`/blockchain/evidence/${evidenceId}/register`);
  return response.data;
};

/**
 * Perform on-chain verification of evidence SHA-256 hash
 * @param {string} evidenceId
 * @returns {Promise<Object>} { success, evidenceId, sha256Hash, blockchainVerification }
 */
export const verifyOnChainProof = async (evidenceId) => {
  const response = await API.post(`/blockchain/evidence/${evidenceId}/verify`);
  return response.data;
};
