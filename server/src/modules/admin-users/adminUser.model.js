/**
 * AdminUser model — Phase 5.
 *
 * Fields:
 *   name          - display name
 *   email         - unique login identifier (lowercase, trimmed)
 *   passwordHash  - bcrypt hash; NEVER store or log plaintext password
 *   role          - "super_admin" | "admin"
 *   permissions   - placeholder array; logic consumed in Phase 20
 *   active        - soft-disable an account without deleting it
 *
 * Security notes (rules.md §3 / Phase 5 spec):
 *   - passwordHash field is excluded from all queries by default via `select: false`
 *   - A Mongoose pre-save hook is NOT used here intentionally — hashing is done
 *     explicitly in the service layer so the data flow is always visible and
 *     testable without side-effects.
 */

const mongoose = require("mongoose");

const adminUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name must be 100 characters or fewer"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    // Never selected by default — callers must explicitly opt-in with .select("+passwordHash")
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: ["super_admin", "admin"],
        message: "Role must be super_admin or admin",
      },
      default: "admin",
    },

    // Placeholder for Phase 20's granular permission system.
    // Stored now so the schema is stable; the service/middleware that reads it
    // comes in Phase 20 — nothing acts on this array yet.
    permissions: {
      type: [String],
      default: [],
    },

    twoFactorSecret: {
      type: String,
      select: false,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);


module.exports = mongoose.model("AdminUser", adminUserSchema);
