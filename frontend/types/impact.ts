export type RescuePath = "jual_diskon" | "donasi" | "material_exchange";

export interface ImpactMeasurement {
  // raw Decimal rendered by DRF's default JSONEncoder (not through a
  // Serializer field), so these come through as numbers, not strings
  total_kg: number;
  total_liter: number;
  total_transactions: number;
}

export interface ImpactCategoryBreakdown extends ImpactMeasurement {
  category: string;
}

export interface ImpactSummary {
  totals: ImpactMeasurement;
  by_path: Record<RescuePath, ImpactMeasurement>;
  by_category: ImpactCategoryBreakdown[];
}

export interface ImpactRoleSummary {
  poster: ImpactMeasurement;
  claimer: ImpactMeasurement;
}

export interface MyImpactSummary extends ImpactSummary {
  by_role: ImpactRoleSummary;
}

export type ImpactRole = "poster" | "claimer";

export interface ImpactHistoryEntry {
  id: number;
  item: { id: number; name: string };
  path: RescuePath | null;
  category: string;
  quantity: number;
  unit: string;
  roles: ImpactRole[];
  completed_at: string;
}

export interface ImpactHistoryResponse {
  count: number;
  results: ImpactHistoryEntry[];
}

export interface ImpactHistoryFilters {
  path?: RescuePath;
  category?: string;
  start_date?: string;
  end_date?: string;
}
