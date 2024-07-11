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
	"KeyringInvestorManagement",
];

describe("Register (Bond Issuance) whitelisting using Keyring", function () {
	this.timeout(10000);
	let web3: Web3;
	let cak: EthProviderInterface;
	let custodian: EthProviderInterface;
	let stranger: EthProviderInterface;
	let instance: SmartContractInstance;
	let Register: SmartContract;
	let cakAddress: string;
	let investorAddress: string;
	let custodianAddress: string;
	let keyringAdapterMock: SmartContractInstance;
    let policyId = 1; // Global policyId definition

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
		cakAddress = await cak.account(0);
		investorAddress = await cak.account(1);
		custodianAddress = await custodian.account();

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

		// Deploy KeyringAdapterMock contract
        const KeyringAdapterMock: SmartContract = allContracts.get("KeyringAdapterMock");
        keyringAdapterMock = await KeyringAdapterMock.deploy(cak.newi({ maxGas: registerGas }));

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
			if (registerPackageName === "KeyringInvestorManagement") {
				const cut: DiamondCut = await deployRegisterPackage(
					cak,
					registerPackageName,
					keyringAdapterMock.deployedAt,
					policyId.toString(),
				);
				return cut;
			} else {
				const cut: DiamondCut = await deployRegisterPackage(
					cak,
					registerPackageName,
				);
				return cut;
			}
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

		await instance.grantCstRole(
			cak.send({maxGas: 100000}),
			custodianAddress,
		);
	}

	describe("keyring whitelist investor", function () {
		before(async () => {
			await deployRegisterContract();
			//NOTE: only one contract is deployed within this describe() scope
		});

		it("investorsAllowed should return false as no investor whitelisted after contract deploy", async () => {
			const actual = await instance.investorsAllowed(
				cak.call(),
				investorAddress,
			);
			expect(actual).to.equal(false);
		});

		it("TO BE CHECKED CAK should be able to whitelist investors ?", async () => {
			await instance.enableInvestorToWhitelist(
				custodian.send({maxGas: 130000}),
				investorAddress,
			);
		});

		it("investorsAllowed should return true after whitelisting", async () => {
			const actual = await instance.investorsAllowed(
				cak.call(),
				investorAddress,
			);
			expect(actual).to.equal(true);
		});

		it("TO BE CHECKED CAK should be able to remove investors ?", async () => {
			await instance.disableInvestorFromWhitelist(
				custodian.send({maxGas: 130000}),
				investorAddress,
			);
		});

		it("investorsAllowed should return false after whitelisting removal", async () => {
			const actual = await instance.investorsAllowed(
				cak.call(),
				investorAddress,
			);
			expect(actual).to.equal(false);
		});


        it("should check investor allowed status based on KeyringAdapterMock", async () => {
            // Set the mock credential result to true
            await keyringAdapterMock.setCheckCredentialResult(custodian.send(), policyId, investorAddress, true);

            const actual = await instance.investorsAllowed(
                cak.call(),
                investorAddress,
            );
            expect(actual).to.equal(true);
        });

        it("should check investor disallowed status based on KeyringAdapterMock", async () => {
            // Set the mock credential result to false
            await keyringAdapterMock.setCheckCredentialResult(custodian.send(), policyId, investorAddress, false);

            const actual = await instance.investorsAllowed(
                cak.call(),
                investorAddress,
            );
            expect(actual).to.equal(false);
        });
	});
});
