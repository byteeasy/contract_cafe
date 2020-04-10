pragma solidity >0.6.4 <0.7.0;

import "./LedgerAbstraction.sol";

/** @title A simple Heads/Tails Ledger. Working with an open event*/
contract HeadsOrTailsLedger is Ledger {

  constructor (address payable _contract_cafe, uint  _starting_odds)  Ledger (_contract_cafe, _starting_odds) payable public {}

  /// @dev Cprocesses the event and returns an outcome , if one.
  /// @param _event the even in bytes32 encoding.
  /// @return Returns one of three Outcomes Won on "HEADS", Lost on "TAILS", otherwise Pending}.
  function calculate_outcome(bytes memory _event)  internal override returns (Outcomes)  {
      bytes32  encoded_event = keccak256(abi.encodePacked(abi.decode(_event, (string))));
      if (encoded_event == HEADS) {
          // emit Msg("EVENT");
          return Outcomes.Won;
      } else  if (encoded_event == TAILS ) {
          return Outcomes.Lost;
      } else {
          return Outcomes.Pending;
      }
  }
  bytes32 public constant HEADS = keccak256(abi.encodePacked("HEADS")); // 45046 - 44814 - 39745
  bytes32 public constant TAILS = keccak256(abi.encodePacked("TAILS")); // 45046 - 44814 - 39745
}


