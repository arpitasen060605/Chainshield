import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import HashDisplay from "../../components/common/HashDisplay";
import { getEvidenceById, downloadEvidenceFile, transferCustody } from "../../services/evidenceService";
import { getBlockchainProof, registerBlockchainProof, verifyOnChainProof } from "../../services/blockchainService";
import {
  ArrowLeft,
  File,
  User,
  Shield,
  Download,
  Loader2,
  AlertCircle,
  FileText,
  Clock,
  HardDrive,
  RefreshCw,
  X,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function EvidenceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Blockchain state
  const [bcVerifying, setBcVerifying] = useState(false);
  const [bcVerifyResult, setBcVerifyResult] = useState(null);

  // Transfer Custody State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetCustodian, setTargetCustodian] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [transferSuccess, setTransferSuccess] = useState("");

  const fetchEvidenceDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getEvidenceById(id);
      if (res.success && res.evidence) {
        setEvidence(res.evidence);
      } else {
        setError(res.message || "Evidence artifact not found");
      }
    } catch (err) {
      console.error("[EvidenceDetails] Fetch error:", err);
      setError(err.response?.data?.message || "Failed to load evidence artifact details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEvidenceDetails();
    }
  }, [id]);

  const handleDownload = async () => {
    if (!evidence) return;
    try {
      setDownloading(true);
      await downloadEvidenceFile(evidence._id || evidence.evidenceId, evidence.originalFileName);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to download file from server vault.");
    } finally {
      setDownloading(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setTransferError("");
    setTransferSuccess("");

    if (!targetCustodian.trim()) {
      setTransferError("Please enter target custodian user email or User ID.");
      return;
    }

    try {
      setTransferLoading(true);
      const res = await transferCustody(evidence._id || evidence.evidenceId, {
        newCustodian: targetCustodian.trim(),
        notes: transferNotes.trim(),
      });

      if (res.success) {
        setTransferSuccess(res.message || "Custody transferred successfully!");
        setTargetCustodian("");
        setTransferNotes("");
        setTimeout(() => {
          setShowTransferModal(false);
          setTransferSuccess("");
          fetchEvidenceDetails();
        }, 1200);
      } else {
        setTransferError(res.message || "Failed to transfer custody.");
      }
    } catch (err) {
      setTransferError(err.response?.data?.message || "Failed to transfer custody.");
    } finally {
      setTransferLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <Loader2 className="animate-spin text-blue-500" size={36} />
          <span>Retrieving digital evidence artifact details from vault...</span>
        </div>
      </Layout>
    );
  }

  if (error || !evidence) {
    return (
      <Layout>
        <div className="mb-6">
          <button
            onClick={() => navigate("/evidence")}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium mb-3 transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to All Evidence
          </button>
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400 space-y-3">
            <div className="flex items-center gap-2 font-bold text-base">
              <AlertCircle size={20} /> Access Denied / Error
            </div>
            <p className="text-xs">{error || "Requested evidence artifact could not be found."}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const evDisplayId = evidence.evidenceId || (evidence._id ? `EVD-${evidence._id.slice(-6).toUpperCase()}` : evidence.id);
  const parentIncident = evidence.incidentId;
  const parentIncIdDisplay = parentIncident?.incidentId || parentIncident?._id || "N/A";
  const collectorName = evidence.collectedBy?.name || evidence.collectedBy?.email || "Unknown";
  const custodianName = evidence.currentCustodian?.name || evidence.currentCustodian?.email || "Unknown";

  const acqDateDisplay = evidence.acquisitionDate || evidence.createdAt
    ? new Date(evidence.acquisitionDate || evidence.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  return (
    <Layout>
      {/* Header & Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/evidence")}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium mb-3 transition cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to All Evidence
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/30">
                {evDisplayId}
              </span>
              <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
                {evidence.name || evidence.originalFileName}
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              Belongs to Parent Incident Case:{" "}
              {parentIncident ? (
                <button
                  onClick={() => navigate(`/incidents/${parentIncIdDisplay}`)}
                  className="text-blue-400 hover:underline font-bold font-mono"
                >
                  {parentIncIdDisplay} ({parentIncident.title})
                </button>
              ) : (
                <span className="font-mono text-slate-300">{parentIncIdDisplay}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold capitalize ${
                evidence.status === "verified"
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                  : evidence.status === "under_investigation"
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                  : "bg-blue-500/10 border-blue-500/40 text-blue-400"
              }`}
            >
              Status: {(evidence.status || "collected").replaceAll("_", " ")}
            </span>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs shadow-lg shadow-blue-900/30 transition cursor-pointer"
            >
              {downloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Download Evidence File
            </button>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left Column: File Info, SHA-256 */}
        <div className="lg:col-span-8 space-y-6">
          {/* File Metadata Overview */}
          <div className="bg-[#0b1827] border border-[#203246] rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-[#1b2d42] pb-3">
              <File size={16} className="text-blue-400" /> Evidence File Metadata
            </h3>

            <p className="text-slate-300 leading-relaxed text-xs">
              {evidence.description || "No description provided for this evidence artifact."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#071322] p-3.5 rounded-xl border border-[#172a3e]">
              <div>
                <span className="text-slate-400 text-[10px] block">Artifact ID</span>
                <strong className="text-blue-400 font-mono block mt-1">{evDisplayId}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Category Type</span>
                <strong className="text-slate-200 block mt-1 capitalize">
                  {(evidence.evidenceType || "other").replaceAll("_", " ")}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">File Size</span>
                <strong className="text-slate-200 font-mono block mt-1">
                  {formatFileSize(evidence.fileSize)}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">MIME Type</span>
                <strong className="text-slate-200 block mt-1 truncate max-w-[120px]" title={evidence.mimeType}>
                  {evidence.mimeType || "application/octet-stream"}
                </strong>
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Section */}
          <HashDisplay
            hash={evidence.sha256Hash}
            label="Backend Authoritative SHA-256 Cryptographic Hash"
            showDiagram={true}
          />

          {/* Blockchain Verification Section */}
          <div className="bg-[#0b1827] border border-[#203246] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2d42] pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Shield className="text-purple-400" size={16} /> Blockchain Smart Contract Proof
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                    evidence.blockchainRecord?.status === "confirmed" || evidence.blockchainRecord?.status === "REGISTERED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : evidence.blockchainRecord?.status === "pending"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : evidence.blockchainRecord?.status === "failed"
                      ? "bg-red-500/10 text-red-400 border-red-500/30"
                      : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                  }`}
                >
                  Status: {evidence.blockchainRecord?.status || "unanchored"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#071322] border border-[#17283c] p-3 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] block">Network Ledger</span>
                <span className="font-mono text-slate-200 font-semibold block">
                  {evidence.blockchainRecord?.network || "Ethereum Sepolia Testnet"}
                </span>
              </div>
              <div className="bg-[#071322] border border-[#17283c] p-3 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] block">Block Number</span>
                <span className="font-mono text-cyan-400 font-bold block">
                  {evidence.blockchainRecord?.blockNumber ? `#${evidence.blockchainRecord.blockNumber}` : "Pending Confirmation"}
                </span>
              </div>
            </div>

            <div className="bg-[#071322] border border-[#17283c] p-3.5 rounded-xl space-y-2 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Contract Address</span>
                <code className="text-purple-300 font-mono text-[11px] break-all block mt-0.5">
                  {evidence.blockchainRecord?.contractAddress || "0x5FbDB2315678afecb367f032d93F642f64180aa3"}
                </code>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block">Transaction Hash</span>
                {evidence.blockchainRecord?.txHash || evidence.blockchainRecord?.transactionHash ? (
                  <a
                    href={
                      "https://sepolia.etherscan.io/tx/" +
                      (evidence.blockchainRecord?.txHash || evidence.blockchainRecord?.transactionHash)
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline font-mono text-[11px] break-all flex items-center gap-1 mt-0.5"
                  >
                    <span>{evidence.blockchainRecord?.txHash || evidence.blockchainRecord?.transactionHash}</span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                ) : (
                  <span className="text-slate-500 font-mono text-[11px] block mt-0.5">Not yet anchored on smart contract</span>
                )}
              </div>
            </div>

            {bcVerifyResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                  bcVerifyResult.blockchainVerified || bcVerifyResult.fileIntegrity
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  {bcVerifyResult.blockchainVerified || bcVerifyResult.fileIntegrity ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                  )}
                  <span>
                    {bcVerifyResult.message ||
                      (bcVerifyResult.blockchainVerified
                        ? "✓ Evidence integrity verified against on-chain smart contract record."
                        : "✗ Hash mismatch or unanchored on-chain record.")}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-[#1b2d42]">
              <button
                onClick={async () => {
                  try {
                    setBcVerifying(true);
                    setBcVerifyResult(null);
                    const targetId = evidence._id || evidence.evidenceId;
                    const res = await verifyOnChainProof(targetId);
                    if (res && res.success) {
                      setBcVerifyResult(res.blockchainVerification || res);
                    } else {
                      setBcVerifyResult({
                        blockchainVerified: false,
                        message: res.message || "Failed to verify on-chain record.",
                      });
                    }
                  } catch (err) {
                    setBcVerifyResult({
                      blockchainVerified: false,
                      message: err.response?.data?.message || "Failed to verify blockchain integrity.",
                    });
                  } finally {
                    setBcVerifying(false);
                  }
                }}
                disabled={bcVerifying}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2"
              >
                {bcVerifying ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                {bcVerifying ? "Verifying On-Chain..." : "Verify Integrity"}
              </button>

              {(!evidence.blockchainRecord?.txHash || evidence.blockchainRecord?.status === "failed") && (
                <button
                  onClick={async () => {
                    try {
                      setBcVerifying(true);
                      const targetId = evidence._id || evidence.evidenceId;
                      await registerBlockchainProof(targetId);
                      await fetchEvidenceDetails();
                    } catch (err) {
                      alert(err.response?.data?.message || "Failed to anchor evidence on smart contract.");
                    } finally {
                      setBcVerifying(false);
                    }
                  }}
                  disabled={bcVerifying}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Anchor On-Chain Now
                </button>
              )}
            </div>
          </div>

          {/* Chain of Custody History Timeline */}
          <div className="bg-[#0b1827] border border-[#203246] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2d42] pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Clock size={16} className="text-cyan-400" /> Complete Audit-Friendly Chain of Custody History
              </h3>
              <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                {(evidence.custodyHistory || []).length} Event(s)
              </span>
            </div>

            <div className="space-y-4 relative pl-4 border-l border-[#192e44]">
              {(!evidence.custodyHistory || evidence.custodyHistory.length === 0) ? (
                <div className="text-slate-400 text-xs py-2">
                  Initial custody record registered on acquisition by <strong className="text-slate-200">{collectorName}</strong>.
                </div>
              ) : (
                evidence.custodyHistory.map((item, idx) => {
                  const eventTime = item.timestamp
                    ? new Date(item.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A";
                  const prevCust = item.previousCustodian?.name || item.previousCustodian?.email;
                  const newCust = item.newCustodian?.name || item.newCustodian?.email || custodianName;
                  const perfBy = item.performedBy?.name || item.performedBy?.email || "System";

                  return (
                    <div key={item._id || idx} className="relative group">
                      <div className="absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-[#0b1827]" />
                      <div className="bg-[#071322] border border-[#17283c] p-3.5 rounded-xl space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white uppercase tracking-wider text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                            {item.action || "Transfer"}
                          </span>
                          <span className="text-slate-400 text-[10px] font-mono flex items-center gap-1">
                            <Clock size={12} /> {eventTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-200 text-xs font-medium">
                          {prevCust ? (
                            <>
                              <span>{prevCust}</span>
                              <ArrowRight size={13} className="text-slate-400 shrink-0" />
                              <span className="text-cyan-400 font-bold">{newCust}</span>
                            </>
                          ) : (
                            <span className="text-cyan-400 font-bold">Initial Custody Assigned to {newCust}</span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-[#122234]">
                          <span>Performed By: <strong className="text-slate-300">{perfBy}</strong></span>
                          {item.notes && <span className="italic truncate max-w-[200px]" title={item.notes}>"{item.notes}"</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Custody, Custodian, Parent Incident */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0b1827] border border-[#203246] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2d42] pb-3">
              <h3 className="font-bold text-white text-sm">
                Chain of Custody Info
              </h3>
              <button
                onClick={() => {
                  setShowTransferModal(true);
                  setTransferError("");
                  setTransferSuccess("");
                }}
                className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
              >
                <RefreshCw size={12} /> Transfer Custody
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400 block text-[10px]">Collected By</span>
                <div className="flex items-center gap-2 text-slate-200 font-semibold mt-1 bg-[#071322] p-2.5 rounded-lg border border-[#17283c]">
                  <User size={15} className="text-blue-400" />
                  <div>
                    <div>{collectorName}</div>
                    {evidence.collectedBy?.role && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        Role: {evidence.collectedBy.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Current Custodian</span>
                <div className="flex items-center gap-2 text-slate-200 font-semibold mt-1 bg-[#071322] p-2.5 rounded-lg border border-[#17283c]">
                  <User size={15} className="text-cyan-400" />
                  <div>
                    <div>{custodianName}</div>
                    {evidence.currentCustodian?.role && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        Role: {evidence.currentCustodian.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Acquisition Date</span>
                <div className="flex items-center gap-2 text-slate-200 font-semibold mt-1 bg-[#071322] p-2.5 rounded-lg border border-[#17283c]">
                  <Clock size={15} className="text-purple-400" />
                  {acqDateDisplay}
                </div>
              </div>
            </div>
          </div>

          {/* Parent Incident Quick Reference Card */}
          {parentIncident && (
            <div className="bg-[#0b1827] border border-[#203246] rounded-2xl p-5 shadow-2xl space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-[#1b2d42] pb-3 flex items-center gap-2">
                <Shield size={16} className="text-blue-400" /> Parent Incident Case
              </h3>

              <div>
                <span className="text-blue-400 font-mono font-bold block">{parentIncIdDisplay}</span>
                <strong className="text-slate-200 block text-xs mt-1">{parentIncident.title}</strong>
              </div>

              <button
                onClick={() => navigate(`/incidents/${parentIncIdDisplay}`)}
                className="w-full mt-2 py-2 bg-[#0c1f36] border border-[#1b3b5f] hover:bg-[#122b4a] text-blue-300 rounded-lg text-xs font-semibold text-center block transition cursor-pointer"
              >
                Go to Parent Incident Case →
              </button>
            </div>
          )}
        </div>

        {/* Transfer Custody Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#081321] border border-[#1b314b] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-5 p-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#162a40] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <RefreshCw size={18} className="text-cyan-400" />
                  Transfer Evidence Custody
                </h3>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {transferError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2.5 text-xs text-red-400">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              {transferSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2.5 text-xs text-emerald-400">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{transferSuccess}</span>
                </div>
              )}

              <form onSubmit={handleTransferSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target New Custodian (Email or User ID) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={targetCustodian}
                    onChange={(e) => setTargetCustodian(e.target.value)}
                    placeholder="e.g. investigator@chainshield.io or Mongo User ID"
                    className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Transfer Reason / Audit Notes
                  </label>
                  <textarea
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    rows={3}
                    placeholder="Reason for transferring digital evidence custody..."
                    className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition resize-none"
                  />
                </div>

                <div className="border-t border-[#162a40] pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="px-4 py-2 bg-[#0c1f36] hover:bg-[#122b4a] text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={transferLoading}
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800/50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-cyan-900/30 flex items-center gap-2 cursor-pointer"
                  >
                    {transferLoading && <Loader2 size={14} className="animate-spin" />}
                    {transferLoading ? "Transferring..." : "Confirm Transfer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
