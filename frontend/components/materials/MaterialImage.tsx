"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";

interface MaterialImageProps {
  src?: string | null;
  alt: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function resolveImageUrl(src: string) {
  try {
    return new URL(src, API_BASE_URL).toString();
  } catch {
    return src;
  }
}

export default function MaterialImage({
  src,
  alt,
}: MaterialImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400">
        <ImageOff className="h-7 w-7" aria-hidden="true" />
        <span className="text-sm">Foto tidak tersedia</span>
      </div>
    );
  }

  return (
    // Backend mengirim URL media yang dapat berasal dari host berbeda.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolveImageUrl(src)}
      alt={alt}
      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      onError={() => setHasError(true)}
    />
  );
}
