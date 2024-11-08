/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  IRegisterMetadata,
  IRegisterMetadataInterface,
} from "../../../../src/register/metadata/IRegisterMetadata";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "isin",
        type: "string",
      },
    ],
    name: "NewBondDrafted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "message",
        type: "string",
      },
    ],
    name: "PublicMessage",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "emiter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "isin",
        type: "string",
      },
      {
        indexed: false,
        internalType: "enum IRegisterMetadataInternal.Status",
        name: "status",
        type: "uint8",
      },
    ],
    name: "RegisterStatusChanged",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "date",
        type: "uint256",
      },
    ],
    name: "addCouponDate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_couponDate",
        type: "uint256",
      },
    ],
    name: "checkIfCouponDateExists",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_maturityDate",
        type: "uint256",
      },
    ],
    name: "checkIfMaturityDateExists",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "date",
        type: "uint256",
      },
    ],
    name: "delCouponDate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getBondCouponRate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBondData",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "isin",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "expectedSupply",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "currency",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "unitValue",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "couponRate",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "creationDate",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "issuanceDate",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maturityDate",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "couponDates",
            type: "uint256[]",
          },
          {
            internalType: "uint256",
            name: "cutOffTime",
            type: "uint256",
          },
        ],
        internalType: "struct IRegisterMetadataInternal.BondData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBondUnitValue",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCreationDate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getIssuanceDate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "makeReady",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "primaryIssuanceAccount",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "string",
        name: "message",
        type: "string",
      },
    ],
    name: "publicMessage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "investor",
        type: "address",
      },
    ],
    name: "returnBalanceToPrimaryIssuanceAccount",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "revertReady",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "name_",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "expectedSupply_",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "currency_",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "unitVal_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "couponRate_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "issuanceDate_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maturityDate_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "cutOffTime_",
        type: "uint256",
      },
    ],
    name: "setBondData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "creationDate",
        type: "uint256",
      },
    ],
    name: "setCreationDate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "currency",
        type: "bytes32",
      },
    ],
    name: "setCurrency",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "couponDate_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "recordDatetime_",
        type: "uint256",
      },
    ],
    name: "setCurrentCouponDate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "expectedSupply",
        type: "uint256",
      },
    ],
    name: "setExpectedSupply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "isinSymbol",
        type: "string",
      },
    ],
    name: "setIsinSymbol",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "issuanceDate",
        type: "uint256",
      },
    ],
    name: "setIssuanceDate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "name_",
        type: "string",
      },
    ],
    name: "setName",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "status",
    outputs: [
      {
        internalType: "enum IRegisterMetadataInternal.Status",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "toggleFrozen",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class IRegisterMetadata__factory {
  static readonly abi = _abi;
  static createInterface(): IRegisterMetadataInterface {
    return new Interface(_abi) as IRegisterMetadataInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): IRegisterMetadata {
    return new Contract(address, _abi, runner) as unknown as IRegisterMetadata;
  }
}
