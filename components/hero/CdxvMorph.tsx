import { CdxvMorphCanvas } from "./CdxvMorphCanvas";
import { createSignaturePoints } from "@/lib/signature/geometry";
import "./cdxv-morph.css";

export function CdxvMorph({
  motionEnabled = true,
}: {
  motionEnabled?: boolean;
}) {
  const points = createSignaturePoints();
  return (
    <figure className="hero-morph" aria-label="CDXV morphing cell field">
      <figcaption className="sr-only">
        Rounded cells flow through C, D, X and V, gently pushing around the
        pointer and returning to their contours. With reduced motion, all four
        letters remain static.
      </figcaption>
      <CdxvMorphCanvas motionEnabled={motionEnabled}>
        <svg
          className="hero-morph-fallback"
          viewBox="0 0 480 480"
          aria-hidden="true"
        >
          {[0, 1, 2].map((tone) => (
            <path
              key={tone}
              className={`hero-morph-tone-${tone}`}
              d={points
                .filter((_, index) => index % 2 === 0)
                .filter((point) => point.tone % 3 === tone)
                .map(
                  ({ x, y }) =>
                    `M${38.3 + x * 0.4} ${143.3 + y * 0.4}h3.4v3.4h-3.4z`,
                )
                .join("")}
            />
          ))}
        </svg>
      </CdxvMorphCanvas>
    </figure>
  );
}
