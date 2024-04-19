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
import {
	blockGasLimit,
	makeReadyGas,
	mintGas,
	registerGas,
} from "./gas.constant";
import {makeBondDate} from "./dates";
import {
	DiamondCut,
	FacetCutAction,
	deployRegisterPackage,
	getFunctionABI,
} from "../scripts/diamond";

const RegisterContractName = "RegisterDiamond";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const registerPackages = [
	"RegisterMetadata",
	"CouponSnapshotManagement",
	"RegisterRoleManagement",
	"SmartContractAccessManagement",
	"InvestorManagement",
];
const PrimaryIssuanceContractName = "PrimaryIssuance";

describe("Register (Bond Issuance)", function () {
	this.timeout(10000);
	let web3: Web3;
	let cak: EthProviderInterface;
	let custodian: EthProviderInterface;
	let stranger: EthProviderInterface;
	let bnd: EthProviderInterface;
	let registerInstance: SmartContractInstance;
	let Register: SmartContract;
	let cakAddress: string;
	let investorAddress: string;
	let custodianAddress: string;
	let strangerAddress: string;
	let bndAddress: string;
	let instance: SmartContractInstance;

	async function deployRegisterContract(): Promise<void> {
		web3 = new Web3(
			Ganache.provider({
				default_balance_ether: 1000,
				gasLimit: blockGasLimit,
				chain: {vmErrorsOnRPCResponse: true},
			}) as any,
		);
		cak = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[0]),
		);
		stranger = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[1]),
		);
		custodian = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[2]),
		);
		bnd = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[3]),
		);

		cakAddress = await cak.account();
		investorAddress = await cak.account();
		custodianAddress = await custodian.account();
		strangerAddress = await stranger.account();
		bndAddress = await bnd.account();
		const dates = makeBondDate(2);
		const bondName = "EIB 3Y 1Bn SEK";
		const isin = "EIB3Y";
		const expectedSupply = 1000;
		const currency = web3.utils.asciiToHex("SEK");
		const unitVal = 100000;
		const couponRate = web3.utils.asciiToHex("0.4");
		const creationDate = dates.creationDate;
		const issuanceDate = dates.issuanceDate;
		const maturityDate = dates.maturityDate;
		const couponDates = dates.couponDates;
		const defaultCutofftime = dates.defaultCutofftime;

		// deploy RegisterDiamondReadable
		const RegisterDiamondReadable: SmartContract = allContracts.get(
			"RegisterDiamondReadable",
		);

		const instanceRegisterDiamondReadable: SmartContractInstance =
			await RegisterDiamondReadable.deploy(cak.newi({maxGas: registerGas}));

		const addressRegisterDiamondReadable =
			instanceRegisterDiamondReadable.deployedAt;

		// deploy RegisterDiamondWritable
		const RegisterDiamondWritable: SmartContract = allContracts.get(
			"RegisterDiamondWritable",
		);

		const instanceRegisterDiamondWritable: SmartContractInstance =
			await RegisterDiamondWritable.deploy(cak.newi({maxGas: registerGas}));

		const addressRegisterDiamondWritable =
			instanceRegisterDiamondWritable.deployedAt;

		// create initData for RegisterDiamondWritable
		const initializeABI = await getFunctionABI(
			"RegisterDiamondWritable",
			"initialize",
		);

		const initObject: any = [
			bondName,
			isin,
			expectedSupply,
			currency,
			unitVal,
			couponRate,
			creationDate,
			issuanceDate,
			maturityDate,
			couponDates,
			defaultCutofftime,
		];

		const initData = web3.eth.abi.encodeFunctionCall(initializeABI, initObject);

		// deploy RegisterDiamond
		Register = allContracts.get(RegisterContractName);

		instance = await Register.deploy(
			cak.newi({maxGas: registerGas}),
			addressRegisterDiamondReadable,
			addressRegisterDiamondWritable,
			initData,
		);

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

		await intanceRegisterWritable.diamondCut(
			cak.send({maxGas: registerGas}),
			registerCuts,
			ZERO_ADDRESS,
			"0x",
		);

		const IRegister: SmartContract = allContracts.get("IRegister");

		registerInstance = IRegister.at(instance.deployedAt);
	}

	describe("status lifecyle", function () {
		beforeEach(async () => {
			await deployRegisterContract();
			//NOTE: only one Bond contract is deployed within this describe() scope
		});

		it("should be draft after deploy", async () => {
			const actual = await registerInstance.status(cak.call());
			expect(actual).to.equal("0");
		});

		it("should still be Draft after mint as mint does not affect lifecyle (not process related)", async () => {
			await registerInstance.mint(cak.send({maxGas: mintGas}), 1000);
			const actual = await registerInstance.status(cak.call());
			expect(actual).to.equal("0");
		});

		it("should be ready after makeReady", async () => {
			await registerInstance.setExpectedSupply(
				cak.send({maxGas: 100000}),
				1000,
			);
			await registerInstance.makeReady(cak.send({maxGas: makeReadyGas}));
			const actual = await registerInstance.status(cak.call());
			const supply = await registerInstance.totalSupply(cak.call());
			expect(actual).to.equal("1");
			expect(supply).to.equal(`1000`);
		});

		it("should be revert to Draft after makeReady", async () => {
			// GIVEN the bond is in ready state
			await registerInstance.setExpectedSupply(
				cak.send({maxGas: 100000}),
				1000,
			);
			await registerInstance.makeReady(cak.send({maxGas: makeReadyGas}));

			// WHEN the CAK decide to revert
			await registerInstance.revertReady(cak.send({maxGas: makeReadyGas}));
			const actual = await registerInstance.status(cak.call());
			const supply = await registerInstance.totalSupply(cak.call());
			expect(actual).to.equal("0");
			expect(supply).to.equal(`0`);
		});

		it("should be Issued after issuance approval", async () => {
			// implicit: register has been minted

			await registerInstance.grantBndRole(
				cak.send({maxGas: 100000}),
				bndAddress,
			);

			const primaryInstance = await allContracts
				.get(PrimaryIssuanceContractName)
				.deploy(bnd.newi({maxGas: 1000000}), registerInstance.deployedAt, 1500);

			//whitelist the Primary
			let primaryHash = await registerInstance.atReturningHash(
				cak.call(),
				primaryInstance.deployedAt,
			);

			await registerInstance.enableContractToWhitelist(
				cak.send({maxGas: 100000}),
				primaryHash,
			);

			const before = await registerInstance.status(stranger.call());
			await registerInstance.grantCstRole(
				cak.send({maxGas: 100000}),
				await custodian.account(),
			);

			await registerInstance.enableInvestorToWhitelist(
				custodian.send({maxGas: 1200000}),
				bndAddress,
			); // needed to deploy a test trade contract

			await registerInstance.makeReady(cak.send({maxGas: makeReadyGas}));

			//Act
			const gas = await primaryInstance.validate(bnd.test());

			console.log("PrimaryInstance validate Gas: ", gas);

			const txValidatePrimary = await primaryInstance.validate(
				bnd.send({maxGas: gas}),
			);
			// console.log((await web3.eth.getTransactionReceipt(txValidatePrimary)).logs); //uncomment this for debugging

			const actual = await registerInstance.status(stranger.call());
			expect(actual).to.equal(
				"2",
				"register status should be 'Issued' after finalize was called",
			);
		});

		//TODO: Repaid status ? (Register : Draft / Cancel / Ready / Issued / Repaid)
	});

	describe("bond reparation", () => {
		beforeEach(async () => {
			await deployRegisterContract();
			//NOTE: only one Bond contract is deployed within this describe() scope
			await registerInstance.grantBndRole(
				cak.send({maxGas: 100000}),
				bndAddress,
			);
		});

		it("It should create a new bond, force some balances then force its issuance", async () => {
			// Deploy the Primary issuance smart contract
			const primaryInstance = await allContracts
				.get(PrimaryIssuanceContractName)
				.deploy(
					bnd.newi({maxGas: 1000000}),
					registerInstance.deployedAt,
					100 * 10000,
				);

			//whitelist the Primary Issuance contract
			let primaryHash = await registerInstance.atReturningHash(
				cak.call(),
				primaryInstance.deployedAt,
			);

			const gas = await registerInstance.enableContractToWhitelist(
				cak.test(),
				primaryHash,
			);

			console.log("EnableContractToWhitelist Gas: ", gas);

			await registerInstance.enableContractToWhitelist(
				cak.send({maxGas: gas}),
				primaryHash,
			);

			// Set the register in Ready state that sets the primary issuance account to the total Supply
			await registerInstance.makeReady(cak.send({maxGas: makeReadyGas}));

			const totalSupply = Number.parseInt(
				await registerInstance.totalSupply(cak.call()),
			);

			const intitialPrimaryIssuanceBal = Number.parseInt(
				await registerInstance.balanceOf(
					cak.call(),
					registerInstance.deployedAt,
				),
			);

			// Send 300 to investor
			const gasTransferFrom = await registerInstance.transferFrom(
				cak.test(),
				registerInstance.deployedAt,
				investorAddress,
				300,
			);

			await registerInstance.transferFrom(
				cak.send({maxGas: gasTransferFrom}),
				registerInstance.deployedAt,
				investorAddress,
				300,
			);

			console.log("working like a charm");

			const step2_PrimaryIssuanceBal = Number.parseInt(
				await registerInstance.balanceOf(
					cak.call(),
					registerInstance.deployedAt,
				),
			);

			console.log("Still working like a charm");

			// Purchase the bond
			const gasValidate = await primaryInstance.validate(bnd.test());
			const txValidatePrimary = await primaryInstance.validate(
				bnd.send({maxGas: gasValidate}),
			);
			const details = await primaryInstance.getDetails(bnd.call());
			const step3_PrimaryIssuanceBal = Number.parseInt(
				await registerInstance.balanceOf(
					cak.call(),
					registerInstance.deployedAt,
				),
			);

			console.log("Balances: ", {
				intitialPrimaryIssuanceBal,
				step2_PrimaryIssuanceBal,
				step3_PrimaryIssuanceBal,
				details,
			});

			expect(totalSupply).eq(1000);
			expect(intitialPrimaryIssuanceBal).eq(totalSupply);
			expect(totalSupply).eq(step2_PrimaryIssuanceBal + 300);
			expect(step3_PrimaryIssuanceBal).eq(0);
			expect(totalSupply).eq(Number.parseInt(details.quantity) + 300);
		});
	});
});
