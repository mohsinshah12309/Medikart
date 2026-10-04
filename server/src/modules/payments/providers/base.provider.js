/**
 * Base Payment Gateway Interface / Abstract Class
 * Follows OCP (Open/Closed Principle) & LSP (Liskov Substitution Principle).
 * All concrete payment providers (Kuickpay, Safepay, JazzCash, Easypaisa) must inherit and implement these methods.
 */
class BasePaymentGateway {
  constructor(name) {
    if (new.target === BasePaymentGateway) {
      throw new TypeError("Cannot construct BasePaymentGateway instances directly");
    }
    this.name = name;
  }

  /**
   * Returns gateway identifier
   */
  getName() {
    return this.name;
  }

  /**
   * Initiates payment / checkout session
   * @param {Object} order - Medikart Order document
   * @returns {Promise<{ redirectUrl: string, transactionId: string, environment?: string, isHosted?: boolean }>}
   */
  async initiateCharge(order) {
    throw new Error(`initiateCharge() not implemented for gateway ${this.name}`);
  }

  /**
   * Verifies transaction status with gateway API
   * @param {string} transactionId
   * @returns {Promise<{ status: 'paid' | 'failed' | 'pending', transactionId: string, gatewayResponse: any }>}
   */
  async verifyTransaction(transactionId) {
    throw new Error(`verifyTransaction() not implemented for gateway ${this.name}`);
  }

  /**
   * Verifies authenticity / cryptographic signature of webhook
   * @param {Object} req - Express request object
   * @returns {boolean}
   */
  verifyWebhookSignature(req) {
    throw new Error(`verifyWebhookSignature() not implemented for gateway ${this.name}`);
  }

  /**
   * Generates webhook signature (for testing / simulation)
   * @param {Object|string} payload
   * @param {string} [secret]
   * @returns {string}
   */
  generateWebhookSignature(payload, secret) {
    throw new Error(`generateWebhookSignature() not implemented for gateway ${this.name}`);
  }
}

module.exports = BasePaymentGateway;
