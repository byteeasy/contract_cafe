pragma solidity ^0.6.0;

interface LedgerInterface {


event Deposit(address indexed from,  uint value);
event Payout(address indexed to, uint payout);
event Earning(address indexed to, uint payout);
event Rent(address indexed to, uint payout);
event Bet(address indexed to, uint value);
event Balance(uint value, bool funds, string msg);
event Msg(string msg);

 


// function calculate_outcome(bool outcome_event) external view returns (bool);
function calculate_odds(uint256 stake)  external view returns (uint256);


function add_to_pot () external payable;
function bet () external payable;
function close_ledger() external;
function payout() external;




function has_event_ended() external view returns (bool);
function is_ledger_closed() external view returns (bool);
function have_paid_out() external view returns (bool);
function will_payout() external view returns (bool);
function get_cafe_fees() external view returns (uint256);
function get_punter_count() external view returns (uint);
function get_stake_count() external view returns (uint);
function get_punters_stake(address punter_address) external view returns (uint256);
function get_total_to_pay() external view returns (uint256);
function get_total_at_stake() external view returns (uint256);

}