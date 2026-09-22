import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Company from './models/Company.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE = 'http://localhost:5000/api';

async function runFullFlowTest() {
  console.log('=== STARTING FULL REGISTRATION & APPROVAL FLOW VERIFICATION ===\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chainshield');

  // Find target company
  const company = await Company.findOne({ code: 'TECHNOVA' });
  if (!company) {
    console.error('FAILED: Company TECHNOVA not found in database');
    process.exit(1);
  }
  console.log(`✓ Found Company: ${company.name} (${company.code})`);

  const empEmail = `test_emp_${Date.now()}@technova.test`;
  const adminEmail = `test_admin_${Date.now()}@technova.test`;
  const password = 'Password123!';

  // Clean up any existing test accounts with these emails
  await User.deleteMany({ email: { $in: [empEmail, adminEmail] } });

  // 1. Employee Signup via API
  console.log(`\n--- Step 1: Employee Signup (${empEmail}) ---`);
  const empRegRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Employee Flow',
      email: empEmail,
      password,
      companyCode: company.code,
      registrationType: 'employee',
    }),
  });
  const empRegData = await empRegRes.json();
  console.log('Employee Register API Response:', empRegData);

  const empDoc = await User.findOne({ email: empEmail });
  if (!empDoc || empDoc.role !== 'pending' || empDoc.status !== 'pending') {
    console.error('❌ FAILED: Employee User doc state invalid:', empDoc);
    process.exit(1);
  }
  console.log(`✓ Verified DB: Employee role='${empDoc.role}', status='${empDoc.status}'`);

  // 2. Admin Signup via API
  console.log(`\n--- Step 2: Admin Signup (${adminEmail}) ---`);
  const adminRegRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Admin Flow',
      email: adminEmail,
      password,
      companyCode: company.code,
      registrationType: 'admin',
    }),
  });
  const adminRegData = await adminRegRes.json();
  console.log('Admin Register API Response:', adminRegData);

  const adminDoc = await User.findOne({ email: adminEmail });
  if (!adminDoc || adminDoc.role !== 'admin' || adminDoc.status !== 'pending') {
    console.error('❌ FAILED: Admin User doc state invalid:', adminDoc);
    process.exit(1);
  }
  console.log(`✓ Verified DB: Admin role='${adminDoc.role}', status='${adminDoc.status}'`);

  // 3. Company Admin Login & User Listing Check
  console.log('\n--- Step 3: Company Admin User Listing Visibility ---');
  const cAdminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@chainshield.io', password: 'Password123!' }),
  });
  const cAdminLoginData = await cAdminLoginRes.json();
  if (!cAdminLoginData.success) {
    console.error('❌ FAILED: Company Admin login failed:', cAdminLoginData);
    process.exit(1);
  }
  const cAdminToken = cAdminLoginData.token;

  const usersRes = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${cAdminToken}` },
  });
  const usersData = await usersRes.json();
  const cAdminUserList = usersData.users || [];

  const empInCAdminList = cAdminUserList.some((u) => u.email === empEmail);
  const adminInCAdminList = cAdminUserList.some((u) => u.email === adminEmail);

  console.log(`Company Admin sees pending employee (${empEmail}):`, empInCAdminList ? 'YES (Correct)' : 'NO (FAILED)');
  console.log(`Company Admin sees pending admin (${adminEmail}):`, adminInCAdminList ? 'YES (FAILED - Should be NO)' : 'NO (Correct)');

  if (!empInCAdminList || adminInCAdminList) {
    console.error('❌ FAILED: Company Admin visibility rules violated!');
    process.exit(1);
  }
  console.log('✓ Verified: Company Admin sees pending employee, but does NOT see pending admin!');

  // 4. Platform Admin Login & Pending Admins Check
  console.log('\n--- Step 4: Platform Admin Pending Admins Visibility ---');
  const pAdminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'platformadmin@chainshield.com', password: 'Password123!' }),
  });
  const pAdminLoginData = await pAdminLoginRes.json();
  if (!pAdminLoginData.success) {
    console.error('❌ FAILED: Platform Admin login failed:', pAdminLoginData);
    process.exit(1);
  }
  const pAdminToken = pAdminLoginData.token;

  const pPendingRes = await fetch(`${API_BASE}/platform/pending-admins`, {
    headers: { Authorization: `Bearer ${pAdminToken}` },
  });
  const pPendingData = await pPendingRes.json();
  const pPendingList = pPendingData.pendingAdmins || [];

  const adminInPAdminList = pPendingList.some((u) => u.email === adminEmail);
  const empInPAdminList = pPendingList.some((u) => u.email === empEmail);

  console.log(`Platform Admin sees pending admin (${adminEmail}):`, adminInPAdminList ? 'YES (Correct)' : 'NO (FAILED)');
  console.log(`Platform Admin sees pending employee (${empEmail}):`, empInPAdminList ? 'YES (FAILED - Should be NO)' : 'NO (Correct)');

  if (!adminInPAdminList || empInPAdminList) {
    console.error('❌ FAILED: Platform Admin visibility rules violated!');
    process.exit(1);
  }
  console.log('✓ Verified: Platform Admin sees pending admin, but does NOT see pending employee!');

  // 5. Platform Admin Approves Admin Signup
  console.log('\n--- Step 5: Platform Admin Approves Admin Signup ---');
  const approveAdminRes = await fetch(`${API_BASE}/platform/company-admins/${adminDoc._id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pAdminToken}`,
    },
    body: JSON.stringify({ status: 'active' }),
  });
  const approveAdminData = await approveAdminRes.json();
  console.log('Platform Admin Approve Response:', approveAdminData);

  const approvedAdminDoc = await User.findById(adminDoc._id);
  if (!approvedAdminDoc || approvedAdminDoc.status !== 'active' || approvedAdminDoc.role !== 'admin') {
    console.error('❌ FAILED: Approved Admin DB status invalid:', approvedAdminDoc);
    process.exit(1);
  }
  console.log(`✓ Verified DB: Approved Admin role='${approvedAdminDoc.role}', status='${approvedAdminDoc.status}'`);

  // Verify Approved Admin Login
  const newAdminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password }),
  });
  const newAdminLoginData = await newAdminLoginRes.json();
  if (!newAdminLoginData.success) {
    console.error('❌ FAILED: Newly approved Admin cannot log in:', newAdminLoginData);
    process.exit(1);
  }
  console.log('✓ Verified: Newly approved Admin logged in successfully!');

  // 6. Company Admin Approves Employee & Assigns Role
  console.log('\n--- Step 6: Company Admin Approves Employee & Assigns Operational Role ---');
  const approveEmpRes = await fetch(`${API_BASE}/users/${empDoc._id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cAdminToken}`,
    },
    body: JSON.stringify({ status: 'active' }),
  });
  const approveEmpData = await approveEmpRes.json();
  console.log('Company Admin Approve Employee Status Response:', approveEmpData);

  const assignRoleRes = await fetch(`${API_BASE}/users/${empDoc._id}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cAdminToken}`,
    },
    body: JSON.stringify({ role: 'incident_responder' }),
  });
  const assignRoleData = await assignRoleRes.json();
  console.log('Company Admin Assign Role Response:', assignRoleData);

  const updatedEmpDoc = await User.findById(empDoc._id);
  if (!updatedEmpDoc || updatedEmpDoc.status !== 'active' || updatedEmpDoc.role !== 'incident_responder') {
    console.error('❌ FAILED: Approved Employee DB state invalid:', updatedEmpDoc);
    process.exit(1);
  }
  console.log(`✓ Verified DB: Approved Employee role='${updatedEmpDoc.role}', status='${updatedEmpDoc.status}'`);

  // Verify Approved Employee Login
  const empLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: empEmail, password }),
  });
  const empLoginData = await empLoginRes.json();
  if (!empLoginData.success) {
    console.error('❌ FAILED: Newly approved Employee cannot log in:', empLoginData);
    process.exit(1);
  }
  console.log('✓ Verified: Newly approved Employee logged in successfully with assigned role!');

  // 7. Cleanup test documents
  await User.deleteMany({ email: { $in: [empEmail, adminEmail] } });
  await mongoose.disconnect();

  console.log('\n=== ALL REGISTRATION & APPROVAL FLOW VERIFICATIONS PASSED 100% ===');
}

runFullFlowTest().catch((e) => {
  console.error('Error running test script:', e);
  process.exit(1);
});
