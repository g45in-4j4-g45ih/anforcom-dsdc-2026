import Navbar from "@/components/navigation/Navbar";
import ListingBrowseSection from "@/components/listing/ListingBrowseSection";

export const dynamic = "force-dynamic";

export default function ListingDonasiPage() {

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <ListingBrowseSection
          listingType="donasi"
          title="Donasi"
          description="Makanan masih layak konsumsi, dibagikan gratis ke siapa saja yang butuh."
          emptyMessage="Belum ada listing donasi yang sesuai filter saat ini."
        />
      </main>
    </div>
  );
}
