/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  IDelegateInvestorManagement,
  IDelegateInvestorManagementInterface,
} from "../../../../src/register/delegateInvestors/IDelegateInvestorManagement";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "custodian",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "delegate",
        type: "address",
      },
    ],
    name: "CustodianDelegateSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "custodian",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "delegate",
        type: "address",
      },
    ],
    name: "CustodianDelegateUnset",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "investor_",
        type: "address",
      },
      {
        internalType: "address",
        name: "delegator_",
        type: "address",
      },
    ],
    name: "delegateDisableInvestorFromWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "investor_",
        type: "address",
      },
      {
        internalType: "address",
        name: "delegator_",
        type: "address",
      },
    ],
    name: "delegateEnableInvestorToWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "custodian",
        type: "address",
      },
    ],
    name: "getCustodianDelegate",
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
        name: "custodian",
        type: "address",
      },
      {
        internalType: "address",
        name: "delegate",
        type: "address",
      },
    ],
    name: "isCustodianDelegate",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "delegate",
        type: "address",
      },
    ],
    name: "setCustodianDelegate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unsetCustodianDelegate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class IDelegateInvestorManagement__factory {
  static readonly abi = _abi;
  static createInterface(): IDelegateInvestorManagementInterface {
    return new Interface(_abi) as IDelegateInvestorManagementInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): IDelegateInvestorManagement {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as IDelegateInvestorManagement;
  }
}