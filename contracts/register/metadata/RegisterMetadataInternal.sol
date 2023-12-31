// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { CouponSnapshotManagementInternal } from "../coupon/CouponSnapshotManagementInternal.sol";
import { IRegisterMetadataInternal } from "./IRegisterMetadataInternal.sol";
import { RegisterMetadataStorage } from "./RegisterMetadataStorage.sol";
import { RegisterRoleManagementInternal } from "../role/RegisterRoleManagementInternal.sol";

abstract contract RegisterMetadataInternal is
    IRegisterMetadataInternal,
    CouponSnapshotManagementInternal
{
    function _setIsinSymbol(
        string memory _isinSymbol
    ) internal virtual onlyRole(CAK_ROLE) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        l.data.isin = _isinSymbol;
    }

    function _setCurrency(
        bytes32 _currency
    ) internal virtual onlyRole(CAK_ROLE) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        l.data.currency = _currency;
    }

    function _getCreationDate() internal view virtual returns (uint256) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        return l.data.creationDate;
    }

    function _getIssuanceDate() internal view virtual returns (uint256) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        return l.data.issuanceDate;
    }

    function _setCreationDate(
        uint256 _creationDate
    ) internal virtual onlyRole(CAK_ROLE) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        l.data.creationDate = _creationDate;
    }

    function _setIssuanceDate(
        uint256 issuanceDate_
    ) internal virtual onlyRole(CAK_ROLE) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        l.data.issuanceDate = issuanceDate_;
    }

    function _setBondData(
        string memory name_,
        uint256 expectedSupply_,
        bytes32 currency_,
        uint256 unitVal_,
        uint256 couponRate_,
        uint256 issuanceDate_,
        uint256 maturityDate_,
        uint256 cutOffTime_
    ) internal virtual onlyRole(CAK_ROLE) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();

        if (l.data.couponDates.length > 0) {
            require(
                l.data.couponDates[0] > l.data.issuanceDate,
                "Cannot set a issuance date after the first coupon date"
            );
            require(
                l.data.couponDates[l.data.couponDates.length - 1] <
                    l.data.maturityDate,
                "Cannot set a maturity date before the last coupon date"
            );
        }

        l.data.name = name_;
        l.data.expectedSupply = expectedSupply_;
        l.data.currency = currency_;
        l.data.unitValue = unitVal_;
        l.data.couponRate = couponRate_;
        l.data.issuanceDate = issuanceDate_;
        l.data.maturityDate = maturityDate_;
        l.data.cutOffTime = cutOffTime_;
    }

    function _addCouponDate(uint256 date) internal virtual onlyRole(CAK_ROLE) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        require(
            date > l.data.issuanceDate,
            "Cannot set a coupon date smaller or equal to the issuance date"
        );
        require(
            date < l.data.maturityDate,
            "Cannot set a coupon date greater or equal to the maturity date"
        );
        (uint256 index, bool found) = _findCouponIndex(date);
        if (!found) {
            require(
                _canInsertCouponDate(date),
                "Cannot insert this date, it is in the past"
            );
            // need to move the items up and insert the item
            if (l.data.couponDates.length > 0) {
                l.data.couponDates.push(
                    l.data.couponDates[l.data.couponDates.length - 1]
                );
                // now length has one more so length-2 is the previous latest element
                if (l.data.couponDates.length >= 3) {
                    // we had at least 2 elements before so perform the copy
                    for (
                        uint256 i = l.data.couponDates.length - 3;
                        i >= index;
                        i--
                    ) {
                        l.data.couponDates[i + 1] = l.data.couponDates[i];
                        if (i == 0) break;
                    }
                }
                // now add the new item
                l.data.couponDates[index] = date;
            } else {
                // there was no item initially, so add the new item
                l.data.couponDates.push(date);
            }
            // ensure adding this date in the coupons will update the snapshot preparation properly
            _initCurrentCoupon();
        } // the coupon already exists do nothing
    }

    function _delCouponDate(uint256 date) internal virtual onlyRole(CAK_ROLE) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        (uint256 index, bool found) = _findCouponIndex(date);
        if (found) {
            // the index represents the position where the date is present
            require(
                _canDeleteCouponDate(date),
                "This coupon date cannot be deleted"
            );
            if (index < l.data.couponDates.length - 1) {
                for (
                    uint256 i = index;
                    i < l.data.couponDates.length - 1;
                    i++
                ) {
                    l.data.couponDates[i] = l.data.couponDates[i + 1];
                }
            }
            l.data.couponDates.pop(); // remove the last item that can be the index item or not
            _initCurrentCoupon();
        } // else not found so no need to delete
    }

    function _setExpectedSupply(
        uint256 expectedSupply_
    ) internal virtual onlyRole(CAK_ROLE) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        require(
            l.status == Status.Draft,
            "lifecycle violation - only allowed when status is in draft"
        );
        l.data.expectedSupply = expectedSupply_;
    }

    function _getBondData() internal view virtual returns (BondData memory) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        return l.data;
    }

    function _getBondCouponRate() internal view virtual returns (uint256) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        return l.data.couponRate;
    }

    function _getBondUnitValue() internal view virtual returns (uint256) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        return l.data.unitValue;
    }

    /***** ##### Other Internal funtions ##### *****/

    function _primaryIssuanceAccount() internal view returns (address) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        return l.primaryIssuanceAccount;
    }

    function _returnBalanceToPrimaryIssuanceAccount(
        address investor
    ) internal virtual returns (bool) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        // can only be called by allowed smart contract (typically the redemption contrat)
        /** @dev enforce caller contract is whitelisted */
        require(
            _isContractAllowed(msg.sender),
            "This contract is not whitelisted"
        );
        //make sure the investor is an allowed investor
        require(
            _investorsAllowed(investor) == true,
            "The investor is not whitelisted"
        );
        // ensure the transfer only happens when the current time is after the maturity cut of time
        uint256 couponDate = _currentCouponDate();
        require(
            (couponDate == l.data.maturityDate || couponDate == 0) &&
                block.timestamp > _currentSnapshotDatetime(),
            "returning the balance to the primary issuance can only be done after the maturity cut off time"
        );
        uint256 balance = this.balanceOf(investor);
        require(balance > 0, "no balance to return for this investor");
        _forceNextTransfer(); // make the _beforeTokenTransfer control ignore the end of life of the bond
        _transfer(investor, _primaryIssuanceAccount(), balance);
        return true;
    }

    function _getAllInvestors() internal view returns (address[] memory) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        return l.investorsList;
    }

    function _disableInvestorFromWhitelist(address investor_) internal {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        require(investor_ != address(0), "investor address cannot be zero");

        //CAK may edit investor allowed status if whitelisting exist.
        if (_hasRole(CAK_ROLE, msg.sender)) {
            require(
                l.investorInfos[investor_].custodian != address(0),
                "investor must be set up first"
            );
            l.investorInfos[investor_].allowed = false;
            return;
        }

        require(_hasRole(CST_ROLE, msg.sender), "Caller must be CST");
        require(
            l.investorInfos[investor_].custodian == msg.sender,
            "only the custodian can disallow the investor"
        );
        l.investorInfos[investor_].allowed = false;

        emit DisableInvestor(investor_);
    }

    function _enableInvestorToWhitelist(address investor_) internal {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        require(investor_ != address(0), "investor address cannot be zero");
        bool isNew = l.investorInfos[investor_].custodian == address(0);

        //CAK may edit investor allowed status if whitelisting exist.
        if (_hasRole(CAK_ROLE, msg.sender)) {
            require(!isNew, "investor must be set up first");
            l.investorInfos[investor_].allowed = true;
            return;
        }

        require(_hasRole(CST_ROLE, msg.sender), "Caller must be CST");

        _enableInvestor(investor_, msg.sender);
    }

    /**
     * @dev called by enableInvestorToWhitelist
     */
    // function _enableInvestor(address investor_, address custodian_) internal {
    //     RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
    //         .layout();
    //     if (_investorsAllowed(investor_)) {
    //         //since _enableInvestor is called upon each transferFrom, do nothing if already enabled
    //         return;
    //     }

    //     bool isNew = l.investorInfos[investor_].custodian == address(0);
    //     if (isNew) {
    //         // first whitelisting
    //         _initInvestor(investor_, custodian_, true);
    //     } else {
    //         //only investor's custodian may re-enable the investor state
    //         require(
    //             l.investorInfos[investor_].custodian == custodian_,
    //             "only the custodian can disallow the investor"
    //         );
    //         l.investorInfos[investor_].allowed = true;
    //     }
    //     emit EnableInvestor(investor_);
    // }

    /**
     * @dev called by _enebaleInvestor and the primary issuance to defined the BnD
     */
    // function _initInvestor(
    //     address investor_,
    //     address custodian_,
    //     bool allowed
    // ) internal {
    //     RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
    //         .layout();
    //     uint256 index = l.investorsList.length;
    //     l.investorsList.push(investor_);
    //     l.investorInfos[investor_].index = index;
    //     l.investorInfos[investor_].investor = investor_;
    //     l.investorInfos[investor_].custodian = custodian_;
    //     l.investorInfos[investor_].allowed = allowed;
    // }

    function _investorCustodian(
        address investor
    ) internal view returns (address) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        return l.investorInfos[investor].custodian;
    }

    function _findCouponIndex(
        uint256 _couponDate
    ) internal view returns (uint256 index, bool found) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        // Works on the assumption that the list of coupons dates are sorted
        for (uint256 i = 0; i < l.data.couponDates.length; i++) {
            // Raises a slither warning on https://github.com/crytic/slither/wiki/Detector-Documentation#dangerous-strict-equalities
            // But this is an accepted situation as we need to compare the provided date with the array
            if (l.data.couponDates[i] == _couponDate) {
                return (i, true);
            } else if (l.data.couponDates[i] > _couponDate) {
                // we wont find a coupon now that
                return (i, false);
            }
        }
        return (l.data.couponDates.length, false);
    }

    function _checkIfCouponDateExists(
        uint256 _couponDate
    ) internal view returns (bool) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        (, bool found) = _findCouponIndex(_couponDate);
        if (found) return true;
        if (l.data.maturityDate == _couponDate) return true;
        return false;
    }

    function _checkIfMaturityDateExists(
        uint256 _maturityDate
    ) internal view returns (bool) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        return l.data.maturityDate == _maturityDate;
    }

    /**
     * @dev Initialize the total amount definitively and freeze the register attributes.
     * Takes the expected supply to mint to the security issuance account and set the status to Ready.
     */
    function _makeReady() internal {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        require((_hasRole(CAK_ROLE, msg.sender)), "Caller must be CAK");
        require(l.status == Status.Draft, "Register should be in Draft state");
        require(l.data.expectedSupply > 0, "expected supply cannot be zero");
        require(
            address(l.primaryIssuanceAccount) != address(0x0),
            "You must set the mint receiver address"
        );
        _mint(l.primaryIssuanceAccount, l.data.expectedSupply);
        l.status = Status.Ready;
        emit RegisterStatusChanged(
            msg.sender,
            l.data.name,
            l.data.isin,
            l.status
        );
    }

    /**
     * @dev In case of an error detected after the bond was made ready but before it was issued
     * place the bond back to draft mode
     */
    function _revertReady() internal {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        require((_hasRole(CAK_ROLE, msg.sender)), "Caller must be CAK");
        require(l.status == Status.Ready, "Register should be in Ready state");
        _burn(l.primaryIssuanceAccount, l.data.expectedSupply);
        l.status = Status.Draft;
        emit RegisterStatusChanged(
            msg.sender,
            l.data.name,
            l.data.isin,
            l.status
        );
    }

    /**
     * @dev This function intent to allow institutions to communicate between them
     */
    function _publicMessage(address to, string memory message) internal {
        require(
            _hasRole(CAK_ROLE, msg.sender) ||
                _hasRole(BND_ROLE, msg.sender) ||
                _hasRole(CST_ROLE, msg.sender) ||
                _hasRole(PAY_ROLE, msg.sender),
            "The caller must have a role in the transaction"
        );
        emit PublicMessage(msg.sender, to, message);
    }

    function _initCurrentCoupon() private {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        // first find the date that directly follows the current block
        (uint256 index, ) = _findCouponIndex(block.timestamp);
        uint256 current = 0;
        uint256 next = 0;
        if (index < l.data.couponDates.length) {
            current = l.data.couponDates[index];
            if (index + 1 < l.data.couponDates.length) {
                next = l.data.couponDates[index + 1];
            } else {
                next = l.data.maturityDate;
            }
        } else {
            current = l.data.maturityDate;
            next = 0;
        }
        // emit Debug("_initCurrentCoupon", index, current, gasleft());
        _updateSnapshotTimestamp(current, current + l.data.cutOffTime, next);
    }

    /// @dev called by CouponInternal to set coupon rate
    function _setCouponRate(uint256 _couponRate) internal virtual {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        l.data.couponRate = _couponRate;
    }

    function _setCurrentCouponDate(
        uint256 couponDate_,
        uint256 recordDatetime_
    ) internal {
        //TODO: rename this to setCurrentSnapshotDateTime()
        require(
            _isContractAllowed(msg.sender),
            "This contract is not whitelisted"
        ); //can be called only by Coupon smart contract
        require(
            recordDatetime_ + (10 * 24 * 3600) > couponDate_,
            "Inconsistent record date more than 10 days before settlement date"
        );
        _setCurrentSnapshotDatetime(
            couponDate_,
            recordDatetime_,
            _nextCouponDate(couponDate_)
        );
    }

    function _getInvestorListAtCoupon(
        uint256 CouponDate
    ) internal view virtual returns (address[] memory) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        //TODO: consistency check: do we have to iterate on whitelisted investors only ? if yes then change implementation

        // 1. Lister les investisseurs
        address[] memory _investor = new address[](l.investorsList.length);

        uint256 arrayLength = 0;

        for (uint256 i = 0; i < l.investorsList.length; i++) {
            if (_balanceOfCoupon(l.investorsList[i], CouponDate) > 0) {
                _investor[arrayLength] = l.investorsList[i];
                arrayLength++;
            }
        }
        address[] memory _investorResult = new address[](arrayLength);
        for (uint256 i = 0; i < arrayLength; i++) {
            _investorResult[i] = _investor[i];
        }
        // 3. Return list of
        return (_investorResult);
    }

    function _toggleFrozen() internal virtual {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        require(_hasRole(CAK_ROLE, msg.sender), "Caller must be CAK");
        if (l.status == Status.Issued) {
            l.status = Status.Frozen;
        } else if (l.status == Status.Frozen) {
            l.status = Status.Issued;
        } else
            revert(
                "Cannot Freeze / Unfreeze the register as the status is not Issued or Frozen"
            );

        emit RegisterStatusChanged(
            msg.sender,
            l.data.name,
            l.data.isin,
            l.status
        );
    }

    function _status() internal view virtual returns (Status) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        return l.status;
    }

    /*
     * Find the next couponDate, that is the one which is just after the current one;
     * returns 0 if not found or nextDate does not exist.
     */
    function _nextCouponDate(uint256 current) private view returns (uint256) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        //TODO: use the findCouponIndex instead
        for (uint256 index = 0; index < l.data.couponDates.length; index++) {
            if (l.data.couponDates[index] == current) {
                //if next exist then return it
                if (index + 1 < l.data.couponDates.length) {
                    return l.data.couponDates[index + 1];
                } else {
                    return l.data.maturityDate;
                }
            }
        }

        return 0;
    }
}
