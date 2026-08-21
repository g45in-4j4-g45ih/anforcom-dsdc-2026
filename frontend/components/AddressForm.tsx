"use client";

import { useState } from "react";
import LocationAutocomplete from "./LocationAutocomplete";

export interface AddressValue {
  areaText: string; // hasil dari search (jalan/kelurahan/kecamatan)
  areaLat: number | null;
  areaLng: number | null;
  detail: string; // nama jalan, nomor rumah, blok, RT/RW (input manual)
  landmark: string; // patokan buat kurir (opsional)
  fullAddress: string; // gabungan detail + area, buat dikirim ke backend
}

interface AddressFormProps {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
}

const EMPTY_ADDRESS: AddressValue = {
  areaText: "",
  areaLat: null,
  areaLng: null,
  detail: "",
  landmark: "",
  fullAddress: "",
};

export { EMPTY_ADDRESS };

function buildFullAddress(detail: string, areaText: string) {
  return [detail, areaText].filter(Boolean).join(", ");
}

export default function AddressForm({ value, onChange }: AddressFormProps) {
  const [showDetailFields, setShowDetailFields] = useState(!!value.areaText);

  function updateField<K extends keyof AddressValue>(key: K, val: AddressValue[K]) {
    const next = { ...value, [key]: val };
    next.fullAddress = buildFullAddress(next.detail, next.areaText);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Cari Area (jalan / kelurahan / kecamatan)
        </label>
        <LocationAutocomplete
          value={value.areaText}
          onSelect={({ text, lat, lng }) => {
            const next = {
              ...value,
              areaText: text,
              areaLat: lat,
              areaLng: lng,
            };
            next.fullAddress = buildFullAddress(next.detail, next.areaText);
            onChange(next);
            setShowDetailFields(true);
          }}
        />
        <p className="mt-1 text-xs text-gray-400">
          Ketik nama jalan/area besar dulu, misal &quot;Jalan Pandanaran&quot; — nomor rumah &amp;
          blok diisi manual di bawah.
        </p>
      </div>

      {showDetailFields && (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Detail Alamat
            </label>
            <textarea
              value={value.detail}
              onChange={(e) => updateField("detail", e.target.value)}
              rows={2}
              placeholder="Nama jalan, nomor rumah, blok/kompleks, RT/RW"
              className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Patokan <span className="font-normal text-gray-400">(opsional, buat kurir)</span>
            </label>
            <input
              type="text"
              autoComplete="off"
              value={value.landmark}
              onChange={(e) => updateField("landmark", e.target.value)}
              placeholder="Contoh: sebelah minimarket, pagar hijau"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          {value.fullAddress && (
            <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
              <p className="mb-0.5 text-xs font-medium text-gray-500">Alamat lengkap</p>
              {value.fullAddress}
              {value.landmark && ` (Patokan: ${value.landmark})`}
            </div>
          )}
        </>
      )}
    </div>
  );
}