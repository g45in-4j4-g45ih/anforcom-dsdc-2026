import Navbar from "@/components/navigation/Navbar";
import ListingBrowseSection from "@/components/listing/ListingBrowseSection";

export const dynamic = "force-dynamic";

interface ListingDiskonPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ListingDiskonPage({ searchParams }: ListingDiskonPageProps) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <ListingBrowseSection
          listingType="diskon"
          title="Jual Diskon"
          description="Makanan masih layak konsumsi, dijual murah sebelum kelewat waktu ambilnya."
          emptyMessage="Belum ada listing diskon yang sesuai filter saat ini."
          status={status}
          basePath="/listing/diskon"
        />
      </main>
    </div>
  );
}
