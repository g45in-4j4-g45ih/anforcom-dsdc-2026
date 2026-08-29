"use client";

import { useEffect, useRef, useState } from "react";

interface Option {
  label: string;
  value: string;
}

interface SelectFieldProps {
  value: string;
  options: Option[] | string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SelectField({ value, options, onChange, placeholder = "Pilih" }: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const normalized: Option[] = options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt } : opt
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = normalized.find((o) => o.value === value)?.label;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className="flex w-full items-center justify-between rounded-full border border-gray-300 px-3 py-2 text-left text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
      >
        <span className={selectedLabel ? "text-gray-900" : "text-gray-400"}>
          {selectedLabel || placeholder}
        </span>
        <img src="/icons/chevron-down.svg" alt="" className="h-4 w-4 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {normalized.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                opt.value === value ? "bg-gray-100 font-medium text-gray-900" : "text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}