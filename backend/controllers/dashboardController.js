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
    // 1. Incident metrics
    const totalIncidents = await Incident.countDocuments();
    const openIncidents = await Incident.countDocuments({
      status: { $in: ['active', 'under_investigation', 'containment'] },
    });
    const closedIncidents = await Incident.countDocuments({
      status: 'resolved',
    });
    const criticalIncidents = await Incident.countDocuments({
      severity: 'critical',
    });
    const highIncidents = await Incident.countDocuments({ severity: 'high' });
    const mediumIncidents = await Incident.countDocuments({ severity: 'medium' });
    const lowIncidents = await Incident.countDocuments({ severity: 'low' });

    // 2. Evidence & Verification metrics
    const totalEvidence = await Evidence.countDocuments();
    const verifiedEvidenceCount = await Evidence.countDocuments({
      'verificationHistory.result': 'VERIFIED',
    });
    const pendingVerificationCount = await Evidence.countDocuments({
      $or: [
        { verificationHistory: { $exists: false } },
        { verificationHistory: { $size: 0 } },
      ],
    });
    const tamperedEvidenceCount = await Evidence.countDocuments({
      'verificationHistory.result': 'TAMPERED',
    });

    // 3. User & System metrics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });

    // 4. Recent Incidents
    const recentIncidents = await Incident.find()
      .populate('createdBy', SAFE_USER_FIELDS)
      .populate('assignedTo', SAFE_USER_FIELDS)
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. Recent Audit Activity
    const recentActivity = await AuditLog.find()
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
