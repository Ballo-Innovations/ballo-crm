import type { Metadata } from "next";
import localFont from "next/font/local";

import { AppProviders } from "@/components/providers";
import { siteConfig } from "@/lib/site";

import "./globals.css";

// Self-hosted (variable, latin subset) so builds never download fonts: the Google
// Fonts fetch in next/font/google failed CI and Vercel builds intermittently.
const urbanist = localFont({
  src: "./fonts/urbanist-latin.woff2",
  variable: "--font-sans",
  weight: "400 800",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${urbanist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
