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
import {blockGasLimit, registerGas} from "./gas.constant"
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
	"DelegateInvestorManagement",
];

describe("Register delegate investor management", function () {
	this.timeout(10000);
	let web3: Web3;
	let cak: EthProviderInterface;
	let custodian: EthProviderInterface;
	let custodian2: EthProviderInterface;
	let delegate: EthProviderInterface;

	let instance: SmartContractInstance;
	let delegateInstance: SmartContractInstance;
	let Register: SmartContract;
	let investorAddress: string;
	let custodianAddress: string;
	let custodian2Address: string;
	let delegateAddress: string;

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
		custodian = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[1]),
		);
		custodian2 = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[2]),
		);
		delegate = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[3]),
		);
		// TODO investor address from investor account?
		investorAddress = await cak.account(1);
		custodianAddress = await custodian.account();
		custodian2Address = await custodian2.account();
		delegateAddress = await delegate.account();

		const dates = makeBondDate(2, 12 * 30 * 24 * 3600);
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
		const IDelegateInvestorManagement: SmartContract = allContracts.get("IDelegateInvestorManagement");
		delegateInstance = IDelegateInvestorManagement.at(instance.deployedAt);

		await instance.grantCstRole(
			cak.send({maxGas: 100000}),
			custodianAddress,
		);
		await instance.grantCstRole(
			cak.send({maxGas: 100000}),
			custodian2Address,
		);
	}

	describe("delegate investor management", function () {
		before(async () => {
			await deployRegisterContract();
			//NOTE: only one contract is deployed within this describe() scope
		});

		it("setCustodianDelegate should fail if caller is not a custodian", async () => {
			await expect(
				delegateInstance.setCustodianDelegate(
					cak.send({maxGas: 130000}),
					delegateAddress,
				)
			).to.be.rejectedWith(
				/Caller must be CST/,
			);
		});

		it("setCustodianDelegate should succeed if caller is a custodian", async () => {
			expect(
				await delegateInstance.getCustodianDelegate(
					cak.call(),
					custodianAddress,
				)
			).to.equal(ZERO_ADDRESS);
			expect(
				await delegateInstance.isCustodianDelegate(
					cak.call(),
					custodianAddress,
					delegateAddress,
				)
			).to.be.false;

			await delegateInstance.setCustodianDelegate(
				custodian.send({maxGas: 130000}),
				delegateAddress,
			);

			expect(
				await delegateInstance.getCustodianDelegate(
					cak.call(),
					custodianAddress,
				)
			).to.equal(delegateAddress);
			expect(
				await delegateInstance.isCustodianDelegate(
					cak.call(),
					custodianAddress,
					delegateAddress,
				)
			).to.be.true;
		});

		it("setCustodianDelegate should change delegate only for the target custodian", async () => {
			expect(
				await delegateInstance.isCustodianDelegate(
					cak.call(),
					custodianAddress,
					delegateAddress,
				)
			).to.be.true;
			expect(
				await delegateInstance.isCustodianDelegate(
					cak.call(),
					custodian2Address,
					delegateAddress,
				)
			).to.be.false;
		});

		it("delegateEnableInvestorToWhitelist should fail if investor address is 0x0", async () => {
			await expect(
				delegateInstance.delegateEnableInvestorToWhitelist(
					delegate.send({maxGas: 130000}),
					ZERO_ADDRESS,
					custodianAddress,
				)
			).to.be.rejectedWith(
				/investor address cannot be zero/,
			);
		});

		it("delegateEnableInvestorToWhitelist should fail if caller is not a delegate", async () => {
			await expect(
				delegateInstance.delegateEnableInvestorToWhitelist(
					cak.send({maxGas: 130000}),
					investorAddress,
					custodianAddress,
				)
			).to.be.rejectedWith(
				/Caller must be a custodian delegate/,
			);
		});

		it("delegateEnableInvestorToWhitelist should succeed if caller is a delegate", async () => {
			expect(
				await instance.investorsAllowed(
					cak.call(),
					investorAddress,
				)
			).to.be.false;

			await delegateInstance.delegateEnableInvestorToWhitelist(
				delegate.send({maxGas: 130000}),
				investorAddress,
				custodianAddress,
			);

			expect(
				await instance.investorsAllowed(
					cak.call(),
					investorAddress,
				)
			).to.be.true;
		});

		it("delegateDisableInvestorFromWhitelist should fail if investor address is 0x0", async () => {
			await expect(
				delegateInstance.delegateDisableInvestorFromWhitelist(
					delegate.send({maxGas: 130000}),
					ZERO_ADDRESS,
					custodianAddress,
				)
			).to.be.rejectedWith(
				/investor address cannot be zero/,
			);
		});

		it("delegateDisableInvestorFromWhitelist should fail if caller is not a delegate", async () => {
			await expect(
				delegateInstance.delegateDisableInvestorFromWhitelist(
					cak.send({maxGas: 130000}),
					investorAddress,
					custodianAddress,
				)
			).to.be.rejectedWith(
				/Caller must be a custodian delegate/,
			);
		});

		it("delegateDisableInvestorFromWhitelist should fail if delegator is not the owner of the investor", async () => {
			await delegateInstance.setCustodianDelegate(
				custodian2.send({maxGas: 130000}),
				delegateAddress,
			);
			await expect(
				delegateInstance.delegateDisableInvestorFromWhitelist(
					delegate.send({maxGas: 130000}),
					investorAddress,
					custodian2Address,
				)
			).to.be.rejectedWith(
				/only the custodian can disallow the investor/,
			);
		});

		it("delegateDisableInvestorFromWhitelist should succeed if caller is a delegate", async () => {
			expect(
				await instance.investorsAllowed(
					cak.call(),
					investorAddress,
				)
			).to.be.true;

			await delegateInstance.delegateDisableInvestorFromWhitelist(
				delegate.send({maxGas: 130000}),
				investorAddress,
				custodianAddress,
			);

			expect(
				await instance.investorsAllowed(
					cak.call(),
					investorAddress,
				)
			).to.be.false;
		});

		it("unsetCustodianDelegate should fail if caller is not a custodian", async () => {
			await expect(
				delegateInstance.unsetCustodianDelegate(
					cak.send({maxGas: 130000}),
				)
			).to.be.rejectedWith(
				/Caller must be CST/,
			);
		});

		it("unsetCustodianDelegate should not impact other custodians", async () => {
			await delegateInstance.unsetCustodianDelegate(
				custodian2.send({maxGas: 130000}),
			);

			expect(
				await delegateInstance.isCustodianDelegate(
					cak.call(),
					custodianAddress,
					delegateAddress,
				)
			).to.be.true;
		});

		it("unsetCustodianDelegate should succeed if caller is a custodian", async () => {
			await delegateInstance.unsetCustodianDelegate(
				custodian.send({maxGas: 130000}),
			);

			expect(
				await delegateInstance.getCustodianDelegate(
					cak.call(),
					custodianAddress,
				)
			).to.equal(ZERO_ADDRESS);
			expect(
				await delegateInstance.isCustodianDelegate(
					cak.call(),
					custodianAddress,
					delegateAddress,
				)
			).to.be.false;
		});
	});
});
