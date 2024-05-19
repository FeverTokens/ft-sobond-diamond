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
import {blockGasLimit, registerGas} from "./gas.constant";
import {
	addPart,
	blockTimestamp,
	initWeb3Time,
	makeBondDate,
	makeDateTime,
	mineBlock,
	today,
} from "./dates";
import {closeEvents, collectEvents, getEvents} from "./events";
import {bilateralTrade} from "./shared";

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
const BilateralTradeContractName = "BilateralTrade";
const CouponTradeContractName = "Coupon";
const RedemptionTradeContractName = "Redemption";

//const {time} = require('@openzeppelin/test-helpers');

describe("Run tests of the Redemption contract", function () {
	this.timeout(10000);
	let web3: Web3;
	let cak: EthProviderInterface;
	let bnd: EthProviderInterface;
	let payer: EthProviderInterface;
	let custodianA: EthProviderInterface;
	let custodianB: EthProviderInterface;
	let investorA: EthProviderInterface;
	let investorB: EthProviderInterface;
	let investorC: EthProviderInterface;
	let investorD: EthProviderInterface;
	let registerContract: SmartContract;
	let register: SmartContractInstance;
	let addressOfPIA: string;
	let wrongAccount: EthProviderInterface;
	const maxGasAmount = 2000000;
	let firstCouponDate: number;
	let maturityDate: number;
	let futurTimestamp: number;
	let expectedSupply: number;
	let instance: SmartContractInstance;

	async function init(): Promise<void> {
		web3 = new Web3(
			Ganache.provider({
				default_balance_ether: 1000,
				gasLimit: blockGasLimit,
				chain: {vmErrorsOnRPCResponse: true},
				logging: {quiet: true},
			}) as any,
		);
		initWeb3Time(web3);
		cak = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[0]),
		);
		bnd = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[1]),
		);
		payer = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[1]),
		);

		custodianA = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[2]),
		);
		custodianB = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[3]),
		);
		investorA = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[4]),
		);
		investorB = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[5]),
		);
		investorC = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[6]),
		);
		investorD = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[7]),
		);
		wrongAccount = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[8]),
		);

		const dates = makeBondDate(1, 2 * 24 * 3600);
		firstCouponDate = dates.couponDates[0];
		maturityDate = dates.maturityDate;
		expectedSupply = 5000;
		//console.log("coupon 1 : " + firstCouponDate);

		const bondName = "EIB 3Y 1Bn SEK";
		const isin = "EIB3Y";
		const currency = web3.utils.asciiToHex("SEK");
		const unitVal = 100000;
		const couponRate = web3.utils.asciiToHex("0.4");
		const creationDate = dates.creationDate;
		const issuanceDate = dates.issuanceDate;
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

		await collectEvents(cak, register);

		// console.log("Register deployed at : " + register.deployedAt);

		//Grant all roles and whitelist addresses
		// await register.grantBndRole(cak.send({maxGas:100000}), await cak.account()); // needed to create a dummy primary issuance smart contract
		await register.grantBndRole(
			cak.send({maxGas: 100000}),
			await bnd.account(),
		);

		// console.log("Granting roles");

		await register.grantCstRole(
			cak.send({maxGas: 100000}),
			await custodianA.account(),
		);

		await register.grantCstRole(
			cak.send({maxGas: 100000}),
			await custodianB.account(),
		);

		await register.grantPayRole(
			cak.send({maxGas: 100000}),
			await payer.account(),
		);

		// console.log("Whitelisting addresses");

		// await register.enableInvestorToWhitelist(custodianA.send({maxGas:120000}), await cak.account()); // needed to deploy a test trade contract
		// await register.enableInvestorToWhitelist(custodianA.send({maxGas:120000}), await bnd.account()); // B&D must be an investor as well
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
				custodianB.test(),
				await investorB.account(),
			);

		await register.enableInvestorToWhitelist(
			custodianA.send({maxGas: gasEnableInvestorToWhitelistB}),
			await investorB.account(),
		);

		const gasEnableInvestorToWhitelistC =
			await register.enableInvestorToWhitelist(
				custodianA.test(),
				await investorC.account(),
			);

		await register.enableInvestorToWhitelist(
			custodianA.send({maxGas: gasEnableInvestorToWhitelistC}),
			await investorC.account(),
		);

		const gasEnableInvestorToWhitelistD =
			await register.enableInvestorToWhitelist(
				custodianA.test(),
				await investorD.account(),
			);

		await register.enableInvestorToWhitelist(
			custodianA.send({maxGas: gasEnableInvestorToWhitelistD}),
			await investorD.account(),
		);

		// await register.setExpectedSupply(cak.send({maxGas:100000}),1000); // TODO : check if this is needed

		const makeReadyGas = await register.makeReady(cak.test());

		await register.makeReady(cak.send({maxGas: makeReadyGas}));

		// console.log("Register is ready");

		//initialization of he register  post issuance
		const primary = await allContracts
			.get(PrimaryIssuanceContractName)
			.deploy(bnd.newi({maxGas: 1000000}), register.deployedAt, 100);

		const bndBalance = await register.balanceOf(
			bnd.call(),
			await bnd.account(),
		);

		// console.log("BnD balance : " + bndBalance);

		//whitelist primary issuance contract
		let hash1 = await register.atReturningHash(cak.call(), primary.deployedAt);

		const gasEnablePrimaryToWhitelist =
			await register.enableContractToWhitelist(cak.test(), hash1);

		await register.enableContractToWhitelist(
			cak.send({maxGas: gasEnablePrimaryToWhitelist}),
			hash1,
		);

		const validateGas = await primary.validate(bnd.test());

		await primary.validate(bnd.send({maxGas: validateGas}));

		//deploy bilateral trade
		const trade = await allContracts
			.get(BilateralTradeContractName)
			.deploy(
				bnd.newi({maxGas: 1000000}),
				register.deployedAt,
				await investorA.account(),
			);

		// console.log("trade deployed at : " + trade.deployedAt);

		let hash2 = await register.atReturningHash(cak.call(), trade.deployedAt);

		const enableTradeToWhitelistGas = await register.enableContractToWhitelist(
			cak.test(),
			hash2,
		);

		await register.enableContractToWhitelist(
			cak.send({maxGas: enableTradeToWhitelistGas}),
			hash2,
		);

		let details = await trade.details(bnd.call());

		details.quantity = 155;
		details.tradeDate = addPart(dates.issuanceDate, "D", 1); //Date.UTC(2022, 9, 10) / (1000*3600*24);
		details.valueDate = addPart(dates.issuanceDate, "D", 2); // Date.UTC(2022, 9, 12) / (1000*3600*24);
		details.price = 101 * 10_000;

		const setDetailsGas = await trade.setDetails(bnd.test(), details);

		await trade.setDetails(bnd.send({maxGas: setDetailsGas}), details);

		const bndApproveGas = await trade.approve(bnd.test());

		await trade.approve(bnd.send({maxGas: bndApproveGas}));

		const inverstorApprove = await trade.approve(investorA.test());

		await trade.approve(investorA.send(inverstorApprove));

		const tradeGas = await trade.executeTransfer(bnd.test());

		await trade.executeTransfer(bnd.send({maxGas: tradeGas}));
	}

	describe("Redemption proces", function () {
		beforeEach(async () => {
			await init();
		});

		afterEach(() => {
			closeEvents();
		});

		it("should have a valid initialization", async () => {
			expect(
				getEvents(register).has("RegisterStatusChanged", {status: "2"}),
			).equal(1);
		});

		it("should fail to deploy the redemption when maturity date is not known by the register", async () => {
			const isPay = await register.isPay(payer.call(), await payer.account());
			expect(isPay).to.be.true;

			const p = allContracts
				.get(RedemptionTradeContractName)
				.deploy(
					payer.newi({maxGas: 2000000}),
					register.deployedAt,
					firstCouponDate,
					360,
					addPart(firstCouponDate, "D", -1),
					1500,
				);
			await expect(p).to.be.rejectedWith("this maturity Date does not exists");
		});

		it("should deploy the redemption and get maturity amount for investor", async () => {
			const isPay = await register.isPay(payer.call(), await payer.account());

			expect(isPay).to.be.true;

			const redemption = await allContracts
				.get(RedemptionTradeContractName)
				.deploy(
					payer.newi({maxGas: 2000000}),
					register.deployedAt,
					maturityDate,
					360,
					addPart(maturityDate, "D", -1),
					1500,
				);

			let bal = await register.balanceOfCoupon(
				payer.call(),
				await investorA.account(),
				maturityDate,
			);

			let unitValue = await register.getBondUnitValue(cak.call());

			let maturityAmount = unitValue * bal;

			const actual = (await redemption.getMaturityAmountForInvestor(
				payer.call(),
				await investorA.account(),
			)) as string;
			expect(actual).to.equal(maturityAmount.toString());
		});

		it("should try to toggle Redemption Payment but revert as the investor is not allowed", async () => {
			const redemption = await allContracts
				.get(RedemptionTradeContractName)
				.deploy(
					payer.newi({maxGas: 2000000}),
					register.deployedAt,
					maturityDate,
					360,
					addPart(maturityDate, "D", -1),
					1500,
				);

			//whitelist redemption contract into register
			let hash1 = await register.atReturningHash(
				cak.call(),
				redemption.deployedAt,
			);
			await register.enableContractToWhitelist(
				cak.send({maxGas: 120000}),
				hash1,
			);

			await redemption.setDateAsCurrentCoupon(payer.send({maxGas: 300000}));

			await expect(
				redemption.toggleRedemptionPayment(
					payer.send({maxGas: 300000}),
					await wrongAccount.account(),
				),
			).to.be.rejectedWith("This investor is not allowed");
		});

		it("should try to toggle Redemption Payment but revert as the maturity cut off time has not passed", async () => {
			const redemption = await allContracts
				.get(RedemptionTradeContractName)
				.deploy(
					payer.newi({maxGas: 2000000}),
					register.deployedAt,
					maturityDate,
					360,
					addPart(maturityDate, "D", -1),
					1500,
				);

			await collectEvents(payer, redemption);
			//whitelist redemption contract into register
			let hash1 = await register.atReturningHash(
				cak.call(),
				redemption.deployedAt,
			);

			await register.enableContractToWhitelist(
				cak.send({maxGas: 120000}),
				hash1,
			);

			await redemption.setDateAsCurrentCoupon(payer.send({maxGas: 300000}));

			getEvents(redemption).print();
			const p = redemption.toggleRedemptionPayment(
				cak.send({maxGas: 300000}),
				await investorA.account(),
			);
			await expect(p).to.be.rejectedWith(
				"the maturity cut of time has not passed",
			);

			//await register.enableContractToWhitelist(cak.send({maxGas:100000}), hash);
		});

		it("should try to toggle Redemption Payment after coupon process", async () => {
			const isPay = await register.isPay(payer.call(), await payer.account());
			expect(isPay).to.be.true;

			let couponDate = firstCouponDate;
			//console.log("coupon 1 : " + couponDate);

			let nbDaysInPeriod = 180;
			let cutOffTimeInSec = 16 * 3600;

			//Given a first coupon is deployed
			const coupon = await allContracts
				.get(CouponTradeContractName)
				.deploy(
					payer.newi({maxGas: 2000000}),
					register.deployedAt,
					couponDate,
					nbDaysInPeriod,
					addPart(couponDate, "D", -1),
					cutOffTimeInSec,
				);

			let hash = await register.atReturningHash(cak.call(), coupon.deployedAt);
			await register.enableContractToWhitelist(
				cak.send({maxGas: 100000}),
				hash,
			);

			await coupon.setDateAsCurrentCoupon(payer.send({maxGas: 300000})); //implicit coupon validation

			await mineBlock(couponDate + cutOffTimeInSec + 1000); // pass the cut of time

			// triggers the previous snapshot and sets investorB balance to 100
			// in init, investorA balance was set to 155
			await register.transferFrom(
				cak.send({maxGas: 400000}),
				await bnd.account(),
				await investorB.account(),
				100,
			);
			expect(getEvents(register).has("Snapshot", {id: "1"})).equal(1);

			const redemption = await allContracts
				.get(RedemptionTradeContractName)
				.deploy(
					payer.newi({maxGas: 2000000}),
					register.deployedAt,
					maturityDate,
					nbDaysInPeriod,
					addPart(maturityDate, "D", -1),
					cutOffTimeInSec,
				);

			let redemptionPaymentStatus =
				await redemption.getInvestorRedemptionPayments(
					payer.call(),
					await investorA.account(),
				);

			//console.log(redemptionPaymentStatus);

			//whitelist redemption contract into register
			let hash1 = await register.atReturningHash(
				cak.call(),
				redemption.deployedAt,
			);
			await register.enableContractToWhitelist(
				cak.send({maxGas: 120000}),
				hash1,
			);

			await redemption.setDateAsCurrentCoupon(payer.send({maxGas: 300000}));
			await register.transferFrom(
				cak.send({maxGas: 400000}),
				await bnd.account(),
				await investorC.account(),
				100,
			);

			await mineBlock(addPart(maturityDate, "D", -1) + cutOffTimeInSec + 1000);

			await redemption.toggleRedemptionPayment(
				cak.send({maxGas: 500000}),
				await investorA.account(),
			);
			await redemption.toggleRedemptionPayment(
				cak.send({maxGas: 500000}),
				await investorB.account(),
			);

			const p = register.transferFrom(
				cak.send({maxGas: 400000}),
				await bnd.account(),
				await investorD.account(),
				666,
			);
			await expect(p).to.be.rejectedWith(/the maturity is reached/);

			getEvents(register).print();

			// try placing a new maturity contract
			const redemption2 = await allContracts
				.get(RedemptionTradeContractName)
				.deploy(
					payer.newi({maxGas: 2000000}),
					register.deployedAt,
					maturityDate,
					nbDaysInPeriod,
					addPart(maturityDate, "D", -1),
					cutOffTimeInSec,
				);

			await expect(
				redemption2.setDateAsCurrentCoupon(payer.send({maxGas: 300000})),
			).to.be.rejectedWith("Date of coupon or maturity already taken");
		});

		it("should try to close the register and burn the total balance", async () => {
			let couponDate = firstCouponDate;
			let recordDate = addPart(couponDate, "D", -1);
			//console.log("coupon 1 : " + couponDate);

			let nbDaysInPeriod = 180;
			let cutOffTimeInSec = 16 * 3600;

			// Nedd all balances to be in an investor, not in the BnD
			const bndBalance = await register.balanceOf(
				cak.call(),
				await bnd.account(),
			);

			console.log("BnD balance before trade: ", bndBalance);

			const buyerBalance = await register.balanceOf(
				cak.call(),
				await investorD.account(),
			);

			console.log("Buyer balance before trade: ", buyerBalance);

			console.log("### Deploying Trade ###");
			// await register.transferFrom(cak.send({maxGas: 500000}), await bnd.account(), await investorD.account(), bndBalance);
			const trade = await bilateralTrade(
				register,
				bnd,
				investorD,
				bndBalance,
				today(),
			);

			console.log("Trade deployed at: " + trade?.deployedAt);

			console.log("### Trade deployement Finished ###");

			const bndBalanceAfter = await register.balanceOf(
				cak.call(),
				await bnd.account(),
			);

			console.log("BnD balance after trade: ", bndBalanceAfter);

			const buyerBalanceAfter = await register.balanceOf(
				cak.call(),
				await investorD.account(),
			);

			console.log("Buyer balance after trade: ", buyerBalanceAfter);

			//Given a first coupon is deployed
			const coupon = await allContracts
				.get(CouponTradeContractName)
				.deploy(
					payer.newi({maxGas: 2000000}),
					register.deployedAt,
					couponDate,
					nbDaysInPeriod,
					recordDate,
					cutOffTimeInSec,
				);

			let hash = await register.atReturningHash(cak.call(), coupon.deployedAt);

			await register.enableContractToWhitelist(
				cak.send({maxGas: 100000}),
				hash,
			);

			await coupon.setDateAsCurrentCoupon(payer.send({maxGas: 300000})); //implicit coupon validation

			await mineBlock(recordDate + cutOffTimeInSec + 1000); // pass the cut of time

			recordDate = addPart(maturityDate, "D", -1);

			const redemption = await allContracts
				.get(RedemptionTradeContractName)
				.deploy(
					payer.newi({maxGas: 2000000}),
					register.deployedAt,
					maturityDate,
					nbDaysInPeriod,
					recordDate,
					cutOffTimeInSec,
				);

			//whitelist redemption contract into register
			let hash1 = await register.atReturningHash(
				cak.call(),
				redemption.deployedAt,
			);

			await register.enableContractToWhitelist(
				cak.send({maxGas: 120000}),
				hash1,
			);

			await redemption.setDateAsCurrentCoupon(payer.send({maxGas: 300000}));

			// make a transfer between investors
			await bilateralTrade(register, investorD, investorB, 20, today());

			await mineBlock(recordDate + cutOffTimeInSec + 1000);

			const investorsAtMaturity: string[] =
				await register.getInvestorListAtCoupon(payer.call(), maturityDate);

			console.log(
				"List of investors at coupon",
				couponDate,
				investorsAtMaturity,
			);

			console.log(
				"Current snapshot date time: ",
				await register.currentSnapshotDatetime(cak.call()),
			);

			console.log(
				"Check If Maturity Date Exists",
				await register.checkIfMaturityDateExists(cak.call(), maturityDate),
			);

			expect(investorsAtMaturity).not.include(await bnd.account());
			const balancesAtMaturity = (
				await Promise.all(
					investorsAtMaturity.map((inv) =>
						register.balanceOfCoupon(payer.call(), inv, maturityDate),
					),
				)
			).map((bal, i) => ({
				address: investorsAtMaturity[i],
				bal: Number.parseInt(bal),
			}));

			console.log("Balances at coupon", balancesAtMaturity);

			const totalBalance = balancesAtMaturity.reduce(
				(prev, current) => prev + current.bal,
				0,
			);

			expect(totalBalance).eq(expectedSupply);

			console.log(
				"Balance of primary issuance account: ",
				await register.balanceOf(cak.call(), register.deployedAt),
			);

			await redemption.toggleRedemptionPayment(
				cak.send({maxGas: 500000}),
				await investorA.account(),
			);

			console.log(
				"Balance of primary issuance account: ",
				await register.balanceOf(cak.call(), register.deployedAt),
			);

			await redemption.toggleRedemptionPayment(
				cak.send({maxGas: 500000}),
				await investorB.account(),
			);

			console.log(
				"Balance of primary issuance account: ",
				await register.balanceOf(cak.call(), register.deployedAt),
			);

			await redemption.toggleRedemptionPayment(
				cak.send({maxGas: 500000}),
				await investorD.account(),
			);

			console.log(
				"Balance of primary issuance account: ",
				await register.balanceOf(cak.call(), register.deployedAt),
			);

			const totalSupply = await register.totalSupply(cak.call());

			const primaryIssuanceBalance = await register.balanceOf(
				cak.call(),
				register.deployedAt,
			);

			expect(primaryIssuanceBalance).to.equal(totalSupply);

			console.log("Total supply : " + totalSupply);

			console.log("Closing the register");

			console.log(
				"Current snapshot date time: ",
				await register.currentSnapshotDatetime(cak.call()),
			);

			await register.burn(cak.send({maxGas: 400000}), totalSupply);

			// await register.mint(cak.send({maxGas: 400000}), 1000);

			await expect(
				register.mint(cak.send({maxGas: 400000}), 1000),
			).to.be.rejectedWith(/the Register is closed/i);

			getEvents(register).print();
		});

		it("should not manage to perform a trade after the redemption cut off time", async () => {
			let couponDate = firstCouponDate;
			let recordDate = addPart(couponDate, "D", -1);
			//console.log("coupon 1 : " + couponDate);

			let nbDaysInPeriod = 180;
			let cutOffTimeInSec = 16 * 3600;

			// Nedd all balances to be in an investor, not in the BnD
			const bndBalance = await register.balanceOf(
				cak.call(),
				await bnd.account(),
			);
			// await register.transferFrom(cak.send({maxGas: 500000}), await bnd.account(), await investorD.account(), bndBalance);
			await bilateralTrade(register, bnd, investorD, bndBalance, today());

			//Given a first coupon is deployed
			const coupon = await allContracts
				.get(CouponTradeContractName)
				.deploy(
					payer.newi({maxGas: 2000000}),
					register.deployedAt,
					couponDate,
					nbDaysInPeriod,
					recordDate,
					cutOffTimeInSec,
				);

			let hash = await register.atReturningHash(cak.call(), coupon.deployedAt);
			await register.enableContractToWhitelist(
				cak.send({maxGas: 100000}),
				hash,
			);

			await coupon.setDateAsCurrentCoupon(payer.send({maxGas: 300000})); //implicit coupon validation

			await mineBlock(recordDate + cutOffTimeInSec + 1000); // pass the cut of time

			recordDate = addPart(maturityDate, "D", -1);
			const redemption = await allContracts
				.get(RedemptionTradeContractName)
				.deploy(
					payer.newi({maxGas: 2000000}),
					register.deployedAt,
					maturityDate,
					nbDaysInPeriod,
					recordDate,
					cutOffTimeInSec,
				);

			//whitelist redemption contract into register
			let hash1 = await register.atReturningHash(
				cak.call(),
				redemption.deployedAt,
			);
			await register.enableContractToWhitelist(
				cak.send({maxGas: 120000}),
				hash1,
			);

			await redemption.setDateAsCurrentCoupon(payer.send({maxGas: 300000}));

			// make a transfer between investors
			await bilateralTrade(register, investorD, investorB, 20, today());

			await mineBlock(maturityDate + cutOffTimeInSec + 1000);

			// try making a trade after the redemption cut off time
			const p = bilateralTrade(register, investorD, investorB, 5, today());
			await expect(p).to.be.rejectedWith(
				/the maturity cut-off time has passed/,
			);

			// display register events
			getEvents(register).print();
		});
	});
});
