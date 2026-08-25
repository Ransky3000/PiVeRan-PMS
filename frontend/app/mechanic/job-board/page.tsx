"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { apiService, subscribeToJobOrders } from "@/app/apiService";
import { SelectOption } from "@/components/CustomSelect";
import { Search, CheckCircle2, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { JobOrder, InspectionItem, MaterialRequirement } from "../../types";
import { getItemPhotos, getItemNote } from "./mechanicHelpers";
import { MechanicJobCard } from "./MechanicJobCard";
import { InspectionDrawer } from "./InspectionDrawer";
import { AddMaterialModal } from "./AddMaterialModal";
import { ProofLightbox } from "./ProofLightbox";

const INITIAL_MATERIAL_OPTIONS: SelectOption[] = [];

export default function MechanicJobBoardPage() {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"NEW" | "WIP" | "JOB_COMPLETED">("WIP");
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [drawerJobOrder, setDrawerJobOrder] = useState<JobOrder | null>(null);
  const [lightboxData, setLightboxData] = useState<{ itemIdx: number; photoIdx: number } | null>(null);

  // Materials master list & quick modal state
  const [materialsList, setMaterialsList] = useState<SelectOption[]>(INITIAL_MATERIAL_OPTIONS);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [newMaterialInput, setNewMaterialInput] = useState("");

  // 4-Step Inline Add Material Flow
  const [activeAddMaterialItemIdx, setActiveAddMaterialItemIdx] = useState<number | null>(null);
  const [addMaterialStep, setAddMaterialStep] = useState<"SELECT_PART" | "SET_QUANTITY">("SELECT_PART");
  const [selectedPartName, setSelectedPartName] = useState<string | null>(null);
  const [addMaterialQtyInput, setAddMaterialQtyInput] = useState<number>(1);
  const [materialSearchQuery, setMaterialSearchQuery] = useState<string>("");

  const [laborMaterialsMap, setLaborMaterialsMap] = useState<Record<string, string[]>>({});

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
      }
    };
    loadJobOrders();

    const unsubscribe = subscribeToJobOrders(() => {
      loadJobOrders();
    });
    return () => unsubscribe();
  }, [drawerJobOrder?.id]);

  useEffect(() => {
    const loadMaterialsAndLabor = async () => {
      try {
        const mats = await apiService.getMaterials();
        if (mats && mats.length > 0) {
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

  const newJobsList = useMemo(() => jobOrders.filter((j) => j.status === "New"), [jobOrders]);
  const wipJobsList = useMemo(() => jobOrders.filter((j) => j.status === "Work in progress"), [jobOrders]);
  const jobCompletedList = useMemo(() => jobOrders.filter((j) => j.status === "Job completed"), [jobOrders]);

  const filteredJobs = useMemo(() => {
    const list = activeTab === "NEW" ? newJobsList : activeTab === "WIP" ? wipJobsList : jobCompletedList;
    return list.filter((j) => {
      return (
        j.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
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

  const updateInspectionItemNote = (idx: number, note: string) => {
    const items = drawerJobOrder?.inspectionItems || [];
    const updatedItems = [...items];
    const targetItem = updatedItems[idx];
    const currentStatus = targetItem.status || "PENDING";
    const statusNotes = { ...(targetItem.statusNotes || {}), [currentStatus]: note };
    updatedItems[idx] = { ...targetItem, mechanicNote: note, statusNotes };
    updateDrawerJO({ inspectionItems: updatedItems });

    if (targetItem && targetItem.id) {
      apiService.updateInspectionItem(targetItem.id, {
        status: targetItem.status,
        statusNotes,
        statusPhotos: targetItem.statusPhotos || {}
      }).catch(err => {
        console.error("Failed to update inspection item note in backend", err);
      });
    }
  };

  const handleAddPhotoToItem = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !drawerJobOrder) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Url = reader.result as string;
      const items = drawerJobOrder.inspectionItems || [];
      const updatedItems = [...items];
      const targetItem = updatedItems[idx];
      const currentStatus = targetItem.status || "PENDING";
      const existingPhotos = getItemPhotos(targetItem, currentStatus);
      const newPhotos = [...existingPhotos, base64Url];
      const statusPhotos = { ...(targetItem.statusPhotos || {}), [currentStatus]: newPhotos };

      updatedItems[idx] = {
        ...targetItem,
        proofPhotoUrl: base64Url,
        statusPhotos
      };
      updateDrawerJO({ inspectionItems: updatedItems });

      if (targetItem && targetItem.id) {
        apiService.updateInspectionItem(targetItem.id, {
          status: targetItem.status,
          statusNotes: targetItem.statusNotes || {},
          statusPhotos
        }).catch(err => {
          console.error("Failed to update inspection item photo in backend", err);
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhotoFromItem = (itemIdx: number, photoIdx: number) => {
    if (!drawerJobOrder) return;
    const items = drawerJobOrder.inspectionItems || [];
    const updatedItems = [...items];
    const targetItem = updatedItems[itemIdx];
    const currentStatus = targetItem.status || "PENDING";
    const existingPhotos = getItemPhotos(targetItem, currentStatus);
    const newPhotos = existingPhotos.filter((_, i) => i !== photoIdx);
    const statusPhotos = { ...(targetItem.statusPhotos || {}), [currentStatus]: newPhotos };

    updatedItems[itemIdx] = {
      ...targetItem,
      proofPhotoUrl: newPhotos[0] || undefined,
      statusPhotos
    };
    updateDrawerJO({ inspectionItems: updatedItems });

    if (targetItem && targetItem.id) {
      apiService.updateInspectionItem(targetItem.id, {
        status: targetItem.status,
        statusNotes: targetItem.statusNotes || {},
        statusPhotos
      }).catch(err => {
        console.error("Failed to remove photo in backend", err);
      });
    }
  };

  const updateMaterialQty = (itemIdx: number, matName: string, newQty: number) => {
    if (!drawerJobOrder) return;
    const items = drawerJobOrder.inspectionItems || [];
    const targetItem = items[itemIdx];
    if (!targetItem) return;

    const existingReqs = targetItem.requiredMaterials || [];
    const updatedReqs = existingReqs.map((m) => {
      const name = typeof m === "object" ? m.name : m;
      const baseObj: MaterialRequirement = typeof m === "object" ? m : { name, qty: 1 };
      if (name.toLowerCase() === matName.toLowerCase()) {
        return { ...baseObj, qty: newQty };
      }
      return baseObj;
    });

    const updatedItems = [...items];
    updatedItems[itemIdx] = { ...targetItem, requiredMaterials: updatedReqs };
    updateDrawerJO({ inspectionItems: updatedItems });
  };

  const removeMaterialItem = (itemIdx: number, matName: string) => {
    if (!drawerJobOrder) return;
    const items = drawerJobOrder.inspectionItems || [];
    const targetItem = items[itemIdx];
    if (!targetItem) return;

    const existingReqs = targetItem.requiredMaterials || [];
    const targetReq = existingReqs.find((m) => {
      const name = typeof m === "object" ? m.name : m;
      return name.toLowerCase() === matName.toLowerCase();
    });

    const updatedReqs = existingReqs.filter((m) => {
      const name = typeof m === "object" ? m.name : m;
      return name.toLowerCase() !== matName.toLowerCase();
    });

    const updatedItems = [...items];
    updatedItems[itemIdx] = { ...targetItem, requiredMaterials: updatedReqs };
    updateDrawerJO({ inspectionItems: updatedItems });

    if (targetItem && targetItem.id && targetReq && typeof targetReq === "object" && targetReq.cart_id) {
      (apiService as any).removeCartItem(targetItem.id, targetReq.cart_id).catch((err: any) => {
        console.error("Failed to remove material from backend cart", err);
      });
    }
  };

  const confirmAddMaterial = (itemIdx: number) => {
    if (!selectedPartName || !drawerJobOrder) return;

    const items = drawerJobOrder.inspectionItems || [];
    const targetItem = items[itemIdx];
    if (!targetItem) return;

    const existing = targetItem.requiredMaterials || [];
    const existingIndex = existing.findIndex((m) => {
      const name = typeof m === "object" ? m.name : m;
      return name.toLowerCase() === selectedPartName.toLowerCase();
    });

    let updatedReqs: MaterialRequirement[] = [];
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
      updatedReqs = [...normalizedExisting, { name: selectedPartName, qty: addMaterialQtyInput }];
    }

    const updatedItems = [...items];
    updatedItems[itemIdx] = { ...targetItem, requiredMaterials: updatedReqs };
    updateDrawerJO({ inspectionItems: updatedItems });

    if (targetItem && targetItem.id) {
      (apiService as any).addCartItem(targetItem.id, {
        material_name: selectedPartName,
        quantity: addMaterialQtyInput
      }).catch((err: any) => {
        console.error("Failed to add material to backend cart", err);
      });
    }

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
            filteredJobs.map((jo) => (
              <MechanicJobCard key={jo.id} jo={jo} onClick={() => setDrawerJobOrder({ ...jo })} />
            ))
          )}
        </div>
      </div>

      {/* INSPECTION DRAWER */}
      <AnimatePresence>
        {drawerJobOrder && (
          <InspectionDrawer
            key={drawerJobOrder.id}
            drawerJobOrder={drawerJobOrder}
            onClose={() => setDrawerJobOrder(null)}
            updateInspectionItemStatus={updateInspectionItemStatus}
            updateInspectionItemNote={updateInspectionItemNote}
            handleAddPhotoToItem={handleAddPhotoToItem}
            handleRemovePhotoFromItem={handleRemovePhotoFromItem}
            updateMaterialQty={updateMaterialQty}
            removeMaterialItem={removeMaterialItem}
            confirmAddMaterial={confirmAddMaterial}
            materialsList={materialsList}
            laborMaterialsMap={laborMaterialsMap}
            activeAddMaterialItemIdx={activeAddMaterialItemIdx}
            setActiveAddMaterialItemIdx={setActiveAddMaterialItemIdx}
            addMaterialStep={addMaterialStep}
            setAddMaterialStep={setAddMaterialStep}
            selectedPartName={selectedPartName}
            setSelectedPartName={setSelectedPartName}
            addMaterialQtyInput={addMaterialQtyInput}
            setAddMaterialQtyInput={setAddMaterialQtyInput}
            materialSearchQuery={materialSearchQuery}
            setMaterialSearchQuery={setMaterialSearchQuery}
            setLightboxData={setLightboxData}
            onStartInspection={async () => {
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
          />
        )}
      </AnimatePresence>

      {/* PROOF LIGHTBOX */}
      <AnimatePresence>
        {lightboxData && drawerJobOrder && (
          <ProofLightbox
            key="proof-lightbox"
            lightboxData={lightboxData}
            drawerJobOrder={drawerJobOrder}
            onClose={() => setLightboxData(null)}
            onSelectPhoto={(photoIdx) => setLightboxData({ itemIdx: lightboxData.itemIdx, photoIdx })}
            onRemovePhoto={handleRemovePhotoFromItem}
            onAddPhoto={handleAddPhotoToItem}
          />
        )}
      </AnimatePresence>

      {/* ADD MATERIAL MODAL */}
      <AnimatePresence>
        {isAddMaterialModalOpen && (
          <AddMaterialModal
            key="add-material-modal"
            isOpen={isAddMaterialModalOpen}
            onClose={() => setIsAddMaterialModalOpen(false)}
            onSubmit={handleAddNewMaterialSubmit}
            newMaterialInput={newMaterialInput}
            setNewMaterialInput={setNewMaterialInput}
          />
        )}
      </AnimatePresence>
    </TailAdminLayout>
  );
}
