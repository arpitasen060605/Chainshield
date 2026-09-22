// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EvidenceLedger - ChainShield Immutable Evidence Integrity Registry
 * @notice Stores cryptographic SHA-256 digests and proof anchors for digital forensic evidence.
 */
contract EvidenceLedger {
    struct EvidenceProof {
        string evidenceId;
        string sha256Hash;
        string actionType;
        uint256 timestamp;
        address registeredBy;
        bool isRegistered;
    }

    // Mapping from evidenceId => EvidenceProof
    mapping(string => EvidenceProof) private proofs;

    // Events emitted on ledger commits
    event EvidenceProofRegistered(
        string indexed evidenceId,
        string sha256Hash,
        string actionType,
        uint256 timestamp,
        address indexed registeredBy
    );

    /**
     * @notice Register evidence cryptographic hash on the blockchain ledger
     * @param evidenceId Human-readable evidence identifier (e.g. EVD-000001)
     * @param sha256Hash 256-bit SHA-256 digest calculated from digital evidence file
     * @param actionType Action label (e.g. EVIDENCE_REGISTERED, CUSTODY_TRANSFERRED)
     */
    function registerProof(
        string calldata evidenceId,
        string calldata sha256Hash,
        string calldata actionType
    ) external returns (bytes32 txProofHash) {
        require(bytes(evidenceId).length > 0, "Evidence ID cannot be empty");
        require(bytes(sha256Hash).length > 0, "SHA-256 hash cannot be empty");

        proofs[evidenceId] = EvidenceProof({
            evidenceId: evidenceId,
            sha256Hash: sha256Hash,
            actionType: actionType,
            timestamp: block.timestamp,
            registeredBy: msg.sender,
            isRegistered: true
        });

        emit EvidenceProofRegistered(
            evidenceId,
            sha256Hash,
            actionType,
            block.timestamp,
            msg.sender
        );

        return keccak256(abi.encodePacked(evidenceId, sha256Hash, block.timestamp));
    }

    /**
     * @notice Verify whether a given SHA-256 hash matches the on-chain recorded digest
     * @param evidenceId Human-readable evidence identifier
     * @param sha256Hash SHA-256 hash to verify against the ledger
     */
    function verifyProof(
        string calldata evidenceId,
        string calldata sha256Hash
    ) external view returns (bool isMatch, uint256 registeredTimestamp, address registeredBy) {
        EvidenceProof memory proof = proofs[evidenceId];
        require(proof.isRegistered, "Proof not found on ledger");

        bool matchResult = (keccak256(bytes(proof.sha256Hash)) == keccak256(bytes(sha256Hash)));
        return (matchResult, proof.timestamp, proof.registeredBy);
    }

    /**
     * @notice Get stored proof for evidence
     * @param evidenceId Human-readable evidence identifier
     */
    function getProof(string calldata evidenceId)
        external
        view
        returns (
            string memory evidenceIdOut,
            string memory sha256Hash,
            string memory actionType,
            uint256 timestamp,
            address registeredBy
        )
    {
        EvidenceProof memory proof = proofs[evidenceId];
        require(proof.isRegistered, "Proof not found on ledger");

        return (
            proof.evidenceId,
            proof.sha256Hash,
            proof.actionType,
            proof.timestamp,
            proof.registeredBy
        );
    }
}
