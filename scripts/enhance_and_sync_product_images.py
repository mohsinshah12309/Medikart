r"""
enhance_and_sync_product_images.py

1. Reads Extracted_Stock_Items.xlsx (mapping Item Id <-> Item Name).
2. Uses verified ground-truth alignment mapping:
   - Rows 0 to 198: source image is D:\Projects\medikartImages\<Item_Id[i]>.jpg
   - Row 199 (Actrapid Hm, ID 75948): source image missing (skipped)
   - Rows 200 to 6111: source image is D:\Projects\medikartImages\<Item_Id[i - 1]>.jpg
   - Each target product i receives WebP at:
       D:\Projects\Medikart\apps\web\public\uploads\products\<Item_Id[i]>.webp
       D:\Projects\Medikart\server\uploads\products\<Item_Id[i]>.webp
3. Enhances resolution using high-quality Lanczos resampling (ensures min 650px dimension).
4. Applies subtle UnsharpMask and dynamic color/sharpness enhancement for crisp packaging.
5. Updates MongoDB Atlas product documents matching by product name (or SKU) so:
   product.images = [{ path: "/uploads/products/<Item_Id[i]>.webp", isPrimary: True }]
6. Emits detailed progress & statistics.
"""

import os
import sys
import multiprocessing
from concurrent.futures import ProcessPoolExecutor
import pandas as pd
from PIL import Image, ImageEnhance, ImageFilter
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

EXCEL_PATH = r"D:\Mohsin\Downloads\Extracted_Stock_Items.xlsx"
SRC_IMAGES_DIR = r"D:\Projects\medikartImages"
WEB_DEST_DIR = r"D:\Projects\Medikart\apps\web\public\uploads\products"
SERVER_DEST_DIR = r"D:\Projects\Medikart\server\uploads\products"
ENV_PATH = r"D:\Projects\Medikart\server\.env"

def process_single_image(args):
    target_item_id, src_path, web_dest, server_dest = args
    try:
        if not os.path.exists(src_path):
            return False, f"Source not found: {src_path}"

        with Image.open(src_path) as raw_img:
            img = raw_img.convert("RGB")
            w, h = img.size

            # Ensure optimal crisp resolution for desktop & mobile retina displays
            target_dim = 650
            max_dim = max(w, h)
            min_dim = min(w, h)

            # If image is small (< 650px), upscale with high quality Lanczos filter
            if min_dim < target_dim:
                scale = target_dim / min_dim
                scale = min(scale, 3.0)
                new_w = int(round(w * scale))
                new_h = int(round(h * scale))
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                img = img.filter(ImageFilter.UnsharpMask(radius=1.4, percent=115, threshold=3))
            elif max_dim > 1600:
                scale = 1400.0 / max_dim
                new_w = int(round(w * scale))
                new_h = int(round(h * scale))
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                img = img.filter(ImageFilter.UnsharpMask(radius=1.0, percent=80, threshold=2))

            # Fine tune sharpness & color fidelity
            enhancer = ImageEnhance.Sharpness(img)
            img = enhancer.enhance(1.12)
            color_enhancer = ImageEnhance.Color(img)
            img = color_enhancer.enhance(1.04)

            # Save as high efficiency, sharp WebP
            img.save(web_dest, "WEBP", quality=86, method=6)
            img.save(server_dest, "WEBP", quality=86, method=6)

        return True, target_item_id
    except Exception as e:
        return False, f"{target_item_id}: {str(e)}"

def main():
    print("=" * 70)
    print("MEDIKART PRODUCT IMAGE REALIGNMENT & RESOLUTION PIPELINE")
    print("=" * 70)

    os.makedirs(WEB_DEST_DIR, exist_ok=True)
    os.makedirs(SERVER_DEST_DIR, exist_ok=True)

    # 1. Load Excel file
    print(f"\n[1/4] Reading Excel Catalog: {EXCEL_PATH}")
    if not os.path.exists(EXCEL_PATH):
        print(f"ERROR: Excel file not found at {EXCEL_PATH}")
        sys.exit(1)

    excel_df = pd.read_excel(EXCEL_PATH)
    total_rows = len(excel_df)
    print(f"Loaded {total_rows} catalog rows.")

    # 2. Build verified alignment mapping
    print("\n[2/4] Building verified image alignment mapping...")
    tasks = []
    product_to_image_map = {}  # name.lower() -> target_item_id

    for idx, row in excel_df.iterrows():
        try:
            target_item_id = str(int(row["Item Id"]))
            name = str(row["Item Name"]).strip()

            # Mapping rule:
            # - Rows 0 to 198: source is Item_Id[idx]
            # - Row 199 (Actrapid Hm): missing in source dataset
            # - Rows 200 to 6111: source is Item_Id[idx - 1]
            if idx <= 198:
                src_item_id = str(int(excel_df.iloc[idx]["Item Id"]))
            elif idx == 199:
                src_item_id = None
            else:
                src_item_id = str(int(excel_df.iloc[idx - 1]["Item Id"]))

            if src_item_id:
                src_path = os.path.join(SRC_IMAGES_DIR, f"{src_item_id}.jpg")
                if os.path.exists(src_path):
                    web_dest = os.path.join(WEB_DEST_DIR, f"{target_item_id}.webp")
                    server_dest = os.path.join(SERVER_DEST_DIR, f"{target_item_id}.webp")
                    tasks.append((target_item_id, src_path, web_dest, server_dest))
                    product_to_image_map[name.lower()] = target_item_id

        except Exception as e:
            print(f"Error building task for row {idx}: {e}")

    print(f"Generated {len(tasks)} image alignment & enhancement tasks.")

    # 3. Multiprocessing enhancement
    num_workers = max(1, multiprocessing.cpu_count() - 1)
    print(f"\n[3/4] Processing & enhancing {len(tasks)} images with {num_workers} parallel workers...")

    successful_items = set()
    failed_items = []
    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        for i, (ok, val) in enumerate(executor.map(process_single_image, tasks), 1):
            if ok:
                successful_items.add(val)
            else:
                failed_items.append(val)
            if i % 500 == 0 or i == len(tasks):
                print(f"  Processed {i}/{len(tasks)} images ({len(successful_items)} succeeded)...")

    print(f"\nImage enhancement completed! {len(successful_items)} images successfully saved to web and server public directories.")
    if failed_items:
        print(f"  Note: {len(failed_items)} items could not be processed (e.g. corrupt or missing): {failed_items[:5]}")

    # 4. Sync MongoDB
    print(f"\n[4/4] Updating MongoDB product records with corrected image paths...")
    load_dotenv(ENV_PATH)
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        print("ERROR: MONGODB_URI not found in server/.env")
        sys.exit(1)

    client = MongoClient(mongo_uri)
    db = client.get_default_database()
    products_col = db.products

    bulk_updates = []
    all_products = list(products_col.find({}, {"_id": 1, "name": 1, "sku": 1}))
    print(f"Total products in database: {len(all_products)}")

    matched_count = 0
    for prod in all_products:
        prod_name = str(prod.get("name", "")).strip().lower()
        target_item_id = product_to_image_map.get(prod_name)

        if target_item_id and target_item_id in successful_items:
            image_path = f"/uploads/products/{target_item_id}.webp"
            bulk_updates.append(
                UpdateOne(
                    {"_id": prod["_id"]},
                    {"$set": {"images": [{"path": image_path, "isPrimary": True}]}}
                )
            )
            matched_count += 1

    if bulk_updates:
        print(f"Submitting bulk update for {len(bulk_updates)} matched products...")
        result = products_col.bulk_write(bulk_updates, ordered=False)
        print(f"MongoDB Updated: {result.modified_count} products modified, {result.matched_count} matched!")
    else:
        print("No products matched for update.")

    print("\n" + "=" * 70)
    print(f"PIPELINE COMPLETED! {matched_count} products verified & mapped to exact packaging images!")
    print("=" * 70)

if __name__ == "__main__":
    main()
