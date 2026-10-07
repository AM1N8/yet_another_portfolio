export function SectionHeading({
  label,
  index,
  numbered,
}: {
  label: string;
  index: number;
  numbered: boolean;
}) {
  return (
    <header className="home-section-heading">
      {numbered && (
        <span className="label text-muted section-number" aria-hidden="true">
          {String(index).padStart(2, "0")} /
        </span>
      )}
      <h2 className="section-title">{label}</h2>
    </header>
  );
}
