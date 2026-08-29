"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, MessageCircle, Store as StoreIcon } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/navigation/Navbar";
import AddressForm, { EMPTY_ADDRESS, type AddressValue } from "@/components/AddressForm";
import StepIndicator from "./StepIndicator";
import { toAbsoluteMediaUrl } from "@/lib/api";

import {
  StoreDetail,
  CartGroup,
  KlaimResponse,
  ItemApiResponse,
  fetchStoreById,
  fetchCart,
  getItem,
  checkoutSingleItem,
  cartCheckout,
  markKlaimPaid,
} from "@/lib/api";

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface NormalizedItem {
  id: number;
  item: number;
  item_name: string;
  item_image: string | null;
  item_unit: string;
  item_price: number;
  quantity: string;
  pickup_start?: string;
  pickup_end?: string;
}

function generateTimeSlots(startStr?: string, endStr?: string) {
  if (!startStr || !endStr) return [];

  const [startH, startM] = startStr.split(":").map(Number);
  const [endH, endM] = endStr.split(":").map(Number);

  let startMinutes = startH * 60 + (startM || 0);
  let endMinutes = endH * 60 + (endM || 0);

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const slots: string[] = [];
  for (let mins = startMinutes; mins <= endMinutes; mins += 30) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }

  return slots;
}

function calculateOngkir(distanceKm: number): number {
  const cost = 4000 + distanceKm * 2500;
  return Math.max(9000, Math.round(cost / 500) * 500);
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-md shadow-gray-200/60">
      {children}
    </div>
  );
}

const STEPS = [{ label: "Pengiriman" }, { label: "Pembayaran" }, { label: "Konfirmasi" }];

interface CheckoutPageProps {
  storeId: number;
  selectedItemIds?: number[];
  directItem?: { itemId: number; quantity: number };
}

const EMPTY_SELECTED_ITEM_IDS: number[] = [];

export default function CheckoutPage({
  storeId,
  selectedItemIds = EMPTY_SELECTED_ITEM_IDS,
  directItem,
}: CheckoutPageProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [cartGroup, setCartGroup] = useState<CartGroup | null>(null);
  const [directItemData, setDirectItemData] = useState<ItemApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pickupMethod, setPickupMethod] = useState<"Self Pickup" | "Ojek">("Self Pickup");
  const [pickupTime, setPickupTime] = useState("");
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<KlaimResponse[] | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") ?? "" : "";
  const buyerName =
    (typeof window !== "undefined" && localStorage.getItem("auth_username")) || "Pembeli";

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      if (directItem) {
        const [storeData, itemData] = await Promise.all([
          fetchStoreById(storeId),
          getItem(directItem.itemId),
        ]);
        setStore(storeData);
        setDirectItemData(itemData);
      } else {
        const [storeData, cartData] = await Promise.all([fetchStoreById(storeId), fetchCart(token)]);
        setStore(storeData);
        const group = cartData.find((g) => g.store_id === storeId) ?? null;
        if (group) {
          group.items = group.items.filter((entry) => selectedItemIds.includes(entry.id));
        }
        setCartGroup(group);
      }
      setIsLoading(false);
    }
    load();
  }, [storeId, token, selectedItemIds.join(","), directItem?.itemId, directItem?.quantity]);

  const items: NormalizedItem[] = useMemo(() => {
    if (directItem && directItemData) {
      const anyData = directItemData as Record<string, any>;
      return [
        {
          id: directItemData.id,
          item: directItemData.id,
          item_name: directItemData.name,
          item_image: directItemData.images[0]?.image ?? null,
          item_unit: directItemData.unit,
          item_price: directItemData.listing_type === "diskon" ? directItemData.price_sale ?? 0 : 0,
          quantity: String(directItem.quantity),
          pickup_start: anyData.pickup_start ?? anyData.pickup_time_start,
          pickup_end: anyData.pickup_end ?? anyData.pickup_time_end,
        },
      ];
    }
    return (cartGroup?.items ?? []).map((entry) => {
      const anyEntry = entry as Record<string, any>;
      return {
        id: entry.id,
        item: entry.item,
        item_name: entry.item_name,
        item_image: entry.item_image,
        item_unit: entry.item_unit,
        item_price: entry.item_price,
        quantity: entry.quantity,
        pickup_start: anyEntry.pickup_start ?? anyEntry.pickup_time_start,
        pickup_end: anyEntry.pickup_end ?? anyEntry.pickup_time_end,
      };
    });
  }, [directItem, directItemData, cartGroup]);

  const availableTimeSlots = useMemo(() => {
    if (items.length === 0) return [];
    const start = items[0].pickup_start || "08:00";
    const end = items[0].pickup_end || "20:00";
    return generateTimeSlots(start, end);
  }, [items]);

  useEffect(() => {
    if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(pickupTime)) {
      setPickupTime(availableTimeSlots[0]);
    }
  }, [availableTimeSlots, pickupTime]);

  const storeName = directItem ? store?.nama_toko : cartGroup?.store_name;

  // 1. Hitung subtotal barang dulu
  const subtotal = useMemo(
    () => items.reduce((sum, entry) => sum + entry.item_price * Number(entry.quantity), 0),
    [items]
  );
  
  // HAPUS isFreeOrder YANG LAMA DI SINI JIKA MASIH ADA!

  // 2. Hitung jarak
  const distanceKm = useMemo(() => {
    const storeLat = store?.lokasi_detail?.latitude;
    const storeLng = store?.lokasi_detail?.longitude;
    if (!storeLat || !storeLng || address.areaLat == null || address.areaLng == null) return null;
    return haversineKm(parseFloat(storeLat), parseFloat(storeLng), address.areaLat, address.areaLng);
  }, [store, address]);

  // 3. Hitung ongkir
  const shippingCost = useMemo(() => {
    if (pickupMethod !== "Ojek" || distanceKm === null) return 0;
    return calculateOngkir(distanceKm);
  }, [pickupMethod, distanceKm]);

  // 4. Hitung total keseluruhan
  const total = subtotal + shippingCost;

  // 5. DEKLARASI isFreeOrder BARU DI SINI (patokannya total, bukan subtotal)
  const isFreeOrder = total === 0;
  
  function goToStep(step: number) {
    setCurrentStep(step);
  }

  function handleNextFromStep1() {
    if (pickupMethod === "Self Pickup" && !pickupTime) {
      toast.error("Pilih jam ambil dulu ya.");
      return;
    }
    if (pickupMethod === "Ojek" && !address.fullAddress) {
      toast.error("Lengkapi alamat pengiriman dulu ya.");
      return;
    }
    setCurrentStep(isFreeOrder ? 3 : 2);
  }

  async function handleSubmitOrder() {
    if (items.length === 0) return;
    setIsSubmitting(true);

    const payload = {
      pickup_method: pickupMethod,
      pickup_time: pickupMethod === "Self Pickup" ? pickupTime : undefined,
      address_text: pickupMethod === "Ojek" ? address.fullAddress : undefined,
      address_lat: pickupMethod === "Ojek" ? address.areaLat ?? undefined : undefined,
      address_lng: pickupMethod === "Ojek" ? address.areaLng ?? undefined : undefined,
      shipping_cost: shippingCost,
      notes,
    };

    try {
      let klaimResult: KlaimResponse[];
      if (directItem) {
        const single = await checkoutSingleItem(directItem.itemId, directItem.quantity, payload, token);
        klaimResult = [single];
      } else if (items.length === 1) {
        const single = await checkoutSingleItem(items[0].item, Number(items[0].quantity), payload, token);
        klaimResult = [single];
      } else {
        klaimResult = await cartCheckout(storeId, items.map((entry) => entry.id), payload, token);
      }
      setResult(klaimResult);
      toast.success("Pesanan berhasil dibuat!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat pesanan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMarkPaid(klaimId: number) {
    try {
      await markKlaimPaid(klaimId, token);
      setResult((prev) =>
        prev ? prev.map((k) => (k.id === klaimId ? { ...k, status: "Dibayar" } : k)) : prev
      );
      toast.success("Terima kasih, pembayaran dikonfirmasi!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal konfirmasi.");
    }
  }

  function handleWhatsApp() {
    if (!store) return;
    const message = `Halo ${store.nama_toko}, saya baru saja checkout. Boleh koordinasi detail pengambilan?`;
    window.open(
      `https://wa.me/${store.kontak_wa.replace(/^0/, "62")}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f6f1]">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm text-gray-400">Memuat checkout...</p>
        </main>
      </div>
    );
  }

  if (items.length === 0 && !result) {
    return (
      <div className="min-h-screen bg-[#f8f6f1]">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <SectionCard>
            <p className="text-sm text-gray-500">Nggak ada item yang dipilih buat checkout.</p>
            <button
              onClick={() => router.push("/cart")}
              className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"
            >
              Kembali ke Keranjang
            </button>
          </SectionCard>
        </main>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-[#f8f6f1]">
        <Navbar />
        <main className="mx-auto max-w-2xl space-y-4 px-4 py-10">
          <SectionCard>
            <h1 className="text-lg font-bold text-gray-900">Pesanan Berhasil Dibuat!</h1>
            <p className="mt-1 text-sm text-gray-500">
              {isFreeOrder
                ? "Pesanan gratis kamu udah tercatat. Yuk koordinasi jadwal ambil via WhatsApp."
                : "Selesaikan pembayaran, lalu koordinasi jadwal ambil via WhatsApp."}
            </p>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Koordinasi Pengambilan</p>
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary/90"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Chat via WhatsApp
              </button>
            </div>
          </SectionCard>

          {!isFreeOrder && result.some((k) => k.status === "Menunggu Pembayaran") && (
            <SectionCard>
              <p className="mb-3 text-sm font-semibold text-gray-900">Pembayaran QRIS</p>
              {store?.qris_image ? (
                <img
                  src={toAbsoluteMediaUrl(entry.item_image)}
                  alt="QRIS"
                  className="mx-auto h-56 w-56 rounded-xl border border-gray-100 object-contain"
                />
              ) : (
                <p className="text-sm text-gray-400">QRIS toko belum tersedia.</p>
              )}
              <p className="mt-3 text-center text-lg font-bold text-gray-900">
                {formatRupiah(total)}
              </p>
              {result
                .filter((k) => k.status === "Menunggu Pembayaran")
                .map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => handleMarkPaid(k.id)}
                    className="mt-3 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
                  >
                    Saya Sudah Bayar
                  </button>
                ))}
            </SectionCard>
          )}

          <button
            type="button"
            onClick={() => router.push("/items")}
            className="w-full rounded-full border border-secondary py-2.5 text-sm font-semibold text-secondary hover:bg-secondary-light/10"
          >
            Kembali Jelajah
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => (currentStep > 1 ? goToStep(currentStep - 1) : router.back())}
            className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:border-secondary-light"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali
          </button>
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {currentStep === 1 && (
              <SectionCard>
                <h2 className="mb-4 font-bold text-gray-900">Metode Pengambilan</h2>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPickupMethod("Self Pickup")}
                    className={`rounded-full border py-3 text-sm font-medium transition ${
                      pickupMethod === "Self Pickup"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    Ambil Sendiri
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickupMethod("Ojek")}
                    className={`rounded-full border py-3 text-sm font-medium transition ${
                      pickupMethod === "Ojek"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    Kirim via Ojek Online
                  </button>
                </div>

                {pickupMethod === "Self Pickup" ? (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                      {store?.lokasi_detail?.alamat ?? "Alamat toko belum tersedia"}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Jam Ambil</label>
                      <select
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                      >
                        {availableTimeSlots.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Alamat Tujuan Pengiriman
                    </label>
                    <AddressForm value={address} onChange={setAddress} />

                    {distanceKm !== null ? (
                      <div className="rounded-xl bg-secondary-light/10 p-3 text-sm text-secondary">
                        Jarak dari toko: {distanceKm.toFixed(1)} km — Ongkir:{" "}
                        <span className="font-semibold">{formatRupiah(shippingCost)}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Pilih area dulu buat liat estimasi ongkir.</p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="mt-5 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
                >
                  Lanjut
                </button>
              </SectionCard>
            )}

            {currentStep === 2 && !isFreeOrder && (
              <SectionCard>
                <h2 className="mb-4 font-bold text-gray-900">Pembayaran</h2>
                <div className="rounded-xl border border-dashed border-secondary-light bg-secondary-light/5 p-4 text-center text-sm text-secondary">
                  Pembayaran dilakukan via QRIS langsung ke penjual. QRIS akan ditampilkan setelah
                  pesanan dikonfirmasi.
                </div>
                <p className="mt-4 text-center text-lg font-bold text-gray-900">
                  Total: {formatRupiah(total)}
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="mt-5 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
                >
                  Lanjut
                </button>
              </SectionCard>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <SectionCard>
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-900">Pengiriman</h2>
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="text-sm font-medium text-secondary hover:underline"
                    >
                      Ubah
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {pickupMethod === "Self Pickup"
                      ? `Ambil Sendiri — jam ${pickupTime}`
                      : `Kirim via Ojek — ${address.fullAddress}`}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">Atas nama: {buyerName}</p>
                </SectionCard>

                {!isFreeOrder && (
                  <SectionCard>
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-gray-900">Pembayaran</h2>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">QRIS</p>
                  </SectionCard>
                )}

                <SectionCard>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Catatan buat Penjual (opsional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Contoh: tolong dibungkus rapi ya"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </SectionCard>
              </div>
            )}
          </div>

          <div>
            <SectionCard>
              <div className="mb-3 flex items-center gap-2">
                <StoreIcon className="h-4 w-4 text-secondary" aria-hidden="true" />
                <p className="text-sm font-bold text-gray-900">{storeName}</p>
              </div>

              <div className="space-y-3">
                {items.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                      {entry.item_image ? (
                        <img
                          src={toAbsoluteMediaUrl(entry.item_image)}
                          alt={entry.item_name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{entry.item_name}</p>
                      <p className="text-xs text-gray-500">
                        {entry.quantity} {entry.item_unit}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {entry.item_price > 0
                        ? formatRupiah(entry.item_price * Number(entry.quantity))
                        : "Gratis"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                {shippingCost > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Ongkir</span>
                    <span>{formatRupiah(shippingCost)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 text-base font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatRupiah(total)}</span>
                </div>
              </div>

              {currentStep === 3 && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitOrder}
                  className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-50"
                >
                  {isSubmitting ? "Memproses..." : "Buat Pesanan"}
                </button>
              )}
            </SectionCard>
          </div>
        </div>
      </main>
    </div>
  );
}