"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import type { TouchEvent } from "react";

const SLIDES = [
  {
    image:
      "/images/materials/banners/material-second-life.jpg",
    alt: "Sisa produksi masih punya nilai. Lihat material gratis dari usaha di sekitarmu.",
    href: "#material-list",
  },
  {
    image:
      "/images/materials/banners/material-pickup.jpg",
    alt: "Klaim material sebelum habis. Cek stok dan jadwal pengambilannya.",
    href: "#material-list",
  },
  {
    image:
      "/images/materials/banners/material-community.jpg",
    alt: "Punya sisa produksi? Bagikan material dan temukan orang yang dapat memanfaatkannya.",
    href: "/post-item",
  },
];

const AUTOPLAY_DELAY = 6000;
const SWIPE_THRESHOLD = 50;

export default function MaterialsHero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  function showPreviousSlide() {
    setActiveSlide((current) =>
      current === 0 ? SLIDES.length - 1 : current - 1,
    );
  }

  function showNextSlide() {
    setActiveSlide((current) =>
      current === SLIDES.length - 1 ? 0 : current + 1,
    );
  }

  function handleTouchStart(
    event: TouchEvent<HTMLElement>,
  ) {
    touchStartX.current =
      event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(
    event: TouchEvent<HTMLElement>,
  ) {
    if (touchStartX.current === null) {
      return;
    }

    const touchEndX =
      event.changedTouches[0]?.clientX ??
      touchStartX.current;
    const distance = touchEndX - touchStartX.current;

    if (Math.abs(distance) >= SWIPE_THRESHOLD) {
      if (distance > 0) {
        showPreviousSlide();
      } else {
        showNextSlide();
      }
    }

    touchStartX.current = null;
  }

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (isPaused || reducedMotion.matches) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) =>
        current === SLIDES.length - 1
          ? 0
          : current + 1,
      );
    }, AUTOPLAY_DELAY);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Informasi Byproduct"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (
          !event.currentTarget.contains(
            event.relatedTarget as Node | null,
          )
        ) {
          setIsPaused(false);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative isolate aspect-[107/39] min-h-36 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
    >
      {SLIDES.map((slide, index) => {
        const isActive = index === activeSlide;

        return (
          <Link
            key={slide.image}
            href={slide.href}
            tabIndex={isActive ? 0 : -1}
            aria-hidden={!isActive}
            aria-label={slide.alt}
            className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${
              isActive
                ? "z-10 opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 1280px"
              className="object-cover"
            />
          </Link>
        );
      })}

      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1.5 shadow-sm backdrop-blur">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            aria-label={`Tampilkan banner ${index + 1}`}
            aria-current={
              index === activeSlide ? "true" : undefined
            }
            onClick={() => setActiveSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === activeSlide
                ? "w-6 bg-primary"
                : "w-2 bg-gray-300 hover:bg-primary-light"
            }`}
          />
        ))}
      </div>
    </section>
  );
}