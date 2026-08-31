"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, PackageOpen, ShoppingBag, TriangleAlert } from "lucide-react";
import { fetchStoreKlaims, markKlaimSelesai, StoreKlaim, toAbsoluteMediaUrl } from "@/lib/api";

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value)
  );
}

const STATUS_STYLE: Record<string, string> = {
  "Menunggu Pembayaran": "bg-gray-100 text-gray-600",
  Dibayar: "bg-primary-soft/40 text-primary",
  Selesai: "bg-secondary-light/20 text-secondary",
  Batal: "bg-red-50 text-red-500",
};

export default function StoreOrdersSection() {
  const [klaims, setKlaims] = useState<StoreKlaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const token = localStorage.getItem("auth_token") ?? "";
      setKlaims(await fetchStoreKlaims(token));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal memuat pesanan masuk.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleComplete(klaimId: number) {
    setCompletingId(klaimId);
    try {
      const token = localStorage.getItem("auth_token") ?? "";
      const updated = await markKlaimSelesai(klaimId, token);
      setKlaims((current) => current.map((k) => (k.id === klaimId ? updated : k)));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menandai pesanan selesai.");
    } finally {
      setCompletingId(null);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-gray-400">Memuat pesanan masuk...</p>;
  }

  if (errorMessage && klaims.length === 0) {
    return (
      <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <TriangleAlert className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
        <h2 className="mt-3 font-semibold text-gray-900">Pesanan belum dapat dimuat</h2>
        <p className="mt-1 text-sm text-gray-600">{errorMessage}</p>
      </div>
    );
  }

  if (klaims.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
        <PackageOpen className="mx-auto h-8 w-8 text-gray-400" aria-hidden="true" />
        <p className="mt-2 text-sm text-gray-500">Belum ada pesanan masuk buat toko ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {errorMessage && (
        <div role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      <ul className="space-y-2">
        {klaims.map((klaim) => (
          <li
            key={klaim.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50">
                {klaim.item_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={toAbsoluteMediaUrl(klaim.item_image)}
                    alt={klaim.item_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="h-5 w-5 text-gray-400" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{klaim.item_name}</p>
                <p className="text-xs text-gray-500">
                  {klaim.peminat_nama} · {klaim.jumlah_diklaim} {klaim.item_unit} ·{" "}
                  {formatDate(klaim.created_at)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">
                {klaim.total_price > 0 ? rupiah.format(klaim.total_price) : "Gratis"}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                  STATUS_STYLE[klaim.status] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {klaim.status}
              </span>
              {klaim.status === "Dibayar" && (
                <button
                  type="button"
                  onClick={() => handleComplete(klaim.id)}
                  disabled={completingId === klaim.id}
                  className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-light disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {completingId === klaim.id ? "Memproses..." : "Tandai Selesai"}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
