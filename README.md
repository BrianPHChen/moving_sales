# moving_sales

Static site for an apartment moving sale (APT 206) — browse items, photos, and prices, and contact the seller to arrange pickup.

Live site: https://brianphchen.github.io/moving_sales/

## Setup

After cloning, enable the pre-commit hook (auto-bumps the "last updated"
timestamp and cache-busting `?v=` query strings whenever `data.js` or
`index.html` are committed):

```
git config core.hooksPath .githooks
```
