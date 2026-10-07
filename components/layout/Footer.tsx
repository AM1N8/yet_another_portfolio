import type { Portfolio } from "@/lib/content/types";
import { ThemeControls } from "@/components/ui/ThemeControls";
import { LocalClock } from "@/components/ui/LocalClock";
import { SignatureMark } from "@/components/signature/SignatureMark";

export function Footer({ portfolio }: { portfolio: Portfolio }) {
  const { footer, identity, site } = portfolio;
  return (
    <footer className="site-footer">
      {portfolio.hero.show_activity_visual && (
        <div className="container">
          <SignatureMark portfolio={portfolio} />
        </div>
      )}
      <div className="container footer-inner">
        <div className="footer-meta label">
          {footer.show_copyright && (
            <span>
              © {new Date().getFullYear()} {identity.full_name}
            </span>
          )}
          {footer.show_build_stack && <span>BUILT WITH NEXT.JS</span>}
          {footer.show_source_link &&
            site.source_visible &&
            site.repository_url && (
              <a href={site.repository_url}>
                SOURCE <span aria-hidden="true">↗</span>
              </a>
            )}
          {footer.custom_text && (
            <p className="footer-custom">{footer.custom_text}</p>
          )}
        </div>
        <div className="footer-tools">
          {footer.show_local_time && identity.show_local_time && (
            <LocalClock timezone={identity.timezone} locale={site.locale} />
          )}
          <ThemeControls labels={site.theme_toggle_labels} />
        </div>
      </div>
    </footer>
  );
}
