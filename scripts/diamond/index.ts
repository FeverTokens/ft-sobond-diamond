import allContracts from "../../src";
import {EthProviderInterface} from "@saturn-chain/dlt-tx-data-functions";
import {registerGas} from "../../tests/gas.constant";
import {SmartContract} from "@saturn-chain/smart-contract";
import {readFileSync} from "fs";
import {join} from "path";
import Web3 from "web3";
import {AbiItem} from "web3-utils";

const web3 = new Web3();

const combined = JSON.parse(
	readFileSync(join(__dirname, "../../contracts/combined.json"), "utf8"),
);

export enum FacetCutAction {
	Add,
	Replace,
	Remove,
}

export interface DiamondCut {
	target: string;
	action: FacetCutAction;
	selectors: string[];
}

export function getSelectors(abi: AbiItem[]): string[] {
	const selectors: string[] = [];
	abi.forEach((item) => {
		if (item.type === "function") {
			const signature = web3.eth.abi.encodeFunctionSignature(item);
			selectors.push(signature);
		}
	});
	return selectors;
}

export async function getPackageAbi(
	RegisterPackageName: string,
): Promise<AbiItem[]> {
	if (allContracts.get(RegisterPackageName)) {
		const RegisterPackage: SmartContract =
			allContracts.get(RegisterPackageName);
		const registerPackageAbi =
			combined["contracts"][`${RegisterPackage.file}:${RegisterPackage.name}`]
				.abi;
		return registerPackageAbi;
	} else {
		throw new Error(
			RegisterPackageName + " contract not defined in the compilation result",
		);
	}
}

export async function getFunctionABI(
	RegisterPackageName: string,
	functionName: string,
) {
	const abi: AbiItem[] = await getPackageAbi(RegisterPackageName);
	// @ts-ignore
	const functionABI = abi.filter(
		(item) => item.type === "function" && item.name === functionName,
	)[0];
	return functionABI;
}

export async function deployRegisterPackage(
	cak: EthProviderInterface,
	RegisterPackageName: string,
	...optionalParams: any[]
): Promise<DiamondCut> {
	if (allContracts.get(RegisterPackageName)) {
		const RegisterPackage: SmartContract =
			allContracts.get(RegisterPackageName);

		const registerPackage = await RegisterPackage.deploy(
			cak.newi({maxGas: registerGas}),
			...optionalParams,
		);

		// ! Interface of package should be used to avoid selector collision
		const RegisterPackageInterface: SmartContract = allContracts.get(
			`I${RegisterPackageName}`,
		);

		const registerPackageAbi =
			combined["contracts"][
				`${RegisterPackageInterface.file}:${RegisterPackageInterface.name}`
			].abi;

		const selectors = getSelectors(registerPackageAbi);

		return {
			action: FacetCutAction.Add,
			target: registerPackage.deployedAt,
			selectors: selectors,
		};
	} else {
		throw new Error(
			RegisterPackageName + "contract not defined in the compilation result",
		);
	}
}

async function main() {
	const RegisterPackageName = "CouponSnapshotManagement";
	const abi: AbiItem[] = await getPackageAbi(RegisterPackageName);
	console.log("abi: ", abi);

	const functionABI = await getFunctionABI(
		RegisterPackageName,
		"totalSupplyAtCoupon",
	);
	console.log("functionABI: ", functionABI);
}

if (require.main === module) {
	main();
}
