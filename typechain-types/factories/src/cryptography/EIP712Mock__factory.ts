/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../../common";
import type {
  EIP712Mock,
  EIP712MockInterface,
} from "../../../src/cryptography/EIP712Mock";

const _abi = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "nameHash",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "versionHash",
        type: "bytes32",
      },
    ],
    name: "calculateDomainSeparator",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608080604052346100155760b1908161001b8239f35b600080fdfe6004361015600c57600080fd5b60003560e01c638ec98aff14602057600080fd5b3460765760403660031901126076577f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60805260043560a05260243560c0524660e052306101005260a060802060805260206080f35b600080fdfea2646970667358221220a07b880188b174e7fce9dd47456ed95c7a83466e0cf835645d1d1b4ee58d6d1264736f6c63430008140033";

type EIP712MockConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: EIP712MockConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class EIP712Mock__factory extends ContractFactory {
  constructor(...args: EIP712MockConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      EIP712Mock & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): EIP712Mock__factory {
    return super.connect(runner) as EIP712Mock__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): EIP712MockInterface {
    return new Interface(_abi) as EIP712MockInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): EIP712Mock {
    return new Contract(address, _abi, runner) as unknown as EIP712Mock;
  }
}