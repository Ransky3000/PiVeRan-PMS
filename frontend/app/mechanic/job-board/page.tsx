"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { apiService, subscribeToJobOrders } from "@/app/apiService";
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

import { JobOrder, InspectionItem, EstimateLineItem, JOStatus, MaterialRequirement } from "../../types";

const getServiceDescription = (serviceType?: string, customDesc?: string): string => {
  return customDesc || "";
};

const INITIAL_MATERIAL_OPTIONS: SelectOption[] = [];

/* ───────────────────────────────────────────
   HELPERS & CONFIG
   ─────────────────────────────────────────── */

const getJobBadgeConfig = (jo: JobOrder) => {
  if (jo.status === "New") {
    return { label: "New", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
  }
  if (jo.status === "Work in progress") {
    return { label: "Work in progress", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" };
  }
  if (jo.status === "Job completed") {
    return { label: "Job completed", color: "text-emerald-800", bg: "bg-emerald-50", border: "border-emerald-200" };
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
  const [activeTab, setActiveTab] = useState<"NEW" | "WIP" | "JOB_COMPLETED">("WIP");
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [drawerJobOrder, setDrawerJobOrder] = useState<JobOrder | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Materials master list & quick modal state
  const [materialsList, setMaterialsList] = useState<SelectOption[]>(INITIAL_MATERIAL_OPTIONS);
  const [rawMaterialsList, setRawMaterialsList] = useState<any[]>([]);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [newMaterialInput, setNewMaterialInput] = useState("");

  // State for 4-Step Inline Add Material Flow (Excalidraw mockup match)
  const [activeAddMaterialItemIdx, setActiveAddMaterialItemIdx] = useState<number | null>(null);
  const [addMaterialStep, setAddMaterialStep] = useState<"SELECT_PART" | "SET_QUANTITY">("SELECT_PART");
  const [selectedPartName, setSelectedPartName] = useState<string | null>(null);
  const [addMaterialQtyInput, setAddMaterialQtyInput] = useState<number>(1);
  const [materialSearchQuery, setMaterialSearchQuery] = useState<string>("");

  const [laborMaterialsMap, setLaborMaterialsMap] = useState<Record<string, string[]>>({});

  // Load from localStorage
  useEffect(() => {
    const loadJobOrders = async () => {
      try {
        const data = await apiService.getJobOrders();
        setJobOrders(data);
        if (drawerJobOrder) {
          const updatedCurrent = data.find((j: any) => j.id === drawerJobOrder.id);
          if (updatedCurrent) {
            setDrawerJobOrder(updatedCurrent);
          }
        }
      } catch (err) {
        console.error("Failed to load job orders", err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadJobOrders();

    const unsubscribe = subscribeToJobOrders(() => {
      loadJobOrders();
    });
    return () => unsubscribe();
  }, [drawerJobOrder?.id]);

  // Load materials and labor mapping from DB
  useEffect(() => {
    const loadMaterialsAndLabor = async () => {
      try {
        const mats = await apiService.getMaterials();
        if (mats && mats.length > 0) {
          setRawMaterialsList(mats);
          const opts = mats.map((m: any) => ({
            value: m.name,
            label: `${m.name} (₱${parseFloat(m.price).toLocaleString("en-US", { minimumFractionDigits: 2 })})`
          }));
          setMaterialsList(opts);
        }
        const labors = await apiService.getLabor();
        if (labors && labors.length > 0) {
          const mapping: Record<string, string[]> = {};
          labors.forEach((l: any) => {
            mapping[l.name] = l.recommendedMaterials || [];
          });
          setLaborMaterialsMap(mapping);
        }
      } catch (err) {
        console.error("Failed to load materials or labors catalog on mount", err);
      }
    };
    loadMaterialsAndLabor();
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
    return jobOrders.filter((j) => j.status === "New");
  }, [jobOrders]);

  const wipJobsList = useMemo(() => {
    return jobOrders.filter((j) => j.status === "Work in progress");
  }, [jobOrders]);

  const jobCompletedList = useMemo(() => {
    return jobOrders.filter(
      (j) => j.status === "Job completed"
    );
  }, [jobOrders]);

  const filteredJobs = useMemo(() => {
    const list =
      activeTab === "NEW"
        ? newJobsList
        : activeTab === "WIP"
        ? wipJobsList
        : jobCompletedList;
    return list.filter((j) => {
      const matchSearch =
        j.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.plateNumber.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [activeTab, newJobsList, wipJobsList, jobCompletedList, searchTerm]);

  const updateDrawerJO = (updates: Partial<JobOrder>) => {
    if (!drawerJobOrder) return;
    const updated = { ...drawerJobOrder, ...updates };
    setDrawerJobOrder(updated);
    setJobOrders((prev) => prev.map((jo) => (jo.id === updated.id ? updated : jo)));
  };

  const updateInspectionItemStatus = (idx: number, status: InspectionItem["status"]) => {
    const items = drawerJobOrder?.inspectionItems || [];
    const updatedItems = [...items];
    const targetItem = updatedItems[idx];
    updatedItems[idx] = { ...targetItem, status };
    updateDrawerJO({ inspectionItems: updatedItems });

    if (targetItem && targetItem.id) {
      apiService.updateInspectionItem(targetItem.id, {
        status,
        statusNotes: targetItem.statusNotes || {},
        statusPhotos: targetItem.statusPhotos || {}
      }).catch(err => {
        console.error("Failed to update inspection item status in backend", err);
      });
    }
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

    if (targetItem && targetItem.id) {
      apiService.updateInspectionItem(targetItem.id, {
        status: targetItem.status || "PENDING",
        statusNotes: updatedStatusNotes,
        statusPhotos: targetItem.statusPhotos || {}
      }).catch(err => {
        console.error("Failed to update inspection item note in backend", err);
      });
    }
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

          if (targetItem && targetItem.id) {
            apiService.updateInspectionItem(targetItem.id, {
              status: targetItem.status || "PENDING",
              statusNotes: targetItem.statusNotes || {},
              statusPhotos: updatedStatusPhotos
            }).catch(err => {
              console.error("Failed to update inspection item photo in backend", err);
            });
          }
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

    if (targetItem && targetItem.id) {
      apiService.updateInspectionItem(targetItem.id, {
        status: targetItem.status || "PENDING",
        statusNotes: targetItem.statusNotes || {},
        statusPhotos: updatedStatusPhotos
      }).catch(err => {
        console.error("Failed to update inspection item photo in backend", err);
      });
    }

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

  const removeMaterialItem = async (itemIdx: number, matNameOrObj: any) => {
    if (!drawerJobOrder) return;
    const items = drawerJobOrder.inspectionItems || [];
    const targetItem = items[itemIdx];

    let cartIdToDelete = typeof matNameOrObj === "object" ? matNameOrObj.cart_id : null;
    if (!cartIdToDelete && targetItem && targetItem.requiredMaterials) {
      const match = targetItem.requiredMaterials.find((m: any) =>
        (typeof m === "object" ? m.name : m) === (typeof matNameOrObj === "object" ? matNameOrObj.name : matNameOrObj)
      );
      if (match && typeof match === "object") {
        cartIdToDelete = match.cart_id;
      }
    }

    if (targetItem && targetItem.id && cartIdToDelete) {
      try {
        await apiService.removeMaterialFromCart(targetItem.id, cartIdToDelete);
      } catch (err) {
        console.error("Failed to remove material from cart", err);
      }
    }

    const existing = targetItem?.requiredMaterials || [];
    const matName = typeof matNameOrObj === "object" ? matNameOrObj.name : matNameOrObj;
    const filtered = existing.filter((m) => (typeof m === "object" ? m.name : m) !== matName);
    const updatedItems = [...items];
    updatedItems[itemIdx] = { ...targetItem, requiredMaterials: filtered };
    updateDrawerJO({ inspectionItems: updatedItems });
  };

  const confirmAddMaterial = async (itemIdx: number) => {
    if (!selectedPartName || !drawerJobOrder) return;
    const items = drawerJobOrder.inspectionItems || [];
    const targetItem = items[itemIdx];

    const matObj = rawMaterialsList.find((m: any) => m.name === selectedPartName || m.materials_id === selectedPartName || m.id === selectedPartName);

    if (targetItem && targetItem.id && matObj) {
      const matId = matObj.materials_id || matObj.id;
      try {
        await apiService.addMaterialToCart(targetItem.id, matId, addMaterialQtyInput);
      } catch (err) {
        console.error("Failed to add material to cart", err);
      }
    }

    // Local UI update for instant response
    const existing = targetItem?.requiredMaterials || [];
    const existingIndex = existing.findIndex((m) => (typeof m === "object" ? m.name : m) === selectedPartName);
    let updatedReqs: MaterialRequirement[];

    if (existingIndex >= 0) {
      updatedReqs = existing.map((m, i) => {
        const name = typeof m === "object" ? m.name : m;
        const qty = typeof m === "object" ? m.qty : 1;
        const baseObj: MaterialRequirement = typeof m === "object" ? m : { name, qty: 1 };
        if (i === existingIndex) {
          return { ...baseObj, name, qty: qty + addMaterialQtyInput };
        }
        return baseObj;
      });
    } else {
      const normalizedExisting: MaterialRequirement[] = existing.map(m => typeof m === "object" ? m : { name: m, qty: 1 });
      updatedReqs = [...normalizedExisting, { name: selectedPartName, qty: addMaterialQtyInput, price: matObj?.price || 0 }];
    }

    const updatedItems = [...items];
    updatedItems[itemIdx] = { ...targetItem, requiredMaterials: updatedReqs };
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
            <div className="col-span-full py-16 px-4 text-center max-w-lg mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 my-6">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Wrench className="w-7 h-7 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm">No Active Jobs Found</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  There are currently no job orders assigned under this status tab.
                </p>
              </div>
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
                      {jo.status === "New" && (
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

                      {jo.status === "Work in progress" && (
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

                      {jo.status === "Job completed" && (
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

                    {drawerJobOrder.status !== "Job completed" ? (
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
                                                        <span className="font-normal text-slate-700 truncate">{name}</span>
                                                      </div>
                                                    );
                                                  }

                                                  return (
                                                    <div key={name} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-red-50/80 bg-white border border-slate-100 transition-all text-xs group">
                                                      <div className="flex items-center gap-2 min-w-0">
                                                        <span className="font-normal text-slate-700 truncate pr-2">{name}</span>
                                                      </div>
                                                      <div className="flex items-center gap-2 shrink-0">
                                                        <span className="font-normal text-slate-700 text-xs min-w-[20px] text-right group-hover:hidden pr-1">
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

                                              {addMaterialStep === "SELECT_PART" ? (
                                                /* STEP 2: Radio Button Selection Screen */
                                                <div className="space-y-2.5">

                                                  {/* Radio Button Options List (Groups recommended materials at the top) */}
                                                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                                    {(() => {
                                                      const recommended = laborMaterialsMap[item.name] || [];
                                                      const filteredList = materialsList.filter((opt) =>
                                                        opt.label.toLowerCase().includes(materialSearchQuery.toLowerCase())
                                                      );
                                                      
                                                      const recommendedOptions = filteredList.filter((opt) =>
                                                        recommended.includes(opt.value)
                                                      );
                                                      const otherOptions = filteredList.filter((opt) =>
                                                        !recommended.includes(opt.value)
                                                      );

                                                      return (
                                                        <>
                                                          {recommendedOptions.length > 0 && (
                                                            <div className="space-y-1">
                                                              <div className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider border border-emerald-200/50">
                                                                Recommended for {item.name}
                                                              </div>
                                                              {recommendedOptions.map((opt) => (
                                                                <label
                                                                  key={opt.value}
                                                                  onClick={() => {
                                                                    setSelectedPartName(opt.value);
                                                                    setAddMaterialStep("SET_QUANTITY");
                                                                  }}
                                                                  className="flex items-center gap-2.5 py-2 px-3 hover:bg-emerald-50 bg-white rounded-xl cursor-pointer transition-colors border border-emerald-100/50 group/item"
                                                                >
                                                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                                                    selectedPartName === opt.value
                                                                      ? "border-emerald-600 bg-emerald-600"
                                                                      : "border-slate-300 bg-white group-hover/item:border-emerald-400"
                                                                  }`}>
                                                                    {selectedPartName === opt.value ? (
                                                                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                                    ) : (
                                                                      <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/item:bg-emerald-200/50" />
                                                                    )}
                                                                  </div>
                                                                  <span className="text-xs font-semibold text-slate-800 group-hover/item:text-emerald-950">{opt.label}</span>
                                                                </label>
                                                              ))}
                                                            </div>
                                                          )}

                                                          {otherOptions.length > 0 && (
                                                            <div className="space-y-1 pt-1.5">
                                                              {recommendedOptions.length > 0 && (
                                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-0.5">
                                                                  Other Materials
                                                                </div>
                                                              )}
                                                              {otherOptions.map((opt) => (
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
                                                          )}
                                                        </>
                                                      );
                                                    })()}
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
                      <div className="space-y-2.5">
                        {drawerJobOrder.inspectionItems.map((item, idx) => {
                          const effectiveStatus = item.status || "PENDING";
                          const isExpanded = expandedIndex === idx;
                          const photos = getItemPhotos(item, effectiveStatus);
                          const currentNote = getItemNote(item, effectiveStatus);

                          const statusLabel =
                            effectiveStatus === "GOOD" ? "Good" :
                            effectiveStatus === "ISSUE" ? "Issue" :
                            effectiveStatus === "MONITOR" ? "Monitor" : "Pending";

                          const statusColorClass =
                            effectiveStatus === "GOOD" ? "text-emerald-600" :
                            effectiveStatus === "ISSUE" ? "text-red-600" :
                            effectiveStatus === "MONITOR" ? "text-amber-600" : "text-slate-500";

                          return (
                            <div
                              key={idx}
                              className={`border rounded-2xl transition-all overflow-hidden bg-white ${
                                isExpanded
                                  ? "border-slate-300 shadow-xs"
                                  : "border-slate-200"
                              }`}
                            >
                              {/* ACCORDION HEADER */}
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

                              {/* ACCORDION BODY (FRONT DESK DESIGN MATCH) */}
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
                                          {currentNote ? (
                                            currentNote
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

                                  {/* 3. MATERIALS NEEDED / APPLIED */}
                                  {item.requiredMaterials && item.requiredMaterials.length > 0 && (effectiveStatus === "ISSUE" || effectiveStatus === "GOOD") && (
                                    <div>
                                      {effectiveStatus === "ISSUE" ? (
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
                                                <div key={mIdx} className="flex items-center justify-between py-1 px-0.5 text-xs font-normal text-slate-700">
                                                  <span>{name}</span>
                                                  <span className="font-normal text-slate-700 text-xs">{qty}</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
                                            MATERIALS APPLIED
                                          </div>
                                          <div className="space-y-1">
                                            {item.requiredMaterials.map((m: any, mIdx: number) => {
                                              const name = typeof m === "object" ? m.name : m;
                                              return (
                                                <div key={mIdx} className="flex items-center gap-2 py-1 px-0.5 text-xs font-normal text-slate-700">
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

                {drawerJobOrder.status === "New" && (
                  <button
                    onClick={async () => {
                      try {
                        const updated = await apiService.updateJobOrderStatus(drawerJobOrder.id, "Work in progress");
                        setJobOrders((prev) => prev.map((jo) => (jo.id === updated.id ? updated : jo)));
                        setDrawerJobOrder(updated);
                        triggerToast(`Started inspection — Job Order is now Work in progress`);
                      } catch (e) {
                        const updated = { ...drawerJobOrder, status: "Work in progress" as const };
                        setJobOrders((prev) => prev.map((jo) => (jo.id === updated.id ? updated : jo)));
                        setDrawerJobOrder(updated);
                        triggerToast(`Started inspection — Job Order is now Work in progress`);
                      }
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
