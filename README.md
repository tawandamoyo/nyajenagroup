# Nyajena Agricultural Group website

Static site built with [Eleventy](https://www.11ty.dev/). No framework and no CSS library: one
stylesheet, one small script, and responsive AVIF/WebP images generated at build time.

```sh
npm install
npm start        # dev server at http://localhost:8080
npm run build    # writes the site to _site/
```

Deploy the `_site/` folder to any static host (Netlify, Cloudflare Pages, GitHub Pages via an
Action). Build command `npm run build`, publish directory `_site`.

## Where things live

| To change…                             | Edit                                  |
| -------------------------------------- | ------------------------------------- |
| Phone, WhatsApp, address, domain       | `src/_data/site.json`                 |
| Stock lines, specs, product page copy  | `src/_data/products.json`             |
| Options on the order form              | `src/_data/orderOptions.json`         |
| Farmer quotes                          | `src/_data/testimonials.json`         |
| Questions on the home page             | `src/_data/faqs.json`                 |
| Header, footer, shared blocks          | `src/_includes/partials/`             |
| Styles / behaviour                     | `src/assets/css/main.css`, `src/assets/js/main.js` |
| Source photos                          | `images/` (resized automatically)     |

Product pages are generated from `products.json` by `src/products.njk`, so a new stock line is a
new entry in that file. Old URLs (`broilers.html`, `other-livestock.html#goats`, etc.) still work.

## How orders arrive

The order form at `/order.html` has no server. It builds a WhatsApp message from the
customer's answers and opens a chat to `site.whatsapp`, with copy and call fallbacks if WhatsApp
doesn't open. Product pages link to it with the stock preselected (`/order.html?stock=broilers`).

If the team later wants enquiries logged somewhere (a spreadsheet or CRM), add a form backend
such as Netlify Forms or Formspree alongside the WhatsApp step.

## Needed from the client before launch

- [x] **Phone/WhatsApp number.** +263 77 724 9994, set in `src/_data/site.json`. Confirm the
      WhatsApp account on it is the one the team watches.
- [ ] **Domain** for `site.url`. It turns on canonical URLs, social previews and `sitemap.xml`.
- [ ] **Email address** (optional). The footer shows it once set.
- [ ] **Photos from the farm.** The current images are stock photos, several from outside
      Zimbabwe, and only 600px wide. Most needed: brooder house, a delivery, the team with a
      farmer, goats and rabbits on site. 1600px or larger. Every photo is colour-graded at build
      time (`grade()` in `eleventy.config.js`), so new ones will match the set; set `focus` on a
      product to keep the animal in frame when the photo is cropped.
- [ ] **Original logo files.** The only source is a JPG with an image-generator watermark.
      `src/assets/brand/logo-mark.svg` is a trace of the mark from it, good for the header and
      favicon; ask whether a designer's master file exists before printing anything large.
- [ ] **Confirm the testimonials.** The names, places and quotes need to come from real customers,
      with their permission.
- [ ] **Confirm the numbers.** Strains, weights, feed conversion and mortality figures were carried
      over from the old site. The old home page also claimed "65K+ chicks a year", "900+ farmers per
      cycle", "18 provinces and districts" and "98% retention". These were removed: Zimbabwe has 10
      provinces, and the figures didn't agree with each other.
- [ ] **Prices or price guidance**, a minimum order size and delivery areas. These are the questions
      farmers ask first, and they could go in each line's "At a glance" panel.
- [ ] **Facebook/Instagram links** for `site.social` (hidden until added), plus terms and privacy
      pages if the client wants them.
