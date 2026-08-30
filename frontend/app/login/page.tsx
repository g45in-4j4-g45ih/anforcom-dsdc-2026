import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <Navbar />

      <main className="mx-auto max-w-sm px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/materials"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Beranda
        </Link>

        <AuthForm mode="login" />
      </main>
    </div>
  );
}
