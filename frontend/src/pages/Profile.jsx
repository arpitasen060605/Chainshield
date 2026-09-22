import { useState } from "react";
import {
  User,
  Mail,
  Shield,
  CalendarDays,
  Edit3,
  Lock,
  CheckCircle2,
  Activity,
  LogOut,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Key,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { useAuth } from "../context/AuthContext";
import { updatePassword } from "../services/authService";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();

  // Profile update form state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Password update form state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!profileName.trim() || !profileEmail.trim()) {
      setProfileError("Full Name and Email Address are required.");
      return;
    }

    try {
      setProfileLoading(true);
      const res = await updateProfile({ name: profileName, email: profileEmail });
      if (res.success) {
        setProfileSuccess(res.message || "Profile updated successfully.");
        setShowEditProfile(false);
      } else {
        setProfileError(res.message || "Failed to update profile.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update profile.";
      setProfileError(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CS";

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "August 2026";

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Frontend Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("All password fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage("New password cannot be the same as your current password.");
      return;
    }

    try {
      setLoading(true);
      const res = await updatePassword({ currentPassword, newPassword });

      if (res.success) {
        setSuccessMessage(res.message || "Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setErrorMessage(res.message || "Failed to update password.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to update password. Please check your credentials and try again.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            My Profile
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            Manage your ChainShield account and profile information.
          </p>
        </div>

        <button
          onClick={() => {
            setProfileName(user?.name || "");
            setProfileEmail(user?.email || "");
            setShowEditProfile(!showEditProfile);
            setProfileError("");
            setProfileSuccess("");
          }}
          className="
            h-10 px-4 rounded-lg
            border border-blue-600/50
            bg-blue-600/10
            text-blue-400
            hover:bg-blue-600/20
            transition
            flex items-center justify-center gap-2
            text-sm font-medium
            cursor-pointer
          "
        >
          <Edit3 size={16} />
          {showEditProfile ? "Cancel Edit" : "Edit Profile"}
        </button>
      </div>


      {/* Profile Overview */}
      <div
        className="
          bg-[#0b1726]
          border border-[#203246]
          rounded-xl
          p-6
          flex items-center gap-5
          mb-5
        "
      >

        {/* Avatar */}
        <div
          className="
            w-20 h-20
            rounded-full
            bg-gradient-to-br from-blue-600 to-blue-900
            border-2 border-blue-500/40
            flex items-center justify-center
            text-xl font-bold
            shadow-lg shadow-blue-900/20
          "
        >
          {initials}
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold">
            {user?.name || "Investigator"}
          </h2>

          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <Shield size={14} className="text-blue-400" />
            {user?.role || "Security Investigator"}
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Active Account
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="
            h-10 px-4 rounded-lg
            border border-red-500/30
            bg-red-500/10
            text-red-400
            hover:bg-red-500/20
            transition
            flex items-center justify-center gap-2
            text-sm font-medium
            cursor-pointer
          "
        >
          <LogOut size={16} />
          Sign Out
        </button>

      </div>


      {/* Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">


        {/* Personal Information */}
        <div
          className="
            bg-[#0b1726]
            border border-[#203246]
            rounded-xl
            p-5
          "
        >

          {/* Card Header */}
          <div className="flex items-center gap-3 mb-6">

            <div
              className="
                w-10 h-10
                rounded-lg
                bg-blue-500/10
                text-blue-400
                flex items-center justify-center
              "
            >
              <User size={18} />
            </div>

            <div>
              <h3 className="text-sm font-semibold">
                Personal Information
              </h3>

              <p className="text-[11px] text-slate-500 mt-1">
                Your basic account information.
              </p>
            </div>

          </div>

          {/* Error & Success Feedback */}
          {profileError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2.5 text-xs text-red-400">
              <AlertCircle size={16} className="shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2.5 text-xs text-emerald-400">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {/* Fields / Form */}
          {showEditProfile ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full h-10 px-3.5 rounded-lg border border-[#203449] bg-[#050f1b] text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-10 px-3.5 rounded-lg border border-[#203449] bg-[#050f1b] text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition flex items-center gap-2 disabled:bg-blue-800/50 cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  {profileLoading && <Loader2 size={14} className="animate-spin" />}
                  {profileLoading ? "Saving..." : "Save Profile"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProfile(false);
                    setProfileError("");
                  }}
                  className="h-9 px-4 rounded-lg border border-[#263a4e] bg-[#071321] text-slate-300 hover:bg-[#112238] font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <ProfileField
                label="Full Name"
                icon={<User size={16} />}
                value={user?.name || "Investigator"}
              />

              <ProfileField
                label="Email Address"
                icon={<Mail size={16} />}
                value={user?.email || "investigator@example.com"}
              />

              <ProfileField
                label="Role"
                icon={<Shield size={16} />}
                value={user?.role || "Investigator"}
              />
            </div>
          )}

        </div>


        {/* Account Information */}
        <div
          className="
            bg-[#0b1726]
            border border-[#203246]
            rounded-xl
            p-5
          "
        >

          {/* Card Header */}
          <div className="flex items-center gap-3 mb-5">

            <div
              className="
                w-10 h-10
                rounded-lg
                bg-green-500/10
                text-green-400
                flex items-center justify-center
              "
            >
              <Activity size={18} />
            </div>

            <div>
              <h3 className="text-sm font-semibold">
                Account Information
              </h3>

              <p className="text-[11px] text-slate-500 mt-1">
                Account status and activity.
              </p>
            </div>

          </div>


          <div className="divide-y divide-[#182b3e]">

            <AccountRow
              icon={<CheckCircle2 size={17} />}
              label="Account Status"
              value={
                <span
                  className="
                    px-2.5 py-1
                    rounded-md
                    bg-green-500/10
                    text-green-400
                    text-[10px]
                    font-semibold
                  "
                >
                  Active
                </span>
              }
            />

            <AccountRow
              icon={<CalendarDays size={17} />}
              label="Member Since"
              value={memberSince}
            />

            <AccountRow
              icon={<Activity size={17} />}
              label="Last Activity"
              value="Today"
            />

          </div>

        </div>

      </div>


      {/* Security */}
      <div
        className="
          bg-[#0b1726]
          border border-[#203246]
          rounded-xl
          p-5
        "
      >

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">

          <div
            className="
              w-10 h-10
              rounded-lg
              bg-purple-500/10
              text-purple-400
              flex items-center justify-center
            "
          >
            <Lock size={18} />
          </div>

          <div>
            <h3 className="text-sm font-semibold">
              Security
            </h3>

            <p className="text-[11px] text-slate-500 mt-1">
              Manage your account security settings.
            </p>
          </div>

        </div>


        {/* Password */}
        <div className="py-5 border-t border-[#182b3e] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Key size={15} className="text-purple-400" />
                Password & Security Credentials
              </h4>

              <p className="text-[11px] text-slate-500 mt-1">
                Update your login password securely using your current password verification.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPasswordForm(!showPasswordForm);
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className="
                h-9 px-4
                rounded-lg
                border border-[#2a4057]
                bg-[#081522]
                text-slate-300
                hover:bg-[#112238]
                transition
                text-xs
                font-medium
                cursor-pointer
                w-fit
              "
            >
              {showPasswordForm ? "Cancel" : "Change Password"}
            </button>
          </div>

          {/* Form UI */}
          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} className="mt-4 p-4 bg-[#071321] border border-[#1b314b] rounded-xl space-y-4 animate-fade-in">
              {/* Feedback Notifications */}
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2.5 text-xs text-red-400">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2.5 text-xs text-emerald-400">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current Password */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    Current Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-10 px-3.5 pr-10 rounded-lg border border-[#203449] bg-[#050f1b] text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    New Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-10 px-3.5 pr-10 rounded-lg border border-[#203449] bg-[#050f1b] text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    Confirm New Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-10 px-3.5 pr-10 rounded-lg border border-[#203449] bg-[#050f1b] text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    h-9 px-5
                    rounded-lg
                    bg-purple-600 hover:bg-purple-500
                    disabled:bg-purple-800/50 disabled:cursor-not-allowed
                    text-white
                    font-medium text-xs
                    transition
                    flex items-center gap-2
                    shadow-lg shadow-purple-500/20
                    cursor-pointer
                  "
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Updating Password..." : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </div>



        {/* 2FA */}
        <div
          className="
            py-5
            border-t border-[#182b3e]
            flex flex-col sm:flex-row
            sm:items-center
            sm:justify-between
            gap-4
          "
        >

          <div>
            <h4 className="text-sm font-medium">
              Two-Factor Authentication
            </h4>

            <p className="text-[11px] text-slate-500 mt-1">
              Add an extra layer of security to your account.
            </p>
          </div>

          <span
            className="
              w-fit
              px-3 py-1.5
              rounded-md
              bg-slate-500/10
              text-slate-400
              text-[10px]
            "
          >
            Coming Soon
          </span>

        </div>

      </div>
    </Layout>
  );
}


/* ================= REUSABLE COMPONENTS ================= */

function ProfileField({ label, icon, value }) {
  return (
    <div>
      <label className="block text-[11px] text-slate-500 mb-2">
        {label}
      </label>

      <div
        className="
          min-h-10
          px-3
          rounded-lg
          border border-[#203449]
          bg-[#081522]
          flex items-center gap-3
          text-xs text-slate-300
        "
      >
        <span className="text-slate-500">
          {icon}
        </span>

        {value}
      </div>
    </div>
  );
}


function AccountRow({ icon, label, value }) {
  return (
    <div
      className="
        min-h-14
        flex items-center
        justify-between
        gap-4
      "
    >

      <div className="flex items-center gap-3 text-xs text-slate-400">

        <span className="text-slate-500">
          {icon}
        </span>

        {label}

      </div>

      <div className="text-xs text-slate-300">
        {value}
      </div>

    </div>
  );
}