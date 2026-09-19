const mongoose = require("mongoose");
const { encrypt, decrypt } = require("../../src/services/encryption.service");
const Pharmacy = require("../../src/modules/pharmacies/pharmacy.model");
const pharmacyService = require("../../src/modules/pharmacies/pharmacy.service");

require("dotenv").config();

describe("Pharmacy Bank Account Encryption & Super Admin Reveal", () => {
  jest.setTimeout(60000);

  const superAdmin = {
    id: new mongoose.Types.ObjectId().toString(),
    email: "superadmin@medikart.pk",
    role: "super_admin",
    permissions: [],
  };

  const subAdmin = {
    id: new mongoose.Types.ObjectId().toString(),
    email: "subadmin@medikart.pk",
    role: "admin",
    permissions: ["manage_pharmacies", "view_pharmacies"],
  };

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI is not defined");
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    await Pharmacy.deleteMany({ code: /^MED-/ });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await Pharmacy.deleteMany({ code: /^MED-/ });
  });

  it("should encrypt and decrypt plaintext account numbers with AES-256-GCM correctly", () => {
    const rawAcct = "PK36BAHL0001234567890123";
    const encrypted = encrypt(rawAcct);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(rawAcct);
    expect(encrypted.split(":")).toHaveLength(3);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toEqual(rawAcct);
  });

  it("should create a pharmacy with encrypted account number and extract last 4 digits", async () => {
    const rawAcct = "PK36BAHL0001234567890123";
    const pharmacy = await pharmacyService.createPharmacy({
      name: "MediHealth Branch 1",
      code: "MED-01",
      phone: "+923001234567",
      email: "branch1@medihealth.pk",
      address: "123 Main Boulevard, Lahore",
      accountNumber: rawAcct,
    });

    expect(pharmacy.accountNumberLast4).toEqual("0123");
    expect(pharmacy.accountNumber).toBeUndefined(); // Raw input stripped

    // Query from DB without select('+accountNumberEncrypted') -> encrypted field is hidden
    const fetched = await Pharmacy.findById(pharmacy._id);
    expect(fetched.accountNumberEncrypted).toBeUndefined();
    expect(fetched.accountNumberLast4).toEqual("0123");

    // Query with explicit select -> encrypted string exists
    const withSecret = await Pharmacy.findById(pharmacy._id).select("+accountNumberEncrypted");
    expect(withSecret.accountNumberEncrypted).toBeDefined();
    expect(decrypt(withSecret.accountNumberEncrypted)).toEqual(rawAcct);
  });

  it("should allow Super Admin to reveal full account number", async () => {
    const rawAcct = "1234567890987654";
    const pharmacy = await pharmacyService.createPharmacy({
      name: "MediHealth Branch 2",
      code: "MED-02",
      phone: "+923001234568",
      address: "456 Commercial Area, Karachi",
      accountNumber: rawAcct,
    });

    const revealed = await pharmacyService.revealAccountNumber(pharmacy._id, superAdmin);
    expect(revealed.accountNumber).toEqual(rawAcct);
    expect(revealed.accountNumberLast4).toEqual("7654");
  });

  it("should reject Subadmin attempts to reveal full account number", async () => {
    const pharmacy = await pharmacyService.createPharmacy({
      name: "MediHealth Branch 3",
      code: "MED-03",
      phone: "+923001234569",
      address: "789 F-7 Markaz, Islamabad",
      accountNumber: "9876543210123456",
    });

    await expect(
      pharmacyService.revealAccountNumber(pharmacy._id, subAdmin)
    ).rejects.toThrow("Only Super Admin can reveal sensitive pharmacy bank account details");
  });

  it("should store and update accountTitle correctly and include it when revealing", async () => {
    const pharmacy = await pharmacyService.createPharmacy({
      name: "MediHealth Branch 4",
      code: "MED-04",
      phone: "+923001234570",
      address: "Phase 5 DHA, Lahore",
      accountTitle: "MediHealth Care (Pvt) Ltd",
      accountNumber: "PK36BAHL0001234567899999",
    });

    expect(pharmacy.accountTitle).toEqual("MediHealth Care (Pvt) Ltd");

    const fetched = await Pharmacy.findById(pharmacy._id);
    expect(fetched.accountTitle).toEqual("MediHealth Care (Pvt) Ltd");

    // Update account title
    const updated = await pharmacyService.updatePharmacy(pharmacy._id, {
      accountTitle: "MediHealth Care International (Pvt) Ltd",
    });
    expect(updated.accountTitle).toEqual("MediHealth Care International (Pvt) Ltd");

    // Reveal includes accountTitle
    const revealed = await pharmacyService.revealAccountNumber(pharmacy._id, superAdmin);
    expect(revealed.accountTitle).toEqual("MediHealth Care International (Pvt) Ltd");
    expect(revealed.accountNumber).toEqual("PK36BAHL0001234567899999");
  });
});
