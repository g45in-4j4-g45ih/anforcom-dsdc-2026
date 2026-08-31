import { Gift, Recycle, Tag } from "lucide-react";
import { formatCompactNumber } from "@/lib/format-number";
import type { ImpactMeasurement, RescuePath } from "@/types/impact";

interface RescuePathGridProps {
  byPath: Record<RescuePath, ImpactMeasurement>;
}

const PATH_META: Record<RescuePath, { label: string; icon: typeof Tag }> = {
  jual_diskon: { label: "Jual Diskon", icon: Tag },
  donasi: { label: "Donasi", icon: Gift },
  byproduct: { label: "Byproduct", icon: Recycle },
};

function formatMeasurement(measurement: ImpactMeasurement) {
  const parts: string[] = [];
  if (measurement.total_kg > 0) parts.push(`${formatCompactNumber(measurement.total_kg)} kg`);
  if (measurement.total_liter > 0) parts.push(`${formatCompactNumber(measurement.total_liter)} liter`);
  return parts.length > 0 ? parts.join(" · ") : "-";
}

export default function RescuePathGrid({ byPath }: RescuePathGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {(Object.keys(PATH_META) as RescuePath[]).map((path) => {
        const meta = PATH_META[path];
        const measurement = byPath[path];
        const Icon = meta.icon;

        return (
          <div key={path} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft/40 text-primary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
            </div>

            <p className="mt-3 text-lg font-semibold text-gray-900">
              {formatCompactNumber(measurement.total_transactions)}{" "}
              <span className="text-sm font-normal text-gray-500">transaksi</span>
            </p>
            <p className="mt-0.5 text-sm text-gray-500">{formatMeasurement(measurement)}</p>
          </div>
        );
      })}
    </div>
  );
}
