// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

/// @title ERC-173 Contract Ownership Standard
///  Note: the ERC-165 identifier for this interface is 0x7f5828d0
interface IERC173 {
    /// @dev This emits when ownership of a contract changes.
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /**
     * @notice Get the address of the owner
     * @return The address of the owner.
     */
    function owner() external view returns (address);

    /**
     * @notice Set the address of the new owner of the contract
     * @param account The address of the new owner of the contract
     */
    function transferOwnership(address account) external;
}
