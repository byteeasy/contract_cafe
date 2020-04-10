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


function test_error(error_msg, code){
    let an_error;
    try {
       code();
       throw('Ho')
    } catch (error) {
        an_error = error;
    }
    assert.notEqual(an_error, undefined, 'Error must be thrown');
    assert.isAbove(an_error.message.search(error_msg), -1, 'wrong error was thrown: ' + an_error.message);

}

  

contract("Ledger", accounts => {

    let ledger;

    beforeEach(async function() {
       // ledger = await Ledger.deployed();
       ledger = await HeadsOrTailsLedger.new(accounts[1], STARTING_ODDS)
      });


    it("testing ledger owner address afer new", async () => {
        let ledger_owner = await ledger.ledger_owner.call()
        assert.equal(ledger_owner, accounts[0]);
    });
    it("testing current odds after new", async () => {
        let current_odds = await ledger.current_odds.call()
        assert.equal(current_odds, STARTING_ODDS);
    });
    it("testing contract cafe address afer new", async () => {
        let contract_cafe = await ledger.contract_cafe.call()
        assert.equal(contract_cafe, accounts[1]);
    });
   
    it("testing owners_stake after add_to_Pot", async () => {
        await ledger.add_to_pot({value: OWNER_STAKE})
        let owner_stake = await ledger.owner_stake.call();
        assert.equal(owner_stake, OWNER_STAKE);
    });


    it("testing contract balance afer add_to_Pot", async () => {
        await ledger.add_to_pot({value: OWNER_STAKE})
        let ledger_balance = await get_balance(ledger.address)
        assert.equal(ledger_balance, OWNER_STAKE);
    });
    it("testing contract balance after one bet", async () => {
        await ledger.add_to_pot({value: OWNER_STAKE})
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});

        let ledger_balance = await get_balance(ledger.address)
        assert.equal(ledger_balance, OWNER_STAKE + PUNTER_STAKE_WEI);
    });
    it("testing get_punter_count  after one bet", async () => {
        await ledger.add_to_pot({value: OWNER_STAKE})
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]})

        let punter_count = await ledger.get_punter_count()
        assert.equal(Number(punter_count), 1)
    });
    it("testing get_stake_count  after one bet", async () => {
        await ledger.add_to_pot({value: OWNER_STAKE})
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});

        let stake_count = await ledger.get_stake_count()
        assert.equal(Number(stake_count), 1)
    });
    it("testing get_total_at_stake  after one bet", async () => {
        await ledger.add_to_pot({value: OWNER_STAKE})
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});

        let total_at_stake = await ledger.get_total_at_stake()
        assert.equal(balance_to_wei(total_at_stake), PUNTER_STAKE_WEI)
    });
    it("testing get_total_to_pay  after one bet", async () => {
        await ledger.add_to_pot({value: OWNER_STAKE})
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});

        let total_to_pay = await ledger.get_total_to_pay()
        assert.equal(balance_to_wei(total_to_pay), BASE_PAYOUT+BASE_FEE)
    });

    it("testing two bets from the same punter", async () => {
        await ledger.add_to_pot({value: OWNER_STAKE})
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});
        let ledger_balance = await get_balance(ledger.address)
        assert.equal(ledger_balance, OWNER_STAKE + PUNTER_STAKE_WEI *2);
        let punter_count = await ledger.get_punter_count()
        assert.equal(Number(punter_count), 1)
        let stake_count = await ledger.get_stake_count()
        assert.equal(Number(stake_count), 2)
        let total_at_stake = await ledger.get_total_at_stake()
        assert.equal(balance_to_wei(total_at_stake), PUNTER_STAKE_WEI*2)
        let total_to_pay = await ledger.get_total_to_pay()
        assert.equal(balance_to_wei(total_to_pay), (BASE_PAYOUT+BASE_FEE) *2)
    });

    it("testing two bets from the different punters", async () => {
        await ledger.add_to_pot({value: OWNER_STAKE})
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});
        await ledger.bet({value: PUNTER_STAKE, from: accounts[3]});
        let ledger_balance = await get_balance(ledger.address)
        assert.equal(ledger_balance, OWNER_STAKE + PUNTER_STAKE_WEI *2);
        let punter_count = await ledger.get_punter_count()
        assert.equal(Number(punter_count), 2)
        let stake_count = await ledger.get_stake_count()
        assert.equal(Number(stake_count), 2)
        let total_at_stake = await ledger.get_total_at_stake()
        assert.equal(balance_to_wei(total_at_stake), PUNTER_STAKE_WEI*2)
        let total_to_pay = await ledger.get_total_to_pay()
        assert.equal(balance_to_wei(total_to_pay), (BASE_PAYOUT+BASE_FEE) *2)
    });
});
  