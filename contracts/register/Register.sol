// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IRegisterMetadata } from "./metadata/IRegisterMetadata.sol";
import { RegisterInternal } from "./RegisterInternal.sol";

import { IERC20Metadata } from "../token/ERC20/extensions/IERC20Metadata.sol";

contract Register is IRegisterMetadata, RegisterInternal {
    /**
     * @inheritdoc IERC20Metadata
     */
    function name() public view override returns (string memory) {
        return _name();
    }

    /**
     * @inheritdoc IERC20Metadata
     */
    function symbol() public view override returns (string memory) {
        return _symbol();
    }

    /**
     * @inheritdoc IERC20Metadata
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * This contract represents an issued Bond composed of an integer number of parts,
     * hence no fractional representation is allowed: decimal is zero.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view override returns (uint8) {
        return _decimals();
    }

    /// @inheritdoc IRegisterMetadata
    function setIsinSymbol(string memory isinSymbol) public {
        _setIsinSymbol(isinSymbol);
    }

    /// @inheritdoc IRegisterMetadata
    function setCurrency(bytes32 currency) public {
        _setCurrency(currency);
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
