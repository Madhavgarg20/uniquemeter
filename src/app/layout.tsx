import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "UniqueMeter — How unique is your idea?",
  description:
    "Describe your startup idea. AI restructures it, searches the entire internet, and gives you a brutally honest uniqueness and usefulness score. No fluff. Pure math.",
  keywords: ["startup idea validator", "uniqueness score", "idea checker", "startup tool"],
  openGraph: {
    title: "UniqueMeter — How unique is your idea?",
    description: "Brutally honest idea uniqueness & usefulness scoring. No AI slop.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
