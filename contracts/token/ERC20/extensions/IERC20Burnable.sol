// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

/**
 * @dev Extension of {ERC20} that allows holders or approved operators to burn tokens.
 */
interface IERC20Burnable {
    /**
     * @notice Destroys `amount` tokens from the caller.
     * @param amount The amount of tokens to burn.
     */
    function burn(uint256 amount) external;

    /**
     * @notice Destroys `amount` tokens from `account`, deducting from the caller's
     * allowance.
     * @param account The address whose tokens will be burnt.
     * @param amount The amount of tokens to burn.
     *
     * Requirements:
     *
     * - the caller must have allowance for ``accounts``'s tokens of at least
     * `amount`.
     */
    function burnFrom(address account, uint256 amount) external;
}
