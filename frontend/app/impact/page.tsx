import { ArrowUpRight, Package, Sprout, TriangleAlert } from "lucide-react";
import Link from "next/link";

import Navbar from "@/components/navigation/Navbar";
import StatCard from "@/components/impact/StatCard";
import RescuePathGrid from "@/components/impact/RescuePathGrid";
import CategoryTable from "@/components/impact/CategoryTable";
import { formatCompactNumber } from "@/lib/format-number";
import { getImpactDashboard, ImpactApiError } from "@/lib/impact-api";

export const dynamic = "force-dynamic";

export default async function ImpactPage() {
  let summary;
  let errorMessage: string | null = null;

  try {
    summary = await getImpactDashboard();
  } catch (error) {
    errorMessage =
      error instanceof ImpactApiError ? error.message : "Data dampak belum dapat dimuat.";
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Dampak Bersama</h1>
            <p className="mt-1 text-sm text-gray-500">
              Total makanan dan material yang berhasil diselamatkan lewat platform ini.
            </p>
          </div>

          <Link
            href="/impact/me"
            className="flex items-center gap-2 rounded-full border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary-soft/30"
          >
            Dampakku
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {errorMessage || !summary ? (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-8 text-center"
          >
            <TriangleAlert className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-gray-900">Data dampak belum dapat dimuat</h2>
            <p className="mt-1 text-sm text-gray-600">
              {errorMessage ?? "Terjadi kesalahan yang tidak diketahui."}
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                label="Total transaksi selesai"
                value={formatCompactNumber(summary.totals.total_transactions)}
                icon={<Package className="h-4 w-4" aria-hidden="true" />}
              />
              <StatCard
                label="Total diselamatkan (kg)"
                value={formatCompactNumber(summary.totals.total_kg)}
                icon={<Sprout className="h-4 w-4" aria-hidden="true" />}
              />
              <StatCard
                label="Total diselamatkan (liter)"
                value={formatCompactNumber(summary.totals.total_liter)}
                icon={<Sprout className="h-4 w-4" aria-hidden="true" />}
              />
            </div>

            <h2 className="mb-3 mt-8 text-sm font-semibold text-gray-900">Berdasarkan Jalur</h2>
            <RescuePathGrid byPath={summary.by_path} />

            <h2 className="mb-3 mt-8 text-sm font-semibold text-gray-900">Berdasarkan Kategori</h2>
            <CategoryTable categories={summary.by_category} />
          </>
        )}
      </main>
    </div>
  );
}
