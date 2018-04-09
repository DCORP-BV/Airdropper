pragma solidity ^0.4.19;

import "./airdrop/Airdropper.sol";
import "./token/retriever/TokenRetriever.sol";

/**
 * DCorp Airdropper 
 *
 * Transfer tokens to multiple accounts at once
 *
 * #created 27/03/2018
 * #author Frank Bonnet
 */
contract DCorpAirdropper is Airdropper, TokenRetriever {

    /**
     * Failsafe mechanism
     * 
     * Allows the owner to retrieve tokens (other than DRPS and DRPU tokens) from the contract that 
     * might have been send there by accident
     *
     * @param _tokenContract The address of ERC20 compatible token
     */
    function retrieveTokens(address _tokenContract) public only_owner {
        super.retrieveTokens(_tokenContract);
    }


    // Do not accept ether
    function () public payable {
        revert();
    }
}