/* global assert, it, artifacts, contract, before */

/**
 * DCORP initiation tests
 *
 * Test the creation of an account through DCORP
 *
 * #created 20/02/2018
 * #author Frank Bonnet
 */

// Artifacts
var Airdropper = artifacts.require('DCorpAirdropper')
var Token = artifacts.require('MockToken')

// Tools
var BigNumber = require('bignumber.js')
var Web3Factory = require('../modules/web3_factory')
var Promise = require("bluebird");

// Modules
var web3 = Web3Factory.create({testrpc: true})

// Config
var _config = require('../config')
var config = _config.networks.test

contract('Airdrop', function (accounts) {
  // Contracts
  let airdropInstance
  let tokenInstance

  // Settings
  let tokenDecimals = 8

  before(async function () {
    airdropInstance = await Airdropper.deployed()
    tokenInstance = await Token.new('Mock token 1', 'MTK1', tokenDecimals, false)
  })

  it('owner can perform airdrop', async function () {
    // Arrange
    let owner = accounts[0]
    let recipients = [
      {account: accounts[1], amount: 100 * Math.pow(10, tokenDecimals)},
      {account: accounts[2], amount: 10 * Math.pow(10, tokenDecimals)},
      {account: accounts[3], amount: 992 * Math.pow(10, tokenDecimals)},
      {account: accounts[5], amount: 3669 * Math.pow(10, tokenDecimals)},
      {account: accounts[7], amount: 1 * Math.pow(10, tokenDecimals)}
    ]

    let total = recipients.reduce(
      (sum, i) => { return sum + i.amount}, 0)

    let balancesBefore = await Promise.map(recipients, async (element) => {
      return new BigNumber(await tokenInstance.balanceOf.call(element.account))
    })

    await tokenInstance.setBalance(
      airdropInstance.address, total)

    // Act
    await airdropInstance.drop(
      tokenInstance.address, 
      recipients.map(element => element.account), 
      recipients.map(element => element.amount))

    let balancesAfter = await Promise.map(recipients, async (element) => {
      return new BigNumber(await tokenInstance.balanceOf.call(element.account))
    })

    // Assert
    balancesBefore.map((balance, i) => {
      let expected = balancesAfter[i].sub(recipients[i].amount)
      assert.isTrue(balance.eq(expected), 'Balance ' + i + ' not increased correctly')
    })
  })
})
