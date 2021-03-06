pragma solidity ^0.4.19;

/**
 * Token observer interface
 *
 * Allows a token smart-interface to notify observers 
 * when tokens are received
 *
 * #created 09/10/2017
 * #author Frank Bonnet
 */
interface ITokenObserver {

    /**
     * Called by the observed token smart-interface in order 
     * to notify the token observer when tokens are received
     *
     * @param _from The address that the tokens where send from
     * @param _value The amount of tokens that was received
     */
    function notifyTokensReceived(address _from, uint _value) public;
}
