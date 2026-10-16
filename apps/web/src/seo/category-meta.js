/**
 * Single source of truth for Category Meta Titles, Descriptions & AEO Summaries.
 * Strict SEO/AEO/GEO rules:
 * - Titles: strictly <= 60 characters
 * - Descriptions: strictly <= 160 characters
 * - AEO Summaries: strictly 40 to 60 words answering what is offered, how to order, delivery and payment options
 * - Internal inventory buckets & soft-drinks set to noindex,follow
 * - No meta keywords output
 */

export const CATEGORY_META_REGISTRY = {
  dermatology: {
    title: 'Skin Care & Dermatology Products in Pakistan | Medikart',
    description: 'Shop skin care, acne face wash, sunblock, moisturizers and medicated creams online in Pakistan. Order from Medikart with Cash on Delivery and WhatsApp support.',
    noindex: false,
    cluster: 'dermatology-skincare',
    aeoSummary: 'Medikart offers genuine skin care, face washes, moisturizers, acne treatments, and sunblocks online in Pakistan. Order directly through our website or upload a prescription via Instant Order. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.',
  },
  otc: {
    title: 'OTC Medicines & Health Essentials Online Pakistan | Medikart',
    description: 'Buy OTC medicines online in Pakistan: pain relief, fever, cold and cough, digestive care and first aid. Cash on Delivery and WhatsApp support.',
    noindex: false,
    cluster: 'otc-essentials',
    aeoSummary: 'Medikart offers over-the-counter pain relief, fever medications, cold syrups, digestive aids, and first aid essentials online in Pakistan. Order directly through our website or Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.',
  },
  vitamins: {
    title: 'Vitamins & Supplements Online in Pakistan | Medikart',
    description: 'Order vitamins, multivitamins, calcium, vitamin D, iron and daily supplements online in Pakistan. Browse popular brands, check prices and pay on delivery.',
    noindex: false,
    cluster: 'vitamins-supplements',
    aeoSummary: 'Medikart offers dietary supplements, multivitamins, calcium, vitamin D3, iron, and daily wellness formulations online in Pakistan. Order directly through our website or Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay conveniently via Cash on Delivery or card.',
  },
  nutraceutical: {
    title: 'Nutraceuticals & Health Supplements Pakistan | Medikart',
    description: 'Shop nutraceuticals and health supplements online in Pakistan, including omega-3, probiotics, collagen and joint care. Cash on Delivery available.',
    noindex: false,
    cluster: 'nutraceuticals',
    aeoSummary: 'Medikart offers certified nutraceuticals, omega-3 fish oil, coenzyme Q10, collagen, and joint health supplements online in Pakistan. Order directly through our website or Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.',
  },
  herbal: {
    title: 'Herbal & Natural Health Products in Pakistan | Medikart',
    description: 'Explore herbal and natural health products online in Pakistan, from digestive and immunity support to hair and skin care. Cash on Delivery available.',
    noindex: false,
    cluster: 'herbal-natural',
    aeoSummary: 'Medikart offers natural herbal remedies, gripe water, castor oil, joshanda, and digestive carminative syrups online in Pakistan. Order directly through our website or Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.',
  },
  'diapers-napkins': {
    title: 'Baby Diapers & Baby Care Products in Pakistan | Medikart',
    description: 'Buy baby diapers, wipes, baby skin care and nursery essentials online in Pakistan. Compare sizes and prices and pay by Cash on Delivery.',
    noindex: false,
    cluster: 'babycare-diapers',
    aeoSummary: 'Medikart offers baby diapers, gentle baby wipes, adult incontinence underpads, and female sanitary napkins online in Pakistan. Order directly through our website or Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.',
  },
  'milk-powder': {
    title: 'Baby Milk & Formula Powder Online in Pakistan | Medikart',
    description: 'Shop baby milk, infant formula and milk powders online in Pakistan. Check age stage and pack size, compare prices and pay by Cash on Delivery.',
    noindex: false,
    cluster: 'infant-nutrition',
    aeoSummary: 'Medikart offers verified infant formula, baby milk powder, growing-up formulas, and specialized pediatric nutrition drinks online in Pakistan. Order directly through our website or Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.',
  },
  diagnostics: {
    title: 'Diagnostic Devices & Test Kits Online in Pakistan | Medikart',
    description: 'Order glucometers, test strips, BP monitors, thermometers and home diagnostic kits online in Pakistan. Compare prices and pay by Cash on Delivery.',
    noindex: false,
    cluster: 'diagnostics-monitoring',
    aeoSummary: 'Medikart offers digital blood glucose monitors, test strips, blood pressure monitors, thermometers, and pulse oximeters online in Pakistan. Order directly through our website or Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.',
  },
  'patient-supports': {
    title: 'Patient Care & Home Health Supports in Pakistan | Medikart',
    description: 'Find patient care and mobility supports online in Pakistan, including braces, walking aids and home care essentials. Cash on Delivery available.',
    noindex: false,
    cluster: 'orthopedic-supports',
    aeoSummary: 'Medikart offers orthopedic supports, knee braces, lumbar back belts, cervical collars, ankle braces, and walking aids online in Pakistan. Order directly through our website or Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.',
  },
  'surgical-items': {
    title: 'Surgical Supplies & Medical Disposables Pakistan | Medikart',
    description: 'Buy surgical supplies and medical disposables online in Pakistan, including syringes, gloves, bandages and dressings. Cash on Delivery available.',
    noindex: false,
    cluster: 'surgical-disposables',
    aeoSummary: 'Medikart offers clinical surgical supplies, disposable syringes, examination gloves, sterile gauze bandages, and medical dressings online in Pakistan. Order directly through our website or Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.',
  },
  beverages: {
    title: 'Beverages & Health Drinks Online in Pakistan | Medikart',
    description: 'Order ORS, electrolyte drinks and health beverages online in Pakistan. Compare brands and prices and pay by Cash on Delivery.',
    noindex: true,
    noindexReason: 'Inventory contains commercial soft drinks. Noindex until migrated to pure health drinks/ORS.',
    cluster: 'health-drinks',
    aeoSummary: 'Medikart offers medical oral rehydration solutions, electrolyte replacement drinks, and nutritional hydration beverages online in Pakistan. Order directly through our website or Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.',
  },
  medicines: {
    title: 'Medicines Online in Pakistan: Upload Prescription | Medikart',
    description: "Order medicines online in Pakistan. Upload your doctor's prescription through Instant Order and pay by Cash on Delivery. Prescription rules apply.",
    noindex: false,
    cluster: 'prescription-medicines',
    aeoSummary: "Medikart offers authentic prescription and essential medicines online in Pakistan with required prescription verification. Upload your doctor's prescription directly through our Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.",
  },
  // Internal inventory buckets — no marketing metadata
  consumer: {
    title: 'Consumer Health & Personal Care Pakistan | Medikart',
    description: 'Shop consumer health, personal hygiene, and daily wellness essentials online in Pakistan. Order from Medikart with Cash on Delivery.',
    noindex: true,
    noindexReason: 'Internal inventory bucket. Set to noindex,follow until products migrated.',
    cluster: 'internal-consumer',
    aeoSummary: 'Medikart offers everyday personal hygiene, oral care, and consumer wellness products online in Pakistan. Order directly through our website or Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.',
  },
  'flat-items': {
    title: 'Flat Medical Consumables in Pakistan | Medikart',
    description: 'Browse essential flat-packed medical disposables, dressings, and clinical consumables on Medikart with Cash on Delivery across Pakistan.',
    noindex: true,
    noindexReason: 'Internal inventory bucket. Set to noindex,follow until products migrated.',
    cluster: 'internal-flat',
    aeoSummary: 'Medikart offers essential clinical consumables, medical dressings, and sterile disposables online in Pakistan. Order directly through our website or Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.',
  },
  'fridge-items': {
    title: 'Temperature Controlled Medicines Pakistan | Medikart',
    description: 'Temperature-sensitive pharmaceuticals, insulins, and biologics requiring cold-chain handling on Medikart. Order with verified delivery.',
    noindex: true,
    noindexReason: 'Internal inventory bucket. Set to noindex,follow until products migrated.',
    cluster: 'internal-fridge',
    aeoSummary: 'Medikart offers temperature-sensitive medicines and biologics requiring cold-chain handling online in Pakistan. Order directly through our website or Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.',
  },
  'general-items': {
    title: 'General Healthcare Items in Pakistan | Medikart',
    description: 'Browse household healthcare sundries, first aid accessories, and daily essentials online at Medikart with Cash on Delivery in Pakistan.',
    noindex: true,
    noindexReason: 'Internal inventory bucket. Set to noindex,follow until products migrated.',
    cluster: 'internal-general',
    aeoSummary: 'Medikart offers general healthcare accessories, first aid sundries, and household necessities online in Pakistan. Order directly through our website or Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.',
  },
};

export const NOINDEX_CATEGORY_SLUGS = new Set([
  'consumer',
  'flat-items',
  'fridge-items',
  'general-items',
  'beverages',
]);

export function getFallbackCategoryMeta(slug, categoryName = '') {
  const cleanName = categoryName || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const baseTitle = `${cleanName} Online in Pakistan | Medikart`;
  const title = baseTitle.length <= 60 ? baseTitle : `${cleanName.slice(0, 36)} | Medikart`;

  const baseDesc = `Buy ${cleanName} online in Pakistan at Medikart. Order with Cash on Delivery and reliable doorstep delivery.`;
  const description = baseDesc.length <= 160 ? baseDesc : baseDesc.slice(0, 157) + '...';

  const aeoSummary = `Medikart offers authentic ${cleanName.toLowerCase()} and healthcare essentials online in Pakistan. Order directly through our website or Instant Order service. Website-listed cities receive express delivery in 1 to 5 hours, while all other locations arrive in 2 to 3 working days. Pay via Cash on Delivery or card.`;

  return {
    title,
    description,
    aeoSummary,
    noindex: true,
    noindexReason: 'Unregistered category fallback',
    cluster: 'fallback',
  };
}

export function getCategoryMetadata(slug, categoryName = '') {
  if (CATEGORY_META_REGISTRY[slug]) {
    return CATEGORY_META_REGISTRY[slug];
  }
  return getFallbackCategoryMeta(slug, categoryName);
}
