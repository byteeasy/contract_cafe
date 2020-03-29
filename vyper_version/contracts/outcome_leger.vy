#
# author: Thanos Vassilakis
# (c) byteeasy
# 

struct Stake:
    punter_address: address
    stake: wei_value
    odds: decimal
    payout: wei_value
    realized: bool

Payment: event({_amount: wei_value, _from: indexed(address)})
#a_bet event({_from: indexed(address),  _stake: uint256(wei)})

CUT: constant(decimal) = 0.04
PUNTER_LIMIT: constant(int128) = 100000


# contract_cafe receives a handling fee
contract_cafe: public(address)  

# The leger woner  receives money when the contract expirs and the outcome is False
leger_owner: public(address)


leger_opened_at: public(timestamp) # when the event has ended 
event_started_at: public(timestamp) # when the event has ended 
event_ended_at: public(timestamp) # when the event has ended 

current_odds: public(decimal) 
owner_stake: public(wei_value)  

_event_ended: bool # marks the events end
_leger_closed: bool # marks the  end of acceptting bets
_will_payout: bool # only payout after this is set to True

_paidout: bool # mark the events end
_taking_bids: bool # mark the events end
_total_to_pay: wei_value # the total that the leger own has to pay if the Outcome is tr
_total_at_stake: wei_value # the total staked by punters
_cafe_fees: wei_value # the total staked by punters



_the_leger: map(int128, Stake) # a colection of all the stakes
_punters_stake: map(address, wei_value)
_stake_count: int128
_punter_count: int128
_contract_store: map(bytes32, bytes32)


# Open a simple leger  
# contract cafe address `_contract_cafe`
# leger owner address `_leger_owner`
# the owner_stake decimal `_owner_stake`.
@public
@payable
def __init__(_leger_owner: address,  _starting_odds: decimal):
    assert _leger_owner != ZERO_ADDRESS, "the cafe's address must be given"
    assert _starting_odds > 0.1, "must give some decent starting odds"
    self.leger_owner = _leger_owner
    self.leger_opened_at = block.timestamp
    self.current_odds = _starting_odds
    self.contract_cafe = msg.sender




@constant
@private
def _calculate_cut(stake: wei_value) -> wei_value:
    return  convert(convert(stake,decimal) * CUT, uint256)


@constant
@private
def _calculate_odds(stake: wei_value) -> decimal:
    return self.current_odds

@constant
@private
def _calculate_outcome(is_heads: bool) -> bool:
    return is_heads


@constant
@private
def _calculate_payout(stake: wei_value) -> wei_value:
    return convert(self.current_odds, uint256) * stake 


@private
def _process_bet(punter_address: address, stake: wei_value):
    assert punter_address != ZERO_ADDRESS, "must give punters address"
    assert stake > 0, "stack must be greater than zero"

    assert not self._event_ended, "event must be not be over"
    assert not self._leger_closed, "the leger has to be open for bets"
    assert self._taking_bids, "book is not taking bids"
    # Check if betis high enough
   
    # # Track the refund for the previous high better
    assert self.owner_stake > stake, "bet cannot be covered"
    assert self.current_odds > 0.0, "Cannot offer any odds"

    pay_out: wei_value =   self._calculate_payout(stake)
    cafe_cut: wei_value =   self._calculate_cut(stake)
    bet_cost: wei_value = pay_out + cafe_cut
    new_total_to_pay: wei_value = self._total_to_pay  + bet_cost
 

    assert self.owner_stake > new_total_to_pay, "bet cannot be covered"

    self._the_leger[self._stake_count]  = Stake({
            punter_address:  punter_address, 
            stake: stake, 
            odds: self.current_odds, 
            payout: pay_out + stake,
            realized: False
            })
    if self._punters_stake[punter_address] == 0:
        self._punter_count +=1
        self._punters_stake[punter_address] = stake
    else:
        self._punters_stake[punter_address] += stake
    
    
    self._stake_count += 1
    self._cafe_fees += cafe_cut
    self._total_to_pay = new_total_to_pay
    self._total_at_stake += stake
    self.current_odds = self._calculate_odds(new_total_to_pay)




@private
def _process_payout():
    assert self._event_ended, "payout only after event end"
    # send(self.contract_cafe, self._cafe_fees) # pay the Contract Cafe it's cut
    stake_start: int128 = 0
    stake_count: int128 = self._stake_count
    if self._will_payout: 
        for i in range(0, PUNTER_LIMIT):
            if i >= self._stake_count:
                break
            assert self.balance > 0, "error balance"
            assert self._the_leger[i].payout == 500, "error _the_leger[i].payout"
            assert self._the_leger[i].punter_address != ZERO_ADDRESS, "punter_address ERROR"
            assert self.balance > 500, "balance ERROR"
            send(self._the_leger[i].punter_address, self._the_leger[i].payout)
            self.owner_stake -= self._the_leger[i].payout
            clear(self._punters_stake[self._the_leger[i].punter_address])
            clear(self._the_leger[i])
    send(self.leger_owner, self.balance -  self._cafe_fees)
    self._paidout = True

@payable
@public
def __default__():
    if msg.sender == self.leger_owner:
        assert msg.value > 0, "Leger owner has to load some wei"
        self.owner_stake += msg.value
        self._taking_bids = True
    else:
        self._process_bet(msg.sender, msg.value)
    log.Payment(msg.value, msg.sender)

@public
@payable
def add_to_pot():
    assert msg.value > 0, "Punter's bet must be more than zero"
    assert msg.sender == self.leger_owner, "only leger owner"
    assert msg.sender != self.contract_cafe, "only a punter can bet"
    self.owner_stake += msg.value
    self._taking_bids = True
    log.Payment(msg.value, msg.sender)


@public
@payable
def bet():
    assert msg.value > 0, "Punter's bet must be more than zero"
    assert msg.sender != self.leger_owner, "only a punter can bet"
    assert msg.sender != self.contract_cafe, "only a punter can bet"
    self._process_bet(msg.sender, msg.value)
    log.Payment(msg.value, msg.sender)


@public
def close_leger():
    assert msg.sender == self.contract_cafe, "only contract cafe can invoke this method"
    self._leger_closed = True

@public
def end_event():
    assert msg.sender == self.contract_cafe, "only contract cafe can invoke this method"
    self._leger_closed = True
    self._event_ended = True

@public
def payout():
    assert msg.sender == self.contract_cafe, "only contract cafe can invoke this method"
    self._process_payout()
    selfdestruct(self.contract_cafe)

@constant
@public
def has_event_ended() -> bool:
    return self._event_ended

@constant
@public
def is_leger_closed() -> bool:
    return self._leger_closed

@constant
@public
def have_paidout() -> bool:
    return self._paidout

@constant
@public
def get_cafe_fees() -> wei_value:
    return self._cafe_fees

@constant
@public
def get_punter_count() -> int128:
    return self._punter_count
   
@constant
@public
def get_punters_stake(punter_address: address) -> wei_value:
    assert punter_address != ZERO_ADDRESS, "must be gievn a valid address"
    return self._punters_stake[punter_address]

@constant
@public
def get_stake_count()-> int128:
    return self._stake_count    

@constant
@public
def get_total_to_pay() -> wei_value:
    return self._total_to_pay

@constant
@public
def get_total_at_stake() -> wei_value:
    return self._total_at_stake

@constant
@public
def will_payout() -> bool:
    return self._will_payout



 



# 
# def on_tick(
#             _timestamp: timestamp,
#             _product_id: string[16],
#             _price: decimal,
#             _side: string[1],
#             _last_size: decimal,
#             _best_bid: decimal,
#             _best_ask: decimal):

#     if self._calculate_outcome(_timestamp, _product_id, _price, _side, _last_size, _best_bid, _best_ask):
#         self._will_payout = True

@public
def on_flip(heads: bool):
    assert msg.sender == self.contract_cafe, "only contract cafe can invoke this method"
    if self._calculate_outcome(heads):
        self._will_payout = True
