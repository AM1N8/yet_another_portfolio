import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { loadPortfolio } from "@/lib/content/loadPortfolio";
import { initializeTheme } from "@/lib/theme";
import { THEME_NAMES } from "@/lib/themes/registry";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});

export default function RootLayout({ children }: { children: ReactNode }) {
  // Reading here ensures static prerendering fails if the content is invalid.
  const portfolio = loadPortfolio();

  return (
    <html
      lang={portfolio.site.language}
      data-theme={portfolio.site.default_theme}
      data-default-theme={portfolio.site.default_theme}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(${initializeTheme.toString()})(${JSON.stringify(portfolio.site.default_theme)},${JSON.stringify(THEME_NAMES)})`,
          }}
        />
      </head>
      <body className={`${geist.variable} ${geistMono.variable}`}>
        <div className="site-shell">
          {portfolio.accessibility.skip_link && (
            <a className="skip-link" href="#main-content">
              Skip to content
            </a>
          )}
          <Header portfolio={portfolio} />
          <main id="main-content" className="site-main container" tabIndex={-1}>
            {children}
          </main>
          <Footer portfolio={portfolio} />
        </div>
      </body>
    </html>
  );
}
