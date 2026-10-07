import type { Portfolio } from "@/lib/content/types";
import Link from "next/link";
import { getCommands, getNavigation } from "@/lib/shell";
import { NavigationLinks } from "@/components/navigation/NavigationLinks";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { ThemeControls } from "@/components/ui/ThemeControls";
import { CommandPalette } from "@/components/command/CommandPalette";

export function Header({ portfolio }: { portfolio: Portfolio }) {
  const navigation = getNavigation(portfolio);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link
          className="brand"
          href="/"
          aria-label={`${portfolio.site.brand_label} home`}
        >
          {portfolio.identity.logo_text}
        </Link>
        <nav className="desktop-navigation" aria-label="Primary">
          <NavigationLinks items={navigation} />
        </nav>
        <div className="header-tools">
          <ThemeControls labels={portfolio.site.theme_toggle_labels} />
          {portfolio.command_palette.enabled && (
            <CommandPalette
              commands={getCommands(portfolio)}
              brand={portfolio.site.brand_label}
            />
          )}
          <MobileMenu>
            <nav aria-label="Mobile">
              <NavigationLinks items={navigation} />
            </nav>
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
