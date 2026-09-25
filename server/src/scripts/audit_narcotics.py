import os
import re
import sys
from datetime import datetime
import pymongo
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# ==============================================================================
# Comprehensive Pharmaceutical Controlled Substances & Narcotics Knowledge Base
# (DRAP Pakistan, WHO Controlled Substances & International Pharmacopeia)
# ==============================================================================

CONTROLLED_SUBSTANCES_DB = {
    "OPIOID_NARCOTIC_ANALGESICS": {
        "class_name": "Opioid Analgesics / Narcotics (Schedule Controlled)",
        "risk_level": "HIGH",
        "description": "Strong narcotic analgesics with high dependency risk. Strictly prescription-only and narcotic-gated.",
        "generics": [
            "tramadol", "morphine", "fentanyl", "buprenorphine", "nalbuphine",
            "codeine", "dihydrocodeine", "methadone", "oxycodone", "hydrocodone",
            "pethidine", "meperidine", "pentazocine", "tapentadol", "dextropropoxyphene",
            "hydromorphone", "oxymorphone", "alfentanil", "sufentanil", "remifentanil"
        ],
        "brand_keywords": [
            "tramal", "tramacon", "dolor", "nubain", "temgesic", "durogesic",
            "sosegon", "pulmonol", "codamol", "t-tram", "zydol", "ultram",
            "subutex", "suboxone", "mst contin", "sevredol", "actiq", "jurnista",
            "palexia", "contramal", "tramad", "fortwin", "tramagesic"
        ]
    },
    "BENZODIAZEPINES_SEDATIVES": {
        "class_name": "Benzodiazepines & Sedative-Hypnotics (Psychotropic)",
        "risk_level": "HIGH",
        "description": "CNS depressants, tranquilizers, and sleep medications with high misuse and tolerance potential.",
        "generics": [
            "alprazolam", "diazepam", "clonazepam", "lorazepam", "midazolam",
            "bromazepam", "zolpidem", "zopiclone", "eszopiclone", "nitrazepam",
            "flurazepam", "temazepam", "chlordiazepoxide", "clobazam", "oxazepam",
            "triazolam", "flunitrazepam", "estazolam", "loprazolam", "lormetazepam"
        ],
        "brand_keywords": [
            "xanax", "valium", "rivotril", "ativan", "dormicum", "lexotanil",
            "mogadon", "librium", "frisium", "stilnox", "imovane", "lunesta",
            "alprax", "restyl", "xanor", "clonep", "anxit", "calmpose",
            "serax", "halcion", "rohypnol", "dalmane", "normison", "zolp"
        ]
    },
    "BARBITURATES": {
        "class_name": "Barbiturates (Schedule Controlled Sedatives)",
        "risk_level": "HIGH",
        "description": "Potent CNS depressants and anticonvulsants requiring strict record-keeping.",
        "generics": [
            "phenobarbital", "phenobarbitone", "secobarbital", "pentobarbital",
            "amobarbital", "butalbital", "thiopental", "methohexital"
        ],
        "brand_keywords": [
            "luminal", "seconal", "nembutal", "amytal", "fioricet", "pentothal",
            "gardinal", "epiphen"
        ]
    },
    "STIMULANTS_ADHD": {
        "class_name": "Central Nervous System Stimulants (Schedule II/Controlled)",
        "risk_level": "HIGH",
        "description": "Psychostimulants for ADHD/narcolepsy with high abuse liability.",
        "generics": [
            "methylphenidate", "dexmethylphenidate", "amphetamine", "dextroamphetamine",
            "lisdexamfetamine", "modafinil", "armodafinil", "phentermine"
        ],
        "brand_keywords": [
            "ritalin", "concerta", "medikinet", "adderall", "vyvanse", "provigil",
            "nuvigil", "modafin", "modalert", "duromine"
        ]
    },
    "GABAPENTINOIDS": {
        "class_name": "Gabapentinoids (High Misuse Scheduled in Pakistan)",
        "risk_level": "MEDIUM-HIGH",
        "description": "Neuropathic pain and anticonvulsant agents heavily regulated by DRAP due to recreational misuse.",
        "generics": [
            "pregabalin", "gabapentin"
        ],
        "brand_keywords": [
            "lyrica", "gabica", "neurontin", "pregalin", "neugab", "gaba",
            "pregaba", "pregate", "linpre", "nervana", "gabantin", "nurogab"
        ]
    },
    "DISSOCIATIVE_ANESTHETICS": {
        "class_name": "Anesthetic & Dissociative Agents",
        "risk_level": "HIGH",
        "description": "General anesthetics and dissociatives strictly reserved for hospital / doctor supervision.",
        "generics": [
            "ketamine", "propofol", "etomidate", "dexmedetomidine"
        ],
        "brand_keywords": [
            "ketalar", "diprivan", "hypnomidate", "precedex", "ketajet", "keta"
        ]
    },
    "CONTROLLED_COMBINATIONS_AND_MISC": {
        "class_name": "Controlled Combination Formulations & Precursors",
        "risk_level": "MEDIUM",
        "description": "Compound pharmaceuticals containing controlled narcotics combined with analgesics or decongestants.",
        "generics": [
            "pseudoephedrine", "ephedrine", "carisoprodol", "meprobamate",
            "tapentadol", "tramadol/paracetamol", "codeine/paracetamol"
        ],
        "brand_keywords": [
            "soma", "equanil", "actifed", "arinac", "panadol cf", "sancos",
            "corex", "tossex", "solpadeine"
        ]
    }
}


def load_env_mongodb_uri():
    """Read MONGODB_URI directly from server/.env"""
    env_path = r"D:\Projects\Medikart\server\.env"
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("MONGODB_URI=") and not line.startswith("MONGODB_URI_TEST="):
                    return line.split("=", 1)[1].strip()
    return os.environ.get("MONGODB_URI", "mongodb://127.0.0.1:27017/medikart_dev")


def analyze_product(product):
    """
    Analyzes a single product against the controlled substances database.
    Returns matching details or None.
    """
    name = (product.get("name") or "").lower()
    generic = (product.get("genericName") or "").lower()
    desc = (product.get("description") or "").lower()
    combined_text = f"{name} {generic} {desc}"

    matches = []

    for cat_key, cat_data in CONTROLLED_SUBSTANCES_DB.items():
        matched_generics = []
        matched_brands = []

        # 1. Check active generic ingredients (high confidence)
        for gen in cat_data["generics"]:
            # Exact word boundary matching for generic name
            pattern = rf"\b{re.escape(gen)}\b"
            if re.search(pattern, generic) or re.search(pattern, name):
                matched_generics.append(gen)

        # 2. Check brand keywords (medium-high confidence)
        for brand in cat_data["brand_keywords"]:
            pattern = rf"\b{re.escape(brand)}\b"
            if re.search(pattern, name):
                matched_brands.append(brand)

        if matched_generics or matched_brands:
            confidence = "HIGH (Generic Ingredient Match)" if matched_generics else "HIGH (Controlled Brand Match)"
            if cat_data["risk_level"] == "MEDIUM":
                confidence = "MEDIUM (Combination / Monitored Substance)"

            matches.append({
                "category_key": cat_key,
                "drug_class": cat_data["class_name"],
                "risk_level": cat_data["risk_level"],
                "confidence": confidence,
                "matched_generics": matched_generics,
                "matched_brands": matched_brands,
                "regulatory_note": cat_data["description"]
            })

    if not matches:
        return None

    # Pick the most severe match if multiple categories trigger
    primary_match = sorted(matches, key=lambda m: 0 if m["risk_level"] == "HIGH" else 1)[0]
    return primary_match


def main():
    print("=" * 80)
    print("[MEDIKART] DEEP PHARMACEUTICAL NARCOTICS & CONTROLLED DRUG AUDIT")
    print("=" * 80)

    mongo_uri = load_env_mongodb_uri()
    print("[*] Connecting to MongoDB database...")

    try:
        client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
        # Verify connection
        client.admin.command('ping')
        try:
            db = client.get_default_database()
            if db is None:
                db = client["medikart_dev"]
        except Exception:
            db = client["medikart_dev"]
        print(f"[+] Connected to database: {db.name}")
    except Exception as e:
        print(f"[-] MongoDB connection error: {e}")
        print("[*] Falling back to local inspection mode...")
        return

    products_col = db["products"]
    total_count = products_col.count_documents({})
    print(f"[*] Total products in catalog: {total_count}")

    all_products = list(products_col.find({}))

    flagged_items = []
    already_flagged_count = 0

    for prod in all_products:
        if prod.get("isNarcotic"):
            already_flagged_count += 1

        match = analyze_product(prod)
        if match:
            flagged_items.append({
                "product": prod,
                "analysis": match
            })

    print(f"\n[*] AUDIT RESULTS:")
    print(f"   - Total Products Scanned: {len(all_products)}")
    print(f"   - Products Identified as Potential Narcotics / Controlled: {len(flagged_items)}")
    print(f"   - Products Currently Flagged 'isNarcotic=true' in DB: {already_flagged_count}")

    # Generate Excel Report
    output_excel = r"D:\Projects\Medikart\medikart_potential_narcotics_review_list.xlsx"
    wb = Workbook()
    ws = wb.active
    ws.title = "Narcotics Review List"

    # Styling definitions
    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    
    high_risk_fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid") # Red tint
    high_risk_font = Font(name="Calibri", size=10, bold=True, color="991B1B")

    med_risk_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid") # Amber tint
    med_risk_font = Font(name="Calibri", size=10, bold=True, color="92400E")

    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    headers = [
        "No.",
        "Product Name",
        "Generic Name (API)",
        "SKU / Code",
        "Price (PKR)",
        "Detected Drug Class",
        "Detected Controlled Ingredient / Brand",
        "Risk Level",
        "Current DB Status (isNarcotic)",
        "Recommended Action",
        "Client Confirmation (Yes = Flag as Narcotic / No = Standard OTC)"
    ]

    ws.append(headers)

    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    ws.row_dimensions[1].height = 28

    # Populate rows
    for idx, item in enumerate(flagged_items, 1):
        p = item["product"]
        a = item["analysis"]

        triggers = []
        if a["matched_generics"]:
            triggers.append(f"Generic: {', '.join(a['matched_generics']).title()}")
        if a["matched_brands"]:
            triggers.append(f"Brand Keyword: {', '.join(a['matched_brands']).title()}")
        trigger_str = " | ".join(triggers)

        db_status = "YES (Already Flagged)" if p.get("isNarcotic") else "NO (Standard Product)"
        recommended_action = "FLAG AS NARCOTIC (Requires Doctor Prescription + 2FA Verification)" if a["risk_level"] == "HIGH" else "Review Formulation (Prescription Recommended)"

        row_data = [
            idx,
            p.get("name", "N/A"),
            p.get("genericName", "N/A") or "N/A",
            p.get("sku", "N/A"),
            p.get("price", 0),
            a["drug_class"],
            trigger_str,
            a["risk_level"],
            db_status,
            recommended_action,
            "YES" if p.get("isNarcotic") else ""  # Pre-fill client column if already flagged
        ]

        ws.append(row_data)
        current_row = ws.max_row
        ws.row_dimensions[current_row].height = 22

        # Style data cells
        for col_idx in range(1, len(row_data) + 1):
            cell = ws.cell(row=current_row, column=col_idx)
            cell.border = thin_border
            cell.alignment = Alignment(vertical="center")

            if col_idx in (1, 4, 5, 8, 9, 11):
                cell.alignment = Alignment(horizontal="center", vertical="center")

            # Risk level badge styling
            if col_idx == 8:
                if a["risk_level"] == "HIGH":
                    cell.fill = high_risk_fill
                    cell.font = high_risk_font
                else:
                    cell.fill = med_risk_fill
                    cell.font = med_risk_font

    # Auto-fit column widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    ws.column_dimensions['B'].width = 35 # Product Name
    ws.column_dimensions['C'].width = 25 # Generic Name
    ws.column_dimensions['F'].width = 32 # Drug Class
    ws.column_dimensions['G'].width = 30 # Trigger
    ws.column_dimensions['J'].width = 35 # Recommended Action
    ws.column_dimensions['K'].width = 28 # Client confirmation

    wb.save(output_excel)
    print(f"\n[+] Professional Excel Report Generated Successfully at:")
    print(f"    --> {output_excel}")

    # Print summary of flagged items
    print("\n" + "=" * 80)
    print(f"{'#':<3} | {'Product Name':<30} | {'Drug Class':<25} | {'Risk':<6}")
    print("-" * 80)
    for i, item in enumerate(flagged_items[:25], 1):
        p = item["product"]
        a = item["analysis"]
        print(f"{i:<3} | {p.get('name', 'N/A')[:30]:<30} | {a['drug_class'][:25]:<25} | {a['risk_level']:<6}")
    if len(flagged_items) > 25:
        print(f"... and {len(flagged_items) - 25} more items included in the Excel spreadsheet.")
    print("=" * 80)


if __name__ == "__main__":
    main()
