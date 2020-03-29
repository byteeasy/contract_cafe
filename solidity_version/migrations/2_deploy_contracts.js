var Ledger = artifacts.require("Ledger");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Ledger, accounts[1], 4);
};