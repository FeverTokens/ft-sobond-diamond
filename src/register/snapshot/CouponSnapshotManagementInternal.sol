// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.17;

import {ICouponSnapshotManagementInternal} from "./ICouponSnapshotManagementInternal.sol";
import {IRegisterMetadataInternal} from "../metadata/IRegisterMetadataInternal.sol";
import {RegisterRoleManagementInternal} from "../role/RegisterRoleManagementInternal.sol";
import {SmartContractAccessManagementInternal} from "../access/SmartContractAccessManagementInternal.sol";
import {InvestorManagementInternal} from "../investors/InvestorManagementInternal.sol";
import {ERC20Snapshot} from "../../token/ERC20/extensions/ERC20Snapshot.sol";
import {CouponSnapshotManagementStorage} from "./CouponSnapshotManagementStorage.sol";
import {RegisterMetadataStorage} from "../metadata/RegisterMetadataStorage.sol";
import {InvestorManagementStorage} from "../investors/InvestorManagementStorage.sol";

abstract contract CouponSnapshotManagementInternal is
    ICouponSnapshotManagementInternal,
    IRegisterMetadataInternal,
    RegisterRoleManagementInternal,
    SmartContractAccessManagementInternal,
    InvestorManagementInternal,
    ERC20Snapshot
{
    function _currentSnapshotDatetime() internal view returns (uint256) {
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();
        return l.currentSnapshotTimestamp;
    }

    function _nextSnapshotDatetime() internal view returns (uint256) {
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();
        return l.nextSnapshotTimestamp;
    }

    function _currentCouponDate() internal view returns (uint256) {
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();
        return l.currentCouponDate;
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
            !l.forceAcceptNextTransfer,
            "force flag already set, check code"
        );
        l.forceAcceptNextTransfer = true;
        return true;
    }

    function _checkAndProcessSnapshot() private returns (uint256 snapshotID) {
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();
        // this condition ensure that we only take the snapshot once and only if the time is passed
        if (
            l.currentSnapshotTimestamp > 0 &&
            l.couponDateSnapshotId[l.currentCouponDate] == 0 &&
            block.timestamp >= l.currentSnapshotTimestamp
        ) {
            // take a snapshot and record the id
            uint256 id = _snapshot();
            l.couponDateSnapshotId[l.currentCouponDate] = id; // fix the coupon snapshot to the newly created one
            l.currentSnapshotTimestamp = l.nextSnapshotTimestamp > 0
                ? _makeDatetime(
                    l.nextSnapshotTimestamp,
                    l.currentSnapshotTimestamp
                )
                : 0;
            l.currentCouponDate = _makeDatetime(l.currentSnapshotTimestamp, 0);
            emit SnapshotTimestampChange(
                l.currentCouponDate,
                l.currentSnapshotTimestamp,
                l.nextSnapshotTimestamp
            );
            return id;
        } else return 0;
    }

    function _beforeTokenTransfer(
        address from_,
        address to_,
        uint256 amount_
    ) internal virtual override {
        require(
            RegisterMetadataStorage.layout().status != Status.Repaid,
            "the Register is closed"
        );

        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();

        if (from_ != address(0)) {
            uint256 lockedAmount = l.amountLocked[from_];

            require(
                lockedAmount == 0 ||
                    _balanceOf(from_) >= lockedAmount + amount_,
                "Asset Locked"
            );
        }

        // TODO : check the amount to allow the transfer for the excess of the locked amount

        if (l.forceAcceptNextTransfer) {
            l.forceAcceptNextTransfer = false;
        } else {
            require(
                l.currentSnapshotTimestamp > 0,
                "the register is locked because no coupon is prepared or the maturity is reached"
            );
            if (block.timestamp >= l.currentSnapshotTimestamp) {
                require(
                    l.nextSnapshotTimestamp > 0,
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
        if (date_ != l.currentCouponDate) {
            // emit Debug("_updateSnapshotTimestamp #2", date_, _currentCouponDate, gasleft());
            // the current dates are different
            _setCurrentSnapshotDatetime(date_, recordDatetime_, next_);
        } else if (next_ != _makeDatetime(l.nextSnapshotTimestamp, 0)) {
            // emit Debug("_updateSnapshotTimestamp #3", next_, _makeDatetime(_nextSnapshotTimestamp, 0), gasleft());
            // the next dates are different
            // uint256 currentCutOffTime_ = _makeDatetime(0, _currentSnapshotTimestamp); // extracts the cutofftime from the timestamp
            _setCurrentSnapshotDatetime(
                l.currentCouponDate,
                l.currentSnapshotTimestamp,
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

        l.currentSnapshotTimestamp = recordDatetime_;
        l.currentCouponDate = couponDateOnly;
        l.nextSnapshotTimestamp = nextTimestamp;

        emit SnapshotTimestampChange(
            l.currentCouponDate,
            l.currentSnapshotTimestamp,
            l.nextSnapshotTimestamp
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

    function _getInvestorListAtCoupon(
        uint256 CouponDate
    ) internal view virtual returns (address[] memory) {
        InvestorManagementStorage.Layout storage l = InvestorManagementStorage
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
        uint256 balance = _balanceOf(investor);
        require(balance > 0, "no balance to return for this investor");
        _forceNextTransfer(); // make the _beforeTokenTransfer control ignore the end of life of the bond
        _transfer(investor, l.primaryIssuanceAccount, balance);
        return true;
    }

    /**
     * @dev The aim of this function is to enable the CAK to mint some bond units
     */
    function _mint(uint256 amount_) internal {
        require(_isCAK(msg.sender), "Caller must be CAK");

        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();

        require(
            address(l.primaryIssuanceAccount) != address(0x0),
            "You must set the mint receiver address"
        );

        _mint(l.primaryIssuanceAccount, amount_);
    }

    function _burn(uint256 amount_) internal {
        require(_isCAK(msg.sender), "Caller must be CAK");
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        _forceNextTransfer(); // make the _beforeTokenTransfer ignore that we are at the end of the bond
        _burn(l.primaryIssuanceAccount, amount_);

        // Raises a slither warning on https://github.com/crytic/slither/wiki/Detector-Documentation#dangerous-strict-equalities
        // But this is an accepted situation as we want to reach zero exactly
        if (_balanceOf(l.primaryIssuanceAccount) == 0 && _totalSupply() == 0) {
            l.status = Status.Repaid;
            emit RegisterStatusChanged(
                msg.sender,
                l.data.name,
                l.data.isin,
                l.status
            );
        }
    }

    /**
     * @dev
     * this function can be called by a CAK or an authorized smart contract (see mapping _contractsAllowed)
     * if called by the CAK, then the transfer is done
     * if called by an authorized smart contract, the transfer is done
     */
    function _transferFrom(
        address from_,
        address to_,
        uint256 amount_
    ) internal virtual override returns (bool) {
        RegisterMetadataStorage.Layout storage l = RegisterMetadataStorage
            .layout();
        //FIXME: redemption:  if currentTS==0 deny all  (returns false) transfer except if TO= PrimaryIssuanceAccount
        /** @dev if sender is CAK then any transfer is accepted */
        if (_isCAK(msg.sender)) {
            _transfer(from_, to_, amount_);

            return true;
        } else {
            // Not called directly from a CAK user
            /** @dev enforce caller contract is whitelisted */

            require(
                _isContractAllowed(msg.sender),
                "This contract is not whitelisted"
            );

            require(
                l.status != IRegisterMetadataInternal.Status.Frozen,
                "No transfer can be done when the register is Frozen"
            );

            // Additional checks depending on the situation

            // If we are called by the BnD / PrimaryIssuance smart contract
            // Note: B&D wallet is only usable for the initial purchase and then the primary sell
            // we can change the status of the register, BnD wallet will not be whitelisted
            if (
                l.status == IRegisterMetadataInternal.Status.Ready &&
                _isBnD(to_) &&
                from_ == l.primaryIssuanceAccount
            ) {
                l.status = IRegisterMetadataInternal.Status.Issued;
                // Change: We do not enable the B&D as investor to prevent the B&D to receive securities later
                // but we still need the BnD to be declared as an investor
                _initInvestor(to_, address(0), false);

                emit RegisterStatusChanged(
                    msg.sender,
                    l.data.name,
                    l.data.isin,
                    l.status
                );
            } else {
                // standard case

                //make sure the recipient is an allowed investor

                require(
                    _investorsAllowed(to_) == true,
                    "The receiver is not allowed"
                );

                require(
                    _investorsAllowed(from_) == true || // the seller must be a valid investor at the time of transfer
                        _isBnD(from_), // or the seller is the B&D for the primary distribution
                    "The sender is not allowed"
                );
            }

            _transfer(from_, to_, amount_);

            return true;
        }
    }

    function _lock(
        address from,
        address to,
        uint256 amount,
        bytes32 transactionId,
        bytes32 hashLock,
        bytes32 hashRelease,
        bytes32 hashCancel,
        uint256 paymentDate,
        uint256 deliveryDate,
        bytes32 proof
    ) internal {
        // check access
        require(
            _isCAK(msg.sender) ||
                _isBnD(msg.sender) ||
                _investorsAllowed(msg.sender) ||
                _isContractAllowed(msg.sender),
            "Access Denied"
        );

        // check from and to
        require(_investorsAllowed(to), "To not allowed");

        // check inputs
        require(
            paymentDate > block.timestamp && deliveryDate >= paymentDate,
            "Invalid dates"
        );

        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();

        LockStatus _lockStatus = l.locks[transactionId].status;

        // check the HTLC status
        require(_lockStatus == LockStatus.Unlocked, "Invalid Status");

        // check balance
        require(
            _balanceOf(from) >= amount + l.amountLocked[from],
            "Invalid balance"
        );

        l.amountLocked[from] += amount;

        // set the lock information
        l.locks[transactionId] = Lock(
            from,
            to,
            amount,
            transactionId,
            hashLock,
            hashRelease,
            hashCancel,
            paymentDate,
            deliveryDate,
            proof,
            LockStatus.Locked
        );

        // emit the event
        emit AssetHTLC(transactionId, from, to, hashLock, LockStatus.Locked);
    }

    function _release(
        bytes32 transactionId,
        bytes32 secret,
        bytes32 proof,
        LockStatus status_
    ) internal {
        // check the HTLC status
        require(
            _isCAK(msg.sender) ||
                _isBnD(msg.sender) ||
                _investorsAllowed(msg.sender) ||
                _isContractAllowed(msg.sender),
            "Access Denied"
        );

        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();

        // get the lock information
        Lock storage lock_ = l.locks[transactionId];

        // check the HTLC status
        require(lock_.status == LockStatus.Locked, "Invalid Status");

        // check the HTLC secret
        bytes32 _hash;
        uint256 _date;
        if (status_ == LockStatus.Released) {
            _hash = lock_.hashLock;
            _date = 0;
        } else if (status_ == LockStatus.Forced) {
            _hash = lock_.hashRelease;
            _date = lock_.deliveryDate;
        } else if (status_ == LockStatus.Cancelled) {
            _hash = lock_.hashCancel;
            _date = _hash == lock_.hashLock
                ? lock_.deliveryDate
                : lock_.paymentDate;
        }

        require(sha256(abi.encodePacked(secret)) == _hash, "Invalid Secret");

        require(block.timestamp > _date, "Invalid Date");

        // TODO add a fail safe mechanism to allow automatic unlock after a certain time (e.g. release date + 24 hours)

        // update status
        lock_.status = status_;

        // save artifacts
        lock_.proof = proof;

        l.amountLocked[lock_.from] -= lock_.amount;

        // transfer the asset to the to
        if (status_ != LockStatus.Cancelled) {
            _transfer(lock_.from, lock_.to, lock_.amount);
        }

        // emit the event
        emit AssetHTLC(transactionId, lock_.from, lock_.to, secret, status_);
    }

    function _getLock(
        bytes32 transactionId
    ) internal view returns (Lock memory) {
        CouponSnapshotManagementStorage.Layout
            storage l = CouponSnapshotManagementStorage.layout();

        Lock memory lock_ = l.locks[transactionId];

        require(lock_.status != LockStatus.Unlocked, "Invalid transactionId");

        // only CAK and from and to can access the lock information
        require(
            _isContractAllowed(msg.sender) ||
                _isCAK(msg.sender) ||
                msg.sender == lock_.from ||
                msg.sender == lock_.to,
            "Access Denied"
        );

        return lock_;
    }
}
