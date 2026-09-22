// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EvidenceRegistry
 * @notice Production-oriented Solidity smart contract for anchoring and verifying digital evidence cryptographic SHA-256 digests on-chain.
 */
contract EvidenceRegistry {
    struct EvidenceRecord {
        string evidenceId;
        string sha256Hash;
        uint256 timestamp;
        address submitter;
        bool isStored;
    }

    // Mapping from evidenceId => EvidenceRecord
    mapping(string => EvidenceRecord) private records;

    // Emitted when an evidence SHA-256 hash is successfully anchored on-chain
    event EvidenceHashStored(
        string indexed evidenceId,
        string sha256Hash,
        uint256 timestamp,
        address indexed submitter
    );

    /**
     * @notice Store evidence SHA-256 hash on-chain
     * @param evidenceId Human-readable unique evidence identifier (e.g. EVD-000001)
     * @param sha256Hash Cryptographic 64-character SHA-256 digest of the evidence file
     */
    function storeEvidenceHash(
        string calldata evidenceId,
        string calldata sha256Hash
    ) external {
        require(bytes(evidenceId).length > 0, "Evidence ID cannot be empty");
        require(bytes(sha256Hash).length > 0, "SHA-256 hash cannot be empty");
        require(!records[evidenceId].isStored, "Evidence record already exists");

        records[evidenceId] = EvidenceRecord({
            evidenceId: evidenceId,
            sha256Hash: sha256Hash,
            timestamp: block.timestamp,
            submitter: msg.sender,
            isStored: true
        });

        emit EvidenceHashStored(
            evidenceId,
            sha256Hash,
            block.timestamp,
            msg.sender
        );
    }

    /**
     * @notice Retrieve on-chain recorded SHA-256 hash and timestamp for evidence
     * @param evidenceId Unique evidence identifier
     */
    function getEvidenceHash(string calldata evidenceId)
        external
        view
        returns (
            string memory sha256Hash,
            uint256 timestamp,
            address submitter
        )
    {
        require(records[evidenceId].isStored, "Evidence record not found");
        EvidenceRecord memory record = records[evidenceId];
        return (record.sha256Hash, record.timestamp, record.submitter);
    }

    /**
     * @notice Verify if a calculated SHA-256 digest matches the stored on-chain hash
     * @param evidenceId Unique evidence identifier
     * @param sha256Hash SHA-256 digest to compare
     */
    function verifyEvidence(
        string calldata evidenceId,
        string calldata sha256Hash
    ) external view returns (bool) {
        if (!records[evidenceId].isStored) {
            return false;
        }
        return (keccak256(bytes(records[evidenceId].sha256Hash)) == keccak256(bytes(sha256Hash)));
    }
}
