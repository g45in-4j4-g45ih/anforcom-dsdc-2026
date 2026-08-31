import { formatCompactNumber } from "@/lib/format-number";
import type { ImpactCategoryBreakdown } from "@/types/impact";

interface CategoryTableProps {
  categories: ImpactCategoryBreakdown[];
}

export default function CategoryTable({ categories }: CategoryTableProps) {
  if (categories.length === 0) {
    return <p className="text-sm text-gray-400">Belum ada data per kategori.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Kategori</th>
            <th className="px-4 py-3 text-right">Transaksi</th>
            <th className="px-4 py-3 text-right">Kg</th>
            <th className="px-4 py-3 text-right">Liter</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {categories.map((row) => (
            <tr key={row.category}>
              <td className="px-4 py-3 font-medium text-gray-900">{row.category}</td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                {formatCompactNumber(row.total_transactions)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                {row.total_kg > 0 ? formatCompactNumber(row.total_kg) : "-"}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                {row.total_liter > 0 ? formatCompactNumber(row.total_liter) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
