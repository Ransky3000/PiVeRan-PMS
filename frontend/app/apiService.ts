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
      const upStatus = (d.status || "PENDING").toUpperCase();
      if (d.note) itemNotes[upStatus] = d.note;
      if (d.photo_urls) {
        try {
          itemPhotos[upStatus] = JSON.parse(d.photo_urls);
        } catch (e) {
          itemPhotos[upStatus] = [];
        }
      }
    });

    const upperStatus = (item.status || "PENDING").toUpperCase();
    return {
      id: item.id,
      name: item.name,
      status: upperStatus,
      mechanicNote: itemNotes[upperStatus] || "",
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

  createJobOrder: async (jobOrder: {
    owner_id: string;
    vehicle_id: string;
    bundle_id: string;
    odometer: number;
    mechanic_names: string[];
  }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/job-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobOrder)
      });
      if (!res.ok) throw new Error("Failed to create job order");
      const data = await res.json();
      return normalizeJobOrder(data);
    } catch (e) {
      console.warn("Backend unavailable, mock creating job order", e);
      throw e;
    }
  },

  updateJobOrder: async (id: string, payload: {
    odometer?: number;
    bundle_id?: string;
    mechanic_names?: string[];
  }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/job-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to update job order");
      const data = await res.json();
      return normalizeJobOrder(data);
    } catch (e) {
      console.error("Failed to update job order", e);
      throw e;
    }
  },

  deleteJobOrder: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/job-orders/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete job order");
      return true;
    } catch (e) {
      console.error("Failed to delete job order", e);
      throw e;
    }
  },

  getMaterials: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/materials`);
      if (!res.ok) throw new Error("Failed to fetch materials");
      const data = await res.json();
      return (data || []).map((m: any) => ({
        id: m.materials_id,
        name: m.name,
        description: m.description || "",
        price: m.price
      }));
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock materials", e);
      return [];
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
          price: parseFloat(material.price || 0)
        })
      });
      if (!res.ok) throw new Error("Failed to create material");
      const m = await res.json();
      return {
        id: m.materials_id,
        name: m.name,
        description: m.description || "",
        price: m.price
      };
    } catch (e) {
      console.warn("Backend unavailable, mock creating material", e);
      return { ...material, id: `MAT-${Math.random().toString(36).substr(2, 9)}` };
    }
  },

  updateMaterial: async (materialId: string, updates: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/materials/${materialId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error("Failed to update material");
      const m = await res.json();
      return {
        id: m.materials_id,
        name: m.name,
        description: m.description || "",
        price: m.price
      };
    } catch (e) {
      console.warn("Backend unavailable, mock updating material", e);
      return null;
    }
  },

  deleteMaterial: async (materialId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/materials/${materialId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete material");
      return true;
    } catch (e) {
      console.warn("Backend unavailable, mock deleting material", e);
      return false;
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
        fb_handle: o.facebook || "",
        vehicles: (o.vehicles || []).map((v: any) => ({
          id: v.vehicle_id || v.id,
          vehicle_id: v.vehicle_id || v.id,
          plate_number: v.plate_number || v.plate,
          plate: v.plate_number || v.plate,
          make: v.make,
          model: v.model,
          year: v.year,
          color: v.color,
          photo_url: v.photo_url || v.photoUrl || null,
          photoUrl: v.photo_url || v.photoUrl || null
        }))
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
          contact_number: owner.phone,
          vehicle_ids: owner.vehicle_ids || []
        })
      });
      if (!res.ok) throw new Error("Failed to create owner");
      const o = await res.json();
      return {
        id: o.owner_id,
        name: o.name,
        phone: o.contact_number,
        fb_handle: o.facebook || "",
        vehicles: (o.vehicles || []).map((v: any) => ({
          id: v.vehicle_id || v.id,
          vehicle_id: v.vehicle_id || v.id,
          plate_number: v.plate_number || v.plate,
          plate: v.plate_number || v.plate,
          make: v.make,
          model: v.model,
          year: v.year,
          color: v.color,
          photo_url: v.photo_url || v.photoUrl || null,
          photoUrl: v.photo_url || v.photoUrl || null
        }))
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
        vehicle_id: v.vehicle_id,
        plate_number: v.plate_number,
        plate: v.plate_number,
        make: v.make,
        model: v.model,
        year: v.year,
        color: v.color,
        photo_url: v.photo_url || null,
        photoUrl: v.photo_url || null,
        owners: (v.owners || []).map((o: any) => ({
          id: o.owner_id,
          name: o.name,
          phone: o.contact_number,
          fb_handle: o.facebook || ""
        }))
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
          make: vehicle.make || vehicle.model?.split(" ")[0] || "Unknown",
          model: vehicle.model || "Unknown",
          year: parseInt(vehicle.year) || 2020,
          color: vehicle.color || "Black",
          plate_number: vehicle.plate_number,
          photo_url: vehicle.photo_url || null,
          owner_id: vehicle.owner_id || null,
          owner_ids: vehicle.owner_ids || (vehicle.owner_id ? [vehicle.owner_id] : [])
        })
      });
      if (!res.ok) throw new Error("Failed to create vehicle");
      const v = await res.json();
      return {
        id: v.vehicle_id,
        vehicle_id: v.vehicle_id,
        plate_number: v.plate_number,
        plate: v.plate_number,
        make: v.make,
        model: v.model,
        year: v.year,
        color: v.color,
        photo_url: v.photo_url || null,
        photoUrl: v.photo_url || null,
        owners: (v.owners || []).map((o: any) => ({
          id: o.owner_id,
          name: o.name,
          phone: o.contact_number,
          fb_handle: o.facebook || ""
        }))
      };
    } catch (e) {
      console.warn("Backend unavailable, mock creating vehicle", e);
      return { ...vehicle, id: `VEH-${Math.random().toString(36).substr(2, 4)}` };
    }
  },

  updateVehicle: async (vehicleId: string, updates: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/vehicles/${vehicleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error("Failed to update vehicle");
      const v = await res.json();
      return {
        id: v.vehicle_id,
        vehicle_id: v.vehicle_id,
        plate_number: v.plate_number,
        plate: v.plate_number,
        make: v.make,
        model: v.model,
        year: v.year,
        color: v.color,
        photo_url: v.photo_url || null,
        photoUrl: v.photo_url || null,
        owners: (v.owners || []).map((o: any) => ({
          id: o.owner_id,
          name: o.name,
          phone: o.contact_number,
          fb_handle: o.facebook || ""
        }))
      };
    } catch (e) {
      console.warn("Backend unavailable, mock updating vehicle", e);
      return null;
    }
  },

  deleteVehicle: async (vehicleId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/vehicles/${vehicleId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete vehicle");
      return true;
    } catch (e) {
      console.warn("Backend unavailable, mock deleting vehicle", e);
      return false;
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
        status: "Active" as const,
        recommendedMaterials: (l.materials || []).map((m: any) => m.name)
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
        status: "Active" as const
      };
    } catch (e) {
      console.warn("Backend unavailable, mock creating labor", e);
      return { ...labor, id: `PMS-${Math.random().toString(36).substr(2, 4)}` };
    }
  },

  updateLabor: async (laborId: string, updates: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/labor/${laborId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error("Failed to update labor");
      const l = await res.json();
      return {
        id: l.labor_id,
        name: l.labor_name,
        price: `₱${parseFloat(l.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        category: l.category,
        description: l.description || "",
        status: "Active" as const
      };
    } catch (e) {
      console.warn("Backend unavailable, mock updating labor", e);
      return null;
    }
  },

  deleteLabor: async (laborId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/labor/${laborId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete labor");
      return true;
    } catch (e) {
      console.warn("Backend unavailable, mock deleting labor", e);
      return false;
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

  updateBundle: async (bundleId: string, updates: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/bundles/${bundleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error("Failed to update bundle");
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
      console.warn("Backend unavailable, mock updating bundle", e);
      return null;
    }
  },

  deleteBundle: async (bundleId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/bundles/${bundleId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete bundle");
      return true;
    } catch (e) {
      console.warn("Backend unavailable, mock deleting bundle", e);
      return false;
    }
  },

  getMechanics: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (!res.ok) throw new Error("Failed to fetch mechanics");
      const users = await res.json();
      return (users || []).filter((u: any) => u.role === "Mechanic");
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock mechanics", e);
      return DEFAULT_MECHANICS.filter((u: any) => u.role === "Mechanic");
    }
  },

  createMechanic: async (mechanicData: any) => {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...mechanicData,
        role: "Mechanic",
        status: "APPROVED"
      })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to create mechanic account");
    }
    return await res.json();
  },

  updateMechanic: async (mechanicId: string, updates: any) => {
    const res = await fetch(`${API_BASE_URL}/users/${mechanicId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to update mechanic profile");
    }
    return await res.json();
  },

  deleteMechanic: async (mechanicId: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${mechanicId}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to delete mechanic account");
    }
    return true;
  },

  // AUTHENTICATION & USER MANAGEMENT ENDPOINTS
  login: async (credentials: { email: string; password: string }) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMsg = errorData.detail || "Failed to sign in";
      const error = new Error(errorMsg) as any;
      error.status = res.status;
      throw error;
    }
    return await res.json();
  },

  signup: async (userData: { email: string; password: string; name: string; phone_number: string; role: string }) => {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to sign up");
    }
    return await res.json();
  },

  getUsers: async (status?: string) => {
    try {
      const url = status ? `${API_BASE_URL}/users?status=${status}` : `${API_BASE_URL}/users`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch users");
      return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, using empty user list", e);
      return [];
    }
  },

  getUser: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch user");
    return await res.json();
  },

  updateUserStatus: async (userId: string, status: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to update user status");
    }
    return await res.json();
  }
};

// SESSION STORAGE HELPERS
export const authService = {
  getCurrentUser: () => {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("piveran_current_user");
    return userStr ? JSON.parse(userStr) : null;
  },
  setCurrentUser: (user: any) => {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem("piveran_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("piveran_current_user");
    }
  },
  getPendingUser: () => {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("piveran_pending_user");
    return userStr ? JSON.parse(userStr) : null;
  },
  setPendingUser: (user: any) => {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem("piveran_pending_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("piveran_pending_user");
    }
  },
  clearSession: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("piveran_current_user");
    localStorage.removeItem("piveran_pending_user");
  }
};

