import API from './api';

/**
 * Send Register request to backend
 * @param {Object} userData - { name, email, password }
 * @returns {Promise<Object>} API response data { success, message, token, user }
 */
export const register = async (userData) => {
  const response = await API.post('/auth/register', userData);

  if (response.data && response.data.token) {
    localStorage.setItem('chainshield_token', response.data.token);
    localStorage.setItem('chainshield_user', JSON.stringify(response.data.user));
  }

  return response.data;
};

/**
 * Send Login request to backend
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} API response data { success, message, token, user }
 */
export const login = async ({ email, password }) => {
  const response = await API.post('/auth/login', { email, password });
  
  if (response.data && response.data.token) {
    localStorage.setItem('chainshield_token', response.data.token);
    localStorage.setItem('chainshield_user', JSON.stringify(response.data.user));
  }
  
  return response.data;
};


/**
 * Get current authenticated user profile from backend
 * @returns {Promise<Object>} API response data { success, user }
 */
export const getMe = async () => {
  const response = await API.get('/auth/me');
  if (response.data && response.data.user) {
    localStorage.setItem('chainshield_user', JSON.stringify(response.data.user));
  }
  return response.data;
};

/**
 * Logout user by clearing local storage session
 */
export const logout = () => {
  localStorage.removeItem('chainshield_token');
  localStorage.removeItem('chainshield_user');
};

/**
 * Get current stored user information
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem('chainshield_user');
  return user ? JSON.parse(user) : null;
};

/**
 * Update user password
 * @param {Object} data - { currentPassword, newPassword }
 * @returns {Promise<Object>} API response data { success, message }
 */
export const updatePassword = async ({ currentPassword, newPassword }) => {
  const response = await API.put('/auth/update-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
};

/**
 * Update user profile details (name, email)
 * @param {Object} data - { name, email }
 * @returns {Promise<Object>} API response data { success, message, user }
 */
export const updateProfile = async ({ name, email }) => {
  const response = await API.put('/auth/profile', { name, email });
  if (response.data && response.data.user) {
    localStorage.setItem('chainshield_user', JSON.stringify(response.data.user));
  }
  return response.data;
};

/**
 * Request password reset OTP
 * @param {string} email
 * @returns {Promise<Object>} { success, message }
 */
export const forgotPassword = async (email) => {
  const response = await API.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Verify 6-digit OTP code for password reset
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<Object>} { success, message, resetToken }
 */
export const verifyResetOtp = async (email, otp) => {
  const response = await API.post('/auth/verify-reset-otp', { email, otp });
  return response.data;
};

/**
 * Reset user password using verified resetToken
 * @param {Object} data - { email, resetToken, newPassword, confirmPassword }
 * @returns {Promise<Object>} { success, message }
 */
export const resetPassword = async ({ email, resetToken, newPassword, confirmPassword }) => {
  const response = await API.post('/auth/reset-password', {
    email,
    resetToken,
    newPassword,
    confirmPassword,
  });
  return response.data;
};



