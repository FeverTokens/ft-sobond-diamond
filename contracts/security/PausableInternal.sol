// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IPausable } from "./IPausable.sol";
import { PausableStorage } from "./PausableStorage.sol";

/**
 * @title Internal functions for Pausable security control module.
 */
abstract contract PausableInternal is IPausable {
    modifier whenNotPaused() {
        require(!_paused(), "Pausable: paused");
        _;
    }

    modifier whenPaused() {
        require(_paused(), "Pausable: not paused");
        _;
    }

    /**
     * @notice query whether contract is paused
     * @return status whether contract is paused
     */
    function _paused() internal view virtual returns (bool status) {
        status = PausableStorage.layout().paused;
    }

    /**
     * @notice Triggers paused state, when contract is unpaused.
     */
    function _pause() internal virtual whenNotPaused {
        PausableStorage.layout().paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Triggers unpaused state, when contract is paused.
     */
    function _unpause() internal virtual whenPaused {
        delete PausableStorage.layout().paused;
        emit Unpaused(msg.sender);
    }
}
