import pytest
import decimal

from brownie import Fixed, Wei, reverts

STARTING_ODDS = Fixed("4.0")
OWNER_STAKE = Wei("10000")
ABOVE_OWNER_STAKE = Wei("10001")
PUNTER_STAKE = 100
PUNTER_STAKE_WEI = Wei("100")
BASE_FEE = Wei("4")
BASE_PAYOUT = Wei("400")

ORIGNAIL_AMOUNT = 100000000000000000000
CAFE = 7
HOUSE = 8
PUNTER = 9



@pytest.fixture
def storage_contract(outcome_leger, accounts):
    # deploy the contract with the initial value as a constructor argument
    # assert accounts[0].balance() == ORIGNAIL_AMOUNT, "ORIGNAIL_AMOUNT error"
    # assert accounts[2].balance() == ORIGNAIL_AMOUNT
    yield outcome_leger.deploy(accounts[CAFE], STARTING_ODDS, {'from': accounts[HOUSE], 'value': OWNER_STAKE})





def test_bet_payout(storage_contract, accounts):
     # place a single valid bet
    cafe_balance  = accounts[CAFE].balance()
    leger_owner_balance  = accounts[HOUSE].balance() 
    punter_balance =  accounts[PUNTER].balance()
    assert storage_contract.balance() == OWNER_STAKE
    assert accounts[PUNTER].balance() == ORIGNAIL_AMOUNT
    storage_contract.bet({'from': accounts[PUNTER], 'value': PUNTER_STAKE_WEI})
    assert storage_contract.balance() == OWNER_STAKE + PUNTER_STAKE_WEI
    assert accounts[PUNTER].balance() == punter_balance - PUNTER_STAKE_WEI
    storage_contract.on_flip(True)
    storage_contract.end_event()
    storage_contract.payout()
    
    assert storage_contract.balance() == 0
    assert accounts[CAFE].balance() == cafe_balance + BASE_FEE
    assert accounts[PUNTER].balance() == punter_balance + BASE_PAYOUT
    assert accounts[HOUSE].balance() == ORIGNAIL_AMOUNT - BASE_PAYOUT - BASE_FEE




    