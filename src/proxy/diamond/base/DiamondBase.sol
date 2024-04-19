// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import {Proxy} from "../../Proxy.sol";
import {IDiamondBase} from "./IDiamondBase.sol";
import {DiamondBaseStorage} from "./DiamondBaseStorage.sol";

/**
 * @title EIP-2535 "Diamond" proxy base contract
 * @dev see https://eips.ethereum.org/EIPS/eip-2535
 */
abstract contract DiamondBase is IDiamondBase, Proxy {
    /**
     * @inheritdoc Proxy
     */
    function _getImplementation()
        internal
        view
        virtual
        override
        returns (address implementation)
    {
        DiamondBaseStorage.Layout storage l = DiamondBaseStorage.layout();

        implementation = address(bytes20(l.facets[msg.sig]));
    }
}
