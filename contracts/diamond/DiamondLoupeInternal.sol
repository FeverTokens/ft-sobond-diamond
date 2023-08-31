// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IDiamondLoupeInternal } from "./IDiamondLoupeInternal.sol";
import { DiamondStorage } from "./DiamondStorage.sol";

abstract contract DiamondLoupeInternal is IDiamondLoupeInternal {
    function _facets() internal view returns (Facet[] memory facets_) {
        DiamondStorage.Layout storage l = DiamondStorage.layout();
        uint256 numFacets = l.facetAddresses.length;
        facets_ = new Facet[](numFacets);
        for (uint256 i; i < numFacets; i++) {
            address facetAddress_ = l.facetAddresses[i];
            facets_[i].facetAddress = facetAddress_;
            facets_[i].functionSelectors = l
                .facetFunctionSelectors[facetAddress_]
                .functionSelectors;
        }
    }

    function _facetFunctionSelectors(
        address _facet
    ) internal view returns (bytes4[] memory facetFunctionSelectors_) {
        DiamondStorage.Layout storage l = DiamondStorage.layout();
        facetFunctionSelectors_ = l
            .facetFunctionSelectors[_facet]
            .functionSelectors;
    }

    function _facetAddresses()
        internal
        view
        returns (address[] memory facetAddresses_)
    {
        DiamondStorage.Layout storage l = DiamondStorage.layout();
        facetAddresses_ = l.facetAddresses;
    }

    function _facetAddress(
        bytes4 _functionSelector
    ) internal view returns (address facetAddress_) {
        DiamondStorage.Layout storage l = DiamondStorage.layout();
        facetAddress_ = l
            .selectorToFacetAndPosition[_functionSelector]
            .facetAddress;
    }
}
