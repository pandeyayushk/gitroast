import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitRoast — Your GitHub profile. Brutally analyzed.",
  description:
    "Get a brutally honest analysis of your GitHub profile, developer archetype, strengths, weaknesses, and roast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}