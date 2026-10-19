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
doesn't open. Customers still need to tap Send in WhatsApp; the website cannot confirm that a
message was sent or that stock was booked. Product pages link to it with one stock type
preselected (`/order.html?stock=broilers`). Group pages use `?group=other-poultry` and ask the
customer to choose; they never select all the species automatically.

Product-specific choices live in `orderOptions.json`. Quantities may be left blank, but supplied
quantities must be positive whole numbers. The message includes units, the chosen type or age
group, location and preferred date. Without JavaScript,
the page offers direct WhatsApp and telephone links.

The remaining content and configuration needed for launch are listed
[below](#needed-from-the-client-before-launch).

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
- [ ] **Testimonials.** The placeholder quotes were removed, and the Farmer stories page stays hidden
      until `src/_data/testimonials.json` has an approved quote. Drafts and a permission message to
      send customers are in `docs/testimonial-drafts.md`.
- [ ] **Confirm the claims.** The site states these as facts, carried over from the old site.
      Confirm each one, or cut it from the page it appears on:
      - Strains, breeds and supply ages in `products.json`; vaccinations listed for chicks.
      - Delivery across Zimbabwe, collection from the farm, and the three-week lead time.
      - A reply within one business day with a price and delivery date.
      - Field officers and partner vets on call for the whole cycle; a dedicated WhatsApp line for
        the first 14 days on chick orders; farm visits by vets and technical staff.
      - Starter packs, pre-delivery checklists, feed and equipment supply, contract growing and
        buyer introductions.
      - "Started by farmers, for farmers" and the single-hatchery-route origin on the About page.
      Unchecked performance figures (mortality, feed conversion, weights) and scale figures stay out.
- [ ] **Prices or price guidance**, a minimum order size and delivery areas. These are the questions
      farmers ask first. Confirm currency, what is included and transport costs; they could go in
      each line's "At a glance" panel.
- [ ] **Booking terms.** Confirm deposits, payment, and changes or cancellations. The website
      prepares a WhatsApp message; it does not reserve stock or take payments.
- [ ] **Real-device check.** Send a real enquiry from Android, iPhone and desktop WhatsApp,
      and verify it reaches the monitored account. Browser checks intercept WhatsApp opening
      and cannot prove that a real message is delivered or a booking is confirmed.
- [ ] **Facebook/Instagram links** for `site.social` (hidden until added), plus terms and privacy
      pages if the client wants them.
