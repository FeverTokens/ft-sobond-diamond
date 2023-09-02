// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { ITrade } from "../ITrade.sol";
import { IPrimaryIssuanceInternal } from "./IPrimaryIssuanceInternal.sol";

interface IPrimaryIssuance is IPrimaryIssuanceInternal, ITrade {
    /**
     * @notice Return the account of the primary issuance
     * @return account of the primary issuance
     */
    function account() external view returns (address);

    /**
     * @notice Return the offer price of the primary issuance
     * @return offer price of the primary issuance
     */
    function offerPrice() external view returns (uint256);

    /**
     * @notice Validate the primary issuance
     * @dev Only the beneficiary B&D can validate the primary issuance
     */
    function validate() external;

    /**
     * @notice Reject the primary issuance
     * @dev Only the beneficiary B&D can reject the primary issuance
     */
    function reject() external;
}
