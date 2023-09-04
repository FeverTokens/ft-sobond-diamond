// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { ICouponSnapshotManagement } from "./ICouponSnapshotManagement.sol";
import { CouponSnapshotManagementInternal, ERC20Metadata } from "./CouponSnapshotManagementInternal.sol";

import { IERC20Metadata } from "../../token/ERC20/extensions/IERC20Metadata.sol";

abstract contract CouponSnapshotManagement is
    ICouponSnapshotManagement,
    CouponSnapshotManagementInternal
{
    function name()
        public
        view
        override(IERC20Metadata, ERC20Metadata)
        returns (string memory)
    {
        return _name();
    }

    function symbol()
        public
        view
        override(IERC20Metadata, ERC20Metadata)
        returns (string memory)
    {
        return _symbol();
    }

    function decimals()
        public
        view
        override(IERC20Metadata, ERC20Metadata)
        returns (uint8)
    {
        return _decimals();
    }

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
