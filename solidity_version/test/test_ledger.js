const web3 = global.web3;
const Ledger = artifacts.require("Ledger");
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
       ledger = await Ledger.new(accounts[1], STARTING_ODDS)
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


    it("testing account balances after payout of one bet", async () => {
        await ledger.add_to_pot({value: OWNER_STAKE})
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});

        let force_outcome_reciept = await ledger.force_outcome(true, {from: accounts[1]})
          
        let ledger_owner_balance = await get_balance(accounts[0]) 
        let contract_cafe_balance = await get_balance(accounts[1])
        let punter_balance = await get_balance(accounts[2])

        let payout_reciept = await ledger.payout()

        let new_ledger_owner_balance = await get_balance(accounts[0])
        assert.equal(new_ledger_owner_balance, (OWNER_STAKE+ledger_owner_balance 
                                    - (BASE_PAYOUT+BASE_FEE +  tx_cost(payout_reciept))))

        let new_contract_cafe_balance = await get_balance(accounts[1])
        assert.equal(new_contract_cafe_balance, contract_cafe_balance + BASE_FEE)

        let new_punter_balance = await get_balance(accounts[2])
        assert.equal(new_punter_balance, punter_balance + BASE_PAYOUT+PUNTER_STAKE)

        let new_contract_balance = await get_balance(ledger.address)
        assert.equal(new_contract_balance, 0)


    });

    it("testing account balances after a lose", async () => {
        await ledger.add_to_pot({value: OWNER_STAKE})
        bet_receipt = await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});
        
        // // console.log("ledger.payout: ", receipt.receipt.cumulativeGasUsed/20000000000)
        let force_outcome_reciept = await ledger.force_outcome(false, {from: accounts[1]})
       
       
        let ledger_owner_balance = await get_balance(accounts[0]) 
        let contract_cafe_balance = await get_balance(accounts[1])
        let punter_balance = await get_balance(accounts[2])

        let payout_reciept = await ledger.payout()

        let new_ledger_owner_balance = await get_balance(accounts[0])
        let excpect_balance = OWNER_STAKE+ledger_owner_balance + PUNTER_STAKE  - (BASE_FEE + tx_cost(payout_reciept))
        assert.equal(Math.trunc(new_ledger_owner_balance/10000000000), Math.trunc(excpect_balance/10000000000))

        let new_contract_cafe_balance = await get_balance(accounts[1])
        assert.equal(new_contract_cafe_balance, contract_cafe_balance + BASE_FEE)

        let new_punter_balance = await get_balance(accounts[2])
        assert.equal(new_punter_balance, punter_balance)

        let new_contract_balance = await get_balance(ledger.address)
        assert.equal(new_contract_balance, 0)

    });




    it("testing cost 100 bets two punter ", async () => {
        await ledger.add_to_pot({value: 3*OWNER_STAKE})
        let N = 10;
        for (let i=0; i< N; i++) {
            await ledger.bet({value: PUNTER_STAKE, from: accounts[i%8+2]});
            let total_to_pay =  await ledger.get_total_to_pay()
            // console.log("total_to_pay", Number(total_to_pay))
            ledger_owner_balance = await get_balance(accounts[0])
            // console.log("ledger_owner_balance", ledger_owner_balance)
            // console.log("diff ", ledger_owner_balance -  Number(total_to_pay))
            let cafe_fees =  await ledger.get_cafe_fees()
            console.log("cafe_fees ", Number(cafe_fees))
        }
        await ledger.force_outcome(true, {from: accounts[1]})
        let payout_reciept = await ledger.payout({from: accounts[0]})
        console.log("cost: ", tx_cost(payout_reciept)/(1 * 1000000000000000))

    });


    it("testing the cost 10 bets placed asynchronously by 7  punter ", async () => {
        await ledger.add_to_pot({value: 3*OWNER_STAKE})
        let N = 10;
        let promisies = [];
        for (let i=0; i< N; i++) {
            promisies.push(ledger.bet({value: PUNTER_STAKE, from: accounts[i%8+2]}) );
        }
        await Promise.all(promisies)
        await ledger.force_outcome(true, {from: accounts[1]})
        let payout_reciept = await ledger.payout({from: accounts[1]})
        console.log("cost: ", tx_cost(payout_reciept)/(N * 1000000000000000))

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
  