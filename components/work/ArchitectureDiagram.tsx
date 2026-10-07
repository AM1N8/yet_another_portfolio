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
            <span className="component-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{component}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
