// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.17;

interface ICouponSnapshotManagementInternal {
    /**
     * @notice The status of the HTLC.
     * @dev Unlocked: The asset is unlocked.
     * @dev Locked: The Asset is locked.
     * @dev Released: The Asset is released.
     * @dev ForceReleased: The Asset is force released.
     * @dev ForceCancelled: The Asset is force cancelled.
     */
    enum LockStatus {
        Unlocked,
        Locked,
        Released,
        Forced,
        Cancelled
    }

    /**
     * @notice The lock information.
     * @dev from: The address of the from.
     * @dev to: The address of the to.
     * @dev registry: The address of the registry.
     * @dev transactionId: The unique transaction id (e.g. uti).
     * @dev paymentID: The unique payment id (e.g. uetr).
     * @dev hashLock: The h of the secret which unlocks the contract assets.
     * @dev hashRelease: The h of the forced release.
     * @dev hashCancel: The h of the forced cancel.
     * @dev deliveryDate: The timestamp of when the asset will be released to the to.
     * @dev artifact: The artifacts of the HTLC.
     * @dev status: The status of the HTLC.
     */
    struct Lock {
        address from;
        address to;
        uint256 amount;
        bytes32 transactionId; // unique transaction id (e.g. uti)
        bytes32 hashLock; // h of the secret which unlocks the contract
        bytes32 hashRelease; // h of the forced release
        bytes32 hashCancel; // h of the forced cancel
        uint256 paymentDate; // timestamp of when the payment will be released to the from
        uint256 deliveryDate; // timestamp of when the asset will be released to the to
        bytes32 proof; // artifacts of the HTLC
        LockStatus status; // status of the HTLC
    }

    /**
     * @notice The snapshot information.
     * @dev snapshotId: The unique snapshot id.
     * @dev couponDate: The coupon date.
     * @dev timestamp: The timestamp of the snapshot.
     */
    event SnapshotTimestampChange(
        uint256 indexed couponDate,
        uint256 indexed currentTimestamp,
        uint256 indexed nextTimestamp
    );

    /**
     * @notice Event emitted when the asset is locked.
     * @param transactionId The unique transaction id (e.g. uti).
     * @param from The address of the from.
     * @param to The address of the to.
     * @param hashLock The h of the secret which unlocks the contract.
     * @param status The status of the HTLC.
     */
    event AssetHTLC(
        bytes32 indexed transactionId,
        address indexed from,
        address indexed to,
        bytes32 hashLock,
        LockStatus status
    );
}
