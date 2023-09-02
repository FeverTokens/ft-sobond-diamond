// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IRegisterMetadataInternal } from "./IRegisterMetadataInternal.sol";
import { RegisterStorage } from "../RegisterStorage.sol";
import { CouponSnapshotManagementInternal } from "../coupon/CouponSnapshotManagementInternal.sol";
import { AccessControl } from "../../access/rbac/AccessControl.sol";

abstract contract RegisterMetadataInternal is
    IRegisterMetadataInternal,
    CouponSnapshotManagementInternal,
    AccessControl
{
    function _setIsinSymbol(
        string memory _isinSymbol
    ) internal virtual onlyRole(RegisterStorage.CAK_ROLE) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
        l.data.isin = _isinSymbol;
    }

    function _getBondData() internal view virtual returns (BondData memory) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
        return l.data;
    }

    function _getBondCouponRate() internal view virtual returns (uint256) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
        return l.data.couponRate;
    }

    function _getBondUnitValue() internal view virtual returns (uint256) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
        return l.data.unitValue;
    }

    function _setCurrency(
        bytes32 _currency
    ) internal virtual onlyRole(RegisterStorage.CAK_ROLE) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
        l.data.currency = _currency;
    }

    function _getCreationDate() internal view virtual returns (uint256) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
        return l.data.creationDate;
    }

    function _getIssuanceDate() public view virtual returns (uint256) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
        return l.data.issuanceDate;
    }

    function _setCreationDate(
        uint256 _creationDate
    ) internal virtual onlyRole(RegisterStorage.CAK_ROLE) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
        l.data.creationDate = _creationDate;
    }

    function _setIssuanceDate(
        uint256 issuanceDate_
    ) internal virtual onlyRole(RegisterStorage.CAK_ROLE) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
        l.data.issuanceDate = issuanceDate_;
    }

    function _setBondData(
        BondData calldata _data
    ) internal virtual onlyRole(RegisterStorage.CAK_ROLE) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();

        if (_data.couponDates.length > 0) {
            require(
                _data.couponDates[0] > _data.issuanceDate,
                "Cannot set a issuance date after the first coupon date"
            );
            require(
                _data.couponDates[_data.couponDates.length - 1] <
                    _data.maturityDate,
                "Cannot set a maturity date before the last coupon date"
            );
        }

        l.data.name = _data.name;
        l.data.expectedSupply = _data.expectedSupply;
        l.data.currency = _data.currency;
        l.data.unitValue = _data.unitValue;
        l.data.couponRate = _data.couponRate;
        l.data.issuanceDate = _data.issuanceDate;
        l.data.maturityDate = _data.maturityDate;
        l.data.couponDates = _data.couponDates;
        l.data.cutOffTime = _data.cutOffTime;
    }

    function _addCouponDate(
        uint256 date
    ) internal virtual onlyRole(RegisterStorage.CAK_ROLE) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
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

    function _delCouponDate(
        uint256 date
    ) internal virtual onlyRole(RegisterStorage.CAK_ROLE) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
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

    function _findCouponIndex(
        uint256 _couponDate
    ) internal view returns (uint256 index, bool found) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
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
    ) public view returns (bool) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
        (, bool found) = _findCouponIndex(_couponDate);
        if (found) return true;
        if (l.data.maturityDate == _couponDate) return true;
        return false;
    }

    function _checkIfMaturityDateExists(
        uint256 _maturityDate
    ) external view returns (bool) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
        return l.data.maturityDate == _maturityDate;
    }

    function _initCurrentCoupon() private {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
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
        RegisterStorage.Layout storage l = RegisterStorage.layout();
        l.data.couponRate = _couponRate;
    }

    function _setExpectedSupply(
        uint256 expectedSupply_
    ) internal virtual onlyRole(RegisterStorage.CAK_ROLE) {
        RegisterStorage.Layout storage l = RegisterStorage.layout();
        require(
            l.status == Status.Draft,
            "lifecycle violation - only allowed when status is in draft"
        );
        l.data.expectedSupply = expectedSupply_;
    }
}
