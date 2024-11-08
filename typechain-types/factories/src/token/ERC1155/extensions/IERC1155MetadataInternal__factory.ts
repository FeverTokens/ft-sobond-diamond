/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  IERC1155MetadataInternal,
  IERC1155MetadataInternalInterface,
} from "../../../../../src/token/ERC1155/extensions/IERC1155MetadataInternal";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "value",
        type: "string",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "URI",
    type: "event",
  },
] as const;

export class IERC1155MetadataInternal__factory {
  static readonly abi = _abi;
  static createInterface(): IERC1155MetadataInternalInterface {
    return new Interface(_abi) as IERC1155MetadataInternalInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): IERC1155MetadataInternal {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as IERC1155MetadataInternal;
  }
}
