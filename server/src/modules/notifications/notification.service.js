const smtp = require("../../integrations/smtp");

/**
 * Notification Service — Dependency Inversion Principle (DIP) & Open/Closed Principle (OCP).
 *
 * Decouples core application domain logic (orders, auth, OTP, customers) from low-level
 * transport protocols (SMTP, Mailjet API, Brevo Relay, or future SMS/Push notification channels).
 */
class NotificationService {
  constructor() {
    this.channels = new Map();

    // Default Email Channel wired to multi-provider SMTP/API dispatcher
    this.registerChannel("email", {
      send: async (options) => {
        return await smtp.sendEmail({
          to: options.to || options.recipient,
          subject: options.subject,
          text: options.text,
          html: options.html,
          fromName: options.fromName,
          fromEmail: options.fromEmail,
          purpose: options.purpose || "general",
        });
      },
    });
  }

  /**
   * Register a new notification channel (email, sms, whatsapp, push)
   * @param {string} channelName
   * @param {{ send: Function }} provider
   */
  registerChannel(channelName, provider) {
    if (!channelName || !provider || typeof provider.send !== "function") {
      throw new Error("Invalid notification channel registration");
    }
    this.channels.set(channelName.toLowerCase(), provider);
  }

  /**
   * Send notification through specified channel
   * @param {Object} options
   * @param {string} [options.channel='email']
   * @returns {Promise<any>}
   */
  async sendNotification(options) {
    const channelName = (options.channel || "email").toLowerCase();
    const provider = this.channels.get(channelName);
    if (!provider) {
      throw new Error(`Notification channel '${channelName}' is not registered`);
    }
    return await provider.send(options);
  }

  /**
   * Convenience wrapper for email dispatches
   * @param {Object} options
   * @returns {Promise<any>}
   */
  async sendEmail(options) {
    return await this.sendNotification({ ...options, channel: "email" });
  }
}

const notificationService = new NotificationService();

module.exports = notificationService;
module.exports.NotificationService = NotificationService;
