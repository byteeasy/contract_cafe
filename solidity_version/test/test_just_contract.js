const web3 = global.web3;
const HeadsOrTailsLedger = artifacts.require("HeadsOrTailsLedger");
const GANACHE_GAS_PRICE = 20000000000
const STARTING_ODDS = 400; // in percent
const OWNER_STAKE = 1*10e18;
const ABOVE_OWNER_STAKE = OWNER_STAKE +1;
const PUNTER_STAKE = OWNER_STAKE * 0.01;
const PUNTER_STAKE_WEI = PUNTER_STAKE;
const BASE_FEE = PUNTER_STAKE *.04;
const BASE_PAYOUT = PUNTER_STAKE * STARTING_ODDS/100;
const N = 100;






async function get_balance(address) {
    let balance = await web3.eth.getBalance(address)
    return Number(web3.utils.toWei(balance, "wei"))
}

function balance_to_wei(balance) {
    return Number(web3.utils.toWei(balance, "wei"))
}

function tx_cost(receipt) {
    return  (receipt.receipt.cumulativeGasUsed*20000000000)
}



contract("HeadsOrTailsLedger", accounts => {

    // 2753988 -- 2720500
    // 27001
    // 188483 -- 188483


    let ledger;

    beforeEach(async function() {
       // ledger = await Ledger.deployed();
       ledger = await HeadsOrTailsLedger.new(accounts[1], STARTING_ODDS)
      });




    it("create contract", async () => {
        let ledger_owner = await ledger.ledger_owner.call()
        assert.equal(ledger_owner, accounts[0]);
     });



});
  