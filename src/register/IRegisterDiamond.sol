// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import {IDiamondBase} from "../proxy/diamond/base/IDiamondBase.sol";

interface IRegisterDiamond is IDiamondBase {
    receive() external payable;
}
