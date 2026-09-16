const mongoose = require("mongoose");
const Pharmacy = require("../../src/modules/pharmacies/pharmacy.model");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");
const CommissionBalance = require("../../src/modules/commissions/commissionBalance.model");
const CommissionPayment = require("../../src/modules/commissions/commissionPayment.model");
const commissionService = require("../../src/modules/commissions/commission.service");

require("dotenv").config();

describe("Medikart Commission Tracking & Verification Workflow", () => {
  jest.setTimeout(60000);

  let pharmacy;
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
    assignedPharmacyId: null,
  };

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI is not defined");
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    if (pharmacy?._id) {
      await CommissionBalance.deleteMany({ pharmacyId: pharmacy._id });
      await CommissionPayment.deleteMany({ pharmacyId: pharmacy._id });
      await Pharmacy.deleteOne({ _id: pharmacy._id });
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await Pharmacy.deleteMany({ code: "MED-CENTRAL" });
    if (pharmacy?._id) {
      await CommissionBalance.deleteMany({ pharmacyId: pharmacy._id });
      await CommissionPayment.deleteMany({ pharmacyId: pharmacy._id });
    }

    pharmacy = await Pharmacy.create({
      name: "MediHealth Central",
      code: "MED-CENTRAL",
      phone: "+923000000000",
      address: "100 Central Road, Lahore",
      medikartPercentage: 7,
    });

    // Seed an initial balance
    await CommissionBalance.create({
      pharmacyId: pharmacy._id,
      outstandingBalance: 15000,
      totalPaidVerified: 0,
    });
  });

  it("should get accurate pharmacy balance and pending count", async () => {
    const balance = await commissionService.getPharmacyBalance(pharmacy._id, subAdmin);
    expect(balance.outstandingBalance).toEqual(15000);
    expect(balance.medikartPercentage).toEqual(7);
    expect(balance.pendingCount).toEqual(0);
  });

  it("should submit a commission payment proof starting in pending status without decreasing balance", async () => {
    const payment = await commissionService.submitPayment(
      {
        pharmacyId: pharmacy._id.toString(),
        amount: 5000,
        screenshotUrl: "/uploads/commissions/proof_test_1.webp",
        periodFrom: "2026-08-01",
        periodTo: "2026-08-31",
        paidOnDate: "2026-09-05",
        notes: "August 2026 commission via Meezan Bank",
      },
      subAdmin
    );

    expect(payment.status).toEqual("pending");
    expect(payment.amount).toEqual(5000);
    expect(payment.submittedBy.toString()).toEqual(subAdmin.id);

    // Outstanding balance remains unchanged on submission alone
    const balance = await commissionService.getPharmacyBalance(pharmacy._id, subAdmin);
    expect(balance.outstandingBalance).toEqual(15000);
    expect(balance.pendingCount).toEqual(1);
  });

  it("should allow Super Admin to verify payment and atomically decrement outstanding balance", async () => {
    const payment = await commissionService.submitPayment(
      {
        pharmacyId: pharmacy._id.toString(),
        amount: 5000,
        screenshotUrl: "/uploads/commissions/proof_test_2.webp",
        periodFrom: "2026-08-01",
        periodTo: "2026-08-31",
        paidOnDate: "2026-09-05",
      },
      subAdmin
    );

    const { payment: verifiedPayment, balance } = await commissionService.verifyPayment(
      payment._id,
      superAdmin
    );

    expect(verifiedPayment.status).toEqual("verified");
    expect(verifiedPayment.verifiedBy.toString()).toEqual(superAdmin.id);
    expect(verifiedPayment.verifiedAt).toBeDefined();

    // Balance decremented: 15000 - 5000 = 10000
    expect(balance.outstandingBalance).toEqual(10000);
    expect(balance.totalPaidVerified).toEqual(5000);

    const updatedBalance = await commissionService.getPharmacyBalance(pharmacy._id, subAdmin);
    expect(updatedBalance.outstandingBalance).toEqual(10000);
    expect(updatedBalance.pendingCount).toEqual(0);
  });

  it("should prevent Subadmin from verifying payment", async () => {
    const payment = await commissionService.submitPayment(
      {
        pharmacyId: pharmacy._id.toString(),
        amount: 3000,
        screenshotUrl: "/uploads/commissions/proof_test_3.webp",
        periodFrom: "2026-08-01",
        periodTo: "2026-08-31",
        paidOnDate: "2026-09-05",
      },
      subAdmin
    );

    await expect(
      commissionService.verifyPayment(payment._id, subAdmin)
    ).rejects.toThrow("Only Super Admin has permission to verify commission payments");
  });

  it("should allow Super Admin to reject payment with a reason and leave balance unchanged", async () => {
    const payment = await commissionService.submitPayment(
      {
        pharmacyId: pharmacy._id.toString(),
        amount: 4000,
        screenshotUrl: "/uploads/commissions/proof_test_4.webp",
        periodFrom: "2026-08-01",
        periodTo: "2026-08-31",
        paidOnDate: "2026-09-05",
      },
      subAdmin
    );

    const { payment: rejectedPayment } = await commissionService.rejectPayment(
      payment._id,
      { rejectionReason: "Screenshot transaction ID does not match bank statement" },
      superAdmin
    );

    expect(rejectedPayment.status).toEqual("rejected");
    expect(rejectedPayment.rejectionReason).toEqual("Screenshot transaction ID does not match bank statement");

    // Balance stays 15000
    const balance = await commissionService.getPharmacyBalance(pharmacy._id, subAdmin);
    expect(balance.outstandingBalance).toEqual(15000);
  });

  it("should allow Super Admin and assigned Subadmin to view payment records, but forbid other pharmacies", async () => {
    // 1. Subadmin submits a proof
    await commissionService.submitPayment(
      {
        pharmacyId: pharmacy._id.toString(),
        amount: 3500,
        screenshotUrl: "/uploads/commissions/proof_test_5.webp",
        periodFrom: "2026-08-01",
        periodTo: "2026-08-31",
        paidOnDate: "2026-09-05",
      },
      subAdmin
    );

    // 2. Super Admin can view payment records
    const payments = await commissionService.getPharmacyPayments(pharmacy._id, superAdmin);
    expect(Array.isArray(payments)).toBe(true);
    expect(payments.length).toBeGreaterThan(0);
    expect(payments[0].screenshotUrl).toEqual("/uploads/commissions/proof_test_5.webp");

    // 3. Subadmin with assigned pharmacy can view their branch's payment records
    const assignedSubAdmin = {
      ...subAdmin,
      assignedPharmacyId: pharmacy._id.toString(),
    };
    const subAdminPayments = await commissionService.getPharmacyPayments(pharmacy._id, assignedSubAdmin);
    expect(Array.isArray(subAdminPayments)).toBe(true);
    expect(subAdminPayments.length).toBeGreaterThan(0);

    // 4. Subadmin assigned to a different pharmacy is forbidden
    const otherPharmacyId = new mongoose.Types.ObjectId().toString();
    const otherSubAdmin = {
      ...subAdmin,
      assignedPharmacyId: otherPharmacyId,
    };
    await expect(
      commissionService.getPharmacyPayments(pharmacy._id, otherSubAdmin)
    ).rejects.toThrow("Access denied");
  });

  it("should return comprehensive paid commission summary with per-branch breakdown and date filters", async () => {
    // 1. Submit and verify a payment
    const payment = await commissionService.submitPayment(
      {
        pharmacyId: pharmacy._id.toString(),
        amount: 8500,
        screenshotUrl: "/uploads/commissions/proof_summary_test.webp",
        periodFrom: "2026-08-01",
        periodTo: "2026-08-31",
        paidOnDate: "2026-09-05",
        notes: "September settlement",
      },
      subAdmin
    );

    await commissionService.verifyPayment(payment._id, superAdmin);

    // 2. Fetch paid summary
    const summary = await commissionService.getCommissionsPaidSummary({}, superAdmin);

    expect(summary).toBeDefined();
    expect(summary.summary.totalPaidInPeriod).toBeGreaterThanOrEqual(8500);
    expect(summary.summary.totalVerifiedCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(summary.branches)).toBe(true);

    const branch = summary.branches.find((b) => b.pharmacyId.toString() === pharmacy._id.toString());
    expect(branch).toBeDefined();
    expect(branch.totalPaidInPeriod).toBeGreaterThanOrEqual(8500);
    expect(branch.payments.length).toBeGreaterThanOrEqual(1);
  });
});
