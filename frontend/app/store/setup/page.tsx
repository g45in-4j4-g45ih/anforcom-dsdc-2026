import StoreForm from "@/components/StoreForm";

export default function StoreSetupPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <StoreForm mode="create" />
    </main>
  );
}
