/**
 * Seed initial categories, conditions, and banners for Medikart
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Category = require("../modules/categories/category.model");
const Condition = require("../modules/conditions/condition.model");
const Banner = require("../modules/banners/banner.model");
const Order = require("../modules/orders/order.model");
const { connectDB } = require("../config/db");

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medikart";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    // 1. Ensure "OTC (Over the Counter)" Category exists
    let otcCategory = await Category.findOne({
      $or: [{ slug: "otc" }, { name: /over the counter/i }],
    });
    if (!otcCategory) {
      otcCategory = new Category({
        name: "OTC (Over the Counter)",
        slug: "otc",
        isNarcotic: false,
        active: true,
      });
      await otcCategory.save();
      console.log("✅ Created OTC (Over the Counter) category");
    } else {
      console.log("ℹ️ OTC category already exists");
    }

    // 2. Seed Conditions if none exist
    const conditionCount = await Condition.countDocuments();
    if (conditionCount === 0) {
      const defaultConditions = [
        {
          name: "Hair Fall",
          slug: "hair-fall",
          icon: "💇",
          imageUrl: "/images/conditions/hair-fall.svg",
          description: "Anti-hair fall treatments, biotin supplements, and hair serums.",
          displayOrder: 1,
          active: true,
        },
        {
          name: "Cough & Cold",
          slug: "cough-and-cold",
          icon: "🤧",
          imageUrl: "/images/conditions/cough-and-cold.svg",
          description: "Syrups, decongestants, inhalers, and soothing lozenges.",
          displayOrder: 2,
          active: true,
        },
        {
          name: "Bones & Joints Pain",
          slug: "bones-and-joints-pain",
          icon: "🦴",
          imageUrl: "/images/conditions/bones-and-joints-pain.svg",
          description: "Calcium, Vitamin D3, pain relief gels, and joint support.",
          displayOrder: 3,
          active: true,
        },
        {
          name: "Acne & Skin Care",
          slug: "acne-and-skin-care",
          icon: "✨",
          imageUrl: "/images/conditions/acne-and-skin-care.svg",
          description: "Dermatological cleansers, sunblocks, and acne creams.",
          displayOrder: 4,
          active: true,
        },
        {
          name: "Pain & Body Aches",
          slug: "pain-and-body-aches",
          icon: "⚡",
          imageUrl: "/images/conditions/pain-and-body-aches.svg",
          description: "Muscle relaxants, paracetamol, and anti-inflammatory tablets.",
          displayOrder: 5,
          active: true,
        },
        {
          name: "Sleep Disorders",
          slug: "sleep-disorders",
          icon: "🌙",
          imageUrl: "/images/conditions/sleep-disorders.svg",
          description: "Melatonin supplements, herbal teas, and relaxation aids.",
          displayOrder: 6,
          active: true,
        },
        {
          name: "Digestive Health",
          slug: "digestive-health",
          icon: "🌱",
          imageUrl: "/images/conditions/digestive-health.svg",
          description: "Antacids, probiotics, digestive enzymes, and laxatives.",
          displayOrder: 7,
          active: true,
        },
        {
          name: "Diabetes Care",
          slug: "diabetes-care",
          icon: "🩸",
          imageUrl: "/images/conditions/diabetes-care.svg",
          description: "Glucometers, test strips, sugar-free supplements, and lancets.",
          displayOrder: 8,
          active: true,
        },
      ];
      await Condition.insertMany(defaultConditions);
      console.log(`✅ Seeded ${defaultConditions.length} Health Conditions`);
    } else {
      console.log(`ℹ️ Conditions already exist (${conditionCount})`);
    }

    // 3. Seed Banners if none exist
    const bannerCount = await Banner.countDocuments();
    if (bannerCount === 0) {
      const defaultBanners = [
        {
          title: "100% Genuine Certified Medicines",
          subtitle: "Licensed Pharmacy Delivery Across Pakistan with Standard Cash on Delivery",
          imageUrl: "/uploads/placeholder.webp",
          linkUrl: "/instant-order",
          placement: "hero",
          displayOrder: 1,
          active: true,
        },
        {
          title: "Instant Prescription Order & Review",
          subtitle: "Upload your doctor's prescription in 30 seconds for direct fulfillment",
          imageUrl: "/uploads/placeholder.webp",
          linkUrl: "/instant-order",
          placement: "hero",
          displayOrder: 2,
          active: true,
        },
        {
          title: "Essential Daily Vitamins & Immunity",
          subtitle: "Save up to 15% on multivitamins, omega-3, and daily wellness",
          imageUrl: "/uploads/placeholder.webp",
          linkUrl: "/#catalog",
          placement: "hero",
          displayOrder: 3,
          active: true,
        },
        {
          title: "Protect the Skin You're In",
          subtitle: "Dermatologist-recommended sunblocks, cleansers & moisturizers",
          imageUrl: "/uploads/placeholder.webp",
          linkUrl: "/#catalog",
          placement: "mid-page",
          displayOrder: 1,
          active: true,
        },
        {
          title: "Better Health Begins Everyday",
          subtitle: "Explore authentic organic supplements, magnesium & herbal wellness",
          imageUrl: "/uploads/placeholder.webp",
          linkUrl: "/#catalog",
          placement: "mid-page",
          displayOrder: 2,
          active: true,
        },
      ];
      await Banner.insertMany(defaultBanners);
      console.log(`✅ Seeded ${defaultBanners.length} Homepage Banners`);
    } else {
      console.log(`ℹ️ Banners already exist (${bannerCount})`);
    }

    // 4. Backfill any existing orders without orderCode
    const ordersWithoutCode = await Order.find({
      $or: [{ orderCode: { $exists: false } }, { orderCode: null }, { orderCode: "" }],
    });
    if (ordersWithoutCode.length > 0) {
      console.log(`Backfilling orderCode for ${ordersWithoutCode.length} legacy orders...`);
      for (const ord of ordersWithoutCode) {
        ord.orderCode = `MK-${ord._id.toString().slice(-6).toUpperCase()}`;
        await ord.save();
      }
      console.log("✅ Order codes backfilled");
    }

    console.log("All seeding finished successfully.");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
