import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

import Web3 from "web3";
import Ganache from "ganache";
import {Web3FunctionProvider} from "@saturn-chain/web3-functions";
import {EthProviderInterface} from "@saturn-chain/dlt-tx-data-functions";

import allContracts from "../src";

import {
	SmartContract,
	SmartContractInstance,
} from "@saturn-chain/smart-contract";
import {blockGasLimit, mintGas, registerGas} from "../tests/gas.constant";
import {makeBondDate} from "../tests/dates";
import {DiamondCut, deployRegisterPackage, getFunctionABI} from "./diamond";
import {MaxInt256} from "ethers";

const RegisterContractName = "RegisterDiamond";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const registerPackages = [
	"RegisterMetadata",
	"CouponSnapshotManagement",
	"RegisterRoleManagement",
	"SmartContractAccessManagement",
	"InvestorManagement",
];

// describe("Run tests on Register (Bond Issuance) contract", function () {

let web3: Web3;
let cak: EthProviderInterface;
let stranger: EthProviderInterface;
let instance: SmartContractInstance;
let Register: SmartContract;
let cakAddress: string;
let strangerAddress: string;

async function deployRegisterContract(): Promise<void> {
	// web3 = new Web3(
	// 	Ganache.provider({
	// 		default_balance_ether: 1000,
	// 		gasLimit: blockGasLimit,
	// 		chain: {vmErrorsOnRPCResponse: true},
	// 	}) as any,
	// );

	web3 = new Web3(
		new Web3.providers.HttpProvider(
			"https://cacib-saturn-test.francecentral.cloudapp.azure.com",
		),
	);

	// Replace with your actual private key (without the 0x prefix)
	const privateKey = ""; // TODO use env variables to add deployer private key

	// Create an account instance from the private key
	const account = web3.eth.accounts.privateKeyToAccount(privateKey);

	console.log("account", account);

	// Add the account to the wallet
	web3.eth.accounts.wallet.add(account);

	// Set the account as the default account
	web3.eth.defaultAccount = account.address;

	const cak = new Web3FunctionProvider(web3.currentProvider, (list) =>
		Promise.resolve(list[0]),
	);

	// get address of cak
	// Verify if Web3FunctionProvider is correctly instantiated and has the account method
	if (typeof cak.account !== "function") {
		console.error("cak.account is not a function");
	} else {
		(async () => {
			try {
				const chainId = await web3.eth.net.getId();
				console.log(`Connected to chain ID: ${chainId}`);

				// Get the address of cak
				const test = await cak.account(0);

				console.log("test", test);

				// Your other code that uses `cak` or deploys contracts
			} catch (error) {
				console.error(`Error: ${error.message}`);
			}
		})();
	}

	// console.log("cak", cak);

	// cak = new Web3FunctionProvider(web3.currentProvider, (list) =>
	// 	Promise.resolve(list[0]),
	// );

	// cakAddress = await cak.account(0);
	const cakAddress = account.address;

	console.log("cakAddress", cakAddress);

	// get eth balance
	const balance = await web3.eth.getBalance(cakAddress);

	console.log("balance", balance);

	// const dates = makeBondDate(2);
	// const bondName = "EIB 3Y 1Bn SEK";
	// const isin = "EIB3Y";
	// const expectedSupply = 1000;
	// const currency = web3.utils.asciiToHex("SEK");
	// const unitVal = 100000;
	// const couponRate = web3.utils.asciiToHex("0.4");
	// const creationDate = dates.creationDate;
	// const issuanceDate = dates.issuanceDate;
	// const maturityDate = dates.maturityDate;
	// const couponDates = dates.couponDates;
	// const defaultCutofftime = dates.defaultCutofftime;

	// deploy RegisterDiamondReadable
	const RegisterDiamondReadable: SmartContract = allContracts.get(
		"RegisterDiamondReadable",
	);

	const instanceRegisterDiamondReadable: SmartContractInstance =
		await RegisterDiamondReadable.deploy(cak.newi({maxGas: registerGas}));

	const addressRegisterDiamondReadable =
		instanceRegisterDiamondReadable.deployedAt;

	console.log("addressRegisterDiamondReadable", addressRegisterDiamondReadable);

	// deploy RegisterDiamondWritable
	const RegisterDiamondWritable: SmartContract = allContracts.get(
		"RegisterDiamondWritable",
	);

	const instanceRegisterDiamondWritable: SmartContractInstance =
		await RegisterDiamondWritable.deploy(cak.newi({maxGas: registerGas}));

	const addressRegisterDiamondWritable =
		instanceRegisterDiamondWritable.deployedAt;

	console.log("addressRegisterDiamondWritable", addressRegisterDiamondWritable);

	// // create initData for RegisterDiamondWritable
	// const initializeABI = await getFunctionABI(
	// 	"RegisterDiamondWritable",
	// 	"initialize",
	// );

	// // const initObject: any = [
	// // 	bondName,
	// // 	isin,
	// // 	expectedSupply,
	// // 	currency,
	// // 	unitVal,
	// // 	couponRate,
	// // 	creationDate,
	// // 	issuanceDate,
	// // 	maturityDate,
	// // 	couponDates,
	// // 	defaultCutofftime,
	// // ];

	// // const initData = web3.eth.abi.encodeFunctionCall(initializeABI, initObject);

	// deploy RegisterDiamond
	// Register = allContracts.get(RegisterContractName);

	// instance = await Register.deploy(
	// 	cak.newi({maxGas: registerGas}),
	// 	addressRegisterDiamondReadable,
	// 	addressRegisterDiamondWritable,
	// 	initData,
	// );

	// instanciate RegisterDiamondWritable
	const intanceRegisterWritable = RegisterDiamondWritable.at(
		instance.deployedAt,
	);

	// create register cuts
	let registerCuts: DiamondCut[] = [];

	// return an array of promises
	const promises = registerPackages.map(async (registerPackageName) => {
		const cut: DiamondCut = await deployRegisterPackage(
			cak,
			registerPackageName,
		);
		return cut;
	});

	// Use Promise.all to await all promises in parallel
	registerCuts = await Promise.all(promises);

	console.log("registerCuts", registerCuts);

	// await intanceRegisterWritable.diamondCut(
	// 	cak.send({maxGas: registerGas}),
	// 	registerCuts,
	// 	ZERO_ADDRESS,
	// 	"0x",
	// );

	// const IRegister: SmartContract = allContracts.get("IRegister");

	// instance = IRegister.at(instance.deployedAt);
}

async function main() {
	await deployRegisterContract();
}

if (require.main === module) {
	main();
}
