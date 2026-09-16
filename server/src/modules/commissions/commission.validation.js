/**
 * Commission validation schemas.
 */

const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const submitPaymentSchema = z
  .object({
    pharmacyId: z
      .string({ required_error: "Pharmacy ID is required" })
      .regex(objectIdRegex, "Invalid pharmacy ID format"),
    amount: z.coerce
      .number({ required_error: "Payment amount is required" })
      .min(1, "Amount must be at least PKR 1"),
    screenshotUrl: z.string().min(1).optional(),
    periodFrom: z.coerce.date({ required_error: "Period start date is required" }),
    periodTo: z.coerce.date({ required_error: "Period end date is required" }),
    paidOnDate: z.coerce.date({ required_error: "Payment date is required" }),
    notes: z.string().max(1000).optional().default(""),
  })
  .strict();

const rejectPaymentSchema = z
  .object({
    rejectionReason: z
      .string({ required_error: "Rejection reason is required" })
      .min(3, "Rejection reason must be at least 3 characters")
      .max(500, "Rejection reason cannot exceed 500 characters")
      .trim(),
  })
  .strict();

const paymentIdParamSchema = z.object({
  paymentId: z.string().regex(objectIdRegex, "Invalid payment ID format"),
});

const pharmacyIdParamSchema = z.object({
  pharmacyId: z.string().regex(objectIdRegex, "Invalid pharmacy ID format"),
});

module.exports = {
  submitPaymentSchema,
  rejectPaymentSchema,
  paymentIdParamSchema,
  pharmacyIdParamSchema,
};
