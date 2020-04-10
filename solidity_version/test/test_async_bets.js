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

    let ledger;

    beforeEach(async function() {
       // ledger = await Ledger.deployed();
       ledger = await HeadsOrTailsLedger.new(accounts[1], STARTING_ODDS)
      });




    it("testing the cost 10 bets placed asynchronously by 7  punter ", async () => {
        await ledger.add_to_pot({value: 5*OWNER_STAKE})
       
        let promisies = [];
        for (let i=0; i< N; i++) {
            promisies.push(ledger.bet({value: PUNTER_STAKE, from: accounts[i%8+2]}) );
        }
        await Promise.all(promisies)
        let param = web3.eth.abi.encodeParameter('string', 'HEADS');
        await ledger.process_event(param, {from: accounts[1]});
        let payout_reciept = await ledger.payout({from: accounts[1]})
        console.log("cost: ", tx_cost(payout_reciept)/(N * 1000000000000000))

    });




});
  