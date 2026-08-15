"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { apiService } from "@/app/apiService";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import {
  Search,
  CheckCircle2,
  X,
  Camera,
  Check,
  AlertTriangle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Wrench,
  DollarSign,
  ClipboardCheck,
  ArrowRight,
  FileText,
  Plus,
  Package,
  Maximize2,
  RotateCcw,
  Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { JobOrder, InspectionItem, EstimateLineItem, DEFAULT_JOB_ORDERS, JOStatus, MaterialRequirement } from "../../mockData";




/* ───────────────────────────────────────────
   SERVICE DESCRIPTIONS
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

/* ───────────────────────────────────────────
   PRESET MATERIALS CATALOG
   ─────────────────────────────────────────── */

const INITIAL_MATERIAL_OPTIONS: SelectOption[] = [
  { value: "Engine Oil (5W-40 Synthetic 1L)", label: "Engine Oil (5W-40 Synthetic 1L)" },
  { value: "Oil Filter", label: "Oil Filter" },
  { value: "Air Filter", label: "Air Filter" },
  { value: "Cabin Air Filter", label: "Cabin Air Filter" },
  { value: "Spark Plugs (NGK Iridium)", label: "Spark Plugs (NGK Iridium)" },
  { value: "Brake Fluid (DOT4 1L)", label: "Brake Fluid (DOT4 1L)" },
  { value: "Front Brake Pads (Set)", label: "Front Brake Pads (Set)" },
  { value: "Rear Brake Pads (Set)", label: "Rear Brake Pads (Set)" },
  { value: "Radiator Coolant (1L)", label: "Radiator Coolant (1L)" },
  { value: "Transmission Fluid (ATF 1L)", label: "Transmission Fluid (ATF 1L)" },
  { value: "Serpentine Drive Belt", label: "Serpentine Drive Belt" },
  { value: "Wiper Blades (Pair)", label: "Wiper Blades (Pair)" },
  { value: "Valve Cover Gasket Set", label: "Valve Cover Gasket Set" },
  { value: "EGR Cleaner Spray", label: "EGR Cleaner Spray" }
];

/* ───────────────────────────────────────────
   HELPERS & CONFIG
   ─────────────────────────────────────────── */

const getJobBadgeConfig = (jo: JobOrder) => {
  if (jo.status === "FOR_INSPECTION") {
    if (jo.inspectionStarted) {
      return { label: "Work in progress", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" };
    }
    return { label: "New", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
  }
  if (jo.status === "IN_REPAIR") {
    return { label: "Work in progress", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" };
  }
  if (jo.status === "AWAITING_ESTIMATE") {
    return { label: "Awaiting Estimate", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" };
  }
  if (jo.status === "READY_FOR_PICKUP") {
    return { label: "Ready for Pickup", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" };
  }
  return { label: jo.status, color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200" };
};

const INSPECTION_STATUS_ICON: Record<string, React.ReactNode> = {
  GOOD: <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
  ISSUE: <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />,
  MONITOR: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
  PENDING: <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-white block shrink-0 mt-0.5" />
};

const getInspectionProgress = (jo: JobOrder | null) => {
  if (!jo) return { completed: 0, total: 0, isAllCompleted: false, text: "0/0 Completed" };
  const items = jo.inspectionItems || [];
  const total = items.length;
  // ONLY GOOD (Good) and MONITOR (Monitor) count as completed.
  // PENDING and ISSUE (Issue) are NOT considered completed!
  const completed = items.filter((i) => i.status === "GOOD" || i.status === "MONITOR").length;
  const isAllCompleted = total > 0 && completed === total;
  return {
    completed,
    total,
    isAllCompleted,
    text: `${completed}/${total} Completed`
  };
};

/* ───────────────────────────────────────────
   MAIN PAGE COMPONENT
   ─────────────────────────────────────────── */

export default function MechanicJobBoardPage() {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"NEW" | "WIP" | "FOR_VERIFICATION" | "JOB_COMPLETED">("WIP");
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [drawerJobOrder, setDrawerJobOrder] = useState<JobOrder | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Materials master list & quick modal state
  const [materialsList, setMaterialsList] = useState<SelectOption[]>(INITIAL_MATERIAL_OPTIONS);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [newMaterialInput, setNewMaterialInput] = useState("");

  // State for 4-Step Inline Add Material Flow (Excalidraw mockup match)
  const [activeAddMaterialItemIdx, setActiveAddMaterialItemIdx] = useState<number | null>(null);
  const [addMaterialStep, setAddMaterialStep] = useState<"SELECT_PART" | "SET_QUANTITY">("SELECT_PART");
  const [selectedPartName, setSelectedPartName] = useState<string | null>(null);
  const [addMaterialQtyInput, setAddMaterialQtyInput] = useState<number>(1);
  const [materialSearchQuery, setMaterialSearchQuery] = useState<string>("");

  /* ─── DEFAULT JOB ORDERS CONSTANT ─── */
  const DEFAULT_JOB_ORDERS: JobOrder[] = [
    // 1. ACTIVE WORK IN PROGRESS JOB
    {
      id: "JO-1042",
      ownerName: "Juan Dela Cruz",
      ownerPhone: "0917-555-1234",
      ownerFb: "@juandelacruz",
      vehicleModel: "Toyota Vios 2018",
      plateNumber: "ABC 1234",
      engineType: "Gasoline",
      odometer: "45,210 KM",
      serviceType: "Basic PMS",
      inchargeMechanics: ["Rodel Santos"],
      status: "FOR_INSPECTION",
      createdAt: "Today, 10:15 AM",
      vehiclePhotoUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
      inspectionItems: [
        { name: "Change engine oil & filter", status: "GOOD" },
        {
          name: "Inspect air filter & cabin filter",
          status: "ISSUE",
          mechanicNote: "Air filter clogged with dirt, needs replacement",
          requiredMaterials: ["Air Filter", "Cabin Air Filter"]
        },
        {
          name: "Check brake pads & fluid levels",
          status: "MONITOR",
          mechanicNote: "Front brake pads at 30% wear, monitor next 5k km"
        },
        { name: "Tire pressure & tread inspection", status: "PENDING" },
        { name: "Battery load test & terminal cleaning", status: "PENDING" }
      ],
      mechanicFindings: "Engine oil changed cleanly. Air filter requires replacement. Front brake pads near wear limit.",
      inspectionStarted: true
    },
    // 2. NEW MOCKUP #1
    {
      id: "JO-1045",
      ownerName: "Ana Lim",
      ownerPhone: "0917-111-2222",
      ownerFb: "@analim",
      vehicleModel: "Nissan Navara 2022",
      plateNumber: "NVR 4321",
      engineType: "Diesel",
      odometer: "28,500 KM",
      serviceType: "Change Oil & Brake Check",
      inchargeMechanics: ["Mark Rey"],
      status: "FOR_INSPECTION",
      createdAt: "Today, 1:45 PM",
      vehiclePhotoUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80",
      inspectionItems: [
        { name: "Change engine oil & filter", status: "PENDING" },
        { name: "Inspect air filter & cabin filter", status: "PENDING" },
        { name: "Check brake pads & fluid levels", status: "PENDING" },
        { name: "Tire pressure & tread inspection", status: "PENDING" },
        { name: "Battery load test & terminal cleaning", status: "PENDING" }
      ],
      inspectionStarted: false
    },
    // 3. NEW MOCKUP #2
    {
      id: "JO-1046",
      ownerName: "Pedro Cruz",
      ownerPhone: "0918-333-4444",
      ownerFb: "@pedrocruz",
      vehicleModel: "Honda CR-V 2020",
      plateNumber: "CRV 8765",
      engineType: "Gasoline",
      odometer: "38,900 KM",
      serviceType: "Aircon & Electrical Check",
      inchargeMechanics: ["Rodel Santos"],
      status: "FOR_INSPECTION",
      createdAt: "Today, 2:10 PM",
      vehiclePhotoUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80",
      inspectionItems: [
        { name: "Check aircon compressor & belt", status: "PENDING" },
        { name: "Test cabin blower & freon level", status: "PENDING" },
        { name: "Inspect battery & alternator charging", status: "PENDING" },
        { name: "Check headlights, signals & brake lights", status: "PENDING" },
        { name: "Scan diagnostic trouble codes", status: "PENDING" }
      ],
      inspectionStarted: false
    },
    // 4. NEW MOCKUP #3
    {
      id: "JO-1047",
      ownerName: "Vicente Sotto",
      ownerPhone: "0919-777-8888",
      ownerFb: "@vicesotto",
      vehicleModel: "Ford Ranger 2021",
      plateNumber: "RNG 9988",
      engineType: "Diesel",
      odometer: "51,200 KM",
      serviceType: "Suspension & Engine Tune-up",
      inchargeMechanics: ["Mark Rey", "Rodel Santos"],
      status: "FOR_INSPECTION",
      createdAt: "Today, 2:30 PM",
      vehiclePhotoUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop&q=80",
      inspectionItems: [
        { name: "Inspect front & rear shock absorbers", status: "PENDING" },
        { name: "Check tie rod ends & ball joints", status: "PENDING" },
        { name: "Clean diesel fuel injectors", status: "PENDING" },
        { name: "Inspect drive belt condition", status: "PENDING" },
        { name: "Full underchassis bolt torque check", status: "PENDING" }
      ],
      inspectionStarted: false
    },
    // READY FOR PICKUP MOCKUPS
    {
      id: "JO-1038",
      ownerName: "Carlos Reyes",
      ownerPhone: "0920-333-9999",
      ownerFb: "@carlosreyes",
      vehicleModel: "Honda Civic 2019",
      plateNumber: "NMO 5678",
      engineType: "Gasoline",
      odometer: "54,200 KM",
      serviceType: "Basic PMS",
      inchargeMechanics: ["Mark Rey", "Rey Duran"],
      status: "READY_FOR_PICKUP",
      createdAt: "Today, 9:15 AM",
      vehiclePhotoUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80",
      inspectionItems: [
        { name: "Change engine oil & filter", status: "GOOD" },
        { name: "Inspect air filter & cabin filter", status: "GOOD" },
        { name: "Check brake pads & fluid levels", status: "GOOD" },
        { name: "Tire pressure & tread inspection", status: "GOOD" },
        { name: "Battery load test & terminal cleaning", status: "GOOD" }
      ],
      inspectionStarted: true,
      mechanicMarkedReady: true
    },
    {
      id: "JO-1037",
      ownerName: "Ana Lim",
      ownerPhone: "0917-111-2222",
      ownerFb: "@analim",
      vehicleModel: "Ford Ranger 2021",
      plateNumber: "RNG 9988",
      engineType: "Diesel",
      odometer: "38,500 KM",
      serviceType: "Change Oil & Brake Check",
      inchargeMechanics: ["John Uy"],
      status: "READY_FOR_PICKUP",
      createdAt: "Yesterday, 2:45 PM",
      vehiclePhotoUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop&q=80",
      inspectionItems: [
        { name: "Change engine oil & filter", status: "GOOD" },
        { name: "Inspect air filter & cabin filter", status: "GOOD" },
        { name: "Check brake pads & fluid levels", status: "GOOD" }
      ],
      inspectionStarted: true,
      mechanicMarkedReady: true
    },
    // JOB COMPLETED MOCKUPS
    {
      id: "JO-1036",
      ownerName: "Bong Go",
      ownerPhone: "0919-888-7777",
      ownerFb: "@bonggo",
      vehicleModel: "Toyota Fortuner 2021",
      plateNumber: "NKN 9999",
      engineType: "Diesel",
      odometer: "68,400 KM",
      serviceType: "Heavy PMS Refresh",
      inchargeMechanics: ["Bernard Caermare", "Roderick Omisol"],
      status: "COMPLETED",
      createdAt: "Yesterday, 10:00 AM",
      vehiclePhotoUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
      inspectionItems: [
        { name: "Complete engine overhaul inspection", status: "GOOD" },
        { name: "Suspension & underchassis bushing overhaul", status: "GOOD" },
        { name: "Aircon system deep clean & freon recharge", status: "GOOD" }
      ],
      inspectionStarted: true,
      mechanicMarkedReady: true
    },
    {
      id: "JO-1035",
      ownerName: "Vicente Sotto",
      ownerPhone: "0919-222-3333",
      ownerFb: "@vicesotto",
      vehicleModel: "Toyota Wigo 2021",
      plateNumber: "NGA 5521",
      engineType: "Gasoline",
      odometer: "22,100 KM",
      serviceType: "Basic PMS",
      inchargeMechanics: ["Rodel Santos"],
      status: "COMPLETED",
      createdAt: "2 days ago",
      vehiclePhotoUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80",
      inspectionItems: [
        { name: "Change engine oil & filter", status: "GOOD" },
        { name: "Inspect air filter & cabin filter", status: "GOOD" },
        { name: "Check brake pads & fluid levels", status: "GOOD" }
      ],
      inspectionStarted: true,
      mechanicMarkedReady: true
    }
  ];

  // Load from localStorage
  useEffect(() => {
    const loadJobOrders = async () => {
      try {
        const data = await apiService.getJobOrders();
        setJobOrders(data);
      } catch (err) {
        console.error("Failed to load job orders", err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadJobOrders();
  }, []);

  // Save to localStorage in real-time with quota error handling
  useEffect(() => {
    // API logic replaces local sync
  }, [jobOrders, isLoaded]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddNewMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialInput.trim()) return;
    const matName = newMaterialInput.trim();
    if (!materialsList.some((m) => m.value.toLowerCase() === matName.toLowerCase())) {
      setMaterialsList((prev) => [{ value: matName, label: matName }, ...prev]);
    }
    setNewMaterialInput("");
    setIsAddMaterialModalOpen(false);
    triggerToast(`Added new material: ${matName}`);
  };

  /* ─── COMPUTED STATE VALUES ─── */
  const newJobsList = useMemo(() => {
    return jobOrders.filter(
      (j) => j.status === "FOR_INSPECTION" && !j.inspectionStarted
    );
  }, [jobOrders]);

  const wipJobsList = useMemo(() => {
    return jobOrders.filter(
      (j) =>
        ((j.status === "FOR_INSPECTION" && j.inspectionStarted) ||
          j.status === "IN_REPAIR" ||
          j.status === "AWAITING_ESTIMATE") &&
        !j.mechanicMarkedReady
    );
  }, [jobOrders]);

  const forVerificationJobsList = useMemo(() => {
    return jobOrders.filter(
      (j) => j.status === "READY_FOR_PICKUP" || (j.mechanicMarkedReady === true && j.status !== "COMPLETED")
    );
  }, [jobOrders]);

  const jobCompletedList = useMemo(() => {
    return jobOrders.filter(
      (j) => j.status === "COMPLETED"
    );
  }, [jobOrders]);

  const filteredJobs = useMemo(() => {
    const list =
      activeTab === "NEW"
        ? newJobsList
        : activeTab === "WIP"
        ? wipJobsList
        : activeTab === "FOR_VERIFICATION"
        ? forVerificationJobsList
        : jobCompletedList;
    return list.filter((j) => {
      const matchSearch =
        j.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.plateNumber.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [activeTab, newJobsList, wipJobsList, forVerificationJobsList, jobCompletedList, searchTerm]);

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

  const getItemNote = (item: Partial<InspectionItem>, targetStatus?: InspectionItem["status"]): string => {
    const activeStatus = targetStatus || item.status;
    if (activeStatus && activeStatus !== "PENDING" && item.statusNotes?.[activeStatus] !== undefined) {
      return item.statusNotes[activeStatus] || "";
    }
    return item.mechanicNote || "";
  };

  const updateInspectionItemNote = (idx: number, note: string) => {
    const items = drawerJobOrder?.inspectionItems || [];
    const updatedItems = [...items];
    const targetItem = updatedItems[idx];
    const activeStatus = targetItem.status !== "PENDING" ? targetItem.status : "GOOD";

    const currentStatusNotes = targetItem.statusNotes || {};
    const updatedStatusNotes = {
      ...currentStatusNotes,
      [activeStatus]: note
    };

    updatedItems[idx] = {
      ...targetItem,
      mechanicNote: note,
      statusNotes: updatedStatusNotes
    };
    updateDrawerJO({ inspectionItems: updatedItems });
  };

  const updateInspectionItemPhoto = (idx: number, photoUrl?: string) => {
    const items = drawerJobOrder?.inspectionItems || [];
    const updatedItems = [...items];
    updatedItems[idx] = { ...updatedItems[idx], photoUrl, photos: photoUrl ? [photoUrl] : [] };
    updateDrawerJO({ inspectionItems: updatedItems });
  };

  const [lightboxData, setLightboxData] = useState<{ itemIdx: number; photoIdx: number } | null>(null);

  const getItemPhotos = (item: Partial<InspectionItem>, targetStatus?: InspectionItem["status"]): string[] => {
    const activeStatus = targetStatus || item.status;
    if (activeStatus && activeStatus !== "PENDING" && item.statusPhotos?.[activeStatus]) {
      return item.statusPhotos[activeStatus] || [];
    }
    // Fallback for legacy single photoUrl / photos array
    if (item.photos && item.photos.length > 0) return item.photos;
    if (item.photoUrl) return [item.photoUrl];
    return [];
  };

  const handleAddPhotoToItem = (itemIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !drawerJobOrder) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        // Compress & downscale canvas to max 800px width/height & 0.7 jpeg quality
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedPhoto = canvas.toDataURL("image/jpeg", 0.7);

          const currentItems = drawerJobOrder.inspectionItems || [];
          const targetItem = currentItems[itemIdx];
          const activeStatus = targetItem.status !== "PENDING" ? targetItem.status : "GOOD";

          const currentStatusPhotos = targetItem.statusPhotos || {};
          const existingPhotosForStatus = getItemPhotos(targetItem, activeStatus);
          const updatedPhotosForStatus = [...existingPhotosForStatus, compressedPhoto];

          const updatedStatusPhotos = {
            ...currentStatusPhotos,
            [activeStatus]: updatedPhotosForStatus
          };

          const updatedItems = [...currentItems];
          updatedItems[itemIdx] = {
            ...targetItem,
            statusPhotos: updatedStatusPhotos,
            photos: updatedPhotosForStatus,
            photoUrl: updatedPhotosForStatus[0]
          };

          updateDrawerJO({ inspectionItems: updatedItems });
          triggerToast(`Added photo to ${targetItem.name}`);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhotoFromItem = (itemIdx: number, photoIdx: number) => {
    if (!drawerJobOrder) return;
    const currentItems = drawerJobOrder.inspectionItems || [];
    const targetItem = currentItems[itemIdx];
    const activeStatus = targetItem.status !== "PENDING" ? targetItem.status : "GOOD";

    const currentStatusPhotos = targetItem.statusPhotos || {};
    const existingPhotosForStatus = getItemPhotos(targetItem, activeStatus);
    const updatedPhotosForStatus = existingPhotosForStatus.filter((_, idx) => idx !== photoIdx);

    const updatedStatusPhotos = {
      ...currentStatusPhotos,
      [activeStatus]: updatedPhotosForStatus
    };

    const updatedItems = [...currentItems];
    updatedItems[itemIdx] = {
      ...targetItem,
      statusPhotos: updatedStatusPhotos,
      photos: updatedPhotosForStatus,
      photoUrl: updatedPhotosForStatus[0] || undefined
    };

    updateDrawerJO({ inspectionItems: updatedItems });
    triggerToast(`Removed photo from ${targetItem.name}`);

    if (lightboxData && lightboxData.itemIdx === itemIdx) {
      if (updatedPhotosForStatus.length === 0) {
        setLightboxData(null);
      } else if (lightboxData.photoIdx >= updatedPhotosForStatus.length) {
        setLightboxData({ itemIdx, photoIdx: updatedPhotosForStatus.length - 1 });
      }
    }
  };

  const updateInspectionItemMaterials = (idx: number, names: string[]) => {
    const items = drawerJobOrder?.inspectionItems || [];
    const updatedItems = [...items];
    const existing = updatedItems[idx]?.requiredMaterials || [];

    const newReqs: MaterialRequirement[] = names.map((name) => {
      const match = existing.find((m) => typeof m === "object" ? m.name === name : m === name);
      const currentQty = typeof match === "object" ? match.qty : 1;
      return { name, qty: currentQty };
    });

    updatedItems[idx] = { ...updatedItems[idx], requiredMaterials: newReqs };
    updateDrawerJO({ inspectionItems: updatedItems });
  };

  const updateMaterialQty = (itemIdx: number, matName: string, qty: number) => {
    const items = drawerJobOrder?.inspectionItems || [];
    const updatedItems = [...items];
    const existing = updatedItems[itemIdx]?.requiredMaterials || [];

    const updatedReqs: MaterialRequirement[] = existing.map((m) => {
      const name = typeof m === "object" ? m.name : m;
      const currentQty = typeof m === "object" ? m.qty : 1;
      if (name === matName) {
        return { name, qty };
      }
      return { name, qty: currentQty };
    });

    updatedItems[itemIdx] = { ...updatedItems[itemIdx], requiredMaterials: updatedReqs };
    updateDrawerJO({ inspectionItems: updatedItems });
  };

  const removeMaterialItem = (itemIdx: number, matName: string) => {
    const items = drawerJobOrder?.inspectionItems || [];
    const updatedItems = [...items];
    const existing = updatedItems[itemIdx]?.requiredMaterials || [];
    const filtered = existing.filter((m) => (typeof m === "object" ? m.name : m) !== matName);
    updatedItems[itemIdx] = { ...updatedItems[itemIdx], requiredMaterials: filtered };
    updateDrawerJO({ inspectionItems: updatedItems });
  };

  const confirmAddMaterial = (itemIdx: number) => {
    if (!selectedPartName) return;
    const items = drawerJobOrder?.inspectionItems || [];
    const updatedItems = [...items];
    const existing = updatedItems[itemIdx]?.requiredMaterials || [];

    const existingIndex = existing.findIndex((m) => (typeof m === "object" ? m.name : m) === selectedPartName);
    let updatedReqs: MaterialRequirement[];

    if (existingIndex >= 0) {
      updatedReqs = existing.map((m, i) => {
        const name = typeof m === "object" ? m.name : m;
        const qty = typeof m === "object" ? m.qty : 1;
        if (i === existingIndex) {
          return { name, qty: qty + addMaterialQtyInput };
        }
        return { name, qty };
      });
    } else {
      updatedReqs = [...existing.map(m => typeof m === "object" ? m : { name: m, qty: 1 }), { name: selectedPartName, qty: addMaterialQtyInput }];
    }

    updatedItems[itemIdx] = { ...updatedItems[itemIdx], requiredMaterials: updatedReqs };
    updateDrawerJO({ inspectionItems: updatedItems });

    setActiveAddMaterialItemIdx(null);
    setSelectedPartName(null);
    setAddMaterialQtyInput(1);
    setMaterialSearchQuery("");
  };

  return (
    <TailAdminLayout userRole="Mechanic" userName="Bay Tablet #1" userEmail="bay1@piveran.com">
      <div className="space-y-4">

        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Garage Bay Job Board</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>Bay Tablet #1 View (Mark Rey / Rodel Santos)</span>
            </p>
          </div>
        </div>

        {/* TOAST ALERT */}
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
            <button
              onClick={() => setActiveTab("NEW")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === "NEW" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              New
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === "NEW" ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-500"}`}>
                {newJobsList.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("WIP")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === "WIP" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Work in progress
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === "WIP" ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-500"}`}>
                {wipJobsList.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("FOR_VERIFICATION")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === "FOR_VERIFICATION" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Ready for pickup
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === "FOR_VERIFICATION" ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-500"}`}>
                {forVerificationJobsList.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("JOB_COMPLETED")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === "JOB_COMPLETED" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Job completed
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === "JOB_COMPLETED" ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-500"}`}>
                {jobCompletedList.length}
              </span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assigned JO #, Plate..."
              className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-slate-400 w-48 sm:w-56 font-normal"
            />
          </div>
        </div>

        {/* CARD GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredJobs.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs font-medium bg-white rounded-2xl border border-slate-200">
              No jobs found in this category
            </div>
          ) : (
            filteredJobs.map((jo) => {
              const sc = getJobBadgeConfig(jo);
              const progress = getInspectionProgress(jo);
              return (
                <div
                  key={jo.id}
                  onClick={() => setDrawerJobOrder({ ...jo })}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group max-w-xs w-full cursor-pointer"
                >
                  <div className="h-40 bg-slate-100 relative flex items-center justify-center border-b border-slate-200 overflow-hidden shrink-0">
                    <div className={`absolute top-3 left-3 ${sc.bg} ${sc.color} ${sc.border} border font-semibold text-[10px] px-2.5 py-0.5 rounded-lg`}>
                      {sc.label}
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
                        <div className="text-sm font-medium">Photo</div>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-4 flex-1">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 tracking-wide">{jo.id}</div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">{jo.vehicleModel}</h3>
                      <p className="text-xs font-normal text-slate-500 mt-1">
                        Owner: <span className="text-slate-800 font-medium">{jo.ownerName}</span>
                      </p>
                    </div>

                    <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-normal">Service Type:</span>
                        <span className="font-semibold text-slate-900">{jo.serviceType}</span>
                      </div>

                      {/* Status / Progress indicators (Both GOOD & MONITOR count as completed) */}
                      {jo.status === "FOR_INSPECTION" && !jo.inspectionStarted && (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Inspection Status</span>
                            <span className="font-semibold text-amber-700">0/{progress.total} Completed</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div className="h-full bg-amber-400 w-0" />
                          </div>
                        </div>
                      )}

                      {jo.status === "FOR_INSPECTION" && jo.inspectionStarted && (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Inspection Checklist</span>
                            <span className="font-semibold text-violet-700">{progress.completed}/{progress.total} Completed</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div
                              className="h-full bg-emerald-600 transition-all duration-300"
                              style={{ width: `${(progress.completed / (progress.total || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {jo.status === "IN_REPAIR" && (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Repair Progress</span>
                            <span className="font-semibold text-violet-700">Repair in Progress</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div className="h-full bg-violet-600 w-3/4 animate-pulse" />
                          </div>
                        </div>
                      )}

                      {(jo.status === "READY_FOR_PICKUP" || jo.status === "COMPLETED") && (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Inspection Checklist</span>
                            <span className="font-semibold text-emerald-600 font-bold">{progress.completed}/{progress.total} Completed</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div className="h-full bg-emerald-600 w-full rounded-full" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <span className="text-[11px] text-slate-400 font-normal">{jo.createdAt}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ═══════════════════════════════════════════
          TECHNICIAN / DVI DETAILS DRAWER
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
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-white border-l border-slate-200 shadow-2xl flex flex-col"
            >
              {/* FIXED DRAWER HEADER (EXACT MATCH FOR FRONT DESK LAYOUT) */}
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

              {/* SCROLLABLE DRAWER BODY */}
              <div className="flex-1 overflow-y-auto">

                {/* SECTION 1: Summary Stats */}
                <div className="px-5 py-4 border-b border-slate-100 space-y-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase mb-1">
                    <FileText className="w-3.5 h-3.5" /> Vehicle Info
                  </div>
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                    <div><span className="text-slate-500">Owner</span><div className="font-medium text-slate-900">{drawerJobOrder.ownerName}</div></div>
                    <div><span className="text-slate-500">Contact Number</span><div className="font-medium text-slate-900">{drawerJobOrder.ownerPhone}</div></div>
                    <div><span className="text-slate-500">Plate Number</span><div className="font-medium text-slate-900">{drawerJobOrder.plateNumber}</div></div>
                    <div><span className="text-slate-500">Engine Type</span><div className="font-medium text-slate-900">{drawerJobOrder.engineType}</div></div>
                    <div><span className="text-slate-500">Odometer Reading</span><div className="font-medium text-slate-900">{drawerJobOrder.odometer}</div></div>
                    <div><span className="text-slate-500">Service Category</span><div className="font-medium text-slate-900">{drawerJobOrder.serviceType}</div></div>
                  </div>

                  <div className="pt-2 border-t border-slate-100/80">
                    <span className="text-slate-500 font-medium text-xs block">Service Description</span>
                    <div className="font-semibold text-slate-800 text-xs mt-0.5">
                      {getServiceDescription(drawerJobOrder.serviceType, drawerJobOrder.serviceDescription)}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: DVI Checklist */}
                {drawerJobOrder.inspectionItems && drawerJobOrder.inspectionItems.length > 0 && (
                  <div className="px-5 py-4 border-b border-slate-100 space-y-3 text-xs">
                    {/* Progress Header & Progress Bar matching Front Desk */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase">
                          <ClipboardCheck className="w-3.5 h-3.5" /> Inspection checklist
                        </div>
                        <span className="font-bold text-purple-600 text-xs">
                          {getInspectionProgress(drawerJobOrder).completed}/{getInspectionProgress(drawerJobOrder).total} Completed
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              (getInspectionProgress(drawerJobOrder).completed /
                                (getInspectionProgress(drawerJobOrder).total || 1)) *
                              100
                            }%`
                          }}
                        />
                      </div>
                    </div>

                    {drawerJobOrder.status !== "READY_FOR_PICKUP" && drawerJobOrder.status !== "COMPLETED" ? (
                      /* INTERACTIVE CHECKLIST FOR MECHANICS (ACCORDION) */
                      <div className="space-y-2.5">
                        {drawerJobOrder.inspectionItems.map((item, idx) => {
                          const isExpanded = expandedIndex === idx;
                          return (
                            <div key={idx} className={`bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs relative ${isExpanded ? "overflow-visible z-30" : "overflow-hidden z-0"}`}>
                              {/* Accordion Header (LIGHT DARK BG WHEN EXPANDED) */}
                              <div
                                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                                className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors select-none ${
                                  isExpanded
                                    ? "bg-slate-100/90 border-b border-slate-200/80"
                                    : "hover:bg-slate-100/70"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="shrink-0">{INSPECTION_STATUS_ICON[item.status || "PENDING"]}</div>
                                  <span className="font-bold text-slate-800 text-xs truncate">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                </div>
                              </div>

                              {/* Accordion Body */}
                              {isExpanded && (
                                <div className="px-4 pb-4 pt-2 border-t border-slate-200/60 bg-white space-y-3.5">
                                  {/* Status Buttons */}
                                  <div>
                                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(["GOOD", "ISSUE", "MONITOR", "PENDING"] as const).map((st) => {
                                        const isSel = item.status === st;
                                        const label = st === "GOOD" ? "Good" : st === "ISSUE" ? "Issue" : st === "MONITOR" ? "Monitor" : "Pending";
                                        const activeStyles =
                                          st === "GOOD" ? "bg-emerald-700 text-white shadow-2xs border-emerald-700 font-semibold" :
                                          st === "ISSUE" ? "bg-red-600 text-white shadow-2xs border-red-600 font-semibold" :
                                          st === "MONITOR" ? "bg-amber-500 text-white shadow-2xs border-amber-500 font-semibold" :
                                          "bg-slate-700 text-white shadow-2xs border-slate-700 font-semibold";
                                        const inactiveStyles = "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-normal";

                                        return (
                                          <button
                                            key={st}
                                            type="button"
                                            onClick={() => updateInspectionItemStatus(idx, st)}
                                            className={`px-3 py-1 text-[10px] rounded-lg border transition-all cursor-pointer ${
                                              isSel ? activeStyles : inactiveStyles
                                            }`}
                                          >
                                            {label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Materials Section (Only display for status ISSUE or GOOD with applied materials) */}
                                  {(item.status === "ISSUE" || (item.status === "GOOD" && (item.requiredMaterials || []).length > 0)) && (
                                    <div className="space-y-2 pt-1">
                                      {/* Summary List of Added Materials / Applied Parts */}
                                      {(item.requiredMaterials || []).length > 0 && activeAddMaterialItemIdx !== idx && (
                                        <div className="space-y-1.5">
                                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 pb-0.5">
                                            <span>{item.status === "GOOD" ? "Materials Applied" : "Materials"}</span>
                                            {item.status !== "GOOD" && <span className="pr-4">Quantity</span>}
                                          </div>

                                              <div className="space-y-1">
                                                {(item.requiredMaterials || []).map((m) => {
                                                  const name = typeof m === "object" ? m.name : m;
                                                  const qty = typeof m === "object" ? m.qty : 1;

                                                  if (item.status === "GOOD") {
                                                    return (
                                                      <div key={name} className="flex items-center gap-2.5 py-1 px-1 text-xs">
                                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                        <span className="font-semibold text-slate-800 truncate">{name}</span>
                                                      </div>
                                                    );
                                                  }

                                                  return (
                                                    <div key={name} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-red-50/80 bg-white border border-slate-100 transition-all text-xs group">
                                                      <div className="flex items-center gap-2 min-w-0">
                                                        <span className="font-semibold text-slate-800 truncate pr-2">{name}</span>
                                                      </div>
                                                      <div className="flex items-center gap-2 shrink-0">
                                                        <span className="font-semibold text-slate-800 text-xs min-w-[20px] text-right group-hover:hidden pr-1">
                                                          {qty}
                                                        </span>
                                                        <input
                                                          type="number"
                                                          min="1"
                                                          value={qty}
                                                          onChange={(e) => {
                                                            const val = Math.max(1, parseInt(e.target.value) || 1);
                                                            updateMaterialQty(idx, name, val);
                                                          }}
                                                          className="hidden group-hover:block w-12 bg-white border border-red-300 rounded-md py-0.5 px-1 text-center text-xs font-semibold text-slate-900 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-500/20 shadow-2xs"
                                                        />
                                                        <button
                                                          type="button"
                                                          onClick={() => removeMaterialItem(idx, name)}
                                                          className="text-slate-400 hover:text-red-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                        >
                                                          <X className="w-3.5 h-3.5" />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}

                                          {/* Section title when 0 items and panel is closed */}
                                          {(item.requiredMaterials || []).length === 0 && activeAddMaterialItemIdx !== idx && (
                                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                              Materials
                                            </div>
                                          )}

                                          {/* STEP 2 & STEP 3 INLINE POPUP CARD (RED THEME FOR REPAIR NEEDED) */}
                                          {activeAddMaterialItemIdx === idx ? (
                                            <div className="bg-slate-50 border-2 border-red-500/60 rounded-2xl p-3.5 space-y-3 shadow-md">
                                              {addMaterialStep === "SELECT_PART" ? (
                                                /* STEP 2: Radio Button Selection Screen */
                                                <div className="space-y-2.5">
                                                  <div className="flex items-center justify-between pb-0.5">
                                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Select Material</span>
                                                    <button
                                                      type="button"
                                                      onClick={() => setActiveAddMaterialItemIdx(null)}
                                                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
                                                    >
                                                      <X className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>

                                                  {/* Search Input */}
                                                  <div className="relative">
                                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                                                    <input
                                                      type="text"
                                                      value={materialSearchQuery}
                                                      onChange={(e) => setMaterialSearchQuery(e.target.value)}
                                                      placeholder="Search"
                                                      className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-red-500 shadow-2xs"
                                                    />
                                                  </div>

                                                  {/* + new button (Red text style) */}
                                                  <div className="px-0.5">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setNewMaterialInput("");
                                                        setIsAddMaterialModalOpen(true);
                                                      }}
                                                      className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer"
                                                    >
                                                      <Plus className="w-3.5 h-3.5" />
                                                      <span>new</span>
                                                    </button>
                                                  </div>

                                                  {/* Radio Button Options List (Light red hover background) */}
                                                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                                                    {materialsList
                                                      .filter((opt) => opt.label.toLowerCase().includes(materialSearchQuery.toLowerCase()))
                                                      .map((opt) => (
                                                        <label
                                                          key={opt.value}
                                                          onClick={() => {
                                                            setSelectedPartName(opt.value);
                                                            setAddMaterialStep("SET_QUANTITY");
                                                          }}
                                                          className="flex items-center gap-2.5 py-2 px-3 hover:bg-red-50/80 bg-white rounded-xl cursor-pointer transition-colors border border-slate-100/80 hover:border-red-200 group/item"
                                                        >
                                                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                                            selectedPartName === opt.value
                                                              ? "border-red-600 bg-red-600"
                                                              : "border-slate-300 bg-white group-hover/item:border-red-400"
                                                          }`}>
                                                            {selectedPartName === opt.value ? (
                                                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                            ) : (
                                                              <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/item:bg-red-200/50" />
                                                            )}
                                                          </div>
                                                          <span className="text-xs font-semibold text-slate-800 group-hover/item:text-red-950">{opt.label}</span>
                                                        </label>
                                                      ))}
                                                  </div>
                                                </div>
                                              ) : (
                                                /* STEP 3: Quantity Input Screen */
                                                <div className="space-y-3">
                                                  <div className="flex items-center justify-between">
                                                    <button
                                                      type="button"
                                                      onClick={() => setAddMaterialStep("SELECT_PART")}
                                                      className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                                                    >
                                                      <ChevronLeft className="w-3.5 h-3.5" /> Back
                                                    </button>
                                                    <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{selectedPartName}</span>
                                                    <button
                                                      type="button"
                                                      onClick={() => setActiveAddMaterialItemIdx(null)}
                                                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60"
                                                    >
                                                      <X className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>

                                                  <div className="space-y-1.5 text-center py-1">
                                                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                                                      Quantity
                                                    </label>
                                                    <div className="flex items-center justify-center gap-3">
                                                      <button
                                                        type="button"
                                                        onClick={() => setAddMaterialQtyInput(Math.max(1, addMaterialQtyInput - 1))}
                                                        className="w-9 h-9 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-base hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                                                      >
                                                        -
                                                      </button>
                                                      <input
                                                        type="number"
                                                        min="1"
                                                        value={addMaterialQtyInput}
                                                        onChange={(e) => setAddMaterialQtyInput(Math.max(1, parseInt(e.target.value) || 1))}
                                                        placeholder='e.g. "2"'
                                                        className="w-24 bg-white border border-slate-300 rounded-xl py-2 px-3 text-center text-sm font-bold text-slate-900 outline-none focus:border-red-500 shadow-2xs"
                                                      />
                                                      <button
                                                        type="button"
                                                        onClick={() => setAddMaterialQtyInput(addMaterialQtyInput + 1)}
                                                        className="w-9 h-9 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-base hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                                                      >
                                                        +
                                                      </button>
                                                    </div>
                                                  </div>

                                                  <button
                                                    type="button"
                                                    onClick={() => confirmAddMaterial(idx)}
                                                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                                                  >
                                                    Add Material
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ) : item.status !== "GOOD" ? (
                                            /* STEP 1: + add button (Only for ISSUE / Repair needed) */
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setActiveAddMaterialItemIdx(idx);
                                                setAddMaterialStep("SELECT_PART");
                                                setSelectedPartName(null);
                                                setAddMaterialQtyInput(1);
                                                setMaterialSearchQuery("");
                                              }}
                                              className="w-full py-2 bg-slate-50 hover:bg-slate-100 border-dashed border-slate-300 text-slate-600 font-semibold rounded-xl text-xs text-center flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                            >
                                              <Plus className="w-3.5 h-3.5" />
                                              <span>add</span>
                                            </button>
                                          ) : null}
                                    </div>
                                  )}

                                  {/* Visual Proof & Diagnostic Notes (Only display when status is NOT Pending) */}
                                  {item.status !== "PENDING" && (
                                    <>
                                      {/* Visual Proof Section (Matching User Sketch 1 & 2) */}
                                      {(() => {
                                        const dropStyle =
                                          item.status === "ISSUE"
                                            ? { bg: "hover:bg-red-50/80", border: "hover:border-red-500/80", iconBg: "group-hover:bg-red-100", iconText: "group-hover:text-red-700", text: "group-hover:text-red-700", imgHoverBorder: "hover:border-red-500 hover:ring-2 hover:ring-red-200/80", focusBorder: "focus:border-red-500 focus:ring-1 focus:ring-red-500/30" }
                                            : item.status === "GOOD"
                                            ? { bg: "hover:bg-emerald-50/80", border: "hover:border-emerald-500/80", iconBg: "group-hover:bg-emerald-100", iconText: "group-hover:text-emerald-700", text: "group-hover:text-emerald-700", imgHoverBorder: "hover:border-emerald-500 hover:ring-2 hover:ring-emerald-200/80", focusBorder: "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30" }
                                            : { bg: "hover:bg-amber-50/80", border: "hover:border-amber-500/80", iconBg: "group-hover:bg-amber-100", iconText: "group-hover:text-amber-700", text: "group-hover:text-amber-700", imgHoverBorder: "hover:border-amber-500 hover:ring-2 hover:ring-amber-200/80", focusBorder: "focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30" };

                                        const itemPhotos = getItemPhotos(item);

                                        return (
                                          <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                Visual Proof {itemPhotos.length > 0 && `(${itemPhotos.length})`}
                                              </div>
                                              {itemPhotos.length > 0 && (
                                                <button
                                                  type="button"
                                                  onClick={() => setLightboxData({ itemIdx: idx, photoIdx: 0 })}
                                                  className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                                                  title="Expand full screen"
                                                >
                                                  <Maximize2 className="w-3.5 h-3.5" />
                                                </button>
                                              )}
                                            </div>

                                            {itemPhotos.length === 0 ? (
                                              /* SKETCH 1: No photos yet (Dropzone) */
                                              <label className={`bg-slate-50/80 ${dropStyle.bg} border-2 border-dashed border-slate-300 ${dropStyle.border} rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[90px] shadow-2xs group`}>
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  capture="environment"
                                                  onChange={(e) => handleAddPhotoToItem(idx, e)}
                                                  className="hidden"
                                                />
                                                <div className={`w-9 h-9 rounded-full bg-slate-200/70 ${dropStyle.iconBg} group-hover:scale-110 flex items-center justify-center text-slate-600 ${dropStyle.iconText} transition-all duration-200 mb-1`}>
                                                  <Camera className="w-4.5 h-4.5" />
                                                </div>
                                                <span className={`text-[11px] text-slate-400 ${dropStyle.text} font-normal transition-colors`}>
                                                  Click to open camera or browse image
                                                </span>
                                              </label>
                                            ) : (
                                              /* SKETCH 2: Photos attached (Thumbnails + Dashed Add Bar) */
                                              <div className="space-y-2">
                                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                                  {itemPhotos.map((photo, pIdx) => (
                                                    <div
                                                      key={pIdx}
                                                      className={`relative w-24 h-24 rounded-2xl border-2 border-slate-200 ${dropStyle.imgHoverBorder} overflow-hidden bg-slate-100 shadow-2xs shrink-0 group/img cursor-pointer transition-all duration-200`}
                                                      onClick={() => setLightboxData({ itemIdx: idx, photoIdx: pIdx })}
                                                    >
                                                      <img src={photo} alt={`Proof ${pIdx + 1}`} className="w-full h-full object-cover" />
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleRemovePhotoFromItem(idx, pIdx);
                                                        }}
                                                        className="absolute top-1.5 right-1.5 p-1 bg-slate-900/75 hover:bg-red-600 text-white rounded-full transition-all cursor-pointer shadow-md z-10"
                                                      >
                                                        <X className="w-3 h-3" />
                                                      </button>
                                                    </div>
                                                  ))}
                                                </div>

                                                {/* Dashed bar to add more photos */}
                                                <label className={`bg-slate-50/80 ${dropStyle.bg} border-2 border-dashed border-slate-300 ${dropStyle.border} rounded-xl py-2 px-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 text-xs font-medium group`}>
                                                  <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    onChange={(e) => handleAddPhotoToItem(idx, e)}
                                                    className="hidden"
                                                  />
                                                  <Camera className={`w-4 h-4 text-slate-500 ${dropStyle.iconText} transition-colors`} />
                                                  <span className={`text-[11px] text-slate-500 ${dropStyle.text} transition-colors`}>Add another photo</span>
                                                </label>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      {/* Diagnostic Notes Input (Separated per status) */}
                                      <div>
                                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Diagnostic Notes</div>
                                        <input
                                          type="text"
                                          value={getItemNote(item)}
                                          onChange={(e) => updateInspectionItemNote(idx, e.target.value)}
                                          placeholder="Add diagnostic comments or wear levels..."
                                          className={`w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-normal text-slate-800 outline-none ${(() => {
                                            if (item.status === "ISSUE") return "focus:border-red-500 focus:ring-1 focus:ring-red-500/30";
                                            if (item.status === "GOOD") return "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30";
                                            return "focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30";
                                          })()} transition-all`}
                                        />
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* READ-ONLY PREVIEW FOR COMPLETED OR WORK IN PROGRESS (ACCORDION) */
                      <div className="space-y-2">
                        {drawerJobOrder.inspectionItems.map((item, idx) => {
                          const isExpanded = expandedIndex === idx;
                          const hasDetails = item.mechanicNote || item.photoUrl || (item.requiredMaterials && item.requiredMaterials.length > 0);
                          return (
                            <div key={idx} className="bg-slate-50 border border-slate-200/60 rounded-xl overflow-hidden transition-all shadow-2xs">
                              {/* Accordion Header */}
                              <div
                                onClick={() => {
                                  if (hasDetails) {
                                    setExpandedIndex(isExpanded ? null : idx);
                                  }
                                }}
                                className={`px-4 py-2.5 flex items-center justify-between gap-3 ${hasDetails ? "cursor-pointer hover:bg-slate-100/60" : "select-text"}`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="shrink-0">{INSPECTION_STATUS_ICON[item.status || "PENDING"]}</div>
                                  <span className="font-semibold text-slate-800 text-xs truncate">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {hasDetails && (
                                    <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                  )}
                                </div>
                              </div>

                              {/* Accordion Body (Render details if expanded and details exist) */}
                              {isExpanded && hasDetails && (
                                <div className="px-4 pb-3.5 pt-1.5 border-t border-slate-200/50 bg-white space-y-2.5">
                                  {item.requiredMaterials && item.requiredMaterials.length > 0 && (
                                    <div>
                                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Required Materials</div>
                                      <div className="flex flex-wrap gap-1">
                                        {item.requiredMaterials.map((mat) => {
                                          const name = typeof mat === "object" ? mat.name : mat;
                                          const qty = typeof mat === "object" ? mat.qty : 1;
                                          return (
                                            <span key={name} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-md text-[10px] font-semibold">
                                              {name} <span className="text-slate-500 font-bold ml-0.5">×{qty}</span>
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  {item.mechanicNote && (
                                    <div>
                                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Notes</div>
                                      <div className="text-xs text-slate-700 font-medium italic">"{item.mechanicNote}"</div>
                                    </div>
                                  )}
                                  {item.photoUrl && (
                                    <div>
                                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Attached Proof</div>
                                      <div className="relative w-14 h-14 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shadow-2xs">
                                        <img src={item.photoUrl} alt="Inspection proof" className="w-full h-full object-cover" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}




              </div>

              {/* FIXED DRAWER FOOTER (MATCHING FRONT DESK LAYOUT WITH CLOSE & START INSPECTION) */}
              <div className="shrink-0 px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end gap-2">
                <button
                  onClick={() => setDrawerJobOrder(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>

                {drawerJobOrder.status === "FOR_INSPECTION" && !drawerJobOrder.inspectionStarted && (
                  <button
                    onClick={() => {
                      updateDrawerJO({ inspectionStarted: true });
                      triggerToast(`Started inspection for ${drawerJobOrder.id}`);
                    }}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Start Inspection</span>
                  </button>
                )}
              </div>


            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── SKETCH 3: FULLSCREEN DESKTOP LIGHTBOX MODAL ── */}
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
                <span>Close</span>
              </button>
            </div>

            {/* Lightbox Body (Left thumbnail column + Main large photo view) */}
            <div className="flex-1 flex gap-6 pt-6 overflow-hidden min-h-0">
              {/* Left Column: Vertical Thumbnails List */}
              {(() => {
                const currentItem = drawerJobOrder.inspectionItems?.[lightboxData.itemIdx];
                const photos = currentItem ? getItemPhotos(currentItem) : [];
                const lightboxStyle =
                  currentItem?.status === "ISSUE"
                    ? {
                        activeBorder: "border-red-500 ring-2 ring-red-500/50 scale-102",
                        addHoverBorder: "hover:border-red-500/80",
                        addHoverText: "hover:text-red-400"
                      }
                    : currentItem?.status === "GOOD"
                    ? {
                        activeBorder: "border-emerald-500 ring-2 ring-emerald-500/50 scale-102",
                        addHoverBorder: "hover:border-emerald-500/80",
                        addHoverText: "hover:text-emerald-400"
                      }
                    : {
                        activeBorder: "border-amber-500 ring-2 ring-amber-500/50 scale-102",
                        addHoverBorder: "hover:border-amber-500/80",
                        addHoverText: "hover:text-amber-400"
                      };

                return (
                  <div className="w-28 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
                    {photos.map((photo, pIdx) => {
                      const isActive = pIdx === lightboxData.photoIdx;
                      return (
                        <div
                          key={pIdx}
                          onClick={() => setLightboxData({ itemIdx: lightboxData.itemIdx, photoIdx: pIdx })}
                          className={`relative w-24 h-24 rounded-2xl border-2 overflow-hidden bg-slate-900 cursor-pointer transition-all shrink-0 group ${
                            isActive ? lightboxStyle.activeBorder : "border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img src={photo} alt={`Thumbnail ${pIdx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhotoFromItem(lightboxData.itemIdx, pIdx);
                            }}
                            className="absolute top-1 right-1 p-1 bg-slate-950/80 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer shadow-md"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Add Photo Button inside Lightbox */}
                    <label className={`w-24 h-20 rounded-2xl border-2 border-dashed border-slate-700 ${lightboxStyle.addHoverBorder} bg-slate-900/50 hover:bg-slate-800 flex flex-col items-center justify-center cursor-pointer transition-all text-slate-400 ${lightboxStyle.addHoverText} text-xs gap-1 shrink-0`}>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleAddPhotoToItem(lightboxData.itemIdx, e)}
                        className="hidden"
                      />
                      <Camera className="w-4 h-4" />
                      <span className="text-[10px] font-semibold">+ Photo</span>
                    </label>
                  </div>
                );
              })()}

              {/* Main Center Area: Large High-Res Photo Preview */}
              <div className="flex-1 flex items-center justify-center bg-slate-900/60 rounded-3xl border border-slate-800/80 p-4 relative overflow-hidden">
                {(() => {
                  const currentItem = drawerJobOrder.inspectionItems?.[lightboxData.itemIdx];
                  const photos = currentItem ? getItemPhotos(currentItem) : [];
                  const activePhoto = photos[lightboxData.photoIdx];
                  if (!activePhoto) return null;
                  return (
                    <img
                      src={activePhoto}
                      alt="Full preview"
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                    />
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD NEW MATERIAL MODAL */}
      <AnimatePresence>
        {isAddMaterialModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 w-full max-w-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Add New Material</h3>
                <button
                  onClick={() => setIsAddMaterialModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddNewMaterialSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Material / Part Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newMaterialInput}
                    onChange={(e) => setNewMaterialInput(e.target.value)}
                    placeholder="e.g. Brake Caliper Bolt"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-600 font-normal"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddMaterialModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-all"
                  >
                    Add to Catalog
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </TailAdminLayout>
  );
}
