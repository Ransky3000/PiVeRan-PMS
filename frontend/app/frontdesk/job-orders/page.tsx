"use client";

import React, { useState, useMemo, useEffect } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { apiService, subscribeToJobOrders } from "@/app/apiService";
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
  Tag,
  ClipboardX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { JobOrder, InspectionItem, EstimateLineItem, JOStatus } from "../../types";

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

const getServiceDescription = (serviceType?: string, customDesc?: string): string => {
  return customDesc || "";
};

const STATUS_CONFIG: Record<JOStatus, { label: string; color: string; bg: string; border: string }> = {
  New: { label: "New", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  "Work in progress": { label: "Work in progress", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  "Job completed": { label: "Job Completed", color: "text-emerald-800", bg: "bg-emerald-100", border: "border-emerald-300" }
};

const getEffectiveEstimateItems = (jo: JobOrder): EstimateLineItem[] => {
  const existing = jo.estimateItems || [];
  const map = new Map<string, EstimateLineItem>();

  existing.forEach((item) => {
    map.set(item.id, item);
  });

  (jo.inspectionItems || []).forEach((ins) => {
    (ins.requiredMaterials || []).forEach((m: any) => {
      if (typeof m === "object" && m.name) {
        const id = m.cart_id || m.material_id || m.name;
        if (!map.has(id)) {
          map.set(id, {
            id: id,
            description: m.name,
            qty: m.qty || 1,
            unitPrice: m.price || 0,
            customerApproved: m.decision === "Buy"
          });
        } else {
          const cur = map.get(id)!;
          if (m.decision !== undefined) {
            cur.customerApproved = m.decision === "Buy";
          }
        }
      }
    });
  });

  return Array.from(map.values());
};

const getEstimateCalculations = (jo: JobOrder) => {
  const items = getEffectiveEstimateItems(jo);
  const laborFee = jo.serviceFee || 0;
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

const getItemNote = (item: Partial<InspectionItem>, targetStatus?: InspectionItem["status"]): string => {
  const activeStatus = targetStatus || item.status;
  if (activeStatus && activeStatus !== "PENDING" && item.statusNotes?.[activeStatus] !== undefined) {
    return item.statusNotes[activeStatus] || "";
  }
  return item.mechanicNote || "";
};

const getItemPhotos = (item: Partial<InspectionItem>, targetStatus?: InspectionItem["status"]): string[] => {
  const activeStatus = targetStatus || item.status;
  if (activeStatus && activeStatus !== "PENDING" && item.statusPhotos?.[activeStatus]) {
    return item.statusPhotos[activeStatus] || [];
  }
  if (item.photos && item.photos.length > 0) return item.photos;
  if (item.photoUrl) return [item.photoUrl];
  return [];
};

/* ───────────────────────────────────────────
   MAIN PAGE COMPONENT
   ─────────────────────────────────────────── */

export default function JobOrdersPage() {
  const [activeTab, setActiveTab] = useState<"New" | "Work in progress" | "Job completed">("Work in progress");
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
  // Additional states for new Owner
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [newOwnerFb, setNewOwnerFb] = useState("");
  // Additional states for new Vehicle
  const [newMake, setNewMake] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newPlateNumber, setNewPlateNumber] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  // Master Data
  const [registeredOwnersDatabase, setRegisteredOwnersDatabase] = useState<any[]>([]);
  
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [availableMechanicsList, setAvailableMechanicsList] = useState<string[]>([]);
  const [allBundles, setAllBundles] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ownersData = await apiService.getOwners();
        const mechanicsData = await apiService.getMechanics();
        const vehiclesData = await apiService.getVehicles();
        
        // Map backend models to UI expected structure for now
        setRegisteredOwnersDatabase(ownersData);
        if (apiService.getBundles) {
          const bundles = await apiService.getBundles();
          setAllBundles(bundles);
        }
        setAvailableMechanicsList(mechanicsData.map((m: any) => m.name));
        setAllVehicles(vehiclesData);
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    fetchData();
  }, []);

  

  // Create Form State
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [formOwnerPhone, setFormOwnerPhone] = useState("");
  const [formOwnerFb, setFormOwnerFb] = useState("");
  const [selectedPlateNumber, setSelectedPlateNumber] = useState("");
  const [formOdometerKm, setFormOdometerKm] = useState("");
  const [formServiceType, setFormServiceType] = useState("");
  const [formMechanics, setFormMechanics] = useState<string[]>([]);
  const [formVehiclePhotoUrl, setFormVehiclePhotoUrl] = useState<string>("");

  const [isEditingDrawer, setIsEditingDrawer] = useState(false);
  const [editOdometer, setEditOdometer] = useState("");
  const [editServiceType, setEditServiceType] = useState("");
  const [editMechanics, setEditMechanics] = useState<string[]>([]);

  useEffect(() => {
    if (!drawerJobOrder) {
      setIsEditingDrawer(false);
    }
  }, [drawerJobOrder]);

  const handleStartEditDrawer = () => {
    if (!drawerJobOrder) return;
    setIsEditingDrawer(true);
    const rawOdo = parseInt(drawerJobOrder.odometer.replace(/[^0-9]/g, "")) || 0;
    setEditOdometer(rawOdo.toString());
    setEditServiceType(drawerJobOrder.serviceType);
    setEditMechanics(drawerJobOrder.inchargeMechanics || []);
  };

  const handleSaveEditDrawer = async () => {
    if (!drawerJobOrder) return;
    
    const activeBundle = allBundles.find((b: any) => b.packageName === editServiceType) || allBundles[0];
    if (!activeBundle) {
      triggerToast("Error: No bundle selected.");
      return;
    }
    
    try {
      const updated = await apiService.updateJobOrder(drawerJobOrder.id, {
        odometer: parseInt(editOdometer || "0") || 0,
        bundle_id: activeBundle.id,
        mechanic_names: editMechanics
      });
      const data = await apiService.getJobOrders();
      setJobOrders(data);
      setDrawerJobOrder(updated);
      setIsEditingDrawer(false);
      triggerToast(`Job Order ${drawerJobOrder.id} updated successfully!`);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to save changes.");
    }
  };

  const handleDeleteDrawer = () => {
    if (!drawerJobOrder) return;
    if (confirm(`Are you sure you want to delete Job Order ${drawerJobOrder.id}?`)) {
      apiService.deleteJobOrder(drawerJobOrder.id).then(() => {
        setJobOrders(prev => prev.filter(j => j.id !== drawerJobOrder.id));
        setDrawerJobOrder(null);
        triggerToast("Job Order deleted successfully!");
      }).catch(err => {
        console.error(err);
        triggerToast("Failed to delete Job Order.");
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoDataUrl = reader.result as string;
        setFormVehiclePhotoUrl(photoDataUrl);
        triggerToast("Vehicle photo uploaded!");

        if (selectedPlateNumber) {
          const activeVehicle = currentOwnerObj?.vehicles?.find((v: any) => (v.plate_number || v.plate) === selectedPlateNumber) ||
                                allVehicles?.find((v: any) => (v.plate_number || v.plate) === selectedPlateNumber);
          if (activeVehicle && activeVehicle.id) {
            try {
              await apiService.updateVehicle(activeVehicle.id, { photo_url: photoDataUrl });
              const freshOwners = await apiService.getOwners();
              setRegisteredOwnersDatabase(freshOwners);
            } catch (err) {
              console.error("Failed to update vehicle photo in DB", err);
            }
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const currentOwnerObj = useMemo(() => {
    return registeredOwnersDatabase.find((o) => o.id === selectedOwnerId) || registeredOwnersDatabase[0];
  }, [selectedOwnerId, registeredOwnersDatabase]);

  const ownerOptions: SelectOption[] = useMemo(() => registeredOwnersDatabase.map((o: any) => ({ value: o.id, label: o.name })), [registeredOwnersDatabase]);
  const vehicleOptions: SelectOption[] = useMemo(() => currentOwnerObj?.vehicles?.map((v: any) => {
    const plate = v.plate_number || v.plate || "No Plate";
    const model = v.model || v.make || "Unknown Model";
    return { value: plate, label: `${model} (${plate})` };
  }) || [], [currentOwnerObj]);
  const serviceTypeOptions: SelectOption[] = useMemo(() => {
    return allBundles.map(b => ({ value: b.packageName, label: b.packageName }));
  }, [allBundles]);
  const mechanicOptions: SelectOption[] = useMemo(() => availableMechanicsList.map((m) => ({ value: m, label: m })), [availableMechanicsList]);

  const activeServiceInfo = useMemo(() => {
    if (allBundles.length > 0) {
      const b = allBundles.find(x => x.packageName === formServiceType);
      if (b) {
        return { interval: b.targetInterval || b.description || "N/A", items: b.servicesIncluded || [] };
      }
    }
    return { interval: "N/A", items: [] };
  }, [allBundles, formServiceType]);

  
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadJobOrders = async () => {
      try {
        const data = await apiService.getJobOrders();
        // The backend returns models. Normalize them if needed.
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

  useEffect(() => {
    if (!selectedPlateNumber) return;
    const match = currentOwnerObj?.vehicles?.find((v: any) => (v.plate_number || v.plate) === selectedPlateNumber) ||
                  allVehicles?.find((v: any) => (v.plate_number || v.plate) === selectedPlateNumber);
    if (match && (match.photo_url || match.photoUrl)) {
      setFormVehiclePhotoUrl(match.photo_url || match.photoUrl);
    }
  }, [selectedPlateNumber, currentOwnerObj, allVehicles]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOwnerDropdownChange = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    const ownerObj = registeredOwnersDatabase.find((o) => o.id === ownerId);
    if (ownerObj) {
      setFormOwnerPhone(ownerObj.phone || "");
      setFormOwnerFb(ownerObj.fb_handle || ownerObj.fbHandle || "");
      if (ownerObj.vehicles && ownerObj.vehicles.length > 0) {
        const firstV = ownerObj.vehicles[0];
        const plate = firstV.plate_number || firstV.plate || "";
        setSelectedPlateNumber(plate);
        setFormVehiclePhotoUrl(firstV.photo_url || firstV.photoUrl || "");
      } else {
        setSelectedPlateNumber("");
        setFormVehiclePhotoUrl("");
      }
    }
  };

  const handleSaveAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (addNewModalType === "MECHANIC" || addNewModalType === "OWNER") {
      if (!newInputName.trim()) return;
    } else if (addNewModalType === "VEHICLE") {
      if (!newPlateNumber.trim() || !newModel.trim()) return;
    }
    if (addNewModalType === "MECHANIC") {
      setAvailableMechanicsList([...availableMechanicsList, newInputName.trim()]);
      setFormMechanics([...formMechanics, newInputName.trim()]);
      triggerToast(`Added mechanic: ${newInputName.trim()}`);
    } else if (addNewModalType === "OWNER") {
      apiService.createOwner({
        name: newInputName.trim(),
        phone: newOwnerPhone.trim() || "0917-000-0000",
        fb_handle: newOwnerFb.trim(),
        vehicle_ids: []
      }).then(newOwner => {
        setRegisteredOwnersDatabase(prev => [...prev, newOwner]);
        setSelectedOwnerId(newOwner.id);
        triggerToast(`Added owner: ${newOwner.name}`);
      });
    } else if (addNewModalType === "VEHICLE") {
      const ownerIdSnapshot = selectedOwnerId;
      apiService.createVehicle({
        make: newMake,
        model: newModel,
        year: parseInt(newYear) || 2020,
        color: newColor || "Black",
        plate_number: newPlateNumber,
        photo_url: newPhotoUrl,
        owner_id: ownerIdSnapshot
      }).then(async (newVehicle) => {
        setAllVehicles(prev => [...prev, newVehicle]);
        // Refetch full owners list from API so DB relationship is reflected
        try {
          const freshOwners = await apiService.getOwners();
          setRegisteredOwnersDatabase(freshOwners);
        } catch (e) {
          setRegisteredOwnersDatabase(prev =>
            prev.map(o =>
              o.id === ownerIdSnapshot
                ? { ...o, vehicles: [...(o.vehicles || []), newVehicle] }
                : o
            )
          );
        }
        setSelectedPlateNumber(newVehicle.plate_number);
        triggerToast(`Added vehicle: ${newVehicle.plate_number}`);
      });
    }
    setAddNewModalType(null);
    setNewInputName("");
    setNewOwnerPhone("");
    setNewOwnerFb("");
    setNewMake("");
    setNewModel("");
    setNewYear("");
    setNewColor("");
    setNewPlateNumber("");
    setNewPhotoUrl("");
  };

  const handleSubmitNewJobOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const activeVehicle = currentOwnerObj?.vehicles?.find(
      (v: any) => (v.plate_number || v.plate) === selectedPlateNumber
    ) || currentOwnerObj?.vehicles?.[0];

    if (!activeVehicle) {
      triggerToast("Error: No vehicle found for the owner.");
      return;
    }

    const activeBundle = allBundles.find((b: any) => b.packageName === formServiceType) || allBundles[0];
    if (!activeBundle) {
      triggerToast("Error: No bundle selected.");
      return;
    }

    apiService.createJobOrder({
      owner_id: selectedOwnerId,
      vehicle_id: activeVehicle.id,
      bundle_id: activeBundle.id,
      odometer: parseInt(formOdometerKm || "0") || 0,
      mechanic_names: formMechanics
    }).then(async (newJO) => {
      try {
        const data = await apiService.getJobOrders();
        setJobOrders(data);
      } catch (err) {
        setJobOrders(prev => [newJO, ...prev]);
      }
      setFormVehiclePhotoUrl("");
      triggerToast(`Submitted Job Order ${newJO.id} for Inspection!`);
      setIsCreateModalOpen(false);
    }).catch(err => {
      console.error("Failed to create job order on backend", err);
      triggerToast("Failed to submit Job Order to server.");
    });
  };

  /* ─── STATUS PROGRESSION ─── */
  const advanceStatus = (joId: string) => {
    setJobOrders((prev) =>
      prev.map((jo) => {
        if (jo.id !== joId) return jo;
        const next: Record<JOStatus, JOStatus | null> = {
          New: "Work in progress",
          "Work in progress": "Job completed",
          "Job completed": null
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

  const handleToggleCartDecision = async (cdId: string | number, cartId: string, currentDecision?: "Buy" | "No") => {
    const newDecision = currentDecision === "Buy" ? "No" : "Buy";
    if (drawerJobOrder) {
      const updatedItems = (drawerJobOrder.inspectionItems || []).map((item) => {
        if (item.id === cdId && item.requiredMaterials) {
          const updatedMats = item.requiredMaterials.map((m: any) => {
            if (typeof m === "object" && m.cart_id === cartId) {
              return { ...m, decision: newDecision };
            }
            return m;
          });
          return { ...item, requiredMaterials: updatedMats };
        }
        return item;
      });
      updateDrawerJO({ inspectionItems: updatedItems });
    }
    await apiService.updateCartItemDecision(cdId, cartId, newDecision);
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
    if (!drawerJobOrder) return;
    const currentItems = getEffectiveEstimateItems(drawerJobOrder);
    const updatedItems = currentItems.map((i) => (i.id === lineId ? { ...i, ...updates } : i));
    updateDrawerJO({ estimateItems: updatedItems });

    if ("customerApproved" in updates) {
      const isBuy = updates.customerApproved !== false;
      const decisionStr: "Buy" | "No" = isBuy ? "Buy" : "No";

      (drawerJobOrder.inspectionItems || []).forEach((insItem) => {
        (insItem.requiredMaterials || []).forEach((m: any) => {
          if (typeof m === "object" && (m.cart_id === lineId || m.material_id === lineId || m.name === lineId)) {
            if (insItem.id && m.cart_id) {
              apiService.updateCartItemDecision(insItem.id, m.cart_id, decisionStr);
            }
          }
        });
      });
    }
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
      const matchesTab = jo.status === activeTab;
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

  /* ─── TAB DEFINITIONS (NEW, WORK IN PROGRESS, JOB COMPLETED) ─── */
  const tabDefs: { id: "New" | "Work in progress" | "Job completed"; label: string }[] = [
    { id: "New", label: "New" },
    { id: "Work in progress", label: "Work in progress" },
    { id: "Job completed", label: "Job completed" }
  ];

  const tabCounts = useMemo(() => {
    return {
      New: jobOrders.filter((j) => j.status === "New").length,
      "Work in progress": jobOrders.filter((j) => j.status === "Work in progress").length,
      "Job completed": jobOrders.filter((j) => j.status === "Job completed").length
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

        {/* CARD GRID OR EMPTY STATE */}
        {filteredJobOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-lg mx-auto my-8 space-y-4 shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ClipboardX className="w-8 h-8 text-slate-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">No Job Orders Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                There are currently no job orders for the selected status filter. Click <span className="font-semibold text-emerald-600">'+ Create Job Order'</span> above to start a new job order.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredJobOrders.map((jo) => {
              const sc = STATUS_CONFIG[jo.status];
              const badgeLabel = sc.label;
              return (
                <div
                  key={jo.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group max-w-xs w-full cursor-pointer"
                  onClick={() => setDrawerJobOrder({ ...jo })}
                >
                  <div className="h-40 bg-slate-100 relative flex items-center justify-center border-b border-slate-200 overflow-hidden">
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
                        <span className="font-bold text-slate-900">{jo.serviceType}</span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="text-slate-500 font-normal text-[11px]">Incharge Mechanics:</div>
                        <div className="flex flex-wrap gap-1">
                          {(jo.inchargeMechanics || []).map((mech, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-100 text-slate-700 font-normal text-[11px] px-2.5 py-0.5 rounded-lg border border-slate-200/80"
                            >
                              {mech}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Inspection / Progress indicator */}
                      {(() => {
                        const progress = getInspectionProgress(jo);
                        return (
                          <div className="space-y-1.5 pt-2 border-t border-slate-100">
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
                        );
                      })()}
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
        )}

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
                    <div>
                      <span className="text-slate-500">Odometer</span>
                      {isEditingDrawer ? (
                        <input
                          type="number"
                          value={editOdometer}
                          onChange={(e) => setEditOdometer(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs outline-none focus:border-slate-400 mt-0.5"
                        />
                      ) : (
                        <div className="font-medium text-slate-900">{drawerJobOrder.odometer}</div>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500">Service Category</span>
                      {isEditingDrawer ? (
                        <CustomSelect
                          value={editServiceType}
                          onChange={setEditServiceType}
                          options={serviceTypeOptions}
                          className="w-full mt-0.5"
                        />
                      ) : (
                        <div className="font-medium text-slate-900">{drawerJobOrder.serviceType}</div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100/80">
                    <span className="text-slate-500 font-medium text-xs block">Service Description</span>
                    <div className="font-semibold text-slate-800 text-xs mt-0.5">
                      {getServiceDescription(isEditingDrawer ? editServiceType : drawerJobOrder.serviceType, drawerJobOrder.serviceDescription)}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100/80">
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase mb-1.5">
                      <Wrench className="w-3.5 h-3.5 text-slate-400" /> Incharge Mechanics
                    </div>
                    {isEditingDrawer ? (
                      <CustomSelect
                        value={editMechanics}
                        onChange={setEditMechanics}
                        options={mechanicOptions}
                        isMultiSelect={true}
                        className="w-full mt-0.5"
                      />
                    ) : (
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
                    )}
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
                        {drawerJobOrder.status !== "New" && (
                          <span className="font-bold text-purple-600 text-xs">
                            {getInspectionProgress(drawerJobOrder).completed}/{getInspectionProgress(drawerJobOrder).total} Completed
                          </span>
                        )}
                      </div>
                      {drawerJobOrder.status !== "New" && (
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
                        const isNewJob = drawerJobOrder.status === "New";
                        const effectiveStatus = isNewJob ? "PENDING" : item.status;
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
                                              <div key={mIdx} className="flex items-center justify-between py-1 px-0.5 text-xs font-normal text-slate-700">
                                                <span>{name}</span>
                                                <span className="font-normal text-slate-700 text-xs">{qty}</span>
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
                  </div>
                )}

                {/* SECTION 3: ESTIMATE (EXACT MATCH FOR USER EXCALIDRAW MOCKUP) */}
                {drawerJobOrder && drawerJobOrder.status !== "New" && (
                  <div className="px-5 py-4 border-b border-slate-100 space-y-3.5 text-xs">
                    {/* Header with Title & Buy All master toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase">
                        <FileText className="w-3.5 h-3.5" /> Estimate
                      </div>
                      
                      {(() => {
                        const items = getEffectiveEstimateItems(drawerJobOrder);
                        const isAllBuy = items.length > 0 && items.every((i) => i.customerApproved !== false);
                        return (
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 font-semibold select-none">
                            <span>Buy all</span>
                            <input
                              type="checkbox"
                              checked={isAllBuy}
                              onChange={(e) => {
                                const nextVal = e.target.checked;
                                const current = getEffectiveEstimateItems(drawerJobOrder);
                                current.forEach((i) => {
                                  updateEstimateLine(i.id, { customerApproved: nextVal });
                                });
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </label>
                        );
                      })()}
                    </div>

                    {/* ESTIMATE ITEM CARDS */}
                    <div className="space-y-2.5">
                      {getEffectiveEstimateItems(drawerJobOrder).map((item) => {
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
                              <span className="font-normal text-slate-700 text-xs truncate">{item.description}</span>
                              
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
                {drawerJobOrder.status === "New" ? (
                  isEditingDrawer ? (
                    <>
                      <button
                        onClick={() => setIsEditingDrawer(false)}
                        className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEditDrawer}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleDeleteDrawer}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium text-xs rounded-xl transition-all cursor-pointer mr-auto"
                      >
                        Delete Job Order
                      </button>
                      <button
                        onClick={() => setDrawerJobOrder(null)}
                        className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        onClick={handleStartEditDrawer}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        Edit Job Order
                      </button>
                    </>
                  )
                ) : (
                  <>
                    <button
                      onClick={() => setDrawerJobOrder(null)}
                      className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                    >
                      Close
                    </button>
                    {drawerJobOrder.status !== "Job completed" && (
                      (() => {
                        const progress = getInspectionProgress(drawerJobOrder);
                        const isCompleted = (progress.total > 0 && progress.completed === progress.total);
                        return isCompleted ? (
                          <button
                            onClick={async () => {
                              try {
                                await apiService.updateJobOrderStatus(drawerJobOrder.id, "Job completed");
                                const data = await apiService.getJobOrders();
                                setJobOrders(data);
                                setDrawerJobOrder(null);
                                triggerToast(`${drawerJobOrder.id} → Marked as Completed`);
                              } catch (e) {
                                console.error("Failed to update status to completed", e);
                              }
                            }}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Complete</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-4 py-2 bg-slate-200 text-slate-400 font-medium text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-not-allowed opacity-70"
                            title="Unlocks once mechanics complete the inspection checklist items (100% completed)"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Complete</span>
                          </button>
                        );
                      })()
                    )}
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
                  <CustomSelect value={selectedPlateNumber} onChange={(val) => { 
                    setSelectedPlateNumber(val); 
                    const match = currentOwnerObj?.vehicles?.find((v: any) => (v.plate_number || v.plate) === val) || allVehicles?.find((v: any) => (v.plate_number || v.plate) === val);
                    if (match && (match.photo_url || match.photoUrl)) {
                      setFormVehiclePhotoUrl(match.photo_url || match.photoUrl);
                    } else {
                      setFormVehiclePhotoUrl("");
                    }
                  }} options={vehicleOptions} onAddNew={() => { setAddNewModalType("VEHICLE"); setNewPlateNumber(""); setNewModel(""); }} addNewLabel="New Vehicle" className="w-full" />
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
                        Click to open camera
                      </span>
                    </label>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">FB Contact</label>
                    <input type="text" value={formOwnerFb || ""} onChange={(e) => setFormOwnerFb(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-normal text-slate-800 outline-none focus:border-emerald-600" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Phone Number</label>
                    <input type="text" value={formOwnerPhone || ""} onChange={(e) => setFormOwnerPhone(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-normal text-slate-800 outline-none focus:border-emerald-600" />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Odometer (Km)</label>
                  <input type="number" required value={formOdometerKm || ""} onChange={(e) => setFormOdometerKm(e.target.value)} placeholder="62400" className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-normal text-slate-800 outline-none focus:border-emerald-600" />
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
                        {activeServiceInfo.items.map((item: any, idx: number) => (
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
                  <CustomSelect value={formMechanics} onChange={setFormMechanics} options={mechanicOptions} isMultiSelect={true} dropUp={true} placeholder="Select mechanics..." className="w-full" />
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
              className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 border border-slate-200 text-slate-900"
            >
              <form onSubmit={handleSaveAddNew} className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold">Add New {addNewModalType === "OWNER" ? "Owner" : addNewModalType === "VEHICLE" ? "Vehicle" : "Mechanic"}</h3>
                </div>

                {addNewModalType === "OWNER" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Full Name</label>
                      <input type="text" required value={newInputName} onChange={(e) => setNewInputName(e.target.value)} placeholder="Juan Dela Cruz" className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal text-slate-800 outline-none focus:border-emerald-600" autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Phone Number</label>
                        <input type="text" value={newOwnerPhone} onChange={(e) => setNewOwnerPhone(e.target.value)} placeholder="09XX-XXX-XXXX" className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal text-slate-800 outline-none focus:border-emerald-600" />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">FB Handle / Link</label>
                        <input type="text" value={newOwnerFb} onChange={(e) => setNewOwnerFb(e.target.value)} placeholder="@juan.delacruz" className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal text-slate-800 outline-none focus:border-emerald-600" />
                      </div>
                    </div>
                  </div>
                )}

                {addNewModalType === "VEHICLE" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Plate Number</label>
                      <input type="text" required value={newPlateNumber} onChange={(e) => setNewPlateNumber(e.target.value)} placeholder="ABC 1234" className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold uppercase text-slate-800 outline-none focus:border-emerald-600" autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Make</label>
                        <input type="text" value={newMake} onChange={(e) => setNewMake(e.target.value)} placeholder="Toyota" className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal text-slate-800 outline-none focus:border-emerald-600" />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Model</label>
                        <input type="text" required value={newModel} onChange={(e) => setNewModel(e.target.value)} placeholder="Wigo" className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal text-slate-800 outline-none focus:border-emerald-600" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Year</label>
                        <input type="text" value={newYear} onChange={(e) => setNewYear(e.target.value)} placeholder="2022" className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal text-slate-800 outline-none focus:border-emerald-600" />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Color</label>
                        <input type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="Red" className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal text-slate-800 outline-none focus:border-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Vehicle Photo</label>
                      {newPhotoUrl ? (
                        <div className="relative w-full h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 group">
                          <img src={newPhotoUrl} alt="Vehicle preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewPhotoUrl("")}
                            className="absolute top-1.5 right-1.5 p-1 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="bg-slate-50 border border-dashed border-slate-300 hover:border-emerald-500/80 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setNewPhotoUrl(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                          <Camera className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 mb-1" />
                          <span className="text-[11px] text-slate-400 group-hover:text-emerald-700 font-normal">
                            Click to open camera or browse photo
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {addNewModalType === "MECHANIC" && (
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Mechanic Name</label>
                    <input type="text" required value={newInputName} onChange={(e) => setNewInputName(e.target.value)} placeholder="Hitler Gaitera" className="w-full bg-white border border-slate-200 rounded-lg p-2 font-normal text-slate-800 outline-none focus:border-emerald-600" autoFocus />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setAddNewModalType(null)} className="px-3 py-1.5 text-slate-600 font-medium text-xs rounded-lg hover:bg-slate-100">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs">Save</button>
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
