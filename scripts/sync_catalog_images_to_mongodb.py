"""
Sync Verified Product Images to MongoDB Atlas
=============================================
Updates product documents in MongoDB Atlas so that their `images` array points to
their authentic 800x800 WebP packaging image at `/uploads/products/<sku>.webp`.
Products flagged as placeholders are assigned `/uploads/placeholder.webp`.
"""

import os
import sys
import json
import time
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

BASE_DIR = r"D:\Projects\Medikart"
ENV_PATH = os.path.join(BASE_DIR, "server", ".env")
load_dotenv(ENV_PATH)

STATE_FILE = r"D:\Projects\medikart_work\ai_matcher_state.json"
IMAGES_DIR = r"D:\Projects\newMedikartImages"

def main():
    uri = os.environ.get("MONGODB_URI")
    if not uri:
        print("ERROR: MONGODB_URI not found in environment.")
        sys.exit(1)

    print("Connecting to MongoDB Atlas...")
    client = MongoClient(uri, serverSelectionTimeoutMS=10000)
    db = client.get_database()
    print("Connected to database:", db.name)

    if not os.path.exists(STATE_FILE):
        print("ERROR: ai_matcher_state.json not found.")
        sys.exit(1)

    with open(STATE_FILE, "r", encoding="utf-8") as f:
        state = json.load(f)

    existing_files = set(os.listdir(IMAGES_DIR))
    print(f"Found {len(existing_files)} images in {IMAGES_DIR}")

    total_products = db.products.count_documents({})
    print(f"Total products in MongoDB: {total_products}")

    bulk_ops = []
    verified_count = 0
    placeholder_count = 0
    batch_size = 1000

    start_time = time.time()

    cursor = db.products.find({}, {"_id": 1, "sku": 1, "name": 1})
    for p in cursor:
        doc_id = p["_id"]
        sku = p.get("sku", "")
        img_name = f"{sku}.webp"

        item_status = state.get(sku, {}).get("status", "")

        if img_name in existing_files and item_status != "placeholder":
            image_path = f"/uploads/products/{img_name}"
            verified_count += 1
        else:
            image_path = "/uploads/placeholder.webp"
            placeholder_count += 1

        update_doc = {
            "$set": {
                "images": [
                    {
                        "path": image_path,
                        "isPrimary": True
                    }
                ]
            }
        }
        bulk_ops.append(UpdateOne({"_id": doc_id}, update_doc))

        if len(bulk_ops) >= batch_size:
            db.products.bulk_write(bulk_ops, ordered=False)
            print(f"Committed batch of {len(bulk_ops)} updates...")
            bulk_ops = []

    if bulk_ops:
        db.products.bulk_write(bulk_ops, ordered=False)
        print(f"Committed final batch of {len(bulk_ops)} updates.")

    elapsed = round(time.time() - start_time, 2)
    print("\n" + "=" * 60)
    print("MONGODB CATALOG IMAGE SYNC COMPLETE")
    print("=" * 60)
    print(f"Total Products Updated : {total_products}")
    print(f"Verified Images Assigned : {verified_count}")
    print(f"Placeholder Fallbacks   : {placeholder_count}")
    print(f"Time Taken              : {elapsed} seconds")
    print("=" * 60)

if __name__ == "__main__":
    main()
