import urllib.request
import re
import ssl

ctx = ssl._create_unverified_context()
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

urls_to_try = [
    'https://derma.pk/products/acabel-4mg-tablet-lornoxicam',
    'https://healthwire.pk/pharmacy/products/acabel-4-mg-10-tablets',
    'https://dwatson.pk/products/acabel-4mg-tablets-10s',
]

for u in urls_to_try:
    try:
        req = urllib.request.Request(u, headers=headers)
        html = urllib.request.urlopen(req, context=ctx, timeout=8).read().decode('utf-8', 'ignore')
        imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|jpeg|png|webp)', html)
        valid = [i for i in imgs if any(k in i.lower() for k in ['cdn', 'product', 'upload', 'file', 'acabel'])]
        print(f"URL {u}: found {len(valid)} images")
        for v in valid[:3]:
            print("  ", v)
    except Exception as e:
        print(f"Error {u}: {e}")
