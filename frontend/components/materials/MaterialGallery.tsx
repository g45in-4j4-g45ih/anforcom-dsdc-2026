"use client";

import {
  ChevronLeft,
  ChevronRight,
  Images,
} from "lucide-react";
import { useState } from "react";

import MaterialImage from "@/components/materials/MaterialImage";
import type { MaterialImage as MaterialImageData } from "@/types/materials";

interface MaterialGalleryProps {
  images: MaterialImageData[];
  materialName: string;
}

export default function MaterialGallery({
  images,
  materialName,
}: MaterialGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex]?.image;

  function showPreviousImage() {
    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  }

  function showNextImage() {
    setActiveIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  }

  return (
    <section aria-label={`Foto ${materialName}`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 shadow-sm">
        <MaterialImage
          src={activeImage}
          alt={
            activeImage
              ? `${materialName}, foto ${activeIndex + 1}`
              : materialName
          }
        />

        {images.length > 0 && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-gray-900/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
            <Images
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
            {activeIndex + 1}/{images.length}
          </span>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              aria-label="Foto sebelumnya"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-md transition hover:bg-primary hover:text-white"
            >
              <ChevronLeft
                className="h-5 w-5"
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={showNextImage}
              aria-label="Foto berikutnya"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-md transition hover:bg-primary hover:text-white"
            >
              <ChevronRight
                className="h-5 w-5"
                aria-hidden="true"
              />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Tampilkan foto ${index + 1}`}
                aria-current={
                  isActive ? "true" : undefined
                }
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-gray-50 transition sm:h-20 sm:w-20 ${
                  isActive
                    ? "border-primary"
                    : "border-transparent hover:border-secondary-light"
                }`}
              >
                <MaterialImage
                  src={image.image}
                  alt=""
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
