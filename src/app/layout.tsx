import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "./lib/supabase/auth-context";
import {
  PRODUCT_DESCRIPTION,
  PRODUCT_NAME,
  PRODUCT_ONE_LINER,
} from "./lib/product";
import "./globals.css";

const geistSans = localFont({
  src: [
    {
      path: "./fonts/geist-latin.woff2",
      weight: "400 600",
      style: "normal",
    },
    {
      path: "./fonts/geist-latin-ext.woff2",
      weight: "400 600",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [
    {
      path: "./fonts/geist-mono-latin.woff2",
      weight: "400 600",
      style: "normal",
    },
    {
      path: "./fonts/geist-mono-latin-ext.woff2",
      weight: "400 600",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} | ${PRODUCT_ONE_LINER}`,
  description: PRODUCT_DESCRIPTION,
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
