# Medikart Nginx & VPS Deployment Guide

This directory contains the production-ready Nginx reverse proxy configuration, Cloudflare Real IP restoration, security headers, rate limiting, and PM2 process management for **Medikart** (`medikart.pk`).

---

## 🏛️ Architecture Overview

| Component | Technology | Process / Port | Hosting & Serving Strategy |
| :--- | :--- | :--- | :--- |
| **Storefront** | Next.js 14 (App Router) | Port `3000` | Node.js process (`next start`) managed by PM2; Nginx reverse-proxies `https://medikart.pk/`. |
| **Backend API** | Express.js / Node.js | Port `5000` | PM2 Cluster mode (`instances: "max"`); Nginx reverse-proxies `https://medikart.pk/api/`. |
| **Admin Dashboard** | React 18 + Vite 6 | Static (`dist/`) | Static files served directly by Nginx from `/var/www/medikart/apps/admin/dist/` at `https://admin.medikart.pk/` with client-side routing fallback. |
| **Database** | MongoDB Atlas / Local | Port `27017` / Cloud | Connection string in `server/.env`. |
| **Cache & Rate Limit** | Redis | Port `6379` | Cache-Aside layer + sliding window rate limiter. |
| **Edge & CDN** | Cloudflare | Full (strict) SSL | DNS proxy, DDoS mitigation, Real IP forwarded via `CF-Connecting-IP`. |

---

## 📁 File Structure in `nginx/`

```
nginx/
├── medikart.conf               # Master server blocks (medikart.pk, www, admin.medikart.pk)
├── ecosystem.config.js          # PM2 master process orchestration
├── README.md                    # This deployment guide
└── conf.d/
    ├── cloudflare-real-ip.conf  # Restores real visitor IP from Cloudflare's published CIDRs
    ├── security-headers.conf    # Hardened HTTP headers (CSP, X-Frame-Options, etc.)
    ├── rate-limiting.conf       # Network-level limit_req zones for API and Auth
    └── compression.conf         # Gzip compression for text, scripts, and stylesheets
```

---

## 🚀 Step-by-Step VPS Deployment Instructions (Hostinger Ubuntu/Debian)

### 1. Install System Dependencies

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install Nginx, Certbot, Git, and build essentials
sudo apt install -y nginx certbot python3-certbot-nginx redis-server git ufw curl

# Install Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
```

---

### 2. Clone Repository and Set Permissions

```bash
# Create web root directory
sudo mkdir -p /var/www/medikart
sudo chown -R $USER:$USER /var/www/medikart

# Clone project into /var/www/medikart
git clone <YOUR_GIT_REPO_URL> /var/www/medikart
cd /var/www/medikart
```

---

### 3. Build Applications on the VPS

```bash
# 1. Setup Backend
cd /var/www/medikart/server
npm install --production=false
cp .env.example .env
# Edit .env with production MongoDB, JWT, and SMTP credentials:
nano .env

# 2. Build Storefront (Next.js)
cd /var/www/medikart/apps/web
npm install
npm run build

# 3. Build Admin Dashboard (Vite)
cd /var/www/medikart/apps/admin
npm install
npm run build
```

---

### 4. Issue SSL Certificates via Certbot

Before activating the full SSL configuration in Nginx, issue the Let's Encrypt certificates for all domains:

```bash
# Stop Nginx temporarily to run standalone certbot (or use webroot)
sudo systemctl stop nginx

# Request multi-domain certificate
sudo certbot certonly --standalone \
  -d medikart.pk \
  -d www.medikart.pk \
  -d admin.medikart.pk \
  --email admin@medikart.pk \
  --agree-tos \
  --no-eff-email

# Start Nginx back up
sudo systemctl start nginx
```

> **Note on Cloudflare "Full (strict)" SSL:**  
> If using Cloudflare **Full (strict)** mode, ensure Cloudflare's DNS records for `medikart.pk`, `www`, and `admin` are set to **Proxied (Orange Cloud)** and the origin server has a valid SSL certificate (Let's Encrypt or Cloudflare Origin CA).

---

### 5. Install Nginx Configuration Files

```bash
# Copy modular snippets into /etc/nginx/conf.d/
sudo cp -r /var/www/medikart/nginx/conf.d/* /etc/nginx/conf.d/

# Copy master site configuration into sites-available
sudo cp /var/www/medikart/nginx/medikart.conf /etc/nginx/sites-available/medikart.conf

# Enable site by creating symlink
sudo ln -sf /etc/nginx/sites-available/medikart.conf /etc/nginx/sites-enabled/medikart.conf

# Remove default Nginx welcome page
sudo rm -f /etc/nginx/sites-enabled/default

# Create required log directories
sudo mkdir -p /var/log/nginx
sudo mkdir -p /var/log/pm2
sudo mkdir -p /var/www/certbot

# Test Nginx syntax
sudo nginx -t

# If syntax is OK, reload Nginx
sudo systemctl reload nginx
```

---

### 6. Start Applications with PM2

```bash
cd /var/www/medikart

# Start both Backend Cluster and Storefront via PM2
pm2 start nginx/ecosystem.config.js

# Save process list and enable automatic restart on VPS reboot
pm2 save
pm2 startup
# (Run the generated sudo env command printed by PM2)
```

---

### 7. Configure Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 🛡️ Cloudflare Settings Checklist

1. **SSL/TLS Encryption Mode:** Set to **Full (strict)**.
2. **DNS Records (Proxied - Orange Cloud):**
   * `A` record: `medikart.pk` ➔ `<VPS_IP>`
   * `CNAME` record: `www` ➔ `medikart.pk`
   * `A` or `CNAME` record: `admin` ➔ `<VPS_IP>` (or `medikart.pk`)
3. **WebSockets:** Ensure WebSockets are enabled under **Network** settings in Cloudflare Dashboard.
4. **Always Use HTTPS:** Enabled in Cloudflare Dashboard.

---

## 🔍 Verification Commands

```bash
# Test Nginx configuration validity
sudo nginx -t

# Check PM2 process cluster status
pm2 status
pm2 logs

# Check Nginx access logs
sudo tail -f /var/log/nginx/medikart_access.log
sudo tail -f /var/log/nginx/medikart_error.log

# Verify Redis is active
redis-cli ping # Should return PONG
```
