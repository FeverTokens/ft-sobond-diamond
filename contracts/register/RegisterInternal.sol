// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IRegisterMetadataInternal } from "./metadata/IRegisterMetadataInternal.sol";
import { RegisterStorage } from "./RegisterStorage.sol";
import { RegisterMetadata } from "./metadata/RegisterMetadata.sol";

// IRegisterMetadataInternal,
abstract contract RegisterInternal is
    IRegisterMetadataInternal,
    RegisterMetadata
{

}
