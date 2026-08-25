const kuickpayProvider = require('./providers/kuickpay.provider');

const initiateCharge = async (order) => {
  return await kuickpayProvider.initiateCharge(order);
};

const verifyTransaction = async (transactionId) => {
  return await kuickpayProvider.verifyTransaction(transactionId);
};

module.exports = {
  initiateCharge,
  verifyTransaction
};
