import { ArrowUpRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import MaterialImage from "@/components/materials/MaterialImage";
import { ItemListing } from "@/lib/api";
import { toWaLink } from "@/lib/whatsapp";

interface ListingCardProps {
  item: ItemListing;
}

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

function formatQuantity(value: string) {
  const quantity = Number(value);
  if (Number.isNaN(quantity)) return value;
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(quantity);
}

export default function ListingCard({ item }: ListingCardProps) {
  const thumbnail = item.images[0]?.image;
  const isDonasi = item.listing_type === "donasi";
  const waLink = toWaLink(
    item.store_detail?.kontak_wa ?? "",
    `Halo, saya tertarik dengan "${item.name}" di ${item.store_detail?.nama_toko ?? "toko kamu"}.`
  );

  return (
    <div className="group min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary-soft hover:shadow-lg">
      <Link href={`/items/${item.id}`} aria-label={`Lihat detail ${item.name}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-50">
          <MaterialImage src={thumbnail} alt={item.name} />

          <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl border border-white/80 bg-white/95 text-primary shadow-sm transition group-hover:bg-primary group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>

        <div className="p-3 sm:p-4">
          {item.condition === "layak_makan" ? (
            isDonasi ? (
              <span className="inline-block rounded-full bg-secondary-light/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-secondary sm:text-xs">
                Donasi
              </span>
            ) : (
              <span className="inline-block rounded-full bg-primary-soft/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary sm:text-xs">
                Jual Diskon
              </span>
            )
          ) : (
            <span className="inline-block rounded-full bg-secondary-light/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-secondary sm:text-xs">
              Byproduct
            </span>
          )}

          <h2 className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-gray-900 sm:text-base">
            {item.name}
          </h2>

          {!isDonasi && item.condition === "layak_makan" && (
            <div className="mt-1.5 flex items-baseline gap-1.5">
              {item.price_original && item.price_original !== item.price_sale && (
                <span className="text-xs text-gray-400 line-through">
                  {rupiah.format(item.price_original)}
                </span>
              )}
              <span className="text-sm font-bold text-primary sm:text-base">
                {item.price_sale ? rupiah.format(item.price_sale) : "-"}
              </span>
            </div>
          )}

          <p className="mt-1.5 text-[10px] text-gray-500 sm:text-xs">
            Sisa{" "}
            <span className="font-bold text-gray-900">
              {formatQuantity(item.quantity_remaining)} {item.unit}
            </span>
          </p>
        </div>
      </Link>

      {waLink && (
        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-full bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Hubungi via WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
