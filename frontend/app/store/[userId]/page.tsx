import Navbar from "@/components/navigation/Navbar";
import StoreProfile from "@/components/StoreProfile";

export default async function StorePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <StoreProfile userId={userId} />
      </main>
    </div>
  );
}
