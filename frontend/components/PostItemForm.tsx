"use client";

import { useRef, useState } from "react";
import { createItem } from "@/lib/api";
import RichTextEditor from "./RichTextEditor";
import TimeDropdown from "./TimeDropdown";
import SelectField from "./SelectField";

type Condition = "layak_makan" | "byproduct";

const UNIT_OPTIONS = ["kg", "liter", "pcs", "bungkus", "porsi"];

const CATEGORY_OPTIONS: Record<Condition, string[]> = {
  layak_makan: ["Makanan Siap Saji", "Bahan Mentah", "Roti & Kue", "Buah & Sayur", "Lainnya"],
  byproduct: ["Kulit Bawang", "Ampas Kopi", "Jelantah", "Cangkang Telur", "Lainnya"],
};

interface FormState {
  name: string;
  condition: Condition;
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

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("condition", form.condition);
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
    <form className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl">
            <img src="/icons/shop.svg" alt="" className="h-4 w-4" />
          </span>
          <h1 className="text-lg font-semibold text-gray-900">Tambah Item Baru</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, true)}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <img src="/icons/save-draft.svg" alt="" className="mr-1.5 inline h-4 w-4" />
            Simpan Draf
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, false)}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            <img src="/icons/add-item.svg" alt="" className="mr-1.5 inline h-4 w-4" />
            Tambah Item
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* ===== Kolom kiri — semua detail teks ===== */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nama Item</label>
            <input
              type="text"
              autoComplete="off"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Contoh: Nasi Bungkus Ayam"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Kondisi</label>
            <SelectField
              value={form.condition}
              onChange={(v) => {
                updateField("condition", v as Condition);
                updateField("category", "");
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
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
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

        {/* ===== Kolom kanan — visual & harga ===== */}
        <div className="space-y-4">
          <div className="flex h-72 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400">
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
                  className={`h-full w-full cursor-pointer rounded-xl border object-cover ${
                    idx === mainIndex ? "border-gray-900" : "border-gray-200"
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
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-400 hover:bg-gray-50"
              >
                +
              </button>
            )}
          </div>

          {isMakanan ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Harga Asli</label>
                  <div className="flex items-center rounded-xl border border-gray-300 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400">
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
                  <div className="flex items-center rounded-xl border border-gray-300 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400">
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

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Baik Dikonsumsi Sebelum
                </label>
                <input
                  type="date"
                  value={form.bestBefore}
                  onChange={(e) => updateField("bestBefore", e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-400">
              Item byproduct nggak perlu harga — langsung bisa diambil komunitas/hobbyist.
            </div>
          )}
        </div>
      </div>
    </form>
  );
}