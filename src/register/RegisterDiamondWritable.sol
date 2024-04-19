// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import {IDiamondWritable} from "../proxy/diamond/writable/IDiamondWritable.sol";
import {DiamondWritableInternal} from "../proxy/diamond/writable/DiamondWritableInternal.sol";
import {RegisterRoleManagementInternal} from "./role/RegisterRoleManagementInternal.sol";
import {RegisterMetadataInternal} from "./metadata/RegisterMetadataInternal.sol";
import {InitializableInternal} from "../initializable/InitializableInternal.sol";

/**
 * @title EIP-2535 "DiamondCut" for proxy update contract applied to so|bond register
 */
contract RegisterDiamondWritable is
    InitializableInternal,
    DiamondWritableInternal,
    RegisterRoleManagementInternal,
    RegisterMetadataInternal
{
    function initialize(
        string calldata name_,
        string calldata isin_,
        uint256 expectedSupply_,
        bytes32 currency_,
        uint256 unitVal_,
        uint256 couponRate_,
        uint256 creationDate_,
        uint256 issuanceDate_,
        uint256 maturityDate_,
        uint256[] memory couponDates_,
        uint256 cutofftime_
    ) external initializer {
        // initialize roles
        __init__RegisterRoleManagement();

        // initialize metadata
        __init__RegisterMetadata(
            name_,
            isin_,
            expectedSupply_,
            currency_,
            unitVal_,
            couponRate_,
            creationDate_,
            issuanceDate_,
            maturityDate_,
            couponDates_,
            cutofftime_
        );
    }

    function diamondCut(
        FacetCut[] calldata facetCuts,
        address target,
        bytes calldata data
    ) external {
        require(_isCAK(msg.sender), "Caller must be CAK to execute diamondCut");
        _diamondCut(facetCuts, target, data);
    }
}
