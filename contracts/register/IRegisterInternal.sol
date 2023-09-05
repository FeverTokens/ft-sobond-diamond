// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IRegisterMetadataInternal } from "./metadata/IRegisterMetadataInternal.sol";
import { IRegister } from "./IRegister.sol";

interface IRegisterInternal is IRegisterMetadataInternal {
    event WalletAddedToWhitelist(address indexed toBeAdded);

    event WalletDeletedFromWhitelist(address indexed toBeDeleted);

    event EnableInvestor(address investor);

    event DisableInvestor(address investor);

    event NewBondDrafted(address indexed creator, string name, string isin); //FIXME: remove this and replace by RegisterStatusChanged

    event RegisterStatusChanged(
        address indexed emiter,
        string name,
        string isin,
        Status status
    );

    event PublicMessage(
        address indexed sender,
        address indexed target,
        string message
    );

    struct InvestorInfo {
        address investor; //TODO: de-normalisation maybe not needed
        bool allowed; // true if investor whitelisted for transfer
        uint256 index; // zero-based index on investor list
        address custodian;
    }
}
