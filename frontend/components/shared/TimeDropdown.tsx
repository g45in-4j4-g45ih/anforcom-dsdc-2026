"use client";

import { useEffect, useRef, useState } from "react";

interface TimeDropdownProps {
  value: string;
  onChange: (time: string) => void;
}

function generateTimeSlots() {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

export default function TimeDropdown({ value, onChange }: TimeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-300 px-3 py-2 text-left text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
      >
        <span>{value || "Pilih jam"}</span>
        <img src="/icons/chevron-down.svg" alt="" className="h-4 w-4 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {TIME_SLOTS.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => {
                onChange(time);
                setIsOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                time === value ? "bg-gray-100 font-medium text-gray-900" : "text-gray-700"
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}