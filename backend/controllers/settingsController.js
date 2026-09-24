import Settings from '../models/Settings.js';
import { createAuditLog } from '../utils/auditLogger.js';

const SAFE_USER_FIELDS = 'name email role status';

const DEFAULT_SETTINGS = {
  notifications: {
    criticalIncidentAlerts: true,
    evidenceTamperAlerts: true,
    dailyAuditDigest: false,
    web3BlockAnchorNotices: true,
    userRoleChangeAlerts: true,
  },
  department: 'Cyber Crime Division',
  timezone: 'UTC+00:00 (London)',
  language: 'English (US)',
  nodeSettings: {
    rpcEndpoint: 'https://mainnet.infura.io/v3/chainshield_node',
    ipfsGateway: 'https://gateway.pinata.cloud/ipfs/',
    hashAlgorithm: 'Web Crypto SHA-256 (256-bit digest)',
  },
};

/**
 * @desc    Get system settings
 * @route   GET /api/settings
 * @access  Private
 */
export const getSettings = async (req, res, next) => {
  try {
    const companyFilter = req.user?.role === 'platform_admin' ? {} : { companyId: req.user.companyId };
    let settings = await Settings.findOne(companyFilter).populate('updatedBy', SAFE_USER_FIELDS);

    if (!settings) {
      settings = new Settings({
        ...DEFAULT_SETTINGS,
        companyId: req.user?.companyId,
        updatedBy: req.user ? (req.user._id || req.user.id) : null,
      });
      await settings.save();
    }

    return res.status(200).json({
      success: true,
      settings: {
        _id: settings._id,
        notifications: settings.notifications,
        department: settings.department,
        timezone: settings.timezone,
        language: settings.language,
        nodeSettings: settings.nodeSettings,
        updatedAt: settings.updatedAt,
        updatedBy: settings.updatedBy,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update system settings
 * @route   PUT /api/settings
 * @access  Private / Admin
 */
export const updateSettings = async (req, res, next) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    if (!['admin', 'lead_investigator', 'incident_responder'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update system settings',
      });
    }

    const companyFilter = req.user?.role === 'platform_admin' ? {} : { companyId: req.user.companyId };
    let settings = await Settings.findOne(companyFilter);
    if (!settings) {
      settings = new Settings({
        ...DEFAULT_SETTINGS,
        companyId: req.user?.companyId,
      });
    }

    const { notifications, department, timezone, language, nodeSettings } = req.body;

    // Disallow altering internal secrets or dangerous server configurations
    if (req.body.JWT_SECRET || req.body.MONGO_URI || req.body.password || req.body.database) {
      return res.status(400).json({
        success: false,
        message: 'Modifying sensitive server secrets via Settings API is prohibited',
      });
    }

    if (notifications && typeof notifications === 'object') {
      settings.notifications = {
        ...settings.notifications,
        ...notifications,
      };
    }

    if (department !== undefined) settings.department = String(department).trim();
    if (timezone !== undefined) settings.timezone = String(timezone).trim();
    if (language !== undefined) settings.language = String(language).trim();

    if (nodeSettings && typeof nodeSettings === 'object') {
      settings.nodeSettings = {
        rpcEndpoint: nodeSettings.rpcEndpoint ? String(nodeSettings.rpcEndpoint).trim() : settings.nodeSettings.rpcEndpoint,
        ipfsGateway: nodeSettings.ipfsGateway ? String(nodeSettings.ipfsGateway).trim() : settings.nodeSettings.ipfsGateway,
        hashAlgorithm: settings.nodeSettings.hashAlgorithm,
      };
    }

    settings.updatedBy = req.user._id || req.user.id;
    await settings.save();

    await settings.populate('updatedBy', SAFE_USER_FIELDS);

    // Log Audit Event
    await createAuditLog({
      action: 'SYSTEM_SETTINGS_UPDATED',
      user: req.user,
      resourceType: 'Settings',
      resourceId: settings._id,
      details: 'System notification rules and infrastructure RPC endpoints updated',
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'System configuration settings updated successfully',
      settings: {
        _id: settings._id,
        notifications: settings.notifications,
        department: settings.department,
        timezone: settings.timezone,
        language: settings.language,
        nodeSettings: settings.nodeSettings,
        updatedAt: settings.updatedAt,
        updatedBy: settings.updatedBy,
      },
    });
  } catch (error) {
    next(error);
  }
};
