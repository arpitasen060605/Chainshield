import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { createIncident } from "../../services/incidentService";
import { Plus, ArrowLeft, Shield, AlertCircle, Loader2 } from "lucide-react";

export default function CreateIncident() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    severity: "high",
    threatVector: "Unauthorized Access",
    affectedSystems: "",
    impact: "",
    description: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Incident title is required.";
    } else if (formData.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters.";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Incident description is required.";
    } else if (formData.description.trim().length < 15) {
      newErrors.description = "Description must be at least 15 characters long.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setServerError("");

      const affectedSystemsArray = formData.affectedSystems
        ? formData.affectedSystems
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        severity: formData.severity.toLowerCase(),
        threatVector: formData.threatVector,
        affectedSystems: affectedSystemsArray,
        impact: formData.impact.trim(),
      };

      const res = await createIncident(payload);

      if (res.success && res.incident) {
        const targetId = res.incident.incidentId || res.incident._id || res.incident.id;
        navigate(`/incidents/${targetId}`);
      } else {
        setServerError(res.message || "Failed to create incident");
      }
    } catch (err) {
      console.error("[CreateIncident] API error:", err);
      setServerError(
        err.response?.data?.message || "Failed to log security incident. Access denied or invalid input."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Back Button & Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/incidents")}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium mb-3 transition cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to All Incidents
        </button>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Shield className="text-blue-500" size={28} /> Create New Security Incident
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Register a new cyber security case for triage and evidence tracking.
        </p>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-400 text-xs max-w-4xl">
          <AlertCircle size={18} className="shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Form Container */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#0b1827] border border-[#203246] rounded-2xl p-6 shadow-2xl text-xs max-w-4xl space-y-5"
      >
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">
            Incident Title *
          </label>
          <input
            type="text"
            name="title"
            placeholder="e.g. Unauthorized Access Detected on Auth Server"
            value={formData.title}
            onChange={handleChange}
            className={`w-full bg-[#071322] border ${
              errors.title ? "border-red-500" : "border-[#1d334c]"
            } rounded-lg px-3.5 py-2.5 text-slate-200 outline-none focus:border-blue-500 transition`}
          />
          {errors.title && (
            <p className="text-red-400 text-[11px] mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.title}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Threat Vector / Category
            </label>
            <select
              name="threatVector"
              value={formData.threatVector}
              onChange={handleChange}
              className="w-full bg-[#071322] border border-[#1d334c] rounded-lg px-3.5 py-2.5 text-slate-200 outline-none cursor-pointer"
            >
              <option value="Unauthorized Access">Unauthorized Access</option>
              <option value="Phishing">Phishing</option>
              <option value="Malware">Malware</option>
              <option value="Credential Compromise">Credential Compromise</option>
              <option value="DDoS">DDoS</option>
              <option value="Insider Threat">Insider Threat</option>
              <option value="Ransomware">Ransomware</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Severity Level *
            </label>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              className="w-full bg-[#071322] border border-[#1d334c] rounded-lg px-3.5 py-2.5 text-slate-200 outline-none cursor-pointer"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">
            Affected Systems / Assets (Comma Separated)
          </label>
          <input
            type="text"
            name="affectedSystems"
            placeholder="e.g. Production Server, Auth Service, Workstation WS-04"
            value={formData.affectedSystems}
            onChange={handleChange}
            className="w-full bg-[#071322] border border-[#1d334c] rounded-lg px-3.5 py-2.5 text-slate-200 outline-none focus:border-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">
            Initial Impact Analysis
          </label>
          <input
            type="text"
            name="impact"
            placeholder="e.g. Potential data exposure suspected on internal subnet."
            value={formData.impact}
            onChange={handleChange}
            className="w-full bg-[#071322] border border-[#1d334c] rounded-lg px-3.5 py-2.5 text-slate-200 outline-none focus:border-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">
            Incident Description & Context *
          </label>
          <textarea
            name="description"
            rows="5"
            placeholder="Detailed description of the security breach, affected hosts, potential impact, and initial triage notes..."
            value={formData.description}
            onChange={handleChange}
            className={`w-full bg-[#071322] border ${
              errors.description ? "border-red-500" : "border-[#1d334c]"
            } rounded-lg p-3 text-slate-200 outline-none focus:border-blue-500 transition leading-relaxed`}
          />
          {errors.description && (
            <p className="text-red-400 text-[11px] mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1a2e45]">
          <button
            type="button"
            onClick={() => navigate("/incidents")}
            className="px-4 py-2 bg-[#102236] hover:bg-[#172e48] text-slate-300 rounded-lg font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition flex items-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving Incident...
              </>
            ) : (
              <>
                <Plus size={16} /> Save & Create Incident
              </>
            )}
          </button>
        </div>
      </form>
    </Layout>
  );
}
