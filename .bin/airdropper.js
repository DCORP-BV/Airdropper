import {default as truffle} from '../truffle'
import {default as config} from '../config'
import {default as yargs} from 'yargs'
import {default as contract} from 'truffle-contract'
import {default as Web3} from 'web3'
import {default as AirdropService} from '../services/airdrop_service'

// Artifacts
const Airdropper = contract(require('../build/contracts/DCorpAirdropper.json'))
const Token = contract(require('../build/contracts/IToken.json'))

// Defaults
const DEFAULT_NETWORK = 'test'
const DEFAULT_PATH = './data'

// Arguments
let args = yargs
  .command('drop', 'Airdrop tokens', (yargs) => {
    return yargs.option('network', {
      description: 'Network',
      alias: 'n',
      default: DEFAULT_NETWORK
    })
    .option('token', {
      description: 'The address of the token contract',
      alias: 't',
      type: 'string'
    })
    .demand(['token'])
  })
  .help()
  .usage('Usage: $0 [command] [options]')

let { argv } = args
if (argv._.length === 0) {
  args.showHelp()
}

// Commands
let command = argv._[0]
if (command === 'drop') {
  (async () => {
    let {network, token} = argv

    let provider = new Web3.providers.HttpProvider(
      `http:\/\/${truffle.networks[network].host}:${truffle.networks[network].port}`)
    let web3 = new Web3(provider)

    Airdropper.setProvider(web3.currentProvider)
    Token.setProvider(web3.currentProvider)
    if (truffle.networks[network].from) {
      web3.eth.defaultAccount = truffle.networks[network].from
      Token.defaults({
        from: truffle.networks[network].from
      })
      Airdropper.defaults({
        from: truffle.networks[network].from,
        gas: truffle.networks[network].gas
      })
    }
    
    let airdropperInstance = await fixTruffleContractCompatibilityIssue(Airdropper).deployed()
    let tokenInstance = Token.at(token)
    let service = new AirdropService(
      DEFAULT_PATH + '/' + network, DEFAULT_PATH + '/' + network + '/logs', airdropperInstance, tokenInstance, {verbose: true})

    await service.drop(config.networks[network].airdrop.max)
  })()
}

// Workaround for a compatibility issue between web3@1.0.0-beta.33 and truffle-contract@3.0.3
// https://github.com/trufflesuite/truffle-contract/issues/57#issuecomment-331300494
function fixTruffleContractCompatibilityIssue(contract) {
  if (typeof contract.currentProvider.sendAsync !== "function") {
      contract.currentProvider.sendAsync = function() {
          return contract.currentProvider.send.apply(
              contract.currentProvider, arguments
          );
      };
  }
  return contract;
}
