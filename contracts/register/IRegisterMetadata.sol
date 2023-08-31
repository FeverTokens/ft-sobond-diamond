// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IRegisterMetadataInternal } from "./IRegisterMetadataInternal.sol";

interface IRegisterMetadata is IRegisterMetadataInternal {
    /**
     * @notice Set the ISIN Symbol of the registar
     * @param isinSymbol The ISIN Symbol
     */
    function setIsinSymbol(string memory isinSymbol) external;

    /**
     * @notice Set the currency of the registar
     * @param currency The currency
     */
    function setCurrency(bytes32 currency) external;

    /**
     * @notice Get the creation date of the registar
     * @return The creation date
     */
    function getCreationDate() external view returns (uint256);

    /**
     * @notice Get the Issuance date of the Security Token
     * @return The Issuance date
     */
    function getIssuanceDate() external view returns (uint256);

    /**
     * @notice Set the creation date of the registar
     * @param creationDate The creation date
     */
    function setCreationDate(uint256 creationDate) external;

    /**
     * @notice Set the creation date of the registar
     * @param issuanceDate The creation date
     */
    function setIssuanceDate(uint256 issuanceDate) external;

    /**
     * @notice Set Bond data
     * @param name The name of the bond
     * @param expectedSupply The expected supply of the bond
     * @param currency The currency of the bond
     * @param unitVal The unit value of the bond
     * @param couponRate The coupon rate of the bond
     * @param issuanceDate The issuance date of the bond
     * @param maturityDate The maturity date of the bond
     *
     */
    function setBondData(
        string memory name,
        uint256 expectedSupply,
        bytes32 currency,
        uint256 unitVal,
        uint256 couponRate,
        uint256 issuanceDate,
        uint256 maturityDate,
        uint256 cutOffTime
    ) external;

    /**
     * @notice Add a coupon date
     * @param date The date to add
     */
    function addCouponDate(uint256 date) external;

    /**
     * @notice Delete a coupon date
     * @param date The date to delete
     */
    function delCouponDate(uint256 date) external;

    /**
     * @notice Set expected supply
     * @param expectedSupply The expected supply
     */
    function setExpectedSupply(uint256 expectedSupply) external;

    /**
     * @notice Get the Bond
     * @return The bond data
     */
    function getBondData() external view returns (BondData memory);

    /**
     * @notice Get Bond coupon rate
     * @return The bond coupon rate
     */
    function getBondCouponRate() external view returns (uint256);

    /**
     * @notice Get Bond unit value
     * @return The bond unit value
     */
    function getBondUnitValue() external view returns (uint256);
}
