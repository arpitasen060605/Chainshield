import Incident from '../models/Incident.js';
import Evidence from '../models/Evidence.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const SAFE_USER_FIELDS = 'name email role status department title avatar';

/**
 * @desc    Get consolidated real dashboard analytics from MongoDB
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const isPlatformAdmin = req.user?.role === 'platform_admin';
    const companyId = req.user?.companyId;

    const companyFilter = isPlatformAdmin ? {} : { companyId };

    // 1. Incident metrics
    const totalIncidents = await Incident.countDocuments(companyFilter);
    const openIncidents = await Incident.countDocuments({
      ...companyFilter,
      status: { $in: ['active', 'under_investigation', 'containment'] },
    });
    const closedIncidents = await Incident.countDocuments({
      ...companyFilter,
      status: 'resolved',
    });
    const criticalIncidents = await Incident.countDocuments({
      ...companyFilter,
      severity: 'critical',
    });
    const highIncidents = await Incident.countDocuments({ ...companyFilter, severity: 'high' });
    const mediumIncidents = await Incident.countDocuments({ ...companyFilter, severity: 'medium' });
    const lowIncidents = await Incident.countDocuments({ ...companyFilter, severity: 'low' });

    // 2. Evidence & Verification metrics
    const companyIncidentIds = isPlatformAdmin ? [] : await Incident.find({ companyId }).distinct('_id');
    const evidenceCompanyFilter = isPlatformAdmin
      ? {}
      : {
          $or: [
            { companyId },
            { incidentId: { $in: companyIncidentIds } },
          ],
        };

    const totalEvidence = await Evidence.countDocuments(evidenceCompanyFilter);
    const verifiedEvidenceCount = await Evidence.countDocuments({
      ...evidenceCompanyFilter,
      'verificationHistory.result': 'VERIFIED',
    });
    const pendingVerificationCount = await Evidence.countDocuments({
      ...evidenceCompanyFilter,
      $or: [
        { verificationHistory: { $exists: false } },
        { verificationHistory: { $size: 0 } },
      ],
    });
    const tamperedEvidenceCount = await Evidence.countDocuments({
      ...evidenceCompanyFilter,
      'verificationHistory.result': 'TAMPERED',
    });

    // 3. User & System metrics
    const totalUsers = await User.countDocuments(companyFilter);
    const activeUsers = await User.countDocuments({ ...companyFilter, status: 'active' });

    // 4. Recent Incidents
    const recentIncidents = await Incident.find(companyFilter)
      .populate('createdBy', SAFE_USER_FIELDS)
      .populate('assignedTo', SAFE_USER_FIELDS)
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. Recent Audit Activity
    const companyUserIds = isPlatformAdmin ? [] : await User.find({ companyId }).distinct('_id');
    const auditLogCompanyFilter = isPlatformAdmin
      ? {}
      : {
          $or: [
            { companyId },
            { user: { $in: companyUserIds } },
          ],
        };

    const recentActivity = await AuditLog.find(auditLogCompanyFilter)
      .populate('user', SAFE_USER_FIELDS)
      .sort({ timestamp: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      stats: {
        totalIncidents,
        openIncidents,
        closedIncidents,
        criticalIncidents,
        highIncidents,
        mediumIncidents,
        lowIncidents,
        totalEvidence,
        verifiedEvidence: verifiedEvidenceCount,
        pendingVerification: pendingVerificationCount,
        tamperedEvidence: tamperedEvidenceCount,
        totalUsers,
        activeUsers,
      },
      severityBreakdown: {
        critical: criticalIncidents,
        high: highIncidents,
        medium: mediumIncidents,
        low: lowIncidents,
      },
      recentIncidents,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};
