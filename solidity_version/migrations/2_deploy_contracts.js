var HeadsOrTailsLedger = artifacts.require("HeadsOrTailsLedger");
const STARTING_ODDS = 400; // in percent

module.exports = function(deployer, network, accounts) {
  deployer.deploy(HeadsOrTailsLedger, accounts[1], STARTING_ODDS);
};