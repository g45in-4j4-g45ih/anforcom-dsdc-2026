import ListingGrid from "@/components/listing/ListingGrid";

export default function ListingDiskonPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <ListingGrid
        listingType="diskon"
        title="Jual Diskon"
        emptyMessage="Belum ada listing diskon saat ini."
      />
    </main>
  );
}
