import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import MaterialDetailView from "@/components/materials/MaterialDetailView";
import Navbar from "@/components/navigation/Navbar";
import {
  getMaterial,
  MaterialsApiError,
} from "@/lib/materials-api";

export const dynamic = "force-dynamic";

interface MaterialDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MaterialDetailPage({
  params,
}: MaterialDetailPageProps) {
  const { id } = await params;

  if (!id || !Number.isFinite(Number(id))) {
    notFound();
  }

  let material;

  try {
    material = await getMaterial(id);
  } catch (error) {
    if (
      error instanceof MaterialsApiError &&
      error.status === 404
    ) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/materials"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-primary"
        >
          <ArrowLeft
            className="h-4 w-4"
            aria-hidden="true"
          />
          Kembali ke Material Exchange
        </Link>

        <MaterialDetailView material={material} />
      </main>
    </div>
  );
}
