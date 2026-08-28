"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Store, TriangleAlert } from "lucide-react";
import {
  CartGroup,
  fetchCart,
  updateCartItemQuantity,
  removeCartItem,
} from "@/lib/api";
import CartItemRow from "./CartItemRow";
import Navbar from "@/components/navigation/Navbar";
function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export default function CartView() {
  const router = useRouter();
  const [groups, setGroups] = useState<CartGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") ?? "" : "";

  const load = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchCart(token);
    setGroups(data);
    setIsLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleQuantityChange(cartItemId: number, quantity: number) {
    setUpdatingId(cartItemId);
    setError(null);
    try {
      await updateCartItemQuantity(cartItemId, quantity, token);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah jumlah.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemove(cartItemId: number) {
    setUpdatingId(cartItemId);
    try {
      await removeCartItem(cartItemId, token);
      await load();
    } catch {
      setError("Gagal menghapus item.");
    } finally {
      setUpdatingId(null);
    }
  }

  function handleCheckout(storeId: number) {
    router.push(`/checkout/${storeId}`);
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
    <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-secondary" aria-hidden="true" />
          <h1 className="font-bold text-gray-900">Keranjang</h1>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600"
          >
            <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-400">Memuat keranjang...</p>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <ShoppingCart className="mx-auto h-9 w-9 text-gray-400" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-gray-900">Keranjangmu masih kosong</h2>
            <p className="mt-1 text-sm text-gray-500">
              Yuk mulai selamatkan makanan dan material di sekitarmu.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const subtotal = group.items.reduce(
                (sum, entry) => sum + entry.item_price * Number(entry.quantity),
                0
              );

              return (
                <div
                  key={group.store_id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/50 px-4 py-3">
                    <Store className="h-4 w-4 text-secondary" aria-hidden="true" />
                    <p className="text-sm font-bold text-gray-900">{group.store_name}</p>
                  </div>

                  <div className="px-4">
                    {group.items.map((entry) => (
                      <CartItemRow
                        key={entry.id}
                        entry={entry}
                        onQuantityChange={handleQuantityChange}
                        onRemove={handleRemove}
                        isUpdating={updatingId === entry.id}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      {subtotal > 0 && (
                        <p className="text-xs text-gray-500 sm:text-sm">
                          Subtotal: <span className="font-bold text-gray-900">{formatRupiah(subtotal)}</span>
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCheckout(group.store_id)}
                      className="rounded-xl bg-secondary px-5 py-2 text-sm font-semibold text-white transition hover:bg-secondary/90"
                    >
                      Checkout Toko Ini
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}