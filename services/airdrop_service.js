/**
 * Airdrop service

 * #created 05/04/2018
 * #author Frank Bonnet
 */

// Tools
var fs = require('fs-extra')

export default class {
    constructor (dataPath, logPath, airdropper, token, flags = {}) {
        this.airdropper = airdropper
        this.token = token
        this.logFile = logPath + '/' + token.address + '.json'
        this.dataFile = dataPath + '/' + token.address + '.json'
        this.flags = Object.assign({verbose: false}, flags)
    }

    async drop (max, options = {}) {
        // Create log file
        if (!fs.existsSync(this.logFile)) {
            let data = await this.readDataAsync()
            data.forEach((val, i) => {
                data[i].status = 0
                data[i].timestamp = 0
            })

            await this.writeLogAsync(data)
        }

        let getDataTask = this.readDataAsync()
        let getLogTask = this.readLogAsync()

        let data = await getDataTask
        let log = await getLogTask

        // Make sure log matches data file
        if (data.length !== log.length) throw 'data-log mismatch 1'

        let i = 0, n = 0
        let canidates = []
        while (n < max && i < log.length) {
            if (log[i].status == 0) {
                canidates.push(Object.assign({}, log[i], {ref: i}))
                n++
            }

            i++
        }

        if (canidates.length === 0) {
            if (this.flags.verbose === true) {
                console.log('Aborting because there is nothing to drop')
            }

            return
        }

        if (this.flags.verbose === true) {
            console.log('Dropping tokens on ' + canidates.length + ' canidate(s)')
        }

        let availableAmount = await this.token.balanceOf.call(this.airdropper.address)
        let requiredAmount = canidates.reduce((sum, val) => sum + val.amount, 0) 

        // Make sure we have enough tokens
        if (!availableAmount.gte(requiredAmount)) 
            throw requiredAmount.toString() + ' tokens required while there are ' + availableAmount.toString() + ' tokens available'

        // Create tx
        await this.airdropper.drop(
            this.token.address, canidates.map(val => val.account), canidates.map(val => val.amount), options)

        // Update log
        canidates.forEach((val, i) => {
            log[val.ref].status = 1
            log[val.ref].timestamp = Date.now()
        })

        await this.writeLogAsync(log)

        if (this.flags.verbose === true) {
            console.log('Transaction succeeded')
        }
    }

    async readDataAsync () {
        return JSON.parse(
            await fs.readFile(this.dataFile, 'utf8'))
    }

    async readLogAsync () {
        return JSON.parse(
            await fs.readFile(this.logFile, 'utf8'))
    }

    async writeLogAsync(data) {
        return await fs.writeFile(
            this.logFile, JSON.stringify(data, null, 2), 'utf8')
    }
}