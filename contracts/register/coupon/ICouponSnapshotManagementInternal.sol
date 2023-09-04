// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

// import { IERC20SnapshotInternal } from "../../token/ERC20/extensions/IERC20SnapshotInternal.sol";

interface ICouponSnapshotManagementInternal {
    event SnapshotTimestampChange(
        uint256 indexed couponDate,
        uint256 indexed currentTimestamp,
        uint256 indexed nextTimestamp
    );
}
