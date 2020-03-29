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

CAFE = 0
HOUSE = 1
PUNTER = 2

@pytest.fixture
def storage_contract(outcome_leger, accounts):
    # deploy the contract with the initial value as a constructor argument
    # assert accounts[CAFE].balance() == ORIGNAIL_AMOUNT, "ORIGNAIL_AMOUNT error"
    # assert accounts[PUNTER].balance() == ORIGNAIL_AMOUNT
    yield outcome_leger.deploy(accounts[HOUSE], STARTING_ODDS, {'from': accounts[CAFE]})




def test_bet_nopayout(storage_contract, accounts):
     # place a single valid bet
    storage_contract.add_to_pot( {'from': accounts[HOUSE], 'value': OWNER_STAKE})
    cafe_balance  = accounts[CAFE].balance()
    leger_owner_balance  = accounts[HOUSE].balance()
    punter_balance =  accounts[PUNTER].balance()
    assert storage_contract.balance() == OWNER_STAKE
    storage_contract.bet({'from': accounts[PUNTER], 'value': PUNTER_STAKE_WEI})
    assert storage_contract.balance() == OWNER_STAKE + PUNTER_STAKE_WEI

    storage_contract.on_flip(False)
    storage_contract.end_event()
    storage_contract.payout()
    
    assert storage_contract.balance() == 0
    assert accounts[CAFE].balance() == cafe_balance + BASE_FEE
    assert accounts[HOUSE].balance() == ORIGNAIL_AMOUNT + PUNTER_STAKE_WEI - BASE_FEE
    assert accounts[PUNTER].balance() == punter_balance - PUNTER_STAKE_WEI







    