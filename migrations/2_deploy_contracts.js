var truffle = require('../truffle')
var config = require('../config')
var util = require('../modules/util')

// Contracts
var DCorpAirdropper = artifacts.require('DCorpAirdropper')

// Test
var EVM = artifacts.require('EVM')

// Events
var preDeploy = () => Promise.resolve()
var postDeploy = () => Promise.resolve()

const deploy = async function(deployer, network, accounts, config) {

  // Setup
  util.setArtifacts(artifacts)
  util.setAccounts(accounts)

  // Initialization
  if (network == 'develop' || network == 'test') {
    preDeploy = async () => {
      await deployer.deploy(EVM)
    }
  }

  // Pre-init
  await preDeploy()
  
  // Deploy
  await deployer.deploy(DCorpAirdropper)

  // Post-init
  await postDeploy()
}

module.exports = function(deployer, network, accounts) {
  return deployer.then(async () => await deploy(deployer, network, accounts, config.networks[network]))
}
