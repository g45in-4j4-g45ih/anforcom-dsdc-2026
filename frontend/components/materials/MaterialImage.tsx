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
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-50 text-gray-400">
        <ImageOff
          className="h-6 w-6 sm:h-7 sm:w-7"
          aria-hidden="true"
        />
        <span className="text-[10px] sm:text-sm">
          Foto tidak tersedia
        </span>
      </div>

      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveImageUrl(src)}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(false)}
          className={`absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}