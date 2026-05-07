import type { Metadata, Viewport } from "next"
import "./globals.css"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://checklist-app.vercel.app"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Checklist App",
    template: "%s | Checklist App",
  },
  description: "Gere checklists completos e organizados com inteligência artificial em segundos.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Checklist App",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: "Checklist App",
    title: "Checklist App — Checklists gerados por IA",
    description: "Descreva qualquer tarefa e receba um checklist completo e organizado em segundos.",
  },
  twitter: {
    card: "summary",
    title: "Checklist App — Checklists gerados por IA",
    description: "Descreva qualquer tarefa e receba um checklist completo e organizado em segundos.",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="app-html">
      <body className="app-body" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
