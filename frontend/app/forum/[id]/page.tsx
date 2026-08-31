import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import Navbar from "@/components/navigation/Navbar";
import ThreadDetailView from "@/components/forum/ThreadDetailView";
import { ForumApiError, getThread } from "@/lib/forum-api";

export const dynamic = "force-dynamic";

interface ForumThreadPageProps {
  params: Promise<{ id: string }>;
}

export default async function ForumThreadPage({ params }: ForumThreadPageProps) {
  const { id } = await params;

  if (!id || !Number.isFinite(Number(id))) {
    notFound();
  }

  let thread;
  try {
    thread = await getThread(id);
  } catch (error) {
    if (error instanceof ForumApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

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

        <ThreadDetailView thread={thread} />
      </main>
    </div>
  );
}
