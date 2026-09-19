/**
 * Pharmacy validation schemas.
 *
 * Enforces strict input validation on pharmacy creation and updates,
 * including bank account number formatting.
 */

const { z } = require("zod");

// Standard MongoDB ObjectId Regex
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Bank Account Number / IBAN Schema (Allows 6-34 digits/alphanumeric characters, strips spaces/dashes)
const accountNumberSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/[\s-]/g, ""))
  .refine((val) => val === "" || (val.length >= 6 && val.length <= 34 && /^[0-9a-zA-Z]+$/.test(val)), {
    message: "Account number must be 6 to 34 alphanumeric characters",
  })
  .optional()
  .nullable();

const createPharmacySchema = z
  .object({
    name: z.string({ required_error: "Pharmacy name is required" }).min(2).max(100).trim(),
    code: z.string({ required_error: "Pharmacy code is required" }).min(2).max(20).trim(),
    contactPerson: z.string().max(100).trim().optional().default(""),
    phone: z.string({ required_error: "Phone number is required" }).min(7).max(25).trim(),
    email: z.string().email("Invalid email address").trim().toLowerCase().optional().or(z.literal("")),
    address: z.string({ required_error: "Address is required" }).min(3).max(300).trim(),
    cityIds: z.array(z.string().regex(objectIdRegex, "Invalid city ID format")).optional().default([]),
    medikartPercentage: z.number().min(0).max(100).optional().default(5),
    accountTitle: z.string().max(100).trim().optional().default(""),
    accountNumber: accountNumberSchema,
    active: z.boolean().optional().default(true),
  })
  .strict();

const updatePharmacySchema = z
  .object({
    name: z.string().min(2).max(100).trim().optional(),
    code: z.string().min(2).max(20).trim().optional(),
    contactPerson: z.string().max(100).trim().optional(),
    phone: z.string().min(7).max(25).trim().optional(),
    email: z.string().email("Invalid email address").trim().toLowerCase().optional().or(z.literal("")),
    address: z.string().min(3).max(300).trim().optional(),
    cityIds: z.array(z.string().regex(objectIdRegex, "Invalid city ID format")).optional(),
    medikartPercentage: z.number().min(0).max(100).optional(),
    accountTitle: z.string().max(100).trim().optional(),
    accountNumber: accountNumberSchema,
    active: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

const pharmacyIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid pharmacy ID format"),
});

module.exports = {
  createPharmacySchema,
  updatePharmacySchema,
  pharmacyIdParamSchema,
};
