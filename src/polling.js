const { client, getTransaction, getAccount } = require('./client')

const delay = 30000
const polls = {}

const doPollTransaction = async (accountId, transactionId, cb) => {
  const account = await getAccount(client, accountId)
  const transaction = await getTransaction(account, transactionId)
  switch (transaction.status) {
    case 'completed':
      if (!transaction.network || transaction.network.status == 'confirmed') {
        try {
          cb(transaction)
        } catch (err) {
          console.log(err)
        } finally {
          clearInterval(polls[transaction.id])
        }
      }
      break
    case 'failed':
    case 'expired':
    case 'canceled':
      clearInterval(polls[transaction.id])
  }
  return null
}

const pollTransaction = async (accountId, transactionId, cb) => {
  polls[transactionId] = setInterval(
    () => doPollTransaction(accountId, transactionId, cb),
    delay
  )
  await doPollTransaction(accountId, transactionId, cb)
}

module.exports = {
  pollTransaction,
  doPollTransaction
}
