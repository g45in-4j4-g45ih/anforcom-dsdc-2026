import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface MaterialsPaginationProps {
  currentPage: number;
  totalPages: number;
  search: string;
  category: string;
  status: string;
}

type PageItem =
  | number
  | "ellipsis-left"
  | "ellipsis-right";

function createPageHref(
  page: number,
  filters: {
    search: string;
    category: string;
    status: string;
  },
) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return `/materials${query ? `?${query}` : ""}`;
}

function getPageItems(
  currentPage: number,
  totalPages: number,
): PageItem[] {
  if (totalPages <= 5) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1,
    );
  }

  if (currentPage <= 3) {
    return [
      1,
      2,
      3,
      "ellipsis-right",
      totalPages,
    ];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "ellipsis-left",
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-left",
    currentPage,
    "ellipsis-right",
    totalPages,
  ];
}

export default function MaterialsPagination({
  currentPage,
  totalPages,
  search,
  category,
  status,
}: MaterialsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const filters = {
    search,
    category,
    status,
  };

  const pageItems = getPageItems(
    currentPage,
    totalPages,
  );

  return (
    <nav
      aria-label="Navigasi halaman material"
      className="mx-auto mt-8 flex w-fit max-w-full items-center gap-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm sm:gap-2 sm:p-3"
    >
      {currentPage > 1 ? (
        <Link
          href={createPageHref(currentPage - 1, filters)}
          aria-label="Halaman sebelumnya"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-primary-soft/40 hover:text-primary sm:h-10 sm:w-10 sm:rounded-xl"
        >
          <ChevronLeft
            className="h-4 w-4"
            aria-hidden="true"
          />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          aria-label="Tidak ada halaman sebelumnya"
          className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg text-gray-300 sm:h-10 sm:w-10 sm:rounded-xl"
        >
          <ChevronLeft
            className="h-4 w-4"
            aria-hidden="true"
          />
        </span>
      )}

      {pageItems.map((item) => {
        if (typeof item !== "number") {
          return (
            <span
              key={item}
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center text-sm font-semibold text-gray-400 sm:h-10 sm:w-10"
            >
              …
            </span>
          );
        }

        const isActive = item === currentPage;

        return (
          <Link
            key={item}
            href={createPageHref(item, filters)}
            aria-label={`Halaman ${item}`}
            aria-current={isActive ? "page" : undefined}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition sm:h-10 sm:w-10 sm:rounded-xl ${
              isActive
                ? "bg-primary text-white shadow-sm"
                : "text-gray-500 hover:bg-primary-soft/40 hover:text-primary"
            }`}
          >
            {item}
          </Link>
        );
      })}

      {currentPage < totalPages ? (
        <Link
          href={createPageHref(currentPage + 1, filters)}
          aria-label="Halaman berikutnya"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-primary-soft/40 hover:text-primary sm:h-10 sm:w-10 sm:rounded-xl"
        >
          <ChevronRight
            className="h-4 w-4"
            aria-hidden="true"
          />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          aria-label="Tidak ada halaman berikutnya"
          className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg text-gray-300 sm:h-10 sm:w-10 sm:rounded-xl"
        >
          <ChevronRight
            className="h-4 w-4"
            aria-hidden="true"
          />
        </span>
      )}
    </nav>
  );
}