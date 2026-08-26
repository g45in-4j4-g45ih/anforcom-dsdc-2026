import StoreForm from "@/components/StoreForm";
import { fetchStoreByOwner } from "@/lib/api";

export default async function StoreEditPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const store = await fetchStoreByOwner(userId);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      {store ? (
        <StoreForm mode="edit" initialStore={store} />
      ) : (
        <p className="text-center text-sm text-gray-400">Toko tidak ditemukan.</p>
      )}
    </main>
  );
}
