# D2C Store Setup Playbook

## 1. Shopify Setup

### Plan
- Shopify Basic: ₹2,100/month (billed annually = 25% off)
- Start with monthly; upgrade to annual in month 3

### Steps
- [ ] Sign up at shopify.in
- [ ] Choose "Dawn" theme (free, clean)
- [ ] Customize: brand colors, logo, product grid

### Domain
- [ ] Buy via Shopify (₹700/yr) or third-party (.in domain)
- [ ] Connect to Shopify

## 2. Payments
- [ ] Razorpay (best rates, easy KYC)
  - Setup: Free
  - Fees: ~2% per transaction
- [ ] Enable COD
- [ ] UPI mandatory (UPI Lite available)
- [ ] Netbanking/cards via Razorpay automatically

## 3. Products (Import)
Use the inventory CSV:
| SKU | Stock |
|-----|-------|
| J001 | 21 |
| S001 | 20 |
| S002 | 20 |
| J002 | 20 |

Pull price/profit from supplier; set SRP, MRP, compare-at price.

## 4. Shipping
- [ ] Shiprocket (free setup, discounted courier rates)
- [ ] Regions: Ship across India
- [ ] COD cart upsell: "Pay ₹X more for free shipping" → boosts AOV

## 5. Yes/No Decisions
| Decision | Recommended |
|----------|-------------|
| Mobile app? | No (PWA/web only, ₹25k budget) |
| Multi-language? | Hindi + English (WhatsApp support) |
| Try/return policy | 7-day no-questions-return |
| Prepaid discount? | Yes, ₹50 off → cuts COD losses |

## 6. WhatsApp Commerce
- [ ] WhatsApp Business app (free)
- [ ] Product catalog upload
- [ ] Order updates via WhatsApp/email auto (Shopify Notify)
- [ ] Broadcast: weekly promos to customer list
- [ ] Auto-reply for FAQs (hours, shipping, returns)

## 7. Launch Checklist (Final 24h)
- [ ] Test checkout with real order (₹1 product) + cancel
- [ ] Test coupon codes
- [ ] Verify Razorpay + COD flow
- [ ] Add custom domain SSL
- [ ] Fix favicon + social sharing image
- [ ] Submit sitemap (Google Search Console)
- [ ] Set GA4 + Pixel tracking
