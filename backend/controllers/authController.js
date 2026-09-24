import User from '../models/User.js';
import Company from '../models/Company.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createAuditLog } from '../utils/auditLogger.js';
import { sendOtpEmail } from '../services/emailService.js';

const tokenFor = (user) => jwt.sign({ id: user._id, role: user.role, companyId: user.companyId }, process.env.JWT_SECRET || 'chainshield_super_secret_jwt_key_2026', { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
const safe = (u) => ({ _id:u._id, id:u._id, name:u.name, email:u.email, companyId:u.companyId, role:u.role, status:u.status, createdAt:u.createdAt });

export const registerUser = async (req,res,next) => {
  try {
    const { name,email,password,companyCode,registrationType,role } = req.body;
    if (!name || !email || !password || !companyCode) return res.status(400).json({success:false,message:'Name, email, password and company code are required'});
    if (password.length < 6) return res.status(400).json({success:false,message:'Password must be at least 6 characters'});

    const requestedType = String(registrationType || role || '').toLowerCase();
    if (requestedType === 'platform_admin') {
      return res.status(400).json({ success: false, message: 'Platform Admin role cannot be self-assigned.' });
    }

    const normalizedCode = String(companyCode).trim().toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();

    const isCompanyAdmin = (requestedType === 'admin' || requestedType === 'company_admin');

    if (isCompanyAdmin && normalizedCode.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Company Code must be exactly 6 characters long for Admin signup.',
      });
    }

    if (await User.findOne({email:normalizedEmail})) return res.status(400).json({success:false,message:'User with this email already exists'});

    let company;

    if (isCompanyAdmin) {
      // 1. COMPANY ADMIN SIGNUP
      company = await Company.findOne({ code: normalizedCode });
      if (!company) {
        // Create new company with status 'pending' if it does not exist
        company = await Company.create({
          name: `${name.trim()}'s Organization`,
          code: normalizedCode,
          industry: 'Cybersecurity',
          status: 'pending',
        });
      }
    } else {
      // 2. EMPLOYEE SIGNUP
      company = await Company.findOne({ code: normalizedCode, status: 'active' });
      if (!company) {
        return res.status(400).json({ success: false, message: 'Invalid or inactive company code' });
      }
    }

    const userRole = isCompanyAdmin ? 'admin' : 'pending';

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      companyId: company._id,
      role: userRole,
      status: 'pending',
    });

    if (isCompanyAdmin && !company.createdBy) {
      company.createdBy = user._id;
      await company.save();
    }

    await createAuditLog({
      action: 'AUTH_USER_REGISTERED_PENDING',
      user,
      resourceType: 'User',
      resourceId: user._id,
      details: `${user.email} registered for ${company.name || company.code} as ${userRole} and is awaiting approval`,
      req,
    });

    const approvalTarget = userRole === 'admin' ? 'Platform Admin' : 'Company Admin';
    return res.status(201).json({
      success: true,
      message: `Registration submitted. Your account is pending ${approvalTarget} approval.`,
      pending: true,
      user: safe(user),
    });
  } catch(e){ next(e); }
};

export const loginUser = async (req,res,next) => {
  try {
    const {email,password}=req.body;
    const user=await User.findOne({email:String(email||'').toLowerCase()}).select('+password');
    if(!user || !(await user.matchPassword(password||''))) return res.status(401).json({success:false,message:'Invalid email or password'});
    if(user.status==='pending') {
      const approvalTarget = (user.role === 'admin' || user.role === 'company_admin') ? 'Platform Admin' : 'Company Admin';
      return res.status(403).json({success:false,message:`Your account is pending ${approvalTarget} approval.`});
    }
    if(user.status!=='active') return res.status(403).json({success:false,message:'Your account is not active.'});
    const token=tokenFor(user);
    await createAuditLog({action:'AUTH_LOGIN_SUCCESS',user,resourceType:'User',resourceId:user._id,details:`${user.email} logged in`,req});
    res.json({success:true,message:'Login successful',token,user:safe(user)});
  }catch(e){next(e);}
};

export const getMe=async(req,res,next)=>{try{const u=await User.findById(req.user._id).populate('companyId','name code'); if(!u)return res.status(404).json({success:false,message:'User not found'}); res.json({success:true,user:{...safe(u),company:u.companyId}})}catch(e){next(e)}};
export const updatePassword=async(req,res,next)=>{try{const u=await User.findById(req.user._id).select('+password');if(!u)return res.status(404).json({success:false,message:'User not found'});if(!(await u.matchPassword(req.body.currentPassword||'')))return res.status(400).json({success:false,message:'Current password is incorrect'});if(!req.body.newPassword||req.body.newPassword.length<6)return res.status(400).json({success:false,message:'New password must be at least 6 characters'});u.password=req.body.newPassword;await u.save();res.json({success:true,message:'Password updated successfully'})}catch(e){next(e)}};
export const updateProfile=async(req,res,next)=>{try{const u=await User.findById(req.user._id);if(!u)return res.status(404).json({success:false,message:'User not found'});if(req.body.name)u.name=req.body.name.trim();if(req.body.email){const email=req.body.email.trim().toLowerCase();const exists=await User.findOne({email,_id:{$ne:u._id}});if(exists)return res.status(400).json({success:false,message:'Email already in use'});u.email=email;}await u.save();res.json({success:true,message:'Profile updated',user:safe(u)})}catch(e){next(e)}};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[AUTH] Forgot password OTP generation started for: ${normalizedEmail}`);

    const genericSuccessResponse = {
      success: true,
      message: 'OTP sent successfully. Please check your email.',
    };

    const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordOtpHash +resetPasswordOtpExpires +resetPasswordOtpAttempts +resetPasswordOtpLastSent');
    if (!user) {
      console.log(`[AUTH] No user found for ${normalizedEmail}, returning standard success response`);
      return res.json(genericSuccessResponse);
    }

    if (user.resetPasswordOtpLastSent) {
      const secondsSinceLastSent = (Date.now() - new Date(user.resetPasswordOtpLastSent).getTime()) / 1000;
      if (secondsSinceLastSent < 60) {
        const remaining = Math.ceil(60 - secondsSinceLastSent);
        console.warn(`[AUTH] Rate limit cooldown active for ${normalizedEmail}. ${remaining}s remaining`);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remaining} second${remaining > 1 ? 's' : ''} before requesting another OTP.`,
        });
      }
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Preserve previous state in case sending email fails
    const previousOtpHash = user.resetPasswordOtpHash;
    const previousOtpExpires = user.resetPasswordOtpExpires;
    const previousOtpLastSent = user.resetPasswordOtpLastSent;

    user.resetPasswordOtpHash = otpHash;
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.resetPasswordOtpAttempts = 0;
    user.resetPasswordOtpLastSent = new Date();
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordTokenExpires = undefined;

    await user.save();
    console.log(`[AUTH] OTP hashed and stored in DB for ${normalizedEmail}`);

    // Send OTP email - if email fails, revert DB state so user is not locked out
    try {
      console.log(`[AUTH] Email send started for ${normalizedEmail}`);
      await sendOtpEmail({ toEmail: user.email, otp });
      console.log(`[AUTH] Email send succeeded for ${normalizedEmail}`);
    } catch (emailErr) {
      console.error(`[AUTH] Email send failed for ${normalizedEmail}:`, emailErr.message);

      // Revert OTP and cooldown fields so user is not incorrectly rate-limited after failure
      user.resetPasswordOtpHash = previousOtpHash;
      user.resetPasswordOtpExpires = previousOtpExpires;
      user.resetPasswordOtpLastSent = previousOtpLastSent;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Unable to send OTP right now. Please try again later.',
      });
    }

    await createAuditLog({
      action: 'AUTH_FORGOT_PASSWORD_REQUESTED',
      user,
      resourceType: 'User',
      resourceId: user._id,
      details: `Password reset OTP requested for ${user.email}`,
      req,
    });

    console.log(`[AUTH] Forgot password API request completed for ${normalizedEmail}`);
    return res.json(genericSuccessResponse);
  } catch (e) {
    next(e);
  }
};

export const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit OTP are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordOtpHash +resetPasswordOtpExpires +resetPasswordOtpAttempts');

    if (!user || !user.resetPasswordOtpHash || !user.resetPasswordOtpExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new code.' });
    }

    if (user.resetPasswordOtpAttempts >= 5) {
      user.resetPasswordOtpHash = undefined;
      user.resetPasswordOtpExpires = undefined;
      user.resetPasswordOtpAttempts = 0;
      await user.save();
      return res.status(429).json({ success: false, message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.' });
    }

    if (Date.now() > new Date(user.resetPasswordOtpExpires).getTime()) {
      user.resetPasswordOtpHash = undefined;
      user.resetPasswordOtpExpires = undefined;
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    const inputOtpHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
    if (inputOtpHash !== user.resetPasswordOtpHash) {
      user.resetPasswordOtpAttempts = (user.resetPasswordOtpAttempts || 0) + 1;
      await user.save();
      const remainingAttempts = 5 - user.resetPasswordOtpAttempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordTokenHash = resetTokenHash;
    user.resetPasswordTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.resetPasswordOtpHash = undefined;
    user.resetPasswordOtpExpires = undefined;
    user.resetPasswordOtpAttempts = 0;
    await user.save();

    await createAuditLog({
      action: 'AUTH_OTP_VERIFIED_SUCCESS',
      user,
      resourceType: 'User',
      resourceId: user._id,
      details: `Password reset OTP successfully verified for ${user.email}`,
      req,
    });

    return res.json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken,
    });
  } catch (e) {
    next(e);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword, confirmPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token, email, and new password are required' });
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const tokenHash = crypto.createHash('sha256').update(String(resetToken).trim()).digest('hex');

    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordTokenHash: tokenHash,
      resetPasswordTokenExpires: { $gt: new Date() },
    }).select('+resetPasswordTokenHash +resetPasswordTokenExpires +password');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token. Please restart the forgot password process.' });
    }

    user.password = newPassword;
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save();

    await createAuditLog({
      action: 'AUTH_PASSWORD_RESET_SUCCESS',
      user,
      resourceType: 'User',
      resourceId: user._id,
      details: `Password successfully reset for ${user.email}`,
      req,
    });

    return res.json({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.',
    });
  } catch (e) {
    next(e);
  }
};

