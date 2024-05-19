import {EthProviderInterface} from "@saturn-chain/dlt-tx-data-functions";
import {SmartContractInstance} from "@saturn-chain/smart-contract";
import allContracts from "../src";
import {today} from "./dates";

export const RegisterContractName = "Register";
export const PrimaryIssuanceContractName = "PrimaryIssuance";
export const BilateralTradeContractName = "BilateralTrade";
export const CouponTradeContractName = "Coupon";

export enum Status {
	Draft,
	Pending,
	Rejected,
	Accepted,
	Executed,
	Paid,
}

export async function bilateralTrade(
	register: SmartContractInstance,
	from: EthProviderInterface,
	to: EthProviderInterface,
	qty: number,
	date: number,
	stage: "draft" | "pending" | "accepted" | "executed" = "executed",
): Promise<SmartContractInstance | undefined> {
	console.log("Creating a bilateral trade", {
		register: register.deployedAt,
		from: await from.account(),
		to: await to.account(),
		qty,
		date,
		stage,
	});

	//deploy bilateral trade
	let trade: SmartContractInstance | undefined = undefined;

	trade = await allContracts
		.get(BilateralTradeContractName)
		.deploy(
			from.newi({maxGas: 1000000}),
			register.deployedAt,
			await to.account(),
		);

	let details = await trade.details(from.call());
	details.quantity = qty;
	details.tradeDate = today();
	details.valueDate = date;

	console.log("New Trade created", trade.deployedAt);

	const gasSetDetails = await trade.setDetails(from.test(), details);

	await trade.setDetails(from.send({maxGas: gasSetDetails}), details);
	// console.log("Trade updated", trade.deployedAt);

	if (["pending", "accepted", "executed"].includes(stage)) {
		const gasApprove = await trade.approve(from.test());
		await trade.approve(from.send({maxGas: gasApprove}));
		console.log("Trade status: ", Status[await trade.status(from.call())]);

		if (["accepted", "executed"].includes(stage)) {
			await trade.approve(to.send({maxGas: gasApprove}));
			console.log("Trade status: ", Status[await trade.status(to.call())]);

			if (["executed"].includes(stage)) {
				const gas = await trade.executeTransfer(from.test());
				await trade.executeTransfer(from.send({maxGas: gas}));
				console.log("Trade status: ", Status[await trade.status(from.call())]);
			}
		}
	}

	return trade;
}
