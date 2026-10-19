// Only emitted once site.url is set: sitemaps need absolute URLs.
export const data = {
  eleventyExcludeFromCollections: true,
  permalink: (data) => (data.site.url ? "/sitemap.xml" : false),
};

export function render({ collections, site }) {
  if (!site.url) return "";
  const urls = collections.all
    .map((item) => `  <url><loc>${new URL(item.url, site.url).href}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
