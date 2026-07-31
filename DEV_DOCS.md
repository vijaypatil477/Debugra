# DEV DOCS — Link Domain Names to Cloudflare CDN for API Protection (Debugra)

This document provides **complete, copy-pasteable instructions** for linking a domain (or subdomain) to **Cloudflare** and configuring it so the **API server** (Debugra Express backend) is protected by:

- Cloudflare DNS + SSL/TLS
- Cloudflare edge proxying (hiding your origin)
- CDN/static caching (optional)
- Firewall/rate-limit bounds (complementing your backend limits)
- Correct forwarding behavior for accurate IP-based rate limiting

> Applies to Debugra architecture where the React frontend talks to the backend via routes under:
>
> - `/api/*` (global limiter)
> - `/api/execute` (stricter limiter)
> - `/api/ai/*` (AI routes + limiter)

---

## 0) What you are building

You will create a hostname like:

- `api.your-domain.com` → **Cloudflare** → **your origin** (Cloud Run / server / load balancer)

The browser/client sends traffic to `https://api.your-domain.com/api/...`.
Cloudflare proxies it to the origin and enforces protection rules at the edge.

---

## 1) Prerequisites

Gather these before you start:

1. **Cloudflare account** (free is enough).
2. **Domain name you control** (e.g., `your-domain.com`).
3. The **origin endpoint** that should receive the API traffic, e.g.:
   - Google Cloud Run service URL
   - ALB/ELB DNS name
   - VM public IP + port (not recommended for production)

4. Decide on the API hostname you’ll use.
   - Recommended: `api.your-domain.com`
   - Frontend hostname may be separate (e.g., `your-domain.com` via Vercel).

---

## 2) DNS + Cloudflare delegation (Registrar → Cloudflare)

### Step 2.1 — Add the zone to Cloudflare

1. Log in to Cloudflare.
2. Click **Add a site**.
3. Enter `your-domain.com`.
4. Follow the wizard prompts.

### Step 2.2 — Update nameservers at your registrar

Cloudflare will show **nameservers** like:

- `alex.ns.cloudflare.com`
- `bob.ns.cloudflare.com`

Replace your registrar’s nameservers with Cloudflare’s values.

> Wait for DNS delegation to complete (can take minutes to a few hours).

---

## 3) Create DNS records for your API hostname

Go to **Cloudflare Dashboard → your zone → DNS → Records**.

### Step 3.1 — Create an A record for the apex (optional)

If you want the root domain to work (not required for API):

- Type: **A**
- Name: `@`
- IPv4: depends on where your frontend is hosted (often Vercel)

### Step 3.2 — Create an API subdomain record

Create a record for the API hostname, for example:

- Type: **CNAME** (if your origin is a hostname)
- Name: `api`
- Target: your origin hostname (e.g., Cloud Run URL hostname)

OR if your origin is an IP:

- Type: **A**
- Name: `api`
- Address: origin IP

### Step 3.3 — Enable Cloudflare proxy (the orange cloud)

- Enable the proxy for the API record (`api.your-domain.com`).
- Keep the orange cloud **ON** so Cloudflare becomes the reverse proxy.

> For most production protection goals, the orange cloud should be enabled for your API hostname.

---

## 4) SSL/TLS configuration (Cloudflare → Origin)

Go to **Cloudflare Dashboard → SSL/TLS**.

### Step 4.1 — Choose SSL mode

Use one of these depending on your origin:

1. **Recommended**: **Full (strict)**
   - Cloudflare verifies the origin certificate.
   - Your origin must present a certificate valid for the hostname.

2. **Fallback**: **Full**
   - Cloudflare still uses HTTPS to origin but does not strictly validate the certificate.

### Step 4.2 — Minimum TLS version

Set **TLS 1.2+** (default usually OK).

### Step 4.3 — Always use HTTPS

Ensure the zone setting **Always Use HTTPS** is enabled.

---

## 5) Proxy settings: forwarding, headers, and origin trust

### Step 5.1 — Ensure correct client IP forwarding

Debugra backend does:

- `app.set('trust proxy', 1)`
- It reads `x-forwarded-for` (first IP) to record rate-limit events and enforce IP-based limits.

Cloudflare automatically provides:

- `CF-Connecting-IP`
- `X-Forwarded-For`

So you should generally be fine as long as:

- your Cloudflare proxy is enabled (orange cloud)
- you are not stripping headers at the origin/load balancer

### Step 5.2 — Origin Host header

Some origins (or load balancers) require SNI / Host matching.

If you use Cloud Run / managed services, Cloudflare will send the correct host header by default.

If you have an origin that needs special handling, set:

- **Cloudflare → DNS → the proxied record** points to the correct origin
- avoid custom Host rewrite unless your origin explicitly requires it

---

## 6) Firewall bounds (protect the origin)

Your backend already rate-limits:

- Global: `app.use('/api', globalLimiter)`
- Strict: `/api/execute` has its own `executeLimiter`

Cloudflare firewall/rate limiting should **reduce abuse before traffic hits your origin**, but it must not break legitimate clients.

### Step 6.1 — Basic Firewall Rules (recommended)

Go to **Cloudflare → Security → WAF → Firewall Rules**.

Create a rule that applies mostly to the API hostname:

1. **Block obvious bad traffic**
   - Inspect country/IP reputation if you need it (optional).
   - If you have no strong reason, avoid strict geoblocking.

2. **Block known malicious patterns**
   - Use WAF managed rules (enable in a “block” mode gradually).

> Tip: Start in **log-only**, verify impact, then switch to block.

### Step 6.2 — Rate limiting at the edge

Go to **Cloudflare → Security → Rate Limiting**.

Create rules such as:

**Rule A: `/api/execute` edge limiter**

- Key: `Client IP` (or `CF-Connecting-IP`)
- Scope: `Hostname = api.your-domain.com`
- Path: `starts_with(/api/execute)`
- Action: **Block** or **Challenge**
- Suggested starting threshold:
  - Something slightly above your backend expectation.

Debugra backend currently uses:

- `/api/execute`: `30 requests / 15 minutes per IP`

Suggested Cloudflare starting point:

- 60 requests / 15 minutes per IP → then tune after observing logs.

**Rule B: Global `/api` limiter**

- Path: `starts_with(/api)`
- Key: `Client IP`
- Suggested starting point:
  - 200 requests / 15 minutes per IP (tune)

> Ensure Cloudflare limits don’t interfere with normal editor usage (bursty traffic from collaboration).

---

## 7) CDN / cache setup (Debugra-specific)

### Key security principle

Debugra API responses for:

- `/api/execute`
- `/api/ai/*`
- `/api/rooms`

are either dynamic or user-specific.

**Do not cache API responses.**

### Step 7.1 — Decide what you want cached

Recommended:

- Cache **static assets** (frontend build files: JS/CSS/images)
- Avoid caching **API** responses

If your frontend is served through a different host/provider (e.g., Vercel), then CDN caching on `api.your-domain.com` mainly affects API (which you should not cache).

### Step 7.2 — Cloudflare Cache Rules (if using Cache Rules)

Go to **Cloudflare → Rules → Cache Rules**.

Create cache rules like:

**Cache Rule 1 (API bypass):**

- If: Host is `api.your-domain.com`
- And: Path matches `starts_with(/api/)`
- Then:
  - **Cache: Bypass**
  - Set **Edge Cache TTL = 0** (or equivalent bypass option)

**Cache Rule 2 (static assets):** (optional)
Only if your static content is also served from this hostname.

- If: Path matches common static extensions: `*.js`, `*.css`, `*.svg`, `*.png`, etc.
- Then: Cache normally (respect your desired TTL)

### Step 7.3 — Cloudflare “Cache Everything” (avoid)

Do **not** enable “Cache Everything” for the API hostname.

---

## 8) Cache/headers validation checklist

Use these commands after setup.

### Step 8.1 — TLS + proxy verification

```bash
curl -I https://api.your-domain.com/api/health
```

Expected:

- `HTTP/2 200` (or a valid JSON response)
- `server: cloudflare` (or other Cloudflare edge header)

### Step 8.2 — Confirm API is not cached

Make two identical requests and ensure responses are not served from cache.
First, request a cache-bypass endpoint:

```bash
curl -s -D - -o /dev/null https://api.your-domain.com/api/health
```

Check headers:

- Look for cache status headers (may vary). You should **not** see cache hits for `/api/*`.

For stricter validation, create a request to a dynamic endpoint (e.g., POST is better, but CURLs below need payloads):

- POST requests should not be cached.

### Step 8.3 — Confirm security headers are present

```bash
curl -I https://api.your-domain.com/api/health | grep -i -E 'content-security-policy|strict-transport-security|x-frame-options|permissions-policy'
```

Expected:

- `Content-Security-Policy`
- `Strict-Transport-Security` (in prod)
- `X-Frame-Options: DENY`
- `Permissions-Policy` present

---

## 9) CORS + Cloudflare domain compatibility

Debugra backend allows specific origins via CORS.
In production, defaults include:

- `https://debugra.tech`
- `https://www.debugra.tech`

And it merges extra origins from `CORS_ORIGINS` and `CLIENT_URL`.

If you introduce a new frontend origin (for example `https://app.your-domain.com`), ensure backend CORS is allowlisted:

- set `CORS_ORIGINS` to include your new origin(s)

> Cloudflare does not replace your backend CORS rules.

---

## 10) Troubleshooting (common failure modes)

### Symptom A: `403 Forbidden` from your backend

Likely causes:

- CORS blocked origin
- WAF rule is blocking
- wrong admin/security token route

Checks:

- verify your frontend origin matches backend allowlist
- check Cloudflare WAF/rate limiting logs

### Symptom B: `429 Too Many Requests`

Likely causes:

- backend limiter triggered (`/api/execute` is stricter)
- Cloudflare edge rate limiting triggered

Checks:

- check response body for Debugra’s error message
- consult Cloudflare security/rate-limit events

### Symptom C: `521 Web server is down` / `origin error`

Likely causes:

- DNS record points to wrong origin
- SSL mode mismatch (Full(strict) vs origin cert)
- origin firewall blocks Cloudflare

Fixes:

- switch SSL mode to **Full** temporarily
- confirm Cloudflare can connect to origin (from logs)
- confirm origin is reachable over HTTPS and correct port

### Symptom D: rate limiting uses the wrong IP

Likely cause:

- headers are stripped/rewritten by your origin/load balancer

Fixes:

- ensure `X-Forwarded-For` is preserved
- ensure `app.set('trust proxy', 1)` remains correct

---

## 11) Recommended configuration summary (at a glance)

For `api.your-domain.com` (Cloudflare proxied):

- ✅ Orange cloud ON for the API DNS record
- ✅ SSL/TLS mode set (prefer **Full (strict)**)
- ✅ Always Use HTTPS enabled
- ✅ Firewall rules enabled (start log-only)
- ✅ Rate limiting enabled (tuned to Debugra limits)
- ✅ Cache rules: **Bypass** `/api/*`
- ✅ Do not cache POST endpoints

---

## Appendix: Suggested Cloudflare path matching

Use these patterns in rules:

- `starts_with(/api/execute)` → apply strict execution protection
- `starts_with(/api/ai)` → protect AI endpoints
- `starts_with(/api/)` → global API protection

---

## Appendix: Why this complements Debugra’s backend

Debugra already enforces:

- global `/api` rate limits
- strict limits for `/api/execute`
- strong security headers and CSP

Cloudflare adds:

- edge filtering (reduces load on your origin)
- DDoS mitigation and IP reputation
- hides origin details behind a stable proxy hostname
- centralized control and easier logging

This layered approach improves both reliability and security.
