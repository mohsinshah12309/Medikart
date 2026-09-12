/**
 * Customer Model — Customer Authentication & Account Management.
 *
 * Fields:
 *   name          - customer full name
 *   email         - unique login identifier (lowercase, trimmed)
 *   passwordHash  - bcrypt hash; NEVER store or log plaintext passwords
 *   phone         - optional contact phone number
 *   emailVerified - boolean (required true before login is permitted)
 *   isBlocked     - boolean (administrative lockout flag)
 *
 * Security:
 *   - passwordHash is excluded from all queries by default via `select: false`
 *   - Separate identity table from AdminUser to maintain strict auth isolation
 */

const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
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

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Customer", customerSchema);
