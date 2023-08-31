// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IRegisterMetadata } from "./IRegisterMetadata.sol";
import { RegisterMetadataInternal } from "./RegisterMetadataInternal.sol";

abstract contract RegisterMetadata is
    IRegisterMetadata,
    RegisterMetadataInternal
{}
