#!/usr/bin/env python3
"""
scripts/diagnose_seo_crawler.py — Phase 0 Read-Only Diagnostic Crawler
For https://medikart.pk (Medikart Technical SEO Audit)

Follows only real <a href> links starting from the homepage.
Reads sitemap.xml to cross-reference sitemap coverage and detect orphans.
Records:
  - HTTP Status Code
  - Redirect Chain
  - Canonical Tag
  - Robots Meta / X-Robots-Tag
  - Click Depth from Homepage
  - Inbound Internal Link Count
  - Title
  - Word Count
  - Sitemap Presence

Outputs:
  - Orphan List (in sitemap but 0 inlinks from crawl)
  - Depth Distribution
  - Products Unreachable by Links
  - Pages with < 3 Inlinks
  - Redirect Chains & Canonical Anomalies
"""

import sys
import os
import time
import re
import json
import urllib.request
import urllib.parse
from html.parser import HTMLParser
import xml.etree.ElementTree as ET
from collections import deque, defaultdict
import concurrent.futures

# Unbuffer stdout so logs flush immediately
sys.stdout.reconfigure(line_buffering=True)

BASE_URL = 'https://medikart.pk'
USER_AGENT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
MAX_DEPTH = 3           # Core SEO crawl horizon (Googlebot priority horizon)
MAX_PAGES = 1500        # Comprehensive audit sample
NUM_WORKERS = 6         # Polite concurrent worker pool
REQUEST_DELAY = 0.04    # Polite 40ms inter-request throttle

class LinkExtractor(HTMLParser):
    def __init__(self, page_url):
        super().__init__()
        self.page_url = page_url
        self.internal_links = set()
        self.canonical = None
        self.robots_meta = None
        self.title = None
        self.in_title = False
        self.in_script = False
        self.text_chunks = []

    def handle_starttag(self, tag, attrs):
        attr_dict = {k.lower(): v for k, v in attrs if k}
        
        if tag == 'title':
            self.in_title = True
        elif tag in ('script', 'style', 'noscript', 'svg'):
            self.in_script = True
        elif tag == 'link':
            rel = attr_dict.get('rel', '').lower()
            if 'canonical' in rel:
                self.canonical = attr_dict.get('href')
        elif tag == 'meta':
            name = attr_dict.get('name', '').lower()
            if name == 'robots':
                self.robots_meta = attr_dict.get('content')
        elif tag == 'a':
            href = attr_dict.get('href')
            if href:
                href = href.strip()
                if href.startswith(('javascript:', 'mailto:', 'tel:', '#', 'data:')):
                    return
                clean_href = urllib.parse.urldefrag(href)[0]
                if not clean_href:
                    return
                
                full_url = urllib.parse.urljoin(self.page_url, clean_href)
                parsed = urllib.parse.urlparse(full_url)
                
                if parsed.netloc in ('medikart.pk', 'www.medikart.pk'):
                    path = parsed.path.rstrip('/') if parsed.path != '/' else '/'
                    standard_url = urllib.parse.urlunparse((
                        'https',
                        'medikart.pk',
                        path,
                        '',
                        parsed.query,
                        ''
                    ))
                    self.internal_links.add(standard_url)

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        elif tag in ('script', 'style', 'noscript', 'svg'):
            self.in_script = False

    def handle_data(self, data):
        if self.in_title and not self.title:
            self.title = data.strip()
        elif not self.in_script:
            t = data.strip()
            if t:
                self.text_chunks.append(t)

    def get_word_count(self):
        full_text = ' '.join(self.text_chunks)
        words = re.findall(r'\b\w+\b', full_text)
        return len(words)


class RedirectTrackerHandler(urllib.request.HTTPRedirectHandler):
    def __init__(self):
        super().__init__()
        self.redirects = []

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        self.redirects.append({
            'code': code,
            'from': req.get_full_url(),
            'to': newurl
        })
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def load_sitemap_urls(base_url):
    sitemap_url = f"{base_url}/sitemap.xml"
    urls = set()
    try:
        req = urllib.request.Request(sitemap_url, headers={'User-Agent': USER_AGENT})
        raw = urllib.request.urlopen(req, timeout=20).read()
        root = ET.fromstring(raw)
        ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        
        for u in root.findall('sm:url', ns):
            loc = u.findtext('sm:loc', '', ns)
            if loc:
                urls.add(loc.rstrip('/'))
    except Exception as e:
        print(f"[!] Warning: Failed to fetch sitemap: {e}", flush=True)
    return urls


def load_robots_txt(base_url):
    robots_url = f"{base_url}/robots.txt"
    disallows = []
    try:
        req = urllib.request.Request(robots_url, headers={'User-Agent': USER_AGENT})
        txt = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
        current_agent = None
        for line in txt.splitlines():
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if line.lower().startswith('user-agent:'):
                current_agent = line.split(':', 1)[1].strip()
            elif line.lower().startswith('disallow:') and current_agent == '*':
                path = line.split(':', 1)[1].strip()
                if path:
                    disallows.append(path)
    except Exception as e:
        print(f"[!] Warning: Failed to fetch robots.txt: {e}", flush=True)
    return disallows


def is_disallowed(url, disallow_patterns):
    parsed = urllib.parse.urlparse(url)
    path = parsed.path
    for p in disallow_patterns:
        clean_p = p.rstrip('*')
        if path.startswith(clean_p):
            return True
    return False


def fetch_page(url):
    redirect_tracker = RedirectTrackerHandler()
    opener = urllib.request.build_opener(redirect_tracker)
    req = urllib.request.Request(url, headers={
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
    })

    status_code = None
    html = ''
    x_robots_tag = None
    final_url = url

    try:
        with opener.open(req, timeout=12) as response:
            status_code = response.getcode()
            final_url = response.geturl()
            x_robots_tag = response.headers.get('X-Robots-Tag')
            content_type = response.headers.get('Content-Type', '')
            if 'text/html' in content_type:
                html = response.read().decode('utf-8', errors='ignore')
    except urllib.error.HTTPError as e:
        status_code = e.code
        final_url = e.geturl()
    except Exception as e:
        status_code = f"ERR: {type(e).__name__}"

    parsed_final = urllib.parse.urlparse(final_url)
    clean_final = urllib.parse.urlunparse((
        'https',
        'medikart.pk',
        parsed_final.path.rstrip('/') if parsed_final.path != '/' else '/',
        '',
        parsed_final.query,
        ''
    ))

    parser = LinkExtractor(clean_final)
    if html:
        try:
            parser.feed(html)
        except Exception:
            pass

    return {
        'url': url,
        'final_url': clean_final,
        'status': status_code,
        'canonical': parser.canonical,
        'robots_meta': parser.robots_meta or x_robots_tag or 'index, follow',
        'title': parser.title,
        'word_count': parser.get_word_count(),
        'redirect_chain': redirect_tracker.redirects,
        'internal_links': parser.internal_links,
    }


def run_crawl():
    print("=" * 70, flush=True)
    print("  MEDIKART.PK PHASE 0 DIAGNOSTIC CRAWLER (Read-Only)", flush=True)
    print("=" * 70, flush=True)
    
    print("\n[*] Step 1: Loading robots.txt...", flush=True)
    disallow_rules = load_robots_txt(BASE_URL)
    print(f"    Disallow rules for Googlebot (*): {disallow_rules}", flush=True)

    print("\n[*] Step 2: Loading sitemap.xml...", flush=True)
    sitemap_urls = load_sitemap_urls(BASE_URL)
    sitemap_set = {u.rstrip('/') if u != BASE_URL else BASE_URL for u in sitemap_urls}
    print(f"    Total URLs discovered in sitemap: {len(sitemap_set)}", flush=True)

    print("\n[*] Step 3: Starting BFS Crawl (Depths 0 to 3)...", flush=True)
    
    visited = {}
    inbound_links = defaultdict(set)
    url_depths = {BASE_URL: 0}
    current_depth_urls = [BASE_URL]
    
    start_time = time.time()
    total_crawled = 0

    for depth in range(MAX_DEPTH + 1):
        if not current_depth_urls or total_crawled >= MAX_PAGES:
            break
        
        print(f"\n---> Crawling Depth {depth} ({len(current_depth_urls)} URLs queued)...", flush=True)
        next_depth_candidates = set()
        
        # Batch fetch with ThreadPoolExecutor
        with concurrent.futures.ThreadPoolExecutor(max_workers=NUM_WORKERS) as executor:
            future_to_url = {}
            for u in current_depth_urls:
                if is_disallowed(u, disallow_rules):
                    visited[u] = {
                        'url': u,
                        'status': 'BLOCKED_BY_ROBOTS',
                        'depth': depth,
                        'canonical': None,
                        'robots_meta': 'disallowed_in_robots_txt',
                        'title': None,
                        'word_count': 0,
                        'redirect_chain': [],
                        'is_in_sitemap': u in sitemap_set,
                        'outbound_count': 0,
                    }
                    total_crawled += 1
                    continue
                future = executor.submit(fetch_page, u)
                future_to_url[future] = u

            for future in concurrent.futures.as_completed(future_to_url):
                u = future_to_url[future]
                try:
                    res = future.result()
                    res['depth'] = depth
                    res['is_in_sitemap'] = u in sitemap_set
                    res['outbound_count'] = len(res['internal_links'])
                    visited[u] = res
                    total_crawled += 1

                    for target in res['internal_links']:
                        inbound_links[target].add(u)
                        
                        # Queue for next depth if not yet visited or queued
                        if target not in url_depths and depth < MAX_DEPTH and len(url_depths) < MAX_PAGES:
                            parsed_t = urllib.parse.urlparse(target)
                            # Do not deep-crawl internal search query strings to preserve crawl equity
                            if not ('search=' in parsed_t.query or 'category=' in parsed_t.query):
                                url_depths[target] = depth + 1
                                next_depth_candidates.add(target)

                    if total_crawled % 25 == 0:
                        elapsed = time.time() - start_time
                        print(f"    [{total_crawled} pages] Depth: {depth} | Rate: {total_crawled/elapsed:.1f} p/s | Last: {u[:65]}", flush=True)

                except Exception as e:
                    print(f"[!] Error fetching {u}: {e}", flush=True)

        current_depth_urls = list(next_depth_candidates)

    crawl_duration = time.time() - start_time
    print(f"\n[*] Crawl Complete in {crawl_duration:.1f}s! Total Pages Visited: {len(visited)}", flush=True)

    # -------------------------------------------------------------
    # DIAGNOSTIC ANALYSIS
    # -------------------------------------------------------------
    print("\n" + "=" * 70, flush=True)
    print("  PHASE 0 DIAGNOSTIC AUDIT RESULTS", flush=True)
    print("=" * 70, flush=True)

    # 1. Depth Distribution
    depth_counts = defaultdict(int)
    for u, rec in visited.items():
        depth_counts[rec['depth']] += 1

    print("\n--- 1. CRAWL DEPTH DISTRIBUTION (from Homepage) ---", flush=True)
    for d in sorted(depth_counts.keys()):
        print(f"  Depth {d}: {depth_counts[d]} pages", flush=True)

    # 2. Inbound Internal Link Distribution
    inlink_counts = {u: len(inbound_links[u]) for u in visited}
    zero_inlinks_visited = [u for u, c in inlink_counts.items() if c == 0 and u != BASE_URL]
    low_inlinks_visited = [u for u, c in inlink_counts.items() if 1 <= c < 3]

    print("\n--- 2. INTERNAL LINKING SPREAD ---", flush=True)
    print(f"  Pages with >= 3 inlinks: {sum(1 for c in inlink_counts.values() if c >= 3)}", flush=True)
    print(f"  Pages with 1 to 2 inlinks: {len(low_inlinks_visited)}", flush=True)
    print(f"  Pages crawled with 0 inlinks (except homepage): {len(zero_inlinks_visited)}", flush=True)

    # 3. Sitemapped Orphans (In Sitemap but ZERO inlinks from homepage crawl)
    sitemap_orphans = []
    for s_url in sitemap_set:
        norm_s = s_url.rstrip('/') if s_url != BASE_URL else BASE_URL
        if norm_s not in inbound_links or len(inbound_links[norm_s]) == 0:
            sitemap_orphans.append(norm_s)

    sitemap_product_orphans = [u for u in sitemap_orphans if '/products/' in u]
    sitemap_category_orphans = [u for u in sitemap_orphans if '/categories/' in u]
    sitemap_blog_orphans = [u for u in sitemap_orphans if '/blogs/' in u]
    sitemap_other_orphans = [u for u in sitemap_orphans if '/products/' not in u and '/categories/' not in u and '/blogs/' not in u]

    print("\n--- 3. SITEMAP ORPHANS ANALYSIS (Critical GSC Issue) ---", flush=True)
    print(f"  Total URLs in sitemap.xml: {len(sitemap_set)}", flush=True)
    print(f"  TOTAL ORPHANS (In sitemap but 0 crawlable inlinks): {len(sitemap_orphans)} ({len(sitemap_orphans)/len(sitemap_set)*100:.1f}%)", flush=True)
    print(f"    - Product Orphans: {len(sitemap_product_orphans)}", flush=True)
    print(f"    - Category Orphans: {len(sitemap_category_orphans)}", flush=True)
    print(f"    - Blog Orphans: {len(sitemap_blog_orphans)}", flush=True)
    print(f"    - Other Page Orphans: {len(sitemap_other_orphans)}", flush=True)

    # 4. Products Unreachable by Links
    total_sitemap_products = sum(1 for u in sitemap_set if '/products/' in u)
    crawled_products = sum(1 for u in visited if '/products/' in u)
    print(f"\n--- 4. PRODUCTS UNREACHABLE BY INBOUND LINKS ---", flush=True)
    print(f"  Total Product URLs in Sitemap: {total_sitemap_products}", flush=True)
    print(f"  Product URLs reached by crawling <a href>: {crawled_products}", flush=True)
    print(f"  Products UNREACHABLE by links: {len(sitemap_product_orphans)} ({len(sitemap_product_orphans)/total_sitemap_products*100:.1f}%)", flush=True)

    # 5. Redirect Chains Found During Crawl
    redirects_found = [rec for rec in visited.values() if rec.get('redirect_chain') or str(rec.get('status', '')).startswith('3')]
    print(f"\n--- 5. REDIRECTS DETECTED DURING CRAWL ---", flush=True)
    print(f"  Total URLs triggering redirect: {len(redirects_found)}", flush=True)
    for r in redirects_found[:10]:
        print(f"    {r['url']} -> {r['final_url']} (Status: {r['status']})", flush=True)

    # 6. Canonical Anomalies (Non-self-referencing or missing)
    canonical_mismatches = []
    for u, rec in visited.items():
        if rec.get('canonical'):
            norm_c = rec['canonical'].rstrip('/')
            norm_u = u.rstrip('/')
            if norm_c != norm_u and not norm_u.startswith(BASE_URL + '/?'):
                canonical_mismatches.append((u, rec['canonical']))

    print(f"\n--- 6. CANONICAL ANOMALIES ---", flush=True)
    print(f"  Total Canonical Mismatches: {len(canonical_mismatches)}", flush=True)
    for u, c in canonical_mismatches[:10]:
        print(f"    Page: {u}  => Declares Canonical: {c}", flush=True)

    # 7. Query-String Internal Links Detected
    query_links = [u for u in inbound_links if '?' in u]
    print(f"\n--- 7. QUERY PARAMETER INTERNAL LINKS DETECTED ---", flush=True)
    print(f"  Total URLs with query parameters linked internally: {len(query_links)}", flush=True)
    for q in query_links[:10]:
        print(f"    {q} (Inbound links: {len(inbound_links[q])})", flush=True)

    # 8. Top 20 Pages by Inbound Links
    top_inlinked = sorted(inbound_links.items(), key=lambda x: len(x[1]), reverse=True)[:20]
    print(f"\n--- 8. TOP 20 PAGES BY INBOUND INTERNAL LINKS ---", flush=True)
    for u, in_set in top_inlinked:
        print(f"    [{len(in_set)} inlinks] {u}", flush=True)

    # Save full JSON report
    report_data = {
        'crawl_timestamp': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime()),
        'total_sitemap_urls': len(sitemap_set),
        'total_crawled': len(visited),
        'total_orphans': len(sitemap_orphans),
        'orphan_breakdown': {
            'products': len(sitemap_product_orphans),
            'categories': len(sitemap_category_orphans),
            'blogs': len(sitemap_blog_orphans),
            'other': len(sitemap_other_orphans),
        },
        'depth_distribution': depth_counts,
        'crawled_products_count': crawled_products,
        'unreachable_products_count': len(sitemap_product_orphans),
        'redirects_found': len(redirects_found),
        'canonical_mismatches': canonical_mismatches[:50],
        'top_20_inlinked': [(u, len(s)) for u, s in top_inlinked],
        'sample_orphans': sitemap_product_orphans[:30],
    }

    report_path = 'scripts/seo_crawl_diagnosis_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2)
    print(f"\n[+] Full report saved to {report_path}", flush=True)

    return report_data


if __name__ == '__main__':
    run_crawl()
