import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [registrationType, setRegistrationType] = useState("employee");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    companyCode: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        name: formData.name,
        companyCode: formData.companyCode,
        email: formData.email,
        password: formData.password,
        registrationType,
      });

      setLoading(false);
      if (result?.pending) {
        setError(
          result.message ||
            (registrationType === "admin"
              ? "Registration submitted. Your account is pending Platform Admin approval."
              : "Registration submitted. Your account is pending Company Admin approval.")
        );
        setFormData({ name: "", companyCode: "", email: "", password: "", confirmPassword: "" });
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setLoading(false);
      const message =
        err.response?.data?.message ||
        "Failed to create account. Please check input or server connection.";
      setError(message);
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

              <Shield
                size={28}
                className="text-blue-400"
              />

            </div>

            <div>

              <h1 className="text-2xl font-bold tracking-tight">
                ChainShield
              </h1>

              <p className="text-xs text-slate-400">
                Secure. Verify. Trust.
              </p>

            </div>

          </div>


          {/* Main Content */}

          <div className="max-w-lg">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs">

              <ShieldCheck size={14} />

              Secure Evidence Management

            </div>


            <h2 className="text-4xl xl:text-5xl font-bold leading-tight">

              Start securing your

              <span className="text-blue-500">
                {" "}digital evidence.
              </span>

            </h2>


            <p className="mt-6 text-slate-400 leading-relaxed text-sm xl:text-base">

              Join ChainShield to securely manage cyber incidents,
              preserve evidence integrity, and maintain trustworthy
              investigation records.

            </p>

          </div>


          {/* Security Features */}

          <div className="grid grid-cols-2 gap-4 mt-12 max-w-lg">

            <div className="p-4 rounded-xl bg-[#0b1726] border border-[#1c3045]">

              <ShieldCheck
                size={20}
                className="text-green-400 mb-3"
              />

              <h3 className="text-sm font-semibold">
                Evidence Integrity
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                SHA-256 verification
              </p>

            </div>


            <div className="p-4 rounded-xl bg-[#0b1726] border border-[#1c3045]">

              <Shield
                size={20}
                className="text-blue-400 mb-3"
              />

              <h3 className="text-sm font-semibold">
                Blockchain Secured
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Tamper-resistant records
              </p>

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

              <Shield
                size={25}
                className="text-blue-400"
              />

            </div>

            <div>

              <h1 className="text-xl font-bold">
                ChainShield
              </h1>

              <p className="text-xs text-slate-500">
                Secure. Verify. Trust.
              </p>

            </div>

          </div>


          {/* Register Card */}

          <div className="bg-[#0b1726] border border-[#203246] rounded-2xl p-7 sm:p-9 shadow-2xl shadow-black/20">

            <div className="mb-7">

              <h2 className="text-2xl font-bold">
                Create account
              </h2>

              <p className="text-sm text-slate-400 mt-2">
                Create your ChainShield investigator account.
              </p>

            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
                <AlertCircle size={18} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Registration Type Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3 p-1 bg-[#07111f] border border-[#263a4e] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRegistrationType("employee")}
                    className={`py-2.5 px-3 rounded-lg text-xs font-mono font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                      registrationType === "employee"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <User size={15} />
                    Sign Up as Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegistrationType("admin")}
                    className={`py-2.5 px-3 rounded-lg text-xs font-mono font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                      registrationType === "admin"
                        ? "bg-purple-600 text-white shadow-lg"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <ShieldCheck size={15} />
                    Sign Up as Admin
                  </button>
                </div>
              </div>

              {/* Full Name */}

              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>

                <div className="relative">

                  <User
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="
                      w-full
                      h-12
                      pl-11
                      pr-4
                      rounded-lg
                      bg-[#07111f]
                      border border-[#263a4e]
                      text-sm
                      text-white
                      placeholder:text-slate-600
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-500/10
                    "
                  />

                </div>

              </div>


              {/* Company Code */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Code</label>
                <input
                  type="text"
                  name="companyCode"
                  value={formData.companyCode}
                  onChange={handleChange}
                  placeholder="e.g. TECHNOVA"
                  required
                  className="w-full h-12 px-4 rounded-lg bg-[#07111f] border border-[#263a4e] text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
                <p className="text-xs text-slate-500 mt-2">Your company administrator provides this code.</p>
              </div>

              {/* Email */}

              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="investigator@example.com"
                    required
                    className="
                      w-full
                      h-12
                      pl-11
                      pr-4
                      rounded-lg
                      bg-[#07111f]
                      border border-[#263a4e]
                      text-sm
                      text-white
                      placeholder:text-slate-600
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-500/10
                    "
                  />

                </div>

              </div>


              {/* Password */}

              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    minLength={6}
                    className="
                      w-full
                      h-12
                      pl-11
                      pr-11
                      rounded-lg
                      bg-[#07111f]
                      border border-[#263a4e]
                      text-sm
                      text-white
                      placeholder:text-slate-600
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-500/10
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-slate-500
                      hover:text-slate-300
                    "
                  >

                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>

              </div>


              {/* Confirm Password */}

              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    className="
                      w-full
                      h-12
                      pl-11
                      pr-11
                      rounded-lg
                      bg-[#07111f]
                      border border-[#263a4e]
                      text-sm
                      text-white
                      placeholder:text-slate-600
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-500/10
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-slate-500
                      hover:text-slate-300
                    "
                  >

                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>

              </div>


              {/* Terms */}

              <label className="flex items-start gap-2 cursor-pointer">

                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-0.5 accent-blue-600"
                />

                <span className="text-xs text-slate-500 leading-relaxed">
                  I agree to the ChainShield terms and
                  acknowledge the security policies.
                </span>

              </label>


              {/* Register Button */}

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  h-12
                  rounded-lg
                  bg-blue-600
                  hover:bg-blue-500
                  disabled:bg-blue-800
                  disabled:cursor-not-allowed
                  transition
                  flex
                  items-center
                  justify-center
                  gap-2
                  text-sm
                  font-semibold
                  shadow-lg
                  shadow-blue-600/10
                "
              >

                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={17} />
                  </>
                )}

              </button>

            </form>


            {/* Login */}

            <div className="mt-7 text-center">

              <p className="text-sm text-slate-500">

                Already have an account?{" "}

                <Link
                  to="/"
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Sign in
                </Link>

              </p>

            </div>

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

export default Register;