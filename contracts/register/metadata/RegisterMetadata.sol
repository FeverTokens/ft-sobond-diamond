// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IRegisterMetadata } from "./IRegisterMetadata.sol";
import { RegisterMetadataInternal } from "./RegisterMetadataInternal.sol";

abstract contract RegisterMetadata is
    IRegisterMetadata,
    RegisterMetadataInternal
{
    /// @inheritdoc IRegisterMetadata
    function setIsinSymbol(string memory isinSymbol) public {
        _setIsinSymbol(isinSymbol);
    }

    function getBondData() public view override returns (BondData memory) {
        return _getBondData();
    }

    function getBondCouponRate() public view override returns (uint256) {
        return _getBondCouponRate();
    }

    function getBondUnitValue() public view override returns (uint256) {
        return _getBondUnitValue();
    }

    /// @inheritdoc IRegisterMetadata
    function setCurrency(bytes32 currency) public {
        _setCurrency(currency);
    }

    /// @inheritdoc IRegisterMetadata
    function getCreationDate() public view returns (uint256) {
        return _getCreationDate();
    }

    /// @inheritdoc IRegisterMetadata
    function getIssuanceDate() public view returns (uint256) {
        return _getIssuanceDate();
    }

    /// @inheritdoc IRegisterMetadata
    function setCreationDate(uint256 creationDate) public {
        _setCreationDate(creationDate);
    }

    /// @inheritdoc IRegisterMetadata
    function setIssuanceDate(uint256 issuanceDate) public {
        _setIssuanceDate(issuanceDate);
    }

    /// @inheritdoc IRegisterMetadata
    function setBondData(BondData calldata _data) public {
        _setBondData(_data);
    }

    /// @inheritdoc IRegisterMetadata
    function addCouponDate(uint256 date) public {
        _addCouponDate(date);
    }

    /// @inheritdoc IRegisterMetadata
    function delCouponDate(uint256 date) public {
        _delCouponDate(date);
    }

    /// @inheritdoc IRegisterMetadata
    function setExpectedSupply(uint256 expectedSupply) public {
        _setExpectedSupply(expectedSupply);
    }
}
