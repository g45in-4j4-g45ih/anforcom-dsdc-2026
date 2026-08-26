import StoreProfile from "@/components/StoreProfile";

export default async function StorePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <StoreProfile userId={userId} />
    </main>
  );
}
