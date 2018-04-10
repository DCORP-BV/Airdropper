require('babel-register')
require('babel-polyfill')

module.exports = {
  networks: {
    test: {
      host: "localhost",
      port: 8545,
      gas: 4500000,
      network_id: "*" // Match any network id
    },
    main: {
      host: "localhost",
      port: 8547,
      network_id: 1, // Official Ethereum network 
      gas: 4500000,
      from: "0xA96Fd4994168bF4A15aeF72142ac605cF45b6d8e"
    }
  },
  solc: {
		optimizer: {
			enabled: true,
			runs: 200
		}
	}
}