// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { ERC20BaseInternal } from "../base/ERC20BaseInternal.sol";
import { IERC20BurnableInternal } from "./IERC20BurnableInternal.sol";

/**
 * @title ERC20 burnable internal functions
 */
abstract contract ERC20BurnableInternal is
    IERC20BurnableInternal,
    ERC20BaseInternal
{
    function _burnFrom(address account, uint256 amount) public virtual {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }
}
