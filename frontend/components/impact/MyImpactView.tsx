"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Package, Sprout, TriangleAlert } from "lucide-react";

import FilterDropdown from "@/components/materials/FilterDropdown";
import StatCard from "./StatCard";
import RescuePathGrid from "./RescuePathGrid";
import RoleSummaryGrid from "./RoleSummaryGrid";
import ImpactHistoryList from "./ImpactHistoryList";
import { formatCompactNumber } from "@/lib/format-number";
import { getImpactHistory, getMyImpact, ImpactApiError } from "@/lib/impact-api";
import type { ImpactHistoryEntry, MyImpactSummary, RescuePath } from "@/types/impact";

const PATH_FILTER_OPTIONS = [
  { label: "Semua jalur", value: "" },
  { label: "Jual Diskon", value: "jual_diskon" },
  { label: "Donasi", value: "donasi" },
  { label: "Material Exchange", value: "material_exchange" },
];

export default function MyImpactView() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [summary, setSummary] = useState<MyImpactSummary | null>(null);
  const [history, setHistory] = useState<ImpactHistoryEntry[]>([]);
  const [pathFilter, setPathFilter] = useState<RescuePath | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      setToken(localStorage.getItem("auth_token"));
    } catch {
      setToken(null);
    }
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [summaryData, historyData] = await Promise.all([
        getMyImpact(token),
        getImpactHistory(pathFilter ? { path: pathFilter } : {}, token),
      ]);
      setSummary(summaryData);
      setHistory(historyData.results);
    } catch (error) {
      setErrorMessage(
        error instanceof ImpactApiError ? error.message : "Data dampak belum dapat dimuat."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, pathFilter]);

  useEffect(() => {
    if (token) load();
    else if (token === null) setIsLoading(false);
  }, [token, load]);

  if (token === undefined || isLoading) {
    return <p className="text-sm text-gray-400">Memuat data dampak...</p>;
  }

  if (!token) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
        <TriangleAlert className="mx-auto h-8 w-8 text-gray-400" aria-hidden="true" />
        <p className="mt-2 text-sm text-gray-600">Kamu harus masuk dulu buat lihat dampakmu.</p>
        <Link
          href="/login"
          className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light"
        >
          Masuk
        </Link>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <TriangleAlert className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
        <h2 className="mt-3 font-semibold text-gray-900">Data dampak belum dapat dimuat</h2>
        <p className="mt-1 text-sm text-gray-600">{errorMessage}</p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Peranmu</h2>
        <RoleSummaryGrid byRole={summary.by_role} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Berdasarkan Jalur</h2>
        <RescuePathGrid byPath={summary.by_path} />
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">Riwayat Transaksi</h2>
          <div className="w-48">
            <FilterDropdown
              label="Filter jalur"
              name="path"
              defaultValue={pathFilter}
              options={PATH_FILTER_OPTIONS}
              onChange={(value) => setPathFilter(value as RescuePath | "")}
            />
          </div>
        </div>
        <ImpactHistoryList entries={history} />
      </div>
    </div>
  );
}
