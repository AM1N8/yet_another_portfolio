type RGB = [number, number, number];
export type ParticlePalette = RGB[];
const mix = (from: RGB, to: RGB, amount: number): RGB =>
  from.map((channel, index) => channel + (to[index] - channel) * amount) as RGB;
export function readParticlePalette(
  canvas: HTMLCanvasElement,
): ParticlePalette {
  const style = getComputedStyle(canvas);
  const token = (name: string): RGB => {
    const value = style.getPropertyValue(name).trim();
    const channels = value.startsWith("#")
      ? value
          .slice(1)
          .match(/.{2}/g)!
          .map((part) => parseInt(part, 16))
      : value
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number);
    return channels as RGB;
  };
  const dim = token("--particle-dim"),
    base = token("--particle-base"),
    bright = token("--particle-bright"),
    hot = token("--particle-hot"),
    line = token("--particle-line");
  return [
    line,
    dim,
    mix(dim, base, 0.5),
    base,
    mix(base, bright, 0.33),
    mix(base, bright, 0.66),
    bright,
    mix(bright, hot, 0.5),
    hot,
  ];
}
export function particleColors(
  palette: ParticlePalette,
  from = palette,
  amount = 1,
): string[] {
  return palette.map(
    (color, index) =>
      `rgb(${mix(from[index], color, amount).map(Math.round).join(",")})`,
  );
}
export function blendParticlePalette(
  from: ParticlePalette,
  to: ParticlePalette,
  amount: number,
): ParticlePalette {
  return to.map((color, index) => mix(from[index], color, amount));
}
