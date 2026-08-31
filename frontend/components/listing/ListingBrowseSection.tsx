import { PackageOpen, TriangleAlert } from "lucide-react";
import ListingCard from "./ListingCard";
import { fetchListings, ItemListing } from "@/lib/api";

interface ListingBrowseSectionProps {
  listingType: "diskon" | "donasi";
  title: string;
  description: string;
  emptyMessage: string;
}

export default async function ListingBrowseSection({
  listingType,
  title,
  description,
  emptyMessage,
}: ListingBrowseSectionProps) {
  let listings: ItemListing[] = [];
  let errorMessage: string | null = null;

  try {
    listings = await fetchListings(listingType, "Tersedia");
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Listing belum dapat dimuat.";
  }

  return (
    <>
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      {!errorMessage && (
        <p className="mt-4 text-sm text-gray-500">
          {listings.length} listing ditemukan
        </p>
      )}

      {errorMessage ? (
        <div role="alert" className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <TriangleAlert className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-gray-900">Listing belum dapat dimuat</h2>
          <p className="mt-1 text-sm text-gray-600">{errorMessage}</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <PackageOpen className="mx-auto h-9 w-9 text-gray-400" aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-gray-900">Belum ada listing yang sesuai</h2>
          <p className="mt-1 text-sm text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((item) => (
            <ListingCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
