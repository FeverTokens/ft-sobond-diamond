// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

interface IDiamondCutInternal {
    error ErrDiamondFacetAlreadyExists(address facet, bytes4 selector);
    error ErrDiamondFacetSameFunction(address facet, bytes4 selector);
    error ErrDiamondFacetDoesNotExist(address facet, bytes4 selector); // ADDED
    error ErrDiamondInitFailed(address init, bytes errorData); // ADDED
    error ErrDiamondIncorrectFacetCutAction(FacetCutAction action); //ADDED
    error ErrDiamondSelectorNotSpecified(); //ADDED

    /// @dev Add=0, Replace=1, Remove=2
    enum FacetCutAction {
        Add,
        Replace,
        Remove
    }

    /// @dev Contains a facet address and array of function selectors that are updated in a diamond.
    struct FacetCut {
        address facetAddress;
        FacetCutAction action;
        bytes4[] functionSelectors;
    }

    /// @dev Emitted any time external functions are added, replaced, or removed.
    event DiamondCut(FacetCut[] _diamondCut, address _init, bytes _calldata);
}
