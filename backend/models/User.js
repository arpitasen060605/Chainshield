import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['admin', 'lead_investigator', 'forensic_analyst', 'auditor', 'incident_responder', 'pending', 'platform_admin'];
export const ACTIVE_ROLES = ROLES.filter((r) => r !== 'pending');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
  role: { type: String, enum: ROLES, default: 'pending' },
  status: { type: String, enum: ['pending', 'active', 'inactive', 'rejected'], default: 'pending' },
  resetPasswordOtpHash: { type: String, select: false },
  resetPasswordOtpExpires: { type: Date, select: false },
  resetPasswordOtpAttempts: { type: Number, default: 0, select: false },
  resetPasswordOtpLastSent: { type: Date, select: false },
  resetPasswordTokenHash: { type: String, select: false },
  resetPasswordTokenExpires: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre('validate', function(next) {
  const legacy = { company_admin: 'admin', administrator: 'admin', investigator: 'incident_responder', analyst: 'forensic_analyst' };
  if (legacy[this.role]) this.role = legacy[this.role];
  next();
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10));
  next();
});

userSchema.methods.matchPassword = function(password) { return bcrypt.compare(password, this.password); };
export default mongoose.model('User', userSchema);
