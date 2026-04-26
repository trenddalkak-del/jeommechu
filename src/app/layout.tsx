import type { Metadata } from "next";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "오늘의 점메추",
  description: "위치 + 날씨 기반 점심 메뉴 추천",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("font-sans antialiased", geistSans.variable)}>
      <body className="bg-white text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
