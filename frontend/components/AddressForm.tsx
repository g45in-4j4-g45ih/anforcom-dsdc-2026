"use client";

import { useState } from "react";
import LocationAutocomplete from "./LocationAutocomplete";

export interface AddressValue {
  areaText: string;
  areaLat: number | null;
  areaLng: number | null;
  detail: string;
  landmark: string;
  fullAddress: string;
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
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Cari Area (jalan / kelurahan / kecamatan)
        </label>
        <LocationAutocomplete
          value={value.areaText}
          placeholder=''
          onSelect={({ text, lat, lng }) => {
            const next = { ...value, areaText: text, areaLat: lat, areaLng: lng };
            next.fullAddress = buildFullAddress(next.detail, next.areaText);
            onChange(next);
            setShowDetailFields(true);
          }}
        />
        <p className="mt-1.5 text-xs text-gray-400">
          Nomor rumah &amp; blok diisi manual di bawah setelah area dipilih.
        </p>
      </div>

      {showDetailFields && (
        <>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Detail Alamat</label>
            <textarea
              value={value.detail}
              onChange={(e) => updateField("detail", e.target.value)}
              rows={2}
              placeholder="Nama jalan, nomor rumah, blok/kompleks, RT/RW"
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Patokan <span className="font-normal text-gray-400">(opsional, buat kurir)</span>
            </label>
            <input
              type="text"
              autoComplete="off"
              value={value.landmark}
              onChange={(e) => updateField("landmark", e.target.value)}
              placeholder="Contoh: sebelah minimarket, pagar hijau"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </div>

          {value.fullAddress && (
            <div className="rounded-xl border border-secondary-light/30 bg-secondary-light/10 p-3 text-sm text-gray-700">
              <p className="mb-0.5 text-xs font-medium text-secondary">Alamat lengkap</p>
              {value.fullAddress}
              {value.landmark && ` (Patokan: ${value.landmark})`}
            </div>
          )}
        </>
      )}
    </div>
  );
}