import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
}

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-light/20 text-secondary">
        {icon}
      </div>
      <p className="mt-3 text-sm text-gray-500">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
