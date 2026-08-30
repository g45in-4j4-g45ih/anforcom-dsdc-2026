"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label: string;
  name: string;
  defaultValue: string;
  options: FilterOption[];
  // optional - lets a client component react to the selection directly
  // instead of relying on a <form> submit/page reload (e.g. materials/forum
  // pages don't pass this; impact's client-fetched history list does)
  onChange?: (value: string) => void;
}

export default function FilterDropdown({
  label,
  name,
  defaultValue,
  options,
  onChange,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const selectedOption =
    options.find((option) => option.value === selectedValue) ??
    options[0];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-w-0"
    >
      <span className="sr-only">{label}</span>

      <input
        type="hidden"
        name={name}
        value={selectedValue}
      />

      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 text-left text-sm text-gray-700 outline-none transition hover:border-secondary-light focus:border-secondary focus:ring-2 focus:ring-secondary-light/30"
      >
        <span className="truncate">{selectedOption.label}</span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-lg"
        >
          {options.map((option) => {
            const selected = option.value === selectedValue;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setSelectedValue(option.value);
                  setIsOpen(false);
                  onChange?.(option.value);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  selected
                    ? "bg-primary-soft/50 font-medium text-primary"
                    : "text-gray-600 hover:bg-primary-soft/40 hover:text-gray-900"
                }`}
              >
                <span>{option.label}</span>

                {selected && (
                  <Check
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
