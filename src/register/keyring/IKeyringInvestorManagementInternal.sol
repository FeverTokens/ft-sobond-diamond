// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.17;

interface IKeyringInvestorManagementInternal {
    /**
     * @notice Investor info
     * @param index Zero-based index on investor list
     * @param custodian The custodian
     * @param investor The investor
     * @param allowed True if investor whitelisted for transfer
     */
    struct InvestorInfo {
        uint256 index; /// @dev zero-based index on investor list
        address custodian;
        address investor;
        bool allowed; /// @dev true if investor whitelisted for transfer
    }

    /**
     * @notice Emitted when a wallet is added to the whitelist
     * @param toBeAdded The wallet to be added
     */
    event WalletAddedToWhitelist(address indexed toBeAdded);

    /**
     * @notice Emitted when a wallet is deleted from the whitelist
     * @param toBeDeleted The wallet to be deleted
     */
    event WalletDeletedFromWhitelist(address indexed toBeDeleted);

    /**
     * @notice Emitted when an investor is enabled
     * @param investor The investor
     */
    event EnableInvestor(address investor);

    /**
     * @notice Emitted when an investor is disabled
     * @param investor The investor
     */
    event DisableInvestor(address investor);
}
