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
import {blockGasLimit, makeReadyGas, registerGas} from "./gas.constant";
import {addPart, initWeb3Time, makeBondDate, mineBlock, today} from "./dates";
import {
	BilateralTradeContractName,
	CouponTradeContractName,
	PrimaryIssuanceContractName,
	bilateralTrade,
} from "./shared";

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

describe("Coupon process - payment", function () {
	this.timeout(10000);
	let web3: Web3;
	let cak: EthProviderInterface;
	let bnd: EthProviderInterface;
	let payingAgent: EthProviderInterface;
	let custodianA: EthProviderInterface;
	let investorA: EthProviderInterface;
	let investorB: EthProviderInterface;
	let registerContract: SmartContract;
	let register: SmartContractInstance;
	let investorAAddress: string;
	let instance: SmartContractInstance;

	async function init(): Promise<void> {
		web3 = new Web3(
			Ganache.provider({
				default_balance_ether: 1000,
				gasLimit: blockGasLimit,
				chain: {vmErrorsOnRPCResponse: true},
			}) as any,
		);
		initWeb3Time(web3);
		cak = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[0]),
		);
		bnd = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[1]),
		);
		payingAgent = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[1]),
		);

		custodianA = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[2]),
		);
		investorA = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[4]),
		);
		investorB = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[5]),
		);

		investorAAddress = await investorA.account();
		const dates = makeBondDate(3, 30 * 24 * 3600);
		const bondName = "EIB 3Y 1Bn SEK";
		const isin = "EIB3Y";
		const expectedSupply = 5000;
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
		registerContract = allContracts.get(RegisterContractName);

		instance = await registerContract.deploy(
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

		register = IRegister.at(instance.deployedAt);

		//Grant all roles and whitelist addresses
		await register.grantBndRole(
			cak.send({maxGas: 100000}),
			await cak.account(),
		); // needed to create a dummy primary issuance smart contract

		await register.grantBndRole(
			cak.send({maxGas: 100000}),
			await bnd.account(),
		);

		await register.grantCstRole(
			cak.send({maxGas: 100000}),
			await custodianA.account(),
		);

		await register.grantPayRole(
			cak.send({maxGas: 100000}),
			await payingAgent.account(),
		);

		const gasEnableInvestorToWhitelistCak =
			await register.enableInvestorToWhitelist(
				custodianA.test(),
				await cak.account(),
			);

		await register.enableInvestorToWhitelist(
			custodianA.send({maxGas: gasEnableInvestorToWhitelistCak}),
			await cak.account(),
		); // needed to deploy a test trade contract

		const gasEnableInvestorToWhitelistBnd =
			await register.enableInvestorToWhitelist(
				custodianA.test(),
				await bnd.account(),
			);

		await register.enableInvestorToWhitelist(
			custodianA.send({maxGas: gasEnableInvestorToWhitelistBnd}),
			await bnd.account(),
		); // B&D must be an investor as well

		const gasEnableInvestorToWhitelistA =
			await register.enableInvestorToWhitelist(
				custodianA.test(),
				await investorA.account(),
			);

		await register.enableInvestorToWhitelist(
			custodianA.send({maxGas: gasEnableInvestorToWhitelistA}),
			await investorA.account(),
		);

		const gasEnableInvestorToWhitelistB =
			await register.enableInvestorToWhitelist(
				custodianA.test(),
				await investorB.account(),
			);

		await register.enableInvestorToWhitelist(
			custodianA.send({maxGas: gasEnableInvestorToWhitelistB}),
			await investorB.account(),
		);

		console.log("Enabled all inverstors to whitelist");

		//initialization of the register  post issuance

		const primary = await allContracts
			.get(PrimaryIssuanceContractName)
			.deploy(bnd.newi({maxGas: 2000000}), register.deployedAt, 5000);

		console.log("Primary issuance contract deployed");

		await register.balanceOf(bnd.call(), await bnd.account());

		//whitelist primary issuance contract
		let hash1 = await register.atReturningHash(cak.call(), primary.deployedAt);

		const gasEnablePrimaryToWhitelist =
			await register.enableContractToWhitelist(cak.test(), hash1);

		await register.enableContractToWhitelist(
			cak.send({maxGas: gasEnablePrimaryToWhitelist}),
			hash1,
		);

		console.log("Step 1");

		//deploy bilateral trade
		const trade = await allContracts
			.get(BilateralTradeContractName)
			.deploy(
				bnd.newi({maxGas: 1000000}),
				register.deployedAt,
				await investorA.account(),
			);

		console.log("Bilateral trade contract deployed");

		//whitelist biletaral trade
		let hash2 = await register.atReturningHash(cak.call(), trade.deployedAt);

		const enableTradeToWhitelistGas = await register.enableContractToWhitelist(
			cak.test(),
			hash2,
		);

		await register.enableContractToWhitelist(
			cak.send({maxGas: enableTradeToWhitelistGas}),
			hash2,
		);

		console.log("Step 2");

		const gasSetExpectedSupply = await register.setExpectedSupply(
			cak.test(),
			1000,
		);
		await register.setExpectedSupply(
			cak.send({maxGas: gasSetExpectedSupply}),
			1000,
		);

		console.log("Step 3");

		const gasMakeReady = await register.makeReady(cak.test());
		await register.makeReady(cak.send({maxGas: gasMakeReady}));

		const validateGas = await primary.validate(bnd.test());
		await primary.validate(bnd.send({maxGas: validateGas}));

		let details = await trade.details(bnd.call());
		details.quantity = 155;
		details.tradeDate = today(); // Date.UTC(2022, 9, 10) / (1000 * 3600 * 24);
		details.valueDate = addPart(details.tradeDate, "D", 2); // Date.UTC(2022, 9, 12) / (1000 * 3600 * 24);

		const setDetailsGas = await trade.setDetails(bnd.test(), details);

		await trade.setDetails(bnd.send({maxGas: setDetailsGas}), details);

		const detailSet = await trade.details(bnd.call());

		const bndApproveGas = await trade.approve(bnd.test());

		await trade.approve(bnd.send({maxGas: bndApproveGas}));

		const inverstorApprove = await trade.approve(investorA.test());

		await trade.approve(investorA.send(inverstorApprove));

		const tradeGas = await trade.executeTransfer(bnd.test());

		await trade.executeTransfer(bnd.send({maxGas: tradeGas}));

		console.log("Step 4");
	}

	async function bilatTrade(
		from: EthProviderInterface,
		to: EthProviderInterface,
		qty: number,
		date: number,
		stage: "draft" | "pending" | "accepted" | "executed" = "executed",
	): Promise<SmartContractInstance | undefined> {
		return await bilateralTrade(register, from, to, qty, date, stage);
	}

	async function deployCoupon(): Promise<SmartContractInstance> {
		const couponDate = addPart(today(), "D", 30);
		const recordDate = addPart(couponDate, "D", -1);

		const coupon = await allContracts
			.get(CouponTradeContractName)
			.deploy(
				payingAgent.newi({maxGas: 2000000}),
				register.deployedAt,
				couponDate,
				360,
				recordDate,
				17 * 3600,
			);

		let hash = await register.atReturningHash(cak.call(), coupon.deployedAt);
		await register.enableContractToWhitelist(cak.send({maxGas: 100000}), hash);
		return coupon;
	}

	beforeEach(async () => {
		await init();
	});

	it("investor payment status is not paid after coupon deploy", async () => {
		const coupon = await deployCoupon();

		const gasSetDateAsCurrentCoupon = await coupon.setDateAsCurrentCoupon(
			payingAgent.test(),
		);

		await coupon.setDateAsCurrentCoupon(
			payingAgent.send({maxGas: gasSetDateAsCurrentCoupon}),
		);

		const paymentStatusBefore = await coupon.getInvestorPayments(
			payingAgent.call(),
			investorAAddress,
		);

		expect(paymentStatusBefore).to.equal(
			"0",
			"coupon payment status ToBePaid expected after coupon deploy",
		);

		const timestamp = await register.currentSnapshotDatetime(
			payingAgent.call(),
		);

		await mineBlock(Number.parseInt(timestamp) + 1);

		//Act
		await coupon.toggleCouponPayment(
			cak.send({maxGas: 300000}),
			investorAAddress,
		);

		const paymentStatusAfter = await coupon.getInvestorPayments(
			payingAgent.call(),
			investorAAddress,
		);

		expect(paymentStatusAfter).to.equal(
			"1",
			"coupon payment status Paid expected after setPaymentAsPaid",
		);
	});

	it("Central Account Keeper may reset payment status if status is paid", async () => {
		//Arrange
		const coupon = await deployCoupon();

		const gasSetDateAsCurrentCoupon = await coupon.setDateAsCurrentCoupon(
			payingAgent.test(),
		);

		await coupon.setDateAsCurrentCoupon(
			payingAgent.send({maxGas: gasSetDateAsCurrentCoupon}),
		);
		const timestamp = await register.currentSnapshotDatetime(
			payingAgent.call(),
		);
		await mineBlock(Number.parseInt(timestamp) + 1);

		await coupon.toggleCouponPayment(
			cak.send({maxGas: 300000}),
			investorAAddress,
		);
		const paymentStatusBefore = await coupon.getInvestorPayments(
			payingAgent.call(),
			investorAAddress,
		);
		expect(paymentStatusBefore).to.equal(
			"1",
			"test precondition failed, Paid payment status expected",
		);

		//Act
		await coupon.toggleCouponPayment(
			cak.send({maxGas: 300000}),
			investorAAddress,
		);
		const paymentStatusAfter = await coupon.getInvestorPayments(
			payingAgent.call(),
			investorAAddress,
		);

		//Assert
		expect(paymentStatusAfter).to.equal(
			"0",
			"coupon payment status ToBePaid expected after reset",
		);
	});

	it("Cusdotian may mark payment as received", async () => {
		//Arrange
		const coupon = await deployCoupon();

		const gasSetDateAsCurrentCoupon = await coupon.setDateAsCurrentCoupon(
			payingAgent.test(),
		);
		await coupon.setDateAsCurrentCoupon(
			payingAgent.send({maxGas: gasSetDateAsCurrentCoupon}),
		);
		const timestamp = await register.currentSnapshotDatetime(
			payingAgent.call(),
		);
		await mineBlock(Number.parseInt(timestamp) + 1);

		await coupon.toggleCouponPayment(
			cak.send({maxGas: 300000}),
			investorAAddress,
		);
		const paymentStatusBefore = await coupon.getInvestorPayments(
			payingAgent.call(),
			investorAAddress,
		);
		expect(paymentStatusBefore).to.equal(
			"1",
			"test precondition failed, Paid payment status expected",
		);

		//Act
		await coupon.toggleCouponPayment(
			custodianA.send({maxGas: 300000}),
			investorAAddress,
		);
		const paymentStatusAfter = await coupon.getInvestorPayments(
			payingAgent.call(),
			investorAAddress,
		);

		//Assert
		expect(paymentStatusAfter).to.equal(
			"2",
			"coupon payment status PaymentReceived expected",
		);
	});

	it("Custodian may not setPaymentAsPaid if status is tobePaid", async () => {
		const coupon = await deployCoupon();

		const gasSetDateAsCurrentCoupon = await coupon.setDateAsCurrentCoupon(
			payingAgent.test(),
		);
		await coupon.setDateAsCurrentCoupon(
			payingAgent.send({maxGas: gasSetDateAsCurrentCoupon}),
		);
		const timestamp = await register.currentSnapshotDatetime(
			payingAgent.call(),
		);
		await mineBlock(Number.parseInt(timestamp) + 1);

		await expect(
			coupon.toggleCouponPayment(
				custodianA.send({maxGas: 300000}),
				investorAAddress,
			),
		).to.be.rejectedWith("Invalid Coupon payment status");
	});

	it("stranger may not setPaymentAsPaid", async () => {
		const coupon = await deployCoupon();

		const gasSetDateAsCurrentCoupon = await coupon.setDateAsCurrentCoupon(
			payingAgent.test(),
		);

		await coupon.setDateAsCurrentCoupon(
			payingAgent.send({maxGas: gasSetDateAsCurrentCoupon}),
		);
		const timestamp = await register.currentSnapshotDatetime(
			payingAgent.call(),
		);
		await mineBlock(Number.parseInt(timestamp) + 1);

		await expect(
			coupon.toggleCouponPayment(
				investorA.send({maxGas: 300000}),
				investorAAddress,
			),
		).to.be.rejectedWith("sender must be Central Account Keeper or Custodian");
	});

	it("Central account Keeper can set the payment status event after the register has moved on to the next period", async () => {
		const coupon = await deployCoupon();

		const gasSetDateAsCurrentCoupon = await coupon.setDateAsCurrentCoupon(
			payingAgent.test(),
		);
		await coupon.setDateAsCurrentCoupon(
			payingAgent.send({maxGas: gasSetDateAsCurrentCoupon}),
		);
		const paymentStatusBefore = await coupon.getInvestorPayments(
			payingAgent.call(),
			investorAAddress,
		);
		expect(paymentStatusBefore).to.equal(
			"0",
			"coupon payment status ToBePaid expected after coupon deploy",
		);
		const timestamp = await register.currentSnapshotDatetime(
			payingAgent.call(),
		);
		await mineBlock(Number.parseInt(timestamp) + 1);

		// Force the register to move to the next period by making a transfer
		await bilatTrade(investorA, investorB, 10, today());

		//Act
		await coupon.toggleCouponPayment(
			cak.send({maxGas: 300000}),
			investorAAddress,
		);
		const paymentStatusAfter = await coupon.getInvestorPayments(
			payingAgent.call(),
			investorAAddress,
		);

		expect(paymentStatusAfter).to.equal(
			"1",
			"coupon payment status Paid expected after setPaymentAsPaid",
		);
	});

	//TODO:  test coupon.makePaymentReceived only for custodial
	//TODO:  test coupon.setPaymentAsPaid denied
});
