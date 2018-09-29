const { Client } = require('coinbase')
const { text } = require('micro')
const { promisify } = require('util')

const client = new Client({
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET
})

const verify = async req => {
  return client.verifyCallback(await text(req), req.headers['cb-signature'])
}

const promisifyObj = method => (obj, ...args) =>
  promisify(obj[method]).bind(obj)(...args)

const promisified = [
  'getAccount',
  'getPaymentMethods',
  'sell',
  'getAccounts',
  'withdraw',
  'getTransaction'
].reduce(
  (fns, fnName) => Object.assign(fns, { [fnName]: promisifyObj(fnName) }),
  new Object()
)

const getPaymentMethod = async (type, client) => {
  const pms = await promisified.getPaymentMethods(client, {})
  for (pm of pms) {
    if (pm.type == type) {
      return pm
    }
  }
}

const getFiatPaymentMethod = getPaymentMethod.bind(client, 'fiat_account')
const getSepaPaymentMethod = getPaymentMethod.bind(client, 'sepa_bank_account')

const getEURAccount = async client => {
  const accounts = await promisified.getAccounts(client, {})
  for (account of accounts) {
    if ((account.currency = 'EUR')) {
      return account
    }
  }
}

module.exports = Object.assign(
  {
    verify,
    client,
    getFiatPaymentMethod,
    getSepaPaymentMethod,
    getEURAccount
  },
  promisified
)
