// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.17;

import { IKeyringInvestorManagement } from "./IKeyringInvestorManagement.sol";
import { KeyringInvestorManagementInternal } from "./KeyringInvestorManagementInternal.sol";

contract KeyringInvestorManagement is IKeyringInvestorManagement, KeyringInvestorManagementInternal {

    constructor(address keyringAdapterAddress, uint256 policyId) KeyringInvestorManagementInternal(keyringAdapterAddress, policyId) {}
    
    /**
     * @inheritdoc IKeyringInvestorManagement
     */
    function getAllInvestors() public view returns (address[] memory) {
        return _getAllInvestors();
    }

    /**
     * @inheritdoc IKeyringInvestorManagement
     */
    function disableInvestorFromWhitelist(address investor_) public {
        _disableInvestorFromWhitelist(investor_);
    }

    ///@inheritdoc IKeyringInvestorManagement
    function enableInvestorToWhitelist(address investor_) public {
        _enableInvestorToWhitelist(investor_);
    }

    function investorsAllowed(address investor) public view returns (bool) {
        return _investorsAllowed(investor);
    }

    /**
     * @inheritdoc IKeyringInvestorManagement
     */
    function investorCustodian(address investor) public view returns (address) {
        return _investorCustodian(investor);
    }
}
