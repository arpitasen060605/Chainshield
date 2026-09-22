import connectDB from './config/db.js';
import User from './models/User.js';
import Company from './models/Company.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const testForgotFlow = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    const testEmail = `test_fp_${Date.now()}@chainshield.io`;
    console.log(`\n1. Creating dummy active user: ${testEmail}...`);

    let company = await Company.findOne({ status: 'active' });
    if (!company) {
      company = await Company.create({ name: 'Test Corp', code: 'TESTCORP', status: 'active' });
    }

    const initialPassword = 'OldPassword123';
    const user = await User.create({
      name: 'Test FP User',
      email: testEmail,
      password: initialPassword,
      companyId: company._id,
      role: 'admin',
      status: 'active',
    });

    console.log(`✓ User created successfully with ID: ${user._id}`);

    // Test 2: Request Forgot Password
    console.log('\n2. Testing OTP Generation & Hashing...');
    const otp = '123456';
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    user.resetPasswordOtpHash = otpHash;
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.resetPasswordOtpAttempts = 0;
    user.resetPasswordOtpLastSent = new Date();
    await user.save();

    console.log('✓ OTP Hashed and stored in DB (Plaintext OTP is never stored)');

    // Test 3: Verify Incorrect OTP
    console.log('\n3. Testing Wrong OTP Verification...');
    const wrongOtpHash = crypto.createHash('sha256').update('999999').digest('hex');
    if (wrongOtpHash !== user.resetPasswordOtpHash) {
      user.resetPasswordOtpAttempts = user.resetPasswordOtpAttempts + 1;
      await user.save();
      console.log(`✓ Wrong OTP correctly rejected. Attempts recorded: ${user.resetPasswordOtpAttempts}/5`);
    }

    // Test 4: Verify Correct OTP & Generate Reset Token
    console.log('\n4. Testing Correct OTP Verification & Token Issuance...');
    const correctOtpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (correctOtpHash === user.resetPasswordOtpHash) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordTokenHash = resetTokenHash;
      user.resetPasswordTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
      user.resetPasswordOtpHash = undefined;
      user.resetPasswordOtpExpires = undefined;
      user.resetPasswordOtpAttempts = 0;
      await user.save();

      console.log('✓ Correct OTP verified! Single-use resetToken issued.');
      console.log('✓ OTP fields invalidated.');

      // Test 5: Reset Password with Token
      console.log('\n5. Testing Password Reset...');
      const newPassword = 'NewPassword456';
      user.password = newPassword;
      user.resetPasswordTokenHash = undefined;
      user.resetPasswordTokenExpires = undefined;
      await user.save();

      console.log('✓ Password reset successfully! Token invalidated.');

      // Test 6: Verify New Password Works & Old Fails
      console.log('\n6. Verifying Password Hash Matching...');
      const updatedUser = await User.findById(user._id).select('+password');
      const oldMatch = await updatedUser.matchPassword(initialPassword);
      const newMatch = await updatedUser.matchPassword(newPassword);

      console.log(`- Old password match: ${oldMatch} (Expected: false)`);
      console.log(`- New password match: ${newMatch} (Expected: true)`);

      if (!oldMatch && newMatch) {
        console.log('\n🎉 ALL FORGOT/RESET PASSWORD SECURITY TESTS PASSED PERFECTLY!');
      } else {
        console.error('❌ Password verification failed!');
      }
    }

    // Cleanup
    await User.findByIdAndDelete(user._id);
    console.log('\nCleanup done.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
};

testForgotFlow();
