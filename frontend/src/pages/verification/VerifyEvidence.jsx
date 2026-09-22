import { useState, useEffect } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import HashDisplay from "../../components/common/HashDisplay";
import { evidenceList, verificationHistory } from "../../data/mockData";
import { getEvidence, verifyEvidence as apiVerifyEvidence } from "../../services/evidenceService";
import { useAuth } from "../../context/AuthContext";
import {
  CircleCheck,
  ShieldCheck,
  FileCheck,
  Upload,
  RefreshCw,
  HardDrive,
  Sliders,
  ShieldAlert,
  FileCode,
  User,
  Clock,
  History,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function VerifyEvidence() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { evidenceId: routeEvidenceId } = useParams();
  const [searchParams] = useSearchParams();

  // Backend Evidence items state
  const [realEvidences, setRealEvidences] = useState([]);
  const [loadingEvidences, setLoadingEvidences] = useState(true);

  // Selected Evidence ID
  const defaultEvidenceId = routeEvidenceId || searchParams.get("evidenceId") || "";
  const [selectedId, setSelectedId] = useState(defaultEvidenceId);

  // Active target evidence object
  const activeEvList = realEvidences.length > 0 ? realEvidences : evidenceList;
  const targetEvidence =
    activeEvList.find(
      (e) =>
        e._id === selectedId ||
        e.evidenceId === selectedId ||
        e.id === selectedId
    ) || activeEvList[0];

  const originalHash = targetEvidence
    ? targetEvidence.sha256Hash || targetEvidence.sha256 || ""
    : "";

  // Verification state
  const [verifier, setVerifier] = useState(user?.name || "Investigator");
  const [currentHash, setCurrentHash] = useState(originalHash);
  const [auditFileName, setAuditFileName] = useState(
    targetEvidence ? targetEvidence.name || targetEvidence.fileName || targetEvidence.originalFileName : ""
  );
  const [isHashing, setIsHashing] = useState(false);
  const [simulatedTampered, setSimulatedTampered] = useState(false);
  const [verificationTime, setVerificationTime] = useState(
    new Date().toISOString().replace("T", " ").slice(0, 16)
  );

  const [logSaved, setLogSaved] = useState(false);
  const [backendVerifying, setBackendVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  // Fetch real evidence artifacts from backend
  useEffect(() => {
    const fetchBackendEvidences = async () => {
      try {
        setLoadingEvidences(true);
        const res = await getEvidence({ limit: 100 });
        if (res.success && Array.isArray(res.evidence) && res.evidence.length > 0) {
          setRealEvidences(res.evidence);
          if (!selectedId) {
            setSelectedId(res.evidence[0]._id || res.evidence[0].evidenceId);
          }
        }
      } catch (err) {
        console.error("[VerifyEvidence] Failed to fetch backend evidence:", err);
      } finally {
        setLoadingEvidences(false);
      }
    };

    fetchBackendEvidences();
  }, []);

  // Update when selected evidence changes
  useEffect(() => {
    if (routeEvidenceId) {
      setSelectedId(routeEvidenceId);
    }
  }, [routeEvidenceId]);

  useEffect(() => {
    if (targetEvidence) {
      setCurrentHash(targetEvidence.sha256Hash || targetEvidence.sha256 || "");
      setAuditFileName(targetEvidence.name || targetEvidence.fileName || targetEvidence.originalFileName || "");
      setSimulatedTampered(false);
      setLogSaved(false);
      setVerificationTime(new Date().toISOString().replace("T", " ").slice(0, 16));
    }
  }, [selectedId, targetEvidence]);

  // Browser Web Crypto API SHA-256 calculation for uploaded file
  const handleAuditFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAuditFileName(file.name);
    setIsHashing(true);
    setSimulatedTampered(false);
    setLogSaved(false);
    setVerificationTime(new Date().toISOString().replace("T", " ").slice(0, 16));

    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setCurrentHash(hashHex);
    } catch (err) {
      console.error("SHA-256 calculation error:", err);
      // Fallback altered hash for non-secure contexts if Web Crypto is limited
      setCurrentHash("f983b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284ddd200126d9069a");
    } finally {
      setIsHashing(false);
    }
  };

  // Simulate Tampered File
  const handleSimulateTamper = () => {
    setSimulatedTampered(true);
    setLogSaved(false);
    setVerificationTime(new Date().toISOString().replace("T", " ").slice(0, 16));
    // Alter first 2 hexadecimal characters to simulate file tampering
    const altered = "a9" + originalHash.slice(2);
    setCurrentHash(altered);
  };

  // Reset to Original Match
  const handleResetMatch = () => {
    setSimulatedTampered(false);
    setLogSaved(false);
    setCurrentHash(originalHash);
    setVerificationTime(new Date().toISOString().replace("T", " ").slice(0, 16));
    if (targetEvidence) {
      setAuditFileName(targetEvidence.name || targetEvidence.fileName || targetEvidence.originalFileName || "");
    }
  };

  // Match Status calculation
  const isMatch = (originalHash || "").toLowerCase() === (currentHash || "").toLowerCase();
  const verificationResult = isMatch ? "VERIFIED" : "POTENTIALLY TAMPERED";
  const hashStatus = isMatch ? "Match" : "Mismatch";

  // Record audit log to history stream via real backend verification API
  const handleRecordLog = async () => {
    if (!targetEvidence) return;
    setVerificationError("");

    const evIdToVerify = targetEvidence._id || targetEvidence.evidenceId || targetEvidence.id;

    try {
      setBackendVerifying(true);
      const res = await apiVerifyEvidence(evIdToVerify);
      if (res.success) {
        setCurrentHash(res.calculatedHash);
        if (res.verifiedBy?.name) {
          setVerifier(res.verifiedBy.name);
        }
        if (res.timestamp) {
          setVerificationTime(new Date(res.timestamp).toISOString().replace("T", " ").slice(0, 16));
        }
        setLogSaved(true);
      } else {
        setVerificationError(res.message || "Verification failed");
      }
    } catch (err) {
      console.error("[VerifyEvidence] API Verification error:", err);
      // Fallback local logging
      const newLogItem = {
        id: `VER-${Math.floor(9000 + Math.random() * 1000)}`,
        evidenceId: targetEvidence.evidenceId || targetEvidence.id,
        incidentId: targetEvidence.incidentId?._id || targetEvidence.incidentId || "N/A",
        fileName: auditFileName || targetEvidence.name || targetEvidence.fileName,
        verificationDate: verificationTime,
        verifier: user?.name || verifier,
        originalHash: originalHash,
        currentHash: currentHash,
        result: verificationResult,
        hashStatus: hashStatus,
      };
      verificationHistory.unshift(newLogItem);
      setLogSaved(true);
    } finally {
      setBackendVerifying(false);
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
            <CircleCheck size={16} /> Digital Forensic Integrity Subsystem
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Verify Evidence Integrity
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Cryptographically compare evidence hashes to verify authenticity and detect potential file tampering.
          </p>
        </div>

        <button
          onClick={() => navigate("/verification/history")}
          className="flex items-center gap-2 px-4 py-2 bg-[#0c1f36] hover:bg-[#122b4a] border border-[#1b3b5f] text-blue-300 rounded-xl text-xs font-semibold transition self-start md:self-auto cursor-pointer"
        >
          <History size={15} /> View Verification History →
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left Column: Select Evidence & Verifier Configuration */}
        <div className="lg:col-span-5 space-y-6">
          {/* Target Evidence Selector */}
          <div className="bg-[#0b1827] border border-[#203246] rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-[#1b2d42] pb-3 flex items-center gap-2">
              <FileCheck size={16} className="text-blue-400" /> 1. Select Evidence Artifact
            </h3>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Target Evidence Record *</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-[#071322] border border-[#1d334c] rounded-lg px-3.5 py-2.5 text-slate-200 outline-none font-mono"
              >
                {activeEvList.map((item) => {
                  const itemId = item._id || item.evidenceId || item.id;
                  const itemLabel = item.evidenceId || item.id;
                  const itemFile = item.name || item.fileName || item.originalFileName;
                  const itemType = item.evidenceType || item.fileType;
                  return (
                    <option key={itemId} value={itemId}>
                      {itemLabel}: {itemFile} ({itemType})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Assigned Verifier *</label>
              <select
                value={verifier}
                onChange={(e) => setVerifier(e.target.value)}
                className="w-full bg-[#071322] border border-[#1d334c] rounded-lg px-3.5 py-2.5 text-slate-200 outline-none"
              >
                <option value="Alex Mercer">Alex Mercer</option>
                <option value="Elena Rostova">Elena Rostova</option>
                <option value="David Chen">David Chen</option>
                <option value="Sarah Vance">Sarah Vance</option>
              </select>
            </div>

            {/* Target Evidence Metadata Summary Box */}
            {targetEvidence && (
              <div className="bg-[#071322] border border-[#172a3e] p-4 rounded-xl space-y-2.5">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Evidence ID</span>
                    <strong className="text-blue-400 font-mono">{targetEvidence.evidenceId || targetEvidence.id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Incident ID</span>
                    <strong className="text-slate-200 font-mono">
                      {typeof targetEvidence.incidentId === 'object'
                        ? targetEvidence.incidentId?.incidentId || targetEvidence.incidentId?._id
                        : targetEvidence.incidentId || "N/A"}
                    </strong>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">File Name</span>
                  <strong className="text-slate-200 block text-xs">{targetEvidence.name || targetEvidence.fileName || targetEvidence.originalFileName}</strong>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-[#132538]">
                  <span>Category: {targetEvidence.evidenceType || targetEvidence.fileType}</span>
                  <span>Size: {targetEvidence.fileSize ? `${targetEvidence.fileSize} B` : "N/A"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Audit Test Mode Controls */}
          <div className="bg-[#0b1827] border border-[#203246] rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-[#1b2d42] pb-3 flex items-center gap-2">
              <HardDrive size={16} className="text-amber-400" /> 2. Generate / Obtain Current SHA-256
            </h3>

            <div className="space-y-3">
              {/* Option A: Upload Local File */}
              <div className="border border-[#1d3550] rounded-xl p-3.5 bg-[#071322] space-y-2">
                <label className="block font-semibold text-slate-200 text-[11px]">
                  📁 Upload Local File to Hash
                </label>
                <input
                  type="file"
                  id="audit-file-input"
                  onChange={handleAuditFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="audit-file-input"
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-[#0d233a] hover:bg-[#132f4c] border border-[#1d4066] rounded-lg text-blue-300 font-semibold cursor-pointer transition text-xs"
                >
                  <Upload size={14} /> Select Audit File from Disk
                </label>
                {isHashing && (
                  <div className="text-[11px] text-amber-400 flex items-center gap-1.5 pt-1">
                    <RefreshCw size={12} className="animate-spin" /> Calculating SHA-256 in browser memory...
                  </div>
                )}
              </div>

              {/* Option B: Quick Test Controls */}
              <div className="border border-[#1d3550] rounded-xl p-3.5 bg-[#071322] space-y-2.5">
                <label className="block font-semibold text-slate-200 text-[11px] flex items-center gap-1">
                  <Sliders size={13} className="text-purple-400" /> Tamper Detection Test Suite
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleResetMatch}
                    type="button"
                    className={`py-2 px-2 rounded-lg border font-semibold text-[11px] transition text-center cursor-pointer ${
                      !simulatedTampered
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "bg-[#0d2238] border-[#1e3b5c] text-slate-300 hover:text-white"
                    }`}
                  >
                    ✓ Test Original Match
                  </button>
                  <button
                    onClick={handleSimulateTamper}
                    type="button"
                    className={`py-2 px-2 rounded-lg border font-semibold text-[11px] transition text-center cursor-pointer ${
                      simulatedTampered
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-300"
                        : "bg-[#0d2238] border-[#1e3b5c] text-rose-400 hover:bg-rose-950/30"
                    }`}
                  >
                    ⚠️ Simulate Tampered File
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Verification Results & Full Spec Table */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Verification Result Banner */}
          <div
            className={`p-6 rounded-2xl border shadow-2xl transition-all ${
              isMatch
                ? "bg-emerald-950/20 border-emerald-500/40"
                : "bg-rose-950/20 border-rose-500/40"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b2d42] pb-4 mb-4">
              <div className="flex items-center gap-3">
                {isMatch ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck size={28} />
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <ShieldAlert size={28} />
                  </div>
                )}
                <div>
                  <h2
                    className={`text-lg font-bold tracking-tight ${
                      isMatch ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {isMatch ? "HASH MATCH CONFIRMED" : "HASH MISMATCH DETECTED"}
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Result: <strong className={isMatch ? "text-emerald-400" : "text-rose-400"}>{verificationResult}</strong>
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                <span
                  className={`px-3.5 py-1.5 rounded-lg border text-xs font-mono font-bold tracking-wide uppercase shadow-lg ${
                    isMatch
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                      : "bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse"
                  }`}
                >
                  {verificationResult}
                </span>
              </div>
            </div>

            {/* Verification Metadata Grid (All Required Prompt Fields) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#050e18]/80 p-3.5 rounded-xl border border-[#16273b] mb-4 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">Evidence ID</span>
                <strong className="text-blue-400 font-mono block mt-0.5">{targetEvidence?.evidenceId || targetEvidence?.id}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Incident ID</span>
                <strong className="text-slate-200 font-mono block mt-0.5">
                  {typeof targetEvidence?.incidentId === 'object'
                    ? targetEvidence?.incidentId?.incidentId || targetEvidence?.incidentId?._id
                    : targetEvidence?.incidentId || "N/A"}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Verifier</span>
                <strong className="text-slate-200 block mt-0.5">{verifier}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Verification Date</span>
                <strong className="text-slate-200 font-mono block mt-0.5">{verificationTime}</strong>
              </div>
            </div>

            {/* Action Button: Record to Verification History */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-400">
                {logSaved ? "✓ Audit record logged to history stream." : "Click below to append record to audit history."}
              </span>
              <button
                onClick={handleRecordLog}
                disabled={logSaved}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition flex items-center gap-2 text-xs cursor-pointer"
              >
                {logSaved ? <Check size={14} className="text-emerald-300" /> : <History size={14} />}
                {logSaved ? "Verification Logged" : "Record Verification Log"}
              </button>
            </div>
          </div>

          {/* Original Hash vs Current Hash Cards */}
          <div className="bg-[#0b1827] border border-[#203246] rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-[#1b2d42] pb-3 flex items-center gap-2">
              <FileCode size={16} className="text-blue-400" /> Cryptographic Hash Comparison
            </h3>

            {/* Original Recorded Hash */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" /> Original Recorded Hash (Vault Record)
                </span>
                <span className="font-mono text-blue-400 text-[10px]">{(originalHash || "").length} Hex Chars</span>
              </div>
              <div className="bg-[#050e18] p-3 rounded-xl border border-[#14263b] font-mono text-blue-300 text-xs break-all tracking-wider selection:bg-blue-500 selection:text-black">
                {originalHash}
              </div>
            </div>

            {/* Current Generated Hash */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isMatch ? "bg-emerald-400" : "bg-rose-400"
                    }`}
                  />
                  Current Generated Hash ({auditFileName || targetEvidence?.name || targetEvidence?.fileName || targetEvidence?.originalFileName})
                </span>
                <span
                  className={`font-mono text-[10px] ${
                    isMatch ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {(currentHash || "").length} Hex Chars
                </span>
              </div>
              <div
                className={`p-3 rounded-xl border font-mono text-xs break-all tracking-wider selection:bg-white selection:text-black ${
                  isMatch
                    ? "bg-[#050e18] border-emerald-500/40 text-emerald-400"
                    : "bg-rose-950/30 border-rose-500/50 text-rose-300"
                }`}
              >
                {currentHash}
              </div>
            </div>
          </div>

          {/* Reusable Hash Display Diagram */}
          <HashDisplay
            hash={currentHash}
            label="Cryptographic Verification Pipeline Breakdown"
            showDiagram={true}
          />
        </div>
      </div>
    </Layout>
  );
}
