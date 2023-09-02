// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { ICouponInternal } from "./ICouponInternal.sol";

interface ICoupon is ICouponInternal {
    // TODO add documentation

    function getInvestorPayments(
        address _investor
    ) external view returns (PaymentStatus);

    function paymentIdForInvest(
        address _investor
    ) external view returns (bytes8);

    function setDateAsCurrentCoupon() external;

    function setNbDays(uint256 _nbDays) external;

    function setCutOffTime(uint256 _recordDate, uint256 _cutOfTime) external;

    function rejectCoupon() external;

    function getPaymentAmountForInvestor(
        address _investor
    ) external view returns (uint256 paymentAmount);

    function getTotalPaymentAmount()
        external
        view
        returns (uint256 paymentAmount);

    function toggleCouponPayment(address _investor) external;
}
