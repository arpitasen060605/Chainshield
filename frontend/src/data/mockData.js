export const stats = [
  { title: "Total Incidents", value: "24", change: "12%", tone: "purple", icon: "file" },
  { title: "Open Incidents", value: "8", change: "5%", tone: "red", icon: "shield" },
  { title: "Total Evidence", value: "156", change: "18%", tone: "blue", icon: "folder" },
  { title: "Verified Evidence", value: "89", change: "22%", tone: "green", icon: "check" },
];

export const incidents = [
  {
    id: "INC-2026-001",
    title: "Ransomware Attack on Regional Hospital Network",
    type: "Ransomware",
    severity: "Critical",
    status: "Under Investigation",
    assignedInvestigator: "Alex Mercer",
    createdDate: "2026-05-31 08:30 AM",
    updatedDate: "2026-05-31 02:15 PM",
    description: "Suspicious encryption activity detected across 14 hospital endpoint workstations. Malicious payload identifies as LockBit 4.0 variant demanding 12 BTC. Primary domain controllers isolated.",
    timeline: [
      {
        action: "Evidence Verified",
        user: "Elena Rostova",
        timestamp: "May 31, 2026 - 02:15 PM",
        status: "VERIFIED",
        description: "Volatile memory RAM dump verified against smart contract block anchor #19842104."
      },
      {
        action: "Blockchain Record Created",
        user: "Automated Daemon",
        timestamp: "May 31, 2026 - 01:10 PM",
        status: "COMPLETED",
        description: "Transaction payload hash 0x8f2910ab... anchored to Merkle Tree root."
      },
      {
        action: "Evidence Hash Generated",
        user: "Alex Mercer",
        timestamp: "May 31, 2026 - 11:45 AM",
        status: "COMPLETED",
        description: "Computed SHA-256 hash e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855."
      },
      {
        action: "Evidence Uploaded",
        user: "Alex Mercer",
        timestamp: "May 31, 2026 - 10:20 AM",
        status: "COMPLETED",
        description: "Memory dump raw binary exploit_tx_payload_0x8f.bin uploaded to vault."
      },
      {
        action: "Investigator Assigned",
        user: "System Admin",
        timestamp: "May 31, 2026 - 09:00 AM",
        status: "COMPLETED",
        description: "Case lead investigator assigned to Alex Mercer."
      },
      {
        action: "Incident Created",
        user: "SIEM Daemon",
        timestamp: "May 31, 2026 - 08:30 AM",
        status: "OPEN",
        description: "Automated EDR trigger detected ransomware extension .lockbit across subnet 10.4.0.0/24."
      }
    ]
  },
  {
    id: "INC-2026-002",
    title: "Executive Credential Phishing Harvester",
    type: "Phishing",
    severity: "High",
    status: "Open",
    assignedInvestigator: "Elena Rostova",
    createdDate: "2026-05-30 11:10 AM",
    updatedDate: "2026-05-30 01:45 PM",
    description: "Targeted spear-phishing campaign distributing fake Office 365 login portals via compromised vendor domain. 3 finance team members entered OAuth credentials.",
    timeline: [
      {
        action: "Investigation Updated",
        user: "Elena Rostova",
        timestamp: "May 30, 2026 - 01:45 PM",
        status: "IN_PROGRESS",
        description: "Active Azure AD refresh tokens revoked for affected accounts; 2FA reset enforced."
      },
      {
        action: "Investigator Assigned",
        user: "System Admin",
        timestamp: "May 30, 2026 - 11:30 AM",
        status: "COMPLETED",
        description: "Elena Rostova assigned as primary analyst."
      },
      {
        action: "Incident Created",
        user: "David Chen",
        timestamp: "May 30, 2026 - 11:10 AM",
        status: "OPEN",
        description: "Security awareness alert submitted by Finance Manager regarding suspicious link."
      }
    ]
  },
  {
    id: "INC-2026-003",
    title: "Customer Database SQL Injection & Data Exfiltration",
    type: "SQL Injection",
    severity: "Critical",
    status: "Under Investigation",
    assignedInvestigator: "David Chen",
    createdDate: "2026-05-29 04:20 PM",
    updatedDate: "2026-05-30 09:00 AM",
    description: "Unsanitized input parameter on legacy API endpoint `/v1/users/search` exploited via time-based blind SQL injection. 45,000 user record hashes potentially compromised.",
    timeline: [
      {
        action: "Investigation Updated",
        user: "David Chen",
        timestamp: "May 30, 2026 - 09:00 AM",
        status: "IN_PROGRESS",
        description: "Prepared statements enforced on database layer; access logs extracted for forensic auditing."
      },
      {
        action: "Incident Created",
        user: "WAF Guard",
        timestamp: "May 29, 2026 - 04:20 PM",
        status: "OPEN",
        description: "Spike in HTTP 500 responses with payload SELECT SLEEP(5) logged."
      }
    ]
  },
  {
    id: "INC-2026-004",
    title: "Supply Chain Malicious npm Package Dependency",
    type: "Malware",
    severity: "High",
    status: "Resolved",
    assignedInvestigator: "Sarah Vance",
    createdDate: "2026-05-28 02:00 PM",
    updatedDate: "2026-05-29 10:30 AM",
    description: "Typosquatted package `recharts-core-utils` introduced obfuscated post-install script designed to exfiltrate `.env` environment variables.",
    timeline: [
      {
        action: "Incident Resolved",
        user: "Sarah Vance",
        timestamp: "May 29, 2026 - 10:30 AM",
        status: "RESOLVED",
        description: "Malicious dependency purged from package lockfile and secrets rotated."
      },
      {
        action: "Incident Created",
        user: "CI Guard",
        timestamp: "May 28, 2026 - 02:00 PM",
        status: "OPEN",
        description: "Dependency Scanner Alert triggered during CI/CD build."
      }
    ]
  },
  {
    id: "INC-2026-005",
    title: "Unauthorized Internal RPC Node Lateral Movement",
    type: "Network Intrusion",
    severity: "Medium",
    status: "Closed",
    assignedInvestigator: "Alex Mercer",
    createdDate: "2026-05-27 09:15 AM",
    updatedDate: "2026-05-27 05:00 PM",
    description: "Internal developer machine attempted SSH brute force against validator RPC node `10.0.4.15`. Determined to be misconfigured automated deployment script.",
    timeline: [
      {
        action: "Incident Resolved",
        user: "Alex Mercer",
        timestamp: "May 27, 2026 - 05:00 PM",
        status: "CLOSED",
        description: "Host rate limiting configured and developer key updated."
      },
      {
        action: "Incident Created",
        user: "SIEM System",
        timestamp: "May 27, 2026 - 09:15 AM",
        status: "OPEN",
        description: "50 failed SSH attempts in 60 seconds from IP 10.0.2.88."
      }
    ]
  }
];

export const evidenceList = [
  {
    id: "EVD-8941",
    incidentId: "INC-2026-001",
    fileName: "exploit_tx_payload_0x8f.bin",
    fileType: "Malware samples",
    fileSize: "2.4 MB",
    uploadedBy: "Alex Mercer",
    uploadTimestamp: "2026-05-31 10:20 AM",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    storageStatus: "IPFS Storage (Mock)",
    blockchainStatus: "Block Header #19842104 (Mock)",
    verificationStatus: "Verified",
    chainOfCustody: [
      { timestamp: "2026-05-31 10:20 AM", action: "FILE_ACQUIRED", user: "Alex Mercer", notes: "Extracted memory payload from domain controller host WS-HOSP-04." },
      { timestamp: "2026-05-31 11:45 AM", action: "HASH_CALCULATED", user: "Alex Mercer", notes: "SHA-256 hash computed locally in browser memory." },
      { timestamp: "2026-05-31 01:10 PM", action: "BLOCKCHAIN_ANCHORED", user: "Automated Daemon", notes: "Merkle proof submitted to simulated block anchor #19842104." }
    ]
  },
  {
    id: "EVD-8940",
    incidentId: "INC-2026-001",
    fileName: "memory_dump_node_04.raw",
    fileType: "Log files",
    fileSize: "512 MB",
    uploadedBy: "Elena Rostova",
    uploadTimestamp: "2026-05-31 02:15 PM",
    sha256: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    storageStatus: "IPFS Storage (Mock)",
    blockchainStatus: "Block Header #19841990 (Mock)",
    verificationStatus: "Verified",
    chainOfCustody: [
      { timestamp: "2026-05-31 02:15 PM", action: "FILE_ACQUIRED", user: "Elena Rostova", notes: "Acquired live RAM memory image prior to system isolation." },
      { timestamp: "2026-05-31 02:30 PM", action: "HASH_CALCULATED", user: "Elena Rostova", notes: "SHA-256 digest generated." }
    ]
  },
  {
    id: "EVD-8939",
    incidentId: "INC-2026-002",
    fileName: "phishing_email_headers.eml",
    fileType: "Screenshots",
    fileSize: "128 KB",
    uploadedBy: "David Chen",
    uploadTimestamp: "2026-05-30 11:15 AM",
    sha256: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284ddd200126d9069e",
    storageStatus: "Local Storage (Mock)",
    blockchainStatus: "Pending Anchor (Mock)",
    verificationStatus: "Pending",
    chainOfCustody: [
      { timestamp: "2026-05-30 11:15 AM", action: "FILE_ACQUIRED", user: "David Chen", notes: "Exported raw RFC822 email file from user mailbox." }
    ]
  },
  {
    id: "EVD-8938",
    incidentId: "INC-2026-003",
    fileName: "sqli_access_log_extract.log",
    fileType: "Log files",
    fileSize: "14.2 MB",
    uploadedBy: "David Chen",
    uploadTimestamp: "2026-05-29 05:10 PM",
    sha256: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    storageStatus: "IPFS Storage (Mock)",
    blockchainStatus: "Block Header #19841720 (Mock)",
    verificationStatus: "Verified",
    chainOfCustody: [
      { timestamp: "2026-05-29 05:10 PM", action: "FILE_ACQUIRED", user: "David Chen", notes: "Filtered access log lines containing time-based injection vectors." }
    ]
  },
  {
    id: "EVD-8937",
    incidentId: "INC-2026-004",
    fileName: "network_capture_pcap_0528.pcap",
    fileType: "Network captures",
    fileSize: "1.2 GB",
    uploadedBy: "Sarah Vance",
    uploadTimestamp: "2026-05-28 03:00 PM",
    sha256: "d41d8cd98f00b204e9800998ecf8427e00000000000000000000000000000000",
    storageStatus: "IPFS Storage (Mock)",
    blockchainStatus: "Block Header #19841600 (Mock)",
    verificationStatus: "Verified",
    chainOfCustody: [
      { timestamp: "2026-05-28 03:00 PM", action: "FILE_ACQUIRED", user: "Sarah Vance", notes: "Full packet capture recorded during CI/CD build execution." }
    ]
  }
];

export const activities = [
  { title: "Evidence uploaded to IPFS", detail: "exploit_tx_payload_0x8f.bin", time: "2m ago", tone: "green" },
  { title: "Blockchain Merkle Proof verified", detail: "Block #19842104 • INC-2026-001", time: "15m ago", tone: "blue" },
  { title: "Smart Contract Scanner Alert", detail: "Reentrancy detected in Vault.sol", time: "42m ago", tone: "red" },
  { title: "AI Forensic Report generated", detail: "INC-2026-001_Executive_Summary.pdf", time: "1h ago", tone: "purple" },
  { title: "User Permission Escalation", detail: "David Chen granted Auditor role", time: "3h ago", tone: "orange" },
];

export const trendData = [
  { day: "May 1", value: 6 }, { day: "May 4", value: 8 }, { day: "May 8", value: 12 },
  { day: "May 11", value: 11 }, { day: "May 14", value: 15 }, { day: "May 17", value: 7 },
  { day: "May 20", value: 8 }, { day: "May 23", value: 13 }, { day: "May 26", value: 15 },
  { day: "May 29", value: 18 }, { day: "May 31", value: 24 },
];

export const verificationHistory = [
  {
    id: "VER-9042",
    evidenceId: "EVD-8941",
    incidentId: "INC-2026-001",
    fileName: "exploit_tx_payload_0x8f.bin",
    verificationDate: "2026-05-31 02:15 PM",
    verifier: "Elena Rostova",
    originalHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    currentHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    result: "VERIFIED",
    hashStatus: "Match"
  },
  {
    id: "VER-9041",
    evidenceId: "EVD-8940",
    incidentId: "INC-2026-001",
    fileName: "memory_dump_node_04.raw",
    verificationDate: "2026-05-31 02:30 PM",
    verifier: "Alex Mercer",
    originalHash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    currentHash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    result: "VERIFIED",
    hashStatus: "Match"
  },
  {
    id: "VER-9040",
    evidenceId: "EVD-8939",
    incidentId: "INC-2026-002",
    fileName: "phishing_email_headers.eml",
    verificationDate: "2026-05-30 01:10 PM",
    verifier: "David Chen",
    originalHash: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284ddd200126d9069e",
    currentHash: "a783b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284ddd200126d9069f",
    result: "POTENTIALLY TAMPERED",
    hashStatus: "Mismatch"
  },
  {
    id: "VER-9039",
    evidenceId: "EVD-8938",
    incidentId: "INC-2026-003",
    fileName: "sqli_access_log_extract.log",
    verificationDate: "2026-05-29 05:45 PM",
    verifier: "David Chen",
    originalHash: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    currentHash: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    result: "VERIFIED",
    hashStatus: "Match"
  }
];

export const auditLogs = [
  {
    id: "LOG-8103",
    timestamp: "2026-05-31 04:10 PM",
    user: "Unknown User",
    action: "Login",
    resource: "Web Console Session (Failed Auth)",
    incidentId: "-",
    evidenceId: "-",
    status: "FAILED"
  },
  {
    id: "LOG-8102",
    timestamp: "2026-05-31 03:45 PM",
    user: "Elena Rostova",
    action: "Evidence Verification",
    resource: "EVD-8939 (phishing_email_headers.eml)",
    incidentId: "INC-2026-002",
    evidenceId: "EVD-8939",
    status: "FAILED"
  },
  {
    id: "LOG-8101",
    timestamp: "2026-05-31 03:20 PM",
    user: "Elena Rostova",
    action: "Report Generated",
    resource: "INC-2026-001_Executive_Forensic_Summary.pdf",
    incidentId: "INC-2026-001",
    evidenceId: "-",
    status: "COMPLETED"
  },
  {
    id: "LOG-8100",
    timestamp: "2026-05-31 02:45 PM",
    user: "Elena Rostova",
    action: "Evidence Verification",
    resource: "EVD-8941 (exploit_tx_payload_0x8f.bin)",
    incidentId: "INC-2026-001",
    evidenceId: "EVD-8941",
    status: "SUCCESS"
  },
  {
    id: "LOG-8099",
    timestamp: "2026-05-31 02:10 PM",
    user: "Alex Mercer",
    action: "Evidence Verification Requested",
    resource: "EVD-8941 (exploit_tx_payload_0x8f.bin)",
    incidentId: "INC-2026-001",
    evidenceId: "EVD-8941",
    status: "PENDING"
  },
  {
    id: "LOG-8098",
    timestamp: "2026-05-31 01:10 PM",
    user: "Automated Daemon",
    action: "Blockchain Record Created",
    resource: "Block Header #19842104 (Merkle Root 0x8f29...)",
    incidentId: "INC-2026-001",
    evidenceId: "EVD-8941",
    status: "SUCCESS"
  },
  {
    id: "LOG-8097",
    timestamp: "2026-05-31 11:45 AM",
    user: "Alex Mercer",
    action: "Hash Generated",
    resource: "SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4...",
    incidentId: "INC-2026-001",
    evidenceId: "EVD-8941",
    status: "SUCCESS"
  },
  {
    id: "LOG-8096",
    timestamp: "2026-05-31 10:20 AM",
    user: "Alex Mercer",
    action: "Evidence Uploaded",
    resource: "EVD-8941 (exploit_tx_payload_0x8f.bin)",
    incidentId: "INC-2026-001",
    evidenceId: "EVD-8941",
    status: "SUCCESS"
  },
  {
    id: "LOG-8095",
    timestamp: "2026-05-31 09:00 AM",
    user: "System Admin",
    action: "Investigator Assigned",
    resource: "Alex Mercer assigned as lead investigator",
    incidentId: "INC-2026-001",
    evidenceId: "-",
    status: "SUCCESS"
  },
  {
    id: "LOG-8094",
    timestamp: "2026-05-31 08:45 AM",
    user: "Alex Mercer",
    action: "Login",
    resource: "Web Console Session (IP 192.168.1.104)",
    incidentId: "-",
    evidenceId: "-",
    status: "SUCCESS"
  },
  {
    id: "LOG-8093",
    timestamp: "2026-05-31 08:30 AM",
    user: "SIEM Daemon",
    action: "Incident Created",
    resource: "INC-2026-001: Ransomware Attack on Hospital",
    incidentId: "INC-2026-001",
    evidenceId: "-",
    status: "SUCCESS"
  },
  {
    id: "LOG-8092",
    timestamp: "2026-05-30 05:15 PM",
    user: "David Chen",
    action: "Logout",
    resource: "Web Console Session Ended",
    incidentId: "-",
    evidenceId: "-",
    status: "SUCCESS"
  },
  {
    id: "LOG-8091",
    timestamp: "2026-05-30 01:45 PM",
    user: "Elena Rostova",
    action: "Incident Updated",
    resource: "INC-2026-002: Token revocation enforced",
    incidentId: "INC-2026-002",
    evidenceId: "-",
    status: "SUCCESS"
  },
  {
    id: "LOG-8090",
    timestamp: "2026-05-30 01:10 PM",
    user: "David Chen",
    action: "Evidence Verification Requested",
    resource: "EVD-8939 (phishing_email_headers.eml)",
    incidentId: "INC-2026-002",
    evidenceId: "EVD-8939",
    status: "WARNING"
  },
  {
    id: "LOG-8089",
    timestamp: "2026-05-29 05:10 PM",
    user: "David Chen",
    action: "Evidence Uploaded",
    resource: "EVD-8938 (sqli_access_log_extract.log)",
    incidentId: "INC-2026-003",
    evidenceId: "EVD-8938",
    status: "SUCCESS"
  },
  {
    id: "LOG-8088",
    timestamp: "2026-05-28 02:00 PM",
    user: "Sarah Vance",
    action: "Report Generated",
    resource: "INC-2026-004_SupplyChain_Malware_Audit.pdf",
    incidentId: "INC-2026-004",
    evidenceId: "-",
    status: "COMPLETED"
  }
];