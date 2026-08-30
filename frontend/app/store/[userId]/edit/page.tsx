import { ArrowLeft, PackageOpen } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import StoreForm from "@/components/StoreForm";
import { fetchStoreByOwner } from "@/lib/api";

export default async function StoreEditPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const store = await fetchStoreByOwner(userId);

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <Navbar />

      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href={`/store/${userId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Toko
        </Link>

        {store ? (
          <StoreForm mode="edit" initialStore={store} />
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <PackageOpen className="mx-auto h-9 w-9 text-gray-400" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-gray-900">Toko tidak ditemukan</h2>
          </div>
        )}
      </main>
    </div>
  );
}
