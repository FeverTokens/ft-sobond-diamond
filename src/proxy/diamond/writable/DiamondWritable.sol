// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import {IDiamondWritable} from "./IDiamondWritable.sol";
import {DiamondWritableInternal} from "./DiamondWritableInternal.sol";

/**
 * @title EIP-2535 "Diamond" proxy update contract
 */
abstract contract DiamondWritable is IDiamondWritable, DiamondWritableInternal {
    /**
     * @inheritdoc IDiamondWritable
     * @dev This function should be overriden to implement access control
     */
    function diamondCut(
        FacetCut[] calldata facetCuts,
        address target,
        bytes calldata data
    ) external virtual {
        _diamondCut(facetCuts, target, data);
    }
}
