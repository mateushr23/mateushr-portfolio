import type { Metadata } from "next";
import { Bebas_Neue, Fraunces, Geist, JetBrains_Mono, Orbitron } from "next/font/google";

import "./globals.css";

// Orbitron — display sci-fi face (variable weight). Used for hero + CLICK
// boxes + I AM MATEUS glow-stroke. Kept as explicit weights for safety
// across next/font versions; Orbitron is exposed as a variable on Google
// but the weights array locks the subset we actually use.
const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bebas-neue",
  weight: ["400"],
});

// Kept loaded globally so future /sobre or /projects pages can reintroduce
// editorial serif without refactoring layout.tsx. Unused on home.
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
  title: "Mateus Henrique — Portfolio",
  description:
    "Portfólio de Mateus Henrique — desenvolvedor full-stack em TypeScript. Bem-vindo, galáxia.",
  openGraph: {
    title: "Mateus Henrique — Portfolio",
    description: "Portfólio de Mateus Henrique — desenvolvedor full-stack em TypeScript.",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mateus Henrique — Portfolio",
    description: "Portfólio de Mateus Henrique — desenvolvedor full-stack em TypeScript.",
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
      className={`${orbitron.variable} ${bebasNeue.variable} ${fraunces.variable} ${geist.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
