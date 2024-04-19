const {SmartContracts} = require("@saturn-chain/smart-contract");
const combined = require("../contracts/combined.json");
module.exports = SmartContracts.load(combined);
