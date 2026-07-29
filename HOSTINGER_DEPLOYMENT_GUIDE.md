# 🚀 Hostinger Production Deployment Guide for `rukhi.in`

This document details the complete end-to-end deployment setup, architecture, domain verification, and deployment commands for **Auto Captions AI** on **Hostinger**.

---

## 📌 Executive Summary

| Parameter | Configuration |
| :--- | :--- |
| **Live Web Domain** | [https://rukhi.in](https://rukhi.in) |
| **Hosting Plan** | Hostinger Business Web Hosting (`hostinger_business_v3`) |
| **Order ID** | `1009476441` |
| **Datacenter** | **Mumbai, India (`mumbai`)** |
| **Web Root Directory** | `/home/u209580425/domains/rukhi.in/public_html` |
| **Database Architecture** | **Neon PostgreSQL** (0.5 GB Free Tier for lightweight text & caption metadata) |
| **Media Storage** | **Hostinger Web Storage** (200 GB NVMe for raw videos, MP3s, and MP4 exports) |
| **Security & CDN** | Free Automatic SSL 🔒 (`HTTPS/2`) + Hostinger Mumbai Edge CDN (`mum-edge`) |

---

## 🏗️ Architecture & Storage Strategy

To ensure zero database cost and unlimited video capacity:

1. **Lightweight Text & Caption Metadata**:
   - User logins, project titles, word timestamps, and style preferences are stored in **Neon PostgreSQL**.
   - Text data takes `< 50 MB` even for thousands of video projects.
2. **Heavy Video & Audio Media Storage**:
   - All uploaded videos, audio tracks, B-Roll assets, and rendered MP4 reels are stored on **Hostinger's 200 GB NVMe Web Storage**.
   - Database stores only the file URL strings (e.g. `https://rukhi.in/uploads/video123.mp4`).

---

## 🛠️ Step-by-Step Deployment Process

### Step 1: Hostinger MCP Integration Audit
Configured `mcp_config.json` with 5 Hostinger API MCP services using the API Token:
- `hostinger-hosting-mcp`
- `hostinger-domains-mcp`
- `hostinger-dns-mcp`
- `hostinger-billing-mcp`
- `hostinger-reach-mcp`

### Step 2: Website Container Initialization
- Provisioned the website container on Hostinger's **Mumbai, India (`mumbai`)** datacenter attached to Order ID `1009476441`.

### Step 3: Cross-Account Domain Ownership Verification
Because `rukhi.in` was registered in **Account B** and hosting is in **Account A**:
- Added **TXT Record** in Account B for ownership verification:
  - **Type**: `TXT`
  - **Name**: `@`
  - **Value**: `73baf90e30d1179245106ec08d73509f`
- Updated **Nameservers** in Account B to Hostinger DNS:
  - `ns1.dns-parking.com`
  - `ns2.dns-parking.com`

### Step 4: Primary Domain Assignment
- Connected **`rukhi.in`** as the main domain for container `u209580425`.
- Target Web Root: `/home/u209580425/domains/rukhi.in/public_html`.

### Step 5: Production Frontend Compilation & MCP Upload
1. Compiled Vite production bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. Created timestamped archive:
   ```bash
   cd frontend/dist
   zip -r ../../frontenddist_20260729_114500.zip .
   ```
3. Executed automated deployment via Hostinger MCP tool `hosting_deployStaticWebsite`:
   - Extracted and deployed directly into `rukhi.in/public_html`.

### Step 6: SSL & Edge CDN Verification
- Hostinger auto-provisioned SSL certificate for `https://rukhi.in`.
- Verified `HTTP/2 200 OK` from Hostinger Mumbai Edge (`mum-edge4`).

---

## 🔄 How to Re-Deploy Code Updates in Future

Whenever you make new frontend changes, run this single deployment command:

```bash
# 1. Build new Vite bundle
cd frontend && npm run build

# 2. Package bundle
cd dist && zip -r ../../frontenddist_latest.zip . && cd ../..

# 3. Deploy to Hostinger via Node script
node -e "
import('child_process').then(({ spawn }) => {
  const token = 'YbLyb9JPzQ4PehkAx9joqWnRRqbcYWdrq6szq1Ji89fc3428';
  const child = spawn('npx', ['-y', '--package=hostinger-api-mcp@latest', 'hostinger-hosting-mcp'], {
    env: { ...process.env, HOSTINGER_API_TOKEN: token },
    stdio: ['pipe', 'pipe', 'inherit']
  });
  child.stdout.on('data', (d) => console.log(d.toString()));
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'deployer', version: '1.0' } } }) + '\n');
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'hosting_deployStaticWebsite', arguments: { domain: 'rukhi.in', archivePath: '/home/anji/Documents/auto_captions/frontenddist_latest.zip' } } }) + '\n');
  child.stdin.end();
});
"
```

---

## 🎯 Verification Checklist

- [x] Web Domain resolving to Hostinger Mumbai edge server.
- [x] SSL Certificate (`HTTPS/2`) active and secure 🔒.
- [x] HTML5 Canvas Studio, 70+ Google Indic Fonts, and Razorpay Checkout initialized.
- [x] Neon PostgreSQL connected for lightweight metadata.
- [x] Hostinger NVMe storage ready for 200 GB media assets.
