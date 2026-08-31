import {
  Coffee,
  Droplet,
  Egg,
  Layers,
  Recycle,
  Utensils,
} from "lucide-react";

interface MaterialCategoryChipProps {
  category: string;
  className?: string;
}

function CategoryIcon({ category }: { category: string }) {
  const className = "h-3 w-3 shrink-0";
  const normalizedCategory = category.trim().toLowerCase();

  if (normalizedCategory.includes("bawang")) {
    return <Layers className={className} aria-hidden="true" />;
  }

  if (normalizedCategory.includes("kopi")) {
    return <Coffee className={className} aria-hidden="true" />;
  }

  if (
    normalizedCategory.includes("jelantah") ||
    normalizedCategory.includes("minyak")
  ) {
    return <Droplet className={className} aria-hidden="true" />;
  }

  if (normalizedCategory.includes("telur")) {
    return <Egg className={className} aria-hidden="true" />;
  }

  if (
    normalizedCategory.includes("nasi") ||
    normalizedCategory.includes("makanan")
  ) {
    return <Utensils className={className} aria-hidden="true" />;
  }

  return <Recycle className={className} aria-hidden="true" />;
}

export default function MaterialCategoryChip({
  category,
  className = "",
}: MaterialCategoryChipProps) {
  const label = category || "Material lainnya";

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full bg-secondary-light/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary ${className}`}
    >
      <CategoryIcon category={label} />
      <span className="truncate">{label}</span>
    </span>
  );
}
