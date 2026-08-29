import {
  CalendarDays,
  Clock3,
  MapPin,
  Package,
  Store,
  UserRound,
} from "lucide-react";

import MaterialCategoryChip from "@/components/materials/MaterialCategoryChip";
import MaterialActions from "@/components/materials/MaterialActions";
import MaterialGallery from "@/components/materials/MaterialGallery";
import type {
  Material,
  MaterialStatus,
} from "@/types/materials";

interface MaterialDetailViewProps {
  material: Material;
}

const STATUS_STYLES: Record<MaterialStatus, string> = {
  Tersedia: "bg-emerald-50 text-emerald-700",
  "Tersedia Sebagian": "bg-amber-50 text-amber-700",
  Habis: "bg-gray-100 text-gray-600",
  Selesai: "bg-blue-50 text-blue-700",
  Kadaluarsa: "bg-red-50 text-red-700",
};

function formatQuantity(value: string) {
  const quantity = Number(value);

  if (!Number.isFinite(quantity)) {
    return value;
  }

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(quantity);
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string | null) {
  if (!value) {
    return null;
  }

  return value.slice(0, 5);
}

function getPickupDate(material: Material) {
  const start = formatDate(material.pickup_date_start);
  const end = formatDate(material.pickup_date_end);

  if (!start && !end) {
    return "Jadwal fleksibel";
  }

  if (!start) {
    return `Sampai ${end}`;
  }

  if (!end || start === end) {
    return start;
  }

  return `${start} – ${end}`;
}

function getPickupTime(material: Material) {
  const start = formatTime(material.pickup_start);
  const end = formatTime(material.pickup_end);

  if (!start && !end) {
    return "Waktu fleksibel";
  }

  if (!start) {
    return `Sampai ${end} WIB`;
  }

  if (!end) {
    return `Mulai ${start} WIB`;
  }

  return `${start}–${end} WIB`;
}

export default function MaterialDetailView({
  material,
}: MaterialDetailViewProps) {
  const location =
    material.pickup_location?.alamat ??
    "Lokasi pengambilan belum tersedia";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
      <div className="min-w-0">
        <MaterialGallery
          images={material.images}
          materialName={material.name}
        />

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-gray-900">
            Tentang material
          </h2>

          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">
            {material.description ||
              "Pemilik belum menambahkan deskripsi untuk material ini."}
          </p>

          <dl className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-light/20 text-secondary">
                <Package
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </span>

              <div>
                <dt className="text-xs text-gray-500">
                  Kuantitas awal
                </dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">
                  {formatQuantity(material.quantity_total)}{" "}
                  {material.unit}
                </dd>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-light/20 text-secondary">
                <Package
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </span>

              <div>
                <dt className="text-xs text-gray-500">
                  Masih tersedia
                </dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">
                  {formatQuantity(
                    material.quantity_remaining,
                  )}{" "}
                  {material.unit}
                </dd>
              </div>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-gray-900">
            Informasi pengambilan
          </h2>

          <dl className="mt-5 space-y-5">
            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-light/20 text-secondary">
                <MapPin
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </span>

              <div>
                <dt className="text-xs text-gray-500">
                  Lokasi pickup
                </dt>
                <dd className="mt-1 text-sm font-medium leading-6 text-gray-900">
                  {location}
                </dd>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-light/20 text-secondary">
                <CalendarDays
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </span>

              <div>
                <dt className="text-xs text-gray-500">
                  Tanggal pickup
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {getPickupDate(material)}
                </dd>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-light/20 text-secondary">
                <Clock3
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </span>

              <div>
                <dt className="text-xs text-gray-500">
                  Jam pickup
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {getPickupTime(material)}
                </dd>
              </div>
            </div>
          </dl>
        </section>
      </div>

      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <MaterialCategoryChip category={material.category} />

            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                STATUS_STYLES[material.status]
              }`}
            >
              {material.status}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
            {material.name}
          </h1>

          <div className="mt-5 rounded-2xl bg-[#f8f6f1] p-4">
            <p className="text-xs text-gray-500">
              Material tersisa
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatQuantity(
                material.quantity_remaining,
              )}{" "}
              <span className="text-base font-semibold text-gray-600">
                {material.unit}
              </span>
            </p>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Dibagikan oleh
            </p>

            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Store
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </span>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">
                  {material.store_name ||
                    "Nama toko belum tersedia"}
                </p>

                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                  <UserRound
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  {material.poster_name ||
                    "Pemilik material"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4">
          <MaterialActions
            materialId={material.id}
            materialName={material.name}
            quantityRemaining={
              material.quantity_remaining
            }
            unit={material.unit}
            status={material.status}
            isReported={material.is_reported}
          />
        </div>
      </aside>
    </div>
  );
}
