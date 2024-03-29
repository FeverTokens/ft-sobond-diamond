// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.17;

import { IInitializable } from "./IInitializable.sol";
import { InitializableInternal } from "./InitializableInternal.sol";

abstract contract Initializable is IInitializable, InitializableInternal {}
