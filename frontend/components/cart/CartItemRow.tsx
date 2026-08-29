"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItemResponse } from "@/lib/api";

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

interface CartItemRowProps {
  entry: CartItemResponse;
  isSelected: boolean;
  onToggleSelect: (cartItemId: number) => void;
  onQuantityChange: (cartItemId: number, quantity: number) => void;
  onRemove: (cartItemId: number) => void;
  isUpdating: boolean;
}

export default function CartItemRow({
  entry,
  isSelected,
  onToggleSelect,
  onQuantityChange,
  onRemove,
  isUpdating,
}: CartItemRowProps) {
  const quantity = Number(entry.quantity);
  const stock = Number(entry.item_stock);
  const subtotal = entry.item_price * quantity;

  return (
    <div className="flex items-center gap-3 border-b border-gray-100 py-3 last:border-b-0">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggleSelect(entry.id)}
        className="h-4 w-4 shrink-0 rounded border-gray-300 text-secondary focus:ring-secondary"
      />

      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-50">
        {entry.item_image ? (
          <img src={entry.item_image} alt={entry.item_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
            Tanpa foto
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-gray-900">{entry.item_name}</p>
        {entry.item_price > 0 ? (
          <p className="text-xs text-gray-500 sm:text-sm">{formatRupiah(entry.item_price)}</p>
        ) : (
          <p className="text-xs font-medium text-secondary sm:text-sm">Gratis</p>
        )}

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={isUpdating || quantity <= 1}
            onClick={() => onQuantityChange(entry.id, quantity - 1)}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-secondary-light disabled:opacity-40"
          >
            <Minus className="h-3 w-3" aria-hidden="true" />
          </button>
          <span className="w-5 text-center text-sm font-bold text-gray-900">{quantity}</span>
          <button
            type="button"
            disabled={isUpdating || quantity >= stock}
            onClick={() => onQuantityChange(entry.id, quantity + 1)}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-secondary-light disabled:opacity-40"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
          </button>
          <span className="ml-1 text-[10px] text-gray-400 sm:text-xs">
            {stock} {entry.item_unit} tersedia
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        {entry.item_price > 0 && (
          <p className="text-sm font-bold text-gray-900">{formatRupiah(subtotal)}</p>
        )}
        <button
          type="button"
          onClick={() => onRemove(entry.id)}
          className="flex items-center gap-1 text-xs text-red-500 transition hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Hapus
        </button>
      </div>
    </div>
  );
}