pragma solidity ^0.4.19;

import "./IAirdropper.sol";
import "../token/IToken.sol";
import "../../infrastructure/ownership/TransferableOwnership.sol";

/**
 * Airdropper 
 *
 * Transfer tokens to multiple accounts at once
 *
 * #created 29/03/2018
 * #author Frank Bonnet
 */
contract Airdropper is TransferableOwnership {

    /**
     * Airdrop tokens
     *
     * Transfers the appropriate `_token` value for each recipient 
     * found in `_recipients` and `_values` 
     *
     * @param _token Token contract to send from
     * @param _recipients Receivers of the tokens
     * @param _values Amounts of tokens that are transferred
     */
    function drop(IToken _token, address[] _recipients, uint[] _values) public only_owner {
        for (uint i = 0; i < _values.length; i++) {
            _token.transfer(_recipients[i], _values[i]);
        }
    }
}