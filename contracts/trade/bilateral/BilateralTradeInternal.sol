// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IBilateralTradeInternal } from "./IBilateralTradeInternal.sol";
import { BilateralTradeStorage } from "./BilateralTradeStorage.sol";
import { IRegister } from "../../register/IRegister.sol";

abstract contract BilateralTradeInternal is IBilateralTradeInternal {
    function _register() internal view returns (IRegister) {
        BilateralTradeStorage.Layout storage l = BilateralTradeStorage.layout();
        return l.register;
    }

    function _status() internal view returns (Status) {
        BilateralTradeStorage.Layout storage l = BilateralTradeStorage.layout();

        return l.status;
    }

    function _paymentID() internal view returns (bytes8) {
        uint64 low = uint64(uint160(address(this)));

        return bytes8(low);
    }

    function _getDetails() internal view returns (TradeDetail memory) {
        BilateralTradeStorage.Layout storage l = BilateralTradeStorage.layout();

        return l.details;
    }

    function _sellerAccount() internal view returns (address) {
        BilateralTradeStorage.Layout storage l = BilateralTradeStorage.layout();

        return l.sellerAccount;
    }

    function _buyerAccount() internal view returns (address) {
        BilateralTradeStorage.Layout storage l = BilateralTradeStorage.layout();

        return l.details.buyer;
    }

    function _setDetails(TradeDetail memory _details) internal {
        BilateralTradeStorage.Layout storage l = BilateralTradeStorage.layout();

        l.details = _details;
    }

    function _approve() internal returns (Status) {
        BilateralTradeStorage.Layout storage l = BilateralTradeStorage.layout();

        if (msg.sender == l.sellerAccount && l.status == Status.Draft) {
            require(l.details.quantity > 0, "quantity not defined");

            require(l.details.tradeDate > 0, "trade date not defined");

            // Remove the control because it is functionally possible to need to create a back value trade
            // But add the control that the value is defined
            require(l.details.valueDate > 0, "value date not defined");

            // require(
            //     details.valueDate >= details.tradeDate,
            //     "value date not defined greater or equal than the trade date"
            // );
            l.status = Status.Pending;

            emit NotifyTrade(
                l.sellerAccount,
                l.details.buyer,
                l.status,
                l.details.quantity
            );

            return (l.status);
        }

        if (msg.sender == l.details.buyer && l.status == Status.Pending) {
            // require(
            //     register.transferFrom(
            //         sellerAccount,
            //         details.buyer,
            //         details.quantity
            //     ),
            //     "the transfer has failed"
            // );
            l.status = Status.Accepted;

            emit NotifyTrade(
                l.sellerAccount,
                l.details.buyer,
                l.status,
                l.details.quantity
            );

            return (l.status);
        }

        require(false, "the trade cannot be approved in this current status");

        return (l.status);
    }

    function _reject() internal {
        BilateralTradeStorage.Layout storage l = BilateralTradeStorage.layout();

        require(l.status != Status.Rejected, "Trade already rejected");

        // seller can cancel the trade at any active state before the trade is executed
        if (msg.sender == l.sellerAccount && (l.status != Status.Executed)) {
            l.status = Status.Rejected;

            emit NotifyTrade(
                l.sellerAccount,
                l.details.buyer,
                l.status,
                l.details.quantity
            );

            return;
        }

        // buyer can cancel the trade when pending validation on his side or even after he has accepted the trade (but not when the seller prepares the trade (DRAFT))
        if (
            msg.sender == l.details.buyer &&
            (l.status == Status.Pending || l.status == Status.Accepted)
        ) {
            l.status = Status.Rejected;

            emit NotifyTrade(
                l.sellerAccount,
                l.details.buyer,
                l.status,
                l.details.quantity
            );

            return;
        }

        require(false, "the trade cannot be rejected in this current status");
    }

    function _executeTransfer() internal returns (bool) {
        BilateralTradeStorage.Layout storage l = BilateralTradeStorage.layout();

        require(
            msg.sender == l.sellerAccount,
            "Only the seller can confirm the payment on this trade"
        );

        require(
            l.status == Status.Accepted,
            "The trade must be accepted by the buyer before"
        );

        l.status = Status.Executed;

        // Actually make the transfer now
        bool success = l.register.transferFrom(
            l.sellerAccount,
            l.details.buyer,
            l.details.quantity
        );

        require(success, "the transfer has failed");

        emit NotifyTrade(
            l.sellerAccount,
            l.details.buyer,
            l.status,
            l.details.quantity
        );

        return true;
    }
}
