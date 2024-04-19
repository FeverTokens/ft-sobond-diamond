// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import {IDiamondBase, DiamondBase} from "../proxy/diamond/base/DiamondBase.sol";
import {IDiamondReadable} from "../proxy/diamond/readable/DiamondReadable.sol";
import {IDiamondWritable, DiamondWritableInternal} from "../proxy/diamond/writable/DiamondWritable.sol";
import {IRegisterMetadata} from "./metadata/IRegisterMetadata.sol";

/**
 * @title Diamond proxy reference implementation inspired from SolidState
 */
contract RegisterDiamond is IDiamondBase, DiamondBase, DiamondWritableInternal {
    constructor(
        address _diamondReadablePackage,
        address _diamondWritablePackage,
        bytes memory _initData
    ) {
        // diamond cut
        FacetCut[] memory facetCuts = new FacetCut[](2);

        // register DiamondReadable
        bytes4[] memory diamondReadableSelectors = new bytes4[](4);
        diamondReadableSelectors[0] = IDiamondReadable.facets.selector;
        diamondReadableSelectors[1] = IDiamondReadable
            .facetFunctionSelectors
            .selector;
        diamondReadableSelectors[2] = IDiamondReadable.facetAddresses.selector;
        diamondReadableSelectors[3] = IDiamondReadable.facetAddress.selector;

        // register DiamondWritable
        bytes4[] memory diamondWritableSelectors = new bytes4[](1);
        diamondWritableSelectors[0] = IDiamondWritable.diamondCut.selector;

        facetCuts[0] = FacetCut({
            target: _diamondReadablePackage,
            action: FacetCutAction.ADD,
            selectors: diamondReadableSelectors
        });

        facetCuts[1] = FacetCut({
            target: _diamondWritablePackage,
            action: FacetCutAction.ADD,
            selectors: diamondWritableSelectors
        });

        _diamondCut(facetCuts, _diamondWritablePackage, _initData);
    }

    receive() external payable {}
}
