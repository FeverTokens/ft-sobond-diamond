// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

interface ITradeInternal {
    enum Status {
        Draft,
        Pending,
        Rejected,
        Accepted,
        Executed,
        Paid
    }

    struct TradeDetail {
        uint256 quantity;
        address buyer;
        uint256 tradeDate;
        uint256 valueDate;
        uint256 price;
    }

    event NotifyTrade(
        address indexed seller,
        address indexed buyer,
        Status indexed status,
        uint256 quantity
    );
}
