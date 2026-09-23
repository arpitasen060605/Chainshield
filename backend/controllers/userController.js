import User from '../models/User.js';
import { createAuditLog } from '../utils/auditLogger.js';

const ASSIGNABLE_EMPLOYEE_ROLES = ['lead_investigator', 'forensic_analyst', 'auditor', 'incident_responder'];
const safe = (u) => ({
  _id: u._id,
  id: u._id,
  name: u.name,
  email: u.email,
  companyId: u.companyId,
  role: u.role === 'company_admin' ? 'admin' : u.role,
  status: u.status,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

export const getAllUsers = async (req, res, next) => {
  try {
    const q = {
      companyId: req.user.companyId,
      $or: [
        { role: { $nin: ['admin', 'company_admin', 'platform_admin'] } },
        { _id: req.user._id },
      ],
    };
    const users = await User.find(q).select('-password').sort({ createdAt: -1 });
    const formattedUsers = users.map((u) => ({
      ...u.toObject(),
      role: u.role === 'company_admin' ? 'admin' : u.role,
    }));
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, count: formattedUsers.length, users: formattedUsers });
  } catch (e) {
    next(e);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const u = await User.findOne({ _id: req.params.id, companyId: req.user.companyId }).select('-password');
    if (!u) return res.status(404).json({ success: false, message: 'User not found in your company' });
    const formatted = {
      ...u.toObject(),
      role: u.role === 'company_admin' ? 'admin' : u.role,
    };
    res.json({ success: true, user: formatted });
  } catch (e) {
    next(e);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const requesterRole = req.user.role === 'company_admin' ? 'admin' : req.user.role;
    if (requesterRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
    }

    // Reject if Company Admin attempts to modify their own account
    const isCompanyAdmin = req.user.role === 'admin' || req.user.role === 'company_admin';
    if (isCompanyAdmin && String(req.params.id || '') === String(req.user._id || '')) {
      return res.status(403).json({
        success: false,
        message: 'Company Admin cannot modify their own account',
      });
    }

    const requestedRole = String(req.body.role || '').toLowerCase();

    // Prevent assigning admin role through the employee role API
    if (requestedRole === 'admin' || requestedRole === 'company_admin') {
      return res.status(400).json({
        success: false,
        message: 'Admin role cannot be assigned through the employee role API.',
      });
    }

    if (!ASSIGNABLE_EMPLOYEE_ROLES.includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${ASSIGNABLE_EMPLOYEE_ROLES.join(', ')}`,
      });
    }

    // Verify user exists and belongs to the requester's company
    const u = await User.findById(req.params.id);
    if (!u || String(u.companyId || '') !== String(req.user.companyId || '')) {
      return res.status(404).json({
        success: false,
        message: 'User not found or belongs to another company.',
      });
    }

    // Reject role assignment if user account is pending approval
    if (u.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'User account is pending approval. Please approve the account before assigning a role.',
      });
    }

    u.role = requestedRole;
    await u.save();

    await createAuditLog({
      action: 'USER_ROLE_ASSIGNED',
      user: req.user,
      resourceType: 'User',
      resourceId: u._id,
      details: `Assigned ${requestedRole} role to ${u.email}`,
      req,
    });

    res.json({
      success: true,
      message: `Role for ${u.name} updated to ${requestedRole.replaceAll('_', ' ')}`,
      user: safe(u),
    });
  } catch (e) {
    next(e);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const requesterRole = req.user.role === 'company_admin' ? 'admin' : req.user.role;
    if (requesterRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
    }

    // Reject if Company Admin attempts to modify their own account
    const isCompanyAdmin = req.user.role === 'admin' || req.user.role === 'company_admin';
    if (isCompanyAdmin && String(req.params.id || '') === String(req.user._id || '')) {
      return res.status(403).json({
        success: false,
        message: 'Company Admin cannot modify their own account',
      });
    }

    const status = String(req.body.status || '').toLowerCase();
    if (!['active', 'inactive', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const u = await User.findById(req.params.id);
    if (!u || String(u.companyId || '') !== String(req.user.companyId || '')) {
      return res.status(404).json({ success: false, message: 'User not found or belongs to another company.' });
    }

    u.status = status;
    await u.save();

    await createAuditLog({
      action: 'USER_STATUS_UPDATED',
      user: req.user,
      resourceType: 'User',
      resourceId: u._id,
      details: `${u.email} status changed to ${status}`,
      req,
    });

    res.json({ success: true, message: `Account status updated to ${status}`, user: safe(u) });
  } catch (e) {
    next(e);
  }
};
