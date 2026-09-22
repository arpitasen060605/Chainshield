import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import { forgotPassword, verifyResetOtp, resetPassword } from "../services/authService";

const ForgotPassword = () => {
  const navigate = useNavigate();

  // Step state: 1 = Email, 2 = Verify OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);

  const otpInputsRef = useRef([]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email || !email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      const res = await forgotPassword(email.trim());
      setLoading(false);
      setInfoMessage(res.message || "If an account with that email exists, a 6-digit OTP code has been sent.");
      setStep(2);
      setCooldown(60); // 60 seconds cooldown for resend
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || "Failed to send reset OTP code. Please try again.";
      setError(msg);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      const res = await forgotPassword(email.trim());
      setLoading(false);
      setInfoMessage(res.message || "A new 6-digit OTP code has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      setCooldown(60);
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || "Failed to resend OTP. Please try again.";
      setError(msg);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Handle pasted content
    if (value.length > 1) {
      const pastedDigits = value.slice(0, 6).split("");
      pastedDigits.forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(pastedDigits.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto move to next input box
    if (value !== "" && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit OTP code.");
      return;
    }

    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      const res = await verifyResetOtp(email.trim(), fullOtp);
      setLoading(false);
      if (res.success && res.resetToken) {
        setResetToken(res.resetToken);
        setStep(3);
      } else {
        setError(res.message || "Failed to verify OTP.");
      }
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || "Invalid or expired OTP. Please try again.";
      setError(msg);
    }
  };

  // Handle Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await resetPassword({
        email: email.trim(),
        resetToken,
        newPassword,
        confirmPassword,
      });
      setLoading(false);
      if (res.success) {
        setStep(4);
      } else {
        setError(res.message || "Failed to reset password.");
      }
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || "Failed to reset password. Token may have expired.";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#050d18] text-white flex">
      {/* ================= LEFT SECTION ================= */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Shield size={28} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ChainShield</h1>
              <p className="text-xs text-slate-400">Secure. Verify. Trust.</p>
            </div>
          </div>

          {/* Main content */}
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs">
              <ShieldCheck size={14} />
              Identity & Access Verification
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
              Reset your password
              <span className="text-blue-500"> securely.</span>
            </h2>

            <p className="mt-6 text-slate-400 leading-relaxed text-sm xl:text-base">
              ChainShield requires multi-factor OTP verification via Brevo SMTP to verify your security identity before changing account access credentials.
            </p>
          </div>

          {/* Security features */}
          <div className="grid grid-cols-2 gap-4 mt-12 max-w-lg">
            <div className="p-4 rounded-xl bg-[#0b1726] border border-[#1c3045]">
              <KeyRound size={20} className="text-blue-400 mb-3" />
              <h3 className="text-sm font-semibold">6-Digit Hashed OTP</h3>
              <p className="text-xs text-slate-500 mt-1">Single-use verification code</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0b1726] border border-[#1c3045]">
              <ShieldCheck size={20} className="text-green-400 mb-3" />
              <h3 className="text-sm font-semibold">Rate Limited</h3>
              <p className="text-xs text-slate-500 mt-1">Anti-brute-force protection</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RIGHT SECTION ================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Shield size={25} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">ChainShield</h1>
              <p className="text-xs text-slate-500">Secure. Verify. Trust.</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-[#0b1726] border border-[#203246] rounded-2xl p-7 sm:p-9 shadow-2xl shadow-black/20">
            {/* Steps Progress Indicator */}
            {step < 4 && (
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#1c3045]">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                        step === s
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30"
                          : step > s
                          ? "bg-green-500/20 border border-green-500/40 text-green-400"
                          : "bg-[#07111f] border border-[#203246] text-slate-500"
                      }`}
                    >
                      {step > s ? "✓" : s}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        step === s ? "text-blue-400" : "text-slate-500"
                      }`}
                    >
                      {s === 1 ? "Email" : s === 2 ? "Verify OTP" : "Reset Password"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
                <AlertCircle size={18} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Info Message */}
            {infoMessage && (
              <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm flex items-center gap-3">
                <ShieldCheck size={18} className="shrink-0 text-blue-400" />
                <span>{infoMessage}</span>
              </div>
            )}

            {/* STEP 1: ENTER EMAIL */}
            {step === 1 && (
              <div>
                <div className="mb-7">
                  <h2 className="text-2xl font-bold">Forgot Password</h2>
                  <p className="text-sm text-slate-400 mt-2">
                    Enter your registered email address to receive a 6-digit OTP verification code.
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="investigator@example.com"
                        required
                        className="
                          w-full h-12 pl-11 pr-4 rounded-lg bg-[#07111f]
                          border border-[#263a4e] text-sm text-white
                          placeholder:text-slate-600 outline-none transition
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10
                        "
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-500
                      disabled:bg-blue-800 disabled:cursor-not-allowed
                      transition flex items-center justify-center gap-2
                      text-sm font-semibold shadow-lg shadow-blue-600/10 cursor-pointer
                    "
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending OTP Code...
                      </>
                    ) : (
                      <>
                        Send Security OTP
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-7 text-center">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
                  >
                    <ArrowLeft size={14} />
                    Back to Sign In
                  </Link>
                </div>
              </div>
            )}

            {/* STEP 2: VERIFY OTP */}
            {step === 2 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Enter Verification Code</h2>
                  <p className="text-sm text-slate-400 mt-2">
                    We've sent a 6-digit security OTP code to{" "}
                    <span className="text-blue-400 font-mono font-medium">{email}</span>.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* OTP Digits Input Boxes */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-3 text-center uppercase tracking-wider">
                      6-Digit Security OTP
                    </label>
                    <div className="flex justify-between gap-2">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputsRef.current[idx] = el)}
                          type="text"
                          maxLength={6}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="
                            w-11 sm:w-12 h-14 rounded-xl bg-[#07111f]
                            border border-[#263a4e] text-center text-xl font-bold
                            text-blue-400 font-mono outline-none transition
                            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                          "
                        />
                      ))}
                    </div>
                  </div>

                  {/* Resend & Cooldown section */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Didn't receive the code?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={cooldown > 0 || loading}
                      className={`font-semibold flex items-center gap-1 cursor-pointer transition ${
                        cooldown > 0 || loading
                          ? "text-slate-600 cursor-not-allowed"
                          : "text-blue-400 hover:text-blue-300"
                      }`}
                    >
                      <RotateCcw size={13} className={loading ? "animate-spin" : ""} />
                      {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend OTP Code"}
                    </button>
                  </div>

                  {/* Submit Verification */}
                  <button
                    type="submit"
                    disabled={loading || otp.join("").length !== 6}
                    className="
                      w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-500
                      disabled:bg-blue-800/60 disabled:cursor-not-allowed
                      transition flex items-center justify-center gap-2
                      text-sm font-semibold shadow-lg shadow-blue-600/10 cursor-pointer
                    "
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying OTP...
                      </>
                    ) : (
                      <>
                        Verify OTP & Continue
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError("");
                      setInfoMessage("");
                    }}
                    className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
                  >
                    <ArrowLeft size={14} />
                    Change Email Address
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: RESET PASSWORD */}
            {step === 3 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Create New Password</h2>
                  <p className="text-sm text-slate-400 mt-2">
                    Enter a strong new password for your ChainShield account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        required
                        minLength={6}
                        className="
                          w-full h-12 pl-11 pr-11 rounded-lg bg-[#07111f]
                          border border-[#263a4e] text-sm text-white
                          placeholder:text-slate-600 outline-none transition
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10
                        "
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        required
                        minLength={6}
                        className="
                          w-full h-12 pl-11 pr-11 rounded-lg bg-[#07111f]
                          border border-[#263a4e] text-sm text-white
                          placeholder:text-slate-600 outline-none transition
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10
                        "
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Reset */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-500
                      disabled:bg-blue-800 disabled:cursor-not-allowed
                      transition flex items-center justify-center gap-2
                      text-sm font-semibold shadow-lg shadow-blue-600/10 cursor-pointer
                    "
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        Reset Password
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={36} />
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">Password Updated!</h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-8">
                  Your ChainShield account password has been successfully updated. You can now log in using your new credentials.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="
                    w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-500
                    transition flex items-center justify-center gap-2
                    text-sm font-semibold shadow-lg shadow-blue-600/10 cursor-pointer
                  "
                >
                  Return to Sign In
                  <ArrowRight size={17} />
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-600 mt-6">
            © 2026 ChainShield. Secure evidence management platform.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
