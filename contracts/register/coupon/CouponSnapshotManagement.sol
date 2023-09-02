// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { ICouponSnapshotManagement } from "./ICouponSnapshotManagement.sol";
import { CouponSnapshotManagementInternal } from "./CouponSnapshotManagementInternal.sol";

abstract contract CouponSnapshotManagement is
    ICouponSnapshotManagement,
    CouponSnapshotManagementInternal
{
    /// @inheritdoc ICouponSnapshotManagement
    function currentSnapshotDatetime() external view returns (uint256) {
        return _currentSnapshotDatetime();
    }

    /// @inheritdoc ICouponSnapshotManagement
    function nextSnapshotDatetime() external view returns (uint256) {
        return _nextSnapshotDatetime();
    }

    /// @inheritdoc ICouponSnapshotManagement
    function currentCouponDate() external view returns (uint256) {
        return _currentCouponDate();
    }

    /// @inheritdoc ICouponSnapshotManagement
    function balanceOfCoupon(
        address account,
        uint256 _couponDate
    ) external view virtual returns (uint256) {
        return _balanceOfCoupon(account, _couponDate);
    }

    /// @inheritdoc ICouponSnapshotManagement
    function totalSupplyAtCoupon(
        uint256 _couponDate
    ) public view virtual returns (uint256) {
        return _totalSupplyAtCoupon(_couponDate);
    }
}
