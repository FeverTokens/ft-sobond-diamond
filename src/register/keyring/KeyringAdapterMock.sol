// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0
pragma solidity ^0.8.17;

contract KeyringAdapterMock {

    mapping(uint256=>mapping(address=>bool)) public mockCredentials;

    function checkCredential(uint256 policyId, address account) external view returns (bool) {
        return mockCredentials[policyId][account];
    }
    
    function setCheckCredentialResult(uint256 policyId, address account, bool result) external {
        mockCredentials[policyId][account] = result;
    }
}
