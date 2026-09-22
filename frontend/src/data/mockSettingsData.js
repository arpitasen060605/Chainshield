export const defaultAccountSettings = {
  fullName: "Alex Mercer",
  investigatorId: "INV-8842",
  email: "alex.mercer@chainshield.io",
  department: "Cyber Incident Response Team (CIRT)",
  title: "Lead Forensic Investigator",
  timezone: "UTC+01:00 (Europe/Frankfurt)",
  language: "English (US)",
};

export const defaultNotificationSettings = {
  criticalIncidentAlerts: true,
  evidenceTamperAlerts: true,
  dailyAuditDigest: false,
  web3BlockAnchorNotices: true,
  userRoleChangeAlerts: true,
  emailNotifications: true,
  smsEmergencyEscalation: true,
};

export const initialActiveSessions = [
  {
    id: "SES-9011",
    device: "Chrome / Windows 11 Pro",
    ip: "192.168.1.104",
    location: "Frankfurt, Germany",
    lastActive: "Active Now (Current Session)",
    current: true,
  },
  {
    id: "SES-9010",
    device: "Firefox / macOS Sequoia",
    ip: "10.4.0.88",
    location: "Zurich, Switzerland",
    lastActive: "3 hours ago",
    current: false,
  },
  {
    id: "SES-9008",
    device: "ChainShield Mobile / iOS 19.4",
    ip: "185.220.101.4",
    location: "Amsterdam, Netherlands",
    lastActive: "Yesterday at 08:30 PM",
    current: false,
  },
];

export const defaultNodeSettings = {
  rpcEndpoint: "https://eth-mainnet.alchemyapi.io/v2/mock-key-19842104",
  networkName: "Simulated Ethereum Mainnet (Node #19842104)",
  ipfsGateway: "https://ipfs.chainshield.io/ipfs/",
  hashAlgorithm: "SHA-256 (Web Crypto API zero-knowledge)",
  autoAnchorMerkleProof: true,
};
