/* ───────────────────────────────────────────
   TYPE DEFINITIONS
   ─────────────────────────────────────────── */

export type JOStatus = "New" | "Work in progress" | "Job completed";

export interface MaterialRequirement {
  name: string;
  qty: number;
  cart_id?: string;
  material_id?: string;
  price?: number;
  decision?: "Buy" | "No";
}

export interface InspectionItem {
  id?: string;
  name: string;
  status: "GOOD" | "ISSUE" | "MONITOR" | "PENDING";
  mechanicNote?: string;
  photoUrl?: string;
  photos?: string[];
  statusPhotos?: {
    GOOD?: string[];
    ISSUE?: string[];
    MONITOR?: string[];
  };
  statusNotes?: {
    GOOD?: string;
    ISSUE?: string;
    MONITOR?: string;
  };
  requiredMaterials?: (string | MaterialRequirement)[];
}

export interface EstimateLineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  customerApproved: boolean | null; // null = not yet decided
}

export interface JobOrder {
  id: string;
  ownerName: string;
  ownerPhone: string;
  ownerFb: string;
  vehicleModel: string;
  plateNumber: string;
  engineType?: string;
  odometer: string;
  serviceType: string;
  serviceDescription?: string;
  serviceFee?: number;
  inchargeMechanics: string[];
  status: JOStatus;
  createdAt: string;
  vehiclePhotoUrl?: string;
  // Post-inspection data
  inspectionItems?: InspectionItem[];
  mechanicFindings?: string;
  estimateItems?: EstimateLineItem[];
  discount?: number;
  estimateComment?: string;
}
