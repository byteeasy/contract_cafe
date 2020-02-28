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
    yield outcome_leger.deploy(accounts[CAFE], STARTING_ODDS, {'from': accounts[HOUSE], 'value': OWNER_STAKE})


def test_initial_state(storage_contract, accounts):
    # Check if the constructor of the contract is set up properly
    assert storage_contract.leger_owner() == accounts[HOUSE]
    assert storage_contract.contract_cafe() == accounts[CAFE]
    assert storage_contract.owner_stake() == OWNER_STAKE
    assert storage_contract.current_odds() == STARTING_ODDS
    assert storage_contract.get_total_at_stake() == 0
    assert storage_contract.get_total_to_pay() == 0
    assert storage_contract.get_cafe_fees() == 0

def test_good_bet(storage_contract, accounts):
     # place a single valid bet
    assert storage_contract.get_punter_count() == 0
    storage_contract.bet({'from': accounts[PUNTER], 'value': PUNTER_STAKE_WEI})
    assert storage_contract.get_punter_count()== 1
    assert storage_contract.get_stake_count()== 1
    assert storage_contract.get_total_at_stake() == PUNTER_STAKE_WEI
    assert storage_contract.get_cafe_fees() == BASE_FEE

    assert storage_contract.get_total_to_pay() == BASE_PAYOUT+BASE_FEE
    assert storage_contract.get_total_to_pay() < storage_contract.owner_stake()


def test_multple_good_bets_same_punter(storage_contract, accounts):
    # place a multiple valid bets from the same punter
    assert storage_contract.get_punter_count()== 0
    storage_contract.bet({'from': accounts[PUNTER], 'value': PUNTER_STAKE_WEI})
    storage_contract.bet({'from': accounts[PUNTER], 'value': PUNTER_STAKE_WEI})
    assert storage_contract.get_punter_count()== 1
    assert storage_contract.get_stake_count()== 2
    assert storage_contract.get_total_at_stake() == PUNTER_STAKE_WEI * 2
    assert storage_contract.get_cafe_fees() == BASE_FEE * 2
    assert storage_contract.get_total_to_pay() == (BASE_PAYOUT+BASE_FEE)*2
    assert storage_contract.get_total_to_pay() < storage_contract.owner_stake()




def test_multple_good_bets(storage_contract, accounts):
    # place a multiple valid bets from the different punters
    assert storage_contract.get_punter_count()== 0
    total_at_stake = 0
    for i in range(2,4):
        storage_contract.bet({'from': accounts[i], 'value': PUNTER_STAKE_WEI})
    assert storage_contract.get_punter_count()== 2
    assert storage_contract.get_stake_count()== 2
    assert storage_contract.get_total_at_stake() == PUNTER_STAKE_WEI * 2
    assert storage_contract.get_cafe_fees() == BASE_FEE * 2
    assert storage_contract.get_total_to_pay() == (BASE_PAYOUT+BASE_FEE)*2
    assert storage_contract.get_total_to_pay() < storage_contract.owner_stake()




def test_high_bet(storage_contract, accounts):
    # place a bet above OWNER_STAKE"
    assert storage_contract.get_punter_count()== 0
    with reverts('bet cannot be covered'):
        storage_contract.bet({'from': accounts[PUNTER], 'value': ABOVE_OWNER_STAKE})
    assert storage_contract.get_punter_count()== 0


def test_bet_after_close(storage_contract, accounts):
    # place a bet above OWNER_STAKE"
    storage_contract.close_leger()
    with reverts('the leger has to be open for bets'):
        storage_contract.bet({'from': accounts[PUNTER], 'value': ABOVE_OWNER_STAKE})
    assert storage_contract.get_punter_count()== 0

def test_bet_after_close(storage_contract, accounts):
    # place a bet after the leger is closed"
    storage_contract.close_leger()
    with reverts('the leger has to be open for bets'):
        storage_contract.bet({'from': accounts[PUNTER], 'value': PUNTER_STAKE_WEI})
    assert storage_contract.get_punter_count()== 0

def test_bet_after_close(storage_contract, accounts):
    # place a bet after the event has closed"
    storage_contract.end_event()
    with reverts('event must be not be over'):
        storage_contract.bet({'from': accounts[HOUSE], 'value': PUNTER_STAKE_WEI})
    assert storage_contract.get_punter_count()== 0




def test_will_payout_true(storage_contract, accounts):
    # test getting heads i.e payout"
    storage_contract.on_flip(True)
    assert storage_contract.will_payout()


def test_will_payout_false(storage_contract, accounts):
    # test getting heads i.e payout"
    storage_contract.on_flip(False)
    assert storage_contract.will_payout() == False


