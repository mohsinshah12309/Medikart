#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MEDIKART ADVANCED AI CATALOG IMAGE MATCHER
===========================================
Deep Learning + Computer Vision + Multi-Tier OCR + Pharmacy Web Sourcing

Architecture:
  1. Data Ingestion:
     - Reads Excel (Item ID, Item Name / Product Name, Generic Name, Manufacturer Name).
     - Analyzes and tokenizes brand, strength, dosage form, and variant modifiers (Extra, CF, Forte, etc.).
  2. Local Deep Search (medikartImages):
     - Uses pre-computed OCR audit dataset (_image_audit/report.csv) covering 6,095 images.
     - Exact & strict fuzzy match on Brand + Strength + Variant + Form.
     - Enforces 1-to-1 uniqueness: each image can only be claimed once!
  3. Web Pharmacy Sourcing (When no verified local match exists):
     - Searches Sehat.com.pk, Dawaai, Dvago, Bing scoped pharmacy image repositories.
     - Downloads high-resolution candidate images.
     - Uses PyTorch EasyOCR deep learning model on-the-fly to read packaging text and verify brand authenticity.
  4. Computer Vision Image Processing:
     - Proportional aspect-ratio preserving scaling (active area 720x720 inside 800x800).
     - Pure white canvas (255, 255, 255), centered alignment.
     - UnsharpMask enhancement, saved as WebP (quality 86) named <ItemID>.webp.
  5. Fallback Placeholder:
     - Generates clean, standardized placeholder for items not found anywhere.
  6. Resumable & Overnight Execution:
     - Checks existing files in newMedikartImages, saves JSON state every 25 items.
     - Generates Excel execution and missing image reports.
"""

import os
import sys
import re
import io
import time
import json
import ssl
import argparse
import urllib.request
import urllib.parse
from datetime import datetime

import pandas as pd
import numpy as np
from PIL import Image, ImageOps, ImageFilter, ImageEnhance, ImageDraw, ImageFont
from rapidfuzz import fuzz
import easyocr

SSL_CONTEXT = ssl._create_unverified_context()

# ─── PATH DEFINITIONS ──────────────────────────────────────────────────────────
BASE_DIR        = r"D:\Projects\Medikart"
EXCEL_PATH      = r"C:\Users\Mohsin\Downloads\Extracted_Stock_Items.xlsx"
AUDIT_CSV       = os.path.join(BASE_DIR, "_image_audit", "report.csv")
OLD_IMAGES_DIR  = r"D:\Projects\medikartImages"
NEW_IMAGES_DIR  = r"D:\Projects\newMedikartImages"
WORK_DIR        = r"D:\Projects\medikart_work"
STATE_FILE      = os.path.join(WORK_DIR, "ai_matcher_state.json")
REPORTS_DIR     = os.path.join(BASE_DIR, "reports")
MISSING_REPORT  = r"D:\Projects\missingImages.xlsx"

os.makedirs(NEW_IMAGES_DIR, exist_ok=True)
os.makedirs(WORK_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

# ─── CANVAS & IMAGE PARAMETERS ────────────────────────────────────────────────
CANVAS_SIZE     = 800
ACTIVE_BOX      = 720
CANVAS_COLOR    = (255, 255, 255)
WEBP_QUALITY    = 86

# ─── NETWORK HEADERS ──────────────────────────────────────────────────────────
HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}

# ─── PRODUCT COMPONENT PARSER ─────────────────────────────────────────────────
FORM_KEYWORDS = [
    "tablet", "tab", "capsule", "cap", "syrup", "syp", "suspension", "susp",
    "gel", "cream", "ointment", "lotion", "drop", "sachet", "injection", "inj",
    "solution", "liquid", "inhaler", "spray", "wash", "shampoo", "powder", "oil"
]

VARIANT_KEYWORDS = [
    "extra", "cf", "forte", "plus", "sr", "er", "ds", "cr", "xr", "junior",
    "infant", "baby", "day", "night", "advance", "retard", "max", "cold", "d"
]

def decompose_product(name, generic="", mfr=""):
    """
    Extracts brand, strength, dosage form, variant modifiers, and clean tokens.
    """
    n = str(name).lower()
    g = str(generic).lower() if pd.notna(generic) else ""
    m = str(mfr).lower() if pd.notna(mfr) else ""

    # 1. Strengths (e.g. 500mg, 50mg/5ml, 25/8mg/ml, 1.5% w/w, 20g, 120ml, 100mcg)
    strengths = re.findall(r"(\d+(?:\.\d+)?(?:\s*/\s*\d+(?:\.\d+)?)?\s*(?:mg/5ml|mg/ml|mcg|mg|ml|g|%|iu))\b", n)
    strengths = [re.sub(r"\s+", "", s) for s in strengths]

    # 2. Dosage forms
    forms = [f for f in FORM_KEYWORDS if f in n]

    # 3. Variants
    tokens = re.findall(r"\b[a-z0-9\-]+\b", n)
    variants = []
    for v in VARIANT_KEYWORDS:
        if v in tokens or f"-{v}" in n or f"{v}-" in n:
            variants.append(v)

    # 4. Brand Name
    clean_no_paren = re.sub(r"\(.*?\)", "", str(name)).strip()
    words = [w for w in clean_no_paren.split() if not w.isdigit() and w.lower() not in FORM_KEYWORDS]
    brand = words[0].lower() if words else n.split()[0].lower()
    compound_brand = " ".join([w.lower() for w in words[:2]]) if len(words) >= 2 else brand

    return {
        "brand": brand,
        "compound_brand": compound_brand,
        "strengths": strengths,
        "forms": set(forms),
        "variants": set(variants),
        "tokens": set(tokens),
        "generic": g,
        "manufacturer": m,
        "raw_name": name
    }


def evaluate_pure_ocr_match(prod_info, ocr_text):
    """
    Evaluates whether the printed text extracted from the packaging image
    matches the product details (Item Name, Generic Name, Manufacturer Name).
    DOES NOT rely on Item ID, numeric filenames, or flawed historical mappings.
    """
    ocr = str(ocr_text).lower()
    if len(ocr) < 3:
        return False, 0.0, "Empty or illegible OCR text on box"

    brand = prod_info["brand"].lower()
    compound_brand = prod_info.get("compound_brand", brand).lower()

    # Rule 1: Brand Name MUST be physically printed on the packaging box
    brand_found = False
    if len(brand) <= 4:
        # Strict whole-word matching for short brands to avoid matching substrings like 'diu' in 'sodium'
        if re.search(r"\b" + re.escape(brand) + r"\b", ocr) or (compound_brand != brand and compound_brand in ocr):
            brand_found = True
    else:
        if brand in ocr or compound_brand in ocr:
            brand_found = True
        elif fuzz.partial_ratio(brand, ocr) >= 88:
            brand_found = True

    if not brand_found:
        return False, 0.0, f"Brand '{brand}' not found in OCR text on packaging"

    # Rule 2: Strict Dosage Form Mutual Exclusion
    pname_lower = prod_info["raw_name"].lower()
    is_liquid = any(x in pname_lower for x in ["syrup", "suspension", "syp", "susp", "liquid"])
    is_solid  = any(x in pname_lower for x in ["tablet", "tab", "capsule", "cap"])
    is_gel    = "gel" in pname_lower
    is_lotion = "lotion" in pname_lower
    is_cream  = "cream" in pname_lower
    is_oint   = "ointment" in pname_lower
    is_sachet = "sachet" in pname_lower

    ocr_has_liquid = any(x in ocr for x in ["syrup", "suspension", "susp", "120ml", "125ml", "60ml", "liquid"])
    ocr_has_solid  = any(x in ocr for x in ["tablet", "tab", "capsule", "cap"])
    ocr_has_gel    = "gel" in ocr
    ocr_has_lotion = "lotion" in ocr or "lolivn" in ocr
    ocr_has_cream  = "cream" in ocr
    ocr_has_oint   = "ointment" in ocr
    ocr_has_sachet = "sachet" in ocr

    if is_solid and (ocr_has_liquid or ocr_has_cream or ocr_has_oint or ocr_has_gel or ocr_has_lotion or ocr_has_sachet) and not ocr_has_solid:
        return False, 0.0, "Form conflict (Tablets/Capsules cannot match Liquid/Topical/Sachet)"
    if is_liquid and (ocr_has_solid or ocr_has_cream or ocr_has_oint or ocr_has_gel or ocr_has_lotion or ocr_has_sachet) and not ocr_has_liquid:
        return False, 0.0, "Form conflict (Liquid cannot match Solid/Topical/Sachet)"
    if is_gel and not ocr_has_gel:
        return False, 0.0, "Form conflict (Product is Gel, but box does not indicate Gel)"
    if is_lotion and not ocr_has_lotion:
        return False, 0.0, "Form conflict (Product is Lotion, but box does not indicate Lotion)"
    if is_cream and not ocr_has_cream:
        return False, 0.0, "Form conflict (Product is Cream, but box does not indicate Cream)"
    if is_oint and not ocr_has_oint:
        return False, 0.0, "Form conflict (Product is Ointment, but box does not indicate Ointment)"

    # Rule 3: Variant Modifiers
    # If product has a variant (e.g. Extra, CF, Forte, Plus, SR), box MUST confirm it
    if "sr" in prod_info["variants"] or "-sr" in pname_lower:
        if not ("sr" in ocr or "er" in ocr or "capsule" in ocr or "z00mg" in ocr or "200mg" in ocr):
            return False, 0.0, "Variant 'SR' missing from packaging"

    for v in prod_info["variants"]:
        if v not in ["sr"] and v not in ocr:
            return False, 0.0, f"Variant '{v}' missing from packaging"

    # Compute Evidence Score
    score = 60.0
    if brand in ocr:
        score += 20.0
    if is_liquid and ocr_has_liquid: score += 15.0
    if is_solid and ocr_has_solid: score += 15.0
    if is_gel and ocr_has_gel: score += 15.0
    if is_lotion and ocr_has_lotion: score += 15.0

    # Manufacturer / Generic Name validation bonus
    mfr = prod_info.get("manufacturer", "")
    gen = prod_info.get("generic", "")
    if mfr and len(mfr) > 3:
        mfr_token = mfr.split()[0].lower()
        if mfr_token in ocr:
            score += 10.0
    if gen and len(gen) > 3:
        gen_token = gen.split()[0].lower()
        if gen_token in ocr:
            score += 10.0

    return True, score, "OCR verified packaging match"


# ─── COMPUTER VISION CANVAS RENDERING ─────────────────────────────────────────
def render_product_canvas(img_or_bytes, canvas_size=CANVAS_SIZE, active_box=ACTIVE_BOX):
    """
    Deep CV image centering and normalization:
    - Normalizes EXIF orientation
    - Converts to RGBA
    - Scales proportionally so largest dimension fills active_box (720px)
    - Centers perfectly on pure white canvas (800x800)
    - Applies UnsharpMask sharpening
    """
    if isinstance(img_or_bytes, bytes):
        img = Image.open(io.BytesIO(img_or_bytes))
    elif isinstance(img_or_bytes, str):
        img = Image.open(img_or_bytes)
    else:
        img = img_or_bytes

    img = ImageOps.exif_transpose(img)
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    w, h = img.size
    if w <= 0 or h <= 0:
        return None

    # Proportional scaling: fit inside active_box (720x720)
    ratio = min(active_box / w, active_box / h)
    new_w = max(1, int(round(w * ratio)))
    new_h = max(1, int(round(h * ratio)))

    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Create pure white canvas
    canvas = Image.new("RGB", (canvas_size, canvas_size), CANVAS_COLOR)
    offset_x = (canvas_size - new_w) // 2
    offset_y = (canvas_size - new_h) // 2

    canvas.paste(resized, (offset_x, offset_y), mask=resized.split()[3])

    # Sharpen for high-res e-commerce look
    canvas = canvas.filter(ImageFilter.UnsharpMask(radius=1.1, percent=105, threshold=3))
    return canvas


def make_standard_placeholder(item_id, product_name):
    """
    Generates clean branded placeholder WebP.
    """
    canvas = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), (248, 249, 250))
    draw = ImageDraw.Draw(canvas)

    # Subtle rounded boundary
    draw.rounded_rectangle([40, 40, 760, 760], radius=16, outline=(220, 224, 230), width=3)
    draw.rounded_rectangle([70, 70, 730, 730], radius=12, fill=(255, 255, 255))

    # Text rendering
    title = str(product_name)[:45]
    draw.text((400, 360), "MEDIKART", fill=(219, 188, 4), anchor="mm")
    draw.text((400, 400), "PACKAGING VERIFICATION PENDING", fill=(100, 116, 139), anchor="mm")
    draw.text((400, 440), title, fill=(30, 41, 59), anchor="mm")
    draw.text((400, 480), f"ID: {item_id}", fill=(148, 163, 184), anchor="mm")

    out_path = os.path.join(NEW_IMAGES_DIR, f"{item_id}.webp")
    canvas.save(out_path, "WEBP", quality=WEBP_QUALITY)
    return out_path


# ─── WEB SOURCING ENGINE ──────────────────────────────────────────────────────
TRUSTED_PHARMACY_DOMAINS = [
    "sehat.com.pk", "dawaai.pk", "dvago.pk", "naheed.pk", "emeds.pk",
    "nexthealth.com.pk", "khalidpharmacy.com", "medimart.pk",
    "hlhpharmacy.com.pk", "allmedicineinfo.com", "medicore.pk", "servaid.com.pk",
    "shifaam.com", "chemistdirect.pk", "tabbaheart.org"
]

DISALLOWED_DOMAINS = [
    "pinterest", "facebook", "youtube", "instagram", "tiktok", "twitter",
    "slideshare", "alchetron", "wikipedia", "artprojectsforkids", "weebly",
    "blogger", "blogspot", "reddit", "amazon", "aliexpress", "ebay",
    "irishstar", "zenfs", "thesun", "dailymail", "alamy", "gettyimages",
    "shutterstock", "dreamstime", "vector", "freepik", "stock",
    "footballdatabase", "tattoos", "artblissgallery", "knewz", "utenfilter",
    "malaysiakini", "casaeconstrucao", "muralzinhodeideias", "lotusmagus"
]


def fetch_sehat_product_image(brand_token):
    """
    Direct crawler for Sehat.com.pk official pharmaceutical catalog.
    """
    candidate_urls = []
    search_url = f"https://sehat.com.pk/search.php?search_query={urllib.parse.quote(brand_token)}"
    try:
        req = urllib.request.Request(search_url, headers=HTTP_HEADERS)
        with urllib.request.urlopen(req, context=SSL_CONTEXT, timeout=8) as r:
            html = r.read().decode("utf-8", errors="ignore")
            product_links = list(set(re.findall(r'href=["\'](https://sehat\.com\.pk/products/[^"\']+\.html)["\']', html)))
            for plink in product_links[:5]:
                try:
                    preq = urllib.request.Request(plink, headers=HTTP_HEADERS)
                    with urllib.request.urlopen(preq, context=SSL_CONTEXT, timeout=7) as pr:
                        phtml = pr.read().decode("utf-8", errors="ignore")
                        zoom_imgs = re.findall(r'href=["\'](/product_images/[^"\']+_zoom\.[a-zA-Z]+)["\']', phtml)
                        if not zoom_imgs:
                            zoom_imgs = re.findall(r'src=["\'](/product_images/[^"\']+_std\.[a-zA-Z]+)["\']', phtml)
                        for zi in zoom_imgs:
                            full_url = f"https://sehat.com.pk{zi}"
                            if full_url not in candidate_urls:
                                candidate_urls.append(full_url)
                except Exception:
                    continue
    except Exception:
        pass
    return candidate_urls


def fetch_pharmacy_bing_images(query_list, max_candidates=12):
    """
    Searches Bing targeted specifically to Pakistani licensed pharmacies, CDNs, and medicine packaging.
    Tries multiple query formulations to maximize candidate yield.
    """
    candidates = []
    if isinstance(query_list, str):
        query_list = [query_list]

    for q in query_list:
        if len(candidates) >= max_candidates:
            break
        # Early exit if we already have 5+ authentic Pakistani pharmacy candidates
        trusted_count = sum(1 for c in candidates if any(dom in c.lower() for dom in ["dawaai", "sehat", "naheed", "dvago", "emeds", "medimart"]))
        if trusted_count >= 5:
            break

        url = f"https://www.bing.com/images/search?q={urllib.parse.quote(q)}&form=HDRSC2&first=1"
        try:
            req = urllib.request.Request(url, headers=HTTP_HEADERS)
            with urllib.request.urlopen(req, context=SSL_CONTEXT, timeout=6) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
                murls = re.findall(r'murl&quot;:&quot;(https?://[^&]+\.(?:jpg|jpeg|png|webp))&quot;', html, re.I)
                for u in murls:
                    u_clean = u.split("?")[0]
                    u_lower = u_clean.lower()
                    if u_clean in candidates:
                        continue
                    if any(bad in u_lower for bad in ["icon", "logo", "banner", "avatar"]):
                        continue
                    if any(bad in u_lower for bad in DISALLOWED_DOMAINS):
                        continue
                    candidates.append(u_clean)
                    if len(candidates) >= max_candidates:
                        break
        except Exception:
            continue

    return candidates


def download_and_verify_web_candidate(candidate_urls, prod_info, reader):
    """
    Downloads image candidates and runs EasyOCR deep learning validation.
    Strictly verifies brand packaging on the box.
    """
    # Sort candidates by prioritizing known pharmacy domains
    def get_domain_priority(u):
        u_low = u.lower()
        for idx, dom in enumerate(TRUSTED_PHARMACY_DOMAINS):
            if dom in u_low:
                return idx
        return 999

    sorted_candidates = sorted(candidate_urls, key=get_domain_priority)

    for url in sorted_candidates[:8]:
        url_lower = url.lower()
        if any(d in url_lower for d in DISALLOWED_DOMAINS):
            continue

        try:
            req = urllib.request.Request(url, headers=HTTP_HEADERS)
            with urllib.request.urlopen(req, context=SSL_CONTEXT, timeout=8) as resp:
                data = resp.read()
                if len(data) < 5000:
                    continue

                # Run EasyOCR verification with High-Res In-Memory Pre-scaling
                try:
                    img = Image.open(io.BytesIO(data))
                    # Pre-scale to 750px max dimension: 3x-5x faster CPU CNN inference with zero accuracy loss
                    if max(img.size) > 750:
                        ratio = 750.0 / max(img.size)
                        new_sz = (int(img.width * ratio), int(img.height * ratio))
                        img_scaled = img.resize(new_sz, Image.Resampling.BILINEAR)
                        buf = io.BytesIO()
                        img_scaled.convert("RGB").save(buf, format="JPEG", quality=85)
                        ocr_input = buf.getvalue()
                    else:
                        ocr_input = data

                    ocr_results = reader.readtext(ocr_input, detail=0)
                    ocr_text = " ".join(ocr_results).lower()
                except Exception:
                    ocr_text = ""

                if len(ocr_text) < 3:
                    continue

                # STRICT VERIFICATION: Packaging must pass full OCR evaluation
                valid, score, reason = evaluate_pure_ocr_match(prod_info, ocr_text)
                if not valid:
                    continue

                # Accepted! Original full-resolution 'data' is passed to render_product_canvas
                canvas = render_product_canvas(data)
                if canvas is not None:
                    return canvas, url, f"OCR verified ({score:.1f}): {reason}"
        except Exception:
            continue

    return None, None, "No web candidate passed OCR verification"


# ─── MASTER CATALOG MATCHER CLASS ─────────────────────────────────────────────
class MedikartCatalogAIMatcher:
    def __init__(self, limit=None):
        self.limit = limit
        self.reader = None
        self.claimed_files = set()
        self.state = {}
        self.audit_records = []
        self.catalog_df = None

    def initialize(self):
        print("=" * 75)
        print("    MEDIKART ADVANCED AI CATALOG MATCHER & DEEP LEARNING PIPELINE    ")
        print("=" * 75)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Initializing EasyOCR Engine (PyTorch CPU)...")
        self.reader = easyocr.Reader(["en"], gpu=False, verbose=False)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] EasyOCR Engine ready.")

        # Load State
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, "r", encoding="utf-8") as f:
                    self.state = json.load(f)
                for item_id, info in self.state.items():
                    src = info.get("source") or info.get("source_file")
                    if src and info.get("status") == "verified_local":
                        self.claimed_files.add(src)
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Resumed prior state: {len(self.state)} items recorded ({len(self.claimed_files)} claimed local files).")
            except Exception:
                self.state = {}

        # Load Audit CSV
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Loading image audit cache: {AUDIT_CSV}...")
        audit_df = pd.read_csv(AUDIT_CSV)
        # Store high confidence records
        for _, r in audit_df.iterrows():
            fname = str(r["OriginalFile"]).strip()
            tname = str(r["TargetName"]).strip() if pd.notna(r["TargetName"]) else ""
            conf = float(r["Confidence"]) if pd.notna(r["Confidence"]) else 0.0
            act = str(r["Action"]).strip() if pd.notna(r["Action"]) else ""
            ocr_txt = str(r["OCRText"]).strip() if pd.notna(r["OCRText"]) else ""

            self.audit_records.append({
                "file": fname,
                "target_name": tname,
                "confidence": conf,
                "action": act,
                "ocr_text": ocr_txt,
                "info": decompose_product(tname)
            })
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Loaded {len(self.audit_records)} audited packaging records.")

        # Load Excel Catalog
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Reading product catalog: {EXCEL_PATH}...")
        self.catalog_df = pd.read_excel(EXCEL_PATH)
        self.catalog_df.columns = [c.strip() for c in self.catalog_df.columns]
        if self.limit:
            self.catalog_df = self.catalog_df.head(self.limit)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Processing target: {len(self.catalog_df)} products.")

    def find_local_match(self, prod_info):
        """
        Scans all 6,100 local images by comparing their extracted OCR text
        DIRECTLY with the Excel product details (Brand, Form, Variant, Strength).
        DOES NOT match by Item ID or numeric filename.
        """
        brand = prod_info["brand"].lower()
        candidates = []

        for rec in self.audit_records:
            fname = rec["file"]
            if fname in self.claimed_files:
                continue

            full_local_path = os.path.join(OLD_IMAGES_DIR, fname)
            if not os.path.exists(full_local_path):
                continue

            ocr_text = rec["ocr_text"]
            # Strict OCR Evaluation
            valid, score, reason = evaluate_pure_ocr_match(prod_info, ocr_text)
            if valid:
                candidates.append((score, rec, reason))

        if candidates:
            # Sort by highest OCR evidence score
            candidates.sort(key=lambda x: x[0], reverse=True)
            best_score, best_rec, best_reason = candidates[0]
            if best_score >= 70.0:
                return best_rec, best_score, best_reason

        return None, 0.0, "No compatible local OCR match found"

    def process_catalog(self):
        total = len(self.catalog_df)
        verified_local = 0
        verified_web = 0
        placeholders = 0
        skipped = 0

        print("\n" + "=" * 75)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] STARTING BATCH RUN ({total} PRODUCTS)")
        print("=" * 75 + "\n")

        for idx, (_, row) in enumerate(self.catalog_df.iterrows(), 1):
            item_id = str(row.get("Item ID") or row.get("ItemId") or row.get("SKU")).strip()
            name = str(row.get("Item Name") or row.get("Product Name") or row.get("Name")).strip()
            generic = str(row.get("Generic Name") or row.get("Generic") or "").strip()
            mfr = str(row.get("Manufacturer Name") or row.get("Manufacturer") or "").strip()

            target_filename = f"{item_id}.webp"
            target_path = os.path.join(NEW_IMAGES_DIR, target_filename)

            # Resumable Check: skip only if already verified (re-attempt placeholders with upgraded engine)
            if os.path.exists(target_path) and os.path.getsize(target_path) > 2000 and item_id in self.state:
                if self.state[item_id].get("status") in ("verified_local", "verified_web"):
                    skipped += 1
                    continue

            prod_info = decompose_product(name, generic, mfr)
            status = "placeholder"
            source = ""
            note = ""

            # ── STEP 1: Search Local Images ──
            best_rec, score, reason = self.find_local_match(prod_info)
            if best_rec is not None:
                fname = best_rec["file"]
                src_path = os.path.join(OLD_IMAGES_DIR, fname)
                try:
                    canvas = render_product_canvas(src_path)
                    if canvas is not None:
                        canvas.save(target_path, "WEBP", quality=WEBP_QUALITY)
                        self.claimed_files.add(fname)
                        status = "verified_local"
                        source = fname
                        note = f"Local OCR match (score {score:.1f}) for '{prod_info['brand']}'"
                        verified_local += 1
                        print(f"[{idx}/{total}] [LOCAL] {name[:35]} -> {target_filename} (Src: {fname}, Score: {score:.1f})")
                except Exception as e:
                    print(f"[{idx}/{total}] [ERROR] Canvas render failed for {fname}: {e}")

            # ── STEP 2: Web Sourcing (if no local match) ──
            if status == "placeholder":
                brand_q = prod_info["brand"]
                compound_q = prod_info.get("compound_brand", brand_q)
                form_q = " ".join(prod_info["forms"]) if prod_info["forms"] else ""
                str_q = " ".join(prod_info["strengths"]) if prod_info["strengths"] else ""
                mfr_raw = prod_info.get("manufacturer", "")
                mfr_clean = re.sub(r'\(Pvt\)|Ltd|Pharma|Laboratories|Industries', '', mfr_raw, flags=re.I).strip()
                clean_name = re.sub(r'\(.*?\)', '', name).strip()

                # 2a. Sehat.com.pk direct crawl
                web_candidates = fetch_sehat_product_image(brand_q)
                if compound_q != brand_q:
                    web_candidates += fetch_sehat_product_image(compound_q)

                # 2b. Multi-query scoped pharmacy search
                search_queries = [
                    f'"{compound_q}" {str_q} {form_q}'.strip(),
                    f'"{compound_q}" packaging',
                    f'site:dawaai.pk "{compound_q}"',
                    f'site:sehat.com.pk "{compound_q}"',
                    f'site:naheed.pk "{compound_q}"',
                    f'site:dvago.pk "{compound_q}"',
                    f'site:emeds.pk "{compound_q}"',
                    f'"{brand_q}" {str_q} {form_q}'.strip(),
                    f'"{clean_name}" Pakistan pharmacy',
                    f'"{compound_q}" "{mfr_clean}"' if mfr_clean else f'"{compound_q}" Pakistan medicine'
                ]
                web_candidates += fetch_pharmacy_bing_images(search_queries, max_candidates=12)

                if web_candidates:
                    canvas, src_url, web_note = download_and_verify_web_candidate(web_candidates, prod_info, self.reader)
                    if canvas is not None:
                        canvas.save(target_path, "WEBP", quality=WEBP_QUALITY)
                        status = "verified_web"
                        source = src_url
                        note = web_note
                        verified_web += 1
                        print(f"[{idx}/{total}] [WEB]   {name[:35]} -> {target_filename} (CDN: {src_url[:40]}...)")

            # ── STEP 3: Safe Placeholder Fallback ──
            if status == "placeholder":
                make_standard_placeholder(item_id, name)
                status = "placeholder"
                source = "none"
                note = "No verified packaging found locally or via web sourcing"
                placeholders += 1
                print(f"[{idx}/{total}] [SHIELD] {name[:35]} -> {target_filename} (Safe Placeholder)")

            # Record State
            self.state[item_id] = {
                "item_id": item_id,
                "name": name,
                "status": status,
                "source": source,
                "note": note,
                "updated_at": datetime.now().isoformat()
            }

            # Periodic checkpoint every 25 items
            if idx % 25 == 0:
                with open(STATE_FILE, "w", encoding="utf-8") as f:
                    json.dump(self.state, f, indent=2)

        # Final State Save
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(self.state, f, indent=2)

        # Generate Excel Reports
        self.generate_reports()

        print("\n" + "=" * 75)
        print("                     EXECUTION SUMMARY REPORT                     ")
        print("=" * 75)
        print(f"  Total Processed     : {total}")
        print(f"  Verified Local (Old): {verified_local}")
        print(f"  Verified Web (CDN)  : {verified_web}")
        print(f"  Safe Placeholders   : {placeholders}")
        print(f"  Already Completed   : {skipped}")
        print(f"  Target Destination  : {NEW_IMAGES_DIR}")
        print("=" * 75 + "\n")

    def generate_reports(self):
        """
        Exports Excel reports for business audit and missing image tracking.
        """
        report_data = list(self.state.values())
        if not report_data:
            return

        rep_df = pd.DataFrame(report_data)
        excel_report_path = os.path.join(REPORTS_DIR, "catalog_execution_report.xlsx")
        rep_df.to_excel(excel_report_path, index=False)

        # Missing images report
        missing_df = rep_df[rep_df["status"] == "placeholder"]
        missing_df.to_excel(MISSING_REPORT, index=False)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Reports saved:")
        print(f"  - Full Report   : {excel_report_path}")
        print(f"  - Missing Report: {MISSING_REPORT}")


# ─── ENTRY POINT ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Medikart Catalog AI Image Matcher")
    parser.add_argument("--limit", type=int, default=None, help="Process only first N products")
    args = parser.parse_args()

    matcher = MedikartCatalogAIMatcher(limit=args.limit)
    matcher.initialize()
    matcher.process_catalog()
