# ChainShield — Cyber Incident & Evidence Integrity Platform

ChainShield is a full-stack cyber incident management application focused on incident lifecycle tracking, digital evidence integrity, SHA-256 verification, chain of custody, and auditability.

## Architecture

```text
ChainShield
├── backend/   Node.js + Express + MongoDB
├── frontend/  React + Vite
└── README.md
```

## Roles

### Company Admin
- Sees company-wide operational information.
- Approves/rejects employee accounts.
- Assigns or changes employee roles.
- Monitors incidents, evidence, verification and audit activity.

### Employee roles
- Incident Responder — creates incidents and performs first-response work.
- Lead Investigator — manages investigations and assigns personnel.
- Forensic Analyst — uploads/analyses evidence and performs integrity verification.
- Auditor — reviews audit history, evidence history and verification records.

Employee pages intentionally use a common ChainShield UI. The role controls the actions available to the user; backend RBAC enforces the same permissions even if a client tries to bypass the UI.

## Core Workflow

```text
Employee Signup
      ↓
Company Code
      ↓
Pending Account
      ↓
Company Admin Approval + Role Assignment
      ↓
Employee Login
      ↓
Role-Based Permissions
      ↓
Create Incident
      ↓
Pending Verification
      ↓
Company Admin / Lead Investigator Review
      ↓
Approved / Rejected
      ↓
Investigation
      ↓
Evidence Collection
      ↓
SHA-256 Hash
      ↓
Forensic Verification
      ↓
Chain of Custody
      ↓
Audit Trail
```

## Incident metadata

Incident ID, title, description, severity, threat vector, affected systems, impact, company, creator, verification status, verifier, assignment, timestamps and investigation timeline.

## Evidence metadata

Evidence ID, incident, original file name, type, file size, MIME type, SHA-256 hash, collector, current custodian, acquisition date, verification history, custody history and blockchain record fields.

## Local setup

### Requirements
- Node.js 18+
- MongoDB running locally or a MongoDB connection string

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`

## Demo company

Company code: `TECHNOVA`

Password for all seeded demo accounts: `Password123!`

| Account | Role |
|---|---|
| admin@chainshield.io | Company Admin |
| rohit@technova.test | Incident Responder |
| amit@technova.test | Lead Investigator |
| neha@technova.test | Forensic Analyst |
| priya@technova.test | Auditor |

## Important development note

Cloudinary/blockchain integrations from the original UI project remain in the backend, but the core local incident/evidence workflow is designed so the application architecture can be developed before production credentials and blockchain deployment are configured.
