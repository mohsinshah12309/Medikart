const { sanitizeSensitiveData } = require("../../src/utils/sanitizeLog");

describe("Security Log Sanitizer (Sensitive Data Masking)", () => {
  test("1. Redacts passwords, password hashes, and new passwords", () => {
    const input = {
      email: "user@example.com",
      password: "SuperSecretPassword123!",
      passwordHash: "$2b$12$somehashhere",
      newPassword: "NewSecretPassword456!",
    };

    const sanitized = sanitizeSensitiveData(input);
    expect(sanitized.email).toBe("user@example.com");
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.passwordHash).toBe("[REDACTED]");
    expect(sanitized.newPassword).toBe("[REDACTED]");
  });

  test("2. Redacts JWT tokens, refresh tokens, and Authorization bearer headers", () => {
    const input = {
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      refreshToken: "refresh_token_12345",
      authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      headers: {
        authorization: "Bearer secret_jwt_token",
        cookie: "token=jwt_cookie_value",
      },
    };

    const sanitized = sanitizeSensitiveData(input);
    expect(sanitized.token).toBe("[REDACTED]");
    expect(sanitized.refreshToken).toBe("[REDACTED]");
    expect(sanitized.authorization).toBe("[REDACTED]");
    expect(sanitized.headers.authorization).toBe("[REDACTED]");
    expect(sanitized.headers.cookie).toBe("[REDACTED]");
  });

  test("3. Redacts OTPs, 2FA secrets, and verification codes", () => {
    const input = {
      email: "admin@medikart.pk",
      otp: "849201",
      twoFactorSecret: "JBSWY3DPEHPK3PXP",
      verificationCode: "123456",
    };

    const sanitized = sanitizeSensitiveData(input);
    expect(sanitized.email).toBe("admin@medikart.pk");
    expect(sanitized.otp).toBe("[REDACTED]");
    expect(sanitized.twoFactorSecret).toBe("[REDACTED]");
    expect(sanitized.verificationCode).toBe("[REDACTED]");
  });

  test("4. Redacts payment card numbers, CVVs, and API secrets in nested structures", () => {
    const input = {
      orderId: "ORD-1234",
      payment: {
        method: "card",
        cardNumber: "5123450000000008",
        cvv: "100",
        cardExp: "01/36",
      },
      integrations: {
        apiKey: "pk_test_12345",
        apiSecret: "sk_test_67890",
        kuickpay_secret: "kp_sec_999",
      },
    };

    const sanitized = sanitizeSensitiveData(input);
    expect(sanitized.orderId).toBe("ORD-1234");
    expect(sanitized.payment.method).toBe("card");
    expect(sanitized.payment.cardNumber).toBe("[REDACTED]");
    expect(sanitized.payment.cvv).toBe("[REDACTED]");
    expect(sanitized.payment.cardExp).toBe("[REDACTED]");
    expect(sanitized.integrations.apiKey).toBe("[REDACTED]");
    expect(sanitized.integrations.apiSecret).toBe("[REDACTED]");
    expect(sanitized.integrations.kuickpay_secret).toBe("[REDACTED]");
  });
});
