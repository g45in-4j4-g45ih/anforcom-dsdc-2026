import { ItemListing } from "@/lib/api";
import { toWaLink } from "@/lib/whatsapp";

interface ListingCardProps {
  item: ItemListing;
}

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default function ListingCard({ item }: ListingCardProps) {
  const thumbnail = item.images[0]?.image;
  const isDonasi = item.listing_type === "donasi";
  const waLink = toWaLink(
    item.store_detail?.kontak_wa ?? "",
    `Halo, saya tertarik dengan "${item.name}" di ${item.store_detail?.nama_toko ?? "toko kamu"}.`
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex h-36 items-center justify-center bg-gray-50 text-sm text-gray-400">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          "Belum ada foto"
        )}
      </div>

      <div className="space-y-1.5 p-3">
        <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>

        {item.condition === "layak_makan" ? (
          isDonasi ? (
            <span className="inline-block rounded-full bg-secondary-light/40 px-2 py-0.5 text-xs font-medium text-secondary">
              Donasi
            </span>
          ) : (
            <div className="flex items-baseline gap-1.5">
              {item.price_original && item.price_original !== item.price_sale && (
                <span className="text-xs text-gray-400 line-through">{rupiah.format(item.price_original)}</span>
              )}
              <span className="text-sm font-semibold text-primary">
                {item.price_sale ? rupiah.format(item.price_sale) : "-"}
              </span>
            </div>
          )
        ) : (
          <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            Byproduct
          </span>
        )}

        <p className="text-xs text-gray-400">
          Sisa {item.quantity_remaining} {item.unit}
        </p>

        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block rounded-full bg-gray-900 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-gray-800"
          >
            Hubungi via WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
