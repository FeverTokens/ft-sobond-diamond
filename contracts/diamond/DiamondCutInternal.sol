// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IDiamondCutInternal } from "./IDiamondCutInternal.sol";
import { DiamondStorage } from "./DiamondStorage.sol";

abstract contract DiamondCutInternal is IDiamondCutInternal {
    function _diamondCutImplementation(
        FacetCut[] memory _diamondCut,
        address _init,
        bytes memory _calldata
    ) internal {
        for (
            uint256 facetIndex;
            facetIndex < _diamondCut.length;
            facetIndex++
        ) {
            FacetCutAction action = _diamondCut[facetIndex].action;
            if (action == FacetCutAction.Add) {
                _addFunctions(
                    _diamondCut[facetIndex].facetAddress,
                    _diamondCut[facetIndex].functionSelectors
                );
            } else if (action == FacetCutAction.Replace) {
                _replaceFunctions(
                    _diamondCut[facetIndex].facetAddress,
                    _diamondCut[facetIndex].functionSelectors
                );
            } else if (action == FacetCutAction.Remove) {
                _removeFunctions(
                    _diamondCut[facetIndex].facetAddress,
                    _diamondCut[facetIndex].functionSelectors
                );
            } else {
                revert ErrDiamondIncorrectFacetCutAction(action);
            }
        }
        emit DiamondCut(_diamondCut, _init, _calldata);
        _initializeDiamondCut(_init, _calldata);
    }

    function _addFunctions(
        address _facet,
        bytes4[] memory _functionSelectors
    ) internal {
        if (_functionSelectors.length == 0) {
            revert ErrDiamondSelectorNotSpecified();
        }
        DiamondStorage.Layout storage l = DiamondStorage.layout();
        for (
            uint256 selectorIndex;
            selectorIndex < _functionSelectors.length;
            selectorIndex++
        ) {
            bytes4 selector = _functionSelectors[selectorIndex];
            if (
                l.selectorToFacetAndPosition[selector].facetAddress !=
                address(0)
            ) {
                revert ErrDiamondFacetAlreadyExists(_facet, selector);
            }
            l.selectorToFacetAndPosition[selector].facetAddress = _facet;
            l
                .selectorToFacetAndPosition[selector]
                .functionSelectorPosition = uint16(
                l.facetFunctionSelectors[_facet].functionSelectors.length
            );
            l.facetFunctionSelectors[_facet].functionSelectors.push(selector);
        }
    }

    function _replaceFunctions(
        address _facet,
        bytes4[] memory _functionSelectors
    ) internal {
        if (_functionSelectors.length == 0) {
            revert ErrDiamondSelectorNotSpecified();
        }
        DiamondStorage.Layout storage l = DiamondStorage.layout();
        for (
            uint256 selectorIndex;
            selectorIndex < _functionSelectors.length;
            selectorIndex++
        ) {
            bytes4 selector = _functionSelectors[selectorIndex];
            if (l.selectorToFacetAndPosition[selector].facetAddress == _facet) {
                revert ErrDiamondFacetSameFunction(_facet, selector);
            }
            address oldFacetAddress = l
                .selectorToFacetAndPosition[selector]
                .facetAddress;
            uint16 oldPosition = l
                .selectorToFacetAndPosition[selector]
                .functionSelectorPosition;
            l.facetFunctionSelectors[oldFacetAddress].functionSelectors[
                oldPosition
            ] = l.facetFunctionSelectors[oldFacetAddress].functionSelectors[
                l
                    .facetFunctionSelectors[oldFacetAddress]
                    .functionSelectors
                    .length - 1
            ];
            l.facetFunctionSelectors[oldFacetAddress].functionSelectors.pop();
            l.selectorToFacetAndPosition[selector].facetAddress = _facet;
            l
                .selectorToFacetAndPosition[selector]
                .functionSelectorPosition = uint16(
                l.facetFunctionSelectors[_facet].functionSelectors.length
            );
            l.facetFunctionSelectors[_facet].functionSelectors.push(selector);
        }
    }

    function _removeFunctions(
        address _facet,
        bytes4[] memory _functionSelectors
    ) internal {
        if (_functionSelectors.length == 0) {
            revert ErrDiamondSelectorNotSpecified();
        }
        DiamondStorage.Layout storage l = DiamondStorage.layout();
        for (
            uint256 selectorIndex;
            selectorIndex < _functionSelectors.length;
            selectorIndex++
        ) {
            bytes4 selector = _functionSelectors[selectorIndex];
            if (l.selectorToFacetAndPosition[selector].facetAddress != _facet) {
                revert ErrDiamondFacetDoesNotExist(_facet, selector);
            }
            address facetAddress = l
                .selectorToFacetAndPosition[selector]
                .facetAddress;
            uint16 functionPosition = l
                .selectorToFacetAndPosition[selector]
                .functionSelectorPosition;
            l.facetFunctionSelectors[facetAddress].functionSelectors[
                functionPosition
            ] = l.facetFunctionSelectors[facetAddress].functionSelectors[
                l
                    .facetFunctionSelectors[facetAddress]
                    .functionSelectors
                    .length - 1
            ];
            l.facetFunctionSelectors[facetAddress].functionSelectors.pop();
            delete l.selectorToFacetAndPosition[selector];
        }
    }

    function _initializeDiamondCut(
        address _init,
        bytes memory _calldata
    ) internal {
        if (_init != address(0)) {
            if (_calldata.length == 0) {
                (bool success, ) = _init.call{ gas: 200000 }("");
                if (!success) {
                    revert ErrDiamondInitFailed(_init, _calldata);
                }
            } else {
                (bool success, ) = _init.call{ gas: 200000 }(_calldata);
                if (!success) {
                    revert ErrDiamondInitFailed(_init, _calldata);
                }
            }
        }
    }
}
