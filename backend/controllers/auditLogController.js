import AuditLog from '../models/AuditLog.js';

const SAFE_USER_FIELDS = 'name email role status department title avatar';

/**
 * @desc    Get audit logs stream (Filterable & Paginated)
 * @route   GET /api/audit-logs
 * @access  Private (Authorized roles)
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, user, resourceType, search, limit = 100, page = 1 } = req.query;

    const query = {};

    if (action && action !== 'All') {
      const sanitized = String(action).trim().replace(/[\s_]+/g, '.*');
      query.action = new RegExp(sanitized, 'i');
    }

    if (resourceType && resourceType !== 'All') {
      query.resourceType = resourceType;
    }

    if (user && user !== 'All') {
      query.$or = [
        { userName: new RegExp(user, 'i') },
        { userEmail: new RegExp(user, 'i') },
      ];
    }

    if (search && String(search).trim()) {
      const q = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { action: q },
        { userName: q },
        { userEmail: q },
        { resourceType: q },
        { resourceId: q },
        { details: q },
      ];
    }

    const pageSize = Math.max(1, parseInt(limit, 10) || 100);
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const skip = (currentPage - 1) * pageSize;

    const totalLogs = await AuditLog.countDocuments(query);

    const logs = await AuditLog.find(query)
      .populate('user', SAFE_USER_FIELDS)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(pageSize);

    // Map logs ensuring no passwords or sensitive tokens are exposed
    const mappedLogs = logs.map((log) => ({
      _id: log._id,
      id: `LOG-${log._id.toString().slice(-6).toUpperCase()}`,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      resource: `${log.resourceType}: ${log.resourceId || 'N/A'}`,
      details: log.details,
      incidentId: log.resourceType === 'Incident' ? log.resourceId : '-',
      evidenceId: log.resourceType === 'Evidence' ? log.resourceId : '-',
      user: log.user ? log.user.name || log.user.email : log.userName || 'System',
      userEmail: log.user ? log.user.email : log.userEmail,
      userId: log.user ? log.user._id : log.user,
      userRole: log.user ? log.user.role : 'system',
      ipAddress: log.ipAddress,
      status: log.action.includes('FAILURE') || log.action.includes('TAMPERED') || log.action.includes('FAILED') ? 'FAILED' : 'SUCCESS',
      timestamp: log.timestamp ? new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19) : 'N/A',
      createdAt: log.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: mappedLogs.length,
      total: totalLogs,
      page: currentPage,
      pages: Math.ceil(totalLogs / pageSize) || 1,
      logs: mappedLogs,
      auditLogs: mappedLogs,
    });
  } catch (error) {
    next(error);
  }
};
