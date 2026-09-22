import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Company from './models/Company.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function setupTestUsers() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chainshield');

  let company = await Company.findOne({ code: 'TECHNOVA' });
  if (!company) {
    company = await Company.create({ name: 'TechNova Security', code: 'TECHNOVA', status: 'active' });
  }

  // 1. Platform Admin User
  const padmin = await User.findOneAndUpdate(
    { email: 'platformadmin@chainshield.com' },
    { name: 'Global Platform Admin', email: 'platformadmin@chainshield.com', password: 'Password123!', companyId: company._id, role: 'platform_admin', status: 'active' },
    { upsert: true, new: true }
  );

  // 2. Company Admin User
  const cadmin = await User.findOneAndUpdate(
    { email: 'companyadmin@technova.com' },
    { name: 'TechNova Company Admin', email: 'companyadmin@technova.com', password: 'Password123!', companyId: company._id, role: 'admin', status: 'active' },
    { upsert: true, new: true }
  );

  // 3. Employee User
  const emp = await User.findOneAndUpdate(
    { email: 'responder@technova.com' },
    { name: 'Rohit Responder', email: 'responder@technova.com', password: 'Password123!', companyId: company._id, role: 'incident_responder', status: 'active' },
    { upsert: true, new: true }
  );

  console.log('--- TEST ACCOUNTS SETUP ---');
  console.log('Platform Admin:', padmin.email, '| Role:', padmin.role);
  console.log('Company Admin:', cadmin.email, '| Role:', cadmin.role);
  console.log('Employee:', emp.email, '| Role:', emp.role);

  await mongoose.disconnect();
}

setupTestUsers().catch(console.error);
