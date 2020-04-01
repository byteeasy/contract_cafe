pragma solidity >=0.4.11 <0.7.0;




contract Ledger {


	event Deposit(address indexed from,  uint value);
	event Payout(address indexed to, uint payout);
  event Earning(address indexed to, uint payout);
  event Rent(address indexed to, uint payout);
	event Bet(address indexed to, uint value);
  event Balance(uint value, bool funds, string msg);
  event Msg(string msg);

  struct Stake {
    address punter_address;
    uint256 amount; // wei
    uint256 odds; // decimal
    uint256 payout; // wei
    bool realized;
}


struct Punter {
    uint256 stake; // wei
    uint256 payout; // wei
    uint indx;
}


uint256 constant public CAFE_CUT = 4; // 4%



address  payable public contract_cafe;
address  payable public ledger_owner  = msg.sender;


uint256 public current_odds; // as a percent (current_odds * stake)/100
uint256 public owner_stake;  // wei




address payable[] _punter_table_revindex;
mapping (address => Punter) _punter_table; // stakes by punter





function add_to_payout(address payable _punter_address, uint256 _stake, uint256 _payout) private {
   _punter_table[_punter_address].stake = _punter_table[_punter_address].stake + _stake;
   _punter_table[_punter_address].payout = _punter_table[_punter_address].payout + _payout;
  // emit Msg("added payout");
  uint indx = _punter_table[_punter_address].indx;
  if (indx == 0) {
      indx = _punter_table_revindex.length;
      _punter_table_revindex.push(_punter_address);
      _punter_table[_punter_address].indx = indx;
 }
}


function get_payout_by_index(uint indx) internal view returns (address payable _punter_address, uint256 _payout) {
  _punter_address = _punter_table_revindex[indx];
  _payout = _punter_table[_punter_address].payout;
}


function delete_punter(uint indx) private {
  address  _punter_address = _punter_table_revindex[indx];
  delete _punter_table_revindex[indx];
  delete _punter_table[_punter_address];
}



// TODO 
// Timepoint public ledger_opened_at = Timepoint(block.timestamp, block.number); //  timestamp -   when the event has ended
// Timepoint public event_started_at;  //  timestamp -   when the event has ended
// Timepoint public event_ended_at;  //  timestamp -   when the event has ended

bool _event_ended; // marks the events end
bool _ledger_closed; // marks the  end of acceptting bets
bool _will_payout; // only payout after this is set to True
bool _paid_out; // mark the events end
bool _taking_bids; // mark the events end

uint256 _total_to_pay;  // wei_value - the total that the ledger own has to pay if the Outcome is tr
uint256 _total_at_stake;  // wei_value - the total staked by punters
uint256 _cafe_fees;  // wei_value - the total staked by punters

uint _stake_count;
mapping (uint => Stake) _the_ledger; // table of stakes

uint _punter_count;
mapping (address => uint256) _punters_stake; // stakes by punter
uint _vars_count;
mapping (uint => bytes) _contract_vars; // store to be used by the contract for keeping state etc.


constructor (address payable _contract_cafe, uint  _starting_odds) payable public {
    require (_contract_cafe != address(0x0), "the cafe's address must be given");
    require (_starting_odds > 0, "must give some decent starting odds");
    // require (_starting_odds == 400, "_starting_odds != 400");
    require (owner_stake == msg.value, "owner_stake != msg.value");
    contract_cafe = _contract_cafe;
    current_odds = _starting_odds;
}



function add_to_pot () public payable {
    require(msg.value > 0, "Amount  must be more than zero");
    require(msg.sender == ledger_owner, "only ledger owner");
    owner_stake += msg.value;
    // require (_starting_odds == 400, "_starting_odds != 400");
    _taking_bids = true;
}

function bet () public payable {
  require(_taking_bids == true, "not taking bids");
  require(msg.sender != ledger_owner, "the ledger owner cannot bet");
  require(msg.sender != contract_cafe, "the house cannot bet");
  require(msg.value > 0, "bet must be more than zero");
  emit Bet(msg.sender, msg.value);
  _process_bet(msg.sender, msg.value);

}

function close_ledger() public onlyByCafe() {
  _ledger_closed = true;
}

function end_event() public onlyByCafe()   {
  _ledger_closed = true;
  _event_ended = true;
}


function payout() public  {
  require(_event_ended, "the event has not ended");
  _process_payout();
}

function has_event_ended() public view returns (bool) {
  return _event_ended;
}

function is_ledger_closed() public view returns (bool) {
  return _ledger_closed;
}

function have_paid_out() public view returns (bool) {
  return _paid_out;
}

function will_payout() public view returns (bool) {
  return _will_payout;
}

function get_cafe_fees() public view returns (uint256) {
  return _cafe_fees;
}

function get_punter_count() public view returns (uint) {
  return _punter_count;
}

function get_stake_count() public view returns (uint) {
  return _stake_count;
}

function get_punters_stake(address punter_address) public view returns (uint256) {
  require (punter_address != address(0x0), "must be gievn a valid address");
  return _punters_stake[punter_address];
}

function get_total_to_pay() public view returns (uint256) {
  return _total_to_pay;
}


function get_total_at_stake() public view returns (uint256) {
  return _total_at_stake;
}



function force_outcome(bool outcome) public {
  require(msg.sender == contract_cafe, "only contract cafe can invoke this method");
  _will_payout = _calculate_outcome(outcome);
  _ledger_closed = true;
  _event_ended = true;
}


function _process_bet(address payable punter_address, uint256 stake) private {
    require(punter_address != address(0x0), must_give_punters_address_msg);
    require(stake > 0, stake_must_be_greater_than_zero_msg);

    require(_event_ended == false, event_must_not_be_over_msg);
    require(_ledger_closed == false, the_ledger_has_to_be_open_for_bets_msg);
    require(_taking_bids == true, book_is_not_taking_bids_msg);
    // require(owner_stake > stake, bet_cannot_be_covered_msg);
    require(current_odds > 0.0, cannot_offer_any_odds_msg);

    uint256 pay_out = _calculate_payout(stake);
    // require(pay_out == 400, "pay_out != 400");
    uint256 cafe_cut = _calculate_cut(stake);
    // require(cafe_cut == 4, "cafe_cut != 4");
    uint256 bet_cost = pay_out + cafe_cut;
    // require(bet_cost == 404, "cafe_cut != 404");
    uint256 new_total_to_pay = _total_to_pay + bet_cost;
  
    emit Balance(owner_stake, owner_stake > new_total_to_pay, bet_cannot_be_covered_msg);
    // require(owner_stake > new_total_to_pay, bet_cannot_be_covered_msg);

    _the_ledger[_stake_count] = Stake(punter_address, stake, current_odds,
          pay_out + stake, false);
    add_to_payout(punter_address, stake, pay_out + stake);
    if (_punters_stake[punter_address] == 0) {
            _punter_count += 1;
            _punters_stake[punter_address] = stake;
    } else {
        _punters_stake[punter_address] += stake;
    }
    _stake_count += 1;
    _cafe_fees += cafe_cut;
    _total_to_pay = new_total_to_pay;
   // emit Balance(owner_stake - _total_at_stake);
    _total_at_stake += stake;
    current_odds = _calculate_odds(new_total_to_pay);
}

function _percent_of (uint256 amount, uint256 percent) private view returns (uint256) {
  return (amount * percent)/100;
}

// function _get_timepoint() public view returns (memory Timepoint) {
//   return Timepoint(block.timestamp, block.number);
// }


function _calculate_cut(uint256 stake) private view returns (uint256) {
  // require(stake == 100, "stake != 100");
  // require(CUT == 4, "CUT != 4");
  return _percent_of(stake, CAFE_CUT);
}

function _calculate_odds(uint256 stake) private view returns (uint256) {
  return current_odds;
}

function _calculate_outcome(bool outcome_event) private view returns (bool) {
  return outcome_event;
}

function _calculate_payout(uint256 stake) private view returns (uint256) {
  return _percent_of(stake, current_odds);
}




function _process_payout() internal {
  require(_event_ended == true, event_must_be_over_msg);
  require(_paid_out == false, "already paid out");

  if (_will_payout) {
    _will_payout = false;
    for (uint i = 0; i < _punter_table_revindex.length; i++) {
      (address payable to_address, uint256 to_pay) = get_payout_by_index(i);
        delete_punter(i);
        to_address.transfer(to_pay);
        emit Payout(to_address, to_pay);
    }
  }
  uint256 cafe_fees = _cafe_fees;
  _cafe_fees = 0;
  contract_cafe.transfer(cafe_fees); //+ 0.3 ether));
  emit Payout(contract_cafe, cafe_fees);
  selfdestruct(ledger_owner);
  _paid_out = true;
}

modifier onlyByCafe()
    {
        require(msg.sender == contract_cafe, "only contract cafe can invoke this method");
        _;
    }

modifier onlyBy(address _account)
    {
        require(
            msg.sender == _account,
            "Sender not authorized."
        );
        _;
    }

  modifier costs(uint _amount) {
        require(
            msg.value >= _amount,
            "Not enough Ether provided."
        );
        _;
        if (msg.value > _amount)
            msg.sender.transfer(msg.value - _amount);
    }


  string public constant bet_cannot_be_covered_msg = "bet cannot be covered";
  string public constant must_give_punters_address_msg =  "must give punters address";
  string public constant stake_must_be_greater_than_zero_msg = "stake must be greater than zero";
  string public constant event_must_not_be_over_msg = "event must be not be over";
  string public constant the_ledger_has_to_be_open_for_bets_msg = "the ledger has to be open for bets";
  string public constant book_is_not_taking_bids_msg = "book is not taking bids";
  string public constant cannot_offer_any_odds_msg = "Cannot offer any odds";
  string public constant event_must_be_over_msg = "event must be over msg";

}