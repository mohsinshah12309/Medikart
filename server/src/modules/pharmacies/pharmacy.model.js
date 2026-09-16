const mongoose = require("mongoose");

const pharmacySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true, uppercase: true },
    contactPerson: { type: String, trim: true, default: "" },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    address: { type: String, required: true, trim: true },
    cityIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
      },
    ],
    medikartPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    accountNumberEncrypted: {
      type: String,
      select: false, // Never returned by default queries
      default: null,
    },
    accountNumberLast4: {
      type: String,
      default: null,
      trim: true,
    },
    active: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Pharmacy", pharmacySchema);
