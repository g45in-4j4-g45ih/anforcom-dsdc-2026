import { MessageCircleOff, Plus, Search, TriangleAlert } from "lucide-react";
import Link from "next/link";

import FilterDropdown from "@/components/materials/FilterDropdown";
import Navbar from "@/components/navigation/Navbar";
import ThreadCard from "@/components/forum/ThreadCard";
import { ForumApiError, getThreads } from "@/lib/forum-api";
import type { ForumPostType, ForumThread } from "@/types/forum";

export const dynamic = "force-dynamic";

const TYPE_FILTER_OPTIONS = [
  { label: "Semua jenis", value: "" },
  { label: "Diskusi", value: "discussion" },
  { label: "Request", value: "request" },
];

interface ForumPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function ForumPage({ searchParams }: ForumPageProps) {
  const params = await searchParams;
  const search = getParam(params.search).trim();
  const type = getParam(params.type) as ForumPostType | "";

  let threads: ForumThread[] = [];
  let errorMessage: string | null = null;

  try {
    threads = await getThreads({
      search: search || undefined,
      type: type || undefined,
    });
  } catch (error) {
    errorMessage =
      error instanceof ForumApiError ? error.message : "Forum belum dapat dimuat.";
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Forum Komunitas</h1>
            <p className="mt-1 text-sm text-gray-500">
              Diskusi soal pangan berkelanjutan, atau minta bahan/material tertentu ke komunitas.
            </p>
          </div>

          <Link
            href="/forum/new"
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Bikin Post
          </Link>
        </div>

        <form
          action="/forum"
          className="mt-6 grid min-w-0 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_200px_auto]"
        >
          <label className="relative">
            <span className="sr-only">Cari post</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Cari judul atau isi post"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary-light/30"
            />
          </label>

          <FilterDropdown
            label="Jenis post"
            name="type"
            defaultValue={type}
            options={TYPE_FILTER_OPTIONS}
          />

          <button
            type="submit"
            className="h-11 rounded-xl bg-secondary px-5 text-sm font-semibold text-white transition hover:bg-secondary/90"
          >
            Terapkan
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-4">
          {!errorMessage && (
            <p className="text-sm text-gray-500">{threads.length} post ditemukan</p>
          )}

          {(search || type) && (
            <a href="/forum" className="text-sm font-medium text-secondary hover:underline">
              Hapus filter
            </a>
          )}
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-8 text-center"
          >
            <TriangleAlert className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-gray-900">Forum belum dapat dimuat</h2>
            <p className="mt-1 text-sm text-gray-600">{errorMessage}</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <MessageCircleOff className="mx-auto h-9 w-9 text-gray-400" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-gray-900">Belum ada post yang sesuai</h2>
            <p className="mt-1 text-sm text-gray-500">
              Coba ubah kata pencarian atau filter, atau jadi yang pertama nulis di sini.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {threads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
