import json
import os
import easyocr

reader = easyocr.Reader(['en'], gpu=False, verbose=False)
state = json.load(open(r'D:\Projects\medikart_work\ai_matcher_state.json', encoding='utf-8'))

local_items = [(k, v) for k, v in state.items() if v.get('status') == 'verified_local']
print(f"Total verified_local items: {len(local_items)}")

sample = local_items[:20]
for k, v in sample:
    webp_path = os.path.join(r'D:\Projects\newMedikartImages', f"{k}.webp")
    if not os.path.exists(webp_path):
        print(f"MISSING: {k}")
        continue
    ocr_lines = reader.readtext(webp_path, detail=0)
    ocr_text = " ".join(ocr_lines).lower()
    name = v.get("name", "")
    brand = name.split()[0].lower()
    matched = brand in ocr_text
    print(f"[{'PASS' if matched else 'FAIL'}] {name} -> WebP OCR: '{ocr_text[:60]}'")
