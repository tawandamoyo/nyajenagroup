import Image from "@11ty/eleventy-img";
import sharp from "sharp";

const IMAGE_WIDTHS = [480, 800, 1200];

// The photos come from different sources and their colour casts fight each
// other (orange brooder light next to blue sky). Every photo gets the same
// grade: casts pulled halfway to neutral, contrast stretched, saturation eased,
// then one shared warm tone. New photos from the farm get it automatically.
const graded = new Map();

// Until there are photos from the farm, the home page hero photo is printed in
// the logo's inks (kraal green shadows, sorghum mid-tones, cream highlights),
// so a stock photo reads as artwork rather than passing for Nyajena's own farm.
// Set to false once real photos arrive; every `duotone: true` image then shows
// in natural colour.
const DUOTONE = true;
const INKS = [
  [0, [23, 51, 34]], // --green-deep
  [0.5, [185, 83, 29]], // --sorghum
  [1, [251, 238, 220]], // cream
];

function inkAt(t, c) {
  const i = INKS.findIndex(([stop]) => stop >= t);
  if (i <= 0) return INKS[0][1][c];
  const [s0, a] = INKS[i - 1];
  const [s1, b] = INKS[i];
  return a[c] + ((b[c] - a[c]) * (t - s0)) / (s1 - s0);
}

async function toDuotone(buffer) {
  const { data, info } = await sharp(buffer)
    .greyscale()
    .normalise({ lower: 2, upper: 97 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < data.length; i++) {
    // An S-curve keeps the print punchy: brooder lamps and white birds would
    // otherwise flood the frame with paper and wash it out.
    const x = data[i] / 255;
    const t = x * x * (3 - 2 * x);
    for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(inkAt(t, c));
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } })
    .jpeg({ quality: 95 })
    .toBuffer();
}

async function grade(src, duotone = false) {
  duotone &&= DUOTONE;
  const key = `${src}|${duotone}`;
  if (graded.has(key)) return graded.get(key);
  const file = `images/${src}`;
  const { channels } = await sharp(file).stats();
  const means = channels.slice(0, 3).map((c) => c.mean);
  const grey = (means[0] + means[1] + means[2]) / 3;
  const warm = [1.03, 1.0, 0.95];
  const multipliers = means.map((m, i) =>
    Math.min(1.25, Math.max(0.8, Math.sqrt(grey / m))) * warm[i],
  );
  let buffer = await sharp(file)
    .linear(multipliers, [0, 0, 0])
    .normalise({ lower: 1, upper: 99.5 })
    .modulate({ saturation: 0.86 })
    .jpeg({ quality: 95 })
    .toBuffer();
  if (duotone) buffer = await toDuotone(buffer);
  // Average colour of the graded photo, shown while the file loads.
  const avg = (await sharp(buffer).stats()).channels.slice(0, 3).map((c) => Math.round(c.mean));
  const result = { buffer, placeholder: `rgb(${avg.join(" ")})` };
  graded.set(key, result);
  return result;
}

// Responsive <picture> with AVIF/WebP/JPEG fallbacks and intrinsic dimensions,
// so photos never shift the layout and phones on mobile data get small files.
// `focus` is a CSS object-position, so crops keep the animal in frame.
async function image(src, alt, sizes = "100vw", { eager = false, className = "", focus, duotone } = {}) {
  if (alt === undefined) throw new Error(`Missing alt text for ${src}`);
  const { buffer, placeholder } = await grade(src, duotone);
  const metadata = await Image(buffer, {
    // Capped at 1200px: sharp enough for any layout here, and keeps the largest
    // file a big screen can ask for to ~80 KB.
    widths: IMAGE_WIDTHS,
    formats: ["avif", "webp", "jpeg"],
    outputDir: "_site/img/",
    urlPath: "/img/",
    sharpAvifOptions: { quality: 55 },
    sharpWebpOptions: { quality: 72 },
    sharpJpegOptions: { quality: 76, progressive: true },
  });
  return Image.generateHTML(metadata, {
    alt,
    sizes,
    class: className || undefined,
    loading: eager ? "eager" : "lazy",
    fetchpriority: eager ? "high" : undefined,
    decoding: "async",
    style: `background-color: ${placeholder}` + (focus ? `; object-position: ${focus}` : ""),
  });
}

// Link previews (WhatsApp, Facebook, search) want a ~1.91:1 landscape JPEG at
// an absolute URL. Crops around the same `focus` as the page photo, never
// upscales, and writes the og:image and twitter tags together.
async function socialImage(src, alt, focus = "50% 50%", base = "") {
  const { buffer } = await grade(src);
  const { width, height } = await sharp(buffer).metadata();
  const [fx, fy] = focus.split(/\s+/).map((v) => parseFloat(v) / 100);
  const cropW = Math.round(Math.min(width, (height * 1200) / 630));
  const cropH = Math.round((cropW * 630) / 1200);
  const cropped = await sharp(buffer)
    .extract({
      left: Math.round((width - cropW) * fx),
      top: Math.round((height - cropH) * fy),
      width: cropW,
      height: cropH,
    })
    .resize({ width: Math.min(cropW, 1200) })
    .toBuffer();
  const metadata = await Image(cropped, {
    widths: ["auto"],
    formats: ["jpeg"],
    outputDir: "_site/img/",
    urlPath: "/img/",
    sharpJpegOptions: { quality: 80, progressive: true },
  });
  const og = metadata.jpeg[0];
  const url = new URL(og.url, base).href;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return [
    `<meta property="og:image" content="${url}" />`,
    `<meta property="og:image:width" content="${og.width}" />`,
    `<meta property="og:image:height" content="${og.height}" />`,
    `<meta property="og:image:alt" content="${esc(alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image:alt" content="${esc(alt)}" />`,
  ].join("\n    ");
}

export default function (eleventyConfig) {
  eleventyConfig.addAsyncShortcode("image", image);
  eleventyConfig.addAsyncShortcode("socialImage", socialImage);

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  eleventyConfig.addFilter("productsBySlugs", (products, slugs) =>
    slugs.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean),
  );
  eleventyConfig.addFilter("inGroup", (products, group) =>
    products.filter((p) => p.group === group),
  );
  eleventyConfig.addFilter("absoluteUrl", (path, base) =>
    base ? new URL(path, base).href : path,
  );
  eleventyConfig.addFilter("json", (value) => JSON.stringify(value));

  eleventyConfig.addGlobalData("buildYear", () => new Date().getFullYear());

  return {
    dir: { input: "src", output: "_site" },
    templateFormats: ["njk", "md", "11ty.js"],
    htmlTemplateEngine: "njk",
  };
}
