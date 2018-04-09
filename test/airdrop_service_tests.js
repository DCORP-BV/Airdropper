/* global assert, it, artifacts, contract, before */

/**
 * DCORP initiation tests
 *
 * Test the creation of an account through DCORP
 *
 * #created 20/02/2018
 * #author Frank Bonnet
 */

// Classes
import {default as AirdropService} from '../services/airdrop_service'

// Artifacts
var Token = artifacts.require('MockToken')
var Airdropper = artifacts.require('DCorpAirdropper')

// Tools
var BigNumber = require('bignumber.js')
var Web3Factory = require('../modules/web3_factory')
var Promise = require("bluebird")

// Modules
var util = require('../modules/util')
var web3 = Web3Factory.create({testrpc: true})
var fs = require('fs-extra')

// Config
var _config = require('../config')
var config = _config.networks.test

contract('Airdrop Service', function (accounts) {
  // Contracts
  let tokenInstance
  let airdropperInstance

  // Others
  let airdropServiceInstance

  // Settings
  let tokenDecimals = 8
  let dataPath = './temp'
  let logPath = './temp/logs'
  let recipients = [
    {account: accounts[1], amount: 100 * Math.pow(10, tokenDecimals)},
    {account: accounts[2], amount: 10 * Math.pow(10, tokenDecimals)},
    {account: accounts[3], amount: 992 * Math.pow(10, tokenDecimals)},
    {account: accounts[5], amount: 3669 * Math.pow(10, tokenDecimals)},
    {account: accounts[7], amount: 999 * Math.pow(10, tokenDecimals)},
    {account: accounts[6], amount: 3669 * Math.pow(10, tokenDecimals)},
    {account: accounts[4], amount: 100000 * Math.pow(10, tokenDecimals)}
  ]

  before(async function () {
    // Clean up dirs
    await fs.emptyDir(logPath)
    await fs.emptyDir(dataPath)
  })

  beforeEach(async function () {
    tokenInstance = await Token.new('Mock token 1', 'MTK1', tokenDecimals, false)
    airdropperInstance = await Airdropper.deployed()

    // Ensure dirs are there
    await fs.ensureDir(dataPath)
    await fs.ensureDir(logPath)

    await fs.writeFile(
      dataPath + '/' + tokenInstance.address + '.json', JSON.stringify(recipients, null, 2), 'utf8')

    airdropServiceInstance = new AirdropService(
      dataPath, logPath, airdropperInstance, tokenInstance)
  })

  it('owner cannot perform airdrop when token balance is insufficient', async function () {
    // Arrange
    let owner = accounts[0]
    let total = recipients.reduce(
      (sum, val) => sum + val.amount, 0)

    let balancesBefore = await Promise.map(recipients, async (element) => {
      return new BigNumber(await tokenInstance.balanceOf.call(element.account))
    })

    await tokenInstance.setBalance(
      airdropperInstance.address, total - 1)

    // Act
    try {
      await airdropServiceInstance.drop(
        recipients.length, {from: owner})
      assert.isFalse(true, 'Error should have been thrown')
    } catch (error) {
      // Expected
    }

    let balancesAfter = await Promise.map(recipients, async (element) => {
      return new BigNumber(await tokenInstance.balanceOf.call(element.account))
    })

    // Assert
    balancesBefore.map((val, i) => {
      let expected = balancesAfter[i] // Unchanged
      assert.isTrue(val.eq(expected), 'Balance ' + i + ' increased')
    })
  })

  it('non owner cannot perform airdrop', async function () {
    // Arrange
    let other = accounts[1]
    let total = recipients.reduce(
      (sum, val) => sum + val.amount, 0)

    let balancesBefore = await Promise.map(recipients, async (element) => {
      return new BigNumber(await tokenInstance.balanceOf.call(element.account))
    })

    await tokenInstance.setBalance(
      airdropperInstance.address, total)

    // Act
    try {
      await airdropServiceInstance.drop(
        recipients.length, {from: other})
      assert.isFalse(true, 'Error should have been thrown')
    } catch (error) {
      util.errors.throws(error, 'Should not drop')
    }

    let balancesAfter = await Promise.map(recipients, async (element) => {
      return new BigNumber(await tokenInstance.balanceOf.call(element.account))
    })

    // Assert
    balancesBefore.map((val, i) => {
      let expected = balancesAfter[i] // Unchanged
      assert.isTrue(val.eq(expected), 'Balance ' + i + ' increased')
    })
  })

  it('owner can perform airdrop', async function () {
    // Arrange
    let owner = accounts[0]
    let total = recipients.reduce(
      (sum, val) => sum + val.amount, 0)

    let balancesBefore = await Promise.map(recipients, async (element) => {
      return new BigNumber(await tokenInstance.balanceOf.call(element.account))
    })

    await tokenInstance.setBalance(
      airdropperInstance.address, total)

    // Act
    await airdropServiceInstance.drop(
      recipients.length, {from: owner})

    let balancesAfter = await Promise.map(recipients, async (element) => {
      return new BigNumber(await tokenInstance.balanceOf.call(element.account))
    })

    // Assert
    balancesBefore.map((val, i) => {
      let expected = balancesAfter[i].sub(recipients[i].amount)
      assert.isTrue(val.eq(expected), 'Balance ' + i + ' not increased correctly')
    })
  })

  it('owner can perform airdrop in stages', async function () {
    // Arrange
    let owner = accounts[0]

    let i = 0;
    while (i < recipients.length) {
      let canidates = []
      for (let j = 0; j < config.airdrop.max && i < recipients.length; j++) {
        canidates.push(recipients[i])
        i++
      }

      let total = canidates.reduce(
        (sum, val) => sum + val.amount, 0)

      let balancesBefore = await Promise.map(canidates, async (element) => {
        return new BigNumber(await tokenInstance.balanceOf.call(element.account))
      })

      await tokenInstance.setBalance(
        airdropperInstance.address, total)

      // Act
      await airdropServiceInstance.drop(
        config.airdrop.max, {from: owner})

      let balancesAfter = await Promise.map(canidates, async (element) => {
        return new BigNumber(await tokenInstance.balanceOf.call(element.account))
      })

      // Assert
      balancesBefore.map((val, i) => {
        let expected = balancesAfter[i].sub(canidates[i].amount)
        assert.isTrue(val.eq(expected), 'Balance ' + i + ' not increased correctly')
      })
    }
  })

  it('owner can resume airdrop', async function () {
    // Arrange
    let owner = accounts[0]
    let firstRound = config.airdrop.max
    let total = recipients.reduce(
      (sum, val) => sum + val.amount, 0)

    // First round
    await tokenInstance.setBalance(airdropperInstance.address, total)
    await airdropServiceInstance.drop(firstRound, {from: owner}) 

    let balancesBefore = await Promise.map(recipients, async (element) => {
      return new BigNumber(await tokenInstance.balanceOf.call(element.account))
    })

    let i = 0;
    while (i < recipients.length) {
      // Act
      await airdropServiceInstance.drop(
        config.airdrop.max, {from: owner})

      i = i + config.airdrop.max
    }

    let balancesAfter = await Promise.map(recipients, async (element) => {
      return new BigNumber(await tokenInstance.balanceOf.call(element.account))
    })

    // Assert
    balancesBefore.map((val, i) => {
      let expected = i < firstRound ? balancesBefore[i] : balancesAfter[i].sub(recipients[i].amount)
      assert.isTrue(val.eq(expected), 'Balance ' + i + ' not increased correctly')
    })
  })
})
