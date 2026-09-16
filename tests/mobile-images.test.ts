import { tmdbImageLoader } from "@/components/ui/tmdb-image";

test.each([
  ["w500", 170, "w185"],
  ["w500", 340, "w342"],
  ["w500", 1000, "w780"],
  ["w1280", 390, "w780"],
  ["w1280", 1600, "w1280"],
])("selects valid bounded CDN size for %s at %s pixels", (source, width, expected) => {
  expect(tmdbImageLoader({src: `https://image.tmdb.org/t/p/${source}/poster.jpg`, width: Number(width)}))
    .toBe(`https://image.tmdb.org/t/p/${expected}/poster.jpg`);
});

test("emits native responsive candidates even when global Next optimization is disabled", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const { TmdbImage } = require("@/components/ui/tmdb-image");
  const html = renderToStaticMarkup(React.createElement(TmdbImage, {
    src: "https://image.tmdb.org/t/p/w500/poster.jpg", alt: "Poster", fill: true, sizes: "45vw"
  }));
  expect(html).toContain('srcSet=');
  expect(html).toContain('w185/poster.jpg 185w');
  expect(html).toContain('sizes="45vw"');
  expect(html).toContain('loading="lazy"');
  expect(html).not.toContain('/_next/image');
});
