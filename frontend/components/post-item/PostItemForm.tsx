"use client";

import { useRef, useState } from "react";
import { createItem } from "@/lib/api";
import RichTextEditor from "./RichTextEditor";
import TimeDropdown from "../shared/TimeDropdown";
import SelectField from "./SelectField";

type Condition = "layak_makan" | "byproduct";

const UNIT_OPTIONS = ["kg", "liter", "pcs", "bungkus", "porsi"];

const CATEGORY_OPTIONS: Record<Condition, string[]> = {
  layak_makan: ["Makanan Siap Saji", "Bahan Mentah", "Roti & Kue", "Buah & Sayur", "Lainnya"],
  byproduct: ["Kulit Bawang", "Ampas Kopi", "Jelantah", "Cangkang Telur", "Lainnya"],
};

type ListingType = "diskon" | "donasi" | "";

interface FormState {
  name: string;
  condition: Condition;
  listingType: ListingType;
  quantity: string;
  unit: string;
  description: string;
  category: string;
  pickupStart: string;
  pickupEnd: string;
  priceOriginal: string;
  priceSale: string;
  bestBefore: string;
}

const INITIAL_STATE: FormState = {
  name: "",
  condition: "layak_makan",
  listingType: "",
  quantity: "",
  unit: "kg",
  description: "",
  category: "",
  pickupStart: "10:00",
  pickupEnd: "22:30",
  priceOriginal: "",
  priceSale: "",
  bestBefore: "",
};

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-md shadow-gray-200/60">
      {children}
    </div>
  );
}

export default function PostItemForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [images, setImages] = useState<File[]>([]);
  const [mainIndex, setMainIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} lebih dari 5MB, coba kompres dulu.`);
        return false;
      }
      return true;
    });
    setImages((prev) => {
      const next = [...prev, ...validFiles].slice(0, 5);
      setMainIndex(prev.length); // foto baru langsung jadi preview utama
      return next;
    });
    e.target.value = "";
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setMainIndex((prev) => (prev >= idx && prev > 0 ? prev - 1 : prev));
  }

  async function handleSubmit(e: React.FormEvent, asDraft: boolean) {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.quantity) {
      setError("Lengkapi dulu nama item dan jumlahnya ya.");
      return;
    }

    if (isMakanan && !form.listingType) {
      setError("Pilih dulu mau Jual Diskon atau Donasi.");
      return;
    }

    if (isMakanan && form.listingType === "diskon" && !form.priceSale) {
      setError("Harga jual wajib diisi untuk listing jual diskon.");
      return;
    }

    if (
      isMakanan &&
      form.priceOriginal &&
      form.priceSale &&
      Number(form.priceSale) > Number(form.priceOriginal)
    ) {
      setError("Harga jual nggak boleh lebih tinggi dari harga asli.");
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("condition", form.condition);
      if (isMakanan && form.listingType) fd.append("listing_type", form.listingType);
      fd.append("quantity_total", form.quantity);
      fd.append("unit", form.unit);
      fd.append("description", form.description);
      fd.append("category", form.category);
      fd.append("pickup_start", form.pickupStart);
      fd.append("pickup_end", form.pickupEnd);
      if (form.priceOriginal) fd.append("price_original", form.priceOriginal);
      if (form.priceSale) fd.append("price_sale", form.priceSale);
      if (form.bestBefore) fd.append("best_before", form.bestBefore);
      images.forEach((file) => fd.append("uploaded_images", file));

      // TODO: ganti dengan token auth beneran dari context/session
      const token = localStorage.getItem("auth_token") ?? "";
      await createItem(fd, token);

      setForm(INITIAL_STATE);
      setImages([]);
      setMainIndex(0);
      alert(asDraft ? "Draf tersimpan." : "Item berhasil ditambahkan!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isMakanan = form.condition === "layak_makan";

  return (
    <form className="mx-auto max-w-5xl space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-light/20">
            <img src="/icons/shop.svg" alt="" className="h-4 w-4" />
          </span>
          <h1 className="text-lg font-semibold text-foreground">Tambah Item Baru</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, true)}
            className="rounded-full border border-secondary px-4 py-2 text-sm font-medium text-secondary hover:bg-secondary-light/10 disabled:opacity-50"
          >
            <img src="/icons/save-draft.svg" alt="" className="mr-1.5 inline h-4 w-4" />
            Simpan Draf
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, false)}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:opacity-50"
          >
            <img src="/icons/add-item.svg" alt="" className="mr-1.5 inline h-4 w-4" />
            Tambah Item
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* ===== Kolom kiri — semua detail teks ===== */}
        <SectionCard>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nama Item</label>
              <input
                type="text"
                autoComplete="off"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Contoh: Nasi Bungkus Ayam"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Kondisi</label>
              <SelectField
                value={form.condition}
                onChange={(v) => {
                  updateField("condition", v as Condition);
                  updateField("category", "");
                  updateField("listingType", "");
                }}
                options={[
                  { label: "Masih Layak Dimakan", value: "layak_makan" },
                  { label: "Byproduct", value: "byproduct" },
                ]}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
              <SelectField
                value={form.category}
                onChange={(v) => updateField("category", v)}
                options={CATEGORY_OPTIONS[form.condition]}
                placeholder="Pilih kategori"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Jumlah</label>
                <input
                  type="number"
                  min={0}
                  autoComplete="off"
                  value={form.quantity}
                  onChange={(e) => updateField("quantity", e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Satuan</label>
                <SelectField value={form.unit} onChange={(v) => updateField("unit", v)} options={UNIT_OPTIONS} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Jam Ambil</label>
                <TimeDropdown value={form.pickupStart} onChange={(t) => updateField("pickupStart", t)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 opacity-0">sampai</label>
                <TimeDropdown value={form.pickupEnd} onChange={(t) => updateField("pickupEnd", t)} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Deskripsi</label>
              <RichTextEditor
                value={form.description}
                onChange={(html) => updateField("description", html)}
              />
            </div>
          </div>
        </SectionCard>

        {/* ===== Kolom kanan — visual & harga ===== */}
        <SectionCard>
          <div className="space-y-4">
            <div className="flex h-72 items-center justify-center overflow-hidden rounded-xl bg-gray-50 text-sm text-gray-400">
              {images[mainIndex] ? (
                <img
                  src={URL.createObjectURL(images[mainIndex])}
                  alt="Preview item"
                  className="h-full w-full object-cover"
                />
              ) : (
                "Belum ada foto"
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageAdd}
              className="hidden"
            />
            <div className="flex gap-2">
              {images.map((file, idx) => (
                <div key={idx} className="group relative h-14 w-14 shrink-0">
                  <img
                    src={URL.createObjectURL(file)}
                    onClick={() => setMainIndex(idx)}
                    alt={`Foto ${idx + 1}`}
                    className={`h-full w-full cursor-pointer rounded-xl border-2 object-cover ${
                      idx === mainIndex ? "border-primary" : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] text-white group-hover:flex"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-secondary-light text-secondary hover:bg-secondary-light/10"
                >
                  +
                </button>
              )}
            </div>

            {isMakanan ? (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Jenis Listing</label>
                  <SelectField
                    value={form.listingType}
                    onChange={(v) => updateField("listingType", v as ListingType)}
                    options={[
                      { label: "Jual Diskon", value: "diskon" },
                      { label: "Donasi", value: "donasi" },
                    ]}
                    placeholder="Pilih Jual Diskon atau Donasi"
                  />
                </div>

                {form.listingType === "diskon" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Harga Asli</label>
                      <div className="flex items-center rounded-xl border border-gray-300 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary">
                        <span className="pl-3 text-sm text-gray-500">Rp</span>
                        <input
                          type="number"
                          min={0}
                          autoComplete="off"
                          value={form.priceOriginal}
                          onChange={(e) => updateField("priceOriginal", e.target.value)}
                          placeholder="12000"
                          className="w-full rounded-xl px-2 py-2 text-sm text-gray-900 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Harga Jual</label>
                      <div className="flex items-center rounded-xl border border-gray-300 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary">
                        <span className="pl-3 text-sm text-gray-500">Rp</span>
                        <input
                          type="number"
                          min={0}
                          autoComplete="off"
                          value={form.priceSale}
                          onChange={(e) => updateField("priceSale", e.target.value)}
                          placeholder="7000"
                          className="w-full rounded-xl px-2 py-2 text-sm text-gray-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {form.listingType === "donasi" && (
                  <div className="rounded-xl border border-dashed border-secondary-light bg-secondary-light/5 px-3 py-6 text-center text-sm text-secondary">
                    Item donasi dikasih gratis ke penerima — nggak perlu isi harga.
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Baik Dikonsumsi Sebelum
                  </label>
                  <input
                    type="date"
                    value={form.bestBefore}
                    onChange={(e) => updateField("bestBefore", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-secondary-light bg-secondary-light/5 px-3 py-6 text-center text-sm text-secondary">
                Item byproduct nggak perlu harga — langsung bisa diambil komunitas/hobbyist.
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </form>
  );
}