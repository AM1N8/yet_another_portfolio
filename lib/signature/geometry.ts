export const SIGNATURE = "CDXV";
export const FIELD = { width: 1000, height: 440 } as const;

export interface SignaturePoint {
  x: number;
  y: number;
  letter: number;
  tone: number;
}

type Vertex = readonly [number, number];
// Cut-corner contours give the matrix its own geometry instead of rasterizing a font.
const contours: readonly (readonly Vertex[])[] = [
  [
    [0.18, 0],
    [0.85, 0],
    [1, 0.14],
    [1, 0.28],
    [0.75, 0.28],
    [0.65, 0.2],
    [0.3, 0.2],
    [0.23, 0.28],
    [0.23, 0.72],
    [0.3, 0.8],
    [0.65, 0.8],
    [0.75, 0.72],
    [1, 0.72],
    [1, 0.86],
    [0.85, 1],
    [0.18, 1],
    [0, 0.82],
    [0, 0.18],
  ],
  [
    [0, 0],
    [0.65, 0],
    [1, 0.24],
    [1, 0.76],
    [0.65, 1],
    [0, 1],
  ],
  [
    [0, 0],
    [0.28, 0],
    [0.5, 0.32],
    [0.72, 0],
    [1, 0],
    [0.65, 0.5],
    [1, 1],
    [0.72, 1],
    [0.5, 0.68],
    [0.28, 1],
    [0, 1],
    [0.35, 0.5],
  ],
  [
    [0, 0],
    [0.26, 0],
    [0.5, 0.71],
    [0.74, 0],
    [1, 0],
    [0.65, 1],
    [0.35, 1],
  ],
];
const counter: readonly Vertex[] = [
  [0.25, 0.2],
  [0.55, 0.2],
  [0.75, 0.34],
  [0.75, 0.66],
  [0.55, 0.8],
  [0.25, 0.8],
];

function inside(x: number, y: number, polygon: readonly Vertex[]) {
  let contained = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      contained = !contained;
  }
  return contained;
}

export function createSignaturePoints(): SignaturePoint[] {
  const points: SignaturePoint[] = [];
  const columns = 15;
  const rows = 21;
  const pitch = 14;
  for (let letter = 0; letter < SIGNATURE.length; letter++) {
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const x = (column + 0.5) / columns;
        const y = (row + 0.5) / rows;
        if (
          !inside(x, y, contours[letter]) ||
          (letter === 1 && inside(x, y, counter))
        )
          continue;
        points.push({
          x: 59 + letter * 238 + column * pitch,
          y: 80 + row * pitch,
          letter,
          tone: (column * 7 + row * 11 + letter * 3) % 9,
        });
      }
    }
  }
  return points;
}

export function cellPath(
  points: readonly SignaturePoint[],
  tone: "solid" | "soft" | "accent",
) {
  return points
    .filter((point) =>
      tone === "accent"
        ? point.tone === 0 && point.y % 5 === 0
        : tone === "soft"
          ? point.tone === 2 || point.tone === 5
          : !(
              point.tone === 2 ||
              point.tone === 5 ||
              (point.tone === 0 && point.y % 5 === 0)
            ),
    )
    .map(({ x, y }) => `M${x - 4.5} ${y - 4.5}h9v9h-9z`)
    .join("");
}
