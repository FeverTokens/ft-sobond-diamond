// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity ^0.8.20;

import { IDiamondCut } from "./IDiamondCut.sol";
import { DiamondCutInternal } from "./DiamondCutInternal.sol";

contract DiamondCut is IDiamondCut, DiamondCutInternal {
    /// @inheritdoc IDiamondCut
    /// @dev This function`MUST` be overridden to add access control through {Ownable} or {AccessControl}.
    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external virtual {
        _diamondCutImplementation(_diamondCut, _init, _calldata);
    }
}
