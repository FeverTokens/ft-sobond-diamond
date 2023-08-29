// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

/**
 * @title ERC20 snapshot interface
 */
interface IERC20Snapshot {
    error ERC20Snapshot__SnapshotIdDoesNotExists();
    error ERC20Snapshot__SnapshotIdIsZero();

    /**
     * @dev Emitted by {_snapshot} when a snapshot identified by `id` is created.
     */
    event Snapshot(uint256 id);

    /**
     * @notice query the token balance of given account at given snapshot id
     * @param account address to query
     * @param snapshotId snapshot id to query
     * @return token balance
     */
    function balanceOfAt(
        address account,
        uint256 snapshotId
    ) external view returns (uint256);

    /**
     * @notice query the total minted token supply at given snapshot id
     * @param snapshotId snapshot id to query
     * @return token supply
     */
    function totalSupplyAt(uint256 snapshotId) external view returns (uint256);
}
