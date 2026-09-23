import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Company from './models/Company.js';
import { registerUser } from './controllers/authController.js';
import { updateCompanyAdminStatus } from './controllers/platformController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
};

const runVerification = async () => {
  try {
    console.log('[TEST] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chainshield');

    const testCode = `TEST_${Date.now()}`;
    const admin1Email = `admin1_${Date.now()}@testcorp.io`;
    const admin2Email = `admin2_${Date.now()}@testcorp.io`;
    const emp1Email = `emp1_${Date.now()}@testcorp.io`;
    const empFailEmail = `empfail_${Date.now()}@testcorp.io`;

    console.log(`\n--- TEST 1: Company Admin Signup with new code (${testCode}) ---`);
    const req1 = {
      body: {
        name: 'Alpha Admin',
        email: admin1Email,
        password: 'Password123!',
        companyCode: testCode,
        registrationType: 'admin',
      },
    };
    const res1 = mockRes();
    await registerUser(req1, res1, (err) => { throw err; });

    console.log(`Response Status: ${res1.statusCode}`);
    console.log(`Response Body:`, res1.body);

    if (res1.statusCode !== 201 || !res1.body.pending) {
      throw new Error('Company Admin signup failed!');
    }

    const company1 = await Company.findOne({ code: testCode });
    if (!company1 || company1.status !== 'pending') {
      throw new Error(`Expected company status 'pending', got: ${company1?.status}`);
    }
    console.log(`✅ Company created with status 'pending' (ID: ${company1._id}, Code: ${company1.code})`);

    console.log(`\n--- TEST 2: Employee Signup while company is still 'pending' ---`);
    const reqEmpFail = {
      body: {
        name: 'Early Employee',
        email: empFailEmail,
        password: 'Password123!',
        companyCode: testCode,
        registrationType: 'employee',
      },
    };
    const resEmpFail = mockRes();
    await registerUser(reqEmpFail, resEmpFail, (err) => { throw err; });

    console.log(`Response Status: ${resEmpFail.statusCode}`);
    console.log(`Response Body:`, resEmpFail.body);

    if (resEmpFail.statusCode !== 400 || resEmpFail.body.message !== 'Invalid or inactive company code') {
      throw new Error('Employee signup with pending company was not rejected correctly!');
    }
    console.log(`✅ Employee signup correctly rejected while company is pending.`);

    console.log(`\n--- TEST 3: Platform Admin approves Company Admin ---`);
    const admin1User = await User.findOne({ email: admin1Email });
    const reqApprove = { params: { id: admin1User._id }, body: { status: 'active' } };
    const resApprove = mockRes();
    await updateCompanyAdminStatus(reqApprove, resApprove, (err) => { throw err; });

    console.log(`Approve Response:`, resApprove.body);

    const updatedCompany = await Company.findById(company1._id);
    if (updatedCompany.status !== 'active') {
      throw new Error(`Company status did not update to 'active', got: ${updatedCompany.status}`);
    }
    console.log(`✅ Company status updated to 'active' upon Platform Admin approval.`);

    console.log(`\n--- TEST 4: Employee Signup now that company is 'active' ---`);
    const reqEmpSuccess = {
      body: {
        name: 'Active Employee',
        email: emp1Email,
        password: 'Password123!',
        companyCode: testCode,
        registrationType: 'employee',
      },
    };
    const resEmpSuccess = mockRes();
    await registerUser(reqEmpSuccess, resEmpSuccess, (err) => { throw err; });

    console.log(`Response Status: ${resEmpSuccess.statusCode}`);
    console.log(`Response Body:`, resEmpSuccess.body);

    if (resEmpSuccess.statusCode !== 201) {
      throw new Error('Employee signup failed for active company!');
    }
    console.log(`✅ Employee registered successfully for active company.`);

    console.log(`\n--- TEST 5: Second Company Admin signup for existing code ---`);
    const reqAdmin2 = {
      body: {
        name: 'Second Admin',
        email: admin2Email,
        password: 'Password123!',
        companyCode: testCode,
        registrationType: 'admin',
      },
    };
    const resAdmin2 = mockRes();
    await registerUser(reqAdmin2, resAdmin2, (err) => { throw err; });

    console.log(`Response Status: ${resAdmin2.statusCode}`);
    console.log(`Response Body:`, resAdmin2.body);

    const companyCount = await Company.countDocuments({ code: testCode });
    if (companyCount !== 1) {
      throw new Error(`Duplicate companies created for code ${testCode}! Count: ${companyCount}`);
    }
    console.log(`✅ Second Company Admin linked to existing company without creating duplicates. (Company count for code: ${companyCount})`);

    console.log(`\n--- TEST 6: Employee Signup with non-existent code ---`);
    const reqNonExist = {
      body: {
        name: 'Fake Employee',
        email: `fake_${Date.now()}@fake.com`,
        password: 'Password123!',
        companyCode: 'NONEXISTENT999',
        registrationType: 'employee',
      },
    };
    const resNonExist = mockRes();
    await registerUser(reqNonExist, resNonExist, (err) => { throw err; });

    console.log(`Response Status: ${resNonExist.statusCode}`);
    console.log(`Response Body:`, resNonExist.body);

    if (resNonExist.statusCode !== 400 || resNonExist.body.message !== 'Invalid or inactive company code') {
      throw new Error('Non-existent company employee signup was not rejected!');
    }
    const nonExistCount = await Company.countDocuments({ code: 'NONEXISTENT999' });
    if (nonExistCount !== 0) {
      throw new Error('Employee signup created a new company!');
    }
    console.log(`✅ Employee signup with non-existent code rejected without creating a company.`);

    console.log('\n=============================================');
    console.log('🎉 ALL END-TO-END SIGNUP TESTS PASSED 100%! 🎉');
    console.log('=============================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runVerification();
