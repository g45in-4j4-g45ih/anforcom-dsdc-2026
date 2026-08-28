import {
  PackageOpen,
  Search,
  TriangleAlert,
} from "lucide-react";

import FilterDropdown from "@/components/materials/FilterDropdown";
import MaterialCard from "@/components/materials/MaterialCard";
import MaterialsPagination from "@/components/materials/MaterialsPagination";
import Navbar from "@/components/navigation/Navbar";
import { getMaterials } from "@/lib/materials-api";
import type {
  Material,
  MaterialStatus,
} from "@/types/materials";

export const dynamic = "force-dynamic";
const MATERIALS_PER_PAGE = 12;

const CATEGORY_OPTIONS = [
  "Kulit Bawang",
  "Ampas Kopi",
  "Jelantah",
  "Cangkang Telur",
  "Lainnya",
];

const STATUS_OPTIONS: MaterialStatus[] = [
  "Tersedia",
  "Tersedia Sebagian",
];

const CATEGORY_FILTER_OPTIONS = [
  { label: "Semua kategori", value: "" },
  ...CATEGORY_OPTIONS.map((option) => ({
    label: option,
    value: option,
  })),
];

const STATUS_FILTER_OPTIONS = [
  { label: "Semua yang tersedia", value: "" },
  ...STATUS_OPTIONS.map((option) => ({
    label: option,
    value: option,
  })),
];

interface MaterialsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getParam(
  value: string | string[] | undefined,
): string {
  return typeof value === "string" ? value : "";
}

function getPage(value: string) {
  const page = Number.parseInt(value, 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

function isAvailable(material: Material) {
  return (
    material.status === "Tersedia" ||
    material.status === "Tersedia Sebagian"
  );
}

export default async function MaterialsPage({
  searchParams,
}: MaterialsPageProps) {
  const params = await searchParams;
  const search = getParam(params.search).trim();
  const category = getParam(params.category);
  const status = getParam(params.status) as MaterialStatus | "";
  const requestedPage = getPage(getParam(params.page));

  let materials: Material[] = [];
  let errorMessage: string | null = null;

  try {
    const result = await getMaterials({
      search: search || undefined,
      category: category || undefined,
      status: status || undefined,
    });

    materials = status ? result : result.filter(isAvailable);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Material belum dapat dimuat.";
  }

  const totalPages = Math.max(
    1,
    Math.ceil(materials.length / MATERIALS_PER_PAGE),
  );

  const currentPage = Math.min(requestedPage, totalPages);
  const pageStart =
    (currentPage - 1) * MATERIALS_PER_PAGE;
  const paginatedMaterials = materials.slice(
    pageStart,
    pageStart + MATERIALS_PER_PAGE,
  );

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
            Material Exchange
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Temukan material yang bisa digunakan kembali
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
            Klaim byproduct dari pelaku usaha dan bantu material tersebut
            memperoleh kegunaan baru.
          </p>
        </div>

        <form
          action="/materials"
          className="mt-8 grid min-w-0 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_220px_auto]"
        >
          <label className="relative">
            <span className="sr-only">Cari material</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Cari nama atau jenis material"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary-light/30"
            />
          </label>

          <FilterDropdown
            label="Kategori material"
            name="category"
            defaultValue={category}
            options={CATEGORY_FILTER_OPTIONS}
          />

          <FilterDropdown
            label="Status material"
            name="status"
            defaultValue={status}
            options={STATUS_FILTER_OPTIONS}
          />

          <button
            type="submit"
            className="h-11 rounded-xl bg-secondary px-5 text-sm font-semibold text-white transition hover:bg-secondary/90"
          >
            Terapkan
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              Material tersedia
            </h2>
            {!errorMessage && (
              <p className="mt-1 text-sm text-gray-500">
                {materials.length} material ditemukan
              </p>
            )}
          </div>

          {(search || category || status) && (
            <a
              href="/materials"
              className="text-sm font-medium text-secondary hover:underline"
            >
              Hapus filter
            </a>
          )}
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-8 text-center"
          >
            <TriangleAlert
              className="mx-auto h-8 w-8 text-red-500"
              aria-hidden="true"
            />
            <h2 className="mt-3 font-semibold text-gray-900">
              Material belum dapat dimuat
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {errorMessage}
            </p>
          </div>
        ) : materials.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <PackageOpen
              className="mx-auto h-9 w-9 text-gray-400"
              aria-hidden="true"
            />
            <h2 className="mt-3 font-semibold text-gray-900">
              Belum ada material yang sesuai
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Coba ubah kata pencarian atau filter yang digunakan.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                />
              ))}
            </div>

            <MaterialsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              search={search}
              category={category}
              status={status}
            />
          </>
        )}
      </main>
    </div>
  );
}
