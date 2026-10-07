export function ArchitectureDiagram({ components }: { components: string[] }) {
  if (!components.length) return null;
  // Component membership is known; edges and execution order are not.
  return (
    <figure className="architecture-diagram">
      <figcaption className="label text-muted">
        System components / {String(components.length).padStart(2, "0")}
      </figcaption>
      <ul className="architecture-components">
        {components.map((component, index) => (
          <li key={`${index}-${component}`}>
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <rect
                x="4"
                y="4"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
              />
              <path d="M0 12h4m16 0h4M12 0v4m0 16v4" stroke="currentColor" />
            </svg>
            <span>{component}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
