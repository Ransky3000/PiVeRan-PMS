// apiService.ts - Real API backend service

const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== "") {
    const trimmed = envUrl.trim().replace(/\/+$/, "");
    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
  }
  return "http://localhost:8000/api";
};

export const API_BASE_URL = getApiBaseUrl();

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

  const joId = be.jo_id || be.id || "";
  const vehicleId = be.vehicle_id || be.vehicle?.vehicle_id || be.vehicle?.id || "";
  const ownerId = be.owner_id || be.owner?.owner_id || be.owner?.id || "";

  return {
    id: joId,
    joId,
    vehicleId,
    ownerId,
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
    updatedAt: be.updated_at,
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
    const res = await fetch(`${API_BASE_URL}/job-orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed to update status");
    return await res.json();
  },

  updateInspectionItem: async (id: string | number, payload: {
    status?: string;
    note?: string;
    diagnostic_notes?: string;
    statusNotes?: Record<string, string>;
    statusPhotos?: Record<string, string[]>;
    visual_proof?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/job-orders/checklist-items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed to update inspection item");
    return await res.json();
  },

  addMaterialToCart: async (cd_id: string | number, material_id_or_payload: any, quantity: number = 1) => {
    const bodyPayload = typeof material_id_or_payload === "object"
      ? material_id_or_payload
      : { material_id: material_id_or_payload, quantity };

    const res = await fetch(`${API_BASE_URL}/job-orders/checklist-items/${cd_id}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload)
    });
    if (!res.ok) throw new Error("Failed to add material to cart");
    return await res.json();
  },

  addCartItem: async (cdId: string | number, payload: any) => {
    return apiService.addMaterialToCart(cdId, payload);
  },

  removeCartItem: async (cdId: string | number, cartId: string) => {
    return apiService.removeMaterialFromCart(cdId, cartId);
  },

  updateCartQuantity: async (cdId: string | number, cartId: string, quantity: number) => {
    return apiService.updateCartItemQuantity(cdId, cartId, quantity);
  },

  updateCartItemQuantity: async (cd_id: string | number, cart_id: string, quantity: number) => {
    const res = await fetch(`${API_BASE_URL}/job-orders/checklist-items/${cd_id}/cart/${cart_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity })
    });
    if (!res.ok) throw new Error("Failed to update cart item quantity");
    return await res.json();
  },

  removeMaterialFromCart: async (cd_id: string | number, cart_id: string) => {
    const res = await fetch(`${API_BASE_URL}/job-orders/checklist-items/${cd_id}/cart/${cart_id}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to remove material from cart");
    return await res.json();
  },

  updateCartItemDecision: async (cd_id: string | number, cart_id: string, decision: "Buy" | "No") => {
    const res = await fetch(`${API_BASE_URL}/job-orders/checklist-items/${cd_id}/cart/${cart_id}/decision`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision })
    });
    if (!res.ok) throw new Error("Failed to update cart item decision");
    return await res.json();
  },

  createJobOrder: async (jobOrder: {
    owner_id: string;
    vehicle_id: string;
    bundle_id: string;
    odometer: number;
    mechanic_names: string[];
  }) => {
    const res = await fetch(`${API_BASE_URL}/job-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobOrder)
    });
    if (!res.ok) throw new Error("Failed to create job order");
    const data = await res.json();
    return normalizeJobOrder(data);
  },

  updateCartItem: async (cd_id: string | number, cart_id: string, updates: { quantity?: number; price?: number }) => {
    const res = await fetch(`${API_BASE_URL}/job-orders/checklist-items/${cd_id}/cart/${cart_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error("Failed to update cart item");
    return await res.json();
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
  },

  updateMaterial: async (materialId: string, updates: any) => {
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
  },

  deleteMaterial: async (materialId: string) => {
    const res = await fetch(`${API_BASE_URL}/master/materials/${materialId}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete material");
    return true;
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
      console.warn("Failed to fetch owners list", e);
      return [];
    }
  },

  createOwner: async (owner: any) => {
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
      console.warn("Failed to fetch vehicles list", e);
      return [];
    }
  },

  createVehicle: async (vehicle: any) => {
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
  },

  updateVehicle: async (vehicleId: string, updates: any) => {
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
  },

  deleteVehicle: async (vehicleId: string) => {
    const res = await fetch(`${API_BASE_URL}/master/vehicles/${vehicleId}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete vehicle");
    return true;
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
      console.warn("Failed to fetch labor items", e);
      return [];
    }
  },

  createLabor: async (labor: any) => {
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
  },

  updateLabor: async (laborId: string, updates: any) => {
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
  },

  deleteLabor: async (laborId: string) => {
    const res = await fetch(`${API_BASE_URL}/master/labor/${laborId}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete labor");
    return true;
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
      console.warn("Failed to fetch bundles", e);
      return [];
    }
  },

  createBundle: async (bundle: any) => {
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
        ownerPhone: r.owner?.contact_number || r.owner?.phone_number || "",
        ownerFb: r.owner?.facebook || r.owner?.fb_contact || r.owner?.facebook_url || r.owner?.fb_handle || ""
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
  },

  deleteBundle: async (bundleId: string) => {
    const res = await fetch(`${API_BASE_URL}/master/bundles/${bundleId}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete bundle");
    return true;
  },

  getMechanics: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (!res.ok) throw new Error("Failed to fetch mechanics");
      const users = await res.json();
      return (users || []).filter(
        (u: any) =>
          u.role === "Mechanic" &&
          (u.status === "APPROVED" || u.status !== "PENDING")
      );
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
  if (typeof window === "undefined") return () => { };
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  let wsUrl = "ws://localhost:8000/ws/job-orders";
  if (envUrl && envUrl.trim() !== "") {
    const wsProto = envUrl.startsWith("https") ? "wss:" : "ws:";
    const host = envUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    wsUrl = `${wsProto}//${host}/ws/job-orders`;
  }
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

