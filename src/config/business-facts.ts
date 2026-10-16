/**
 * Business Facts Configuration for Medikart
 * Single source of truth for all operational, geographic, regulatory, and policy claims.
 * 
 * RULE: Never invent claims. Every claim on the website, schema, FAQs, and landing pages
 * must derive strictly from this verified configuration.
 */

export interface BusinessFacts {
  brandName: string;
  legalEntityName: string;
  officialDomain: string;
  siteUrl: string;
  supportPhone: string;
  supportWhatsapp: string;
  supportEmail: string;
  headquartersAddress: {
    street: string;
    neighborhood: string;
    city: string;
    province: string;
    country: string;
    postalCode: string;
  };
  operatingHours: string;
  
  // Confirmed Delivery Capabilities
  expressCities: string[];          // Cities with confirmed express 2-4 hour delivery
  nationwideCourierCities: string[]; // Cities serviced via standard 24-48 hr courier
  deliveryCharges: {
    standardPkr: number;
    freeAbovePkr: number;
  };
  
  // Payment Options
  paymentMethods: string[];
  
  // Regulatory & Licensing
  regulatoryBody: string;
  isAggregatorModel: boolean;       // Connects patients with licensed partner retail pharmacies
  partnerPharmacyLicenseType: string;
  drapRegistrationVerificationRequired: boolean;
  
  // Prescription & Controlled Drugs Policy
  prescriptionMandatoryForRx: boolean;
  controlledSubstancesOnlinePolicy: string;
}

export const BUSINESS_FACTS: BusinessFacts = {
  brandName: 'Medikart',
  legalEntityName: 'Banu Zahra Private Limited',
  officialDomain: 'medikart.pk',
  siteUrl: 'https://medikart.pk',
  supportPhone: '+92 324 4489159',
  supportWhatsapp: '+92 324 4489159',
  supportEmail: 'support@medikart.pk',
  headquartersAddress: {
    street: '92 G1',
    neighborhood: 'Johar Town',
    city: 'Lahore',
    province: 'Punjab',
    country: 'Pakistan',
    postalCode: '54770',
  },
  operatingHours: 'Monday - Saturday: 9:00 AM - 10:00 PM PKT',
  
  // Delivery facts (Only verified entries)
  expressCities: [
    'Lahore',
    'Karachi',
    'Islamabad',
    'Rawalpindi',
  ],
  nationwideCourierCities: [
    'Faisalabad',
    'Multan',
    'Peshawar',
    'Quetta',
    'Sahiwal',
    'Gujranwala',
    'Sialkot',
    'Hyderabad',
    'Sukkur',
    'Abbottabad',
    'Bahawalpur',
    'Sargodha',
  ],
  deliveryCharges: {
    standardPkr: 150,
    freeAbovePkr: 2000,
  },
  
  // Payment methods
  paymentMethods: [
    'Cash on Delivery (COD)',
    'Online Debit / Credit Card (Visa & MasterCard)',
  ],
  
  // Regulatory framework
  regulatoryBody: 'Drug Regulatory Authority of Pakistan (DRAP)',
  isAggregatorModel: true,
  partnerPharmacyLicenseType: 'Category A & B Licensed Retail Pharmacies',
  drapRegistrationVerificationRequired: true,
  
  // Strict Rx and Narcotics Policies
  prescriptionMandatoryForRx: true,
  controlledSubstancesOnlinePolicy: 'Strict Schedule X narcotics and habit-forming controlled drugs are not dispensed or delivered online under DRAP safety guidelines.',
};
