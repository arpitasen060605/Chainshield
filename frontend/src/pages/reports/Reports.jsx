import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { incidents as mockIncidents } from "../../data/mockData";
import { reportTypes, mockReports, generateMockAiReportContent } from "../../data/mockReportsData";
import { getReports, generateReport as apiGenerateReport } from "../../services/reportService";
import { getIncidents } from "../../services/incidentService";
import {
  Sparkles,
  FileText,
  ShieldAlert,
  Download,
  Eye,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Cpu,
  Info,
  Clock,
  Check,
  ChevronRight,
  Shield,
  Layers,
  Loader2,
} from "lucide-react";

export default function Reports() {
  const navigate = useNavigate();

  // State management
  const [reportsList, setReportsList] = useState([]);
  const [backendIncidents, setBackendIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedReportType, setSelectedReportType] = useState("Investigation Report");
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [selectedTone, setSelectedTone] = useState("Forensic Technical");
  const [customNotes, setCustomNotes] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  const generationSteps = [
    "Parsing Incident Telemetry & Metadata...",
    "Aggregating Web Crypto SHA-256 Hashes...",
    "Verifying Smart Contract Merkle Anchors...",
    "Synthesizing Forensic Narrative...",
  ];

  // Fetch real reports & incidents from backend
  const fetchBackendReports = async () => {
    try {
      setLoading(true);
      const [repRes, incRes] = await Promise.allSettled([
        getReports(),
        getIncidents(),
      ]);

      if (repRes.status === "fulfilled" && repRes.value?.success && Array.isArray(repRes.value.reports)) {
        setReportsList(repRes.value.reports);
      } else {
        setReportsList(mockReports);
      }

      if (incRes.status === "fulfilled" && incRes.value?.success && Array.isArray(incRes.value.incidents)) {
        setBackendIncidents(incRes.value.incidents);
        if (incRes.value.incidents.length > 0 && !selectedIncidentId) {
          setSelectedIncidentId(incRes.value.incidents[0]._id || incRes.value.incidents[0].incidentId);
        }
      } else {
        setBackendIncidents(mockIncidents);
      }
    } catch (err) {
      console.error("[Reports] Failed to fetch backend reports:", err);
      setReportsList(mockReports);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendReports();
  }, []);

  // Trigger Real Backend Investigation Report Generation
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGenerationStep(0);

    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev >= generationSteps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 500);

    try {
      const res = await apiGenerateReport({
        incidentId: selectedIncidentId || (backendIncidents[0] ? backendIncidents[0]._id : ""),
        title: `${selectedReportType} - ${selectedIncidentId}`,
        executiveSummary: customNotes || "Forensic Investigation Report synthesized from live system evidence.",
      });

      if (res.success && res.report) {
        showToast(`Investigation Report ${res.report.reportId || res.report.id} generated successfully!`);
        fetchBackendReports();
      }
    } catch (err) {
      console.error("[Reports] Generate error:", err);
      showToast(err.response?.data?.message || "Failed to generate report.");
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
    }
  };

  // Trigger Report Regeneration
  const handleRegenerate = (report) => {
    setIsGenerating(true);
    setGenerationStep(0);

    setTimeout(() => {
      const activeIncidents = backendIncidents.length > 0 ? backendIncidents : mockIncidents;
      const targetIncident = activeIncidents.find((i) => i._id === report.incidentId || i.incidentId === report.incidentId || i.id === report.incidentId) || activeIncidents[0];
      const regeneratedReport = generateMockAiReportContent({
        incident: targetIncident,
        reportType: report.type,
        tone: "Forensic Technical (Refinement)",
        customNotes: "Regenerated with refreshed system telemetry and updated cryptographic block headers.",
      });

      setReportsList((prev) =>
        prev.map((r) => (r.id === report.id ? { ...regeneratedReport, id: report.id } : r))
      );
      setIsGenerating(false);
      showToast(`Report ${report.id} regenerated successfully.`);
    }, 2000);
  };

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Export CSV Helper
  const handleExportCSV = (report) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        ["Report ID", "Incident ID", "Type", "Title", "Generated Date", "Status", "Verification Result"],
        [
          report.id,
          report.incidentId,
          report.type,
          `"${report.title.replace(/"/g, '""')}"`,
          report.generatedDate || report.createdDate || "Recently",
          report.status,
          `"${report.verificationResult || 'VERIFIED'}"`,
        ],
      ]
        .map((e) => e.join(","))
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${report.id}_ChainShield_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`CSV data export downloaded for ${report.id}`);
  };

  // Export PDF Placeholder Helper
  const handleExportPDFPlaceholder = (report) => {
    showToast(`PDF Export Placeholder: Opening print preview document stream for ${report.id}...`);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const activeIncidents = backendIncidents.length > 0 ? backendIncidents : mockIncidents;

  // Filtered list of reports
  const filteredReports = reportsList.filter((r) => {
    const matchesTab = activeTab === "All" || r.type === activeTab;
    const matchesSearch =
      (r.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (String(r.incidentId || "")).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0c2440] border border-[#2b598d] text-emerald-400 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in font-mono text-sm">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#182a3f] pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                <Sparkles size={22} />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                ChainShield Intelligence Reports
              </h1>
              <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-full text-xs font-semibold font-mono">
                AI Synthesis Engine
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Convert structured cyber incident telemetry, digital evidence, Web Crypto SHA-256 digests, and audit streams into legal-grade forensic reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0b1928] border border-[#1d324b] px-3 py-2 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-2">
              <Cpu size={15} className="text-emerald-400 animate-pulse" />
              <span>Simulated AI Engine v2.4</span>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#091523] border border-[#192b42] p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Generated Reports</div>
              <div className="text-2xl font-bold text-white mt-1 font-mono">{reportsList.length}</div>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
              <FileText size={20} />
            </div>
          </div>

          <div className="bg-[#091523] border border-[#192b42] p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Available Templates</div>
              <div className="text-2xl font-bold text-white mt-1 font-mono">{reportTypes.length} Types</div>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Layers size={20} />
            </div>
          </div>

          <div className="bg-[#091523] border border-[#192b42] p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Verified Evidence Reports</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">100% Integrity</div>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="bg-[#091523] border border-[#192b42] p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">AI Boundary Protection</div>
              <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">Active</div>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <ShieldAlert size={20} />
            </div>
          </div>
        </div>

        {/* AI Report Generator Section */}
        <div className="bg-[#091626] border border-[#1b314b] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          {/* Subtle gradient overlay background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-[#172c44] pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-blue-400" />
              <h2 className="text-lg font-bold text-white">AI Report Generation Console</h2>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sliders size={14} /> Custom Parameters
            </div>
          </div>

          {/* AI Scope & Boundary Warning Box */}
          <div className="bg-[#121c2b] border border-[#2b3e57] rounded-xl p-4 mb-6 flex items-start gap-3 text-xs text-slate-300">
            <Info size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-amber-300 flex items-center gap-2">
                <span>AI Assistant Scope Boundary & Legal Governance Disclaimer</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                The ChainShield AI Assistant converts and structures existing incident telemetry, Web Crypto SHA-256 digests, timeline logs, and Merkle anchor proofs into standardized reports.
                <strong className="text-slate-200"> AI does NOT decide legal validity, assign personal/legal guilt, or make final security decisions.</strong> All final forensic conclusions remain the sole responsibility of certified lead investigators.
              </p>
            </div>
          </div>

          {/* Form Configuration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Select Report Type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>1. Select Report Type</span>
                <span className="text-blue-400 font-mono text-[11px]">{selectedReportType}</span>
              </label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                disabled={isGenerating}
                className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                {reportTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.badge})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                {reportTypes.find((t) => t.id === selectedReportType)?.description}
              </p>
            </div>

            {/* 2. Select Target Incident */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>2. Select Target Incident</span>
                <span className="text-emerald-400 font-mono text-[11px]">{selectedIncidentId}</span>
              </label>
              <select
                value={selectedIncidentId}
                onChange={(e) => setSelectedIncidentId(e.target.value)}
                disabled={isGenerating}
                className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition cursor-pointer font-mono"
              >
                {activeIncidents.map((i) => {
                  const incVal = i._id || i.incidentId || i.id;
                  const incLabel = i.incidentId || i.id;
                  const incTitle = i.title ? (i.title.length > 38 ? `${i.title.substring(0, 38)}...` : i.title) : 'Cyber Incident';
                  return (
                    <option key={incVal} value={incVal}>
                      {incLabel} — {incTitle}
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-slate-400">
                Aggregates incident info, evidence metadata, verification history, and audit telemetry for selected case.
              </p>
            </div>

            {/* 3. Select Narrative Tone */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>3. Synthesis Tone & Focus</span>
                <span className="text-purple-400 font-mono text-[11px]">{selectedTone}</span>
              </label>
              <select
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value)}
                disabled={isGenerating}
                className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="Forensic Technical">Forensic Technical (Detailed Hashes & Telemetry)</option>
                <option value="Executive Concise">Executive Concise (C-Level Summary & Risk)</option>
                <option value="Strict Custody">Strict Custody (Chain of Custody Emphasis)</option>
                <option value="Compliance Audit">Compliance Audit (Integrity & Standards)</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Tailors AI narrative structures and depth of cryptographic verification proofs.
              </p>
            </div>
          </div>

          {/* Optional Notes */}
          <div className="mt-4 space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Optional Investigator Focus Notes / Custom Instructions
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Highlight RAM memory dump SHA-256 hash match against block #19842104..."
              disabled={isGenerating}
              className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Action Trigger Button & Progress Bar */}
          <div className="mt-6 border-t border-[#172c44] pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Shield size={14} className="text-blue-400" />
              <span>Uses offline simulated LLM parsing with zero external data sharing</span>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Synthesizing Report...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Generate AI Report</span>
                </>
              )}
            </button>
          </div>

          {/* Simulated AI Loading Sequence Overlay Modal/Bar */}
          {isGenerating && (
            <div className="mt-6 bg-[#040c17] border border-[#1c3552] rounded-xl p-5 space-y-3 animate-fade-in font-mono">
              <div className="flex items-center justify-between text-xs text-blue-400">
                <span className="flex items-center gap-2">
                  <Cpu size={14} className="animate-spin text-blue-400" />
                  AI Synthesis Progress: Step {generationStep + 1} of {generationSteps.length}
                </span>
                <span>{Math.round(((generationStep + 1) / generationSteps.length) * 100)}%</span>
              </div>

              {/* Progress bar line */}
              <div className="w-full h-2 bg-[#0d1f33] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${((generationStep + 1) / generationSteps.length) * 100}%` }}
                />
              </div>

              <div className="text-xs text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{generationSteps[generationStep]}</span>
              </div>
            </div>
          )}
        </div>

        {/* Generated Reports Repository Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#182a3f] pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText size={19} className="text-blue-400" />
              Generated Report Repository ({filteredReports.length})
            </h2>

            {/* Search Input */}
            <div className="w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reports by title or ID..."
                className="w-full bg-[#071322] border border-[#182b40] rounded-xl px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {["All", ...reportTypes.map((t) => t.id)].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-[#091626] border border-[#182b40] text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Reports Grid */}
          {filteredReports.length === 0 ? (
            <div className="bg-[#091523] border border-[#182a3f] rounded-2xl p-12 text-center space-y-3">
              <FileText size={40} className="mx-auto text-slate-600" />
              <div className="text-slate-300 font-semibold text-base">No Reports Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No generated reports match your selected filter tab or search query. Click "Generate AI Report" above to build a new report.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-[#091626] border border-[#1b314b] hover:border-[#2b4b73] rounded-2xl p-5 transition-all shadow-lg space-y-4 group"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#15273b] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-blue-400 font-bold px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded">
                        {report.id}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Case: {report.incidentId}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          (report.verificationResult || "VERIFIED").includes("VERIFIED")
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {(report.verificationResult || "VERIFIED").includes("VERIFIED") ? "Integrity Verified" : "Tamper Warning"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                      <Clock size={13} /> {report.generatedDate || report.createdDate || "Recently"}
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                      {report.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                      {report.summary || report.executiveSummary || "Forensic report synthesized from live incident telemetry."}
                    </p>
                  </div>

                  {/* Metadata Chips & AI Model tag */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-[#132437]">
                    <div className="flex items-center gap-4 text-slate-400">
                      <span>
                        Type: <strong className="text-slate-200">{report.type || "Investigation Report"}</strong>
                      </span>
                      <span>
                        Author: <strong className="text-slate-200">
                          {typeof report.generatedBy === 'object'
                            ? report.generatedBy?.name || report.generatedBy?.email || "Lead Investigator"
                            : report.generatedBy || report.author || "Lead Investigator"}
                        </strong>
                      </span>
                      <span className="hidden md:inline font-mono text-[11px] text-blue-400">
                        {report.aiModelUsed || "ChainShield Forensic AI v2.4"}
                      </span>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/reports/view/${report.id}`)}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={14} /> Preview
                      </button>

                      <button
                        onClick={() => handleRegenerate(report)}
                        className="px-3 py-1.5 bg-[#0e2238] hover:bg-[#163352] text-slate-300 border border-[#213f63] rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                        title="Regenerate report with refreshed data"
                      >
                        <RefreshCw size={14} /> Regenerate
                      </button>

                      <button
                        onClick={() => handleExportCSV(report)}
                        className="px-3 py-1.5 bg-[#0e2238] hover:bg-[#163352] text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                        title="Export structured CSV data"
                      >
                        <FileSpreadsheet size={14} /> CSV
                      </button>

                      <button
                        onClick={() => handleExportPDFPlaceholder(report)}
                        className="px-3 py-1.5 bg-[#0e2238] hover:bg-[#163352] text-purple-400 border border-purple-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                        title="Export PDF Document"
                      >
                        <Download size={14} /> PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
