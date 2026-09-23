import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
      setLoading(false);
      navigate("/dashboard");
    } catch (err) {
      setLoading(false);
      const message =
        err.response?.data?.message ||
        "Failed to sign in. Please check your credentials or backend server.";
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

          {/* Main heading */}
          <div className="max-w-lg">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs">
              <ShieldCheck size={14} />
              Secure Evidence Management
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
              Protect your
              <span className="text-blue-500"> digital evidence.</span>
            </h2>

            <p className="mt-6 text-slate-400 leading-relaxed text-sm xl:text-base">
              ChainShield helps security teams securely manage cyber
              incidents, preserve digital evidence integrity, and verify
              evidence using cryptographic hashing and blockchain technology.
            </p>
          </div>

          {/* Security features */}
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


          {/* Login Card */}
          <div className="bg-[#0b1726] border border-[#203246] rounded-2xl p-7 sm:p-9 shadow-2xl shadow-black/20">

            <div className="mb-8">

              <h2 className="text-2xl font-bold">
                Welcome back
              </h2>

              <p className="text-sm text-slate-400 mt-2">
                Sign in to access your ChainShield account.
              </p>

            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
                <AlertCircle size={18} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>

                <div className="relative">
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

                <div className="flex justify-between items-center mb-2">

                  <label className="text-sm font-medium text-slate-300">
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Forgot password?
                  </Link>

                </div>

                <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
          className="
            w-full
            h-12
            pl-12
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
                    onClick={() => setShowPassword(!showPassword)}
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


              {/* Remember me */}
              <div className="flex items-center">

                <label className="flex items-center gap-2 cursor-pointer">

                  <input
                    type="checkbox"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                    className="w-4 h-4 accent-blue-600"
                  />

                  <span className="text-xs text-slate-400">
                    Remember me
                  </span>

                </label>

              </div>


              {/* Login Button */}
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
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={17} />
                  </>
                )}

              </button>

            </form>


            {/* Register */}
            <div className="mt-7 text-center">

              <p className="text-sm text-slate-500">

                Don't have an account?{" "}

                <Link
                  to="/register"
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Create account
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

export default Login;