import { useState } from "react";
import { Hash, Copy, Check, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

/**
 * Reusable HashDisplay Component
 * Displays a 64-character hexadecimal SHA-256 hash with interactive copy and 
 * an architectural breakdown diagram (Evidence File -> SHA-256 -> 64 Hex Characters).
 */
export default function HashDisplay({
  hash,
  label = "SHA-256 Cryptographic Hash Digest",
  showDiagram = true,
  className = "",
}) {
  const [copied, setCopied] = useState(false);

  const copyHash = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const is64Hex = typeof hash === "string" && hash.length === 64;

  return (
    <div className={`bg-[#0b1827] border border-[#203246] rounded-2xl p-5 shadow-2xl space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1b2d42] pb-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Hash size={16} className="text-amber-400" /> {label}
        </h3>
        {hash && (
          <button
            onClick={copyHash}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0d2238] border border-[#1e3b5c] text-slate-300 hover:text-white rounded text-[11px] font-semibold transition cursor-pointer"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copied ? "Copied Full Hash" : "Copy 64-Hex"}
          </button>
        )}
      </div>

      {/* Main Hash Display Box */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
          <span>Format: Standard 256-bit SHA-256</span>
          <span className={is64Hex ? "text-emerald-400" : "text-amber-400"}>
            {hash ? `${hash.length} Hex Characters` : "No Hash Available"}
          </span>
        </div>

        <div className="bg-[#050e18] p-3.5 rounded-xl border border-[#14263b] font-mono text-emerald-400 text-xs sm:text-sm break-all leading-relaxed tracking-wider shadow-inner selection:bg-emerald-500 selection:text-black">
          {hash || "----------------------------------------------------------------"}
        </div>
      </div>

      {/* SHA-256 Architecture Explanation Diagram */}
      {showDiagram && (
        <div className="bg-[#071322] border border-[#16273b] rounded-xl p-3.5 space-y-2.5">
          <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-blue-400" />
            Integrity Pipeline Explanation
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-center text-[11px]">
            <div className="bg-[#0c1c2e] border border-[#1d3550] p-2 rounded-lg text-slate-200 font-medium">
              📁 Evidence File
              <span className="block text-[9px] text-slate-400 font-mono mt-0.5">Raw Binary Bytes</span>
            </div>

            <div className="flex justify-center text-slate-500">
              <ArrowRight size={16} className="hidden sm:block text-blue-400" />
              <span className="sm:hidden font-mono text-blue-400 text-[10px]">↓</span>
            </div>

            <div className="bg-[#0c1c2e] border border-[#1d3550] p-2 rounded-lg text-amber-300 font-semibold font-mono">
              ⚡ SHA-256
              <span className="block text-[9px] text-slate-400 font-sans font-normal mt-0.5">256-bit One-Way Digest</span>
            </div>

            <div className="flex justify-center text-slate-500">
              <ArrowRight size={16} className="hidden sm:block text-blue-400" />
              <span className="sm:hidden font-mono text-blue-400 text-[10px]">↓</span>
            </div>

            <div className="bg-[#0c1c2e] border border-[#1d3550] p-2 rounded-lg text-emerald-400 font-mono font-bold">
              64 Hex Chars
              <span className="block text-[9px] text-slate-400 font-sans font-normal mt-0.5">Fixed Output String</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed border-t border-[#132437] pt-2 flex items-start gap-1.5">
            <HelpCircle size={12} className="text-slate-500 shrink-0 mt-0.5" />
            <span>
              <strong>Cryptographic Security:</strong> SHA-256 produces a deterministic 256-bit hash formatted as 64 hexadecimal characters (0-9, a-f). Even a single altered bit in the source file completely changes the resulting hash digest.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
