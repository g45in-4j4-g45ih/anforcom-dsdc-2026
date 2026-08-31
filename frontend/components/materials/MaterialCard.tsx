import {
  ArrowUpRight,
  Clock3,
  MapPin,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import MaterialCategoryChip from "@/components/materials/MaterialCategoryChip";

import MaterialImage from "@/components/materials/MaterialImage";
import type { Material } from "@/types/materials";

interface MaterialCardProps {
  material: Material;
}

function formatPickupDate(value: string | null) {
  if (!value) return "Fleksibel";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatQuantity(value: string) {
  const quantity = Number(value);

  if (Number.isNaN(quantity)) {
    return value;
  }

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(quantity);
}

function hasLimitedStock(material: Material) {
  const total = Number(material.quantity_total);
  const remaining = Number(material.quantity_remaining);

  if (
    !Number.isFinite(total) ||
    !Number.isFinite(remaining) ||
    total <= 0 ||
    remaining <= 0
  ) {
    return false;
  }

  return remaining / total <= 0.25;
}

export default function MaterialCard({
  material,
}: MaterialCardProps) {
  const thumbnail = material.images[0]?.image;
  const limitedStock = hasLimitedStock(material);

  return (
    <Link
      href={`/items/${material.id}`}
      aria-label={`Lihat detail ${material.name}`}
      className="group min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-secondary-light hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-50">
        <MaterialImage
          src={thumbnail}
          alt={material.name}
        />

        <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl border border-white/80 bg-white/95 text-secondary shadow-sm transition group-hover:bg-secondary group-hover:text-white">
          <ArrowUpRight
            className="h-4 w-4"
            aria-hidden="true"
          />
        </span>

        {limitedStock && (
          <span className="absolute bottom-0 left-0 flex items-center gap-1 rounded-tr-xl bg-amber-500 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm sm:px-3 sm:text-xs">
            <TriangleAlert
              className="h-3 w-3"
              aria-hidden="true"
            />
            Stok Terbatas
          </span>
        )}
      </div>

      <div className="p-3 sm:p-4">
        <MaterialCategoryChip
          category={material.category}
          className="px-2 text-[10px] sm:text-xs"
        />

        <h2 className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-gray-900 sm:text-base">
          {material.name}
        </h2>

        <p className="mt-2 text-[10px] text-gray-500 sm:text-xs">
          Tersedia{" "}
          <span className="font-bold text-gray-900">
            {formatQuantity(material.quantity_remaining)}{" "}
            {material.unit}
          </span>
        </p>

        <div className="mt-2.5 flex min-w-0 items-center justify-between gap-2 border-t border-gray-100 pt-2.5 text-[10px] text-gray-500 sm:text-xs">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin
              className="h-3.5 w-3.5 shrink-0 text-secondary"
              aria-hidden="true"
            />
            <span className="truncate">
              {material.pickup_location?.alamat ??
                "Lokasi belum tersedia"}
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-1">
            <Clock3
              className="h-3.5 w-3.5 text-secondary"
              aria-hidden="true"
            />
            {formatPickupDate(material.pickup_date_end)}
          </span>
        </div>
      </div>
    </Link>
  );
}
