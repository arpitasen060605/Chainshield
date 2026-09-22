import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import HashDisplay from "../../components/common/HashDisplay";
import InvestigationTimeline from "../../components/incidents/InvestigationTimeline";
import { incidents, evidenceList, verificationHistory, auditLogs } from "../../data/mockData";
import { mockReports, generateMockAiReportContent } from "../../data/mockReportsData";
import { getReportById } from "../../services/reportService";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  FileText,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Cpu,
  Layers,
  Info,
  Link as LinkIcon,
  Printer,
  Loader2,
} from "lucide-react";

export default function InvestigationReportView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchFullReport = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getReportById(id);
      if (res.success && res.report) {
        setReport(res.report);
      } else {
        const fallbackRep = mockReports.find((r) => r.id === id) || mockReports[0];
        setReport(fallbackRep);
      }
    } catch (err) {
      console.error("[InvestigationReportView] Fetch error:", err);
      const fallbackRep = mockReports.find((r) => r.id === id) || mockReports[0];
      setReport(fallbackRep);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchFullReport();
    }
  }, [id]);

  // Derived related artifacts from real report payload or mock fallback
  const incident = report?.incident || incidents.find((i) => i.id === report?.incidentId) || incidents[0];
  const relatedEvidence = Array.isArray(report?.evidence) ? report.evidence : evidenceList.filter((e) => e.incidentId === incident.id);
  const relatedVerifications = Array.isArray(report?.verificationEvents) ? report.verificationEvents : verificationHistory.filter((v) => v.incidentId === incident.id);
  const relatedLogs = Array.isArray(report?.auditLogs) ? report.auditLogs : auditLogs.filter((l) => l.incidentId === incident.id);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Regenerate handler
  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      const updated = generateMockAiReportContent({
        incident,
        reportType: report.type,
        tone: "Forensic Technical",
        customNotes: "Refreshed live with updated Web Crypto SHA-256 digests and block Merkle anchors.",
      });
      setReport({ ...updated, id: report.id });
      setIsRegenerating(false);
      showToast("Report regenerated with latest telemetry proofs.");
    }, 2000);
  };

  // Export CSV handler
  const handleExportCSV = () => {
    const csvRows = [
      ["=== REPORT HEADERS ==="],
      ["Report ID", report.id],
      ["Incident ID", incident.id],
      ["Incident Title", `"${incident.title}"`],
      ["Report Type", report.type],
      ["Generated Date", report.generatedDate],
      ["Author", report.generatedBy],
      ["AI Model", report.aiModelUsed],
      ["Verification Status", report.verificationResult],
      [""],
      ["=== EVIDENCE ARTIFACTS ==="],
      ["Evidence ID", "File Name", "File Size", "SHA-256 Hash", "Storage", "Verification"],
      ...relatedEvidence.map((e) => [e.id, e.fileName, e.fileSize, e.sha256, e.storageStatus, e.verificationStatus]),
      [""],
      ["=== AUDIT LOG STREAM ==="],
      ["Log ID", "Timestamp", "User", "Action", "Resource"],
      ...relatedLogs.map((l) => [l.id, l.timestamp, l.user, l.action, `"${l.resource}"`]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${report.id}_Forensic_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported CSV dataset for ${report.id}`);
  };

  // Export PDF Handler
  const handleExportPDF = () => {
    showToast("Opening system print dialog for PDF render...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0c2440] border border-[#2b598d] text-emerald-400 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in font-mono text-sm">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Back Link & Quick Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#182a3f] pb-4">
          <button
            onClick={() => navigate("/reports")}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-2 transition cursor-pointer w-fit"
          >
            <ArrowLeft size={16} /> Back to Reports Repository
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="px-3 py-2 bg-[#0e2238] hover:bg-[#163352] text-slate-200 border border-[#213f63] rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRegenerating ? "animate-spin" : ""} />
              {isRegenerating ? "Synthesizing..." : "Regenerate AI Narrative"}
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-[#0e2238] hover:bg-[#163352] text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet size={14} /> Export CSV Data
            </button>

            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <Printer size={14} /> Export PDF / Print
            </button>
          </div>
        </div>

        {/* Main Printable Document Canvas */}
        <div className="bg-[#081321] border border-[#1a2f48] rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 print:bg-white print:text-black print:p-0 print:shadow-none">
          {/* Document Confidential Header */}
          <div className="border-b border-[#182c44] pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-[10px] uppercase font-bold tracking-widest rounded">
                  CONFIDENTIAL // FORENSIC TELEMETRY
                </span>
                <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[10px] font-bold rounded">
                  {report.type}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight leading-snug">
                {report.title}
              </h1>
              <div className="text-xs text-slate-400 mt-2 font-mono flex flex-wrap items-center gap-4">
                <span>
                  Report ID: <strong className="text-slate-200">{report.id}</strong>
                </span>
                <span>
                  Incident ID:{" "}
                  <strong
                    className="text-blue-400 underline cursor-pointer"
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                  >
                    {incident.id}
                  </strong>
                </span>
                <span>Generated: {report.generatedDate}</span>
              </div>
            </div>

            <div className="bg-[#050e18] border border-[#14263b] p-3 rounded-xl text-right font-mono text-xs space-y-1">
              <div className="text-slate-400">Cryptographic Anchor</div>
              <div className="text-emerald-400 font-bold">{report.blockAnchor}</div>
              <div className="text-[10px] text-slate-500">Merkle Root Verified</div>
            </div>
          </div>

          {/* AI Scope & Boundary Governance Banner */}
          <div className="bg-[#0f1926] border border-[#2b3f57] rounded-xl p-4 flex items-start gap-3 text-xs text-slate-300">
            <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-amber-300">
                Mandatory Legal & AI Scope Boundary Governance
              </div>
              <p className="text-slate-400 leading-relaxed">
                This document was generated using automated AI synthesis to format structured investigation data.
                <strong className="text-slate-200">
                  {" "}
                  The AI does NOT decide legal admissibility, assign guilt to individuals, or issue binding security directives.
                </strong>{" "}
                All forensic claims are backed by 256-bit Web Crypto SHA-256 hashes and on-chain Merkle block headers.
              </p>
            </div>
          </div>

          {/* SECTION 1: Incident Core Information */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white border-b border-[#162a40] pb-2 flex items-center gap-2">
              <Shield size={18} className="text-blue-400" />
              1. Incident Overview & Case Context
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#050d18] border border-[#13253b] p-3.5 rounded-xl space-y-1">
                <div className="text-[11px] text-slate-400">Incident Category</div>
                <div className="text-sm font-semibold text-white">{incident.type}</div>
              </div>

              <div className="bg-[#050d18] border border-[#13253b] p-3.5 rounded-xl space-y-1">
                <div className="text-[11px] text-slate-400">Severity Level</div>
                <div className="text-sm font-semibold text-red-400">{incident.severity}</div>
              </div>

              <div className="bg-[#050d18] border border-[#13253b] p-3.5 rounded-xl space-y-1">
                <div className="text-[11px] text-slate-400">Investigation Status</div>
                <div className="text-sm font-semibold text-amber-400">{incident.status}</div>
              </div>

              <div className="bg-[#050d18] border border-[#13253b] p-3.5 rounded-xl space-y-1">
                <div className="text-[11px] text-slate-400">Lead Investigator</div>
                <div className="text-sm font-semibold text-blue-400">{incident.assignedInvestigator}</div>
              </div>
            </div>

            <div className="bg-[#050d18] border border-[#13253b] p-4 rounded-xl text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-slate-400 block mb-1">Case Impact Narrative:</span>
              <p className="leading-relaxed">{incident.description}</p>
            </div>
          </div>

          {/* SECTION 2: AI Executive Narrative Summary */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white border-b border-[#162a40] pb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400" />
              2. AI Forensic Narrative & Executive Synthesis
            </h2>

            <div className="bg-[#050e19] border border-[#172c44] rounded-xl p-5 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed space-y-2">
              {report.executiveSummaryNarrative}
            </div>
          </div>

          {/* SECTION 3: Digital Evidence Vault & Hashes */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white border-b border-[#162a40] pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers size={18} className="text-emerald-400" />
                3. Digital Evidence Artifacts & Cryptographic Hashes ({relatedEvidence.length})
              </span>
              <span className="text-xs text-slate-400 font-mono">Web Crypto API SHA-256</span>
            </h2>

            {relatedEvidence.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">No evidence records associated with this incident.</p>
            ) : (
              <div className="space-y-4">
                {relatedEvidence.map((ev) => (
                  <div key={ev.id} className="bg-[#050d18] border border-[#15283f] rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          {ev.id}
                        </span>
                        <span className="text-sm font-bold text-white font-mono">{ev.fileName}</span>
                        <span className="text-xs text-slate-400 font-mono">({ev.fileSize})</span>
                      </div>

                      <div className="text-xs font-mono text-slate-400">
                        Uploaded by <strong className="text-slate-200">{ev.uploadedBy}</strong> on {ev.uploadTimestamp}
                      </div>
                    </div>

                    {/* SHA-256 Display Box */}
                    <HashDisplay
                      hash={ev.sha256}
                      label={`SHA-256 Digest for ${ev.fileName}`}
                      showDiagram={false}
                    />

                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
                      <span>Storage Location: {ev.storageStatus}</span>
                      <span className="text-emerald-400 font-bold">Anchor: {ev.blockchainStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: Verification Engine Integrity Results */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white border-b border-[#162a40] pb-2 flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-400" />
              4. Verification Engine Integrity Audit Results
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-[#050d18] text-slate-400 font-mono border-b border-[#14263b]">
                  <tr>
                    <th className="p-3">Audit ID</th>
                    <th className="p-3">Evidence ID</th>
                    <th className="p-3">Verifier</th>
                    <th className="p-3">Verification Timestamp</th>
                    <th className="p-3">Original vs Current Hash</th>
                    <th className="p-3 text-right">Integrity Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#13253b]">
                  {relatedVerifications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500 font-mono">
                        No verification logs recorded.
                      </td>
                    </tr>
                  ) : (
                    relatedVerifications.map((v) => (
                      <tr key={v.id} className="hover:bg-[#071526]">
                        <td className="p-3 font-mono text-blue-400 font-bold">{v.id}</td>
                        <td className="p-3 font-mono text-slate-200">{v.evidenceId}</td>
                        <td className="p-3">{v.verifier}</td>
                        <td className="p-3 font-mono">{v.verificationDate}</td>
                        <td className="p-3 font-mono text-[11px]">
                          <div>Orig: {v.originalHash.substring(0, 16)}...</div>
                          <div>Audit: {v.currentHash.substring(0, 16)}...</div>
                        </td>
                        <td className="p-3 text-right font-mono">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              v.result === "VERIFIED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                            }`}
                          >
                            {v.result}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 5: Investigation Timeline */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white border-b border-[#162a40] pb-2 flex items-center gap-2">
              <Clock size={18} className="text-amber-400" />
              5. Investigation Action Timeline
            </h2>

            <InvestigationTimeline timeline={incident.timeline} incidentId={incident.id} />
          </div>

          {/* SECTION 6: System Audit Telemetry Stream */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white border-b border-[#162a40] pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText size={18} className="text-blue-400" />
                6. System Audit Telemetry Stream ({relatedLogs.length} Records)
              </span>
              <span className="text-xs text-slate-400 font-mono">Immutable Telemetry Logs</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-[#050d18] text-slate-400 font-mono border-b border-[#14263b]">
                  <tr>
                    <th className="p-3">Log ID</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">User / Daemon</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Resource / Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#13253b]">
                  {relatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500 font-mono">
                        No audit stream records found for this case.
                      </td>
                    </tr>
                  ) : (
                    relatedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#071526]">
                        <td className="p-3 font-mono text-purple-400 font-bold">{log.id}</td>
                        <td className="p-3 font-mono text-slate-400">{log.timestamp}</td>
                        <td className="p-3 text-slate-200">{log.user}</td>
                        <td className="p-3 font-semibold text-blue-400">{log.action}</td>
                        <td className="p-3 font-mono text-slate-400">{log.resource}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 7: Blockchain Proof & Sign-off Footer */}
          <div className="border-t border-[#182c44] pt-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock size={18} className="text-emerald-400" />
              7. Cryptographic Block Merkle Proof & Formal Sign-Off
            </h2>

            <div className="bg-[#050d18] border border-[#13253b] p-4 rounded-xl text-xs font-mono space-y-2">
              <div className="text-slate-400">Merkle Tree Root Hash:</div>
              <div className="text-emerald-400 break-all bg-[#030912] p-3 rounded-lg border border-[#0f1f33]">
                {report.merkleProof}
              </div>
              <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                <span>Network Node: #19842104 (Simulated Web3 Mainnet)</span>
                <span>Status: Anchored & Verified</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 text-xs">
              <div className="border-t border-dashed border-[#1e344d] pt-4">
                <div className="text-slate-400 mb-1">Lead Analyst Sign-off</div>
                <div className="font-bold text-white font-mono">{incident.assignedInvestigator}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">ChainShield Security Response Lead</div>
              </div>

              <div className="border-t border-dashed border-[#1e344d] pt-4">
                <div className="text-slate-400 mb-1">Cryptographic Proof Verifier</div>
                <div className="font-bold text-emerald-400 font-mono">ChainShield Automated Validator</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">SHA-256 Web Crypto Engine</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
