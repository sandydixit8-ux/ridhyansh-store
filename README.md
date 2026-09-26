# Ridhyansh Store

D2C e-commerce store — live at https://ridhanshstore.online/

- **Payments**: UPI prepaid (payment links + QR)
- **Backend**: Firebase RTDB (products public, orders owner-only)
- **Products**: 4 Men's clothing items (shirts + jeans)

## Features
- Storefront with categories, search, product gallery
- Order flow: product → details → UPI payment link → WhatsApp
- Admin panel: products, stock, settings, payment link generator
- Dashboard: revenue KPIs, orders with status flow
  - Pending → Mark Paid → Mark Shipped → Mark Delivered
- Stock tracking with low-stock / sold-out badges
- Shipping fee + free-shipping threshold (admin-configurable)

## Docs
- [Master Plan — ₹25k D2C launch](docs/master-plan.md)

## Development
Static sites — just serve the repo root. Push to GitHub → Pages auto-deploys.
Cache-bust: bump `?v=` on css/js includes after editing.