const {
  client,
  verify,
  getAccount,
  sell,
  getPaymentMethods,
  getFiatPaymentMethod,
  getSepaPaymentMethod,
  getEURAccount,
  withdraw
} = require('./client')
const { pollTransaction } = require('./polling')
const { send, json } = require('micro')

const sellPayment = async transaction => {
  const { amount, currency } = transaction.amount
  const fiatPM = await getFiatPaymentMethod(client)
  return sell(transaction.account, {
    amount,
    currency,
    payment_method: fiatPM.id
  })
}

const handlePayment = async event => {
  const { transaction } = event.additional_data
  return pollTransaction(event.account.id, transaction.id, sellPayment)
}

const handleSell = async event => {
  const { amount, currency } = event.data.total
  const account = await getEURAccount(client)
  const bankPM = await getSepaPaymentMethod(client)
  return withdraw(account, { amount, currency, payment_method: bankPM.id })
}

const handle = async event => {
  switch (event.type) {
    case 'wallet:addresses:new-payment':
      return await handlePayment(event)
    case 'wallet:sells:completed':
      return await handleSell(event)
    case 'ping':
      return 'pong'
  }
  return null
}

module.exports = async (req, res) => {
  if (!await verify(req)) {
    send(res, 401)
  }
  try {
    send(res, 200, await handle(await json(req)))
  } catch (e) {
    send(res, 500, e.toString())
  }
}
