// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IRegisterMetadataInternal } from "./metadata/IRegisterMetadataInternal.sol";

interface IRegisterInternal is IRegisterMetadataInternal {
    // enum Status {
    //     Draft,
    //     Ready,
    //     Issued,
    //     Repaid,
    //     Frozen
    // }
    struct InvestorInfo {
        address investor; //TODO: de-normalisation maybe not needed
        bool allowed; // true if investor whitelisted for transfer
        uint256 index; // zero-based index on investor list
        address custodian;
    }
}
