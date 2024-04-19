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
	"InvestorManagement",
];

describe("Register - role management", function () {
	this.timeout(10000);
	let web3: Web3;
	let cak: EthProviderInterface;
	let otherCak: EthProviderInterface;
	let custodian: EthProviderInterface;
	let stranger: EthProviderInterface;
	// let bnd: EthProviderInterface;
	// let alice: EthProviderInterface;
	let sut: SmartContractInstance;
	let Register: SmartContract;
	let cakAddress: string;
	let otherCakAddress: string;
	let strangerAddress: string;
	let cakRole: string;
	let bndRole: string;
	let custodianRole: string;
	let payRole: string;
	let defaultAdminRole: string;

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
		otherCak = new Web3FunctionProvider(web3.currentProvider, (list) =>
			Promise.resolve(list[3]),
		);
		// bnd = new Web3FunctionProvider(web3.currentProvider, (list) => Promise.resolve(list[3]));
		// alice = new Web3FunctionProvider(web3.currentProvider, (list) => Promise.resolve(list[4])); //wants to have as much grants as possible

		cakAddress = await cak.account();
		otherCakAddress = await otherCak.account();
		strangerAddress = await stranger.account();
		// bndAddress = await bnd.account();
		// aliceAddress = await alice.account();
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

		const instance = await Register.deploy(
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

		sut = IRegister.at(instance.deployedAt);

		cakRole = await sut.CAK_ROLE(stranger.call());
		bndRole = await sut.BND_ROLE(stranger.call());
		custodianRole = await sut.CST_ROLE(stranger.call());
		payRole = await sut.PAY_ROLE(stranger.call());
		defaultAdminRole =
			"0x0000000000000000000000000000000000000000000000000000000000000000"; // TODO add DEFAULT_ADMIN_ROLE to the IRegister contract
	}

	describe("when Register contract is deployed", async () => {
		before(async () => {
			await deployRegisterContract();
		});

		it("deployer should have the cak role", async () => {
			const isCak = await sut.hasRole(stranger.call(), cakRole, cakAddress);
			expect(isCak).to.be.true;
		});

		it("deployer should have the DEFAULT_ADMIN_ROLE role", async () => {
			const isCak = await sut.hasRole(
				stranger.call(),
				defaultAdminRole,
				cakAddress,
			);
			expect(isCak).to.be.true;
		});

		it("deployer should NOT have the BND role", async () => {
			const isBnD = await sut.isBnD(stranger.call(), cakAddress);
			expect(isBnD).to.be.false;
		});

		it("deployer should NOT have the Custodian role", async () => {
			const isBnD = await sut.hasRole(
				stranger.call(),
				custodianRole,
				cakAddress,
			);
			expect(isBnD).to.be.false;
		});

		it("deployer should NOT have the paying agent role", async () => {
			const isBnD = await sut.hasRole(stranger.call(), payRole, cakAddress);
			expect(isBnD).to.be.false;
		});

		it("deployer should NOT have the PAY role", async () => {
			const isPayingAgent = await sut.isPay(stranger.call(), cakAddress);
			expect(isPayingAgent).to.be.false;
		});

		it("deployer should be able to manage the BND role", async () => {
			const bndAdminRole = await sut.getRoleAdmin(stranger.call(), bndRole);
			expect(bndAdminRole).to.equal(
				cakRole,
				"CAK role should be the admin role for bnd role so that cak may grant a BND user",
			);
		});

		it("deployer should be able to manage the Custodian role", async () => {
			const custAdminRole = await sut.getRoleAdmin(
				stranger.call(),
				custodianRole,
			);
			expect(custAdminRole).to.equal(cakRole);
		});

		it("CAK role (grant/revoke) can be set by CAK role - register contract deployer", async () => {
			//cak role admin is the CAK role itself (global admin role granted to the deployer of the register bond contract)
			const cakAdminRole = await sut.getRoleAdmin(stranger.call(), cakRole);
			expect(cakAdminRole).to.equal(cakAdminRole);
			const isDefaultAdmin = await sut.hasRole(
				stranger.call(),
				defaultAdminRole,
				cakAddress,
			);
			expect(isDefaultAdmin).to.be.true;
		});

		it("CAK can grant another CAK", async () => {
			await sut.grantRole(cak.send({maxGas: 100000}), cakRole, otherCakAddress);
			const isAlsoCak = await sut.hasRole(
				stranger.call(),
				cakRole,
				otherCakAddress,
			);
			expect(isAlsoCak).to.be.true;
		});

		it("Any CAK user may administrate the PayingAgent role (grant/revoke)", async () => {
			//cak role admin is the defaultAdminRole (granted to the deployer of the register bond contract)
			const payAdminRole = await sut.getRoleAdmin(stranger.call(), payRole);

			const cakIsDefaultAdmin = await sut.hasRole(
				stranger.call(),
				defaultAdminRole,
				cakAddress,
			);
			expect(cakIsDefaultAdmin).to.be.true;
			expect(payAdminRole).to.equal(
				cakRole,
				"payAdminRole should be the cakRole",
			);
			expect(payAdminRole).not.to.equal(
				defaultAdminRole,
				"payAdminRole should not be the default",
			);
		});

		it("deployer is the admin of default_admin role and can manage himself (inherited from AccessManagement)", async () => {
			//not strictly necessary (no need to test AccessManagement from openzepplin) but just here to document this corner case
			const defaultAdminRoleAdmin = await sut.getRoleAdmin(
				stranger.call(),
				defaultAdminRole,
			);
			expect(defaultAdminRoleAdmin).to.equal(defaultAdminRole);
		});

		it("stranger cannot grant cak role", async () => {
			await expect(
				sut.grantCakRole(stranger.call(), strangerAddress),
			).to.be.rejectedWith("Caller must be CAK or ADMIN");
		});

		it("stranger cannot grant custodian role", async () => {
			await expect(
				sut.grantCstRole(stranger.call(), strangerAddress),
			).to.be.rejectedWith("Caller must be CAK");
		});

		it("stranger cannot grant custodian role (inheristed from AccessControl)", async () => {
			//cak role is 0xa75205b8583660bdad375c0ccde11af17668d76a408a9a5e739251b0f7c59870
			await expect(
				sut.grantRole(stranger.call(), custodianRole, strangerAddress),
			).to.be.rejectedWith("Caller must be CAK to set a role");
		});

		it("stranger cannot grant bnd role", async () => {
			await expect(
				sut.grantBndRole(stranger.call(), strangerAddress),
			).to.be.rejectedWith("Caller must be CAK");
		});

		it("stranger cannot grant bnd role  (inheristed from AccessControl)", async () => {
			await expect(
				sut.grantRole(stranger.call(), bndRole, strangerAddress),
			).to.be.rejectedWith("Caller must be CAK to set a role");
		});

		it("stranger cannot grant pay role", async () => {
			await expect(
				sut.grantPayRole(stranger.call(), strangerAddress),
			).to.be.rejectedWith("Caller must be CAK");
		});

		it("stranger cannot grant default_admin role", async () => {
			await expect(
				sut.grantRole(stranger.call(), defaultAdminRole, strangerAddress),
			).to.be.rejectedWith(
				"Use function changeAdminRole instead",
				"only default admin or CAK can manage the ADMIN_ROLE",
			);
		});

		it("should change the admin of the register", async () => {
			// GIVEN the register in sut var
			// console.log("Addresses", {cak: cakAddress, otherCak: otherCakAddress, stranger: strangerAddress});

			// GIVEN the admin being cak and otherCAK Address
			const isAlsoCak = await sut.hasRole(
				stranger.call(),
				cakRole,
				otherCakAddress,
			);
			// console.log("Adding the other cak", isAlsoCak, otherCakAddress);
			if (!isAlsoCak) {
				await sut.grantRole(
					cak.send({maxGas: 100000}),
					cakRole,
					otherCakAddress,
				);
			}
			// Given the address of the stranger to become cak

			// WHEN we follow the process of changing the admin
			await sut.changeAdminRole(cak.send({maxGas: 100_000}), strangerAddress);
			await sut.changeAdminRole(
				otherCak.send({maxGas: 100_000}),
				strangerAddress,
			);

			// THEN the admin should be the stranger address
			const isAdmin = await sut.hasRole(
				stranger.call(),
				defaultAdminRole,
				strangerAddress,
			);
			expect(isAdmin).to.be.true;
			// AND the initial admin should not be admin anymore
			const isStillAdmin = await sut.hasRole(
				stranger.call(),
				defaultAdminRole,
				cakAddress,
			);
			expect(isStillAdmin).to.be.false;
		});
	});

	//TODO: test register.isCustodian bool prop

	//TODO: test changeAdminRole double vote sequence (this is a misnomer: changeAdminRole just add a user the to default_admin role managing the CAK role grants/revokes)
	//TODO: stranger cannot become admin
	//TODO: stranger cannot grant himself cak role
	//TODO: stranger cannot grant himself any role
	//TODO: test grant for CAK, BND, CST, PAY, DEFAULT_ADMIN_ROLE
	//TODO: test revoke for CAK, BND, CST, PAY
	//TODO: test every function for role CAK
	//TODO: test every function for role BND
	//TODO: test every function for role CST
	//TODO: test every function for role PAY

	/**
   * 
   *     
   * Unit test this interface
   * function isBnD(address account) external view returns(bool);
    function isPay(address account) external view returns(bool);
    function changeAdminRole(address account) external;
    function grantCakRole(address cakAddress) external;
    function revokeCakRole(address cakAddress) external;
    function grantBndRole(address bndAddress) external;
    function revokeBndRole(address bndAddress) external;
    function grantCstRole(address cstAddress) external;
    function revokeCstRole(address cstAddress) external;
    function grantPayRole(address cstAddress) external;
    function revokePayRole(address cstAddress) external;

   */
});
