// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.17;

library SmartContractAccessManagementStorage {
    struct Layout {
        mapping(bytes32 => bool) contractsAllowed;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("sobond.contracts.storage.SmartContractAccessManagement");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
