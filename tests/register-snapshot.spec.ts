import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

import Web3 from "web3";
import Ganache from "ganache";
import {Web3FunctionProvider} from "@saturn-chain/web3-functions";
import {EthProviderInterface} from "@saturn-chain/dlt-tx-data-functions";
import {EventData} from "web3-eth-contract";

import allContracts from "../src";
import {
	EventReceiver,
	SmartContract,
	SmartContractInstance,
} from "@saturn-chain/smart-contract";
import {blockGasLimit, mintGas, registerGas} from "./gas.constant";
import {makeBondDate, makeDateTime} from "./dates";
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

describe("Register snapshot testing", function () {
	this.timeout(10000);
	let web3: Web3;
	let cak: EthProviderInterface;
	let stranger: EthProviderInterface;
	let instance: SmartContractInstance;
	let Register: SmartContract;
	let cakAddress: string;
	let strangerAddress: string;
	let strangerAddress2: string;
	let strangerAddress3: string;
	let eventSubscription: EventReceiver;
	let custodianA: EthProviderInterface;

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
		strangerAddress = await cak.account(1);
		strangerAddress2 = await cak.account(2);
		strangerAddress3 = await cak.account(3);
		custodianA = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[2]),
		);
		const dates = makeBondDate();
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

	const gas = (v?: number) => ({maxGas: v || 200000});
	const returnValues = (log: EventData) => {
		const r = {...log.returnValues};
		// excludes numeric keys
		for (const key in r) {
			if (/[0-9]+/.test(key)) {
				delete r[key];
			}
		}
		return r;
	};

	beforeEach(async () => {
		await deployRegisterContract();

		// collect all logs for debugging
		eventSubscription = instance.allEvents(cak.sub(), {}).on("log", (log) => {
			// console.log(">>>", log.event, returnValues(log)); //enable this to see all events during the tests
		});
		// create some balance on the primary issuance account
		await instance.mint(cak.send(gas(mintGas)), 1000);
	});

	afterEach(() => {
		if (eventSubscription) eventSubscription.removeAllListeners();
	});

	it("when creating the register the current stimestamp should be set", async () => {
		const data = await instance.getBondData(cak.call());
		const currentTs = await instance.currentSnapshotDatetime(cak.call());
		// console.log("currentSnapshotDatetime", data, currentTs, makeDateTime(data.couponDates[0], data.cutOffTime));
		expect(currentTs).to.equal(
			"" + makeDateTime(data.couponDates[0], data.cutOffTime),
		);
	});

	it("when CAK transfer to stranger it should update stranger balance", async () => {
		await instance.grantCstRole(
			cak.send({maxGas: 100000}),
			await custodianA.account(),
		);

		const gasEnableInvestorToWhitelist =
			await instance.enableInvestorToWhitelist(
				custodianA.test(),
				strangerAddress,
			);

		await instance.enableInvestorToWhitelist(
			custodianA.send({maxGas: gasEnableInvestorToWhitelist}),
			strangerAddress,
		); // needed to deploy a test trade contract

		const gasTransferFrom = await instance.transferFrom(
			cak.test(),
			instance.deployedAt,
			strangerAddress,
			400,
		);

		await instance.transferFrom(
			cak.send({maxGas: gasTransferFrom}),
			instance.deployedAt,
			strangerAddress,
			400,
		);

		const strangerBalance = await instance.balanceOf(
			cak.call(),
			strangerAddress,
		);
		expect(strangerBalance).to.equal("1000"); // TODO check if 400 or 1000 ?1
	});

	it("balanceOfCoupon returns account balance when no couponDate set", async () => {
		//TODO: maybe reveiw this logic (cycle setCurrentCouponDate + autoSnapshot + balanceOfCoupon ) ? shouldn't balanceOfCoupon revert when no coupon date set ?
		const cDate = Math.floor(new Date().getTime() / 1000);
		const couponBalance = await instance.balanceOfCoupon(
			cak.call(),
			instance.deployedAt,
			cDate,
		);
		expect(couponBalance).to.equal("1000");
	});

	it("setCurrentCouponDate can only be called by whitelisted smart contract", async () => {
		const cDate = Math.floor(new Date().getTime() / 1000);
		await expect(
			instance.setCurrentCouponDate(
				cak.send(gas(100000)),
				cDate,
				cDate - 24 * 3600 + 17 * 3600,
			),
		).to.be.rejectedWith("This contract is not whitelisted");
	});
});
