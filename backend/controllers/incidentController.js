import mongoose from 'mongoose';
import Incident from '../models/Incident.js';
import User from '../models/User.js';
import { createAuditLog } from '../utils/auditLogger.js';

const SAFE_USER_FIELDS = 'name email role status';

const ALLOWED_SEVERITIES = ['critical', 'high', 'medium', 'low'];
const ALLOWED_STATUSES = [
  'pending_verification',
  'active',
  'under_investigation',
  'containment',
  'resolved',
];

/**
 * Safely generate a unique human-readable Incident ID (e.g. INC-000001)
 */
const generateUniqueIncidentId = async () => {
  const count = await Incident.countDocuments();
  let incidentId = `INC-${String(count + 1).padStart(6, '0')}`;
  let exists = await Incident.findOne({ incidentId });
  let attempts = 1;

  while (exists) {
    incidentId = `INC-${String(count + 1 + attempts).padStart(6, '0')}`;
    exists = await Incident.findOne({ incidentId });
    attempts++;
  }

  return incidentId;
};

/**
 * Helper to check if a user is authorized to view or access an incident
 */
const canUserAccessIncident = (user, incident) => {
  if (!user || !incident) return false;
  const userRole = (user.role || '').toLowerCase();
  if (userRole === 'platform_admin') return true;
  if (incident.companyId && String(incident.companyId) !== String(user.companyId)) return false;
  const userIdStr = (user._id || user.id).toString();

  // Admins and Lead Investigators can access all incidents
  if (['company_admin', 'admin', 'lead_investigator', 'forensic_analyst', 'auditor'].includes(userRole)) {
    return true;
  }

  // Incident Responders can access incidents they created or are assigned to
  if (userRole === 'incident_responder') {
    const isCreator = incident.createdBy?._id
      ? incident.createdBy._id.toString() === userIdStr
      : incident.createdBy?.toString() === userIdStr;

    const isAssigned =
      Array.isArray(incident.assignedTo) &&
      incident.assignedTo.some((u) => {
        const uId = u._id ? u._id.toString() : u.toString();
        return uId === userIdStr;
      });

    return isCreator || isAssigned;
  }

  return false;
};

/**
 * @desc    Create a new security incident
 * @route   POST /api/incidents
 * @access  Private / Admin, Lead Investigator, Incident Responder
 */
export const createIncident = async (req, res, next) => {
  try {
    const {
      title,
      description,
      severity,
      threatVector,
      affectedSystems,
      impact,
      assignedTo,
    } = req.body;

    if (!title || !description || !severity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide incident title, description, and severity',
      });
    }

    const normSeverity = String(severity).toLowerCase().trim();
    if (!ALLOWED_SEVERITIES.includes(normSeverity)) {
      return res.status(400).json({
        success: false,
        message: `Invalid severity level. Allowed values: ${ALLOWED_SEVERITIES.join(', ')}`,
      });
    }

    // Validate assigned users if provided
    let validAssignedTo = [];
    if (Array.isArray(assignedTo) && assignedTo.length > 0) {
      for (const id of assignedTo) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: `Invalid assigned user ID format: ${id}`,
          });
        }
      }
      const existingUsers = await User.find({ _id: { $in: assignedTo }, companyId: req.user.companyId });
      validAssignedTo = existingUsers.map((u) => u._id);
    }

    const userId = req.user._id || req.user.id;
    const incidentId = await generateUniqueIncidentId();

    // Create incident object
    const incident = new Incident({
      incidentId,
      title: title.trim(),
      description: description.trim(),
      severity: normSeverity,
      status: 'pending_verification',
      threatVector: threatVector ? threatVector.trim().toLowerCase() : 'other',
      affectedSystems: Array.isArray(affectedSystems)
        ? affectedSystems.map((s) => String(s).trim()).filter(Boolean)
        : typeof affectedSystems === 'string'
        ? affectedSystems.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      impact: impact ? impact.trim() : '',
      companyId: req.user.companyId,
      createdBy: userId,
      assignedTo: validAssignedTo,
      timeline: [
        {
          action: 'INCIDENT_CREATED',
          description: 'Incident created',
          performedBy: userId,
          timestamp: new Date(),
        },
      ],
    });

    await incident.save();

    await createAuditLog({
      action: 'INCIDENT_CREATED',
      user: req.user,
      resourceType: 'Incident',
      resourceId: incident.incidentId,
      details: `Incident "${incident.title}" created with severity ${incident.severity}`,
      req,
    });

    const populatedIncident = await Incident.findById(incident._id)
      .populate('createdBy', SAFE_USER_FIELDS)
      .populate('assignedTo', SAFE_USER_FIELDS)
      .populate('timeline.performedBy', SAFE_USER_FIELDS);

    return res.status(201).json({
      success: true,
      message: 'Incident created successfully',
      incident: populatedIncident,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all incidents with filtering, search, pagination, and RBAC scoping
 * @route   GET /api/incidents
 * @access  Private
 */
export const getAllIncidents = async (req, res, next) => {
  try {
    const { severity, status, search, type, page = 1, limit = 20 } = req.query;
    const userRole = (req.user.role || '').toLowerCase();
    const userId = req.user._id || req.user.id;

    const query = {};
    if (userRole !== 'platform_admin') {
      query.companyId = req.user.companyId;
    }

    // 1. Severity filter validation & query
    if (severity && severity !== 'All') {
      const normSev = String(severity).toLowerCase().trim();
      if (!ALLOWED_SEVERITIES.includes(normSev)) {
        return res.status(400).json({
          success: false,
          message: `Invalid severity filter. Allowed values: ${ALLOWED_SEVERITIES.join(', ')}`,
        });
      }
      query.severity = normSev;
    }

    // 2. Status filter validation & query
    if (status && status !== 'All') {
      const statusMap = {
        active: 'active',
        open: 'active',
        'under investigation': 'under_investigation',
        under_investigation: 'under_investigation',
        containment: 'containment',
        resolved: 'resolved',
        closed: 'resolved',
      };
      const normStat = statusMap[String(status).toLowerCase().trim()];
      if (!normStat || !ALLOWED_STATUSES.includes(normStat)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
        });
      }
      query.status = normStat;
    }

    // 3. Search query across title, description, incidentId, and threatVector
    const searchQueryStr = search || (type && type !== 'All' ? type : null);
    if (searchQueryStr) {
      query.$or = [
        { title: { $regex: searchQueryStr, $options: 'i' } },
        { description: { $regex: searchQueryStr, $options: 'i' } },
        { incidentId: { $regex: searchQueryStr, $options: 'i' } },
        { threatVector: { $regex: searchQueryStr, $options: 'i' } },
      ];
    }

    // 4. Role-based access control restrictions
    if (userRole === 'incident_responder') {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ createdBy: userId }, { assignedTo: userId }],
      });
    } else if (userRole === 'forensic_analyst') {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { createdBy: userId },
          { assignedTo: userId },
          { severity: { $in: ['critical', 'high'] } },
        ],
      });
    }

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const totalIncidents = await Incident.countDocuments(query);
    const incidents = await Incident.find(query)
      .populate('createdBy', SAFE_USER_FIELDS)
      .populate('assignedTo', SAFE_USER_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total: totalIncidents,
      totalPages: Math.ceil(totalIncidents / limitNum) || 1,
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single incident details by ID or incidentId
 * @route   GET /api/incidents/:id
 * @access  Private
 */
export const getIncidentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { incidentId: id.toUpperCase() };
    if (req.user?.role !== 'platform_admin') {
      findQuery.companyId = req.user.companyId;
    }

    const incident = await Incident.findOne(findQuery)
      .populate('createdBy', SAFE_USER_FIELDS)
      .populate('assignedTo', SAFE_USER_FIELDS)
      .populate('timeline.performedBy', SAFE_USER_FIELDS);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    // Check authorization
    if (!canUserAccessIncident(req.user, incident)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this incident',
      });
    }

    return res.status(200).json({
      success: true,
      incident,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update incident details
 * @route   PATCH /api/incidents/:id
 * @access  Private / Authorized User
 */
export const updateIncident = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { incidentId: id.toUpperCase() };
    if (req.user?.role !== 'platform_admin') {
      findQuery.companyId = req.user.companyId;
    }

    const incident = await Incident.findOne(findQuery);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    // Access Check
    if (!canUserAccessIncident(req.user, incident)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot update this incident',
      });
    }

    const {
      title,
      description,
      severity,
      threatVector,
      affectedSystems,
      impact,
    } = req.body;

    if (title) incident.title = title.trim();
    if (description) incident.description = description.trim();
    if (severity) {
      const normSev = String(severity).toLowerCase().trim();
      if (!ALLOWED_SEVERITIES.includes(normSev)) {
        return res.status(400).json({
          success: false,
          message: `Invalid severity level. Allowed values: ${ALLOWED_SEVERITIES.join(', ')}`,
        });
      }
      incident.severity = normSev;
    }
    if (threatVector) incident.threatVector = threatVector.trim().toLowerCase();
    if (affectedSystems) {
      incident.affectedSystems = Array.isArray(affectedSystems)
        ? affectedSystems.map((s) => String(s).trim()).filter(Boolean)
        : typeof affectedSystems === 'string'
        ? affectedSystems.split(',').map((s) => s.trim()).filter(Boolean)
        : incident.affectedSystems;
    }
    if (impact !== undefined) incident.impact = impact.trim();

    // Add timeline record for incident details update
    const userId = req.user._id || req.user.id;
    incident.timeline.push({
      action: 'INCIDENT_UPDATED',
      description: 'Incident details updated',
      performedBy: userId,
      timestamp: new Date(),
    });

    await incident.save();

    const updatedIncident = await Incident.findById(incident._id)
      .populate('createdBy', SAFE_USER_FIELDS)
      .populate('assignedTo', SAFE_USER_FIELDS)
      .populate('timeline.performedBy', SAFE_USER_FIELDS);

    return res.status(200).json({
      success: true,
      message: 'Incident updated successfully',
      incident: updatedIncident,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change incident status
 * @route   PATCH /api/incidents/:id/status
 * @access  Private / Authorized User
 */
export const updateIncidentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a status',
      });
    }

    const statusMap = {
      active: 'active',
      open: 'active',
      'under investigation': 'under_investigation',
      under_investigation: 'under_investigation',
      containment: 'containment',
      resolved: 'resolved',
      closed: 'resolved',
    };

    const normStatus = statusMap[String(status).toLowerCase().trim()];
    if (!normStatus || !ALLOWED_STATUSES.includes(normStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status specified. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    const findQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { incidentId: id.toUpperCase() };
    if (req.user?.role !== 'platform_admin') {
      findQuery.companyId = req.user.companyId;
    }

    const incident = await Incident.findOne(findQuery);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    if (!canUserAccessIncident(req.user, incident)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot modify this incident status',
      });
    }

    const oldStatus = incident.status;
    if (oldStatus !== normStatus) {
      incident.status = normStatus;
      const userId = req.user._id || req.user.id;

      incident.timeline.push({
        action: 'STATUS_CHANGED',
        description: `Status changed from ${oldStatus} to ${normStatus}`,
        performedBy: userId,
        timestamp: new Date(),
      });

      await incident.save();
    }

    const updatedIncident = await Incident.findById(incident._id)
      .populate('createdBy', SAFE_USER_FIELDS)
      .populate('assignedTo', SAFE_USER_FIELDS)
      .populate('timeline.performedBy', SAFE_USER_FIELDS);

    return res.status(200).json({
      success: true,
      message: `Incident status updated to ${normStatus} successfully`,
      incident: updatedIncident,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign users to incident
 * @route   PATCH /api/incidents/:id/assign
 * @access  Private / Admin, Lead Investigator
 */
export const assignIncidentPersonnel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!Array.isArray(assignedTo)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide assignedTo as an array of user IDs',
      });
    }

    // Validate that all ObjectIds in assignedTo are valid and exist in DB
    for (const userId of assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid user ID format in assignedTo: ${userId}`,
        });
      }
    }

    const existingUsers = await User.find({ _id: { $in: assignedTo }, companyId: req.user.companyId });
    if (existingUsers.length !== assignedTo.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more assigned user IDs do not exist in the database',
      });
    }

    const findQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { incidentId: id.toUpperCase() };
    if (req.user?.role !== 'platform_admin') {
      findQuery.companyId = req.user.companyId;
    }

    const incident = await Incident.findOne(findQuery);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    incident.assignedTo = existingUsers.map((u) => u._id);

    const userId = req.user._id || req.user.id;
    incident.timeline.push({
      action: 'ASSIGNMENT_CHANGED',
      description: `Assigned ${existingUsers.length} personnel to incident`,
      performedBy: userId,
      timestamp: new Date(),
    });

    await incident.save();

    const updatedIncident = await Incident.findById(incident._id)
      .populate('createdBy', SAFE_USER_FIELDS)
      .populate('assignedTo', SAFE_USER_FIELDS)
      .populate('timeline.performedBy', SAFE_USER_FIELDS);

    return res.status(200).json({
      success: true,
      message: `Assigned ${existingUsers.length} personnel to incident successfully`,
      incident: updatedIncident,
    });
  } catch (error) {
    next(error);
  }
};



export const verifyIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!incident) return res.status(404).json({ success:false, message:'Incident not found' });
    const decision = String(req.body.decision || '').toLowerCase();
    if (!['approve','reject'].includes(decision)) return res.status(400).json({success:false,message:'Decision must be approve or reject'});
    incident.status = decision === 'approve' ? 'active' : 'rejected';
    incident.verifiedBy = req.user._id;
    incident.verifiedAt = new Date();
    incident.timeline.push({action: decision === 'approve' ? 'INCIDENT_APPROVED' : 'INCIDENT_REJECTED', description:`Incident ${decision}d by ${req.user.name}`, performedBy:req.user._id});
    await incident.save();
    await createAuditLog({action:`INCIDENT_${decision.toUpperCase()}D`,user:req.user,resourceType:'Incident',resourceId:incident._id,details:`${incident.incidentId} ${decision}d`,req});
    res.json({success:true,message:`Incident ${decision}d`,incident});
  } catch(e){ next(e); }
};
