import mongoose from 'mongoose';
import Report from '../models/Report.js';
import Incident from '../models/Incident.js';
import Evidence from '../models/Evidence.js';
import AuditLog from '../models/AuditLog.js';
import { createAuditLog } from '../utils/auditLogger.js';

const SAFE_USER_FIELDS = 'name email role status department title avatar';
const SAFE_INCIDENT_FIELDS = 'incidentId title description severity status threatVector affectedSystems impact createdBy assignedTo timeline createdAt updatedAt';

/**
 * Safely generate a unique human-readable Report ID (e.g. REP-000001)
 */
const generateUniqueReportId = async () => {
  const count = await Report.countDocuments();
  let reportId = `REP-${String(count + 1).padStart(6, '0')}`;
  let exists = await Report.findOne({ reportId });
  let attempts = 1;

  while (exists) {
    reportId = `REP-${String(count + 1 + attempts).padStart(6, '0')}`;
    exists = await Report.findOne({ reportId });
    attempts++;
  }

  return reportId;
};

/**
 * Helper to check user access to incident
 */
const canUserAccessIncident = (user, incident) => {
  if (!user || !incident) return false;
  const userRole = (user.role || '').toLowerCase();
  if (userRole === 'platform_admin') return true;
  if (incident.companyId && String(incident.companyId) !== String(user.companyId)) return false;
  const userIdStr = (user._id || user.id).toString();

  if (['admin', 'company_admin', 'lead_investigator', 'forensic_analyst', 'auditor'].includes(userRole)) {
    return true;
  }

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
 * Helper to aggregate structured report data for an incident
 */
const buildStructuredReportData = async (reportDoc, incidentDoc, userId) => {
  const incidentIdObj = incidentDoc._id;

  // Retrieve all related evidence for this incident case
  const evidenceItems = await Evidence.find({ incidentId: incidentIdObj })
    .populate('collectedBy', SAFE_USER_FIELDS)
    .populate('currentCustodian', SAFE_USER_FIELDS)
    .populate('custodyHistory.previousCustodian', SAFE_USER_FIELDS)
    .populate('custodyHistory.newCustodian', SAFE_USER_FIELDS)
    .populate('custodyHistory.performedBy', SAFE_USER_FIELDS)
    .populate('verificationHistory.verifiedBy', SAFE_USER_FIELDS)
    .select('-filePath');

  // Collect all custody transfer events
  let custodyEvents = [];
  // Collect all verification events
  let verificationEvents = [];

  evidenceItems.forEach((ev) => {
    if (Array.isArray(ev.custodyHistory)) {
      ev.custodyHistory.forEach((ch) => {
        custodyEvents.push({
          ...ch.toObject(),
          evidenceId: ev.evidenceId,
          evidenceName: ev.name,
        });
      });
    }

    if (Array.isArray(ev.verificationHistory)) {
      ev.verificationHistory.forEach((vh) => {
        verificationEvents.push({
          ...vh.toObject(),
          evidenceId: ev.evidenceId,
          evidenceName: ev.name,
        });
      });
    }
  });

  // Retrieve audit logs related to this incident or evidence
  const evidenceIds = evidenceItems.map((e) => e.evidenceId);
  const auditLogs = await AuditLog.find({
    $or: [
      { resourceId: incidentDoc.incidentId },
      { resourceId: incidentDoc._id.toString() },
      { resourceId: { $in: evidenceIds } },
    ],
  })
    .populate('user', SAFE_USER_FIELDS)
    .sort({ timestamp: -1 })
    .limit(50);

  // Compile full chronological timeline
  const combinedTimeline = [];

  if (Array.isArray(incidentDoc.timeline)) {
    incidentDoc.timeline.forEach((t) => {
      combinedTimeline.push({
        id: `TL-${t._id || Math.random()}`,
        title: t.action ? t.action.replace(/_/g, ' ') : 'Incident Update',
        description: t.description || 'Action performed on incident case',
        date: t.timestamp ? new Date(t.timestamp).toISOString().replace('T', ' ').slice(0, 16) : 'N/A',
        timestamp: t.timestamp,
        type: 'incident',
      });
    });
  }

  evidenceItems.forEach((ev) => {
    combinedTimeline.push({
      id: `EV-${ev._id}`,
      title: `Evidence Uploaded: ${ev.name}`,
      description: `Type: ${ev.evidenceType} | SHA-256: ${ev.sha256Hash}`,
      date: ev.createdAt ? new Date(ev.createdAt).toISOString().replace('T', ' ').slice(0, 16) : 'N/A',
      timestamp: ev.createdAt,
      type: 'evidence',
    });
  });

  custodyEvents.forEach((c) => {
    combinedTimeline.push({
      id: `CUST-${c._id}`,
      title: `Custody Transfer: ${c.evidenceId}`,
      description: `Action: ${c.action || 'Transfer'} | Transferred to ${c.newCustodian?.name || c.newCustodian?.email || 'New Custodian'}`,
      date: c.timestamp ? new Date(c.timestamp).toISOString().replace('T', ' ').slice(0, 16) : 'N/A',
      timestamp: c.timestamp,
      type: 'custody',
    });
  });

  verificationEvents.forEach((v) => {
    combinedTimeline.push({
      id: `VER-${v._id}`,
      title: `Integrity Verification: ${v.evidenceId}`,
      description: `Result: ${v.result} | SHA-256 Calculated: ${v.calculatedHash}`,
      date: v.timestamp ? new Date(v.timestamp).toISOString().replace('T', ' ').slice(0, 16) : 'N/A',
      timestamp: v.timestamp,
      type: 'verification',
    });
  });

  combinedTimeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return {
    _id: reportDoc._id,
    id: reportDoc.reportId,
    reportId: reportDoc.reportId,
    title: reportDoc.title,
    incidentId: incidentDoc.incidentId,
    incidentDbId: incidentDoc._id,
    incidentTitle: incidentDoc.title,
    severity: incidentDoc.severity,
    status: reportDoc.status || 'final',
    createdAt: reportDoc.createdAt,
    createdDate: reportDoc.createdAt ? new Date(reportDoc.createdAt).toISOString().replace('T', ' ').slice(0, 10) : 'N/A',
    author: reportDoc.generatedBy ? (reportDoc.generatedBy.name || reportDoc.generatedBy.email) : 'Lead Investigator',
    generatedBy: reportDoc.generatedBy,
    summary: reportDoc.summary || incidentDoc.description,
    executiveSummary: reportDoc.executiveSummary || `This forensic investigation report summarizes the threat vectors, digital evidence artifacts, cryptographic SHA-256 hashes, and chain of custody logs for incident case ${incidentDoc.incidentId}.`,
    threatAnalysis: reportDoc.threatAnalysis || `Threat Vector: ${incidentDoc.threatVector || 'Digital Breach'}. Affected Systems: ${Array.isArray(incidentDoc.affectedSystems) ? incidentDoc.affectedSystems.join(', ') : 'Primary Servers'}. Impact: ${incidentDoc.impact || 'System Investigation'}.`,
    recommendations: reportDoc.recommendations && reportDoc.recommendations.length > 0
      ? reportDoc.recommendations
      : [
          'Enforce Multi-Factor Authentication (MFA) across all administrative access points.',
          'Isolate affected host subnet systems and review ingress firewall traffic rules.',
          'Perform regular SHA-256 cryptographic verification checks on stored evidence archives.',
        ],
    incident: incidentDoc,
    evidence: evidenceItems,
    custodyEvents,
    verificationEvents,
    auditLogs,
    timeline: combinedTimeline,
  };
};

/**
 * @desc    Generate a new structured investigation report from real database data
 * @route   POST /api/reports/generate
 * @access  Private
 */
export const generateReport = async (req, res, next) => {
  try {
    const {
      incidentId,
      title,
      summary,
      executiveSummary,
      threatAnalysis,
      recommendations,
      status,
    } = req.body;

    if (!incidentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide incidentId (Mongo ID or human-readable INC-XXXXXX ID)',
      });
    }

    // 1. Find parent incident
    const findQuery = mongoose.Types.ObjectId.isValid(incidentId)
      ? { _id: incidentId }
      : { incidentId: String(incidentId).toUpperCase() };
    if (req.user?.role !== 'platform_admin') {
      findQuery.companyId = req.user.companyId;
    }

    const incident = await Incident.findOne(findQuery)
      .populate('createdBy', SAFE_USER_FIELDS)
      .populate('assignedTo', SAFE_USER_FIELDS);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident case not found',
      });
    }

    // 2. Check authorization
    if (!canUserAccessIncident(req.user, incident)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to generate a report for this incident',
      });
    }

    const userId = req.user._id || req.user.id;
    const reportId = await generateUniqueReportId();

    // 3. Create Report document
    const report = new Report({
      reportId,
      incidentId: incident._id,
      companyId: incident.companyId || req.user.companyId,
      title: title ? String(title).trim() : `Forensic Investigation Report - ${incident.incidentId}`,
      summary: summary ? String(summary).trim() : incident.description,
      executiveSummary: executiveSummary ? String(executiveSummary).trim() : '',
      threatAnalysis: threatAnalysis ? String(threatAnalysis).trim() : '',
      recommendations: Array.isArray(recommendations) ? recommendations : [],
      status: status ? String(status).toLowerCase().trim() : 'final',
      generatedBy: userId,
    });

    await report.save();

    await report.populate('generatedBy', SAFE_USER_FIELDS);

    // 4. Audit Log Hook
    await createAuditLog({
      action: 'REPORT_GENERATED',
      user: req.user,
      resourceType: 'Report',
      resourceId: report.reportId,
      details: `Investigation Report ${report.reportId} generated for incident ${incident.incidentId}`,
      req,
    });

    // 5. Build complete structured report response
    const fullReportPayload = await buildStructuredReportData(report, incident, userId);

    return res.status(201).json({
      success: true,
      message: 'Investigation report generated successfully from live database records',
      report: fullReportPayload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all investigation reports
 * @route   GET /api/reports
 * @access  Private
 */
export const getAllReports = async (req, res, next) => {
  try {
    const companyFilter = req.user?.role === 'platform_admin' ? {} : { companyId: req.user.companyId };
    let reports = await Report.find(companyFilter)
      .populate('incidentId', SAFE_INCIDENT_FIELDS)
      .populate('generatedBy', SAFE_USER_FIELDS)
      .sort({ createdAt: -1 });

    // If no report records exist yet in DB, synthesize reports for existing DB incidents
    if (reports.length === 0) {
      const incidents = await Incident.find(companyFilter)
        .populate('createdBy', SAFE_USER_FIELDS)
        .populate('assignedTo', SAFE_USER_FIELDS);

      for (const inc of incidents) {
        const reportId = await generateUniqueReportId();
        const rep = new Report({
          reportId,
          incidentId: inc._id,
          companyId: inc.companyId || req.user.companyId,
          title: `Forensic Investigation Report - ${inc.incidentId}`,
          summary: inc.description,
          status: 'final',
          generatedBy: req.user._id || req.user.id,
        });
        await rep.save();
      }

      reports = await Report.find(companyFilter)
        .populate('incidentId', SAFE_INCIDENT_FIELDS)
        .populate('generatedBy', SAFE_USER_FIELDS)
        .sort({ createdAt: -1 });
    }

    const mappedReports = reports.map((r) => ({
      _id: r._id,
      id: r.reportId,
      reportId: r.reportId,
      title: r.title,
      incidentId: r.incidentId?.incidentId || 'INC-000000',
      incidentDbId: r.incidentId?._id || r.incidentId,
      incidentTitle: r.incidentId?.title || 'Cyber Breach Case',
      severity: r.incidentId?.severity || 'high',
      status: r.status || 'final',
      createdDate: r.createdAt ? new Date(r.createdAt).toISOString().replace('T', ' ').slice(0, 10) : 'N/A',
      author: r.generatedBy ? (r.generatedBy.name || r.generatedBy.email) : 'Lead Investigator',
    }));

    return res.status(200).json({
      success: true,
      count: mappedReports.length,
      reports: mappedReports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single investigation report by ID
 * @route   GET /api/reports/:id
 * @access  Private
 */
export const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyFilter = req.user?.role === 'platform_admin' ? {} : { companyId: req.user.companyId };

    let findQuery;
    if (mongoose.Types.ObjectId.isValid(id)) {
      findQuery = { $or: [{ _id: id }, { incidentId: id }], ...companyFilter };
    } else {
      const formatted = String(id).toUpperCase();
      findQuery = { $or: [{ reportId: formatted }, { title: new RegExp(formatted, 'i') }], ...companyFilter };
    }

    let report = await Report.findOne(findQuery)
      .populate('incidentId')
      .populate('generatedBy', SAFE_USER_FIELDS);

    // If report not found by reportId, try finding incident directly and building/saving a report
    if (!report) {
      const incFindQuery = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id, ...companyFilter }
        : { incidentId: String(id).toUpperCase(), ...companyFilter };

      const incident = await Incident.findOne(incFindQuery)
        .populate('createdBy', SAFE_USER_FIELDS)
        .populate('assignedTo', SAFE_USER_FIELDS);

      if (incident) {
        const reportId = await generateUniqueReportId();
        report = new Report({
          reportId,
          incidentId: incident._id,
          companyId: incident.companyId || req.user.companyId,
          title: `Forensic Investigation Report - ${incident.incidentId}`,
          summary: incident.description,
          status: 'final',
          generatedBy: req.user._id || req.user.id,
        });
        await report.save();
        await report.populate('generatedBy', SAFE_USER_FIELDS);
      }
    }

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Investigation report not found',
      });
    }

    // Populate incident details
    const incident = await Incident.findById(report.incidentId._id || report.incidentId)
      .populate('createdBy', SAFE_USER_FIELDS)
      .populate('assignedTo', SAFE_USER_FIELDS);

    if (!canUserAccessIncident(req.user, incident)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this investigation report',
      });
    }

    const fullReportPayload = await buildStructuredReportData(report, incident, req.user._id || req.user.id);

    return res.status(200).json({
      success: true,
      report: fullReportPayload,
    });
  } catch (error) {
    next(error);
  }
};
