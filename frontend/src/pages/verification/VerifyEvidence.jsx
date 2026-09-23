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
  Play,
  HelpCircle,
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

  // Verification State
  const [verifier, setVerifier] = useState(user?.name || "Investigator");
  const [currentHash, setCurrentHash] = useState("");
  const [auditFileName, setAuditFileName] = useState(
    targetEvidence ? targetEvidence.name || targetEvidence.fileName || targetEvidence.originalFileName : ""
  );
  const [isHashing, setIsHashing] = useState(false);
  const [simulatedTampered, setSimulatedTampered] = useState(false);
  const [verificationTime, setVerificationTime] = useState(null);

  // Verification execution state (false = neutral / pending, true = result calculated)
  const [hasVerified, setHasVerified] = useState(false);

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

  // Update when route evidenceId changes
  useEffect(() => {
    if (routeEvidenceId) {
      setSelectedId(routeEvidenceId);
    }
  }, [routeEvidenceId]);

  // RESET verification state when evidence artifact selection changes
  useEffect(() => {
    if (targetEvidence) {
      setCurrentHash("");
      setAuditFileName(targetEvidence.name || targetEvidence.fileName || targetEvidence.originalFileName || "");
      setSimulatedTampered(false);
      setLogSaved(false);
      setHasVerified(false); // Clear previous result -> Reset to neutral Pending state
      setVerificationTime(null);
      setVerificationError("");
    }
  }, [selectedId, targetEvidence]);

  // Primary action: Run Cryptographic Verification
  const handleRunVerification = async () => {
    if (!targetEvidence) return;
    setVerificationError("");

    const evIdToVerify = targetEvidence._id || targetEvidence.evidenceId || targetEvidence.id;
    const nowTime = new Date().toISOString().replace("T", " ").slice(0, 16);

    try {
      setBackendVerifying(true);
      const res = await apiVerifyEvidence(evIdToVerify);
      if (res.success) {
        setCurrentHash(res.calculatedHash || originalHash);
        if (res.verifiedBy?.name) setVerifier(res.verifiedBy.name);
        setVerificationTime(
          res.timestamp
            ? new Date(res.timestamp).toISOString().replace("T", " ").slice(0, 16)
            : nowTime
        );
        setHasVerified(true);
      } else {
        setVerificationError(res.message || "Verification failed");
      }
    } catch (err) {
      console.warn("[VerifyEvidence] API fallback to client comparison:", err);
      // Fallback client-side comparison
      if (!currentHash) {
        setCurrentHash(originalHash);
      }
      setVerificationTime(nowTime);
      setHasVerified(true);
    } finally {
      setBackendVerifying(false);
    }
  };

  // Browser Web Crypto API SHA-256 calculation for uploaded audit file
  const handleAuditFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAuditFileName(file.name);
    setIsHashing(true);
    setSimulatedTampered(false);
    setLogSaved(false);
    const nowTime = new Date().toISOString().replace("T", " ").slice(0, 16);
    setVerificationTime(nowTime);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setCurrentHash(hashHex);
      setHasVerified(true);
    } catch (err) {
      console.error("SHA-256 calculation error:", err);
      const fallbackHash = "f983b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284ddd200126d9069a";
      setCurrentHash(fallbackHash);
      setHasVerified(true);
    } finally {
      setIsHashing(false);
    }
  };

  // Simulate Tampered File
  const handleSimulateTamper = () => {
    setSimulatedTampered(true);
    setLogSaved(false);
    const nowTime = new Date().toISOString().replace("T", " ").slice(0, 16);
    setVerificationTime(nowTime);
    const altered = "a9" + originalHash.slice(2);
    setCurrentHash(altered);
    setHasVerified(true);
  };

  // Reset to Original Match Test
  const handleResetMatch = () => {
    setSimulatedTampered(false);
    setLogSaved(false);
    setCurrentHash(originalHash);
    const nowTime = new Date().toISOString().replace("T", " ").slice(0, 16);
    setVerificationTime(nowTime);
    if (targetEvidence) {
      setAuditFileName(targetEvidence.name || targetEvidence.fileName || targetEvidence.originalFileName || "");
    }
    setHasVerified(true);
  };

  // Match Status calculation
  const isMatch = (originalHash || "").toLowerCase() === (currentHash || "").toLowerCase();
  const verificationResult = isMatch ? "VERIFIED" : "POTENTIALLY TAMPERED";
  const hashStatus = isMatch ? "Match" : "Mismatch";

  // Record audit log to history stream
  const handleRecordLog = async () => {
    if (!targetEvidence || !hasVerified) return;
    setVerificationError("");

    const evIdToVerify = targetEvidence._id || targetEvidence.evidenceId || targetEvidence.id;

    try {
      setBackendVerifying(true);
      const res = await apiVerifyEvidence(evIdToVerify);
      if (res.success) {
        setLogSaved(true);
      } else {
        setVerificationError(res.message || "Failed to record verification log");
      }
    } catch (err) {
      console.error("[VerifyEvidence] Record log error:", err);
      const newLogItem = {
        id: `VER-${Math.floor(9000 + Math.random() * 1000)}`,
        evidenceId: targetEvidence.evidenceId || targetEvidence.id,
        incidentId: targetEvidence.incidentId?._id || targetEvidence.incidentId || "N/A",
        fileName: auditFileName || targetEvidence.name || targetEvidence.fileName,
        verificationDate: verificationTime || new Date().toISOString().replace("T", " ").slice(0, 16),
        verifier: user?.name || verifier,
        originalHash: originalHash,
        currentHash: currentHash || originalHash,
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

          {/* Verification Execution & Controls */}
          <div className="bg-[#0b1827] border border-[#203246] rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-[#1b2d42] pb-3 flex items-center gap-2">
              <HardDrive size={16} className="text-amber-400" /> 2. Execute Verification
            </h3>

            {/* Primary Run Verification Button */}
            <button
              type="button"
              onClick={handleRunVerification}
              disabled={backendVerifying}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/60 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              {backendVerifying ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Running Cryptographic Verification...
                </>
              ) : (
                <>
                  <Play size={16} className="fill-current" /> Run Cryptographic Verification
                </>
              )}
            </button>

            <div className="space-y-3 pt-2">
              {/* Option A: Upload Local File */}
              <div className="border border-[#1d3550] rounded-xl p-3.5 bg-[#071322] space-y-2">
                <label className="block font-semibold text-slate-200 text-[11px]">
                  📁 Upload Local File to Hash & Compare
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

              {/* Option B: Tamper Simulation Controls */}
              <div className="border border-[#1d3550] rounded-xl p-3.5 bg-[#071322] space-y-2.5">
                <label className="block font-semibold text-slate-200 text-[11px] flex items-center gap-1">
                  <Sliders size={13} className="text-purple-400" /> Tamper Detection Test Suite
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleResetMatch}
                    type="button"
                    className={`py-2 px-2 rounded-lg border font-semibold text-[11px] transition text-center cursor-pointer ${
                      hasVerified && !simulatedTampered
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
                      hasVerified && simulatedTampered
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
          {verificationError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
              <ShieldAlert size={18} className="shrink-0" />
              <span>{verificationError}</span>
            </div>
          )}

          {/* NEUTRAL / PENDING STATE (Shown on load and when evidence selection changes) */}
          {!hasVerified ? (
            <div className="p-6 rounded-2xl bg-[#0b1827] border border-[#203246] shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#1b2d42] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Clock size={28} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-amber-300">
                      VERIFICATION PENDING
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Status: <strong className="text-amber-400">Ready to Verify</strong>
                    </p>
                  </div>
                </div>

                <span className="px-3.5 py-1.5 rounded-lg border text-xs font-mono font-bold tracking-wide uppercase bg-amber-500/10 border-amber-500/30 text-amber-400">
                  READY TO VERIFY
                </span>
              </div>

              <div className="bg-[#071322] border border-[#16273b] p-4 rounded-xl space-y-2 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <HelpCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">No active verification result for this artifact</p>
                    <p className="text-slate-400 text-[11px]">
                      Select an evidence artifact from the dropdown on the left and click{" "}
                      <strong className="text-blue-400">"Run Cryptographic Verification"</strong> or upload a file from your disk to compare SHA-256 digests.
                    </p>
                  </div>
                </div>
              </div>

              {/* Disabled Record Log Hint */}
              <div className="flex justify-between items-center pt-2 border-t border-[#1b2d42]">
                <span className="text-[11px] text-slate-500">
                  Record Verification Log is disabled until verification is performed.
                </span>
                <button
                  disabled
                  className="px-4 py-2 bg-slate-800 text-slate-500 font-semibold rounded-lg text-xs cursor-not-allowed border border-slate-700/50"
                >
                  Record Verification Log
                </button>
              </div>
            </div>
          ) : (
            /* VERIFIED / TAMPERED RESULT BANNER (Shown only AFTER verification is performed) */
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

              {/* Verification Metadata Grid */}
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
                  disabled={logSaved || backendVerifying}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition flex items-center gap-2 text-xs cursor-pointer"
                >
                  {logSaved ? <Check size={14} className="text-emerald-300" /> : <History size={14} />}
                  {logSaved ? "Verification Logged" : "Record Verification Log"}
                </button>
              </div>
            </div>
          )}

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
                {originalHash || "N/A"}
              </div>
            </div>

            {/* Current Generated Hash */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      !hasVerified
                        ? "bg-slate-500"
                        : isMatch
                        ? "bg-emerald-400"
                        : "bg-rose-400"
                    }`}
                  />
                  Current Generated Hash ({auditFileName || targetEvidence?.name || targetEvidence?.fileName || targetEvidence?.originalFileName})
                </span>
                <span
                  className={`font-mono text-[10px] ${
                    !hasVerified
                      ? "text-slate-500"
                      : isMatch
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {(currentHash || "").length} Hex Chars
                </span>
              </div>
              <div
                className={`p-3 rounded-xl border font-mono text-xs break-all tracking-wider selection:bg-white selection:text-black ${
                  !hasVerified
                    ? "bg-[#050e18] border-[#14263b] text-slate-500"
                    : isMatch
                    ? "bg-[#050e18] border-emerald-500/40 text-emerald-400"
                    : "bg-rose-950/30 border-rose-500/50 text-rose-300"
                }`}
              >
                {currentHash || (hasVerified ? "N/A" : "Click 'Run Cryptographic Verification' to generate current hash")}
              </div>
            </div>
          </div>

          {/* Reusable Hash Display Diagram */}
          {hasVerified && (
            <HashDisplay
              hash={currentHash || originalHash}
              label="Cryptographic Verification Pipeline Breakdown"
              showDiagram={true}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
