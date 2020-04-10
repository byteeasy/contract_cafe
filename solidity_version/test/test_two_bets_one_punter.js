const web3 = global.web3;
const HeadsOrTailsLedger = artifacts.require("HeadsOrTailsLedger");
const GANACHE_GAS_PRICE = 20000000000
const STARTING_ODDS = 400; // in percent
const OWNER_STAKE = 1*10e17;
const ABOVE_OWNER_STAKE = OWNER_STAKE +1;
const PUNTER_STAKE = OWNER_STAKE * 0.01;
const PUNTER_STAKE_WEI = PUNTER_STAKE;
const BASE_FEE = PUNTER_STAKE *.04;
const BASE_PAYOUT = PUNTER_STAKE * STARTING_ODDS/100;







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




  

contract("Ledger", accounts => {

    let ledger;

    beforeEach(async function() {
       // ledger = await Ledger.deployed();
       ledger = await HeadsOrTailsLedger.new(accounts[1], STARTING_ODDS)
      });

    it("testing two bets from the same punter", async () => {
        await ledger.add_to_pot({value: OWNER_STAKE})
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});
        let ledger_balance = await get_balance(ledger.address)
        assert.equal(ledger_balance, OWNER_STAKE + (PUNTER_STAKE *2));
        let punter_count = await ledger.get_punter_count()
        assert.equal(Number(punter_count), 1)
        let stake_count = await ledger.get_stake_count()
        assert.equal(Number(stake_count), 2)
        let total_at_stake = await ledger.get_total_at_stake()
        assert.equal(balance_to_wei(total_at_stake), PUNTER_STAKE*2)
        let total_to_pay = await ledger.get_total_to_pay()
        assert.equal(balance_to_wei(total_to_pay), (BASE_PAYOUT+BASE_FEE) *2)
    });

   

});
  