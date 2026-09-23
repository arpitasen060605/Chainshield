import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Company from './models/Company.js';
dotenv.config();

const employees = [
  ['Rohit Sharma','rohit@technova.test','incident_responder'],
  ['Amit Verma','amit@technova.test','lead_investigator'],
  ['Neha Singh','neha@technova.test','forensic_analyst'],
  ['Priya Kapoor','priya@technova.test','auditor'],
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chainshield');
    const company = await Company.findOneAndUpdate(
      { code: 'TECHNOVA' },
      { name: 'TechNova Security', code: 'TECHNOVA', industry: 'Technology', status: 'active' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const upsertUser = async (name, email, role) => {
      let u = await User.findOne({ email }).select('+password');
      if (!u) u = new User({ name, email, password: 'Password123!', companyId: company._id, role, status: 'active' });
      else { u.name=name; u.companyId=company._id; u.role=role; u.status='active'; }
      await u.save();
    };

    await upsertUser('TechNova Company Admin','admin@chainshield.io','admin');
    for (const e of employees) await upsertUser(...e);

    console.log('\nChainShield seed complete');
    console.log('Company code: TECHNOVA');
    console.log('Password for demo accounts: Password123!');
    console.log('Admin: admin@chainshield.io');
    console.log('Employees: rohit@technova.test, amit@technova.test, neha@technova.test, priya@technova.test');
    await mongoose.disconnect();
  } catch (e) { console.error('[Seed Error]', e); process.exit(1); }
};
run();
