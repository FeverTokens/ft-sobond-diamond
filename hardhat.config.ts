import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
	networks: {
		hardhat: {
			chainId: 1337,
		},
		kerleano: {
			chainId: 1804,
			url: "https://cacib-saturn-test.francecentral.cloudapp.azure.com",
		},
	},

	paths: {
		sources: "./src",
		tests: "./tests",
		cache: "./cache",
		artifacts: "./artifacts",
	},
	solidity: {
		settings: {
			optimizer: {
				enabled: true,
				runs: 10,
			},
			viaIR: true,
		},
		compilers: [
			{
				version: "0.8.20",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200,
					},
					viaIR: true,
				},
			},
			{
				version: "0.8.19",
				settings: {
					optimizer: {
						enabled: true,
						runs: 10,
					},
					viaIR: true,
				},
			},
			{
				version: "0.8.17",
				settings: {
					optimizer: {
						enabled: true,
						runs: 10,
					},
					viaIR: true,
				},
			},
		],
	},
};

export default config;
