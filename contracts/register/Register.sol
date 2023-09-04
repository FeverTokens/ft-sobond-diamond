// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IRegister } from "./IRegister.sol";
import { RegisterInternal, RegisterMetadata } from "./RegisterInternal.sol";

abstract contract Register is IRegister, RegisterInternal {}
