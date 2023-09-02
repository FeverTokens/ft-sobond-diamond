// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IPrimaryIssuanceInternal } from "./IPrimaryIssuanceInternal.sol";
import { PrimaryIssuanceStorage } from "./PrimaryIssuanceStorage.sol";
import { ReentrancyGuardInternal } from "../../security/ReentrancyGuard.sol";
import { IRegister } from "../../register/IRegister.sol";

abstract contract PrimaryIssuanceInternal is
    IPrimaryIssuanceInternal,
    ReentrancyGuardInternal
{
    function _account() public view returns (address) {
        PrimaryIssuanceStorage.Layout storage l = PrimaryIssuanceStorage
            .layout();
        return l.account;
    }

    function _offerPrice() public view returns (uint256) {
        PrimaryIssuanceStorage.Layout storage l = PrimaryIssuanceStorage
            .layout();
        return l.offerPrice;
    }

    /** as a B&D execute the transfer from the security issuance account to the B&D account.
     * If successfull it will pass the status from Initiated to Completed
     */
    function _validate() internal nonReentrant {
        PrimaryIssuanceStorage.Layout storage l = PrimaryIssuanceStorage
            .layout();

        require(l.register.isBnD(msg.sender), "Sender must be a B&D");

        require(
            msg.sender == l.account,
            "only the beneficiary B&D should finalize"
        );

        require(
            l.status != Status.Accepted && l.status != Status.Executed,
            "The primary contract should be in initiated state"
        );

        // get the primary issuance balance
        l.quantity = l.register.balanceOf(l.register.primaryIssuanceAccount());

        if (l.quantity > 0) {
            // issuance account credited
            require(
                l.register.transferFrom(
                    l.register.primaryIssuanceAccount(),
                    l.account,
                    l.quantity
                ),
                "the transfer has failed"
            );
            //TODO: maybe replace that unexplicit "the transfer has failed" message
            l.status = Status.Accepted;
            emit NotifyTrade(
                l.register.primaryIssuanceAccount(),
                l.account,
                Status.Accepted,
                l.quantity
            );
        }
    }

    function _reject() internal {
        PrimaryIssuanceStorage.Layout storage l = PrimaryIssuanceStorage
            .layout();
        require(msg.sender == l.account, "only the beneficiary B&D can revert");
        l.status = Status.Rejected;
        // get the primary issuance balance
        l.quantity = l.register.balanceOf(l.register.primaryIssuanceAccount());

        emit NotifyTrade(
            l.register.primaryIssuanceAccount(),
            l.account,
            l.status,
            l.quantity
        );
    }

    function _register() public view returns (IRegister) {
        PrimaryIssuanceStorage.Layout storage l = PrimaryIssuanceStorage
            .layout();
        return l.register;
    }

    function _status() internal view returns (Status) {
        PrimaryIssuanceStorage.Layout storage l = PrimaryIssuanceStorage
            .layout();
        return l.status;
    }

    function _paymentID() internal view returns (bytes8) {
        uint64 low = uint64(uint160(address(this)));
        return bytes8(low);
    }

    function _getDetails() internal view returns (TradeDetail memory) {
        PrimaryIssuanceStorage.Layout storage l = PrimaryIssuanceStorage
            .layout();
        TradeDetail memory trade = TradeDetail({
            quantity: l.quantity,
            buyer: l.account,
            tradeDate: l.register.getCreationDate(),
            valueDate: l.register.getIssuanceDate(),
            price: l.offerPrice
        });
        return trade;
    }

    function _sellerAccount() internal view returns (address) {
        PrimaryIssuanceStorage.Layout storage l = PrimaryIssuanceStorage
            .layout();
        return l.register.primaryIssuanceAccount();
    }

    function _buyerAccount() internal view returns (address) {
        PrimaryIssuanceStorage.Layout storage l = PrimaryIssuanceStorage
            .layout();
        return l.account;
    }
}
