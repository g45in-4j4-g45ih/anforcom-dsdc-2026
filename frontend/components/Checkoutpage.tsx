"use client";

import { useState } from "react";
import LocationAutocomplete from "./LocationAutocomplete";
import AddressForm, { EMPTY_ADDRESS, type AddressValue } from "./AddressForm";
import TimeDropdown from "./shared/TimeDropdown";

export interface CheckoutOrderItem {
  id: number;
  name: string;
  image?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number; // 0 kalau donasi
}

export interface CheckoutStoreInfo {
  name: string;
  addressText: string; // lokasi toko, buat opsi self-pickup
  latitude: number; // dipakai buat hitung estimasi ongkir
  longitude: number;
  pickupStart: string;
  pickupEnd: string;
}

type DeliveryMethod = "pickup" | "courier";
type PaymentMethod = "transfer" | "qris";

interface CheckoutPageProps {
  order: CheckoutOrderItem;
  store: CheckoutStoreInfo;
  onConfirm: (payload: {
    deliveryMethod: DeliveryMethod;
    address: string;
    pickupTime: string;
    notes: string;
    paymentMethod: PaymentMethod;
    shippingCost: number;
  }) => void;
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

// Hitung jarak garis lurus antar 2 koordinat (km) pakai formula Haversine
function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimasi ongkir sederhana: tarif dasar + per km. Ini formula mock buat MVP,
// bukan tarif resmi GoSend/GrabExpress — cukup buat kasih gambaran biaya ke pembeli.
function estimateShippingCost(distanceKm: number) {
  const BASE_FARE = 4000;
  const PER_KM_RATE = 2500;
  const MIN_FARE = 9000;
  const estimate = BASE_FARE + distanceKm * PER_KM_RATE;
  return Math.max(MIN_FARE, Math.round(estimate / 500) * 500); // dibulatin ke kelipatan 500
}

export default function CheckoutPage({ order, store, onConfirm }: CheckoutPageProps) {
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("pickup");
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [pickupTime, setPickupTime] = useState(store.pickupStart);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = order.pricePerUnit * order.quantity;
  const isFree = order.pricePerUnit === 0;

  const distanceKm =
    deliveryMethod === "courier" && address.areaLat != null && address.areaLng != null
      ? calculateDistanceKm(store.latitude, store.longitude, address.areaLat, address.areaLng)
      : null;
  const shippingCost = distanceKm != null ? estimateShippingCost(distanceKm) : 0;
  const total = subtotal + shippingCost;

  function handleSubmit() {
    setError(null);

    if (deliveryMethod === "courier" && !address.fullAddress) {
      setError("Lengkapi dulu alamat pengantaran ya.");
      return;
    }
    if (deliveryMethod === "pickup" && !pickupTime) {
      setError("Pilih dulu jam pengambilan.");
      return;
    }

    setIsSubmitting(true);
    onConfirm({
      deliveryMethod,
      address: address.fullAddress,
      pickupTime,
      notes,
      paymentMethod,
      shippingCost,
    });
    setIsSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-gray-900">Checkout</h1>

      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {/* Ringkasan produk */}
      <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-200">
          {order.image && (
            <img src={order.image} alt={order.name} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{order.name}</p>
          <p className="text-xs text-gray-500">
            {order.quantity} {order.unit}
          </p>
        </div>
        <p className="shrink-0 text-sm font-semibold text-gray-900">
          {isFree ? "Gratis" : formatRupiah(subtotal)}
        </p>
      </div>

      {/* Metode pengambilan */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Metode Pengambilan</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDeliveryMethod("pickup")}
            className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium ${
              deliveryMethod === "pickup"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Ambil Sendiri
          </button>
          <button
            type="button"
            onClick={() => setDeliveryMethod("courier")}
            className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium ${
              deliveryMethod === "courier"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Kirim via Ojek Online
          </button>
        </div>
      </div>

      {/* Konten dinamis sesuai metode */}
      {deliveryMethod === "pickup" ? (
        <>
          <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
            <p className="font-medium text-gray-800">Lokasi pengambilan</p>
            <p>{store.addressText}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Jam Ambil</label>
            <TimeDropdown value={pickupTime} onChange={setPickupTime} />
            <p className="mt-1 text-xs text-gray-400">
              Toko buka {store.pickupStart} - {store.pickupEnd}
            </p>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Alamat Tujuan Pengiriman
            </label>
            <AddressForm value={address} onChange={setAddress} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="mb-1 text-xs font-medium text-gray-500">Dijemput dari</p>
            <p className="text-sm text-gray-800">{store.addressText}</p>
          </div>

          {distanceKm != null ? (
            <div className="flex items-center justify-between rounded-xl bg-blue-50 p-3 text-sm">
              <span className="text-blue-800">
                Estimasi jarak {distanceKm.toFixed(1)} km
              </span>
              <span className="font-semibold text-blue-900">{formatRupiah(shippingCost)}</span>
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              Pilih area dulu buat liat estimasi ongkir.
            </p>
          )}
        </>
      )}

      {/* Catatan */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Catatan untuk Penjual <span className="font-normal text-gray-400">(opsional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Contoh: titip di depan warung ya"
          className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      {/* Pembayaran */}
      {!isFree && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Pembayaran</label>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-3 py-2.5 text-sm has-[:checked]:border-gray-900">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "transfer"}
                onChange={() => setPaymentMethod("transfer")}
              />
              Transfer Bank
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-3 py-2.5 text-sm has-[:checked]:border-gray-900">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "qris"}
                onChange={() => setPaymentMethod("qris")}
              />
              QRIS
            </label>
          </div>

          {paymentMethod === "transfer" && (
            <div className="mt-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
              Nomor rekening & instruksi transfer akan muncul setelah pesanan dikonfirmasi.
            </div>
          )}
          {paymentMethod === "qris" && (
            <div className="mt-2 flex flex-col items-center gap-2 rounded-xl bg-gray-50 p-4">
              <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-xs text-gray-400">
                QRIS
              </div>
              <p className="text-center text-xs text-gray-500">
                Kode QRIS akan tampil di sini setelah pesanan dikonfirmasi.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ringkasan biaya */}
      <div className="space-y-1 rounded-xl bg-gray-50 p-3 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{isFree ? "Gratis" : formatRupiah(subtotal)}</span>
        </div>
        {deliveryMethod === "courier" && (
          <div className="flex justify-between text-gray-600">
            <span>Ongkos Kirim</span>
            <span>{shippingCost > 0 ? formatRupiah(shippingCost) : "-"}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-900">
          <span>Total</span>
          <span>{isFree ? "Gratis" : formatRupiah(total)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {isFree ? "Konfirmasi Ambil" : "Konfirmasi & Bayar"}
      </button>
    </div>
  );
}