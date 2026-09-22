import mongoose from 'mongoose';

const ALLOWED_EVIDENCE_TYPES = [
  'document',
  'image',
  'video',
  'audio',
  'log',
  'memory_dump',
  'disk_image',
  'network_capture',
  'other',
];

const ALLOWED_STATUSES = [
  'collected',
  'under_investigation',
  'verified',
  'archived',
];

const verificationEventSchema = new mongoose.Schema(
  {
    originalHash: {
      type: String,
      required: [true, 'Original hash is required'],
      trim: true,
    },
    calculatedHash: {
      type: String,
      required: [true, 'Calculated hash is required'],
      trim: true,
    },
    result: {
      type: String,
      enum: ['VERIFIED', 'TAMPERED'],
      required: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Verified by user ID is required'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true, timestamps: false }
);

const custodyEventSchema = new mongoose.Schema(
  {
    previousCustodian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    newCustodian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'New custodian user ID is required'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performed by user ID is required'],
    },
    action: {
      type: String,
      default: 'transfer',
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: true, timestamps: false }
);

const evidenceSchema = new mongoose.Schema(
  {
    evidenceId: {
      type: String,
      required: [true, 'Evidence ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: [true, 'Parent incident ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Evidence name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    evidenceType: {
      type: String,
      required: [true, 'Evidence type is required'],
      enum: ALLOWED_EVIDENCE_TYPES,
      lowercase: true,
      trim: true,
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
    },
    storedFileName: {
      type: String,
      required: [true, 'Stored file name is required'],
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    cloudinaryUrl: {
      type: String,
      default: null,
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream',
    },
    sha256Hash: {
      type: String,
      required: [true, 'SHA-256 hash is required'],
      trim: true,
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Collector user ID is required'],
    },
    currentCustodian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Current custodian user ID is required'],
    },
    acquisitionDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ALLOWED_STATUSES,
      default: 'collected',
      lowercase: true,
      trim: true,
    },
    custodyHistory: [custodyEventSchema],
    verificationHistory: [verificationEventSchema],
    blockchainRecord: {
      txHash: { type: String, default: null, trim: true },
      blockNumber: { type: Number, default: null },
      blockHash: { type: String, default: null, trim: true },
      contractAddress: { type: String, default: '0x3F8a9C21B52D96e1aC44d858B54a298A60e0a5E3', trim: true },
      network: { type: String, default: 'Ethereum Sepolia Testnet (ChainID: 11155111)' },
      registeredAt: { type: Date, default: Date.now },
      status: { type: String, enum: ['pending', 'confirmed', 'failed', 'unanchored', 'REGISTERED', 'VERIFIED'], default: 'unanchored' },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook to clean up & map legacy strings
evidenceSchema.pre('validate', function (next) {
  if (this.evidenceType) {
    const typeMap = {
      document: 'document',
      documents: 'document',
      image: 'image',
      images: 'image',
      screenshots: 'image',
      video: 'video',
      videos: 'video',
      audio: 'audio',
      log: 'log',
      logs: 'log',
      'log files': 'log',
      memory_dump: 'memory_dump',
      disk_image: 'disk_image',
      network_capture: 'network_capture',
      'network captures': 'network_capture',
      other: 'other',
    };
    const lower = String(this.evidenceType).toLowerCase();
    if (typeMap[lower]) {
      this.evidenceType = typeMap[lower];
    }
  }

  if (this.status) {
    const statusMap = {
      collected: 'collected',
      'under investigation': 'under_investigation',
      under_investigation: 'under_investigation',
      verified: 'verified',
      archived: 'archived',
    };
    const lower = String(this.status).toLowerCase();
    if (statusMap[lower]) {
      this.status = statusMap[lower];
    }
  }
  next();
});

const Evidence = mongoose.model('Evidence', evidenceSchema);

export default Evidence;
