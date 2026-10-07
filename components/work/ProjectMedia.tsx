import Image from "next/image";

export function ProjectImage({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="case-image">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1440px) 1200px, 100vw"
        priority={priority}
        unoptimized={src.startsWith("http")}
      />
    </div>
  );
}
