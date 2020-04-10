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

  

contract("HeadsOrTailsLedger", accounts => {

    let ledger;

    beforeEach(async function() {
       // ledger = await Ledger.deployed();
       ledger = await HeadsOrTailsLedger.new(accounts[1], STARTING_ODDS)
       await ledger.add_to_pot({value: OWNER_STAKE})
      });

    it("testing rejecting bet that cant be covered", async function() {
        let bet_error;
        try {
            await ledger.bet({value: ABOVE_OWNER_STAKE, from: accounts[2]});
        } catch (error) {
            bet_error = error;
        }
        assert.notEqual(bet_error, undefined, 'Error must be thrown');
        let error_msg = await ledger.bet_cannot_be_covered_msg.call()
        assert.isAbove(bet_error.message.search(error_msg), -1, 'wrong error was thrown: ' + bet_error.message);
    });

    // it("testing rejecting bet that cant be covered2", async function() {
    //     let error_msg = await ledger.bet_cannot_be_covered_msg.call()
    //     test_error(error_msg, async function () {
    //         await ledger.bet({value: ABOVE_OWNER_STAKE, from: accounts[2]});
    //     });
    // });
   

});
  