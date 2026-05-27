# Cloudflare Proxy Integration and DDoS Protection Guide

This guide details how to securely place the Debugra Express backend and Vite frontend behind Cloudflare's proxy network for enhanced caching, SSL/TLS termination, and DDoS protection.

## 1. Domain Registration & Cloudflare Setup
1. Create a [Cloudflare account](https://dash.cloudflare.com/sign-up) and add your domain (e.g., `debugra.tech`).
2. Update your domain registrar's nameservers to point to the provided Cloudflare nameservers.
3. In the Cloudflare DNS settings, add your A/CNAME records pointing to your server IP or Vercel deployment.
4. Ensure the proxy status (the orange cloud icon) is enabled for your domain.

## 2. SSL/TLS Configuration
- Navigate to the **SSL/TLS** tab in Cloudflare.
- Set the encryption mode to **Full (strict)** to ensure end-to-end encryption.
- Enable **Always Use HTTPS** in the Edge Certificates section to automatically redirect HTTP traffic.

## 3. Web Application Firewall (WAF) & DDoS Protection
1. Navigate to the **Security > WAF** section.
2. Create firewall rules to block traffic from malicious IPs or specific regions if necessary.
3. Enable the **Cloudflare Bot Management** or Super Bot Fight Mode to block automated vulnerability scanners.
4. If experiencing an attack, activate **Under Attack Mode** to present a JS challenge to all visitors.

## 4. Caching Rules for Debugra
To maximize performance while preventing stale dynamic data:
1. Go to **Rules > Page Rules**.
2. Create a rule for `*debugra.tech/api/*`: Set Cache Level to **Bypass** (APIs should not be cached).
3. Create a rule for `*debugra.tech/*`: Set Cache Level to **Cache Everything** and set the Edge Cache TTL for static frontend assets.

## 5. Security Headers
Cloudflare can automatically enforce strict headers. In **Rules > Transform Rules**, create a Response Header Modification rule:
- Set `Strict-Transport-Security` to `max-age=31536000; includeSubDomains; preload`
- Set `X-Frame-Options` to `DENY`
- Set `X-Content-Type-Options` to `nosniff`
*(Note: Our Express backend already enforces these via Helmet, but Cloudflare acts as an edge defense).*

## 6. Rate Limiting via Cloudflare
If our internal Express rate limiting (100 req / 15 min) is overwhelmed at the network level:
1. Go to **Security > Rate Limiting Rules**.
2. Create a rule matching `URI Path starts with /api/` and set a limit of 50 requests per 10 seconds per IP, choosing **Block** as the mitigation action.
