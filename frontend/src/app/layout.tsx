import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import { ThemeProvider } from "@/components/common/layout/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "小说作家管理系统",
  description: "网络小说作家作品管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${notoSansSC.variable} hide-scrollbar font-sans`}
      suppressHydrationWarning
    >
      <body
        className={`${inter.variable} ${notoSansSC.variable} hide-scrollbar font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
