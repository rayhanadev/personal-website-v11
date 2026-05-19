import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  reactCompiler: true,
  redirects: async () => {
    return [
      {
        source: "/blog",
        destination: "/",
        permanent: true,
      },
      {
        source: "/b/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [new URL("https://github.com/rayhanadev.png")],
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
    viewTransition: true,
    webVitalsAttribution: ["CLS", "FCP", "FID", "INP", "LCP", "TTFB"],
  },
};

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: ["remark-frontmatter", "remark-gfm", "remark-math", "remark-code-title"],
    rehypePlugins: [
      "rehype-slug",
      ["rehype-autolink-headings", { behavior: "wrap", properties: { className: "not-prose" } }],
      ["rehype-katex", { strict: true, throwOnError: true }],
      ["@shikijs/rehype", { theme: "ayu-dark" }],
    ],
  },
});

export default withMDX(nextConfig);
