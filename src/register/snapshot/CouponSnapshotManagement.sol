// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.17;

import {ICouponSnapshotManagement} from "./ICouponSnapshotManagement.sol";
import {CouponSnapshotManagementInternal} from "./CouponSnapshotManagementInternal.sol";
import {IERC20, IERC20Base, ERC20Base} from "../../token/ERC20/base/ERC20Base.sol";

contract CouponSnapshotManagement is
    ICouponSnapshotManagement,
    CouponSnapshotManagementInternal
{
    /**
     * @inheritdoc ICouponSnapshotManagement
     */
    function balanceOfCoupon(
        address account,
        uint256 _couponDate
    ) external view virtual returns (uint256) {
        return _balanceOfCoupon(account, _couponDate);
    }

    /**
     * @inheritdoc ICouponSnapshotManagement
     */
    function totalSupplyAtCoupon(
        uint256 _couponDate
    ) public view virtual returns (uint256) {
        return _totalSupplyAtCoupon(_couponDate);
    }

    /**
     * @inheritdoc ICouponSnapshotManagement
     */
    function currentCouponDate() external view returns (uint256) {
        return _currentCouponDate();
    }

    /**
     * @inheritdoc ICouponSnapshotManagement
     */
    function currentSnapshotDatetime() external view returns (uint256) {
        return _currentSnapshotDatetime();
    }

    /**
     * @inheritdoc ICouponSnapshotManagement
     */
    function nextSnapshotDatetime() external view returns (uint256) {
        return _nextSnapshotDatetime();
    }

    /**
     * @inheritdoc ICouponSnapshotManagement
     */
    function getInvestorListAtCoupon(
        uint256 CouponDate
    ) public view override returns (address[] memory) {
        return _getInvestorListAtCoupon(CouponDate);
    }

    /**
     * @dev transfer is disabled
     */
    function transfer(
        address /*to_*/,
        uint256 /*amount_*/
    ) public virtual override(ERC20Base, IERC20) returns (bool) {
        revert("transfer is disabled");
    }

    /**
     * @dev approve is disabled
     */
    function approve(
        address /*spender_*/,
        uint256 /*amount_*/
    ) public virtual override(ERC20Base, IERC20) returns (bool) {
        revert("approve is disabled");
    }

    // /**

    /**
     * @inheritdoc IERC20
     *
     * @dev this function can be called by a CAK or an authorized smart contract (see mapping _contractsAllowed)
     *      if called by the CAK, then the transfer is done
     *      if called by an authorized smart contract, the transfer is done
     */
    function transferFrom(
        address from_,
        address to_,
        uint256 amount_
    ) public virtual override(ERC20Base, IERC20) returns (bool) {
        return _transferFrom(from_, to_, amount_);
    }

    /**
     * @dev increaseAllowance is disabled
     */
    function increaseAllowance(
        address /*spender_*/,
        uint256 /*addedValue_*/
    ) public virtual override(ERC20Base, IERC20Base) returns (bool) {
        revert("increaseAllowance is disabled");
    }

    /**
     * @dev decreaseAllowance is disabled
     */
    function decreaseAllowance(
        address /*spender_*/,
        uint256 /*subtractedValue_*/
    ) public virtual override(ERC20Base, IERC20Base) returns (bool) {
        revert("decreaseAllowance is disabled");
    }

    /**
     * @inheritdoc ICouponSnapshotManagement
     */
    function returnBalanceToPrimaryIssuanceAccount(
        address investor
    ) public override returns (bool) {
        return _returnBalanceToPrimaryIssuanceAccount(investor);
    }

    /**
     * @inheritdoc ICouponSnapshotManagement
     */
    function mint(uint256 amount_) public {
        _mint(amount_);
    }

    /**
     * @inheritdoc ICouponSnapshotManagement
     */
    function burn(uint256 amount_) public {
        _burn(amount_);
    }

    /**
     * @inheritdoc ICouponSnapshotManagement
     */
    function lock(
        address from,
        address to,
        uint256 amount,
        bytes32 transactionId,
        bytes32 hashLock,
        bytes32 hashRelease,
        bytes32 hashCancel,
        uint256 paymentDate,
        uint256 deliveryDate,
        bytes32 proof
    ) public {
        _lock(
            from,
            to,
            amount,
            transactionId,
            hashLock,
            hashRelease,
            hashCancel,
            paymentDate,
            deliveryDate,
            proof
        );
    }

    /**
     * @inheritdoc ICouponSnapshotManagement
     */
    function release(
        bytes32 transactionId,
        bytes32 secret,
        bytes32 proof,
        LockStatus status_
    ) public {
        _release(transactionId, secret, proof, status_);
    }

    /**
     * @inheritdoc ICouponSnapshotManagement
     */
    function getLock(bytes32 transactionId) public view returns (Lock memory) {
        return _getLock(transactionId);
    }
}
