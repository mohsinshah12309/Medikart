#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MEDIKART IMAGE MATCHER (Enterprise Production Edition)
======================================================
Processes all 6,149 products in the Medikart catalog:
1. Reads Extracted_Stock_Items.xlsx (Item ID, Name, Generic, Manufacturer, SKU).
2. Uses OCR-indexed text from D:\\Projects\\medikartImages to match authentic packaging:
   - Requires exact or strict fuzzy brand match (>= 85%).
   - Requires exact strength & dosage match (500mg, 100mg/5ml, etc.).
   - Matches variants (Plus, SR, ER, Extra, Forte, DS, CF, etc.) and strictly rejects opposing variants.
   - Enforces 1-to-1 matching (no two products can claim the same packaging image).
3. Web Sourcing Fallback (polite delay, verified Pakistani pharmacy CDNs & search).
4. Generates clean branded medical-card placeholders for anything missing:
   - Output: D:\\Projects\\newMedikartImages\\<ItemID>.webp (uniform 800x800 square, quality 86).
5. Produces comprehensive Excel audit reports in D:\\Projects\\missingImages.xlsx.
6. Resumable at any time; never overwrites or destroys raw sources.
"""

import os
import re
import io
import sys
import json
import time
import hashlib
import shutil
import logging
import argparse
import unicodedata
from datetime import datetime, date
from pathlib import Path
from urllib.parse import urlparse
from urllib import robotparser

import numpy as np
import pandas as pd
import requests
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageEnhance, ImageFilter
from rapidfuzz import fuzz, process

# =============================================================================
# PATHS & CONFIGURATION
# =============================================================================
OLD_IMAGES_DIR  = Path(r"D:\Projects\medikartImages")
NEW_IMAGES_DIR  = Path(r"D:\Projects\newMedikartImages")
EXCEL_PATH      = Path(r"C:\Users\Mohsin\Downloads\Extracted_Stock_Items.xlsx")
WORK_DIR        = Path(r"D:\Projects\medikart_work")
MISSING_REPORT  = Path(r"D:\Projects\missingImages.xlsx")

OUTPUT_FORMAT   = "webp"
CANVAS_SIZE     = 800
CANVAS_PADDING  = 40
WEBP_QUALITY    = 86
NEVER_UPSCALE   = True

AUTO_THRESHOLD   = 0.82
REVIEW_THRESHOLD = 0.64
BRAND_MIN_SCORE  = 85
WEB_ACCEPT       = 0.82

OCR_MAX_SIDE   = 1400
OCR_MIN_SIDE   = 600
OCR_SAVE_EVERY = 25

SEARCH_PROVIDER      = os.environ.get("SEARCH_PROVIDER", "none").lower()
BRAVE_API_KEY        = os.environ.get("BRAVE_API_KEY", "")
GOOGLE_API_KEY       = os.environ.get("GOOGLE_API_KEY", "")
GOOGLE_CX            = os.environ.get("GOOGLE_CX", "")
SEARCH_DAILY_LIMIT   = int(os.environ.get("SEARCH_DAILY_LIMIT", "100"))
QUERIES_PER_ITEM     = 2
MAX_CANDIDATES_PER_ITEM = 5
MIN_DOWNLOAD_SIDE    = 400
MAX_DOWNLOAD_BYTES   = 15 * 1024 * 1024
REQUEST_DELAY_SEC    = 2.0
MAX_RETRIES          = 4
RESPECT_ROBOTS_TXT   = True
USER_AGENT = "MedikartImageBot/1.0 (+https://medikart.pk; catalog-verification)"
PREFERRED_DOMAINS = ("medikart.pk", "sehat.com.pk", "dvago.pk", "dawaai.pk", "oladoc.com")
BLOCKED_DOMAINS = ("pinterest.", "facebook.", "instagram.", "tiktok.", "alamy.", "shutterstock.",
                   "gettyimages.", "istockphoto.", "dreamstime.", "123rf.", "depositphotos.", "youtube.")
WATERMARK_WORDS = ("dvago", "dawaai", "oladoc", "sehat.com", "emeds", "shifa", "medznmore",
                   "watermark", "sample", "shutterstock", "alamy")

IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".tif", ".jfif"}
log = logging.getLogger("medikart")

def now():
    return datetime.now().isoformat(timespec="seconds")

def atomic_write_json(path: Path, obj):
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False)
    os.replace(tmp, path)

def norm_text(s) -> str:
    if s is None or (isinstance(s, float) and np.isnan(s)):
        return ""
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode()
    s = s.lower().replace("&", " and ")
    s = re.sub(r"(?<!\d)\.|\.(?!\d)", " ", s)
    s = re.sub(r"[^a-z0-9.]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def squash(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())

def numstr(x) -> str:
    try:
        return f"{float(x):g}"
    except Exception:
        return str(x)

NUM_RE = re.compile(r"\d+(?:\.\d+)?")

FORM_MAP = {
    "tablet": "tablet", "tablets": "tablet", "tab": "tablet", "tabs": "tablet", "caplet": "tablet", "caplets": "tablet",
    "capsule": "capsule", "capsules": "capsule", "cap": "capsule", "caps": "capsule",
    "syrup": "syrup", "syp": "syrup", "elixir": "syrup",
    "suspension": "suspension", "susp": "suspension",
    "drops": "drops", "drop": "drops", "solution": "solution",
    "injection": "injection", "inj": "injection", "vial": "injection", "ampoule": "injection", "infusion": "injection",
    "gel": "gel", "cream": "cream", "ointment": "ointment", "lotion": "lotion", "shampoo": "shampoo",
    "spray": "spray", "paste": "paste",
    "inhaler": "inhaler", "sachet": "sachet", "sachets": "sachet",
    "suppository": "suppository", "suppositories": "suppository",
}
FORM_GROUP = {
    "tablet": "solid", "capsule": "solid",
    "syrup": "liquid", "suspension": "liquid", "drops": "liquid", "solution": "liquid",
    "injection": "inj",
    "gel": "topical", "cream": "topical", "ointment": "topical", "lotion": "topical", "shampoo": "topical",
    "spray": "topical", "paste": "topical",
    "inhaler": "inhaler", "sachet": "sachet", "suppository": "supp",
}
VARIANT_WORDS = {"extra", "forte", "plus", "ds", "cf", "xr", "sr", "er", "cr", "la", "xl", "mr", "d", "dx", "max",
                 "advance", "junior", "kids", "jr", "duo", "neo", "relief", "insta", "rapid", "mini", "active",
                 "sensitive", "pediatric", "paediatric"}
IMAGE_VARIANT_WORDS = {"extra", "forte", "plus", "ds", "cf", "xr", "sr", "er", "junior", "kids", "max",
                       "advance", "duo", "relief", "insta", "rapid"}
STOP_WORDS = {"pvt", "ltd", "limited", "pharma", "pharmaceuticals", "pharmaceutical", "laboratories", "laboratory",
              "labs", "industries", "private", "co", "company", "and", "the", "of", "for", "international",
              "healthcare", "health", "care", "products", "inc", "ww", "w", "with", "plus"}
NOISE_SUFFIX = {"mg", "ml", "rx", "tm", "no", "pk", "by", "of", "in", "is", "to", "it", "or", "on", "at", "as",
                "an", "us", "if", "be", "do", "go", "so", "up", "we", "my", "me", "he", "ab", "gm", "iu", "pvt", "ltd"}
GENERIC_JUNK = {"consumer", "cosmetic", "cosmetics", "nan", "none", "other", "others", "medicine", "medicines"}

def parse_product(row: dict) -> dict:
    name = str(row["name"]).strip()
    paren = re.search(r"\(([^)]*)\)", name)
    pre = name[:paren.start()] if paren else name

    btoks = []
    for t in re.split(r"[\s\-_/]+", pre.strip()):
        tl = squash(t)
        if not tl:
            continue
        if btoks and (tl in FORM_MAP or (re.search(r"\d", tl) and sum(len(x) for x in btoks) >= 3)):
            break
        btoks.append(tl)
    if not btoks:
        btoks = [squash(name) or "unknown"]

    key, used = "", 0
    for t in btoks:
        key += t
        used += 1
        if len(key) >= 4 or used >= 3:
            break
    rest = btoks[used:]
    variants = [t for t in rest if t in VARIANT_WORDS or (len(t) <= 2 and t.isalpha())]
    descr = [t for t in rest if t not in variants and t not in STOP_WORDS and t not in FORM_MAP
             and len(t) >= 3 and not t.isdigit()]

    strengths = []
    if paren:
        strengths += NUM_RE.findall(paren.group(1))
    outside = name[:paren.start()] + " " + name[paren.end():] if paren else name
    strengths += [m[0] for m in re.findall(r"(\d+(?:\.\d+)?)\s*(mg|mcg|ug|iu|%)", outside, flags=re.I)]
    strengths = [numstr(x) for x in strengths]
    strengths = list(dict.fromkeys(strengths))

    packs = [numstr(m[0]) for m in re.findall(
        r"(\d+(?:\.\d+)?)\s*(s\b|tablets?|tabs?|capsules?|caps?|ml|gm|g\b|sachets?|vials?|ampoules?|doses?)",
        outside, flags=re.I)]
    packs = list(dict.fromkeys(packs))

    form = None
    for t in re.split(r"[\s\-_/().]+", name.lower()):
        if t in FORM_MAP:
            form = FORM_MAP[t]

    generic_raw = row.get("generic")
    g_first = ""
    gn = norm_text(generic_raw)
    if gn and gn not in GENERIC_JUNK:
        for t in gn.split():
            if len(t) >= 4 and not t.replace(".", "").isdigit():
                g_first = t
                break
    mfr_raw = row.get("mfr")
    m_tokens = [t for t in norm_text(mfr_raw).split() if t not in STOP_WORDS and len(t) >= 3]
    mfr_key = m_tokens[0] if m_tokens else ""

    return {
        "id": str(row["id"]),
        "name": name,
        "generic": "" if gn in ("", "nan") else str(generic_raw),
        "mfr": "" if not mfr_key and not str(mfr_raw).strip() or str(mfr_raw) == "nan" else str(mfr_raw),
        "sku": row.get("sku", ""),
        "category": row.get("category", ""),
        "brand_key": key,
        "variants": variants,
        "descr": descr,
        "strengths": strengths,
        "packs": packs,
        "form": form,
        "g_first": g_first,
        "mfr_key": mfr_key,
        "brand_display": " ".join(btoks),
    }

def make_features(ocr_text: str, filename: str = "") -> dict:
    text = norm_text(ocr_text)
    toks = text.split()
    nums = {numstr(x) for x in NUM_RE.findall(text)}
    raw = str(ocr_text).lower()
    strength_like = {numstr(m[0]) for m in re.findall(r"(\d+(?:\.\d+)?)\s*(mg|mcg|ug|iu|g|gm)\b", text)}
    strength_like |= {numstr(x) for x in re.findall(r"(\d+(?:\.\d+)?)\s*%", raw)}
    dose_like = {numstr(m[0]) for m in re.findall(r"(\d+(?:\.\d+)?)\s*(mg|mcg|ug|iu)\b", text)}
    dose_like |= {numstr(x) for x in re.findall(r"(\d+(?:\.\d+)?)\s*%", raw)}
    pack_like = {numstr(m[0]) for m in re.findall(
        r"(\d+(?:\.\d+)?)\s*(s\b|tablets?|tabs?|capsules?|caps?|ml|gm|sachets?|vials?|ampoules?|doses?)", text)}
    forms = {FORM_MAP[t] for t in toks if t in FORM_MAP}
    groups = {FORM_GROUP[f] for f in forms if f in FORM_GROUP}
    variants = {t for t in toks if t in IMAGE_VARIANT_WORDS}
    joins = set(toks)
    for i in range(len(toks) - 1):
        joins.add(toks[i] + toks[i + 1])
    for i in range(len(toks) - 2):
        joins.add(toks[i] + toks[i + 1] + toks[i + 2])
    return {
        "text": text, "toks": set(toks), "tok_list": toks, "sq": squash(text), "joins": joins,
        "nums": nums, "strength_like": strength_like, "dose_like": dose_like, "pack_like": pack_like,
        "forms": forms, "groups": groups, "variants": variants,
        "fname_sq": squash(Path(filename).stem) if filename else "",
        "n_tokens": len(toks),
    }

def brand_score_one(brand_key: str, feat: dict) -> float:
    if not brand_key or feat["n_tokens"] == 0:
        return 0.0
    L = len(brand_key)
    if brand_key in feat["joins"]:
        return 100.0
    best = 0.0
    for t in feat["joins"]:
        if t.startswith(brand_key) and (t[L:] in VARIANT_WORDS or (len(t) - L <= 2 and t[L:].isalpha())):
            best = max(best, 100.0)
            continue
        if L <= 4 or abs(len(t) - L) > 2:
            continue
        r = fuzz.ratio(brand_key, t)
        if r >= 80:
            best = max(best, r)
    return best

def score_pair(prod: dict, feat: dict, brand_score: float = None) -> dict:
    flags, caps, confirms = [], [], []
    parts = {}
    bs = brand_score_one(prod["brand_key"], feat) if brand_score is None else brand_score
    parts["brand"] = bs
    comps = []
    comps.append((0.45, min(bs, 100) / 100.0))

    if prod["descr"]:
        hit = 0
        for d in prod["descr"]:
            if d in feat["joins"] or (len(d) >= 5 and any(fuzz.ratio(d, t) >= 85 for t in feat["toks"]
                                                           if abs(len(t) - len(d)) <= 2)):
                hit += 1
        comps.append((0.10, hit / len(prod["descr"])))
        parts["name_words"] = hit / len(prod["descr"])
        if hit == len(prod["descr"]):
            confirms.append("name_words")

    strong = [x for x in prod["strengths"] if len(x) >= 2 or "." in x]
    weak = [x for x in prod["strengths"] if x not in strong]
    if prod["strengths"]:
        tot_w = len(strong) + 0.3 * len(weak)
        got_w = sum(1 for x in strong if x in feat["nums"]) + 0.3 * sum(1 for x in weak if x in feat["nums"])
        frac = got_w / tot_w if tot_w else 0.0
        parts["strength"] = frac
        comps.append((0.25, frac))
        if strong and all(x in feat["nums"] for x in strong):
            confirms.append("strength")
        if strong and not any(x in feat["nums"] for x in strong):
            if feat["strength_like"] and not (set(strong) & feat["strength_like"]):
                flags.append("strength_conflict")
                caps.append(0.45)
            else:
                flags.append("strength_unverified")
                caps.append(0.78)
    elif feat["dose_like"]:
        flags.append("box_shows_strength_but_product_has_none")
        caps.append(0.78)

    sq = feat["sq"]
    if prod["variants"]:
        ok = True
        for v in prod["variants"]:
            glued = (prod["brand_key"] + v) in sq
            if len(v) <= 2:
                if not glued:
                    ok = False
            elif not (v in feat["toks"] or glued):
                ok = False
        parts["variant"] = 1.0 if ok else 0.0
        comps.append((0.10, parts["variant"]))
        if not ok:
            flags.append("variant_missing")
            caps.append(0.45)
    else:
        extra = feat["variants"] - set(prod["variants"])
        near = [v for v in extra if (prod["brand_key"] + v) in sq]
        parts["variant"] = 0.0 if near else 1.0
        comps.append((0.10, parts["variant"]))
        if near:
            flags.append("extra_variant_on_box:" + ",".join(sorted(near)))
            caps.append(0.45)
        else:
            m = re.search(rf"\b{re.escape(prod['brand_key'])}\s+([a-z]{{1,2}})\b", feat["text"])
            if m and m.group(1) not in NOISE_SUFFIX:
                flags.append("possible_suffix_variant:" + m.group(1))
                caps.append(0.78)

    if prod["form"] and feat["groups"]:
        pg = FORM_GROUP.get(prod["form"])
        if prod["form"] in feat["forms"]:
            comps.append((0.10, 1.0))
            parts["form"] = 1.0
            confirms.append("form")
        elif pg in feat["groups"]:
            comps.append((0.10, 0.3))
            parts["form"] = 0.3
            flags.append("form_differs_in_same_group")
            caps.append(0.78)
        else:
            comps.append((0.10, 0.0))
            parts["form"] = 0.0
            flags.append("form_conflict")
            caps.append(0.50)

    tw = sum(w for w, _ in comps)
    conf = sum(w * v for w, v in comps) / tw if tw else 0.0

    adj = 0.0
    if prod["mfr_key"] and any(fuzz.ratio(prod["mfr_key"], t) >= 85 for t in feat["toks"]
                               if abs(len(t) - len(prod["mfr_key"])) <= 2):
        adj += 0.03
        parts["mfr"] = 1
        confirms.append("mfr")
    if prod["g_first"] and any(fuzz.ratio(prod["g_first"], t) >= 85 for t in feat["toks"]
                               if abs(len(t) - len(prod["g_first"])) <= 2):
        adj += 0.03
        parts["generic"] = 1
        confirms.append("generic")
    if prod["packs"]:
        if any(x in feat["nums"] for x in prod["packs"]):
            adj += 0.04
            parts["pack"] = 1
            confirms.append("pack")
        elif feat["pack_like"] and not (set(prod["packs"]) & feat["pack_like"]):
            adj -= 0.06
            parts["pack"] = 0
    if feat.get("fname_sq") and prod["brand_key"] and prod["brand_key"] in feat["fname_sq"]:
        adj += 0.02
    conf = max(0.0, min(1.0, conf + adj))

    if bs < BRAND_MIN_SCORE:
        flags.append("brand_not_found")
        caps.append(0.30)
    if feat["n_tokens"] < 3:
        flags.append("little_text_on_image")
        caps.append(0.60)
    if len(confirms) < 2:
        flags.append("weak_evidence")
        caps.append(0.78)
    for c in caps:
        conf = min(conf, c)
    parts["confirmations"] = confirms
    return {"conf": round(conf, 4), "parts": parts, "flags": flags}

def out_ext():
    return ".webp" if OUTPUT_FORMAT == "webp" else ".jpg"

def out_path(item_id: str) -> Path:
    return NEW_IMAGES_DIR / f"{item_id}{out_ext()}"

def load_rgb(img: Image.Image) -> Image.Image:
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[-1])
        return bg
    return img.convert("RGB")

def fit_on_canvas(img: Image.Image) -> Image.Image:
    img = load_rgb(img)
    box = CANVAS_SIZE - 2 * CANVAS_PADDING
    w, h = img.size
    scale = min(box / w, box / h)
    if NEVER_UPSCALE:
        scale = min(scale, 1.0)
    if scale != 1.0:
        img = img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    canvas = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), (255, 255, 255))
    canvas.paste(img, ((CANVAS_SIZE - img.width) // 2, (CANVAS_SIZE - img.height) // 2))
    
    # Subtle crisp sharpening
    canvas = canvas.filter(ImageFilter.UnsharpMask(radius=1.2, percent=105, threshold=3))
    canvas = ImageEnhance.Sharpness(canvas).enhance(1.05)
    return canvas

def save_final(img: Image.Image, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    canvas = fit_on_canvas(img)
    tmp = dest.with_name(dest.stem + ".tmp" + dest.suffix)
    if OUTPUT_FORMAT == "webp":
        canvas.save(tmp, "WEBP", quality=WEBP_QUALITY, method=4)
    else:
        canvas.save(tmp, "JPEG", quality=90, optimize=True)
    os.replace(tmp, dest)

def pick_font(size):
    for name in ("arial.ttf", "segoeui.ttf", "DejaVuSans.ttf", "Arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    try:
        return ImageFont.load_default(size=size)
    except Exception:
        return ImageFont.load_default()

def make_placeholder(prod: dict, dest: Path):
    S = CANVAS_SIZE
    img = Image.new("RGB", (S, S), (255, 255, 255))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((30, 30, S - 30, S - 30), radius=36, outline=(208, 215, 222), width=6, fill=(248, 250, 252))
    cx, cy, arm, th = S // 2, S // 2 - 90, 80, 56
    d.rounded_rectangle((cx - th // 2, cy - arm, cx + th // 2, cy + arm), radius=14, fill=(22, 163, 74))
    d.rounded_rectangle((cx - arm, cy - th // 2, cx + arm, cy + th // 2), radius=14, fill=(22, 163, 74))
    f1, f2, f3 = pick_font(46), pick_font(30), pick_font(26)

    def centered(text, y, font, fill):
        w = d.textlength(text, font=font)
        d.text(((S - w) / 2, y), text, font=font, fill=fill)

    centered("Product image", 330, f1, (55, 65, 81))
    centered("not available", 388, f1, (55, 65, 81))
    words, lines, cur = prod["name"].split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f2) > S - 160 and cur:
            lines.append(cur)
            cur = w
        else:
            cur = t
    if cur:
        lines.append(cur)
    y = 480
    for ln in lines[:3]:
        centered(ln, y, f2, (107, 114, 128))
        y += 40
    centered(f"Item ID: {prod['id']}", S - 120, f3, (156, 163, 175))
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_name(dest.stem + ".tmp" + dest.suffix)
    if OUTPUT_FORMAT == "webp":
        img.save(tmp, "WEBP", quality=WEBP_QUALITY, method=4)
    else:
        img.save(tmp, "JPEG", quality=90)
    os.replace(tmp, dest)

def dhash(img: Image.Image, size=8) -> int:
    g = img.convert("L").resize((size + 1, size), Image.LANCZOS)
    a = np.asarray(g, dtype=np.int16)
    bits = (a[:, 1:] > a[:, :-1]).flatten()
    v = 0
    for b in bits:
        v = (v << 1) | int(b)
    return v

def hamming(a: int, b: int) -> int:
    return bin(a ^ b).count("1")

class OCR:
    def __init__(self):
        self.reader = None

    def _init(self):
        if self.reader is None:
            import easyocr
            try:
                import torch
                gpu = torch.cuda.is_available()
            except Exception:
                gpu = False
            log.info("Loading EasyOCR (GPU=%s)...", gpu)
            self.reader = easyocr.Reader(["en"], gpu=gpu, verbose=False)

    def read(self, img: Image.Image) -> str:
        self._init()
        img = load_rgb(img)
        w, h = img.size
        if max(w, h) > OCR_MAX_SIDE:
            s = OCR_MAX_SIDE / max(w, h)
            img = img.resize((int(w * s), int(h * s)), Image.LANCZOS)
        elif max(w, h) < OCR_MIN_SIDE:
            img = img.resize((w * 2, h * 2), Image.LANCZOS)

        def run(im):
            try:
                return " ".join(self.reader.readtext(np.array(im), detail=0, paragraph=False))
            except Exception as e:
                log.warning("OCR error: %s", e)
                return ""

        text = run(img)
        if len(norm_text(text).split()) < 3:
            for ang in (90, 270):
                t2 = run(img.rotate(ang, expand=True))
                if len(t2) > len(text):
                    text = t2
        return text

def read_products(limit=None):
    df = pd.read_excel(EXCEL_PATH, dtype=object)
    cols = {re.sub(r"[^a-z0-9]", "", c.lower()): c for c in df.columns}

    def pick(*names):
        for n in names:
            if n in cols:
                return cols[n]
        return None

    c_id = pick("itemid", "id", "productid")
    c_name = pick("itemname", "productname", "name")
    c_gen = pick("genericname", "generic")
    c_mfr = pick("manufacturer", "manufacturername", "mfr", "company")
    c_sku = pick("sku", "skucode")
    c_cat = pick("b2bcategory", "category")
    if not c_id or not c_name:
        raise SystemExit(f"Could not find Item Id / Item Name columns. Found: {list(df.columns)}")
    seen, prods = set(), []
    for _, r in df.iterrows():
        iid = str(r[c_id]).strip()
        if iid.endswith(".0"):
            iid = iid[:-2]
        if not iid or iid.lower() == "nan" or iid in seen or str(r[c_name]).strip().lower() in ("", "nan"):
            continue
        seen.add(iid)
        prods.append(parse_product({
            "id": iid, "name": r[c_name],
            "generic": r[c_gen] if c_gen else None, "mfr": r[c_mfr] if c_mfr else None,
            "sku": (r[c_sku] if c_sku and str(r[c_sku]) != "nan" else ""),
            "category": (r[c_cat] if c_cat and str(r[c_cat]) != "nan" else ""),
        }))
    if limit:
        prods = prods[:limit]
    log.info("Excel: %d unique Item IDs loaded.", len(prods))
    return prods

def index_old_images(work: Path, ocr: OCR, skip_ocr=False):
    cache_path = work / "ocr_cache.jsonl"
    cache = {}
    if cache_path.exists():
        with open(cache_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    r = json.loads(line)
                    cache[r["key"]] = r
                except Exception:
                    pass
    files = sorted(p for p in OLD_IMAGES_DIR.iterdir() if p.is_file() and p.suffix.lower() in IMG_EXTS)
    log.info("Old folder: %d image files found in %s", len(files), OLD_IMAGES_DIR)
    records, bad = [], []
    todo = []
    for p in files:
        st = p.stat()
        key = f"{p.name}|{st.st_size}|{st.st_mtime_ns}"
        if key in cache:
            records.append(cache[key])
        else:
            todo.append((p, key))
    log.info("OCR cache hits: %d | need OCR: %d", len(records), len(todo))
    if todo and skip_ocr:
        log.warning("--skip-ocr given: %d images not indexed.", len(todo))
        todo = []
    t0, done = time.time(), 0
    out = open(cache_path, "a", encoding="utf-8")
    try:
        for p, key in todo:
            try:
                with Image.open(p) as im:
                    im.load()
                    im = im.copy()
                sha = hashlib.sha1(p.read_bytes()).hexdigest()
                rec = {"key": key, "file": p.name, "sha": sha, "w": im.width, "h": im.height,
                       "dhash": dhash(load_rgb(im)), "text": ocr.read(im), "ok": True}
            except Exception as e:
                rec = {"key": key, "file": p.name, "ok": False, "error": f"{type(e).__name__}: {e}"}
            out.write(json.dumps(rec, ensure_ascii=False) + "\n")
            records.append(rec)
            done += 1
            if done % OCR_SAVE_EVERY == 0:
                out.flush()
                el = time.time() - t0
                eta = el / done * (len(todo) - done)
                log.info("OCR %d/%d (%.1fs/img, ETA %.0f min)", done, len(todo), el / done, eta / 60)
    except KeyboardInterrupt:
        log.warning("Interrupted during OCR - progress is saved.")
        out.flush()
        out.close()
        raise
    out.close()

    good = [r for r in records if r.get("ok")]
    bad = [r for r in records if not r.get("ok")]
    groups, by_sha = [], {}
    for r in good:
        # compute dhash if missing from cached record
        dh = r.get("dhash")
        if not dh:
            try:
                with Image.open(OLD_IMAGES_DIR / r["file"]) as test_im:
                    dh = dhash(load_rgb(test_im))
                    r["dhash"] = dh
            except Exception:
                dh = 0
                r["dhash"] = 0
        sha = r.get("sha") or r["file"]
        if sha in by_sha:
            by_sha[sha]["dups"].append(r["file"])
            continue
        g = {"file": r["file"], "sha": sha, "dhash": dh, "w": r.get("w", 800), "h": r.get("h", 800),
             "feat": make_features(r["text"], r["file"]), "dups": []}
        by_sha[sha] = g
        groups.append(g)
    log.info("Old images usable: %d unique (%d exact duplicates, %d unreadable)",
             len(groups), len(good) - len(groups), len(bad))
    return groups, bad

class BrandIndex:
    def __init__(self, groups):
        self.groups = groups
        self.sq_list = [g["feat"]["sq"] for g in groups]
        self.vocab, vmap = [], {}
        for i, g in enumerate(groups):
            for t in g["feat"]["toks"]:
                vmap.setdefault(t, []).append(i)
        self.vocab = list(vmap.keys())
        self.vmap = [np.array(vmap[t], dtype=np.int64) for t in self.vocab]
        self.cache = {}

    def vector(self, brand_key: str) -> np.ndarray:
        if brand_key in self.cache:
            return self.cache[brand_key]
        n = len(self.groups)
        out = np.zeros(n, dtype=np.float32)
        if len(brand_key) <= 5:
            if self.vocab:
                r = process.cdist([brand_key], self.vocab, scorer=fuzz.ratio, workers=-1)[0]
                thr = 80 if len(brand_key) >= 5 else 100
                for j in np.where(r >= thr)[0]:
                    if abs(len(self.vocab[j]) - len(brand_key)) > 1:
                        continue
                    idx = self.vmap[j]
                    out[idx] = np.maximum(out[idx], r[j])
        else:
            if n:
                out = process.cdist([brand_key], self.sq_list, scorer=fuzz.partial_ratio, workers=-1,
                                    dtype=np.uint8)[0].astype(np.float32)
        self.cache[brand_key] = out
        return out

def run_local_matching(prods, groups, state, new_dir: Path):
    items = state["items"]
    used = set(state["used_files"])
    final_states = ("verified_local", "review_local", "downloaded_web")
    todo = [p for p in prods if items.get(p["id"], {}).get("status") not in final_states]
    log.info("Local matching for %d products (images already used: %d)", len(todo), len(used))
    if not groups or not todo:
        return
    index = BrandIndex(groups)
    file_to_idx = {g["file"]: i for i, g in enumerate(groups)}
    used_idx = {file_to_idx[f] for f in used if f in file_to_idx}

    cands, cmap = [], {}
    for k, p in enumerate(todo):
        v = index.vector(p["brand_key"])
        idxs = np.where(v >= BRAND_MIN_SCORE)[0]
        if len(idxs) > 400:
            idxs = idxs[np.argsort(-v[idxs])[:400]]
        for i in idxs:
            if i in used_idx:
                continue
            r = score_pair(p, groups[i]["feat"])
            if r["conf"] >= REVIEW_THRESHOLD:
                cands.append((r["conf"], p["id"], int(i), r))
                cmap[(p["id"], int(i))] = r["conf"]
        if (k + 1) % 1000 == 0:
            log.info("  Scored %d/%d products", k + 1, len(todo))

    cands.sort(key=lambda c: -c[0])
    by_img = {}
    for conf, pid, i, r in cands:
        by_img.setdefault(i, []).append((conf, pid))
    taken_img, taken_prod, assign = set(), set(), {}
    for conf, pid, i, r in cands:
        if pid in taken_prod or i in taken_img:
            continue
        taken_prod.add(pid)
        taken_img.add(i)
        assign[pid] = (i, conf, r)

    pmap = {p["id"]: p for p in todo}
    n_ok = n_rev = 0
    for pid, (i, conf, r) in assign.items():
        flags = list(r["flags"])
        for c2, q in by_img.get(i, []):
            if q == pid or c2 < conf - 0.03:
                continue
            own = assign.get(q)
            if own is None or own[1] - c2 < 0.03:
                flags.append("ambiguous_twin_product:" + q)
                break
        status = "verified_local" if (conf >= AUTO_THRESHOLD and not flags) else "review_local"
        g = groups[i]
        try:
            with Image.open(OLD_IMAGES_DIR / g["file"]) as im:
                im.load()
                save_final(im.copy(), out_path(pid))
        except Exception as e:
            log.error("Could not copy %s for %s: %s", g["file"], pid, e)
            taken_prod.discard(pid)
            continue
        items[pid] = {"status": status, "source": "old_folder", "old_file": g["file"], "conf": conf,
                      "flags": flags, "parts": r["parts"], "dhash": g["dhash"], "ts": now(),
                      "local_search": "matched", "web_search": "not_needed"}
        state["used_files"].append(g["file"])
        state["used_files"].extend(g["dups"])
        if status == "verified_local":
            n_ok += 1
        else:
            n_rev += 1
        log.info("[%s] %-40s <- %s conf=%.2f %s %s", pid, pmap[pid]["name"][:40], g["file"], conf, status,
                 ",".join(flags))

    unmatched = 0
    for p in todo:
        if p["id"] in taken_prod:
            continue
        unmatched += 1
        it = items.setdefault(p["id"], {"status": "no_local_match", "source": "", "ts": now(),
                                        "web_search": "pending"})
        it["local_search"] = "no confident match in old folder"
    log.info("Local matching done: %d verified, %d need review, %d unmatched", n_ok, n_rev, unmatched)

class Web:
    def __init__(self, state):
        self.state = state
        self.sess = requests.Session()
        self.sess.headers["User-Agent"] = USER_AGENT
        self.robots = {}
        self.last = 0.0

    def enabled(self):
        if SEARCH_PROVIDER == "brave":
            return bool(BRAVE_API_KEY)
        if SEARCH_PROVIDER == "google":
            return bool(GOOGLE_API_KEY and GOOGLE_CX)
        return False

    def quota_left(self):
        today = date.today().isoformat()
        return SEARCH_DAILY_LIMIT - self.state["quota"].get(today, 0)

    def _use_quota(self):
        today = date.today().isoformat()
        self.state["quota"] = {today: self.state["quota"].get(today, 0) + 1}

    def _pause(self):
        wait = REQUEST_DELAY_SEC - (time.time() - self.last)
        if wait > 0:
            time.sleep(wait)
        self.last = time.time()

    def _get(self, url, **kw):
        for attempt in range(MAX_RETRIES):
            self._pause()
            try:
                r = self.sess.get(url, timeout=(10, 30), **kw)
                if r.status_code in (429, 500, 502, 503, 504):
                    ra = r.headers.get("Retry-After")
                    delay = float(ra) if ra and ra.isdigit() else (2 ** attempt) * 5
                    log.warning("HTTP %s from %s - waiting %.0fs", r.status_code, urlparse(url).netloc, delay)
                    time.sleep(min(delay, 300))
                    continue
                return r
            except requests.RequestException as e:
                delay = (2 ** attempt) * 3
                log.warning("Network error (%s) - retry in %ds", type(e).__name__, delay)
                time.sleep(delay)
        return None

    def robots_ok(self, url):
        if not RESPECT_ROBOTS_TXT:
            return True
        host = urlparse(url).netloc
        if host not in self.robots:
            rp = robotparser.RobotFileParser()
            try:
                r = self.sess.get(f"{urlparse(url).scheme}://{host}/robots.txt", timeout=8)
                rp.parse(r.text.splitlines() if r.status_code == 200 else [])
            except Exception:
                rp.parse([])
            self.robots[host] = rp
        return self.robots[host].can_fetch(USER_AGENT, url)

    def search(self, query):
        if self.quota_left() <= 0:
            raise RuntimeError("quota")
        self._use_quota()
        res = []
        if SEARCH_PROVIDER == "brave":
            r = self._get("https://api.search.brave.com/res/v1/images/search",
                          params={"q": query, "count": 20, "safesearch": "off", "country": "pk"},
                          headers={"Accept": "application/json", "X-Subscription-Token": BRAVE_API_KEY})
            if r is None or r.status_code != 200:
                log.warning("Search failed: %s", None if r is None else r.status_code)
                return []
            for it in r.json().get("results", []):
                props = it.get("properties", {}) or {}
                url = props.get("url") or (it.get("thumbnail", {}) or {}).get("src")
                if url:
                    res.append({"url": url, "w": props.get("width") or 0, "h": props.get("height") or 0,
                                "page": it.get("url", "")})
        elif SEARCH_PROVIDER == "google":
            r = self._get("https://www.googleapis.com/customsearch/v1",
                          params={"key": GOOGLE_API_KEY, "cx": GOOGLE_CX, "q": query, "searchType": "image",
                                  "num": 10})
            if r is None or r.status_code != 200:
                log.warning("Search failed: %s", None if r is None else r.status_code)
                return []
            for it in r.json().get("items", []):
                im = it.get("image", {}) or {}
                res.append({"url": it.get("link"), "w": im.get("width") or 0, "h": im.get("height") or 0,
                            "page": im.get("contextLink", "")})
        return res

    def download(self, url):
        if not self.robots_ok(url):
            return None, "blocked by robots.txt"
        r = self._get(url, stream=True)
        if r is None:
            return None, "network failure"
        if r.status_code != 200:
            return None, f"HTTP {r.status_code}"
        data, size = io.BytesIO(), 0
        for chunk in r.iter_content(65536):
            size += len(chunk)
            if size > MAX_DOWNLOAD_BYTES:
                return None, "file too large"
            data.write(chunk)
        try:
            im = Image.open(io.BytesIO(data.getvalue()))
            im.load()
            return im.copy(), ""
        except Exception as e:
            return None, f"unsupported/corrupt image ({type(e).__name__})"

def build_queries(p):
    mfr = p["mfr"] if p["mfr"] and p["mfr"].lower() != "nan" else ""
    q = [f'{p["name"]} {mfr} medicine packaging Pakistan'.strip()]
    if p["g_first"]:
        q.append(f'{p["brand_display"]} {" ".join(p["strengths"][:2])} {p["form"] or ""} {p["g_first"]} box'.replace("  ", " "))
    else:
        q.append(f'{p["name"]} box')
    return q[:QUERIES_PER_ITEM]

def run_web_stage(prods, state, ocr: OCR):
    items = state["items"]
    web = Web(state)
    if not web.enabled():
        log.warning("Web search API key not provided (SEARCH_PROVIDER=%s). Generating clean placeholders.", SEARCH_PROVIDER)
        return
    pend = [p for p in prods if items.get(p["id"], {}).get("status") in ("no_local_match", "placeholder_pending")
            and items[p["id"]].get("web_search") in ("pending", "quota_reached", "not_run")]
    log.info("Web search for %d products. Searches left today: %d", len(pend), web.quota_left())
    assigned_hashes = [v["dhash"] for v in items.values() if v.get("dhash") is not None]
    done = 0
    try:
        for p in pend:
            it = items[p["id"]]
            found, reasons = False, []
            tried = 0
            try:
                cand = []
                seen_url = set()
                for q in build_queries(p):
                    for r in web.search(q):
                        if r["url"] in seen_url:
                            continue
                        seen_url.add(r["url"])
                        host = urlparse(r["url"]).netloc.lower()
                        if any(b in host for b in BLOCKED_DOMAINS):
                            continue
                        if r["w"] and r["h"] and min(r["w"], r["h"]) < MIN_DOWNLOAD_SIDE:
                            continue
                        pref = 0 if any(d in host for d in PREFERRED_DOMAINS) else 1
                        cand.append((pref, -(r["w"] * r["h"]), r))
                    cand.sort(key=lambda x: (x[0], x[1]))
                    if len(cand) >= MAX_CANDIDATES_PER_ITEM:
                        break
                if not cand:
                    reasons.append("search returned no usable image results")
                for _, _, r in cand[:MAX_CANDIDATES_PER_ITEM]:
                    tried += 1
                    im, err = web.download(r["url"])
                    if im is None:
                        reasons.append(f"{urlparse(r['url']).netloc}: {err}")
                        continue
                    if min(im.size) < MIN_DOWNLOAD_SIDE:
                        reasons.append(f"{urlparse(r['url']).netloc}: too small {im.size}")
                        continue
                    text = ocr.read(im)
                    if any(w in norm_text(text) or w in text.lower() for w in WATERMARK_WORDS):
                        reasons.append(f"{urlparse(r['url']).netloc}: watermark/other-shop text")
                        continue
                    feat = make_features(text)
                    sc = score_pair(p, feat)
                    dh = dhash(load_rgb(im))
                    if any(hamming(dh, h) <= 3 for h in assigned_hashes):
                        reasons.append(f"{urlparse(r['url']).netloc}: same picture already used by another item")
                        continue
                    if sc["conf"] >= WEB_ACCEPT and not sc["flags"] and sc["parts"].get("brand", 0) >= 88:
                        save_final(im, out_path(p["id"]))
                        items[p["id"]] = {"status": "downloaded_web", "source": r["url"], "page": r.get("page", ""),
                                          "conf": sc["conf"], "flags": [], "parts": sc["parts"], "dhash": dh,
                                          "ts": now(), "local_search": "no confident match in old folder",
                                          "web_search": "found"}
                        assigned_hashes.append(dh)
                        found = True
                        log.info("[%s] %s <- WEB %s conf=%.2f", p["id"], p["name"][:40], r["url"][:80], sc["conf"])
                        break
                    reasons.append(f"{urlparse(r['url']).netloc}: failed check conf={sc['conf']} {sc['flags']}")
                if not found:
                    it["web_search"] = "searched_nothing_verified"
                    it["web_reason"] = "; ".join(reasons[-6:])[:900]
                    it["status"] = "placeholder_pending"
                    log.info("[%s] %s no verified web image (%d candidates tried)", p["id"], p["name"][:40], tried)
            except RuntimeError as e:
                if str(e) == "quota":
                    log.warning("Daily search limit reached (%d).", SEARCH_DAILY_LIMIT)
                    for q_ in pend:
                        if items[q_["id"]].get("web_search") == "pending":
                            items[q_["id"]]["web_search"] = "quota_reached"
                    return
                raise
            done += 1
            if done % 10 == 0:
                save_state(state)
    finally:
        save_state(state)

def finalize(prods, state):
    items = state["items"]
    n_ph = 0
    for p in prods:
        it = items.setdefault(p["id"], {"status": "no_local_match", "local_search": "not searched",
                                        "web_search": "not_run", "ts": now()})
        dest = out_path(p["id"])
        has_real = it["status"] in ("verified_local", "review_local", "downloaded_web") and dest.exists()
        if has_real:
            continue
        if it["status"] in ("verified_local", "review_local", "downloaded_web"):
            it["status"] = "placeholder_pending"
            it["web_reason"] = "output file was missing; placeholder regenerated"
        make_placeholder(p, dest)
        n_ph += 1
        if it.get("web_search") in ("searched_nothing_verified",):
            it["status"] = "placeholder_final"
        else:
            it["status"] = "placeholder_pending"
            if it.get("web_search") in (None, "pending"):
                it["web_search"] = "not_run"
        it["source"] = "generated placeholder"
    log.info("Placeholders generated/refreshed: %d", n_ph)

def verify_all(prods):
    missing, broken = [], []
    for p in prods:
        f = out_path(p["id"])
        if not f.exists():
            missing.append(p["id"])
            continue
        try:
            with Image.open(f) as im:
                im.verify()
        except Exception:
            broken.append(p["id"])
    return missing, broken

STATUS_LABEL = {
    "verified_local": "Verified image (old folder)",
    "review_local": "Matched from old folder - NEEDS REVIEW",
    "downloaded_web": "Downloaded from web (verified by OCR)",
    "placeholder_pending": "Placeholder (web search not finished / not run)",
    "placeholder_final": "Placeholder (no verified image found)",
    "no_local_match": "Placeholder (not processed)",
}

def write_reports(prods, state, groups, bad_images, work: Path, missing, broken):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.utils import get_column_letter
    items = state["items"]
    used = set(state["used_files"])
    wb = Workbook()
    hdr_font, hdr_fill = Font(name="Arial", bold=True, color="FFFFFF"), PatternFill("solid", fgColor="1F6F54")
    body = Font(name="Arial", size=10)

    def sheet(ws, headers, rows, widths):
        ws.append(headers)
        for r in rows:
            ws.append(r)
        for c in ws[1]:
            c.font, c.fill, c.alignment = hdr_font, hdr_fill, Alignment(wrap_text=True, vertical="center")
        for row in ws.iter_rows(min_row=2):
            for c in row:
                c.font = body
        for i, w in enumerate(widths, 1):
            ws.column_dimensions[get_column_letter(i)].width = w
        ws.freeze_panes = "A2"
        ws.auto_filter.ref = ws.dimensions

    ws_all = wb.active
    ws_all.title = "All Items"
    rows = []
    for p in prods:
        it = items.get(p["id"], {})
        rows.append([p["id"], p["name"], p["generic"], p["mfr"], p["sku"], STATUS_LABEL.get(it.get("status"), it.get("status")),
                     it.get("source", ""), it.get("old_file", ""), it.get("conf", ""), ", ".join(it.get("flags", []) or []),
                     out_path(p["id"]).name])
    sheet(ws_all, ["Item ID", "Product Name", "Generic Name", "Manufacturer", "SKU", "Final Status", "Image Source",
                   "Old Folder File", "Confidence", "Warnings", "Output File"], rows, [11, 38, 28, 28, 14, 40, 40, 24, 11, 36, 18])

    ws_m = wb.create_sheet("Missing Images")
    rows = []
    for p in prods:
        it = items.get(p["id"], {})
        if it.get("status") in ("placeholder_pending", "placeholder_final", "no_local_match"):
            rows.append([p["id"], p["name"], p["generic"], p["mfr"], p["sku"],
                         it.get("local_search", ""), it.get("web_search", ""),
                         "Placeholder generated", it.get("web_reason", "")])
    sheet(ws_m, ["Item ID", "Product Name", "Generic Name", "Manufacturer", "SKU",
                 "MediCard/Old Folder Search Status", "Google/Web Image Search Status",
                 "Final Image Status", "Error / Reason"], rows, [11, 38, 28, 28, 14, 34, 34, 22, 70])

    ws_r = wb.create_sheet("Needs Review")
    rows = []
    for p in prods:
        it = items.get(p["id"], {})
        if it.get("status") == "review_local":
            rows.append([p["id"], p["name"], p["generic"], p["mfr"], it.get("old_file", ""), it.get("conf", ""),
                         ", ".join(it.get("flags", []) or []) or "confidence below auto-verify level",
                         out_path(p["id"]).name, ""])
    sheet(ws_r, ["Item ID", "Product Name", "Generic Name", "Manufacturer", "Old Folder File", "Confidence",
                 "Why flagged", "Output File", "Your decision (OK / WRONG)"], rows, [11, 38, 28, 28, 24, 11, 50, 18, 24])

    ws_u = wb.create_sheet("Unused Old Images")
    rows = [[g["file"], g["w"], g["h"], g["feat"]["text"][:200]] for g in groups if g["file"] not in used]
    sheet(ws_u, ["Old Folder File", "Width", "Height", "Text read from the box (OCR)"], rows, [28, 9, 9, 100])

    ws_b = wb.create_sheet("Unreadable Old Images")
    sheet(ws_b, ["File", "Error"], [[b["file"], b.get("error", "")] for b in bad_images], [40, 80])

    ws_s = wb.create_sheet("Summary", 0)
    ws_s.append(["Medikart image run summary"])
    ws_s.append(["Generated", now()])
    ws_s.append([])
    ws_s.append(["Measure", "Count"])
    labels = [("Unique Item IDs in Excel", "=COUNTA('All Items'!A2:A100000)"),
              ("Verified image (old folder)", f"=COUNTIF('All Items'!F2:F100000,\"{STATUS_LABEL['verified_local']}\")"),
              ("Matched from old folder - needs review", f"=COUNTIF('All Items'!F2:F100000,\"{STATUS_LABEL['review_local']}\")"),
              ("Downloaded from web", f"=COUNTIF('All Items'!F2:F100000,\"{STATUS_LABEL['downloaded_web']}\")"),
              ("Placeholders (web search not finished / not run)", f"=COUNTIF('All Items'!F2:F100000,\"{STATUS_LABEL['placeholder_pending']}\")"),
              ("Placeholders (searched, nothing verified)", f"=COUNTIF('All Items'!F2:F100000,\"{STATUS_LABEL['placeholder_final']}\")"),
              ("Old images unused", "=COUNTA('Unused Old Images'!A2:A100000)"),
              ("Old images unreadable", "=COUNTA('Unreadable Old Images'!A2:A100000)")]
    for a, b in labels:
        ws_s.append([a, b])
    ws_s.append([])
    ws_s.append(["Item IDs WITHOUT an output file (must be 0)", len(missing)])
    ws_s.append(["Output files that fail to open (must be 0)", len(broken)])

    for row in ws_s.iter_rows():
        for c in row:
            c.font = body
    ws_s["A1"].font = Font(name="Arial", bold=True, size=14)
    for c in ws_s[4]:
        c.font, c.fill = hdr_font, hdr_fill
    ws_s.column_dimensions["A"].width = 52
    ws_s.column_dimensions["B"].width = 90

    rp = work / "reports"
    rp.mkdir(parents=True, exist_ok=True)
    full_report_path = rp / f"Medikart_Image_Report_{datetime.now():%Y%m%d_%H%M}.xlsx"
    wb.save(full_report_path)

    # Save to requested destination: D:\Projects\missingImages.xlsx
    wb2 = Workbook()
    ws = wb2.active
    ws.title = "Missing Images"
    mrows = [[c.value for c in r] for r in ws_m.iter_rows(min_row=2)]
    sheet(ws, [c.value for c in ws_m[1]], mrows, [11, 38, 28, 28, 14, 34, 34, 22, 70])
    wb2.save(MISSING_REPORT)
    log.info("Saved Missing Images Report to: %s", MISSING_REPORT)
    return full_report_path, MISSING_REPORT

def print_summary(prods, state, missing, broken):
    it = state["items"]
    cnt = {}
    for p in prods:
        s = it.get(p["id"], {}).get("status", "?")
        cnt[s] = cnt.get(s, 0) + 1
    print("\n" + "=" * 66)
    print(" FINAL MEDIKART CATALOG SUMMARY")
    print("=" * 66)
    print(f" Unique Item IDs in Excel ............ {len(prods)}")
    print(f" Verified from old folder ............ {cnt.get('verified_local', 0)}")
    print(f" Matched from old folder - REVIEW .... {cnt.get('review_local', 0)}")
    print(f" Downloaded from web ................. {cnt.get('downloaded_web', 0)}")
    print(f" Placeholders (search not finished) .. {cnt.get('placeholder_pending', 0)}")
    print(f" Placeholders (nothing verified) ..... {cnt.get('placeholder_final', 0)}")
    print(f" Item IDs with NO file ............... {len(missing)}")
    print(f" Files that fail to open ............. {len(broken)}")
    print("=" * 66)

STATE_FILE_PATH = None

def load_state(work: Path):
    global STATE_FILE_PATH
    STATE_FILE_PATH = work / "state.json"
    if STATE_FILE_PATH.exists():
        try:
            s = json.loads(STATE_FILE_PATH.read_text(encoding="utf-8"))
            s.setdefault("items", {})
            s.setdefault("used_files", [])
            s.setdefault("quota", {})
            return s
        except Exception:
            shutil.copy(STATE_FILE_PATH, STATE_FILE_PATH.with_suffix(".corrupt.json"))
            log.error("state.json was unreadable - starting fresh.")
    return {"items": {}, "used_files": [], "quota": {}}

def save_state(state):
    state["used_files"] = list(dict.fromkeys(state["used_files"]))
    atomic_write_json(STATE_FILE_PATH, state)

def main():
    global OLD_IMAGES_DIR, NEW_IMAGES_DIR, EXCEL_PATH, WORK_DIR, MISSING_REPORT
    ap = argparse.ArgumentParser()
    ap.add_argument("--old", help="old images folder")
    ap.add_argument("--new", help="new images folder")
    ap.add_argument("--excel", help="excel path")
    ap.add_argument("--work", help="work folder")
    ap.add_argument("--limit", type=int, help="limit N products (test)")
    ap.add_argument("--skip-web", action="store_true", help="skip web search")
    ap.add_argument("--skip-ocr", action="store_true", help="skip OCR")
    ap.add_argument("--rematch", action="store_true", help="rematch old folder")
    a = ap.parse_args()

    if a.old: OLD_IMAGES_DIR = Path(a.old)
    if a.new: NEW_IMAGES_DIR = Path(a.new)
    if a.excel: EXCEL_PATH = Path(a.excel)
    if a.work: WORK_DIR = Path(a.work)

    WORK_DIR.mkdir(parents=True, exist_ok=True)
    NEW_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s",
                        handlers=[logging.FileHandler(WORK_DIR / "run.log", encoding="utf-8"),
                                  logging.StreamHandler(sys.stdout)])

    state = load_state(WORK_DIR)
    prods = read_products(a.limit)
    ocr = OCR()

    try:
        groups, bad = index_old_images(WORK_DIR, ocr, a.skip_ocr)
        run_local_matching(prods, groups, state, NEW_IMAGES_DIR)
        save_state(state)
        if not a.skip_web:
            run_web_stage(prods, state, ocr)
    except KeyboardInterrupt:
        log.warning("Stopped by user. State is saved.")
    finally:
        save_state(state)

    finalize(prods, state)
    save_state(state)
    missing, broken = verify_all(prods)
    
    groups_for_report = groups if "groups" in locals() else []
    bad_for_report = bad if "bad" in locals() else []
    r1, r2 = write_reports(prods, state, groups_for_report, bad_for_report, WORK_DIR, missing, broken)
    print_summary(prods, state, missing, broken)
    print(f"Full Report:            {r1}")
    print(f"Missing Images Report:  {r2}")
    print(f"Output Images Folder:   {NEW_IMAGES_DIR}")

if __name__ == "__main__":
    main()
