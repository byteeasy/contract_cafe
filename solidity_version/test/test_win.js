const web3 = global.web3;
const { soliditySha3 } = require("web3-utils");
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

  

contract("HeadsOrTailsLedger", accounts => {

    it("testing two bets from the same punter", async () => {
        let ledger = await HeadsOrTailsLedger.deployed();
        await ledger.add_to_pot({value: OWNER_STAKE})
        await ledger.bet({value: PUNTER_STAKE, from: accounts[2]});
        
        let param = web3.eth.abi.encodeParameter('string', 'HEADS');
        await ledger.process_event(param, {from: accounts[1]});
        // // //let force_outcome_reciept = await ledger.force_outcome(true, {from: accounts[1]})
          
        let ledger_owner_balance = await get_balance(accounts[0]) 
        let contract_cafe_balance = await get_balance(accounts[1])
        let punter_balance = await get_balance(accounts[2])

        let payout_receipt = await ledger.payout()

        let new_ledger_owner_balance = await get_balance(accounts[0])
        assert.equal(new_ledger_owner_balance, (OWNER_STAKE+ledger_owner_balance 
                                    - (BASE_PAYOUT+BASE_FEE +  tx_cost(payout_receipt))))

        let new_contract_cafe_balance = await get_balance(accounts[1])
        assert.equal(new_contract_cafe_balance, contract_cafe_balance + BASE_FEE)
        let new_punter_balance = await get_balance(accounts[2])
        assert.equal(new_punter_balance, punter_balance + BASE_PAYOUT+PUNTER_STAKE)

        let new_contract_balance = await get_balance(ledger.address)
        assert.equal(new_contract_balance, 0)

        
    });

});
  