import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';

dotenv.config();

import User from './models/User.js';
import Company from './models/Company.js';
import Incident from './models/Incident.js';
import Evidence from './models/Evidence.js';
import AuditLog from './models/AuditLog.js';
import Report from './models/Report.js';
import Settings from './models/Settings.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import evidenceRoutes from './routes/evidenceRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import platformRoutes from './routes/platformRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { createAuditLog } from './utils/auditLogger.js';

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/settings', settingsRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'chainshield_super_secret_jwt_key_2026';

const runTests = async () => {
  let server;
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/chainshield';
    console.log(`[Test Setup] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`[Test Setup] Express server listening on ${baseUrl}`);

    console.log('[Test Setup] Preparing multi-tenant test data...');
    const compA = await Company.findOneAndUpdate(
      { code: 'CMPAAA' },
      { name: 'Company Alpha Inc', code: 'CMPAAA', status: 'active', industry: 'Cybersecurity' },
      { upsert: true, new: true }
    );

    const compB = await Company.findOneAndUpdate(
      { code: 'CMPBBB' },
      { name: 'Company Beta LLC', code: 'CMPBBB', status: 'active', industry: 'Healthcare' },
      { upsert: true, new: true }
    );

    // Clean up users & resources created for these test companies
    await User.deleteMany({ companyId: { $in: [compA._id, compB._id] } });
    await User.deleteMany({ email: 'platformadmin_test@chainshield.io' });
    await Incident.deleteMany({ companyId: { $in: [compA._id, compB._id] } });
    await Evidence.deleteMany({ companyId: { $in: [compA._id, compB._id] } });
    await AuditLog.deleteMany({ companyId: { $in: [compA._id, compB._id] } });
    await Report.deleteMany({ companyId: { $in: [compA._id, compB._id] } });
    await Settings.deleteMany({ companyId: { $in: [compA._id, compB._id] } });

    // 1. Create Users
    const adminA = await User.create({
      name: 'Alpha Admin',
      email: 'admin@alpha.test',
      password: 'Password123!',
      companyId: compA._id,
      role: 'admin',
      status: 'active',
    });

    const userA = await User.create({
      name: 'Alpha Employee',
      email: 'employee@alpha.test',
      password: 'Password123!',
      companyId: compA._id,
      role: 'incident_responder',
      status: 'active',
    });

    const adminB = await User.create({
      name: 'Beta Admin',
      email: 'admin@beta.test',
      password: 'Password123!',
      companyId: compB._id,
      role: 'admin',
      status: 'active',
    });

    const userB = await User.create({
      name: 'Beta Employee',
      email: 'employee@beta.test',
      password: 'Password123!',
      companyId: compB._id,
      role: 'incident_responder',
      status: 'active',
    });

    const platformAdmin = await User.create({
      name: 'Platform Super Admin',
      email: 'platformadmin_test@chainshield.io',
      password: 'Password123!',
      companyId: null,
      role: 'platform_admin',
      status: 'active',
    });

    // 2. Create Incidents for Company A (2 incidents) and Company B (1 incident)
    const incA1 = await Incident.create({
      incidentId: 'INC-ALPHA1',
      companyId: compA._id,
      title: 'Company Alpha Breach 1',
      description: 'DDoS Attack on Alpha Servers',
      severity: 'critical',
      status: 'active',
      createdBy: adminA._id,
    });

    const incA2 = await Incident.create({
      incidentId: 'INC-ALPHA2',
      companyId: compA._id,
      title: 'Company Alpha Breach 2',
      description: 'Phishing attempt on Alpha HR',
      severity: 'medium',
      status: 'under_investigation',
      createdBy: adminA._id,
    });

    const incB1 = await Incident.create({
      incidentId: 'INC-BETA01',
      companyId: compB._id,
      title: 'Company Beta Ransomware',
      description: 'Ransomware detected on Beta workstation',
      severity: 'high',
      status: 'active',
      createdBy: adminB._id,
    });

    // 3. Create Evidence for Company A and Company B
    const evA1 = await Evidence.create({
      evidenceId: 'EVD-ALPHA1',
      incidentId: incA1._id,
      companyId: compA._id,
      name: 'Alpha Network Capture',
      evidenceType: 'network_capture',
      originalFileName: 'alpha_pcap.pcap',
      storedFileName: 'stored_alpha_pcap.pcap',
      filePath: 'https://cloudinary.test/alpha_pcap.pcap',
      fileSize: 1024,
      sha256Hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      collectedBy: adminA._id,
      currentCustodian: adminA._id,
      status: 'collected',
      verificationHistory: [
        {
          originalHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
          calculatedHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
          result: 'VERIFIED',
          verifiedBy: adminA._id,
          timestamp: new Date(),
        },
      ],
    });

    const evB1 = await Evidence.create({
      evidenceId: 'EVD-BETA01',
      incidentId: incB1._id,
      companyId: compB._id,
      name: 'Beta Memory Dump',
      evidenceType: 'memory_dump',
      originalFileName: 'beta_mem.raw',
      storedFileName: 'stored_beta_mem.raw',
      filePath: 'https://cloudinary.test/beta_mem.raw',
      fileSize: 2048,
      sha256Hash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
      collectedBy: adminB._id,
      currentCustodian: adminB._id,
      status: 'collected',
      verificationHistory: [
        {
          originalHash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
          calculatedHash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
          result: 'VERIFIED',
          verifiedBy: adminB._id,
          timestamp: new Date(),
        },
      ],
    });

    // 4. Create Audit Logs
    await createAuditLog({ action: 'ALPHA_TEST_LOG', user: adminA, resourceType: 'Incident', resourceId: incA1.incidentId, details: 'Alpha Log Event' });
    await createAuditLog({ action: 'BETA_TEST_LOG', user: adminB, resourceType: 'Incident', resourceId: incB1.incidentId, details: 'Beta Log Event' });

    // 5. Create Reports
    const repA1 = await Report.create({
      reportId: 'REP-ALPHA1',
      incidentId: incA1._id,
      companyId: compA._id,
      title: 'Alpha Report 1',
      summary: 'Summary Alpha 1',
      generatedBy: adminA._id,
    });

    const repB1 = await Report.create({
      reportId: 'REP-BETA01',
      incidentId: incB1._id,
      companyId: compB._id,
      title: 'Beta Report 1',
      summary: 'Summary Beta 1',
      generatedBy: adminB._id,
    });

    // Generate JWT Tokens
    const tokenA = jwt.sign({ id: adminA._id, role: adminA.role, companyId: compA._id }, JWT_SECRET, { expiresIn: '1h' });
    const tokenB = jwt.sign({ id: adminB._id, role: adminB.role, companyId: compB._id }, JWT_SECRET, { expiresIn: '1h' });
    const tokenPlatform = jwt.sign({ id: platformAdmin._id, role: platformAdmin.role, companyId: null }, JWT_SECRET, { expiresIn: '1h' });

    console.log('\n=================== RUNNING MULTI-TENANT TESTS ===================\n');

    // ----------------------------------------------------
    // TEST A: Login as Company A Admin
    // ----------------------------------------------------
    console.log('--- TEST A: Company A Admin queries data ---');
    const resAUsers = await fetch(`${baseUrl}/api/users`, { headers: { Authorization: `Bearer ${tokenA}` } }).then(r => r.json());
    console.log(`[TEST A] Users returned for Company A: ${resAUsers.users.length}`);
    if (resAUsers.users.some(u => String(u.companyId) === String(compB._id))) {
      throw new Error('FAIL: Company A received Company B users!');
    }

    const resAIncidents = await fetch(`${baseUrl}/api/incidents`, { headers: { Authorization: `Bearer ${tokenA}` } }).then(r => r.json());
    console.log(`[TEST A] Incidents returned for Company A: ${resAIncidents.incidents.length}`);
    if (resAIncidents.incidents.some(i => String(i.companyId) !== String(compA._id))) {
      throw new Error('FAIL: Company A received foreign incidents!');
    }

    const resAEvidence = await fetch(`${baseUrl}/api/evidence`, { headers: { Authorization: `Bearer ${tokenA}` } }).then(r => r.json());
    console.log(`[TEST A] Evidence returned for Company A: ${resAEvidence.evidence.length}`);
    if (resAEvidence.evidence.some(e => String(e.companyId) !== String(compA._id))) {
      throw new Error('FAIL: Company A received foreign evidence!');
    }

    const resAAudits = await fetch(`${baseUrl}/api/audit-logs`, { headers: { Authorization: `Bearer ${tokenA}` } }).then(r => r.json());
    console.log(`[TEST A] Audit logs returned for Company A: ${resAAudits.logs.length}`);
    if (resAAudits.logs.some(l => l.details.includes('Beta'))) {
      throw new Error('FAIL: Company A received Company B audit logs!');
    }

    const resAReports = await fetch(`${baseUrl}/api/reports`, { headers: { Authorization: `Bearer ${tokenA}` } }).then(r => r.json());
    console.log(`[TEST A] Reports returned for Company A: ${resAReports.reports.length}`);
    if (resAReports.reports.some(r => r.reportId === 'REP-BETA01')) {
      throw new Error('FAIL: Company A received Company B reports!');
    }

    const resAStats = await fetch(`${baseUrl}/api/dashboard/stats`, { headers: { Authorization: `Bearer ${tokenA}` } }).then(r => r.json());
    console.log(`[TEST A] Stats for Company A: Incidents=${resAStats.stats.totalIncidents}, Evidence=${resAStats.stats.totalEvidence}`);
    if (resAStats.stats.totalIncidents !== 2) {
      throw new Error(`FAIL: Company A expected 2 totalIncidents, got ${resAStats.stats.totalIncidents}`);
    }
    console.log('PASSED TEST A: Company A only receives Company A data.\n');

    // ----------------------------------------------------
    // TEST B: Login as Company B Admin
    // ----------------------------------------------------
    console.log('--- TEST B: Company B Admin queries data ---');
    const resBUsers = await fetch(`${baseUrl}/api/users`, { headers: { Authorization: `Bearer ${tokenB}` } }).then(r => r.json());
    console.log(`[TEST B] Users returned for Company B: ${resBUsers.users.length}`);
    if (resBUsers.users.some(u => String(u.companyId) === String(compA._id))) {
      throw new Error('FAIL: Company B received Company A users!');
    }

    const resBIncidents = await fetch(`${baseUrl}/api/incidents`, { headers: { Authorization: `Bearer ${tokenB}` } }).then(r => r.json());
    console.log(`[TEST B] Incidents returned for Company B: ${resBIncidents.incidents.length}`);
    if (resBIncidents.incidents.some(i => String(i.companyId) !== String(compB._id))) {
      throw new Error('FAIL: Company B received foreign incidents!');
    }

    const resBEvidence = await fetch(`${baseUrl}/api/evidence`, { headers: { Authorization: `Bearer ${tokenB}` } }).then(r => r.json());
    console.log(`[TEST B] Evidence returned for Company B: ${resBEvidence.evidence.length}`);
    if (resBEvidence.evidence.some(e => String(e.companyId) !== String(compB._id))) {
      throw new Error('FAIL: Company B received foreign evidence!');
    }

    const resBAudits = await fetch(`${baseUrl}/api/audit-logs`, { headers: { Authorization: `Bearer ${tokenB}` } }).then(r => r.json());
    console.log(`[TEST B] Audit logs returned for Company B: ${resBAudits.logs.length}`);
    if (resBAudits.logs.some(l => l.details.includes('Alpha'))) {
      throw new Error('FAIL: Company B received Company A audit logs!');
    }

    const resBReports = await fetch(`${baseUrl}/api/reports`, { headers: { Authorization: `Bearer ${tokenB}` } }).then(r => r.json());
    console.log(`[TEST B] Reports returned for Company B: ${resBReports.reports.length}`);
    if (resBReports.reports.some(r => r.reportId === 'REP-ALPHA1')) {
      throw new Error('FAIL: Company B received Company A reports!');
    }

    const resBStats = await fetch(`${baseUrl}/api/dashboard/stats`, { headers: { Authorization: `Bearer ${tokenB}` } }).then(r => r.json());
    console.log(`[TEST B] Stats for Company B: Incidents=${resBStats.stats.totalIncidents}, Evidence=${resBStats.stats.totalEvidence}`);
    if (resBStats.stats.totalIncidents !== 1) {
      throw new Error(`FAIL: Company B expected 1 totalIncidents, got ${resBStats.stats.totalIncidents}`);
    }
    console.log('PASSED TEST B: Company B only receives Company B data.\n');

    // ----------------------------------------------------
    // TEST C: Company A Admin attempts to access Company B incident by ID
    // ----------------------------------------------------
    console.log('--- TEST C: Company A Admin accesses Company B incident by ID ---');
    const resAAccessBInc = await fetch(`${baseUrl}/api/incidents/${incB1._id}`, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log(`[TEST C] Status code: ${resAAccessBInc.status}`);
    if (![403, 404].includes(resAAccessBInc.status)) {
      throw new Error(`FAIL: Expected 403 or 404 when accessing foreign incident, got ${resAAccessBInc.status}`);
    }
    console.log('PASSED TEST C: Foreign incident access blocked with 403/404.\n');

    // ----------------------------------------------------
    // TEST D: Company A Admin attempts to access Company B evidence by ID
    // ----------------------------------------------------
    console.log('--- TEST D: Company A Admin accesses Company B evidence by ID ---');
    const resAAccessBEvd = await fetch(`${baseUrl}/api/evidence/${evB1._id}`, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log(`[TEST D] Status code: ${resAAccessBEvd.status}`);
    if (![403, 404].includes(resAAccessBEvd.status)) {
      throw new Error(`FAIL: Expected 403 or 404 when accessing foreign evidence, got ${resAAccessBEvd.status}`);
    }
    console.log('PASSED TEST D: Foreign evidence access blocked with 403/404.\n');

    // ----------------------------------------------------
    // TEST E: Company A Admin attempts to access Company B user by ID
    // ----------------------------------------------------
    console.log('--- TEST E: Company A Admin accesses Company B user by ID ---');
    const resAAccessBUser = await fetch(`${baseUrl}/api/users/${userB._id}`, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log(`[TEST E] Status code: ${resAAccessBUser.status}`);
    if (![403, 404].includes(resAAccessBUser.status)) {
      throw new Error(`FAIL: Expected 403 or 404 when accessing foreign user, got ${resAAccessBUser.status}`);
    }
    console.log('PASSED TEST E: Foreign user access blocked with 403/404.\n');

    // ----------------------------------------------------
    // TEST F: Compare Company A vs Company B Dashboard Statistics
    // ----------------------------------------------------
    console.log('--- TEST F: Verify Dashboard Stats Differ Between Tenants ---');
    console.log(`Company A Total Incidents: ${resAStats.stats.totalIncidents}`);
    console.log(`Company B Total Incidents: ${resBStats.stats.totalIncidents}`);
    if (resAStats.stats.totalIncidents === resBStats.stats.totalIncidents) {
      throw new Error('FAIL: Company A and Company B stats should differ when underlying data differs!');
    }
    console.log('PASSED TEST F: Dashboard statistics are strictly company-scoped and differ correctly.\n');

    // ----------------------------------------------------
    // TEST G: Platform Admin Functionality
    // ----------------------------------------------------
    console.log('--- TEST G: Verify Platform Admin Access ---');
    const resPlatformCompRes = await fetch(`${baseUrl}/api/platform/companies`, { headers: { Authorization: `Bearer ${tokenPlatform}` } });
    const resPlatformComp = await resPlatformCompRes.json();
    console.log(`[TEST G] Platform Companies Count: ${resPlatformComp.count}`);
    if (resPlatformCompRes.status !== 200 || !resPlatformComp.success) {
      throw new Error(`FAIL: Platform Admin failed to fetch companies: ${resPlatformCompRes.status}`);
    }

    const resPlatformStatsRes = await fetch(`${baseUrl}/api/platform/stats`, { headers: { Authorization: `Bearer ${tokenPlatform}` } });
    const resPlatformStats = await resPlatformStatsRes.json();
    console.log(`[TEST G] Platform Stats Total Companies: ${resPlatformStats.stats.totalCompanies}`);
    if (resPlatformStatsRes.status !== 200 || !resPlatformStats.success) {
      throw new Error(`FAIL: Platform Admin failed to fetch stats: ${resPlatformStatsRes.status}`);
    }
    console.log('PASSED TEST G: Platform Admin access functions as expected.\n');

    console.log('=================== ALL MULTI-TENANT ISOLATION TESTS PASSED SUCCESSFULLY! ===================\n');

  } catch (err) {
    console.error('\n❌ MULTI-TENANT TEST FAILURE:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
};

runTests();
