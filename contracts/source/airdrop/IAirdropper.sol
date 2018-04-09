pragma solidity ^0.4.19;

import "../token/IToken.sol";

/**
 * IAirdropper
 *
 * #created 29/03/2018
 * #author Frank Bonnet
 */
interface IAirdropper {

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
    function drop(IToken _token, address[] _recipients, uint[] _values) public;
}