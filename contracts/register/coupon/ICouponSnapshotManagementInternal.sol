// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

interface ICouponSnapshotManagementInternal {
    /**
     * @dev Emitted by {_snapshot} when a snapshot identified by `id` is created.
     */
    event Snapshot(uint256 id);

    event SnapshotTimestampChange(
        uint256 indexed couponDate,
        uint256 indexed currentTimestamp,
        uint256 indexed nextTimestamp
    );
}
