"use client";

import Image from "next/image";
import { useState } from "react";

export function GalleryImage({
  src,
  alt,
  width,
  height,
  sizes,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="archive-image"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {failed ? (
        <p className="archive-image-error">
          <span className="label">Image unavailable</span>
          <span>{alt}</span>
        </p>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading="lazy"
          unoptimized={/^https?:/.test(src)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
