import { DEFAULT_JOB_ORDERS, DEFAULT_OWNERS, DEFAULT_VEHICLES, DEFAULT_MECHANICS, DEFAULT_MATERIALS } from "./mockData";

export const API_BASE_URL = "http://localhost:8000/api";

// Transformer to map backend database snake_case structure to frontend expected camelCase structure
export function normalizeJobOrder(be: any): any {
  if (!be) return be;

  const statusNotes: Record<string, any> = {};
  const statusPhotos: Record<string, any> = {};

  const inspectionItems = (be.inspection_items || []).map((item: any) => {
    const itemNotes: Record<string, string> = {};
    const itemPhotos: Record<string, string[]> = {};

    (item.details || []).forEach((d: any) => {
      if (d.note) itemNotes[d.status] = d.note;
      if (d.photo_urls) {
        try {
          itemPhotos[d.status] = JSON.parse(d.photo_urls);
        } catch (e) {
          itemPhotos[d.status] = [];
        }
      }
    });

    return {
      id: item.id,
      name: item.name,
      status: item.status,
      mechanicNote: itemNotes[item.status] || "",
      statusNotes: itemNotes,
      statusPhotos: itemPhotos
    };
  });

  const estimateItems = (be.estimate_items || []).map((e: any) => ({
    id: e.id,
    description: e.description,
    qty: e.qty,
    unitPrice: e.unit_price,
    customerApproved: e.customer_approved,
    provisioning: e.provisioning
  }));

  return {
    id: be.id,
    ownerName: be.owner?.name || "",
    ownerPhone: be.owner?.phone || "",
    ownerFb: be.owner?.fb_handle || "",
    vehicleModel: be.vehicle?.model || "",
    plateNumber: be.vehicle?.plate_number || "",
    engineType: be.vehicle?.engine_type || "",
    odometer: be.odometer || "",
    serviceType: be.service_type || "",
    inchargeMechanics: (be.mechanics || []).map((m: any) => typeof m === 'string' ? m : m.name),
    status: be.status,
    createdAt: be.created_at,
    vehiclePhotoUrl: be.vehicle_photo_url,
    inspectionStarted: be.inspection_started || false,
    mechanicFindings: be.mechanic_findings || "",
    discount: be.discount || 0,
    estimateComment: be.estimate_comment || "",
    mechanicMarkedReady: be.mechanic_marked_ready || false,
    inspectionItems,
    estimateItems
  };
}

export const apiService = {
  getJobOrders: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/job-orders`);
      if (!res.ok) throw new Error("Failed to fetch job orders");
      const data = await res.json();
      return (data || []).map(normalizeJobOrder);
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock job orders", e);
      return DEFAULT_JOB_ORDERS;
    }
  },

  getJobOrder: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/job-orders/${id}`);
      if (!res.ok) throw new Error("Failed to fetch job order");
      const data = await res.json();
      return normalizeJobOrder(data);
    } catch (e) {
      console.warn(`Backend unavailable, falling back to mock job order for id ${id}`, e);
      const found = DEFAULT_JOB_ORDERS.find(jo => jo.id === id);
      if (found) return found;
      throw e;
    }
  },

  updateJobOrderStatus: async (id: string, payload: { status?: string; inspection_started?: boolean }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/job-orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to update status");
      return await res.json();
    } catch (e) {
      console.warn(`Backend unavailable, mock updating job order status ${id}`, e);
      return { message: "Updated (mock)", id, ...payload };
    }
  },

  updateInspectionItem: async (id: number, payload: { status: string; note?: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/inspection-items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to update inspection item");
      return await res.json();
    } catch (e) {
      console.warn(`Backend unavailable, mock updating inspection item ${id}`, e);
      return { message: "Updated (mock)", id, ...payload };
    }
  },

  getMaterials: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/materials`);
      if (!res.ok) throw new Error("Failed to fetch materials");
      const data = await res.json();
      return (data || []).map((m: any) => ({
        id: m.materials_id,
        sku: `MAT-${m.materials_id.substring(0, 4).toUpperCase()}`,
        name: m.name,
        category: "General Parts",
        description: m.description || "",
        unit_of_measure: "pcs",
        cost_price: m.price * 0.7,
        selling_price: m.price,
        stock_qty: 25,
        critical_threshold: 5,
        compatible_vehicles: "Universal"
      }));
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock materials", e);
      return DEFAULT_MATERIALS;
    }
  },

  createMaterial: async (material: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: material.name,
          description: material.description || "",
          price: parseFloat(material.sellingPrice || material.selling_price || 0)
        })
      });
      if (!res.ok) throw new Error("Failed to create material");
      const m = await res.json();
      return {
        id: m.materials_id,
        sku: `MAT-${m.materials_id.substring(0, 4).toUpperCase()}`,
        name: m.name,
        category: "General Parts",
        description: m.description || "",
        unit_of_measure: "pcs",
        cost_price: m.price * 0.7,
        selling_price: m.price,
        stock_qty: 25,
        critical_threshold: 5,
        compatible_vehicles: "Universal"
      };
    } catch (e) {
      console.warn("Backend unavailable, mock creating material", e);
      return { ...material, id: `MAT-${Math.random().toString(36).substr(2, 9)}` };
    }
  },

  getOwners: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/owners`);
      if (!res.ok) throw new Error("Failed to fetch owners");
      const data = await res.json();
      return (data || []).map((o: any) => ({
        id: o.owner_id,
        name: o.name,
        phone: o.contact_number,
        fb_handle: o.facebook || ""
      }));
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock owners", e);
      return DEFAULT_OWNERS;
    }
  },

  createOwner: async (owner: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/owners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: owner.name,
          facebook: owner.fb_handle || "",
          contact_number: owner.phone
        })
      });
      if (!res.ok) throw new Error("Failed to create owner");
      const o = await res.json();
      return {
        id: o.owner_id,
        name: o.name,
        phone: o.contact_number,
        fb_handle: o.facebook || ""
      };
    } catch (e) {
      console.warn("Backend unavailable, mock creating owner", e);
      return { ...owner, id: `OWN-${Math.random().toString(36).substr(2, 4)}` };
    }
  },

  getVehicles: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/vehicles`);
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      const data = await res.json();
      return (data || []).map((v: any) => ({
        id: v.vehicle_id,
        plate_number: v.plate_number,
        model: `${v.make} ${v.model} ${v.year}`,
        year: v.year,
        engine_type: "Gasoline",
        owner_id: v.owner_id
      }));
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock vehicles", e);
      return DEFAULT_VEHICLES;
    }
  },

  createVehicle: async (vehicle: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: vehicle.owner_id,
          make: vehicle.make || vehicle.model.split(" ")[0] || "Unknown",
          model: vehicle.model || "Unknown",
          year: parseInt(vehicle.year) || 2020,
          color: vehicle.color || "Black",
          plate_number: vehicle.plate_number
        })
      });
      if (!res.ok) throw new Error("Failed to create vehicle");
      const v = await res.json();
      return {
        id: v.vehicle_id,
        plate_number: v.plate_number,
        model: `${v.make} ${v.model} ${v.year}`,
        year: v.year,
        engine_type: "Gasoline",
        owner_id: v.owner_id
      };
    } catch (e) {
      console.warn("Backend unavailable, mock creating vehicle", e);
      return { ...vehicle, id: `VEH-${Math.random().toString(36).substr(2, 4)}` };
    }
  },

  getLabor: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/labor`);
      if (!res.ok) throw new Error("Failed to fetch labor");
      const data = await res.json();
      return (data || []).map((l: any) => ({
        id: l.labor_id,
        name: l.labor_name,
        price: `₱${parseFloat(l.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        category: l.category,
        description: l.description || "",
        status: "Active"
      }));
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock labor");
      return null;
    }
  },

  createLabor: async (labor: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/labor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labor_name: labor.name,
          price: parseFloat(labor.price.replace(/[₱,]/g, "")),
          category: labor.category,
          description: labor.description || ""
        })
      });
      if (!res.ok) throw new Error("Failed to create labor");
      const l = await res.json();
      return {
        id: l.labor_id,
        name: l.labor_name,
        price: `₱${parseFloat(l.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        category: l.category,
        description: l.description || "",
        status: "Active"
      };
    } catch (e) {
      console.warn("Backend unavailable, mock creating labor", e);
      return { ...labor, id: `PMS-${Math.random().toString(36).substr(2, 4)}` };
    }
  },

  getBundles: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/bundles`);
      if (!res.ok) throw new Error("Failed to fetch bundles");
      const data = await res.json();
      return (data || []).map((b: any) => ({
        id: b.bundle_id,
        packageName: b.bundle_name,
        targetInterval: b.interval,
        description: b.description || "",
        servicesIncluded: (b.services || []).map((s: any) => s.labor_name),
        packagePrice: `₱${parseFloat(b.discounted_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        standaloneSum: `₱${parseFloat(b.original_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        popularBadge: false
      }));
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock bundles");
      return null;
    }
  },

  createBundle: async (bundle: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/bundles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundle_name: bundle.packageName,
          interval: bundle.targetInterval,
          description: bundle.description || "",
          original_price: parseFloat(bundle.standaloneSum.replace(/[₱,]/g, "")),
          discounted_price: parseFloat(bundle.packagePrice.replace(/[₱,]/g, "")),
          labor_ids: bundle.laborIds || []
        })
      });
      if (!res.ok) throw new Error("Failed to create bundle");
      const b = await res.json();
      return {
        id: b.bundle_id,
        packageName: b.bundle_name,
        targetInterval: b.interval,
        description: b.description || "",
        servicesIncluded: (b.services || []).map((s: any) => s.labor_name),
        packagePrice: `₱${parseFloat(b.discounted_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        standaloneSum: `₱${parseFloat(b.original_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        popularBadge: false
      };
    } catch (e) {
      console.warn("Backend unavailable, mock creating bundle", e);
      return { ...bundle, id: `PKG-${Math.random().toString(36).substr(2, 4)}` };
    }
  },

  getMechanics: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/mechanics`);
      if (!res.ok) throw new Error("Failed to fetch mechanics");
      return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock mechanics", e);
      return DEFAULT_MECHANICS;
    }
  }
};
