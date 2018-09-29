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
const { send, json } = require('micro')

const handlePayment = async event => {
  const { amount, currency } = event.additional_data.amount
  const account = await getAccount(client, event.account.id)
  const fiatPM = await getFiatPaymentMethod(client)
  return sell(account, { amount, currency, payment_method: fiatPM.id })
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
      await handlePayment(event)
    case 'wallet:sells:completed':
      await handleSell(event)
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
