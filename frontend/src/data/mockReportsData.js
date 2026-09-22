import { incidents, evidenceList, verificationHistory, auditLogs } from "./mockData";

export const reportTypes = [
  {
    id: "Investigation Report",
    name: "Investigation Report",
    description: "Comprehensive end-to-end incident analysis including timeline, evidence integrity, and forensic audit logs.",
    badge: "Full Case",
    recommendedTone: "Forensic Technical",
  },
  {
    id: "Evidence Report",
    name: "Evidence Report",
    description: "Detailed inventory of digital artifacts, Web Crypto SHA-256 hashes, IPFS paths, and chain of custody logs.",
    badge: "Vault Audit",
    recommendedTone: "Strict Custody",
  },
  {
    id: "Verification Report",
    name: "Verification Report",
    description: "Integrity check matrix comparing original vs audit SHA-256 digests and tamper detection status.",
    badge: "Integrity",
    recommendedTone: "Compliance",
  },
  {
    id: "Audit Log Report",
    name: "Audit Log Report",
    description: "System telemetry log stream tracking authentication, daemon activity, user actions, and security triggers.",
    badge: "Telemetry",
    recommendedTone: "Administrative",
  },
  {
    id: "Executive Summary",
    name: "Executive Summary",
    description: "High-level summary of attack vector, operational impact, mitigation steps, and business risk profile.",
    badge: "C-Level Brief",
    recommendedTone: "Executive Concise",
  },
];

export const mockReports = [
  {
    id: "RPT-2026-101",
    title: "Forensic Investigation & Integrity Audit — Regional Hospital Ransomware",
    type: "Investigation Report",
    incidentId: "INC-2026-001",
    generatedDate: "2026-05-31 03:20 PM",
    generatedBy: "Alex Mercer (Lead Analyst)",
    status: "Final",
    aiModelUsed: "ChainShield Forensic Synthesis v2.4",
    summary: "Complete forensic analysis of LockBit 4.0 ransomware infection across 14 hospital endpoint workstations. Includes 2 verified memory dumps, smart contract block header anchors, and 9 audit telemetry logs.",
    executiveSummaryNarrative: `On May 31, 2026 at 08:30 AM, an automated SIEM daemon detected unauthorized payload execution across subnet 10.4.0.0/24. The malware was identified as a LockBit 4.0 ransomware variant targeting domain controller infrastructure.

Lead investigator Alex Mercer isolated the subnet and acquired primary memory dump exploit_tx_payload_0x8f.bin (2.4 MB) and live RAM image memory_dump_node_04.raw (512 MB). Both evidence files were hashed locally via Web Crypto API (SHA-256) and verified against Merkle block anchor #19842104.

No cryptographic hash mismatches were detected during verification. All chain of custody records remain 100% verified and immutable.`,
    evidenceIds: ["EVD-8941", "EVD-8940"],
    verificationResult: "VERIFIED (100% Match)",
    merkleProof: "0x8f2910ab94c2e174b0991823ab0288fae1948192a0194819208a19284091ba81",
    blockAnchor: "#19842104",
  },
  {
    id: "RPT-2026-102",
    title: "Executive Security Brief — Credential Phishing Campaign",
    type: "Executive Summary",
    incidentId: "INC-2026-002",
    generatedDate: "2026-05-30 02:00 PM",
    generatedBy: "Elena Rostova (Analyst)",
    status: "Final",
    aiModelUsed: "ChainShield Executive Synthesizer v2.4",
    summary: "High-level overview of targeted executive spear-phishing campaign exploiting fake Office 365 login portals. Action taken: Azure AD OAuth tokens revoked and 2FA enforced.",
    executiveSummaryNarrative: `A spear-phishing campaign was directed at three senior finance team members on May 30, 2026. Malicious emails containing credential harvest links were intercepted. 

Immediate containment actions included invalidating active Azure AD session tokens, resetting multi-factor authentication, and updating web filtering rules. Digital evidence phishing_email_headers.eml was flagged for potential header modification during verification testing.`,
    evidenceIds: ["EVD-8939"],
    verificationResult: "POTENTIALLY TAMPERED (Mismatch Detected)",
    merkleProof: "0x7a819b01c94819284019284091ba818f2910ab94c2e174b0991823ab0288fae1",
    blockAnchor: "Pending Anchor",
  },
  {
    id: "RPT-2026-103",
    title: "Digital Evidence Vault & Hash Integrity Audit — Q2 2026",
    type: "Evidence Report",
    incidentId: "INC-2026-003",
    generatedDate: "2026-05-29 06:00 PM",
    generatedBy: "David Chen (Custody Lead)",
    status: "Final",
    aiModelUsed: "ChainShield Vault Auditor v2.4",
    summary: "Detailed cryptographic hash digest catalog for 5 evidence artifacts spanning malware samples, raw memory dumps, email headers, access logs, and network PCAP captures.",
    executiveSummaryNarrative: `This report catalogues digital evidence artifacts stored within the ChainShield decentralized storage architecture (IPFS/Local). All files undergo client-side zero-knowledge SHA-256 hash calculation prior to IPFS distribution.

Key artifact analyzed: sqli_access_log_extract.log (14.2 MB) capturing blind SQL injection vectors targeting /v1/users/search.`,
    evidenceIds: ["EVD-8938"],
    verificationResult: "VERIFIED (100% Match)",
    merkleProof: "0x6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    blockAnchor: "#19841720",
  },
  {
    id: "RPT-2026-104",
    title: "System Audit Telemetry & Access Stream Audit",
    type: "Audit Log Report",
    incidentId: "INC-2026-004",
    generatedDate: "2026-05-28 04:30 PM",
    generatedBy: "Sarah Vance (Security Admin)",
    status: "Archived",
    aiModelUsed: "ChainShield Telemetry Synthesizer v2.4",
    summary: "Audit trail log extract monitoring 14 system activities across login events, dependency alert triggers, package purging, and report downloads.",
    executiveSummaryNarrative: `Audit log stream review for supply chain malicious npm package dependency incident (INC-2026-004). Automated CI Guard alerted on typosquatted package recharts-core-utils.

All analyst actions, file removals, and secret rotation commands were logged with deterministic timestamps and user identity bindings.`,
    evidenceIds: ["EVD-8937"],
    verificationResult: "VERIFIED (100% Match)",
    merkleProof: "0xd41d8cd98f00b204e9800998ecf8427e00000000000000000000000000000000",
    blockAnchor: "#19841600",
  },
];

/**
 * Helper to generate mock AI report text dynamically for a selected incident and report type
 */
export function generateMockAiReportContent({ incident, reportType, tone = "Forensic Technical", customNotes = "" }) {
  const currentIncident = incident || incidents[0];
  const relatedEvidence = evidenceList.filter((e) => e.incidentId === currentIncident.id);
  const relatedVerifications = verificationHistory.filter((v) => v.incidentId === currentIncident.id);
  const relatedLogs = auditLogs.filter((l) => l.incidentId === currentIncident.id);

  const timestamp = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return {
    id: `RPT-2026-${Math.floor(100 + Math.random() * 900)}`,
    title: `AI ${reportType} — ${currentIncident.title}`,
    type: reportType,
    incidentId: currentIncident.id,
    generatedDate: timestamp,
    generatedBy: "AI Assistant (Simulated Forensic Synthesis)",
    status: "Generated (Draft)",
    aiModelUsed: `ChainShield AI Engine v2.4 (${tone})`,
    summary: `Automated ${reportType} generated for case ${currentIncident.id} (${currentIncident.type}, ${currentIncident.severity} Severity). Aggregated ${relatedEvidence.length} evidence artifact(s), ${relatedVerifications.length} integrity check(s), and ${relatedLogs.length} audit telemetry log(s).`,
    executiveSummaryNarrative: `This ${reportType.toLowerCase()} was generated by the ChainShield AI Assistant by parsing structured telemetry data associated with Case ${currentIncident.id}: "${currentIncident.title}".

Incident Context:
• Type: ${currentIncident.type}
• Severity Level: ${currentIncident.severity}
• Current Status: ${currentIncident.status}
• Assigned Investigator: ${currentIncident.assignedInvestigator}
• Incident Description: ${currentIncident.description}

Digital Evidence Summary:
${
  relatedEvidence.length > 0
    ? relatedEvidence
        .map(
          (ev) =>
            `• ${ev.id} (${ev.fileName} - ${ev.fileSize}): SHA-256 Digest ${ev.sha256.substring(0, 16)}... | Storage: ${ev.storageStatus} | Verification: ${ev.verificationStatus}`
        )
        .join("\n")
    : "• No primary digital evidence files recorded for this case."
}

Cryptographic Verification Audit:
${
  relatedVerifications.length > 0
    ? relatedVerifications
        .map(
          (v) =>
            `• ${v.id}: Verifier ${v.verifier} recorded status ${v.result} on ${v.verificationDate}. Hash Match: ${v.hashStatus}.`
        )
        .join("\n")
    : "• No formal verification engine logs recorded yet for this case."
}

Chronological Timeline Key Milestones:
${
  currentIncident.timeline && currentIncident.timeline.length > 0
    ? currentIncident.timeline
        .map((t) => `• [${t.timestamp}] ${t.action} (${t.user}): ${t.description}`)
        .join("\n")
    : "• Timeline logging initialized."
}

${customNotes ? `\nInvestigator Notes & Custom Directives:\n${customNotes}` : ""}
`,
    evidenceIds: relatedEvidence.map((e) => e.id),
    verificationResult: relatedVerifications.some((v) => v.result.includes("TAMPERED"))
      ? "POTENTIALLY TAMPERED (Mismatch Detected)"
      : "VERIFIED (Cryptographically Anchored)",
    merkleProof: relatedEvidence[0]?.sha256 || "0x8f2910ab94c2e174b0991823ab0288fae1948192a0194819208a19284091ba81",
    blockAnchor: relatedEvidence[0]?.blockchainStatus || "Block Header #19842104 (Mock)",
  };
}
