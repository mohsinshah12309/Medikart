const kuickpayGateway = require('./providers/kuickpay.provider');

/**
 * Payment Gateway Registry & Factory (OCP & LSP compliant)
 * Allows adding new payment gateways (JazzCash, Easypaisa, Safepay)
 * without modifying checkout or order-processing logic.
 */
class PaymentGatewayFactory {
  constructor() {
    this.gateways = new Map();
    // Register default providers
    this.registerGateway('kuickpay', kuickpayGateway);
    this.registerGateway('card', kuickpayGateway);
  }

  /**
   * Register a concrete payment gateway implementing BasePaymentGateway
   * @param {string} name 
   * @param {BasePaymentGateway} gatewayInstance 
   */
  registerGateway(name, gatewayInstance) {
    if (!name || typeof name !== 'string') {
      throw new Error('Gateway name must be a non-empty string');
    }
    this.gateways.set(name.toLowerCase(), gatewayInstance);
  }

  /**
   * Resolves payment gateway by name or falls back to default
   * @param {string} [name='kuickpay'] 
   * @returns {BasePaymentGateway}
   */
  getGateway(name = 'kuickpay') {
    const key = (name || 'kuickpay').toLowerCase();
    const gateway = this.gateways.get(key) || this.gateways.get('kuickpay');
    if (!gateway) {
      throw new Error(`Payment gateway '${name}' is not configured or available`);
    }
    return gateway;
  }

  /**
   * List all registered gateways
   * @returns {string[]}
   */
  getSupportedGateways() {
    return Array.from(this.gateways.keys());
  }
}

const paymentGatewayFactory = new PaymentGatewayFactory();

module.exports = paymentGatewayFactory;
module.exports.PaymentGatewayFactory = PaymentGatewayFactory;
