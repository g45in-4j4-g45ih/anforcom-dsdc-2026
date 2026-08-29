import ListingGrid from "@/components/listing/ListingGrid";

export default function ListingDonasiPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <ListingGrid
        listingType="donasi"
        title="Donasi"
        emptyMessage="Belum ada listing donasi saat ini."
      />
    </main>
  );
}
