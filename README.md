# ChainShield
### Blockchain-Based Cyber Incident Evidence Management & Integrity System

ChainShield is an enterprise cyber incident management and digital evidence integrity platform. It provides cryptographic SHA-256 hash verification, multi-tenant company isolation, role-based access control (RBAC), chain of custody tracking, audit telemetry, forensic report generation, and EVM smart contract blockchain anchoring.

---

## Table of Contents
1. [Project Title & Overview](#1-project-title--overview)
2. [Problem Statement](#2-problem-statement)
3. [Key Objectives](#3-key-objectives)
4. [Key Features](#4-key-features)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture](#6-system-architecture)
7. [Complete Application Flow](#7-complete-application-flow)
8. [User Roles & RBAC](#8-user-roles--rbac)
9. [Authentication & OTP Flow](#9-authentication--otp-flow)
10. [Company & Multi-Tenant Flow](#10-company--multi-tenant-flow)
11. [Incident Management](#11-incident-management)
12. [Evidence Management](#12-evidence-management)
13. [SHA-256 Integrity](#13-sha-256-integrity)
14. [Chain of Custody](#14-chain-of-custody)
15. [Blockchain Integration](#15-blockchain-integration)
16. [Audit Logs](#16-audit-logs)
17. [Dashboard & Reports](#17-dashboard--reports)
18. [Database Models](#18-database-models)
19. [Frontend Routing](#19-frontend-routing)
20. [Backend/API Architecture](#20-backendapi-architecture)
21. [Security](#21-security)
22. [Project Structure](#22-project-structure)
23. [Environment Variables](#23-environment-variables)
24. [Local Setup](#24-local-setup)
25. [Deployment](#25-deployment)
26. [Testing](#26-testing)
27. [End-to-End Flow](#27-end-to-end-flow)
28. [Future Enhancements](#28-future-enhancements)
29. [Conclusion](#29-conclusion)

---

## 1. Project Title & Overview
ChainShield solves critical digital evidence vulnerabilities by pairing cloud vault storage with blockchain non-repudiation. Every evidence file receives an authoritative 256-bit SHA-256 digest upon upload, which is permanently anchored to Ethereum smart contracts and periodically re-verified against live file streams.

## 2. Problem Statement
- **File Tampering**: Digital forensic artifacts can be altered without detection if baseline hashes are unverified.
- **Custody Gaps**: Informal evidence handoffs weaken legal admissibility and forensic credibility.
- **Database Manipulation**: Centralized DB hashes remain vulnerable to administrative tampering.
- **Tenant Leakage**: Multi-organization platforms risk cross-tenant data contamination without strict isolation.

## 3. Key Objectives
- **Non-Repudiation**: Anchor SHA-256 digests on EVM smart contracts.
- **Multi-Tenant Isolation**: Scope all database resource queries by `companyId`.
- **Immutable Custody**: Log all possession transfers with timestamps and user metadata.
- **3-Tier Verification**: Verify integrity across live file streams, MongoDB, and smart contract state.
- **Audit Telemetry**: Record security events with client IP addresses and User-Agent headers.

## 4. Key Features
- **Company Code Onboarding**: 6-character organizational activation codes.
- **Multi-Level Approval**: Platform Admin approves companies; Company Admin approves employees.
- **3-Tier Hash Verification**: Real-time comparison of file stream hash vs. DB hash vs. on-chain contract record.
- **Forensic Reporting**: Automated report generation with unified chronological incident timelines.
- **Security Telemetry**: Comprehensive audit log recording and search stream.

## 5. Technology Stack
| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, React Router 7, TailwindCSS 4, Lucide Icons, Recharts |
| **Backend** | Node.js, Express.js 4, Mongoose 8, Bcrypt.js, JWT, Nodemailer |
| **Database** | MongoDB (Document Database) |
| **Storage & Auth** | Cloudinary Vault API (Memory Buffer Streams), Brevo SMTP (OTP Emails) |
| **Blockchain** | Solidity (`^0.8.20`), Ethers.js v6, Hardhat (`EvidenceRegistry.sol`) |

## 6. System Architecture
```text
React SPA Frontend  <--->  Express REST API  <--->  MongoDB Database
                                  |
                                  +---> Cloudinary Vault Storage
                                  +---> Ethereum EVM Smart Contract
```
- **Frontend**: Renders UI, handles client route guards, manages JWT state, renders charts.
- **Express Backend**: Handles REST API routes, authentication rate limiting, RBAC middleware, and file filters.
- **Storage & EVM**: Streams files to Cloudinary, stores schemas in MongoDB, anchors digests to Ethereum smart contracts via Ethers.js.

## 7. Complete Application Flow
```text
Platform Admin
  ↓ (Approves Company Registration)
Company (Active)  →  Company Admin (Active)
  ↓ (Approves Employees & Assigns Roles)
Employees & Roles (Lead Investigator, Forensic Analyst, Auditor, Responder)
  ↓
Authentication (JWT Login / Password Reset OTP)  →  Dashboard Analytics
  ↓
Incident (Created -> Verified/Active)  →  Evidence (Uploaded -> SHA-256 Generated)
  ↓
Storage (Cloud Vault)  →  Chain of Custody (Handoff Logged)  →  Blockchain (Hash Anchored)
  ↓
Verification (File vs DB vs Smart Contract)  →  Audit Log  →  Forensic Report
```

## 8. User Roles & RBAC
| Role Key | Name | Access Scope & Permissions |
|---|---|---|
| `platform_admin` | Platform Admin | System-wide view; approves Company Admins and company signups. |
| `admin` | Company Admin | Company scope; approves employees, assigns roles, updates company settings. |
| `lead_investigator` | Lead Investigator | Creates/edits incidents, assigns personnel, verifies incidents, generates reports. |
| `forensic_analyst` | Forensic Analyst | Uploads evidence, computes SHA-256 hashes, runs integrity verification, transfers custody. |
| `auditor` | Auditor | Read-only access to audit logs, custody history, verification logs, and reports. |
| `incident_responder` | Incident Responder | Creates incidents, updates status of assigned incidents, uploads evidence. |
| `pending` | Pending User | Blocked from all protected application routes and API endpoints. |

*Note: Company Admins cannot alter their own account role/status or grant admin roles via the employee API.*

## 9. Authentication & OTP Flow
- **JWT Auth**: Bearer tokens signed with JWT secret carrying `{ id, role, companyId }`.
- **Password Security**: Bcrypt hashing (10 salt rounds), excluded from default Mongoose queries (`select: false`).
- **Rate Limiting**: Cap of 20 requests per 15 minutes per IP on auth routes (`rateLimiter.js`).
- **OTP Password Reset**:
  1. `forgotPassword`: Generates 6-digit OTP, stores SHA-256 hash in DB (`resetPasswordOtpHash`, 10-min expiry, max 5 attempts, 60s cooldown), sends HTML email via SMTP.
  2. `verifyResetOtp`: Matches OTP hash, issues 32-byte reset token (`resetToken`, 15-min expiry).
  3. `resetPassword`: Validates token, updates password with Bcrypt, clears reset fields.

## 10. Company & Multi-Tenant Flow
- **Company Code Logic**: 6-character code (e.g. `TECHNOVA`). Admin signup creates a `pending` Company + Admin user awaiting Platform Admin approval. Employee signup requires an `active` Company code and awaits Company Admin approval.
- **Data Isolation**: All core schemas (`User`, `Incident`, `Evidence`, `AuditLog`, `Report`, `Settings`) contain an indexed `companyId`. Controllers apply automatic tenant query filters (`{ companyId: req.user.companyId }`). Cross-tenant access yields `403/404`.

## 11. Incident Management
- **Schema (`Incident.js`)**: `incidentId` (`INC-XXXXXX`), `companyId`, `title`, `description`, `severity` (`critical`, `high`, `medium`, `low`), `status`, `threatVector`, `affectedSystems`, `impact`, `createdBy`, `verifiedBy`, `assignedTo`, `timeline`.
- **Lifecycle**: `pending_verification` $\rightarrow$ `active` / `under_investigation` $\rightarrow$ `containment` $\rightarrow$ `resolved` (or `rejected`).
- **Verification**: Admin or Lead Investigator approves (`active`) or rejects (`rejected`) pending incidents.

## 12. Evidence Management
- **Schema (`Evidence.js`)**: `evidenceId` (`EVD-XXXXXX`), `incidentId`, `companyId`, `name`, `evidenceType` (`document`, `image`, `video`, `log`, `memory_dump`, `disk_image`, `network_capture`, `other`), `originalFileName`, `cloudinaryUrl`, `sha256Hash`, `collectedBy`, `currentCustodian`, `status`, `custodyHistory`, `verificationHistory`, `blockchainRecord`.
- **Upload Guards**: `uploadMiddleware.js` rejects executable extensions (`.exe`, `.sh`, `.bat`, `.dll`, `.jar`, etc.) and caps file size at 100MB.
- **Storage**: In-memory buffer streams directly to Cloudinary folder `chainshield/evidence`.

## 13. SHA-256 Integrity
- **Baseline Hash**: SHA-256 digest computed on upload (`hashFile.js` / Node `crypto`) and stored in `sha256Hash`.
- **Integrity Verification**: `verifyEvidence` re-fetches file stream from Cloudinary, computes live SHA-256, and compares with `sha256Hash`.
- **Result Logging**: Records result (`VERIFIED` or `TAMPERED`) in `verificationHistory`. Baseline hash remains immutable.

## 14. Chain of Custody
- **Custody Schema**: Array of handoff events (`previousCustodian`, `newCustodian`, `performedBy`, `action`, `timestamp`, `notes`).
- **Transfer (`transferCustody`)**: Validates target custodian exists and is active in the same company, updates `currentCustodian`, appends a transfer event, and logs `CUSTODY_TRANSFERRED` in audit logs.

## 15. Blockchain Integration
- **Smart Contract (`EvidenceRegistry.sol`)**:
  - `storeEvidenceHash(evidenceId, sha256Hash)`: Anchors hash on-chain with timestamp and submitter address.
  - `getEvidenceHash(evidenceId)`: Returns on-chain record.
  - `verifyEvidence(evidenceId, sha256Hash)`: Returns boolean match.
- **Auto-Anchoring**: Uploading evidence automatically calls `storeEvidenceHash` via Ethers.js v6.
- **3-Tier Verification**: Checks (1) File stream hash vs. DB hash (`databaseHashMatch`), (2) DB hash vs. Smart Contract (`blockchainHashMatch`), and (3) Blockchain status (`blockchainVerified`).

## 16. Audit Logs
Recorded to MongoDB via `auditLogger.js`:
- **Captured Attributes**: `action`, `user`, `companyId`, `userName`, `userEmail`, `resourceType`, `resourceId`, `details`, `ipAddress`, `userAgent`, `timestamp`.
- **Tracked Events**: Registration, login, password resets, role/status changes, incident verification, evidence uploads, custody handoffs, integrity checks, blockchain anchoring, report generation, and settings updates.

## 17. Dashboard & Reports
- **Dashboard (`dashboardController.js`)**: Real-time tenant stats (total/open/closed incidents, severity breakdown, evidence verification status, active users, recent incidents, recent audit activity).
- **Reports (`reportController.js`)**: Generates forensic reports (`REP-XXXXXX`) aggregating parent incident data, evidence artifacts, custody logs, verifications, and audit logs into a unified chronological timeline.

## 18. Database Models
| Model | Purpose | Relations & Tenant Scoping |
|---|---|---|
| `Company` | Corporate organizational entity | Tenant Root (`createdBy` $\rightarrow$ `User`) |
| `User` | User account and authentication profile | Scoped by `companyId` $\rightarrow$ `Company` |
| `Incident` | Cyber incident case document | Scoped by `companyId`, refs `createdBy`, `assignedTo` |
| `Evidence` | Digital evidence file record | Scoped by `companyId`, refs `incidentId`, `currentCustodian` |
| `AuditLog` | System security audit log | Scoped by `companyId`, refs `user` |
| `Report` | Forensic investigation report | Scoped by `companyId`, refs `incidentId`, `generatedBy` |
| `Settings` | Organization configuration | Scoped by `companyId`, refs `updatedBy` |

## 19. Frontend Routing
Configured in `frontend/src/App.jsx` using React Router v7:
- **Public Routes**: `/` (Login), `/register` (Signup), `/forgot-password` (OTP Password Reset).
- **Protected Routes (`ProtectedRoute`)**: `/dashboard`, `/profile`, `/incidents`, `/incidents/create`, `/incidents/:id`, `/evidence`, `/evidence/upload`, `/evidence/:id`, `/verification`, `/verification/history`, `/audit-logs`, `/reports`, `/reports/view/:id`, `/users`, `/settings`.
- **Platform Admin Routes (`PlatformAdminRoute`)**: `/platform`, `/platform/companies`.

## 20. Backend/API Architecture
- **Server (`server.js`)**: Express server with CORS, security headers (`nosniff`, `DENY` x-frame, XSS protection, HSTS), JSON body parser, and error handling middleware.
- **Route Groups**: `/api/auth`, `/api/users`, `/api/incidents`, `/api/evidence`, `/api/blockchain`, `/api/audit-logs`, `/api/reports`, `/api/settings`, `/api/platform`, `/api/health`.

## 21. Security
1. **Password Hashing**: Bcrypt with 10 salt rounds (`select: false`).
2. **Stateless JWT**: Bearer token authentication middleware (`authMiddleware.js`).
3. **HTTP Headers**: HSTS, X-Content-Type-Options, X-Frame-Options DENY, XSS Protection.
4. **Rate Limiting**: Capped at 20 requests per 15 minutes per IP.
5. **Upload Validation**: Extension filter rejecting scripts/executables; memory buffer uploads.
6. **OTP Protection**: SHA-256 hashed OTPs, 10-min expiration, 5-attempt threshold.

## 22. Project Structure
```text
chainshield-dashboard-ui/
├── README.md
├── backend/
│   ├── server.js, seed.js, package.json
│   ├── config/          (db.js, cloudinary.js)
│   ├── contracts/       (EvidenceRegistry.sol, EvidenceLedger.sol)
│   ├── controllers/     (auth, incident, evidence, blockchain, platform, etc.)
│   ├── middleware/      (auth, role, rateLimiter, upload)
│   ├── models/          (User, Company, Incident, Evidence, AuditLog, Report, Settings)
│   ├── routes/          (Express route definitions)
│   ├── services/        (blockchainService.js, emailService.js)
│   ├── test/            (EvidenceRegistry.test.cjs)
│   └── utils/           (auditLogger.js, hashFile.js)
└── frontend/
    ├── package.json, vite.config.js, vercel.json
    └── src/
        ├── App.jsx, index.css, main.jsx
        ├── components/  (layout, common, dashboard, incidents)
        ├── context/     (AuthContext.jsx)
        ├── pages/       (Dashboard, Login, SignUp, ForgotPassword, Profile, etc.)
        └── services/    (api.js, authService, evidenceService, etc.)
```

## 23. Environment Variables
### Backend `.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/chainshield
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
MAX_EVIDENCE_FILE_SIZE=104857600
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your_smtp_user
BREVO_SMTP_KEY=your_smtp_key
BREVO_FROM_EMAIL=security@chainshield.io
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_NETWORK=Ethereum Sepolia Testnet (ChainID: 11155111)
BLOCKCHAIN_CHAIN_ID=31337
EVIDENCE_REGISTRY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 24. Local Setup
### Backend Setup
```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

### Seeded Demo Accounts (Company Code: `TECHNOVA` | Password: `Password123!`)
| Email | Role |
|---|---|
| `admin@chainshield.io` | Company Admin |
| `rohit@technova.test` | Incident Responder |
| `amit@technova.test` | Lead Investigator |
| `neha@technova.test` | Forensic Analyst |
| `priya@technova.test` | Auditor |

## 25. Deployment
- **Frontend**: Vite build (`npm run build`), deployed to Vercel/Netlify with route rewrites in `vercel.json`.
- **Backend API**: Node/Express server (`npm start`), deployed to Render/Railway or AWS EC2.
- **Database & Vault**: MongoDB Atlas cluster (TLS enabled), Cloudinary HTTPS media vault.
- **Smart Contracts**: Deployed to Ethereum Sepolia / EVM via Hardhat (`npx hardhat run scripts/deploy.cjs --network sepolia`).

## 26. Testing
- **Smart Contract Tests**: Hardhat test suite in `backend/test/EvidenceRegistry.test.cjs` testing hash storage, verification matching, duplicate prevention, and non-existent record handling (`npx hardhat test`).
- **Integration Test Scripts**: Backend flow scripts testing multi-tenant isolation (`test_multi_tenant_isolation.js`), registration (`test_full_registration_flow.js`), password reset (`test_forgot_password_flow.js`), and blockchain anchoring (`test_blockchain_flow.js`).

## 27. End-to-End Flow
```text
Platform Admin Approves Signup -> Company & Admin Active
  ↓
Company Admin Approves Employee & Assigns Role ('forensic_analyst')
  ↓
Analyst Creates Incident (INC-000001) [Status: pending_verification]
  ↓
Analyst Uploads Evidence (EVD-000001) -> Computes SHA-256 -> Streams to Vault -> Anchors Hash on Contract
  ↓
Analyst Handoffs Custody -> Appends Custody Event
  ↓
Analyst Runs 3-Tier Verification -> Re-Computes File Hash vs DB vs Contract -> Result: VERIFIED
  ↓
Analyst Generates Forensic Report (REP-000001) with Unified Timeline
```

## 28. Future Enhancements
- **IPFS Vault Integration**: Decentralized IPFS storage option alongside Cloudinary.
- **Multi-Chain Anchoring**: Simultaneous anchoring on Polygon and Hyperledger Fabric.
- **Hardware Security Module (HSM)**: Cloud HSM integration for automated transaction signing.
- **STIX/TAXII Sharing**: Standardized threat intelligence export.

## 29. Conclusion
ChainShield provides an end-to-end, production-ready system for cyber incident response and digital evidence integrity management. By combining multi-tenant query isolation, granular role-based access control, cryptographic SHA-256 verification, chain of custody logging, and EVM smart contract anchoring, ChainShield guarantees forensic non-repudiation across the entire evidence lifecycle.
