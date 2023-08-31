// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IDiamondLoupe } from "./IDiamondLoupe.sol";
import { DiamondLoupeInternal } from "./DiamondLoupeInternal.sol";

contract DiamondLoupe is IDiamondLoupe, DiamondLoupeInternal {
    /// @inheritdoc IDiamondLoupe
    function facets() public view returns (Facet[] memory facets_) {
        facets_ = _facets();
    }

    /// @inheritdoc IDiamondLoupe
    function facetFunctionSelectors(
        address _facet
    ) external view returns (bytes4[] memory facetFunctionSelectors_) {
        facetFunctionSelectors_ = _facetFunctionSelectors(_facet);
    }

    /// @inheritdoc IDiamondLoupe
    function facetAddresses()
        public
        view
        returns (address[] memory facetAddresses_)
    {
        facetAddresses_ = _facetAddresses();
    }

    /// @inheritdoc IDiamondLoupe
    function facetAddress(
        bytes4 _functionSelector
    ) external view returns (address facetAddress_) {
        facetAddress_ = _facetAddress(_functionSelector);
    }
}
