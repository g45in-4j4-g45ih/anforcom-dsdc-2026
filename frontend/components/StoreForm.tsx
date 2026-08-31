"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Store } from "lucide-react";
import AddressForm, { AddressValue, EMPTY_ADDRESS } from "./AddressForm";
import { createLocation, createStore, StoreDetail, updateStore } from "@/lib/api";

interface StoreFormProps {
  mode: "create" | "edit";
  initialStore?: StoreDetail;
}

export default function StoreForm({ mode, initialStore }: StoreFormProps) {
  const router = useRouter();
  const [namaToko, setNamaToko] = useState(initialStore?.nama_toko ?? "");
  const [kontakWa, setKontakWa] = useState(initialStore?.kontak_wa ?? "");
  const [description, setDescription] = useState(initialStore?.description ?? "");
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setLogoError(null);
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setLogoError("Ukuran logo maksimal 5MB.");
      e.target.value = "";
      return;
    }
    setLogo(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!namaToko.trim() || !kontakWa.trim()) {
      setError("Nama toko dan kontak WhatsApp wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: ganti dengan token auth beneran dari context/session
      const token = localStorage.getItem("auth_token") ?? "";

      let locationId: number | null = null;
      if (address.fullAddress) {
        const location = await createLocation(
          { alamat: address.fullAddress, latitude: address.areaLat, longitude: address.areaLng },
          token
        );
        locationId = location.id;
      }

      const fd = new FormData();
      fd.append("nama_toko", namaToko);
      fd.append("kontak_wa", kontakWa);
      fd.append("description", description);
      if (locationId) fd.append("lokasi", String(locationId));
      if (logo) fd.append("logo", logo);

      const store =
        mode === "create"
          ? await createStore(fd, token)
          : await updateStore(initialStore!.id, fd, token);

      router.push(`/store/${store.owner}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft/40 text-primary">
          <Store className="h-4 w-4" aria-hidden="true" />
        </span>
        {mode === "create" ? "Buka Toko Baru" : "Edit Profil Toko"}
      </h1>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Nama Toko</label>
        <input
          type="text"
          autoComplete="off"
          value={namaToko}
          onChange={(e) => setNamaToko(e.target.value)}
          placeholder="Contoh: Toko Berkah"
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary-light/30"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Nomor WhatsApp</label>
        <input
          type="text"
          autoComplete="off"
          value={kontakWa}
          onChange={(e) => setKontakWa(e.target.value)}
          placeholder="08xxxxxxxxxx"
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary-light/30"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Deskripsi</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Ceritakan toko kamu jual apa aja..."
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary-light/30"
        />
      </div>

      {mode === "edit" && initialStore?.lokasi_detail?.alamat && (
        <p className="text-xs text-gray-400">
          Lokasi saat ini: {initialStore.lokasi_detail.alamat} — pilih lokasi baru di bawah kalau mau ganti.
        </p>
      )}
      <AddressForm value={address} onChange={setAddress} />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Logo Toko (opsional)</label>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl border border-dashed border-secondary-light px-3 py-2.5 text-sm text-secondary transition hover:bg-secondary-light/10"
        >
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          {logo ? logo.name : "Pilih file logo"}
        </button>
        {logoError && <p className="mt-1 text-xs text-red-600">{logoError}</p>}
      </div>

      {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-50"
      >
        {isSubmitting ? "Menyimpan..." : mode === "create" ? "Buka Toko" : "Simpan Perubahan"}
      </button>
    </form>
  );
}
