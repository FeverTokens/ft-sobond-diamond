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
  MulticallMock,
  MulticallMockInterface,
} from "../../../src/utils/MulticallMock";

const _abi = [
  {
    inputs: [],
    name: "callRevertTest",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "callTest",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes[]",
        name: "data",
        type: "bytes[]",
      },
    ],
    name: "multicall",
    outputs: [
      {
        internalType: "bytes[]",
        name: "results",
        type: "bytes[]",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x6080806040523461001657610397908161001c8239f35b600080fdfe6080604052600436101561001257600080fd5b6000803560e01c90816321615e9c146100865781633c67684514610045575063ac9650d81461004057600080fd5b610134565b3461008357806003193601126100835760405162461bcd60e51b81526020600482015260066024820152651c995d995c9d60d21b6044820152606490fd5b80fd5b34610083578060031936011261008357600160805260206080f35b6020808201818352835180915260408301918060408360051b860101950193600080915b8483106100d6575050505050505090565b90919293949596603f19828203018752848851805190818452855b8281106101205750508083018201859052601f01601f19169091018101978101960194939260010191906100c5565b8181018401518582018501528893016100f1565b3461019e57602036600319011261019e5767ffffffffffffffff60043581811161019e573660238201121561019e57806004013591821161019e573660248360051b8301011161019e5761019a91602461018e92016102b7565b604051918291826100a1565b0390f35b600080fd5b634e487b7160e01b600052604160045260246000fd5b6040519190601f01601f1916820167ffffffffffffffff8111838210176101df57604052565b6101a3565b67ffffffffffffffff81116101df5760051b60200190565b634e487b7160e01b600052603260045260246000fd5b91908110156102545760051b81013590601e198136030182121561019e57019081359167ffffffffffffffff831161019e57602001823603811361019e579190565b6101fc565b908092918237016000815290565b3d1561029e573d9067ffffffffffffffff82116101df57610291601f8301601f19166020016101b9565b9182523d6000602084013e565b606090565b80518210156102545760209160051b010190565b6102c86102c3836101e4565b6101b9565b82815291601f196102d8826101e4565b0160005b81811061035057505060005b8181106102f55750505090565b600080610303838587610212565b9061031360405180938193610259565b0390305af490610321610267565b91156103465760019161033482876102a3565b5261033f81866102a3565b50016102e8565b3d6000803e3d6000fd5b8060606020809388010152016102dc56fea2646970667358221220a9b61590217b5ce881b9721ce9505245d62d0c04ef4eddd9dcbc96ba4fb88fee64736f6c63430008140033";

type MulticallMockConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MulticallMockConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MulticallMock__factory extends ContractFactory {
  constructor(...args: MulticallMockConstructorParams) {
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
      MulticallMock & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): MulticallMock__factory {
    return super.connect(runner) as MulticallMock__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MulticallMockInterface {
    return new Interface(_abi) as MulticallMockInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): MulticallMock {
    return new Contract(address, _abi, runner) as unknown as MulticallMock;
  }
}