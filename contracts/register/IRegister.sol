// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IRegisterInternal } from "./IRegisterInternal.sol";
import { IRegisterMetadata } from "./metadata/IRegisterMetadata.sol";
import { IRegisterRoleManagement } from "./role/IRegisterRoleManagement.sol";
import { IERC20Snapshot } from "../token/ERC20/extensions/IERC20Snapshot.sol";
import { IERC20Metadata } from "../token/ERC20/extensions/IERC20Metadata.sol";

interface IRegister is
    IRegisterInternal,
    IRegisterMetadata,
    IRegisterRoleManagement,
    IERC20Snapshot,
    IERC20Metadata
{
    function primaryIssuanceAccount() external view returns (address);

    function returnBalanceToPrimaryIssuanceAccount(
        address investor
    ) external returns (bool);

    function getAllInvestors() external view returns (address[] memory);

    function disableInvestorFromWhitelist(address investor) external;

    function enableInvestorToWhitelist(address investor) external; //TODO: maybe expose getInvestorInfo(address investor) returns (InvestorInfo)

    function investorsAllowed(address investor) external view returns (bool);

    function investorCustodian(
        address investor
    ) external view returns (address);

    function checkIfCouponDateExists(
        uint256 _couponDate
    ) external returns (bool);

    function checkIfMaturityDateExists(
        uint256 _maturityDate
    ) external returns (bool);

    function makeReady() external;

    function revertReady() external;

    function publicMessage(address to, string memory message) external;

    function status() external view returns (Status);

    function setCurrentCouponDate(
        uint256 couponDate_,
        uint256 recordDatetime_
    ) external;

    // function removeFrominvestorsList(uint256 index) external; // should only be private
    function getInvestorListAtCoupon(
        uint256 CouponDate
    ) external returns (address[] memory);

    function toggleFrozen() external;
}
