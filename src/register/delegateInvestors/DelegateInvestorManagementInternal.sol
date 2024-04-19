// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.17;

import {InvestorManagementStorage} from "../investors/InvestorManagementStorage.sol";
import {InvestorManagementInternal} from "../investors/InvestorManagementInternal.sol";
import {DelegateInvestorManagementStorage} from "./DelegateInvestorManagementStorage.sol";
import {IDelegateInvestorManagementInternal} from "./IDelegateInvestorManagementInternal.sol";

contract DelegateInvestorManagementInternal is
    IDelegateInvestorManagementInternal,
    InvestorManagementInternal
{
    function _setCustodianDelegate(address delegate) internal {
        require(_isCustodian(msg.sender), "Caller must be CST");
        DelegateInvestorManagementStorage.Layout
            storage l = DelegateInvestorManagementStorage.layout();
        address oldDelegate = l.custodianDelegates[msg.sender];
        l.custodianDelegates[msg.sender] = delegate;
        if (oldDelegate != address(0)) {
            emit CustodianDelegateUnset(msg.sender, oldDelegate);
        }
        emit CustodianDelegateSet(msg.sender, delegate);
    }

    function _unsetCustodianDelegate() internal {
        require(_isCustodian(msg.sender), "Caller must be CST");
        DelegateInvestorManagementStorage.Layout
            storage l = DelegateInvestorManagementStorage.layout();
        address oldDelegate = l.custodianDelegates[msg.sender];
        l.custodianDelegates[msg.sender] = address(0);
        emit CustodianDelegateUnset(msg.sender, oldDelegate);
    }

    function _isCustodianDelegate(
        address custodian,
        address delegate
    ) internal view returns (bool) {
        if (!_isCustodian(custodian)) {
            return false;
        }
        DelegateInvestorManagementStorage.Layout
            storage l = DelegateInvestorManagementStorage.layout();
        return l.custodianDelegates[custodian] == delegate;
    }

    function _getCustodianDelegate(
        address custodian
    ) internal view returns (address) {
        DelegateInvestorManagementStorage.Layout
            storage l = DelegateInvestorManagementStorage.layout();
        return l.custodianDelegates[custodian];
    }

    function _delegateEnableInvestorToWhitelist(
        address investor_,
        address delegator
    ) internal {
        require(investor_ != address(0), "investor address cannot be zero");

        require(
            _isCustodianDelegate(delegator, msg.sender),
            "Caller must be a custodian delegate"
        );

        _enableInvestor(investor_, delegator);
    }

    function _delegateDisableInvestorFromWhitelist(
        address investor_,
        address delegator_
    ) internal {
        require(investor_ != address(0), "investor address cannot be zero");
        InvestorManagementStorage.Layout storage l = InvestorManagementStorage
            .layout();

        require(
            _isCustodianDelegate(delegator_, msg.sender),
            "Caller must be a custodian delegate"
        );
        require(
            l.investorInfos[investor_].custodian == delegator_,
            "only the custodian can disallow the investor"
        );
        l.investorInfos[investor_].allowed = false;

        emit DisableInvestor(investor_);
    }
}
