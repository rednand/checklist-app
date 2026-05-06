import type { Metadata } from "next";
import "./globals.css";
import SwRegister from "./sw-register";

export const metadata: Metadata = {
  title: "Checklist App",
  description: "Gere checklists automáticos com inteligência artificial.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Checklist App",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="app-html">
      <body className="app-body" suppressHydrationWarning>
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
