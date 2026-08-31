import { Gift, Package, Recycle, Tag } from "lucide-react";
import type { ImpactHistoryEntry, RescuePath } from "@/types/impact";

interface ImpactHistoryListProps {
  entries: ImpactHistoryEntry[];
}

const PATH_ICON: Record<RescuePath, typeof Tag> = {
  jual_diskon: Tag,
  donasi: Gift,
  material_exchange: Recycle,
};

const PATH_LABEL: Record<RescuePath, string> = {
  jual_diskon: "Jual Diskon",
  donasi: "Donasi",
  material_exchange: "Material Exchange",
};

const ROLE_LABEL = { poster: "Penjual", claimer: "Pengklaim" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ImpactHistoryList({ entries }: ImpactHistoryListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
        <Package className="mx-auto h-8 w-8 text-gray-400" aria-hidden="true" />
        <p className="mt-2 text-sm text-gray-500">Belum ada transaksi selesai yang sesuai filter.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => {
        const Icon = entry.path ? PATH_ICON[entry.path] : Package;

        return (
          <li
            key={entry.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-light/20 text-secondary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{entry.item.name}</p>
                <p className="text-xs text-gray-500">
                  {entry.path ? PATH_LABEL[entry.path] : "Lainnya"} · {entry.category} ·{" "}
                  {formatDate(entry.completed_at)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 text-right">
              <span className="text-sm font-medium text-gray-700">
                {entry.quantity} {entry.unit}
              </span>
              <div className="flex gap-1">
                {entry.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-primary-soft/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                  >
                    {ROLE_LABEL[role]}
                  </span>
                ))}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
