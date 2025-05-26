import "@/styles/globals.css";
import "@/styles/prosemirror.css";
import "katex/dist/katex.min.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Providers from "./providers";
import ThemeScript from "./theme-script";

const title = "智能写作";
const description = "带有智能写作功能的编辑器";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
  },
  twitter: {
    title,
    description,
    card: "summary_large_image",
    creator: "@steventey",
  },
  metadataBase: new URL("https://novel.sh"),
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
