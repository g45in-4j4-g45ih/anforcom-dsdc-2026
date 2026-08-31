import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import NewThreadForm from "@/components/forum/NewThreadForm";

export default function NewThreadPage() {
  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/forum"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Forum
        </Link>

        <NewThreadForm />
      </main>
    </div>
  );
}
