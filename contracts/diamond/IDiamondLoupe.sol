// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IDiamondLoupeInternal } from "./IDiamondLoupeInternal.sol";

interface IDiamondLoupe is IDiamondLoupeInternal {
    /** @notice Gets all facet addresses and their four byte function selectors.
     *  @return facets_ Facet
     */
    function facets() external view returns (Facet[] memory facets_);

    /** @notice Gets all the function selectors supported by a specific facet.
     *  @param _facet The facet address.
     *  @return facetFunctionSelectors_ The function selectors.
     */
    function facetFunctionSelectors(
        address _facet
    ) external view returns (bytes4[] memory facetFunctionSelectors_);

    /** @notice Gets all the facet addresses used by a diamond.
     *  @return facetAddresses_ The facet addresses.
     */
    function facetAddresses()
        external
        view
        returns (address[] memory facetAddresses_);

    /** @notice Gets the facet that supports the given selector.
     *  @dev If facet is not found return address(0).
     *  @param _functionSelector The function selector.
     *  @return facetAddress_ The facet address.
     */
    function facetAddress(
        bytes4 _functionSelector
    ) external view returns (address facetAddress_);
}
