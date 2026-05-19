import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import type { Viewport } from "next";
import localFont from "next/font/local";

import { env } from "@/env";

import "@fancyapps/ui/dist/fancybox/fancybox.css";
import "./globals.css";

const generalSans = localFont({
  src: "../assets/fonts/GeneralSans.woff2",
  variable: "--font-general-sans",
});

const commitMono = localFont({
  src: "../assets/fonts/CommitMono.woff2",
  variable: "--font-commit-mono",
  declarations: [
    {
      prop: "font-feature-settings",
      value: "'ss01' on, 'ss02' on, 'ss03' on, 'ss04' on, 'ss05' on",
    },
  ],
});

const pixelHackers = localFont({
  src: "../assets/fonts/PixelHackers.woff2",
  variable: "--font-pixel-hackers",
});

const APP_URL = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
const AUTHOR = "Rayhan Noufal Arayilakath";
const SITE_NAME = "Ray Arayilakath";
const X_HANDLE = "@rayhanadev";
const TITLE = `${SITE_NAME} | Software Engineer, Applied AI + Infrastructure`;
const DESCRIPTION =
  "Ray is a software engineer, open-source builder, and community leader. He runs Purdue Hackers, works on AI-native developer tools at Million, and has previously worked at Replit, Deel, and early-stage startups.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR, url: APP_URL }],
  creator: AUTHOR,
  publisher: AUTHOR,
  alternates: {
    canonical: APP_URL,
    types: {
      "application/rss+xml": [
        {
          title: "Ray Arayilakath RSS Feed",
          url: `${APP_URL}/rss.xml`,
        },
      ],
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: APP_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    site: X_HANDLE,
    creator: X_HANDLE,
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pixelHackers.variable} ${commitMono.variable} ${generalSans.variable} scrollbar-override h-full antialiased [color-scheme:dark]`}
    >
      <body className="flex min-h-full flex-col overflow-x-clip bg-black font-sans text-white">
        <a
          className="sr-only fixed top-3 left-3 z-50 border border-white/15 bg-black px-3 py-2 text-sm text-white shadow-lg focus:not-sr-only focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none"
          href="#main-content"
        >
          Skip to Content
        </a>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
