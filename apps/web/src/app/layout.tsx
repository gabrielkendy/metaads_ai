import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { BackgroundOrbs } from "@/components/glass/background-orbs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BASE Tráfego Command",
    template: "%s · BASE Tráfego Command",
  },
  description:
    "Mini-SaaS multi-tenant de gestão de Meta Ads operado por Claude Desktop via MCP — Agência BASE",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://command.agenciabase.tech",
  ),
  applicationName: "BASE Tráfego Command",
  authors: [{ name: "Agência BASE", url: "https://agenciabase.tech" }],
  creator: "Agência BASE",
  publisher: "Agência BASE",
  keywords: ["meta ads", "tráfego pago", "automação", "claude", "mcp", "agência"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "BASE Tráfego Command",
    locale: "pt_BR",
    title: "BASE Tráfego Command",
    description: "Gestão de Meta Ads operada por IA com Claude Desktop",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${fraunces.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <Providers>
          <BackgroundOrbs />
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(26,26,29,0.95)",
                color: "#fafafa",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
