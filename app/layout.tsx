import type { ReactNode } from "react";
import { loadPortfolio } from "@/lib/content/loadPortfolio";

export default function RootLayout({ children }: { children: ReactNode }) {
  // Reading here ensures static prerendering fails if the content is invalid.
  const portfolio = loadPortfolio();

  return (
    <html lang={portfolio.site.language}>
      <body>{children}</body>
    </html>
  );
}
