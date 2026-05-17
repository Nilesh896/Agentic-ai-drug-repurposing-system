import type { Metadata } from "next";

import "./globals.css";

import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title:
    "AI Drug Repurposing System",
  description:
    "AI-powered pharmaceutical intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-right" />

        {children}
      </body>
    </html>
  );
}