import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    notifications: {
      criticalIncidentAlerts: { type: Boolean, default: true },
      evidenceTamperAlerts: { type: Boolean, default: true },
      dailyAuditDigest: { type: Boolean, default: false },
      web3BlockAnchorNotices: { type: Boolean, default: true },
      userRoleChangeAlerts: { type: Boolean, default: true },
    },
    department: { type: String, default: 'Cyber Crime Division' },
    timezone: { type: String, default: 'UTC+00:00 (London)' },
    language: { type: String, default: 'English (US)' },
    nodeSettings: {
      rpcEndpoint: { type: String, default: 'https://mainnet.infura.io/v3/chainshield_node' },
      ipfsGateway: { type: String, default: 'https://gateway.pinata.cloud/ipfs/' },
      hashAlgorithm: { type: String, default: 'Web Crypto SHA-256 (256-bit digest)' },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
