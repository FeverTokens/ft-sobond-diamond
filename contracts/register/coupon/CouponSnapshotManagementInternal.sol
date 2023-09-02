// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { ICouponSnapshotManagementInternal } from "./ICouponSnapshotManagementInternal.sol";
import { CouponSnapshotManagementStorage } from "./CouponSnapshotManagementStorage.sol";
import { ERC20Snapshot } from "../../token/ERC20/extensions/ERC20Snapshot.sol";

abstract contract CouponSnapshotManagementInternal is
    ICouponSnapshotManagementInternal,
    ERC20Snapshot
{
    function _currentSnapshotDatetime() internal view returns (uint256) {
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();
        return l._currentSnapshotTimestamp;
    }

    function _nextSnapshotDatetime() internal view returns (uint256) {
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();
        return l._nextSnapshotTimestamp;
    }

    function _currentCouponDate() internal view returns (uint256) {
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();
        return l._currentCouponDate;
    }

    /**
     * @dev Retrieves the balance of `account` at the coupon date that must have been set by the setCurrentCouponDate before.
     */
    function _balanceOfCoupon(
        address account,
        uint256 _couponDate
    ) internal view virtual returns (uint256) {
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();
        uint256 snapshotId = l.couponDateSnapshotId[_couponDate];
        if (snapshotId > 0) {
            return _balanceOfAt(account, snapshotId); // reverts if snapshotId == 0
        } else {
            return _balanceOf(account);
        }
    }

    /**
     * @dev Retrieves the total supply at the coupon date that must have been set by the setCurrentCouponDate before.
     */
    function _totalSupplyAtCoupon(
        uint256 _couponDate
    ) public view virtual returns (uint256) {
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();
        uint256 snapshotId = l.couponDateSnapshotId[_couponDate];
        if (snapshotId > 0) {
            return _totalSupplyAt(snapshotId);
        } else {
            return _totalSupply();
        }
    }

    function _forceNextTransfer() internal returns (bool) {
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();
        require(
            !l._forceAcceptNextTransfer,
            "force flag already set, check code"
        );
        l._forceAcceptNextTransfer = true;
        return true;
    }

    function _checkAndProcessSnapshot() private returns (uint256 snapshotID) {
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();
        // this condition ensure that we only take the snapshot once and only if the time is passed
        if (
            l._currentSnapshotTimestamp > 0 &&
            l.couponDateSnapshotId[l._currentCouponDate] == 0 &&
            block.timestamp >= l._currentSnapshotTimestamp
        ) {
            // take a snapshot and record the id
            uint256 id = _snapshot();
            l.couponDateSnapshotId[l._currentCouponDate] = id; // fix the coupon snapshot to the newly created one
            l._currentSnapshotTimestamp = l._nextSnapshotTimestamp > 0
                ? _makeDatetime(
                    l._nextSnapshotTimestamp,
                    l._currentSnapshotTimestamp
                )
                : 0;
            l._currentCouponDate = _makeDatetime(
                l._currentSnapshotTimestamp,
                0
            );
            emit SnapshotTimestampChange(
                l._currentCouponDate,
                l._currentSnapshotTimestamp,
                l._nextSnapshotTimestamp
            );
            return id;
        } else return 0;
    }

    function _beforeTokenTransfer(
        address from_,
        address to_,
        uint256 amount_
    ) internal virtual override {
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();
        if (l._forceAcceptNextTransfer) {
            l._forceAcceptNextTransfer = false;
        } else {
            require(
                l._currentSnapshotTimestamp > 0,
                "the register is locked because no coupon is prepared or the maturity is reached"
            );
            if (block.timestamp >= l._currentSnapshotTimestamp) {
                require(
                    l._nextSnapshotTimestamp > 0,
                    "the maturity cut-off time has passed"
                );
            }
        }

        _checkAndProcessSnapshot();

        super._beforeTokenTransfer(from_, to_, amount_); //snapshots are potentially updated here (see ERC20Snapshot.sol)
    }

    /**
        Function update the snapshot based on the provided paratmeters.   
        Will verify if the coupon date needs to be taken as the next timestamp.    
        Assumes that the date_ did not already exists before, so it cannot be the current date / timestamp.   
        Assumes that the call is done after the Register coupons are modified
     */
    function _updateSnapshotTimestamp(
        uint256 date_,
        uint256 recordDatetime_,
        uint256 next_
    ) internal returns (bool) {
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();
        // emit Debug("_updateSnapshotTimestamp #1", date_, next_, gasleft());
        if (date_ != l._currentCouponDate) {
            // emit Debug("_updateSnapshotTimestamp #2", date_, _currentCouponDate, gasleft());
            // the current dates are different
            _setCurrentSnapshotDatetime(date_, recordDatetime_, next_);
        } else if (next_ != _makeDatetime(l._nextSnapshotTimestamp, 0)) {
            // emit Debug("_updateSnapshotTimestamp #3", next_, _makeDatetime(_nextSnapshotTimestamp, 0), gasleft());
            // the next dates are different
            // uint256 currentCutOffTime_ = _makeDatetime(0, _currentSnapshotTimestamp); // extracts the cutofftime from the timestamp
            _setCurrentSnapshotDatetime(
                l._currentCouponDate,
                l._currentSnapshotTimestamp,
                next_
            );
        } // else there is nothing to be done
        return true;
    }

    /** Cannot insert before the the current date */
    function _canInsertCouponDate(uint256 date_) internal view returns (bool) {
        return date_ > _makeDatetime(block.timestamp, 0);
    }

    /** Cannot delete a coupon that has been snapshotted and that is before the current date */
    function _canDeleteCouponDate(uint256 date_) internal view returns (bool) {
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();
        return
            date_ > _makeDatetime(block.timestamp, 0) &&
            l.couponDateSnapshotId[date_] == 0;
    }

    /**
     * @dev this function is called by Coupon.sol when Paying Agent validates the coupon Date.
     */
    function _setCurrentSnapshotDatetime(
        uint256 date_, // this is the value date of the coupon / redemption
        uint256 recordDatetime_, // this is the record time , ie previous business day at cut off
        uint256 nextDate_
    ) internal {
        uint256 recordDate = _makeDatetime(recordDatetime_, 0);
        require(
            recordDate <= date_,
            "the record date cannot be after the settlement date"
        );
        require(
            nextDate_ == 0 || nextDate_ > date_,
            "invalid next date when setting the current snapshot datetime"
        );
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();

        uint256 couponDateOnly = _makeDatetime(date_, 0);
        uint256 nextTimestamp = nextDate_;
        if (nextTimestamp > 0)
            nextTimestamp = _makeDatetime(nextTimestamp, recordDatetime_);

        // Verify if the date has already been used for a snapshot
        require(
            l.couponDateSnapshotId[couponDateOnly] == 0,
            "Date of coupon or maturity already taken"
        ); //avoid setting a snapshot date that is already taken
        // implicitly, we know there was no snapshot yet at couponDateOnly

        // the timestamp to be set should be in the future
        require(
            block.timestamp < recordDatetime_,
            "you have to define a new period ending after the current time"
        );
        // if the current timestamp has been reached then we take a snap shot
        _checkAndProcessSnapshot();

        // At register initialization, the currentCouponDate is already set and the Coupon smart contract is not created yet
        // there is a possibility that the Coupon smart contract is not created before the cutoff time
        // since we have past the timestamp we should not use the same or lower date
        // require(couponDateOnly >= _currentCouponDate,"you have to define a coupon date in the future");

        l._currentSnapshotTimestamp = recordDatetime_;
        l._currentCouponDate = couponDateOnly;
        l._nextSnapshotTimestamp = nextTimestamp;

        emit SnapshotTimestampChange(
            l._currentCouponDate,
            l._currentSnapshotTimestamp,
            l._nextSnapshotTimestamp
        );
    }

    function _makeDatetime(
        uint256 date_,
        uint256 time_
    ) internal pure returns (uint256 d) {
        // Generates a slither error with https://github.com/crytic/slither/wiki/Detector-Documentation#weak-PRNG
        // This is safe given that the modulo is done on the full time and a node cannot influence on such a large portion
        // Also, this code is also used for the timestamp and not only on block.timestamp
        uint256 timePart = date_ % (3600 * 24);
        d = date_ - timePart; //make sure the date has only a Date part (and not the time part)
        timePart = time_ % (3600 * 24); // make sure the time only has time part
        d = d + timePart;
        return d;
    }
}
