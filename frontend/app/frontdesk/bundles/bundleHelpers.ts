export interface LaborItem {
  id: string;
  name: string;
  price: string;
  category: string;
  description: string;
  status: "Active" | "Archived";
  isPackageItem?: boolean;
  recommendedMaterials?: string[];
}

export interface PackageBundle {
  id: string;
  packageName: string;
  targetInterval: string;
  description: string;
  servicesIncluded: string[];
  packagePrice: string;
  standaloneSum: string;
  popularBadge?: boolean;
}

export const categoryDisplayNames: Record<string, string> = {
  "PMS": "🛠️ PMS",
  "AIRCON SERVICES": "❄️ AIRCON SERVICES",
  "MAJOR WORK": "⚙️ MAJOR WORK",
  "UNDER CHASSIS": "🚗 UNDER CHASSIS",
  "COOLING SYSTEM RESTORATION": "🌡️ COOLING SYSTEM RESTORATION"
};

export const calculateStandaloneSum = (
  selectedLaborIds: string[],
  selectableItems: LaborItem[]
): number => {
  return selectedLaborIds.reduce((sum, id) => {
    const found = selectableItems.find((i) => i.id === id);
    if (!found) return sum;
    const num = parseFloat(found.price.replace(/[^\d.]/g, "")) || 0;
    return sum + num;
  }, 0);
};
