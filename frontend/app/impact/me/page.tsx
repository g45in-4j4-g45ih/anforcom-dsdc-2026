import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import MyImpactView from "@/components/impact/MyImpactView";

export default function MyImpactPage() {
  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/impact"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Dampak Bersama
        </Link>

        <h1 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">Dampakku</h1>

        <MyImpactView />
      </main>
    </div>
  );
}
