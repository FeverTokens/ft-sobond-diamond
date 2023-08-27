// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IERC165 } from "./IERC165.sol";
import { ERC165Storage } from "./ERC165Storage.sol";

contract ERC165 is IERC165 {
    using ERC165Storage for ERC165Storage.Layout;

    // @inheritdoc IERC165
    function supportsInterface(
        bytes4 interfaceId
    ) external view returns (bool) {
        return ERC165Storage.layout().isSupportedInterface(interfaceId);
    }
}
