# Inventory Management

## Current Stock (from seller CSV)
| SKU | Listing ID | Stock |
|-----|-----------|-------|
| J001 | LSTJEAHR6HBTZ8VV3YAE9ASRX | 21 |
| S001 | LSTSHTHR6KGZNFMHXRXTB4ONB | 20 |
| S002 | LSTSHTHR6N7HEQCWNJJGAQLEH | 20 |
| J002 | LSTJEAHR6MAZ95K6DHMXUPDIC | 20 |

**Total: 81 units**

## Stock Sheet to Maintain (Excel/Google Sheets)
| Column | Example |
|--------|---------|
| SKU | J001 |
| Product Name | ... |
| Cost (COGS) | ₹X |
| Selling Price | ₹X |
| Margin % | X% |
| Stock In | 21 |
| Stock Out | - |
| Remaining | 21 |
| Platform Sales | Shopify/Amazon/Flipkart |

## Safety Stock Rules
- Reorder when stock < 10 units
- Min. order from supplier: match shipping cost efficiency
- Keep 15% buffer for exchange/return replaces

## Sync Shopify <-> Inventory
- Update stock in Shopify admin after every bulk movement
- Use Excel/Google Sheets as truth until scaling
- When >200 units: consider Gekko/Shopify inventory apps
