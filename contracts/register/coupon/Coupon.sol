// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { ICoupon } from "./ICoupon.sol";
import { CouponInternal } from "./CouponInternal.sol";
import { ReentrancyGuard } from "../../security/ReentrancyGuard.sol";

contract Coupon is ICoupon, CouponInternal, ReentrancyGuard {
    /// @inheritdoc ICoupon
    function getInvestorPayments(
        address _investor
    ) public view returns (PaymentStatus) {
        return _getInvestorPayments(_investor);
    }

    /// @inheritdoc ICoupon
    function paymentIdForInvest(
        address _investor
    ) external view returns (bytes8) {
        return _paymentIdForInvest(_investor);
    }

    /// @inheritdoc ICoupon
    function setDateAsCurrentCoupon() public {
        _setDateAsCurrentCoupon();
    }

    /// @inheritdoc ICoupon
    function setNbDays(uint256 _nbDays) public {
        _setNbDays(_nbDays);
    }

    /// @inheritdoc ICoupon
    function setCutOffTime(uint256 _recordDate, uint256 _cutOfTime) public {
        _setCutOffTime(_recordDate, _cutOfTime);
    }

    /// @inheritdoc ICoupon
    function rejectCoupon() public {
        _rejectCoupon();
    }

    /// @inheritdoc ICoupon
    function getPaymentAmountForInvestor(
        address _investor
    ) public view returns (uint256 paymentAmount) {
        paymentAmount = _getPaymentAmountForInvestor(_investor);
    }

    /// @inheritdoc ICoupon
    function getTotalPaymentAmount()
        public
        view
        returns (uint256 paymentAmount)
    {
        paymentAmount = _getTotalPaymentAmount();
    }

    /// @inheritdoc ICoupon
    function toggleCouponPayment(address _investor) public {
        _toggleCouponPayment(_investor);
    }
}
