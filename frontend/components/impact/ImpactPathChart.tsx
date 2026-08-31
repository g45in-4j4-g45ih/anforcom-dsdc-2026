import { formatCompactNumber } from "@/lib/format-number";
import type {
  ImpactMeasurement,
  RescuePath,
} from "@/types/impact";

interface ImpactPathChartProps {
  byPath: Record<RescuePath, ImpactMeasurement>;
}

const PATHS: Array<{
  value: RescuePath;
  label: string;
}> = [
  { value: "jual_diskon", label: "Jual Diskon" },
  { value: "donasi", label: "Donasi" },
  { value: "byproduct", label: "Byproduct" },
];

function getBarWidth(value: number, maximum: number) {
  if (value <= 0 || maximum <= 0) return 0;

  return Math.max((value / maximum) * 100, 4);
}

export default function ImpactPathChart({
  byPath,
}: ImpactPathChartProps) {
  const maximumKg = Math.max(
    ...PATHS.map(({ value }) => byPath[value].total_kg),
    0,
  );
  const maximumLiter = Math.max(
    ...PATHS.map(({ value }) => byPath[value].total_liter),
    0,
  );
  const hasData = maximumKg > 0 || maximumLiter > 0;

  return (
    <section
      aria-labelledby="impact-path-chart-title"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="impact-path-chart-title"
            className="text-sm font-semibold text-gray-900"
          >
            Perbandingan Dampak per Jalur
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Panjang batang dibandingkan dalam satuan yang sama.
          </p>
        </div>

        <div
          aria-label="Legenda"
          className="flex items-center gap-4 text-xs text-gray-600"
        >
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-primary"
            />
            Kg
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-secondary"
            />
            Liter
          </span>
        </div>
      </div>

      {!hasData ? (
        <p className="mt-6 rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          Belum ada data kg atau liter untuk divisualisasikan.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {PATHS.map(({ value, label }) => {
            const measurement = byPath[value];
            const kgWidth = getBarWidth(
              measurement.total_kg,
              maximumKg,
            );
            const literWidth = getBarWidth(
              measurement.total_liter,
              maximumLiter,
            );

            return (
              <div key={value}>
                <p className="mb-2 text-sm font-medium text-gray-700">
                  {label}
                </p>

                <div className="space-y-2">
                  <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-3">
                    <span className="text-xs text-gray-500">Kg</span>
                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${kgWidth}%` }}
                      />
                    </div>
                    <span className="min-w-16 text-right text-xs font-medium text-gray-700">
                      {formatCompactNumber(measurement.total_kg)} kg
                    </span>
                  </div>

                  <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-3">
                    <span className="text-xs text-gray-500">Liter</span>
                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-secondary"
                        style={{ width: `${literWidth}%` }}
                      />
                    </div>
                    <span className="min-w-16 text-right text-xs font-medium text-gray-700">
                      {formatCompactNumber(
                        measurement.total_liter,
                      )}{" "}
                      liter
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}