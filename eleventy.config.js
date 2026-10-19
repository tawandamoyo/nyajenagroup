import Image from "@11ty/eleventy-img";
import sharp from "sharp";

const IMAGE_WIDTHS = [480, 800, 1200];

// The photos come from different sources and their colour casts fight each
// other (orange brooder light next to blue sky). Every photo gets the same
// grade: casts pulled halfway to neutral, contrast stretched, saturation eased,
// then one shared warm tone. New photos from the farm get it automatically.
const graded = new Map();

async function grade(src) {
  if (graded.has(src)) return graded.get(src);
  const file = `images/${src}`;
  const { channels } = await sharp(file).stats();
  const means = channels.slice(0, 3).map((c) => c.mean);
  const grey = (means[0] + means[1] + means[2]) / 3;
  const warm = [1.03, 1.0, 0.95];
  const multipliers = means.map((m, i) =>
    Math.min(1.25, Math.max(0.8, Math.sqrt(grey / m))) * warm[i],
  );
  const buffer = await sharp(file)
    .linear(multipliers, [0, 0, 0])
    .normalise({ lower: 1, upper: 99.5 })
    .modulate({ saturation: 0.86 })
    .jpeg({ quality: 95 })
    .toBuffer();
  // Average colour of the graded photo, shown while the file loads.
  const avg = (await sharp(buffer).stats()).channels.slice(0, 3).map((c) => Math.round(c.mean));
  const result = { buffer, placeholder: `rgb(${avg.join(" ")})` };
  graded.set(src, result);
  return result;
}

// Responsive <picture> with AVIF/WebP/JPEG fallbacks and intrinsic dimensions,
// so photos never shift the layout and phones on mobile data get small files.
// `focus` is a CSS object-position, so crops keep the animal in frame.
async function image(src, alt, sizes = "100vw", { eager = false, className = "", focus } = {}) {
  if (alt === undefined) throw new Error(`Missing alt text for ${src}`);
  const { buffer, placeholder } = await grade(src);
  const metadata = await Image(buffer, {
    widths: [...IMAGE_WIDTHS, "auto"],
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

export default function (eleventyConfig) {
  eleventyConfig.addAsyncShortcode("image", image);

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
