// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IRegisterRoleManagementInternal } from "./IRegisterRoleManagementInternal.sol";
import { RegisterRoleManagementStorage } from "./RegisterRoleManagementStorage.sol";
import { AccessControlInternal, AccessControlStorage } from "../../access/rbac/AccessControlInternal.sol";

abstract contract RegisterRoleManagementInternal is
    IRegisterRoleManagementInternal,
    AccessControlInternal
{
    /**
     * Roles
     * They are managed through AccessControl smart contract
     * The roles are declared below
     */

    bytes32 public constant CAK_ROLE = keccak256("CAK_ROLE");
    bytes32 public constant BND_ROLE = keccak256("BND_ROLE"); //B&D role
    bytes32 public constant CST_ROLE = keccak256("CST_ROLE"); //Custodian role
    bytes32 public constant PAY_ROLE = keccak256("PAY_ROLE"); //Paying agent role

    function _registerAdmin() internal view returns (address) {
        RegisterRoleManagementStorage.Layout
            storage l = RegisterRoleManagementStorage.layout();
        return l.registerAdmin;
    }

    function _addressForNewAdmin() internal view returns (address) {
        RegisterRoleManagementStorage.Layout
            storage l = RegisterRoleManagementStorage.layout();
        return l.addressForNewAdmin;
    }

    function _firstVoterForNewAdmin() internal view returns (address) {
        RegisterRoleManagementStorage.Layout
            storage l = RegisterRoleManagementStorage.layout();
        return l.firstVoterForNewAdmin;
    }

    function _isBnD(address account) internal view returns (bool) {
        return _hasRole(BND_ROLE, account);
    }

    function _isPay(address account) internal view returns (bool) {
        return _hasRole(PAY_ROLE, account);
    }

    function _isCustodian(address account) internal view returns (bool) {
        return _hasRole(CST_ROLE, account);
    }

    function _isCAK(address account) internal view returns (bool) {
        return _hasRole(CAK_ROLE, account);
    }

    function _changeAdminRole(address account) internal {
        RegisterRoleManagementStorage.Layout
            storage l = RegisterRoleManagementStorage.layout();
        require(_hasRole(CAK_ROLE, msg.sender), "Caller must be CAK");
        require(
            account != l.registerAdmin,
            "New admin is the same as current one"
        );
        // require( // removing this condition for now, might be usefull to allow an existing CAK to become admin
        //     account_ != msg.sender,
        //     "This CAK can not vote for his own address"
        // );

        // Reset the process of changing the admin
        if (account == address(0) && l.votesForNewAdmin == 1) {
            l.votesForNewAdmin = 0;
            l.firstVoterForNewAdmin = address(0);
            l.addressForNewAdmin = account;
            return;
        }
        require(
            account != address(0),
            "The proposed new admin cannot be the zero address"
        );

        // First caller, initializa the change process
        if (l.votesForNewAdmin == 0) {
            l.votesForNewAdmin = 1;
            l.firstVoterForNewAdmin = msg.sender;
            l.addressForNewAdmin = account;
            return;
        }
        // Second caller, verify status and exectute change
        if (l.votesForNewAdmin == 1) {
            if (account != l.addressForNewAdmin) {
                // The second caller requested a different admin, reset the process
                l.firstVoterForNewAdmin = msg.sender;
                l.addressForNewAdmin = account;
                return;
            } else {
                require( // need 2 different CAK to perform the change
                    l.firstVoterForNewAdmin != msg.sender,
                    "This CAK has already voted"
                );
                // All good, execute the change
                super._revokeRole(DEFAULT_ADMIN_ROLE, l.registerAdmin); // remove previous admin
                _setupRole(DEFAULT_ADMIN_ROLE, l.addressForNewAdmin); // set new admin
                l.registerAdmin = l.addressForNewAdmin;
                // and reset the state
                l.votesForNewAdmin = 0;
                l.firstVoterForNewAdmin = address(0);
                l.addressForNewAdmin = address(0);
                emit AdminChanged(l.registerAdmin);
                return;
            }
        }
    }

    function _grantRole(
        bytes32 role,
        address account
    ) internal virtual override {
        if (role == DEFAULT_ADMIN_ROLE) {
            require(false, "Use function changeAdminRole instead");
        } else if (role == CAK_ROLE) {
            require(
                _hasRole(CAK_ROLE, msg.sender) ||
                    _hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
                "Caller must be CAK or ADMIN to set another CAK"
            );
        } else {
            require(
                _hasRole(CAK_ROLE, msg.sender),
                "Caller must be CAK to set a role"
            );
        }
        super._grantRole(role, account);
    }

    function _revokeRole(
        bytes32 role,
        address account
    ) internal virtual override {
        if (role == DEFAULT_ADMIN_ROLE) {
            require(false, "Use function changeAdminRole instead");
        }
        if (role == CAK_ROLE) {
            require(
                _hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
                "Caller must be ADMIN to remove a CAK"
            );
        } else {
            require(
                _hasRole(CAK_ROLE, msg.sender),
                "Caller must be CAK to remove a role"
            );
        }
        super._revokeRole(role, account);
    }

    function _grantCakRole(address cakAddress_) internal virtual {
        _grantRole(CAK_ROLE, cakAddress_);
    }

    function _revokeCakRole(address cakAddress_) internal virtual {
        _revokeRole(CAK_ROLE, cakAddress_);
    }

    function _grantBndRole(address bndAddress_) internal virtual {
        _grantRole(BND_ROLE, bndAddress_);
    }

    function _revokeBndRole(address bndAddress_) internal virtual {
        _revokeRole(BND_ROLE, bndAddress_);
    }

    function _grantCstRole(address cstAddress_) internal virtual {
        _grantRole(CST_ROLE, cstAddress_);
    }

    function _revokeCstRole(address cstAddress_) internal virtual {
        _revokeRole(CST_ROLE, cstAddress_);
    }

    function _grantPayRole(address payAddress_) internal virtual {
        _grantRole(PAY_ROLE, payAddress_);
    }

    function _revokePayRole(address payAddress_) internal virtual {
        _revokeRole(PAY_ROLE, payAddress_);
    }
}
