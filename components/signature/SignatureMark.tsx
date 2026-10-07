import type { Portfolio } from "@/lib/content/types";
import {
  SIGNATURE,
  FIELD,
  createSignaturePoints,
  cellPath,
} from "@/lib/signature/geometry";
import { SignatureGraph } from "./SignatureGraph";
import "./signature.css";

export function SignatureMark({
  portfolio,
  id = "footer-signature",
}: {
  portfolio: Portfolio;
  id?: string;
}) {
  const points = createSignaturePoints();
  return (
    <figure
      id={id}
      className="footer-signature"
      aria-label="CDXV signature graph"
      aria-describedby={`${id}-description`}
    >
      <div className="signature-meta label text-muted">
        <span>{SIGNATURE} / POINT MATRIX</span>
        <span>{points.length} CELLS / FOUR CONTOURS</span>
      </div>
      <SignatureGraph motionEnabled={portfolio.ui.motion.enabled}>
        <svg
          className="signature-plot"
          viewBox={`0 0 ${FIELD.width} ${FIELD.height}`}
          role="img"
          aria-label="CDXV, constructed from a geometric matrix of square cells"
        >
          <defs>
            <pattern
              id={`${id}-grid`}
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M14 12v4M12 14h4"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.7"
              />
            </pattern>
          </defs>
          <rect
            width="1000"
            height="440"
            fill={`url(#${id}-grid)`}
            className="signature-grid"
          />
          <g
            className="signature-guides"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
          >
            <path d="M40 80H960M40 360H960M59 56V384M283 56V384M521 56V384M759 56V384M941 56V384" />
            <path
              d="M40 60V40H60M940 40H960V60M960 380V400H940M60 400H40V380"
              className="signature-corners"
            />
          </g>
          <g className="signature-cells">
            <path d={cellPath(points, "solid")} className="signature-solid" />
            <path d={cellPath(points, "soft")} className="signature-soft" />
            <path d={cellPath(points, "accent")} className="signature-accent" />
          </g>
          <g className="signature-axis" aria-hidden="true">
            <text x="40" y="24">
              Y / 01
            </text>
            <text x="960" y="424" textAnchor="end">
              X / 04
            </text>
          </g>
        </svg>
      </SignatureGraph>
      <figcaption className="sr-only">
        <p id={`${id}-description`}>
          Four geometric contours form CDXV: a signature drawn in cells on a
          shared coordinate grid.
        </p>
      </figcaption>
    </figure>
  );
}
