import AuditLog from '../models/AuditLog.js';

/**
 * Creates an immutable audit log entry in MongoDB
 * @param {Object} options
 * @param {string} options.action - Action/event type name (e.g. 'AUTH_LOGIN_SUCCESS', 'INCIDENT_CREATED')
 * @param {Object|string} [options.user] - User object or User ID
 * @param {string} options.resourceType - Type of resource (e.g. 'User', 'Incident', 'Evidence', 'Custody', 'Verification')
 * @param {string} [options.resourceId] - Identifier of target resource
 * @param {string} [options.details] - Description or metadata of action (never contains passwords/secrets)
 * @param {Object} [options.req] - Express request object for IP & User-Agent extraction
 */
export const createAuditLog = async ({
  action,
  user,
  resourceType,
  resourceId = '',
  details = '',
  req = null,
}) => {
  try {
    const userId = user
      ? user._id || user.id || (typeof user === 'string' ? user : null)
      : req && req.user
      ? req.user._id || req.user.id
      : null;

    const userName =
      user && user.name
        ? user.name
        : req && req.user && req.user.name
        ? req.user.name
        : 'System';

    const userEmail =
      user && user.email
        ? user.email
        : req && req.user && req.user.email
        ? req.user.email
        : '';

    const ipAddress = req
      ? req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
      : '';

    const userAgent = req ? req.headers['user-agent'] || '' : '';

    await AuditLog.create({
      action: String(action).toUpperCase().trim(),
      user: userId,
      userName,
      userEmail,
      resourceType,
      resourceId: String(resourceId),
      details: String(details),
      ipAddress: String(ipAddress),
      userAgent: String(userAgent),
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[AuditLogger] Failed to persist audit log entry:', err.message);
  }
};
