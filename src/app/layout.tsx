import type { Metadata } from "next";
import { Fraunces, Geist, JetBrains_Mono } from "next/font/google";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
});

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Mateus Henrique · Desenvolvedor Full-stack TypeScript",
  description:
    "Portfólio de Mateus Henrique — desenvolvedor full-stack em TypeScript, Next.js, Node e Postgres. Projetos recentes, disponível para CLT em São Paulo ou remoto no Brasil.",
  openGraph: {
    title: "Mateus Henrique — Desenvolvedor Full-stack",
    description: "Full-stack em TypeScript. Projetos que enviei para produção em 2026.",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mateus Henrique — Desenvolvedor Full-stack",
    description: "Full-stack em TypeScript. Projetos que enviei para produção em 2026.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${geist.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-primary text-text antialiased">{children}</body>
    </html>
  );
}
