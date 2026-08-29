"use client";

import { useEffect, useRef, useState } from "react";
import { searchLocations, type LocationResult } from "@/lib/api";

interface LocationAutocompleteProps {
  value: string;
  onSelect: (location: { text: string; lat: number; lng: number }) => void;
}

export default function LocationAutocomplete({ value, onSelect }: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      const data = await searchLocations(query);
      setResults(data);
      setIsLoading(false);
      setIsOpen(true);
    }, 400); // debounce 400ms biar nggak spam request tiap ketikan

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // tutup dropdown kalau klik di luar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(result: LocationResult) {
    setQuery(result.display_name);
    setIsOpen(false);
    onSelect({
      text: result.display_name,
      lat: Number(parseFloat(result.lat).toFixed(6)),
      lng: Number(parseFloat(result.lon).toFixed(6)),
    });
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-gray-700">Lokasi</label>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Isi alamatmu di sini"
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-gray-400">Mencari lokasi...</div>
          )}
          {!isLoading && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">Lokasi tidak ditemukan</div>
          )}
          {!isLoading &&
            results.map((result, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(result)}
                className="block w-full truncate px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                title={result.display_name}
              >
                {result.display_name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}