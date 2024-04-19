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
import {blockGasLimit, mintGas, registerGas} from "./gas.constant";
import {makeBondDate} from "./dates";
import {
	DiamondCut,
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

describe("Run tests on Register (Bond Issuance) contract", function () {
	this.timeout(10000);
	let web3: Web3;
	let cak: EthProviderInterface;
	let stranger: EthProviderInterface;
	let instance: SmartContractInstance;
	let Register: SmartContract;
	let cakAddress: string;
	let strangerAddress: string;

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

		cakAddress = await cak.account(0);

		strangerAddress = await stranger.account();

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

		instance = IRegister.at(instance.deployedAt);
	}

	describe("Register contract: verify mint rules", function () {
		// beforeEach ensures unit test isolation
		beforeEach(async () => {
			await deployRegisterContract();
		});

		it("CAK may mint", async function () {
			await instance.mint(cak.send({maxGas: mintGas}), 60);
		});

		it("CAK may mint twice and all token goes to primaryIssuanceAccount", async function () {
			await instance.mint(cak.send({maxGas: mintGas}), 10);
			await instance.mint(cak.send({maxGas: mintGas}), 10);
			const actual = await instance.balanceOf(cak.call(), cakAddress);
			expect(actual).to.equal(
				"0",
				"CAK should NOT recieve the bond parts after mint",
			);

			const primaryIssuanceAccount = instance.deployedAt;

			const contractBalance = await instance.balanceOf(
				cak.call(),
				primaryIssuanceAccount,
			);
			expect(contractBalance).to.equal("20");
		});

		it("stranger may not mint", async function () {
			await expect(
				instance.mint(stranger.send({maxGas: 130000}), 30),
			).to.be.rejectedWith("Caller must be CAK");

			const strangerBalance = await instance.balanceOf(
				stranger.call(),
				strangerAddress,
			);
			expect(strangerBalance).to.equal(
				"0",
				"strangerBalance balance should be 0 as mint should be denied",
			);

			const primaryIssuanceAccount = instance.deployedAt;
			const contractBalance = await instance.balanceOf(
				cak.call(),
				primaryIssuanceAccount,
			);
			expect(contractBalance).to.equal(
				"0",
				"primaryIssuanceAccount balance should be 0 as mint should be denied",
			);
		});

		//TODO: unit test stranger cannot grant himself cak role role just after the deploy
		//TODO: cannot mint if not cak (sc-deployer)
		//TODO: unit test generated event  (topics)
	});

	describe("Register contract: verify intialization", function () {
		//WARN; unit test on the same contract instance: ok if only real operation via call()
		before(async () => {
			await deployRegisterContract();
		});

		it("CAK role should be set", async () => {
			const cakRole = await instance.CAK_ROLE(cak.call());
			expect(cakRole).to.equal(
				"0xa75205b8583660bdad375c0ccde11af17668d76a408a9a5e739251b0f7c59870",
				"invalid cak_role value",
			);

			const isCak = await instance.hasRole(cak.call(), cakRole, cakAddress);
			expect(isCak).to.true;
		});

		it("stranger should NOT have the CAK role", async () => {
			const cakRole = await instance.CAK_ROLE(cak.call());
			expect(strangerAddress).to.not.equal(cakAddress);
			const isCak = await instance.hasRole(
				cak.call(),
				cakRole,
				strangerAddress,
			);
			expect(isCak).to.false;

			const strangerAddress2 = await cak.account(1);
			expect(strangerAddress).to.equal(strangerAddress2);

			const isCak2 = await instance.hasRole(
				cak.call(),
				cakRole,
				strangerAddress2,
			);
			expect(isCak2).to.false;
		});

		it("CAK balance is zero", async function () {
			const actual = await instance.balanceOf(cak.call(), cakAddress);
			expect(actual).to.equal("0");
		});
	});
});
