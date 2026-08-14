"use client";

import React, { useState, useMemo, useEffect } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import {
  Plus,
  Search,
  CheckCircle2,
  X,
  Send,
  Camera,
  Edit2,
  Check,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Trash2,
  FileText,
  Wrench,
  DollarSign,
  ClipboardCheck,
  ArrowRight,
  Minus,
  Maximize2,
  RotateCcw,
  Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { JobOrder, InspectionItem, EstimateLineItem, DEFAULT_JOB_ORDERS, JOStatus } from "../../mockData";

interface RegisteredOwner {
  id: string;
  name: string;
  phone: string;
  fbHandle: string;
  vehicles: { model: string; plate: string; engine: string }[];
}

export 

/* ───────────────────────────────────────────
   SERVICE DESCRIPTIONS & STATUS HELPERS
   ─────────────────────────────────────────── */

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  "Basic PMS": "Every 10,000 km or 6 months",
  "Major / Full PMS": "Every 40 - 60 km or 24 - 36 months",
  "Heavy PMS Refresh": "Every 80,000 km or 48 months",
  "Change Oil & Brake Check": "Every 5,000 km or 3 months"
};

const getServiceDescription = (serviceType: string, customDesc?: string): string => {
  if (customDesc && customDesc.trim()) return customDesc;
  if (SERVICE_DESCRIPTIONS[serviceType]) return SERVICE_DESCRIPTIONS[serviceType];
  if (serviceType.toLowerCase().includes("basic")) return SERVICE_DESCRIPTIONS["Basic PMS"];
  if (serviceType.toLowerCase().includes("major") || serviceType.toLowerCase().includes("full")) return SERVICE_DESCRIPTIONS["Major / Full PMS"];
  if (serviceType.toLowerCase().includes("heavy")) return SERVICE_DESCRIPTIONS["Heavy PMS Refresh"];
  if (serviceType.toLowerCase().includes("oil")) return SERVICE_DESCRIPTIONS["Change Oil & Brake Check"];
  return "Every 10,000 km or 6 months";
};

const STATUS_CONFIG: Record<JOStatus, { label: string; color: string; bg: string; border: string }> = {
  FOR_INSPECTION: { label: "New", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  AWAITING_ESTIMATE: { label: "Awaiting Estimate", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  IN_REPAIR: { label: "In Repair", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  READY_FOR_PICKUP: { label: "Ready for Pickup", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  COMPLETED: { label: "Job Completed", color: "text-emerald-800", bg: "bg-emerald-100", border: "border-emerald-300" }
};

const SERVICE_FEE_MAP: Record<string, number> = {
  "Basic PMS": 5999,
  "Intermediate PMS": 6800,
  "Major / Full PMS": 5999,
  "Heavy PMS Refresh": 7500,
  "Diagnostic & Brake Service": 3500
};

const getEstimateCalculations = (jo: JobOrder) => {
  const items = jo.estimateItems || [];
  const laborFee = SERVICE_FEE_MAP[jo.serviceType] || 5999;
  const discount = jo.discount || 0;

  const buyItems = items.filter((i) => i.customerApproved !== false);
  const materialsSubtotal = buyItems.reduce((sum, i) => sum + (i.qty * i.unitPrice), 0);
  const isAllBuy = items.length > 0 && items.every((i) => i.customerApproved !== false);
  const isAnyNo = items.some((i) => i.customerApproved === false);

  const materialsLabel = isAllBuy ? "Buy all" : "Only Selected Materials";
  const commentText = isAnyNo ? "Some Materials are provided by Customer" : "Provided by Auto Shop";
  const grandTotal = Math.max(0, materialsSubtotal + laborFee - discount);

  return {
    items,
    laborFee,
    discount,
    materialsSubtotal,
    isAllBuy,
    isAnyNo,
    materialsLabel,
    commentText,
    grandTotal
  };
};

const INSPECTION_STATUS_ICON: Record<string, React.ReactNode> = {
  GOOD: <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
  ISSUE: <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />,
  MONITOR: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
  PENDING: <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-white block shrink-0 mt-0.5" />
};

const getItemPhotos = (item: Partial<InspectionItem>): string[] => {
  if (item.photos && item.photos.length > 0) return item.photos;
  if (item.photoUrl) return [item.photoUrl];
  if (item.status === "ISSUE") {
    return [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80"
    ];
  }
  if (item.status === "MONITOR") {
    return [
      "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&auto=format&fit=crop&q=80"
    ];
  }
  return [];
};

/* ───────────────────────────────────────────
   MAIN PAGE COMPONENT
   ─────────────────────────────────────────── */

export default function JobOrdersPage() {
  const [activeTab, setActiveTab] = useState<"FOR_INSPECTION" | "WORK_IN_PROGRESS" | "READY_FOR_PICKUP" | "JOB_COMPLETED">("WORK_IN_PROGRESS");
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Drawer State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [drawerJobOrder, setDrawerJobOrder] = useState<JobOrder | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [lightboxData, setLightboxData] = useState<{ itemIdx: number; photoIdx: number } | null>(null);

  // Quick "Add New" Modal State
  const [addNewModalType, setAddNewModalType] = useState<"OWNER" | "VEHICLE" | "MECHANIC" | null>(null);
  const [newInputName, setNewInputName] = useState("");

  // Master Data
  const [registeredOwnersDatabase, setRegisteredOwnersDatabase] = useState<RegisteredOwner[]>([
    {
      id: "OWN-102",
      name: "Maria Santos",
      phone: "0918-444-5678",
      fbHandle: "@mariasantos",
      vehicles: [{ model: "Mitsubishi Montero 2020", plate: "XYZ 8888", engine: "Diesel" }]
    },
    {
      id: "OWN-101",
      name: "Juan Dela Cruz",
      phone: "0917-555-1234",
      fbHandle: "@juandelacruz",
      vehicles: [
        { model: "Toyota Vios 2018", plate: "ABC 1234", engine: "Gasoline" },
        { model: "Toyota Wigo 2021", plate: "NGA 5521", engine: "Gasoline" }
      ]
    },
    {
      id: "OWN-103",
      name: "Carlos Reyes",
      phone: "0920-333-9999",
      fbHandle: "@carlosreyes",
      vehicles: [{ model: "Honda Civic 2019", plate: "NMO 5678", engine: "Gasoline" }]
    },
    {
      id: "OWN-104",
      name: "Bong Go",
      phone: "0919-888-7777",
      fbHandle: "@bonggo",
      vehicles: [{ model: "Toyota Fortuner 2021", plate: "NKN 9999", engine: "Diesel" }]
    }
  ]);

  const [availableMechanicsList, setAvailableMechanicsList] = useState<string[]>([
    "Mark Rey", "John Uy", "Rodel Santos", "Rey Duran", "Bernard Caermare", "Roderick Omisol"
  ]);

  // Create Form State
  const [selectedOwnerId, setSelectedOwnerId] = useState("OWN-102");
  const [formOwnerPhone, setFormOwnerPhone] = useState("0918-444-5678");
  const [formOwnerFb, setFormOwnerFb] = useState("@mariasantos");
  const [selectedPlateNumber, setSelectedPlateNumber] = useState("XYZ 8888");
  const [formEngineType, setFormEngineType] = useState("Diesel");
  const [formOdometerKm, setFormOdometerKm] = useState("62400");
  const [formServiceType, setFormServiceType] = useState("Major / Full PMS");
  const [formMechanics, setFormMechanics] = useState<string[]>(["Mark Rey", "John Uy"]);
  const [formVehiclePhotoUrl, setFormVehiclePhotoUrl] = useState<string>("");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormVehiclePhotoUrl(url);
      triggerToast("Vehicle photo uploaded!");
    }
  };

  const currentOwnerObj = useMemo(() => {
    return registeredOwnersDatabase.find((o) => o.id === selectedOwnerId) || registeredOwnersDatabase[0];
  }, [selectedOwnerId, registeredOwnersDatabase]);

  const ownerOptions: SelectOption[] = useMemo(() => registeredOwnersDatabase.map((o) => ({ value: o.id, label: o.name })), [registeredOwnersDatabase]);
  const vehicleOptions: SelectOption[] = useMemo(() => currentOwnerObj.vehicles.map((v) => ({ value: v.plate, label: `${v.model} (${v.plate})` })), [currentOwnerObj]);
  const engineOptions: SelectOption[] = [
    { value: "Gasoline", label: "Gasoline" },
    { value: "Diesel", label: "Diesel" },
    { value: "Hybrid / EV", label: "Hybrid / EV" }
  ];
  const serviceTypeOptions: SelectOption[] = [
    { value: "Basic PMS", label: "Basic PMS (Level 1)" },
    { value: "Major / Full PMS", label: "Major / Full PMS (Level 2)" },
    { value: "Heavy PMS Refresh", label: "Heavy PMS Refresh (Level 3)" }
  ];
  const mechanicOptions: SelectOption[] = useMemo(() => availableMechanicsList.map((m) => ({ value: m, label: m })), [availableMechanicsList]);

  // Service Checklists
  const serviceChecklists: Record<string, { interval: string; items: string[] }> = {
    "Basic PMS": {
      interval: "Every 10,000 km or 6 months",
      items: ["Change engine oil & filter", "Inspect air filter & cabin filter", "Check brake pads & fluid levels", "Tire pressure & tread inspection", "Battery load test & terminal cleaning"]
    },
    "Major / Full PMS": {
      interval: "Every 40 - 60 km or 24 - 36 months",
      items: ["Includes everything from Basic and Intermediate Services", "Replace spark plugs", "Replace brake fluid", "Replace transmission fluid (manual/AT/CVT)", "Replace coolant (radiator flush)", "Replace fuel filter (if applicable)", "Check timing belt or chain condition", "Clean EGR valve/intake manifold (diesel cars)", "Deep diagnostic scan (optional but recommended)", "Test battery load capacity", "Full vehicle road test"]
    },
    "Heavy PMS Refresh": {
      interval: "Every 80,000 km or 48 months",
      items: ["Includes everything from Major Full PMS", "Complete engine overhaul inspection", "Suspension & underchassis bushing overhaul", "Aircon system deep clean & freon recharge"]
    }
  };
  const activeServiceInfo = serviceChecklists[formServiceType] || serviceChecklists["Major / Full PMS"];

  
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const STORAGE_KEY = "piveran_job_orders_v11";
    const saved = localStorage.getItem(STORAGE_KEY);
    const idsToRemove = new Set(["JO-1043", "JO-1044", "JO-1046"]);

    let listToUse: JobOrder[] = DEFAULT_JOB_ORDERS;

    if (saved && saved !== "[]") {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map((jo: any) => ({
            ...jo,
            inspectionItems: (jo.inspectionItems || []).map((item: any) => {
              let status = item.status;
              if (status === "PASS") status = "GOOD";
              else if (status === "FAIL") status = "ISSUE";
              else if (status === "NEEDS_ATTENTION") status = "MONITOR";
              return { ...item, status };
            })
          }));
          const cleaned = normalized.filter((j: any) => !idsToRemove.has(j.id));
          const existingIds = new Set(cleaned.map((j: any) => j.id));
          const missingDefaults = DEFAULT_JOB_ORDERS.filter((d) => !existingIds.has(d.id));
          listToUse = [...cleaned, ...missingDefaults];
        }
      } catch (e) {
        console.warn("localStorage parsing failed, falling back to defaults", e);
      }
    }

    setJobOrders(listToUse);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(listToUse));
    } catch (e) {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        const idsToRemove = new Set(["JO-1043", "JO-1044", "JO-1046"]);
        const cleaned = jobOrders.filter((j) => !idsToRemove.has(j.id));
        localStorage.setItem("piveran_job_orders_v11", JSON.stringify(cleaned));
      } catch (e) {
        console.warn("localStorage quota exceeded, performing storage cleanup");
        try {
          localStorage.clear();
          const idsToRemove = new Set(["JO-1043", "JO-1044", "JO-1046"]);
          const cleaned = jobOrders.filter((j) => !idsToRemove.has(j.id));
          localStorage.setItem("piveran_job_orders_v11", JSON.stringify(cleaned));
        } catch (err) {
          console.error("Storage quota full:", err);
        }
      }
    }
  }, [jobOrders, isLoaded]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOwnerDropdownChange = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    const ownerObj = registeredOwnersDatabase.find((o) => o.id === ownerId);
    if (ownerObj) {
      setFormOwnerPhone(ownerObj.phone);
      setFormOwnerFb(ownerObj.fbHandle);
      if (ownerObj.vehicles.length > 0) {
        setSelectedPlateNumber(ownerObj.vehicles[0].plate);
        setFormEngineType(ownerObj.vehicles[0].engine);
      }
    }
  };

  const handleSaveAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInputName.trim()) return;
    if (addNewModalType === "MECHANIC") {
      setAvailableMechanicsList([...availableMechanicsList, newInputName.trim()]);
      setFormMechanics([...formMechanics, newInputName.trim()]);
      triggerToast(`Added mechanic: ${newInputName.trim()}`);
    } else if (addNewModalType === "OWNER") {
      const newOwner: RegisteredOwner = {
        id: `OWN-${Math.floor(105 + Math.random() * 90)}`,
        name: newInputName.trim(),
        phone: "0917-000-0000",
        fbHandle: `@${newInputName.trim().toLowerCase().replace(/\s+/g, "")}`,
        vehicles: [{ model: "New Vehicle", plate: "NEW 123", engine: "Gasoline" }]
      };
      setRegisteredOwnersDatabase([...registeredOwnersDatabase, newOwner]);
      setSelectedOwnerId(newOwner.id);
      triggerToast(`Added owner: ${newInputName.trim()}`);
    }
    setAddNewModalType(null);
    setNewInputName("");
  };

  const handleSubmitNewJobOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const activeVehicle = currentOwnerObj.vehicles.find((v) => v.plate === selectedPlateNumber) || currentOwnerObj.vehicles[0];
    const checklist = serviceChecklists[formServiceType];
    const newJO: JobOrder = {
      id: `JO-${Math.floor(1045 + Math.random() * 90)}`,
      ownerName: currentOwnerObj.name,
      ownerPhone: formOwnerPhone,
      ownerFb: formOwnerFb,
      vehicleModel: activeVehicle.model,
      plateNumber: activeVehicle.plate,
      engineType: formEngineType,
      odometer: `${parseInt(formOdometerKm || "0").toLocaleString()} KM`,
      serviceType: formServiceType,
      inchargeMechanics: formMechanics,
      status: "FOR_INSPECTION",
      createdAt: "Just now",
      vehiclePhotoUrl: formVehiclePhotoUrl || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
      inspectionItems: checklist
        ? checklist.items.map((item) => ({ name: item, status: "PENDING" as const }))
        : []
    };
    setJobOrders([newJO, ...jobOrders]);
    setFormVehiclePhotoUrl("");
    triggerToast(`Submitted Job Order ${newJO.id} for Inspection!`);
    setIsCreateModalOpen(false);
  };

  /* ─── STATUS PROGRESSION ─── */
  const advanceStatus = (joId: string) => {
    setJobOrders((prev) =>
      prev.map((jo) => {
        if (jo.id !== joId) return jo;
        const next: Record<JOStatus, JOStatus | null> = {
          FOR_INSPECTION: "AWAITING_ESTIMATE",
          AWAITING_ESTIMATE: "IN_REPAIR",
          IN_REPAIR: "READY_FOR_PICKUP",
          READY_FOR_PICKUP: null,
          COMPLETED: null
        };
        const nextStatus = next[jo.status];
        if (!nextStatus) return jo;
        return { ...jo, status: nextStatus };
      })
    );
  };

  /* ─── ESTIMATE HELPERS ─── */
  const updateDrawerJO = (updates: Partial<JobOrder>) => {
    if (!drawerJobOrder) return;
    const updated = { ...drawerJobOrder, ...updates };
    setDrawerJobOrder(updated);
    setJobOrders((prev) => prev.map((jo) => (jo.id === updated.id ? updated : jo)));
  };

  const updateInspectionItemStatus = (idx: number, status: InspectionItem["status"]) => {
    const items = drawerJobOrder?.inspectionItems || [];
    const updatedItems = [...items];
    updatedItems[idx] = { ...updatedItems[idx], status };
    updateDrawerJO({ inspectionItems: updatedItems });
  };

  const updateInspectionItemNote = (idx: number, note: string) => {
    const items = drawerJobOrder?.inspectionItems || [];
    const updatedItems = [...items];
    updatedItems[idx] = { ...updatedItems[idx], mechanicNote: note };
    updateDrawerJO({ inspectionItems: updatedItems });
  };

  const getInspectionProgress = (jo: JobOrder) => {
    const items = jo.inspectionItems || [];
    const total = items.length;
    // Both GOOD (Good) AND MONITOR (Monitor) count as completed!
    const completed = items.filter((i) => i.status === "GOOD" || i.status === "MONITOR").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  };

  const addEstimateLine = () => {
    const items = drawerJobOrder?.estimateItems || [];
    const newItem: EstimateLineItem = {
      id: `E-${Date.now()}`,
      description: "",
      type: "PART",
      qty: 1,
      unitPrice: 0,
      customerApproved: null
    };
    updateDrawerJO({ estimateItems: [...items, newItem] });
  };

  const removeEstimateLine = (lineId: string) => {
    const items = drawerJobOrder?.estimateItems || [];
    updateDrawerJO({ estimateItems: items.filter((i) => i.id !== lineId) });
  };

  const updateEstimateLine = (lineId: string, updates: Partial<EstimateLineItem>) => {
    const items = drawerJobOrder?.estimateItems || [];
    updateDrawerJO({
      estimateItems: items.map((i) => (i.id === lineId ? { ...i, ...updates } : i))
    });
  };

  const toggleCustomerApproval = (lineId: string) => {
    const items = drawerJobOrder?.estimateItems || [];
    updateDrawerJO({
      estimateItems: items.map((i) => {
        if (i.id !== lineId) return i;
        const nextVal = i.customerApproved === true ? false : true;
        return { ...i, customerApproved: nextVal };
      })
    });
  };

  /* ─── COMPUTED VALUES ─── */
  const filteredJobOrders = useMemo(() => {
    return jobOrders.filter((jo) => {
      const matchesSearch =
        jo.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jo.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jo.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jo.plateNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab =
        activeTab === "FOR_INSPECTION"
          ? jo.status === "FOR_INSPECTION"
          : activeTab === "WORK_IN_PROGRESS"
          ? (jo.status === "AWAITING_ESTIMATE" || jo.status === "IN_REPAIR")
          : activeTab === "READY_FOR_PICKUP"
          ? jo.status === "READY_FOR_PICKUP"
          : jo.status === "COMPLETED";
      return matchesSearch && matchesTab;
    });
  }, [jobOrders, searchTerm, activeTab]);

  const drawerEstimateSubtotal = useMemo(() => {
    return (drawerJobOrder?.estimateItems || []).reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  }, [drawerJobOrder?.estimateItems]);

  const drawerApprovedTotal = useMemo(() => {
    return (drawerJobOrder?.estimateItems || [])
      .filter((i) => i.customerApproved === true)
      .reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  }, [drawerJobOrder?.estimateItems]);

  const drawerGrandTotal = useMemo(() => {
    return drawerEstimateSubtotal - (drawerJobOrder?.discount || 0);
  }, [drawerEstimateSubtotal, drawerJobOrder?.discount]);

  /* ─── TAB DEFINITIONS (NEW, WORK IN PROGRESS, READY FOR PICKUP, JOB COMPLETED) ─── */
  const tabDefs: { id: "FOR_INSPECTION" | "WORK_IN_PROGRESS" | "READY_FOR_PICKUP" | "JOB_COMPLETED"; label: string }[] = [
    { id: "FOR_INSPECTION", label: "New" },
    { id: "WORK_IN_PROGRESS", label: "Work in progress" },
    { id: "READY_FOR_PICKUP", label: "Ready for pickup" },
    { id: "JOB_COMPLETED", label: "Job completed" }
  ];

  const tabCounts = useMemo(() => {
    return {
      FOR_INSPECTION: jobOrders.filter((j) => j.status === "FOR_INSPECTION").length,
      WORK_IN_PROGRESS: jobOrders.filter((j) => j.status === "AWAITING_ESTIMATE" || j.status === "IN_REPAIR").length,
      READY_FOR_PICKUP: jobOrders.filter((j) => j.status === "READY_FOR_PICKUP").length,
      JOB_COMPLETED: jobOrders.filter((j) => j.status === "COMPLETED").length
    };
  }, [jobOrders]);

  /* ───────────────────────────────────────────
     RENDER
     ─────────────────────────────────────────── */

  return (
    <TailAdminLayout userRole="FrontDesk" userName="Sir Cedrick" userEmail="cedrick@piveran.com">
      <div className="space-y-4">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Job Order Management</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Front Desk Job Orders</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job Order</span>
          </button>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="px-4 py-2 bg-emerald-700 text-white text-xs font-medium rounded-xl flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TABS & SEARCH */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabDefs.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = tabCounts[tab.id] || 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    isActive ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 rounded-md ${isActive ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search JO #, Owner, Plate..."
              className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-slate-400 w-48 sm:w-56 font-normal"
            />
          </div>
        </div>

        {/* CARD GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredJobOrders.map((jo) => {
            const sc = STATUS_CONFIG[jo.status];
            const badgeLabel =
              activeTab === "WORK_IN_PROGRESS"
                ? "Work in progress"
                : activeTab === "READY_FOR_PICKUP"
                ? "Ready for pickup"
                : sc.label;
            return (
              <div
                key={jo.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group max-w-xs w-full cursor-pointer"
                onClick={() => setDrawerJobOrder({ ...jo })}
              >
                <div className="h-40 bg-slate-100 relative flex items-center justify-center border-b border-slate-200 overflow-hidden">
                  <div className={`absolute top-3 left-3 ${sc.bg} ${sc.color} ${sc.border} border backdrop-blur-md font-medium text-xs px-3 py-1 rounded-xl shadow-xs`}>
                    {badgeLabel}
                  </div>

                  {jo.vehiclePhotoUrl ? (
                    <img
                      src={jo.vehiclePhotoUrl}
                      alt={jo.vehicleModel}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center space-y-1 text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200/70 flex items-center justify-center mx-auto text-slate-500">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-medium text-slate-400">Photo</div>
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-4 flex-1">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {jo.vehicleModel}
                    </h3>
                    <p className="text-xs font-normal text-slate-500 mt-1">
                      Owner: <span className="text-slate-800 font-medium">{jo.ownerName}</span>
                    </p>
                  </div>

                  <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                    <div className="flex items-start justify-between">
                      <span className="text-slate-500 font-normal">Service type:</span>
                      <span className="font-medium text-slate-900">{jo.serviceType}</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="text-slate-500 font-normal text-[11px]">Incharge Mechanics:</div>
                      <div className="flex flex-wrap gap-1">
                        {jo.inchargeMechanics.map((mech, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-700 font-normal text-[11px] px-2.5 py-0.5 rounded-lg border border-slate-200/80"
                          >
                            {mech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Inspection Checklist Progress Bar (Matching user mockup) */}
                    {jo.inspectionItems && jo.inspectionItems.length > 0 && jo.status !== "FOR_INSPECTION" && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-normal">Inspection Checklist</span>
                          <span className="font-bold text-purple-600 text-xs">
                            {getInspectionProgress(jo).completed}/{getInspectionProgress(jo).total} Completed
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${getInspectionProgress(jo).percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <span className="text-[11px] text-slate-400 font-normal">{jo.createdAt}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* ═══════════════════════════════════════════
          RIGHT-SIDE SLIDE-IN DRAWER
          ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {drawerJobOrder && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerJobOrder(null)}
              className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-xs"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[500px] bg-white border-l border-slate-200 shadow-2xl flex flex-col"
            >
              {/* ── DRAWER HEADER (FIXED - EXACT MATCH FOR EXCALIDRAW MOCKUP) ── */}
              <div className="shrink-0 px-5 py-4 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <h2 className="text-base font-bold text-slate-900 truncate">{drawerJobOrder.vehicleModel}</h2>
                  </div>

                  <button
                    onClick={() => setDrawerJobOrder(null)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ── DRAWER BODY (SCROLLABLE) ── */}
              <div className="flex-1 overflow-y-auto">

                {/* SECTION 1: Vehicle Info & Incharge Mechanics */}
                <div className="px-5 py-4 border-b border-slate-100 space-y-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase mb-1">
                    <FileText className="w-3.5 h-3.5" /> Vehicle Info
                  </div>
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                    <div><span className="text-slate-500">Owner</span><div className="font-medium text-slate-900">{drawerJobOrder.ownerName}</div></div>
                    <div><span className="text-slate-500">Phone</span><div className="font-medium text-slate-900">{drawerJobOrder.ownerPhone}</div></div>
                    <div><span className="text-slate-500">Plate</span><div className="font-medium text-slate-900">{drawerJobOrder.plateNumber}</div></div>
                    <div><span className="text-slate-500">Engine</span><div className="font-medium text-slate-900">{drawerJobOrder.engineType}</div></div>
                    <div><span className="text-slate-500">Odometer</span><div className="font-medium text-slate-900">{drawerJobOrder.odometer}</div></div>
                    <div><span className="text-slate-500">Service Category</span><div className="font-medium text-slate-900">{drawerJobOrder.serviceType}</div></div>
                  </div>

                  <div className="pt-2 border-t border-slate-100/80">
                    <span className="text-slate-500 font-medium text-xs block">Service Description</span>
                    <div className="font-semibold text-slate-800 text-xs mt-0.5">
                      {getServiceDescription(drawerJobOrder.serviceType, drawerJobOrder.serviceDescription)}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100/80">
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase mb-1.5">
                      <Wrench className="w-3.5 h-3.5 text-slate-400" /> Incharge Mechanics
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {drawerJobOrder.inchargeMechanics && drawerJobOrder.inchargeMechanics.length > 0 ? (
                        drawerJobOrder.inchargeMechanics.map((m, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 text-slate-800 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            {m}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>



                {/* SECTION 2: Inspection Checklist Results */}
                {drawerJobOrder.inspectionItems && drawerJobOrder.inspectionItems.length > 0 && (
                  <div className="px-5 py-4 border-b border-slate-100 space-y-3 text-xs">
                    <div className="space-y-1.5 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase">
                          <ClipboardCheck className="w-3.5 h-3.5" /> Inspection Checklist
                        </div>
                        {drawerJobOrder.status !== "FOR_INSPECTION" && (
                          <span className="font-bold text-purple-600 text-xs">
                            {getInspectionProgress(drawerJobOrder).completed}/{getInspectionProgress(drawerJobOrder).total} Completed
                          </span>
                        )}
                      </div>
                      {drawerJobOrder.status !== "FOR_INSPECTION" && (
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${getInspectionProgress(drawerJobOrder).percent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* ACCORDION CHECKLIST STACK (Excalidraw sketch layout) */}
                    <div className="space-y-2.5">
                      {drawerJobOrder.inspectionItems.map((item, idx) => {
                        const isNewJob = drawerJobOrder.status === "FOR_INSPECTION";
                        const effectiveStatus = isNewJob ? "PENDING" : item.status;
                        const isExpanded = expandedIndex === idx;
                        const photos = getItemPhotos(item);

                        const statusLabel =
                          effectiveStatus === "GOOD" ? "Good" :
                          effectiveStatus === "ISSUE" ? "Issue" :
                          effectiveStatus === "MONITOR" ? "Monitor" : "Pending";

                        const statusColorClass =
                          effectiveStatus === "GOOD" ? "text-emerald-600" :
                          effectiveStatus === "ISSUE" ? "text-red-600" :
                          effectiveStatus === "MONITOR" ? "text-amber-600" : "text-slate-500";

                        const badgeBgClass =
                          effectiveStatus === "GOOD" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          effectiveStatus === "ISSUE" ? "bg-red-50 text-red-600 border-red-200" :
                          effectiveStatus === "MONITOR" ? "bg-amber-50 text-amber-600 border-amber-200" :
                          "bg-slate-100 text-slate-500 border-slate-200";

                        return (
                          <div
                            key={idx}
                            className={`border rounded-2xl transition-all overflow-hidden bg-white ${
                              isExpanded
                                ? "border-slate-300 shadow-xs"
                                : "border-slate-200"
                            }`}
                          >
                            {/* ACCORDION HEADER (LIGHT DARK BG WHEN EXPANDED) */}
                            <div
                              onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                              className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                                isExpanded
                                  ? "bg-slate-100/90 border-b border-slate-200/80"
                                  : "bg-slate-50/70 hover:bg-slate-100/80"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="shrink-0">{INSPECTION_STATUS_ICON[effectiveStatus || "PENDING"]}</div>
                                <span className="font-bold text-slate-800 text-xs truncate">{item.name}</span>
                              </div>
                              <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            </div>

                            {/* ACCORDION BODY (EXPANDED MATCHING EXCALIDRAW SKETCH) */}
                            {isExpanded && (
                              <div className="px-4 pb-4 pt-3 border-t border-slate-100 bg-white space-y-4 text-xs">
                                {/* 1. STATUS */}
                                <div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    STATUS
                                  </div>
                                  <div className={`text-sm font-bold ${statusColorClass}`}>
                                    {statusLabel}
                                  </div>
                                </div>

                                {/* 2. DIAGNOSTIC NOTES & VISUAL PROOF (Hidden when status is PENDING) */}
                                {effectiveStatus !== "PENDING" && (
                                  <>
                                    <div>
                                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        DIAGNOSTIC NOTES
                                      </div>
                                      <div className="text-xs text-slate-800 font-medium leading-relaxed">
                                        {item.mechanicNote ? (
                                          item.mechanicNote
                                        ) : (
                                          <span className="text-slate-400 italic font-normal">No diagnostic notes recorded.</span>
                                        )}
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                          VISUAL PROOF
                                        </span>
                                        {photos.length > 0 && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setLightboxData({ itemIdx: idx, photoIdx: 0 });
                                            }}
                                            className="text-slate-500 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                            title="Expand Fullscreen Lightbox"
                                          >
                                            <Maximize2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>

                                      {photos.length > 0 ? (
                                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                          {photos.map((photoUrl, pIdx) => (
                                            <div
                                              key={pIdx}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setLightboxData({ itemIdx: idx, photoIdx: pIdx });
                                              }}
                                              className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 cursor-pointer group hover:border-purple-500 transition-all shadow-2xs"
                                            >
                                              <img src={photoUrl} alt={`Proof ${pIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-[11px] text-slate-400 italic py-1">No visual proof attached.</div>
                                      )}
                                    </div>
                                  </>
                                )}

                                {/* 4. MATERIALS NEEDED / APPLIED (Excalidraw Cases 1, 2, 3, 4) */}
                                {item.requiredMaterials && item.requiredMaterials.length > 0 && (effectiveStatus === "ISSUE" || effectiveStatus === "GOOD") && (
                                  <div>
                                    {effectiveStatus === "ISSUE" ? (
                                      /* CASE 1: Issue -> MATERIALS NEEDED & QUANTITY */
                                      <>
                                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
                                          <span>MATERIALS NEEDED</span>
                                          <span>QUANTITY</span>
                                        </div>
                                        <div className="space-y-1">
                                          {item.requiredMaterials.map((m: any, mIdx: number) => {
                                            const name = typeof m === "object" ? m.name : m;
                                            const qty = typeof m === "object" ? m.qty : 1;
                                            return (
                                              <div key={mIdx} className="flex items-center justify-between py-1 px-0.5 text-xs font-semibold text-slate-800">
                                                <span>{name}</span>
                                                <span className="font-extrabold text-slate-900 text-xs">{qty}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </>
                                    ) : (
                                      /* CASE 2: Good -> MATERIALS APPLIED (Checkmark + Material Name, no quantity column) */
                                      <>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
                                          MATERIALS APPLIED
                                        </div>
                                        <div className="space-y-1">
                                          {item.requiredMaterials.map((m: any, mIdx: number) => {
                                            const name = typeof m === "object" ? m.name : m;
                                            return (
                                              <div key={mIdx} className="flex items-center gap-2 py-1 px-0.5 text-xs font-semibold text-slate-800">
                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>{name}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}

                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SECTION 3: ESTIMATE (EXACT MATCH FOR USER EXCALIDRAW MOCKUP) */}
                {drawerJobOrder && drawerJobOrder.status !== "FOR_INSPECTION" && (
                  <div className="px-5 py-4 border-b border-slate-100 space-y-3.5 text-xs">
                    {/* Header with Title & Buy All master toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase">
                        <FileText className="w-3.5 h-3.5" /> Estimate
                      </div>
                      
                      {(() => {
                        const items = drawerJobOrder.estimateItems || [];
                        const isAllBuy = items.length > 0 && items.every((i) => i.customerApproved !== false);
                        return (
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 font-semibold select-none">
                            <span>Buy all</span>
                            <input
                              type="checkbox"
                              checked={isAllBuy}
                              onChange={(e) => {
                                const nextVal = e.target.checked;
                                const updatedItems = (drawerJobOrder.estimateItems || []).map((i) => ({
                                  ...i,
                                  customerApproved: nextVal
                                }));
                                updateDrawerJO({ estimateItems: updatedItems });
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </label>
                        );
                      })()}
                    </div>

                    {/* ESTIMATE ITEM CARDS */}
                    <div className="space-y-2.5">
                      {(drawerJobOrder.estimateItems || []).map((item) => {
                        const isBuy = item.customerApproved !== false;
                        const lineTotal = item.qty * item.unitPrice;
                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-2xl border transition-all ${
                              isBuy
                                ? "bg-white border-slate-200/90 shadow-2xs"
                                : "bg-slate-50/80 border-slate-200/60 opacity-80"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <span className="font-semibold text-slate-800 text-xs truncate">{item.description}</span>
                              
                              {/* Buy / No Toggle Switch (COMPACT SIZE) */}
                              <div className="inline-flex items-center bg-slate-900 p-0.5 rounded-full shadow-2xs shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateEstimateLine(item.id, { customerApproved: true })}
                                  className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full transition-all cursor-pointer select-none ${
                                    isBuy
                                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                                      : "text-white/90 hover:text-white font-medium"
                                  }`}
                                >
                                  Buy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateEstimateLine(item.id, { customerApproved: false })}
                                  className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full transition-all cursor-pointer select-none ${
                                    !isBuy
                                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                                      : "text-white/90 hover:text-white font-medium"
                                  }`}
                                >
                                  No
                                </button>
                              </div>
                            </div>

                            {/* Quantity, Unit Price Input, and Line Total */}
                            <div className="flex items-center justify-between text-slate-500 text-xs">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-slate-400 font-normal">Quantity</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.qty}
                                    onChange={(e) =>
                                      updateEstimateLine(item.id, { qty: Math.max(1, parseInt(e.target.value) || 1) })
                                    }
                                    className="w-12 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-center font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/20 text-xs"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] text-slate-400 font-normal">₱</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.unitPrice}
                                    onChange={(e) =>
                                      updateEstimateLine(item.id, { unitPrice: Math.max(0, parseInt(e.target.value) || 0) })
                                    }
                                    className="w-16 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-center font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/20 text-xs"
                                  />
                                </div>
                              </div>
                              <span className="font-semibold text-slate-900 text-xs">
                                ₱{lineTotal.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* SUMMARY BOX (EMERALD APP THEME MATCH) */}
                    {(() => {
                      const calc = getEstimateCalculations(drawerJobOrder);
                      return (
                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 mt-3 text-xs">
                          <div className="flex items-center justify-between font-normal text-slate-600">
                            <span>{calc.materialsLabel}</span>
                            <span className="font-medium text-slate-900">₱{calc.materialsSubtotal.toLocaleString()}</span>
                          </div>

                          <div className="flex items-center justify-between font-normal text-slate-600">
                            <span>{drawerJobOrder.serviceType}</span>
                            <span className="font-medium text-slate-900">₱{calc.laborFee.toLocaleString()}</span>
                          </div>

                          <div className="flex items-center justify-between font-normal text-slate-600">
                            <span>Discount</span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 font-normal">₱</span>
                              <input
                                type="number"
                                min="0"
                                value={drawerJobOrder.discount || 0}
                                onChange={(e) =>
                                  updateDrawerJO({ discount: Math.max(0, parseInt(e.target.value) || 0) })
                                }
                                className="w-16 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-right font-medium text-slate-900 outline-none focus:border-emerald-500 text-xs"
                              />
                            </div>
                          </div>

                          <div className="border-t border-dashed border-slate-300/80 pt-2 space-y-1.5">
                            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                              <span className="shrink-0 font-normal text-slate-600">Comment</span>
                              <input
                                type="text"
                                value={drawerJobOrder.estimateComment !== undefined ? drawerJobOrder.estimateComment : calc.commentText}
                                onChange={(e) => updateDrawerJO({ estimateComment: e.target.value })}
                                placeholder={calc.commentText}
                                className="w-full max-w-[260px] bg-white border border-slate-200 rounded-md px-2 py-0.5 text-right font-normal text-slate-700 outline-none focus:border-emerald-500 text-xs"
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-900 pt-1">
                              <span>Grand Total</span>
                              <span className="text-emerald-700 font-bold text-sm">₱{calc.grandTotal.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

              </div>

              {/* ── DRAWER FOOTER (FIXED) ── */}
              <div className="shrink-0 px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end gap-2">
                <button
                  onClick={() => setDrawerJobOrder(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Close
                </button>



                {drawerJobOrder.status !== "READY_FOR_PICKUP" && drawerJobOrder.status !== "COMPLETED" && (
                  (() => {
                    const progress = getInspectionProgress(drawerJobOrder);
                    const isCompleted = (progress.total > 0 && progress.completed === progress.total) || drawerJobOrder.mechanicMarkedReady;
                    return isCompleted ? (
                      <button
                        onClick={() => {
                          const updated = { ...drawerJobOrder, status: "READY_FOR_PICKUP" as JOStatus };
                          setJobOrders((prev) =>
                            prev.map((jo) => (jo.id === drawerJobOrder.id ? updated : jo))
                          );
                          setDrawerJobOrder(updated);
                          try {
                            const key = "piveran_job_orders_v11";
                            const currentSaved = localStorage.getItem(key);
                            const parsed = currentSaved ? JSON.parse(currentSaved) : [];
                            const newSaved = parsed.map((j: any) => (j.id === updated.id ? { ...j, status: "READY_FOR_PICKUP" } : j));
                            localStorage.setItem(key, JSON.stringify(newSaved));
                          } catch (e) {}
                          triggerToast(`${drawerJobOrder.id} → Moved to Ready for pickup`);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>Ready for pickup</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-2 bg-slate-200 text-slate-400 font-medium text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-not-allowed opacity-70"
                        title="Unlocks once mechanics complete the inspection checklist items (100% completed)"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>Ready for pickup</span>
                      </button>
                    );
                  })()
                )}

                {drawerJobOrder.status === "READY_FOR_PICKUP" && (
                  <>
                    <button
                      onClick={() => {
                        setJobOrders((prev) =>
                          prev.map((jo) => (jo.id === drawerJobOrder.id ? { ...jo, status: "AWAITING_ESTIMATE" } : jo))
                        );
                        setDrawerJobOrder({ ...drawerJobOrder, status: "AWAITING_ESTIMATE" });
                        triggerToast(`${drawerJobOrder.id} → Moved back to Work in progress`);
                      }}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 font-medium text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Move to work
                    </button>

                    <button
                      onClick={() => {
                        triggerToast(`${drawerJobOrder.id} — Printing receipt...`);
                        setDrawerJobOrder(null);
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      Complete & Print Receipt
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          CREATE JOB ORDER MODAL
          ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-900 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <h2 className="text-base font-bold text-slate-900">Create Job Order</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitNewJobOrder} className="flex-1 overflow-y-auto pr-1.5 py-2 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Select Owner</label>
                  <CustomSelect value={selectedOwnerId} onChange={handleOwnerDropdownChange} options={ownerOptions} onAddNew={() => { setAddNewModalType("OWNER"); setNewInputName(""); }} addNewLabel="New Owner" className="w-full" />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Select Vehicle</label>
                  <CustomSelect value={selectedPlateNumber} onChange={(val) => { setSelectedPlateNumber(val); const match = currentOwnerObj.vehicles.find((v) => v.plate === val); if (match) setFormEngineType(match.engine); }} options={vehicleOptions} onAddNew={() => triggerToast("Opening Add New Vehicle modal...")} addNewLabel="New Vehicle" className="w-full" />
                </div>

                {/* Vehicle Photo Upload Card (Redesigned with Camera Icon & Dashed Border) */}
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Vehicle Photo</label>
                  {formVehiclePhotoUrl ? (
                    <div className="relative w-full h-36 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-100 shadow-xs group">
                      <img src={formVehiclePhotoUrl} alt="Vehicle preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormVehiclePhotoUrl("")}
                        className="absolute top-2 right-2 p-1.5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition-colors cursor-pointer shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="bg-slate-50/80 hover:bg-emerald-50/70 border-2 border-dashed border-slate-300 hover:border-emerald-500/80 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[95px] shadow-2xs group">
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                      <div className="w-10 h-10 rounded-full bg-slate-200/70 group-hover:bg-emerald-100 group-hover:scale-110 flex items-center justify-center text-slate-600 group-hover:text-emerald-700 transition-all duration-200 mb-1">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] text-slate-400 group-hover:text-emerald-700 font-normal transition-colors">
                        Click to open camera or browse image
                      </span>
                    </label>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">FB Contact</label>
                    <input type="text" value={formOwnerFb} onChange={(e) => setFormOwnerFb(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-normal text-slate-800 outline-none focus:border-emerald-600" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Phone Number</label>
                    <input type="text" value={formOwnerPhone} onChange={(e) => setFormOwnerPhone(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-normal text-slate-800 outline-none focus:border-emerald-600" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Engine Type</label>
                    <CustomSelect value={formEngineType} onChange={setFormEngineType} options={engineOptions} searchable={false} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Odometer (Km)</label>
                    <input type="number" required value={formOdometerKm} onChange={(e) => setFormOdometerKm(e.target.value)} placeholder="62400" className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-normal text-slate-800 outline-none focus:border-emerald-600" />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Service Type</label>
                  <CustomSelect value={formServiceType} onChange={setFormServiceType} options={serviceTypeOptions} searchable={false} className="w-full" />
                </div>
                {activeServiceInfo && (
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5 text-xs">
                    <div className="grid grid-cols-3 gap-2 border-b border-slate-200/80 pb-2">
                      <span className="text-slate-500 font-medium">Service description:</span>
                      <span className="col-span-2 text-slate-700">{activeServiceInfo.interval}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 font-medium">Checklist:</span>
                      <div className="col-span-2 space-y-1.5">
                        {activeServiceInfo.items.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-slate-700">
                            <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-white shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Mechanics Involve</label>
                  <CustomSelect value={formMechanics} onChange={setFormMechanics} options={mechanicOptions} isMultiSelect={true} dropUp={true} onAddNew={() => { setAddNewModalType("MECHANIC"); setNewInputName(""); }} addNewLabel="New Mechanic" placeholder="Select mechanics..." className="w-full" />
                </div>
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 font-medium text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5">
                    <Send className="w-4 h-4" /><span>Submit for Inspection</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK ADD NEW MODAL */}
      <AnimatePresence>
        {addNewModalType && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.1 }}
              className="bg-white rounded-xl max-w-xs w-full p-4 shadow-xl space-y-3 border border-slate-200 text-slate-900"
            >
              <form onSubmit={handleSaveAddNew} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">{addNewModalType === "MECHANIC" ? "Mechanic Name" : "Owner Name"}</label>
                  <input type="text" required value={newInputName} onChange={(e) => setNewInputName(e.target.value)} placeholder={addNewModalType === "MECHANIC" ? "Hitler Gaitera" : "Pedro Penduko"} className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal text-slate-800 outline-none focus:border-emerald-600" autoFocus />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setAddNewModalType(null)} className="px-3 py-1.5 text-slate-600 font-medium text-xs rounded-lg hover:bg-slate-100">Cancel</button>
                  <button type="submit" className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-lg shadow-xs">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FULLSCREEN DESKTOP LIGHTBOX MODAL (Matching User Sketch) ── */}
      <AnimatePresence>
        {lightboxData && drawerJobOrder && (
          <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex flex-col p-6 text-white">
            {/* Lightbox Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">
                  {drawerJobOrder.inspectionItems?.[lightboxData.itemIdx]?.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Visual Proof — Photo {lightboxData.photoIdx + 1} of{" "}
                  {getItemPhotos(drawerJobOrder.inspectionItems?.[lightboxData.itemIdx] || {}).length}
                </p>
              </div>
              <button
                onClick={() => setLightboxData(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>close</span>
              </button>
            </div>

            {/* Lightbox Body (Left thumbnail column + Main large photo view) */}
            <div className="flex-1 flex gap-6 pt-6 overflow-hidden min-h-0">
              {/* Left Column: Vertical Thumbnails List */}
              {(() => {
                const currentItem = drawerJobOrder.inspectionItems?.[lightboxData.itemIdx];
                const photos = currentItem ? getItemPhotos(currentItem) : [];

                return (
                  <div className="w-28 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
                    {photos.map((photo, pIdx) => {
                      const isActive = pIdx === lightboxData.photoIdx;
                      return (
                        <div
                          key={pIdx}
                          onClick={() => setLightboxData({ itemIdx: lightboxData.itemIdx, photoIdx: pIdx })}
                          className={`relative w-24 h-24 rounded-2xl border-2 overflow-hidden bg-slate-900 cursor-pointer transition-all shrink-0 group ${
                            isActive ? "border-purple-500 ring-2 ring-purple-500/50 scale-102" : "border-slate-800 hover:border-slate-600"
                          }`}
                        >
                          <img src={photo} alt={`Thumbnail ${pIdx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Main Center Area: Large Photo Display */}
              <div className="flex-1 bg-slate-900/80 rounded-3xl border border-slate-800/80 flex items-center justify-center p-4 relative overflow-hidden">
                {(() => {
                  const currentItem = drawerJobOrder.inspectionItems?.[lightboxData.itemIdx];
                  const photos = currentItem ? getItemPhotos(currentItem) : [];
                  const activePhoto = photos[lightboxData.photoIdx];

                  return activePhoto ? (
                    <img
                      src={activePhoto}
                      alt="Fullscreen proof preview"
                      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                    />
                  ) : (
                    <div className="text-slate-500 italic text-sm">No photo available</div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </TailAdminLayout>
  );
}
