r"""
fix_images.py - Automated OCR Verification & Alignment for Medikart Products

Features:
- Incremental checkpointing: Appends each result to _image_audit/report.csv live.
- Safe resume capability: Skips already audited files so it can resume exactly where it stopped.
- Immediate apply per image when --apply is passed (with automatic backup).
- Safe backup into _image_audit/backup_original/ before renaming or moving.
"""

import os
import sys
import time
import shutil
import logging
import argparse
from pathlib import Path
import pandas as pd
from PIL import Image
import imagehash
from rapidfuzz import fuzz, utils as fuzz_utils
import easyocr

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

FUZZY_MATCH_THRESHOLD = 65
FUZZY_RENAME_THRESHOLD = 75

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

    name_sort_ratio = fuzz.token_sort_ratio(name_clean, ocr_clean)
    name_partial_ratio = fuzz.partial_ratio(name_clean, ocr_clean)
    name_set_ratio = fuzz.token_set_ratio(name_clean, ocr_clean)
    name_score = max(name_sort_ratio, name_partial_ratio, name_set_ratio)

    generic_score = 0.0
    if generic_clean and generic_clean != "nan" and len(generic_clean) > 3:
        g_sort = fuzz.token_sort_ratio(generic_clean, ocr_clean)
        g_partial = fuzz.partial_ratio(generic_clean, ocr_clean)
        generic_score = max(g_sort, g_partial)

    return max(name_score, generic_score)


def run_audit(images_path: Path, df_catalog: pd.DataFrame, limit: int = None, apply_changes: bool = False, resume: bool = True, start_idx: int = 0):
    setup_audit_folders()
    logger.info("Initializing EasyOCR reader (English)...")
    reader = easyocr.Reader(["en"], gpu=False, verbose=False)

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

    extensions = {".jpg", ".jpeg", ".png", ".webp"}
    image_files = [f for f in images_path.iterdir() if f.suffix.lower() in extensions]
    image_files.sort(key=lambda x: x.name)

    # Check for already processed files if resuming
    already_processed = set()
    if resume and REPORT_CSV.exists():
        try:
            existing_df = pd.read_csv(REPORT_CSV)
            if "OriginalFile" in existing_df.columns:
                already_processed = set(existing_df["OriginalFile"].astype(str).tolist())
                logger.info(f"Resume enabled: Found {len(already_processed)} existing records in {REPORT_CSV}")
        except Exception as e:
            logger.warning(f"Could not read existing report for resume: {e}")

    # Prepare CSV file header if not exists
    if not REPORT_CSV.exists() or not resume:
        init_df = pd.DataFrame(columns=[
            "OriginalFile", "ClaimedId", "ClaimedName", "Action",
            "TargetId", "TargetName", "Confidence", "OCRText", "Reason"
        ])
        init_df.to_csv(REPORT_CSV, index=False, encoding="utf-8-sig")

    if start_idx > 0 and start_idx < len(image_files):
        logger.info(f"Explicit start index: skipping first {start_idx} files.")
        image_files = image_files[start_idx:]

    if limit and limit > 0:
        logger.info(f"Limiting audit run to {limit} files.")
        image_files = image_files[:limit]

    logger.info(f"Target images remaining to process: {len(image_files)}")

    for idx, img_file in enumerate(image_files, 1):
        if img_file.name in already_processed:
            continue

        stem_id = img_file.stem
        claimed_entry = catalog_by_id.get(stem_id)

        try:
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

        if claimed_entry:
            current_score = score_text_against_product(ocr_text, claimed_entry["name"], claimed_entry["generic"])
            if current_score >= FUZZY_MATCH_THRESHOLD:
                action = "KEEP"
                confidence = current_score
                reason = f"OCR text confirms item identity (score {current_score:.1f} >= {FUZZY_MATCH_THRESHOLD})"
            else:
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
                    reason = f"Low confidence match for '{claimed_entry['name']}' (score {current_score:.1f} < {FUZZY_MATCH_THRESHOLD})"
        else:
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

        record = {
            "OriginalFile": img_file.name,
            "ClaimedId": stem_id,
            "ClaimedName": claimed_entry["name"] if claimed_entry else "",
            "Action": action,
            "TargetId": matched_id,
            "TargetName": matched_name,
            "Confidence": round(confidence, 1),
            "OCRText": ocr_text[:200],
            "Reason": reason
        }

        # Apply changes immediately if requested
        if apply_changes:
            try:
                backup_file = BACKUP_DIR / img_file.name
                if not backup_file.exists():
                    shutil.copy2(img_file, backup_file)

                if action == "RENAME":
                    target_ext = img_file.suffix
                    target_path = images_path / f"{matched_id}{target_ext}"
                    if target_path != img_file:
                        shutil.copy2(img_file, target_path)
                elif action == "QUARANTINE":
                    quar_file = QUARANTINE_DIR / img_file.name
                    shutil.copy2(img_file, quar_file)
            except Exception as e:
                logger.error(f"Error executing file operation for {img_file.name}: {e}")

        # Live append to report CSV with lock-retry
        appended = False
        for attempt in range(5):
            try:
                row_df = pd.DataFrame([record])
                row_df.to_csv(REPORT_CSV, mode="a", header=False, index=False, encoding="utf-8-sig")
                appended = True
                break
            except PermissionError:
                time.sleep(1.0)
            except Exception as ex:
                logger.warning(f"Warning: could not write to {REPORT_CSV}: {ex}")
                break

        if not appended:
            logger.warning(f"Failed to record {img_file.name} to {REPORT_CSV} after retries.")

        if idx % 10 == 0 or idx == len(image_files):
            logger.info(f"Audited [{idx}/{len(image_files)}] -> {img_file.name}: {action} ({confidence:.1f}%)")

    logger.info("Audit run completed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Medikart Image OCR Auditor and Fixer")
    parser.add_argument("--excel", default=EXCEL_PATH, help="Path to catalog Excel file")
    parser.add_argument("--images", default=str(IMAGES_DIR), help="Path to images directory")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of images for test runs")
    parser.add_argument("--apply", action="store_true", help="Apply file renames and moves (default: dry run)")
    parser.add_argument("--no-resume", action="store_true", help="Do not resume, start fresh")
    parser.add_argument("--start-idx", type=int, default=0, help="Explicit starting index in image list")
    args = parser.parse_args()

    catalog = load_catalog(args.excel)
    run_audit(
        Path(args.images),
        catalog,
        limit=args.limit,
        apply_changes=args.apply,
        resume=(not args.no_resume),
        start_idx=args.start_idx
    )
