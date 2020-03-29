const web3 = global.web3;
const Ledger = artifacts.require("Ledger");
const GANACHE_GAS_PRICE = 20000000000
const STARTING_ODDS = 400; // in percent
const OWNER_STAKE = 10e17;
const ABOVE_OWNER_STAKE = OWNER_STAKE +1;
const PUNTER_STAKE = OWNER_STAKE * 0.1;
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
    return  receipt.receipt.cumulativeGasUsed*20000000000
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
        ledger = await Ledger.new(accounts[1], STARTING_ODDS);
         await ledger.add_to_pot({value: OWNER_STAKE, from: accounts[1]});
      });

    it("testing cafe owner atfer new", async () => {
        let contract_cafe = await ledger.contract_cafe.call()
        assert.equal(contract_cafe, accounts[0]);
    });
    it("testing current odds after new", async () => {
        let current_odds = await ledger.current_odds.call()
        assert.equal(current_odds, STARTING_ODDS);
    });
    it("testing ledger owner afer new", async () => {
 

        let ledger_owner = await ledger.leger_owner.call()
        assert.equal(ledger_owner, accounts[1]);
    });
    it("testing owners_stake afer add_to_Pot", async () => {
 

        let owner_stake = await ledger.owner_stake.call();
        assert.equal(owner_stake, OWNER_STAKE);
    });
    it("testing contract balance afer add_to_Pot", async () => {
 

        let ledger_balance = await get_balance(ledger.address)
        assert.equal(ledger_balance, OWNER_STAKE);
    });
    it("testing contract balance after one bet", async () => {
 
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});

        let ledger_balance = await get_balance(ledger.address)
        assert.equal(ledger_balance, OWNER_STAKE + PUNTER_STAKE_WEI);
    });
    it("testing get_punter_count  after one bet", async () => {
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]})

        let punter_count = await ledger.get_punter_count()
        assert.equal(Number(punter_count), 1)
    });
    it("testing get_stake_count  after one bet", async () => {
 
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});

        let stake_count = await ledger.get_stake_count()
        assert.equal(Number(stake_count), 1)
    });
    it("testing get_total_at_stake  after one bet", async () => {
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});

        let total_at_stake = await ledger.get_total_at_stake()
        assert.equal(balance_to_wei(total_at_stake), PUNTER_STAKE_WEI)
    });
    it("testing get_total_to_pay  after one bet", async () => {
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});

        let total_to_pay = await ledger.get_total_to_pay()
        assert.equal(balance_to_wei(total_to_pay), BASE_PAYOUT+BASE_FEE)
    });

    it("testing two bets from the same punter", async () => {
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


    it("testing account balances after payout of one bet", async () => {
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});
        let contract_cafe_balance = await get_balance(accounts[0])
        let ledger_owner_balance = await get_balance(accounts[1])
        let punter_balance = await get_balance(accounts[2])
        let contract_balance = await get_balance(ledger.address)
        let total_to_pay = await ledger.get_total_to_pay()
        assert.equal(balance_to_wei(total_to_pay), BASE_PAYOUT+BASE_FEE)
        // console.log("contract_balance: "+ contract_balance)
         await ledger.force_outcome(true)
         await ledger.end_event()
         await ledger.payout()

        // let new_contract_cafe_balance = await get_balance(accounts[0])
        // console.log("contract_cafe: "+ contract_cafe_balance
        //     +"<>"+new_contract_cafe_balance+ " = "+ (new_contract_cafe_balance- contract_cafe_balance))
        // assert.equal(new_contract_cafe_balance, contract_cafe_balance + BASE_FEE)

        let new_ledger_owner_balance = await get_balance(accounts[1])
        assert.equal(new_ledger_owner_balance, (OWNER_STAKE+ledger_owner_balance - (BASE_PAYOUT+BASE_FEE)))

        let new_punter_balance = await get_balance(accounts[2])
        assert.equal(new_punter_balance, punter_balance + BASE_PAYOUT+PUNTER_STAKE)
        
        let new_contract_balance = await get_balance(ledger.address)
        assert.equal(new_contract_balance, 0)
    });

    it("testing account balances after a lose", async () => {
        let punter_balance_before = await get_balance(accounts[2])
        receipt = await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});
        // console.log("ledger.payout: ", receipt.receipt.cumulativeGasUsed/20000000000)

        let contract_cafe_balance = await get_balance(accounts[0])
        let ledger_owner_balance = await get_balance(accounts[1])
        let punter_balance = await get_balance(accounts[2])
        let contract_balance = await get_balance(ledger.address)
        let total_to_pay = await ledger.get_total_to_pay()
        assert.equal(balance_to_wei(total_to_pay), BASE_PAYOUT+BASE_FEE)
        // console.log("contract_balance: "+ contract_balance)
        await ledger.force_outcome(false)
        await ledger.end_event()
        await ledger.payout()
        // console.log("ledger.payout: ", receipt)
        // let new_contract_cafe_balance = await get_balance(accounts[0])
        // console.log("contract_cafe: "+ contract_cafe_balance
        //     +"<>"+new_contract_cafe_balance+ " = "+ (new_contract_cafe_balance- contract_cafe_balance))
        // assert.equal(new_contract_cafe_balance, contract_cafe_balance + BASE_FEE)

        let new_ledger_owner_balance = await get_balance(accounts[1])
        assert.equal(new_ledger_owner_balance, (OWNER_STAKE+ledger_owner_balance + PUNTER_STAKE - BASE_FEE))
        let new_punter_balance = await get_balance(accounts[2])
        // console.log("real cost: ", punter_balance_before  - new_punter_balance)
        // console.log("     cost: ", receipt.receipt.cumulativeGasUsed*20000000000+ PUNTER_STAKE)
        // console.log("adjusted punter_balance: ", punter_balance + (punter_balance_before  - new_punter_balance)) //receipt.receipt.cumulativeGasUsed*20000000000)
        // console.log("punter_balance_before", punter_balance_before)
        // console.log("punter_balance: ", punter_balance)
        // console.log("new_punter_balance: ", new_punter_balance )
        // console.log("PUNTER_STAKE: ", PUNTER_STAKE)
        assert.equal(new_punter_balance, punter_balance)
        
        let new_contract_balance = await get_balance(ledger.address)
        assert.equal(new_contract_balance, 0)
    });



    // it("testing rejecting bet that cant be covered", async function() {
    //     let bet_error;
    //     try {
    //         await ledger.bet({value: ABOVE_OWNER_STAKE, from: accounts[2]});
    //     } catch (error) {
    //         bet_error = error;
    //     }
    //     assert.notEqual(bet_error, undefined, 'Error must be thrown');
    //     let error_msg = await ledger.bet_cannot_be_covered_msg.call()
    //     assert.isAbove(bet_error.message.search(error_msg), -1, 'wrong error was thrown: ' + bet_error.message);
    // });

    // it("testing rejecting bet that cant be covered2", async function() {
    //     let error_msg = await ledger.bet_cannot_be_covered_msg.call()
    //     test_error(error_msg, async function () {
    //         await ledger.bet({value: ABOVE_OWNER_STAKE, from: accounts[2]});
    //     });
    // });
   

});
  