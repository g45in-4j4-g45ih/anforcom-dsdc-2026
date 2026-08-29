"use client";

import {
  Flag,
  Minus,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { reportMaterial } from "@/lib/materials-api";
import type {
  MaterialStatus,
  MaterialUnit,
} from "@/types/materials";

interface MaterialActionsProps {
  materialId: number;
  materialName: string;
  quantityRemaining: string;
  unit: MaterialUnit;
  status: MaterialStatus;
  isReported: boolean;
}

const CLAIMABLE_STATUSES: MaterialStatus[] = [
  "Tersedia",
  "Tersedia Sebagian",
];

function formatQuantity(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default function MaterialActions({
  materialId,
  materialName,
  quantityRemaining,
  unit,
  status,
  isReported,
}: MaterialActionsProps) {
  const router = useRouter();
  const remaining = Number(quantityRemaining);
  const quantityStep =
    unit === "kg" || unit === "liter" ? 0.1 : 1;

  const [quantity, setQuantity] = useState(quantityStep);
  const [reportSubmitted, setReportSubmitted] =
    useState(isReported);
  const [isReporting, setIsReporting] = useState(false);
  const [message, setMessage] = useState<string | null>(
    null,
  );

  const isClaimable =
    CLAIMABLE_STATUSES.includes(status) &&
    Number.isFinite(remaining) &&
    remaining > 0;

  function updateQuantity(nextQuantity: number) {
    const normalized = Number(
      Math.min(
        remaining,
        Math.max(quantityStep, nextQuantity),
      ).toFixed(2),
    );

    setQuantity(normalized);
    setMessage(null);
  }

  function handleQuantityInput(value: string) {
    const nextQuantity = Number(value);

    if (!Number.isFinite(nextQuantity)) {
      return;
    }

    setQuantity(nextQuantity);
    setMessage(null);
  }

  function handleClaim() {
    if (!isClaimable) {
      setMessage(
        "Material ini sudah tidak dapat diklaim.",
      );
      return;
    }

    if (quantity <= 0 || quantity > remaining) {
      setMessage(
        `Jumlah klaim harus lebih dari 0 dan maksimal ${formatQuantity(
          remaining,
        )} ${unit}.`,
      );
      return;
    }

    const params = new URLSearchParams({
      item: String(materialId),
      quantity: String(quantity),
    });

    router.push(`/checkout?${params.toString()}`);
  }

  async function handleReport() {
    if (reportSubmitted || isReporting) {
      return;
    }

    const token = localStorage.getItem("auth_token");

    if (!token) {
      const nextPath = `/materials/${materialId}`;
      router.push(
        `/login?next=${encodeURIComponent(nextPath)}`,
      );
      return;
    }

    setIsReporting(true);
    setMessage(null);

    try {
      await reportMaterial(materialId, token);
      setReportSubmitted(true);
      setMessage(
        "Laporan berhasil dikirim untuk ditinjau.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Laporan belum dapat dikirim.",
      );
    } finally {
      setIsReporting(false);
    }
  }

  return (
    <section
      aria-label={`Aksi untuk ${materialName}`}
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Jumlah klaim
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Maksimal {formatQuantity(remaining)} {unit}
          </p>
        </div>

        <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() =>
              updateQuantity(quantity - quantityStep)
            }
            disabled={
              !isClaimable ||
              quantity <= quantityStep
            }
            aria-label="Kurangi jumlah"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus
              className="h-4 w-4"
              aria-hidden="true"
            />
          </button>

          <label className="relative">
            <span className="sr-only">
              Jumlah yang ingin diklaim
            </span>
            <input
              type="number"
              min={quantityStep}
              max={remaining}
              step={quantityStep}
              value={quantity}
              disabled={!isClaimable}
              onChange={(event) =>
                handleQuantityInput(event.target.value)
              }
              className="h-8 w-16 bg-transparent text-center text-sm font-semibold text-gray-900 outline-none disabled:text-gray-400"
            />
          </label>

          <button
            type="button"
            onClick={() =>
              updateQuantity(quantity + quantityStep)
            }
            disabled={
              !isClaimable ||
              quantity >= remaining
            }
            aria-label="Tambah jumlah"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus
              className="h-4 w-4"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {message && (
        <p
          role="status"
          className="mt-3 rounded-xl bg-primary-soft/30 px-3 py-2 text-xs text-gray-700"
        >
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={handleClaim}
        disabled={!isClaimable}
        className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-light disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isClaimable
          ? "Klaim Material"
          : "Tidak Dapat Diklaim"}
      </button>

      <button
        type="button"
        onClick={handleReport}
        disabled={reportSubmitted || isReporting}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Flag
          className="h-4 w-4"
          aria-hidden="true"
        />
        {reportSubmitted
          ? "Sudah Dilaporkan"
          : isReporting
            ? "Mengirim laporan..."
            : "Laporkan Material"}
      </button>
    </section>
  );
}
