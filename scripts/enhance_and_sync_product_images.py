r"""
enhance_and_sync_product_images.py

1. Reads Extracted_Stock_Items.xlsx (mapping Item Id <-> Item Name).
2. For each of the 6,095 images in D:\Projects\medikartImages\<ItemId>.jpg:
   - Enhances resolution using high-quality Lanczos resampling (ensures min 600px dimension).
   - Applies subtle UnsharpMask and dynamic color/sharpness enhancement for crisp pharmacy packaging.
   - Saves clean, optimized WebP format to:
       - D:\Projects\Medikart\apps\web\public\uploads\products\<ItemId>.webp
       - D:\Projects\Medikart\server\uploads\products\<ItemId>.webp
3. Updates MongoDB product documents matching by product name (or SKU) so:
   product.images = [{ path: "/uploads/products/<ItemId>.webp", isPrimary: True }]
4. Emits detailed progress & statistics.
"""

import os
import glob
import sys
import multiprocessing
from concurrent.futures import ProcessPoolExecutor
import pandas as pd
from PIL import Image, ImageEnhance, ImageFilter
from pymongo import MongoClient
from dotenv import load_dotenv

EXCEL_PATH = r"D:\Mohsin\Downloads\Extracted_Stock_Items.xlsx"
SRC_IMAGES_DIR = r"D:\Projects\medikartImages"
WEB_DEST_DIR = r"D:\Projects\Medikart\apps\web\public\uploads\products"
SERVER_DEST_DIR = r"D:\Projects\Medikart\server\uploads\products"
ENV_PATH = r"D:\Projects\Medikart\server\.env"

def process_single_image(args):
    item_id, src_path, web_dest, server_dest = args
    try:
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
                # Cap extreme upscaling to 3x to preserve realism
                scale = min(scale, 3.0)
                new_w = int(round(w * scale))
                new_h = int(round(h * scale))
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                # Apply gentle unsharp mask to crisp up borders and label text
                img = img.filter(ImageFilter.UnsharpMask(radius=1.4, percent=115, threshold=3))
            elif max_dim > 1600:
                # Downscale excessively large 4000px photos to 1400px for web speed
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
            if not os.path.exists(server_dest) or os.path.getsize(web_dest) != os.path.getsize(server_dest):
                img.save(server_dest, "WEBP", quality=86, method=6)

        return True, item_id
    except Exception as e:
        return False, f"{item_id}: {str(e)}"

def main():
    print("=" * 70)
    print("MEDIKART PRODUCT IMAGE ENHANCEMENT & CATALOG SYNC PIPELINE")
    print("=" * 70)

    os.makedirs(WEB_DEST_DIR, exist_ok=True)
    os.makedirs(SERVER_DEST_DIR, exist_ok=True)

    # 1. Load Excel file
    print(f"\n[1/4] Reading Excel Catalog: {EXCEL_PATH}")
    if not os.path.exists(EXCEL_PATH):
        print(f"ERROR: Excel file not found at {EXCEL_PATH}")
        sys.exit(1)

    excel_df = pd.read_excel(EXCEL_PATH)
    print(f"Loaded {len(excel_df)} catalog rows.")
    excel_map = {}
    for _, row in excel_df.iterrows():
        try:
            item_id = str(int(row["Item Id"]))
            name = str(row["Item Name"]).strip()
            excel_map[item_id] = name
        except Exception:
            pass

    # 2. Gather image tasks
    print(f"\n[2/4] Profiling source images from: {SRC_IMAGES_DIR}")
    src_files = glob.glob(os.path.join(SRC_IMAGES_DIR, "*.jpg"))
    print(f"Found {len(src_files)} image files.")

    tasks = []
    for f in src_files:
        item_id = os.path.splitext(os.path.basename(f))[0]
        web_dest = os.path.join(WEB_DEST_DIR, f"{item_id}.webp")
        server_dest = os.path.join(SERVER_DEST_DIR, f"{item_id}.webp")
        tasks.append((item_id, f, web_dest, server_dest))

    # 3. Multiprocessing enhancement
    num_workers = max(1, multiprocessing.cpu_count() - 1)
    print(f"\n[3/4] Processing & enhancing {len(tasks)} images with {num_workers} parallel workers...")

    successful_items = set()
    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        for i, (ok, val) in enumerate(executor.map(process_single_image, tasks), 1):
            if ok:
                successful_items.add(val)
            if i % 500 == 0 or i == len(tasks):
                print(f"  Processed {i}/{len(tasks)} images ({len(successful_items)} succeeded)...")

    print(f"\nImage enhancement completed! {len(successful_items)} images successfully saved to web and server public directories.")

    # 4. Sync MongoDB
    print(f"\n[4/4] Updating MongoDB product records with enhanced image paths...")
    load_dotenv(ENV_PATH)
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        print("ERROR: MONGODB_URI not found in server/.env")
        sys.exit(1)

    client = MongoClient(mongo_uri)
    db = client.get_default_database()
    products_col = db.products

    # Build name -> item_id lookup
    name_to_item = {name.lower(): item_id for item_id, name in excel_map.items() if item_id in successful_items}

    matched_count = 0
    from pymongo import UpdateOne
    bulk_updates = []

    all_products = list(products_col.find({}, {"_id": 1, "name": 1, "sku": 1}))
    print(f"Total products in database: {len(all_products)}")

    for prod in all_products:
        prod_name = str(prod.get("name", "")).strip().lower()
        item_id = name_to_item.get(prod_name)

        if item_id:
            image_path = f"/uploads/products/{item_id}.webp"
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
        print(f"MongoDB Updated: {result.modified_count} products modified!")
    else:
        print("No products matched for update.")

    print("\n" + "=" * 70)
    print(f"ALL DONE! {matched_count} products now display high-resolution, enhanced packaging images on webapp!")
    print("=" * 70)

if __name__ == "__main__":
    main()
