import { Clock3, MapPin } from "lucide-react";
import Link from "next/link";

import MaterialImage from "@/components/materials/MaterialImage";
import type {
  Material,
  MaterialStatus,
} from "@/types/materials";

interface MaterialCardProps {
  material: Material;
}

const STATUS_STYLES: Record<MaterialStatus, string> = {
  Tersedia: "bg-secondary-light/30 text-secondary",
  "Tersedia Sebagian": "bg-amber-50 text-amber-700",
  Habis: "bg-gray-100 text-gray-500",
  Selesai: "bg-blue-50 text-blue-700",
  Kadaluarsa: "bg-red-50 text-red-600",
};

function formatPickupDate(value: string | null) {
  if (!value) return "Jadwal fleksibel";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export default function MaterialCard({
  material,
}: MaterialCardProps) {
  const thumbnail = material.images[0]?.image;

  return (
    <Link
      href={`/materials/${material.id}`}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:border-secondary-light hover:shadow-md"
    >
      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gray-50">
        <MaterialImage
          src={thumbnail}
          alt={material.name}
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
            STATUS_STYLES[material.status]
          }`}
        >
          {material.status}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-secondary">
            {material.category || "Material lainnya"}
          </p>
          <h2 className="mt-1 line-clamp-2 font-semibold text-gray-900">
            {material.name}
          </h2>
        </div>

        <p className="text-sm text-gray-600">
          Tersisa{" "}
          <span className="font-semibold text-gray-900">
            {material.quantity_remaining} {material.unit}
          </span>
        </p>

        <div className="space-y-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
            <span className="truncate">
              {material.pickup_location?.alamat ?? "Lokasi belum tersedia"}
            </span>
          </p>

          <p className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
            <span>{formatPickupDate(material.pickup_date_end)}</span>
          </p>
        </div>

        <p className="text-xs text-gray-400">
          Dibagikan oleh {material.store_name || material.poster_name}
        </p>
      </div>
    </Link>
  );
}
