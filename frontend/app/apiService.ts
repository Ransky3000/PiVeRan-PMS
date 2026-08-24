// apiService.ts - Real API backend service

export const API_BASE_URL = "http://localhost:8000/api";

// Transformer to map backend database snake_case structure to frontend expected camelCase structure
export function normalizeJobOrder(be: any): any {
  if (!be) return be;

  const statusNotes: Record<string, any> = {};
  const statusPhotos: Record<string, any> = {};

  const inspectionItems = (be.inspection_items || []).map((item: any) => {
    const itemNotes: Record<string, string> = item.statusNotes || {};
    const itemPhotos: Record<string, string[]> = item.statusPhotos || {};

    (item.details || []).forEach((d: any) => {
      const upStatus = (d.status || "PENDING").toUpperCase();
      if (d.note && !itemNotes[upStatus]) itemNotes[upStatus] = d.note;
      if (d.photo_urls && !itemPhotos[upStatus]) {
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
      mechanicNote: itemNotes[upperStatus] || itemNotes[item.status] || "",
      statusNotes: itemNotes,
      statusPhotos: itemPhotos,
      requiredMaterials: item.requiredMaterials || []
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
    odometer: be.odometer || "",
    serviceType: be.service_type || "",
    serviceDescription: be.service_description || "",
    serviceFee: be.service_fee || 0,
    inchargeMechanics: (be.mechanics || []).map((m: any) => typeof m === 'string' ? m : m.name),
    status: be.status,
    createdAt: be.created_at,
    vehiclePhotoUrl: be.vehicle_photo_url,
    mechanicFindings: be.mechanic_findings || "",
    discount: be.discount || 0,
    estimateComment: be.estimate_comment || "",
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
      console.warn("Failed to fetch job orders from backend", e);
      return [];
    }
  },

  getJobOrder: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/job-orders/${id}`);
      if (!res.ok) throw new Error("Failed to fetch job order");
      const data = await res.json();
      return normalizeJobOrder(data);
    } catch (e) {
      console.warn(`Failed to fetch job order for id ${id}`, e);
      return null;
    }
  },

  updateJobOrderStatus: async (id: string, statusOrPayload: string | { status?: string }) => {
    const payload = typeof statusOrPayload === "string" ? { status: statusOrPayload } : statusOrPayload;
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

  updateInspectionItem: async (id: string | number, payload: {
    status?: string;
    note?: string;
    diagnostic_notes?: string;
    statusNotes?: Record<string, string>;
    statusPhotos?: Record<string, string[]>;
    visual_proof?: string;
  }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/job-orders/checklist-items/${id}`, {
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

  addMaterialToCart: async (cd_id: string | number, material_id: string, quantity: number = 1) => {
    try {
      const res = await fetch(`${API_BASE_URL}/job-orders/checklist-items/${cd_id}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material_id, quantity })
      });
      if (!res.ok) throw new Error("Failed to add material to cart");
      return await res.json();
    } catch (e) {
      console.warn(`Backend unavailable, mock adding material to cart`, e);
      return { message: "Added material (mock)", cd_id, material_id, quantity };
    }
  },

  removeMaterialFromCart: async (cd_id: string | number, cart_id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/job-orders/checklist-items/${cd_id}/cart/${cart_id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to remove material from cart");
      return await res.json();
    } catch (e) {
      console.warn(`Backend unavailable, mock removing material from cart`, e);
      return { message: "Removed material (mock)", cd_id, cart_id };
    }
  },

  updateCartItemDecision: async (cd_id: string | number, cart_id: string, decision: "Buy" | "No") => {
    try {
      const res = await fetch(`${API_BASE_URL}/job-orders/checklist-items/${cd_id}/cart/${cart_id}/decision`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision })
      });
      if (!res.ok) throw new Error("Failed to update cart item decision");
      return await res.json();
    } catch (e) {
      console.warn(`Backend unavailable, mock updating cart decision`, e);
      return { message: "Updated cart decision (mock)", cd_id, cart_id, decision };
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

  updateCartItem: async (cd_id: string | number, cart_id: string, updates: { quantity?: number; price?: number }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/job-orders/checklist-items/${cd_id}/cart/${cart_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error("Failed to update cart item");
      return await res.json();
    } catch (e) {
      console.warn(`Backend unavailable, mock updating cart item`, e);
      return { message: "Updated cart item (mock)", cd_id, cart_id, ...updates };
    }
  },

  updateJobOrder: async (id: string, payload: {
    odometer?: number;
    bundle_id?: string;
    mechanic_names?: string[];
    discount?: number;
    estimate_comment?: string;
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
      console.warn("Backend unavailable, returning empty owners array", e);
      return [];
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
      console.warn("Backend unavailable, returning empty vehicles array", e);
      return [];
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
        intervalKm: b.interval_km || 10000,
        intervalMonths: b.interval_months || 6,
        description: b.description || "",
        servicesIncluded: (b.services || []).map((s: any) => s.labor_name),
        packagePrice: `₱${parseFloat(b.discounted_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        standaloneSum: `₱${parseFloat(b.original_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        popularBadge: false
      }));
    } catch (e) {
      console.warn("Backend unavailable, falling back to empty bundles");
      return [];
    }
  },

  createBundle: async (bundle: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/master/bundles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundle_name: bundle.packageName,
          interval_km: bundle.intervalKm || 10000,
          interval_months: bundle.intervalMonths || 6,
          interval: bundle.targetInterval,
          description: bundle.description || "",
          original_price: typeof bundle.standaloneSum === "number" ? bundle.standaloneSum : parseFloat(bundle.standaloneSum?.replace(/[₱,]/g, "") || "0"),
          discounted_price: typeof bundle.packagePrice === "number" ? bundle.packagePrice : parseFloat(bundle.packagePrice?.replace(/[₱,]/g, "") || "0"),
          labor_ids: bundle.laborIds || []
        })
      });
      if (!res.ok) throw new Error("Failed to create bundle");
      const b = await res.json();
      return {
        id: b.bundle_id,
        packageName: b.bundle_name,
        targetInterval: b.interval,
        intervalKm: b.interval_km || 10000,
        intervalMonths: b.interval_months || 6,
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

  // REMINDERS API
  getReminders: async (filterStatus?: string) => {
    try {
      const url = filterStatus ? `${API_BASE_URL}/reminders?status_filter=${filterStatus}` : `${API_BASE_URL}/reminders`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch reminders");
      const data = await res.json();
      return (data || []).map((r: any) => ({
        id: r.reminder_id,
        joId: r.jo_id,
        vehicleId: r.vehicle_id,
        ownerId: r.owner_id,
        startDate: r.start_date,
        targetDate: r.target_date,
        startOdometer: r.start_odometer,
        targetOdometer: r.target_odometer,
        status: r.status,
        notes: r.notes || "",
        vehicleName: r.vehicle ? `${r.vehicle.year || ""} ${r.vehicle.make || ""} ${r.vehicle.model || ""}`.trim() : "Unknown Vehicle",
        plateNumber: r.vehicle?.plate_number || "N/A",
        ownerName: r.owner?.name || "Unknown Owner",
        ownerPhone: r.owner?.phone_number || "N/A"
      }));
    } catch (e) {
      console.warn("Backend unavailable, returning empty reminders list", e);
      return [];
    }
  },

  createReminder: async (payload: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jo_id: payload.joId,
          vehicle_id: payload.vehicleId,
          owner_id: payload.ownerId,
          start_date: payload.startDate,
          target_date: payload.targetDate,
          start_odometer: payload.startOdometer,
          target_odometer: payload.targetOdometer,
          status: payload.status || "Pending",
          notes: payload.notes
        })
      });
      if (!res.ok) throw new Error("Failed to create reminder");
      return await res.json();
    } catch (e) {
      console.warn("Failed to create reminder", e);
      throw e;
    }
  },

  updateReminder: async (reminderId: string, updates: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reminders/${reminderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_date: updates.targetDate,
          target_odometer: updates.targetOdometer,
          status: updates.status,
          notes: updates.notes
        })
      });
      if (!res.ok) throw new Error("Failed to update reminder");
      return await res.json();
    } catch (e) {
      console.warn("Failed to update reminder", e);
      throw e;
    }
  },

  deleteReminder: async (reminderId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reminders/${reminderId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete reminder");
      return true;
    } catch (e) {
      console.warn("Failed to delete reminder", e);
      throw e;
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
      console.warn("Backend unavailable, returning empty mechanics array", e);
      return [];
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

export const subscribeToJobOrders = (onUpdate: (data?: any) => void) => {
  if (typeof window === "undefined") return () => {};
  const wsUrl = "ws://localhost:8000/ws/job-orders";
  let ws: WebSocket | null = null;
  
  try {
    ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "JOB_ORDER_UPDATED") {
          onUpdate(data);
        }
      } catch (e) {
        onUpdate();
      }
    };
  } catch (e) {
    console.warn("WebSocket connection failed", e);
  }

  return () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };
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

