import { HandCoins, Store } from "lucide-react";
import { formatCompactNumber } from "@/lib/format-number";
import type { ImpactRoleSummary } from "@/types/impact";

interface RoleSummaryGridProps {
  byRole: ImpactRoleSummary;
}

export default function RoleSummaryGrid({ byRole }: RoleSummaryGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary-light/20 text-secondary">
            <Store className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-gray-900">Sebagai Penjual/Pemberi</p>
        </div>
        <p className="mt-3 text-lg font-semibold text-gray-900">
          {formatCompactNumber(byRole.poster.total_transactions)}{" "}
          <span className="text-sm font-normal text-gray-500">transaksi</span>
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft/40 text-primary">
            <HandCoins className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-gray-900">Sebagai Pengklaim</p>
        </div>
        <p className="mt-3 text-lg font-semibold text-gray-900">
          {formatCompactNumber(byRole.claimer.total_transactions)}{" "}
          <span className="text-sm font-normal text-gray-500">transaksi</span>
        </p>
      </div>
    </div>
  );
}
