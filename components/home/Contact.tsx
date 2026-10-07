import type { Portfolio } from "@/lib/content/types";
import { getPublicLinks } from "@/lib/homepage";

export function Contact({
  portfolio,
  index,
}: {
  portfolio: Portfolio;
  index: number;
}) {
  const { contact } = portfolio;
  const links = getPublicLinks(portfolio);
  const label =
    portfolio.navigation.items.find((item) => item.href === "/#contact")
      ?.label || "Contact";
  return (
    <section
      id="contact"
      className="home-section contact-section"
      aria-labelledby="contact-heading"
    >
      <p className="label text-muted contact-label">
        {portfolio.ui.section_numbering && (
          <span aria-hidden="true">{String(index).padStart(2, "0")} / </span>
        )}
        {label}
      </p>
      <h2 id="contact-heading" className="contact-cta">
        {contact.email_public ? (
          <a href={`mailto:${contact.email}`}>
            {contact.contact_cta}
            <span aria-hidden="true">↗</span>
          </a>
        ) : (
          contact.contact_cta
        )}
      </h2>
      <div className="contact-details">
        {contact.email_public && (
          <a className="contact-email" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
        )}
        {contact.phone_public && contact.phone && (
          <a
            className="text-link"
            href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
          >
            {contact.phone}
          </a>
        )}
        {links.length > 0 && (
          <div className="contact-links">
            {links.map((link) => (
              <a className="text-link label" key={link.url} href={link.url}>
                {link.label}
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        )}
        {portfolio.identity.availability.visible &&
          portfolio.identity.availability.detail && (
            <p className="body text-muted contact-availability">
              {portfolio.identity.availability.detail}
            </p>
          )}
      </div>
    </section>
  );
}
