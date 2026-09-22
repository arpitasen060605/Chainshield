# ChainShield - Blockchain Evidence Integrity System

This document provides a comprehensive guide to the **Blockchain Evidence Integrity System** in ChainShield. It details the system architecture, smart contract specification, Ethers.js integration, off-chain vs. on-chain storage rationale, upload & verification workflows, local Hardhat setup, and public Ethereum testnet deployment.

---

## 🗺️ System Architecture Diagram

```text
User / Client
      │
      ▼
┌─────────────┐
│  Frontend   │ (React Dashboard, Evidence Details & Verification Engine)
└──────┬──────┘
       │ HTTP / REST API (JWT & RBAC Protected)
       ▼
┌─────────────┐       ┌─────────────────┐
│   Backend   ├──────►│   Cloudinary    │ (Stores actual raw evidence files)
│  (Express)  │       └─────────────────┘
└──────┬──────┘       ┌─────────────────┐
       ├─────────────►│    MongoDB      │ (Stores metadata, SHA-256, custody, blockchain tx details)
       │              └─────────────────┘
       │ Ethers.js v6
       ▼
┌───────────────────────────────────────┐
│ Smart Contract (EvidenceRegistry.sol) │ (Anchors SHA-256 Hash + Evidence ID + Timestamp)
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ Public Ethereum Testnet / Local Node │ (Immutable ledger consensus verification)
└───────────────────────────────────────┘
```

---

## 💡 Rationale & Storage Strategy

### 1. Why Cloudinary?
Raw evidence files (images, disk dumps, pcap captures, memory files) can range from megabytes to gigabytes. Storing large binary files directly on a blockchain is prohibitively expensive, slow, and unsuitable for smart contract execution. Cloudinary provides high-availability, encrypted cloud storage for original files.

### 2. Why MongoDB?
MongoDB acts as the application's high-speed metadata store. It manages user authentication, role-based access control (RBAC), incident relationships, chain of custody event logs, and local index tracking for instant querying.

### 3. Why Blockchain?
While MongoDB stores application state, database records can theoretically be altered by privileged database administrators. The **Ethereum-compatible blockchain smart contract** provides an immutable, tamper-resistant cryptographic anchor. Once an evidence SHA-256 hash is committed to a smart contract block, it cannot be modified, deleted, or backdated by anyone.

### 📊 Off-Chain vs. On-Chain Data Breakdown

| Data Attribute | Stored Off-Chain (MongoDB / Cloudinary) | Stored On-Chain (Smart Contract) |
| :--- | :---: | :---: |
| **Actual Evidence File** | ✅ Cloudinary Vault | ❌ Never |
| **Original File Name, Size, MIME Type** | ✅ MongoDB | ❌ Never |
| **Incident Details & Custody Logs** | ✅ MongoDB | ❌ Never |
| **User Identities, JWTs, Passwords** | ✅ MongoDB | ❌ Never |
| **Human-Readable Evidence ID** | ✅ MongoDB | ✅ `EvidenceRegistry` |
| **256-Bit SHA-256 Cryptographic Hash** | ✅ MongoDB | ✅ `EvidenceRegistry` |
| **Anchor Timestamp & Submitter Address**| ✅ MongoDB | ✅ `EvidenceRegistry` |

---

## 📜 Smart Contract Specification (`EvidenceRegistry.sol`)

The `EvidenceRegistry` contract ([`backend/contracts/EvidenceRegistry.sol`](file:///d:/Movies/chainshield-dashboard-ui/backend/contracts/EvidenceRegistry.sol)) is written in Solidity `^0.8.20`.

### Key Functions
1. `storeEvidenceHash(string calldata evidenceId, string calldata sha256Hash) external`
   - Validates that `evidenceId` and `sha256Hash` are non-empty.
   - Prevents overwriting existing records (`require(!records[evidenceId].isStored, "Evidence record already exists")`).
   - Emits `event EvidenceHashStored(string indexed evidenceId, string sha256Hash, uint256 timestamp, address indexed submitter)`.
2. `getEvidenceHash(string calldata evidenceId) external view returns (string memory sha256Hash, uint256 timestamp, address submitter)`
   - Queries stored on-chain hash, block timestamp, and submitter wallet address.
3. `verifyEvidence(string calldata evidenceId, string calldata sha256Hash) external view returns (bool)`
   - Compares the provided digest against the on-chain recorded digest using `keccak256`.

---

## ⚙️ Backend Services & Ethers.js Integration

### `backend/services/blockchainService.js`
Uses **Ethers.js v6** to manage RPC connections, sign transactions, and read smart contract state:
- **`storeEvidenceHash(evidenceId, sha256Hash)`**: Instantiates `EvidenceRegistry` contract via `ethers.Wallet`, submits transaction, waits for 1 block confirmation, and returns block number, transaction hash, contract address, and network details.
- **`getEvidenceHash(evidenceId)`**: Performs a read-only query against the smart contract.
- **`verifyEvidenceHash(evidenceId, sha256Hash)`**: Calls `verifyEvidence` view function.

### Graceful Failure Handling
If the blockchain RPC network is unreachable or a transaction times out:
1. Cloudinary upload and MongoDB evidence record creation still succeed.
2. `evidence.blockchainRecord.status` is set to `"failed"` with error details.
3. The user is provided with an **"Anchor On-Chain Now"** button in the UI to retry anchoring without losing evidence integrity.

---

## 🔍 3-Tier Verification Workflow

When an investigator clicks **"Verify Integrity"**:
1. **File Digest Check**: Computes current SHA-256 digest of the file stored in Cloudinary (`currentHash`).
2. **Database Baseline Check**: Compares `currentHash` against original `evidence.sha256Hash` in MongoDB (`databaseHashMatch`).
3. **On-Chain Blockchain Check**: Calls `verifyEvidence(evidenceId, currentHash)` on `EvidenceRegistry` contract (`blockchainHashMatch`).

**Result**:
- **MATCH**: `fileIntegrity && databaseHashMatch && blockchainHashMatch` ➔ Evidence file integrity is verified authentic against on-chain smart contract record.
- **MISMATCH**: If any check fails ➔ Alert banner warns of potential evidence tampering.

---

## 🛠️ Local Development & Hardhat Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run Hardhat Unit Test Suite
```bash
npx hardhat test
```

### 3. Deploy Contract to Local Node
Start a local Hardhat node (optional for standalone node):
```bash
npx hardhat node
```

In a second terminal, deploy `EvidenceRegistry`:
```bash
npx hardhat run scripts/deploy.cjs --network localhost
```

---

## 🌐 Public Ethereum Testnet Deployment Guide (e.g. Sepolia)

### 1. Configure Environment Variables
In `backend/.env`:
```env
BLOCKCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
BLOCKCHAIN_PRIVATE_KEY=0xYOUR_SEPOLIA_ACCOUNT_PRIVATE_KEY
EVIDENCE_REGISTRY_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
BLOCKCHAIN_CHAIN_ID=11155111
BLOCKCHAIN_NETWORK=Ethereum Sepolia Testnet (ChainID: 11155111)
BLOCKCHAIN_EXPLORER_URL=https://sepolia.etherscan.io
```

### 2. Deploy Contract to Sepolia Testnet
```bash
cd backend
npx hardhat run scripts/deploy.cjs --network sepolia
```
Copy the output contract address and paste into `EVIDENCE_REGISTRY_CONTRACT_ADDRESS=` in `backend/.env`.

### 3. Start Backend & Frontend
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Verify On-Chain Transactions
Upload evidence via the frontend. Click the transaction hash link in **Evidence Details** to view your live on-chain contract interaction on [Sepolia Etherscan](https://sepolia.etherscan.io).
