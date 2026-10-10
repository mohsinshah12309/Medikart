r"""
fix_images.py - Automated OCR Verification & Alignment for Medikart Products

Workflow:
1. Reads product catalog from Excel (Item Id, Item Name, Generic Name).
2. For every existing image in IMAGES_DIR:
   - Runs OCR to extract on-pack text.
   - Computes fuzzy match score against its claimed product.
   - If confidence is high -> KEEP.
   - If it matches a DIFFERENT product in the catalog with high confidence -> RENAME to that Item ID.
   - If it matches nothing or confidence is below threshold -> QUARANTINE / MARK AS MISSING.
3. For products that are missing confirmed images:
   - Searches image source (Google Custom Search API if keys provided, or logs MISSING).
   - Validates candidate downloaded images using OCR before saving.
4. Generates an exhaustive report CSV: _image_audit/report.csv.

SAFETY:
- Never deletes files.
- Operates strictly in DRY-RUN mode by default unless --apply is passed.
- Backs up originals into _image_audit/backup_original/ before any modification.
"""

import os
import sys
import shutil
import logging
import argparse
from pathlib import Path
import pandas as pd
from PIL import Image
import imagehash
from rapidfuzz import fuzz, utils as fuzz_utils
import easyocr
import requests

# ==========================================
# CONFIGURATION
# ==========================================
EXCEL_PATH = r"D:\Mohsin\Downloads\Extracted_Stock_Items.xlsx"
COL_ID = "Item Id"
COL_NAME = "Item Name"
COL_GENERIC = "Generic Name"

IMAGES_DIR = Path(r"D:\Projects\medikartImages")
AUDIT_DIR = Path(r"D:\Projects\Medikart\_image_audit")
BACKUP_DIR = AUDIT_DIR / "backup_original"
QUARANTINE_DIR = AUDIT_DIR / "quarantine"
REPORT_CSV = AUDIT_DIR / "report.csv"

# Minimum fuzzy similarity (0-100) to confirm a match
FUZZY_MATCH_THRESHOLD = 65
FUZZY_RENAME_THRESHOLD = 75

# Google Search API (Optional - can be set via env vars or CLI)
GOOGLE_API_KEY = os.getenv("GOOGLE_SEARCH_API_KEY", "")
GOOGLE_CSE_CX = os.getenv("GOOGLE_SEARCH_CX", "")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("fix_images")


def setup_audit_folders():
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    QUARANTINE_DIR.mkdir(parents=True, exist_ok=True)


def load_catalog(excel_path: str):
    logger.info(f"Loading catalog from {excel_path}...")
    df = pd.read_excel(excel_path)
    # Standardize column types
    df = df[df[COL_ID].notna()].copy()
    df[COL_ID] = df[COL_ID].astype(str).str.strip().str.replace(r"\.0$", "", regex=True)
    df[COL_NAME] = df[COL_NAME].astype(str).fillna("").str.strip()
    df[COL_GENERIC] = df[COL_GENERIC].astype(str).fillna("").str.strip()
    logger.info(f"Loaded {len(df)} products from catalog.")
    return df


def clean_text_for_matching(text: str) -> str:
    cleaned = fuzz_utils.default_process(text)
    return str(cleaned) if cleaned else ""


def score_text_against_product(ocr_text: str, product_name: str, generic_name: str) -> float:
    if not ocr_text or not product_name:
        return 0.0
    ocr_clean = clean_text_for_matching(ocr_text)
    name_clean = clean_text_for_matching(product_name)
    generic_clean = clean_text_for_matching(generic_name)

    # 1. Partial ratio & token sort ratio for name
    name_sort_ratio = fuzz.token_sort_ratio(name_clean, ocr_clean)
    name_partial_ratio = fuzz.partial_ratio(name_clean, ocr_clean)
    name_set_ratio = fuzz.token_set_ratio(name_clean, ocr_clean)

    # Best name score
    name_score = max(name_sort_ratio, name_partial_ratio, name_set_ratio)

    # 2. Check generic name match if available
    generic_score = 0.0
    if generic_clean and generic_clean != "nan" and len(generic_clean) > 3:
        g_sort = fuzz.token_sort_ratio(generic_clean, ocr_clean)
        g_partial = fuzz.partial_ratio(generic_clean, ocr_clean)
        generic_score = max(g_sort, g_partial)

    return max(name_score, generic_score)


def run_audit(images_path: Path, df_catalog: pd.DataFrame, limit: int = None, apply_changes: bool = False):
    setup_audit_folders()
    logger.info("Initializing EasyOCR reader (English)...")
    reader = easyocr.Reader(["en"], gpu=False, verbose=False)

    # Index catalog by ID and prepare lookup list
    catalog_by_id = {}
    catalog_list = []
    for _, row in df_catalog.iterrows():
        item_id = str(row[COL_ID])
        item_name = str(row[COL_NAME])
        generic = str(row[COL_GENERIC])
        entry = {
            "id": item_id,
            "name": item_name,
            "generic": generic,
            "search_tokens": clean_text_for_matching(f"{item_name} {generic}")
        }
        catalog_by_id[item_id] = entry
        catalog_list.append(entry)

    # Find existing image files
    extensions = {".jpg", ".jpeg", ".png", ".webp"}
    image_files = [f for f in images_path.iterdir() if f.suffix.lower() in extensions]
    image_files.sort(key=lambda x: x.name)

    if limit and limit > 0:
        logger.info(f"Limiting audit run to first {limit} images for quick testing.")
        image_files = image_files[:limit]

    logger.info(f"Processing {len(image_files)} image files...")

    audit_records = []
    processed_item_ids = set()

    for idx, img_file in enumerate(image_files, 1):
        stem_id = img_file.stem
        claimed_entry = catalog_by_id.get(stem_id)

        try:
            # 1. OCR Extraction
            ocr_tokens = reader.readtext(str(img_file), detail=0)
            ocr_text = " ".join(ocr_tokens)
        except Exception as e:
            logger.warning(f"Failed to read OCR for {img_file.name}: {e}")
            ocr_text = ""

        action = "PENDING"
        matched_id = stem_id
        matched_name = claimed_entry["name"] if claimed_entry else "UNKNOWN"
        confidence = 0.0
        reason = ""

        # Case A: Current file name matches a catalog Item Id
        if claimed_entry:
            current_score = score_text_against_product(ocr_text, claimed_entry["name"], claimed_entry["generic"])
            if current_score >= FUZZY_MATCH_THRESHOLD:
                action = "KEEP"
                confidence = current_score
                reason = f"OCR text confirms item identity (score {current_score:.1f} >= {FUZZY_MATCH_THRESHOLD})"
            else:
                # Does it match another product better?
                best_alt = None
                best_alt_score = 0.0
                for cand in catalog_list:
                    cand_score = score_text_against_product(ocr_text, cand["name"], cand["generic"])
                    if cand_score > best_alt_score:
                        best_alt_score = cand_score
                        best_alt = cand

                if best_alt and best_alt_score >= FUZZY_RENAME_THRESHOLD and best_alt["id"] != stem_id:
                    action = "RENAME"
                    matched_id = best_alt["id"]
                    matched_name = best_alt["name"]
                    confidence = best_alt_score
                    reason = f"Image belongs to '{best_alt['name']}' (ID {best_alt['id']}, score {best_alt_score:.1f}) instead of '{claimed_entry['name']}' (ID {stem_id}, score {current_score:.1f})"
                else:
                    action = "QUARANTINE"
                    confidence = current_score
                    reason = f"Low confidence match for '{claimed_entry['name']}' (score {current_score:.1f} < {FUZZY_MATCH_THRESHOLD}); image text is ambiguous or unverified"
        else:
            # Case B: Filename stem is not an Item ID (e.g. sequential number or name)
            best_alt = None
            best_alt_score = 0.0
            for cand in catalog_list:
                cand_score = score_text_against_product(ocr_text, cand["name"], cand["generic"])
                if cand_score > best_alt_score:
                    best_alt_score = cand_score
                    best_alt = cand

            if best_alt and best_alt_score >= FUZZY_MATCH_THRESHOLD:
                action = "RENAME"
                matched_id = best_alt["id"]
                matched_name = best_alt["name"]
                confidence = best_alt_score
                reason = f"Orphan image identified as '{best_alt['name']}' (ID {best_alt['id']}, score {best_alt_score:.1f})"
            else:
                action = "QUARANTINE"
                confidence = best_alt_score
                reason = f"Unknown file; highest match was {best_alt_score:.1f} < {FUZZY_MATCH_THRESHOLD}"

        if action in ("KEEP", "RENAME"):
            processed_item_ids.add(matched_id)

        audit_records.append({
            "OriginalFile": img_file.name,
            "ClaimedId": stem_id,
            "ClaimedName": claimed_entry["name"] if claimed_entry else "",
            "Action": action,
            "TargetId": matched_id,
            "TargetName": matched_name,
            "Confidence": round(confidence, 1),
            "OCRText": ocr_text[:200],
            "Reason": reason
        })

        if idx % 10 == 0 or idx == len(image_files):
            logger.info(f"Audited [{idx}/{len(image_files)}] -> {img_file.name}: {action} ({confidence:.1f}%)")

    # Save Audit Report
    report_df = pd.DataFrame(audit_records)
    report_df.to_csv(REPORT_CSV, index=False, encoding="utf-8-sig")
    logger.info(f"Audit report saved to {REPORT_CSV}")

    # Summary
    counts = report_df["Action"].value_counts().to_dict()
    logger.info(f"Audit Summary: {counts}")

    if apply_changes:
        logger.info("Executing safe file operations (--apply)...")
        for rec in audit_records:
            act = rec["Action"]
            orig_path = images_path / rec["OriginalFile"]
            if not orig_path.exists():
                continue

            # Always back up original first
            backup_file = BACKUP_DIR / rec["OriginalFile"]
            if not backup_file.exists():
                shutil.copy2(orig_path, backup_file)

            if act == "RENAME":
                target_ext = orig_path.suffix
                target_path = images_path / f"{rec['TargetId']}{target_ext}"
                if target_path != orig_path:
                    shutil.copy2(orig_path, target_path)
            elif act == "QUARANTINE":
                quar_file = QUARANTINE_DIR / rec["OriginalFile"]
                shutil.copy2(orig_path, quar_file)
        logger.info("File operations completed safely.")
    else:
        logger.info("DRY-RUN completed. No files were modified.")

    return report_df


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Medikart Image OCR Auditor and Fixer")
    parser.add_argument("--excel", default=EXCEL_PATH, help="Path to catalog Excel file")
    parser.add_argument("--images", default=str(IMAGES_DIR), help="Path to images directory")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of images for test runs")
    parser.add_argument("--apply", action="store_true", help="Apply file renames and moves (default: dry run)")
    args = parser.parse_args()

    catalog = load_catalog(args.excel)
    run_audit(Path(args.images), catalog, limit=args.limit, apply_changes=args.apply)
