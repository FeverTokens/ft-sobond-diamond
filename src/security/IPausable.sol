// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.17;

interface IPausable {
    /**
     * @notice query whether contract is paused
     * @return status whether contract is paused
     */
    function paused() external view returns (bool status);
}
