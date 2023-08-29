// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { ERC20BaseInternal } from "../base/ERC20BaseInternal.sol";

/**
 * @title ERC20Burnable internal functions
 */
abstract contract ERC20BurnableInternal is ERC20BaseInternal {
    function _burnFrom(address account, uint256 amount) public virtual {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }
}
