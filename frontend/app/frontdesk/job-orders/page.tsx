"use client";

import React, { useState, useMemo, useEffect } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { apiService, subscribeToJobOrders } from "@/app/apiService";
import { SelectOption } from "@/components/CustomSelect";
import { Plus, Search, CheckCircle2, ClipboardX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { JobOrder, EstimateLineItem } from "@/app/types";
import { getEffectiveEstimateItems } from "./jobOrderHelpers";

import { JobOrderCard } from "./JobOrderCard";
import { JobOrderDrawer } from "./JobOrderDrawer";
import { CreateJobOrderModal } from "./CreateJobOrderModal";
import { PhotoLightbox } from "./PhotoLightbox";

export default function JobOrdersPage() {
  const [activeTab, setActiveTab] = useState<"New" | "Work in progress" | "Job completed">("Work in progress");
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Drawer State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingNewJO, setIsSubmittingNewJO] = useState(false);
  const [drawerJobOrder, setDrawerJobOrder] = useState<JobOrder | null>(null);
  const [lightboxData, setLightboxData] = useState<{ itemIdx: number; photoIdx: number } | null>(null);

  // Quick "Add New" Modal State
  const [addNewModalType, setAddNewModalType] = useState<"OWNER" | "VEHICLE" | "MECHANIC" | null>(null);
  const [newInputName, setNewInputName] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [newOwnerFb, setNewOwnerFb] = useState("");
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
    const activeBundle = (allBundles || []).find((b: any) => b.packageName === editServiceType) || (allBundles || [])[0];
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
        setJobOrders((prev) => prev.filter((j) => j.id !== drawerJobOrder.id));
        setDrawerJobOrder(null);
        triggerToast("Job Order deleted successfully!");
      }).catch((err) => {
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
          const activeVehicle =
            currentOwnerObj?.vehicles?.find((v: any) => (v.plate_number || v.plate) === selectedPlateNumber) ||
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
    return (allBundles || []).map((b) => ({ value: b.packageName, label: b.packageName }));
  }, [allBundles]);
  const mechanicOptions: SelectOption[] = useMemo(() => availableMechanicsList.map((m) => ({ value: m, label: m })), [availableMechanicsList]);

  const activeServiceInfo = useMemo(() => {
    if (allBundles && allBundles.length > 0) {
      const b = allBundles.find((x) => x.packageName === formServiceType);
      if (b) {
        return { interval: b.targetInterval || b.description || "N/A", items: b.servicesIncluded || [] };
      }
    }
    return { interval: "N/A", items: [] };
  }, [allBundles, formServiceType]);

  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadJobOrders = async () => {
      try {
        const data = await apiService.getJobOrders();
        if (!isMounted) return;
        setJobOrders(data);
      } catch (err) {
        console.error("Failed to load job orders", err);
      }
    };
    loadJobOrders();

    const unsubscribe = subscribeToJobOrders(() => {
      loadJobOrders();
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!selectedPlateNumber) return;
    const match =
      currentOwnerObj?.vehicles?.find((v: any) => (v.plate_number || v.plate) === selectedPlateNumber) ||
      allVehicles?.find((v: any) => (v.plate_number || v.plate) === selectedPlateNumber);
    if (match && (match.photo_url || match.photoUrl)) {
      setFormVehiclePhotoUrl(match.photo_url || match.photoUrl);
    }
  }, [selectedPlateNumber, currentOwnerObj, allVehicles]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
      }).then((newOwner) => {
        setRegisteredOwnersDatabase((prev) => [...prev, newOwner]);
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
        setAllVehicles((prev) => [...prev, newVehicle]);
        try {
          const freshOwners = await apiService.getOwners();
          setRegisteredOwnersDatabase(freshOwners);
        } catch (e) {
          setRegisteredOwnersDatabase((prev) =>
            prev.map((o) => (o.id === ownerIdSnapshot ? { ...o, vehicles: [...(o.vehicles || []), newVehicle] } : o))
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
    if (isSubmittingNewJO) return;

    const activeVehicle =
      currentOwnerObj?.vehicles?.find((v: any) => (v.plate_number || v.plate) === selectedPlateNumber) ||
      currentOwnerObj?.vehicles?.[0];

    if (!activeVehicle) {
      triggerToast("Error: No vehicle found for the owner.");
      return;
    }

    const activeBundle = (allBundles || []).find((b: any) => b.packageName === formServiceType) || (allBundles || [])[0];
    if (!activeBundle) {
      triggerToast("Error: No bundle selected.");
      return;
    }

    setIsSubmittingNewJO(true);
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
        setJobOrders((prev) => [newJO, ...prev]);
      }
      setFormVehiclePhotoUrl("");
      triggerToast(`Submitted Job Order ${newJO.id} for Inspection!`);
      setIsCreateModalOpen(false);
    }).catch((err) => {
      console.error("Failed to create job order on backend", err);
      triggerToast("Failed to submit Job Order to server.");
    }).finally(() => {
      setIsSubmittingNewJO(false);
    });
  };

  const updateDrawerJO = (updates: Partial<JobOrder>) => {
    setDrawerJobOrder((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      setJobOrders((list) => list.map((jo) => (jo.id === updated.id ? updated : jo)));

      if (updates.discount !== undefined || updates.estimateComment !== undefined) {
        apiService.updateJobOrder(updated.id, {
          discount: updates.discount,
          estimate_comment: updates.estimateComment
        }).catch((err) => console.warn("Failed to persist job order updates", err));
      }

      return updated;
    });
  };

  const updateEstimateLine = (lineId: string, updates: Partial<EstimateLineItem>) => {
    setDrawerJobOrder((prev) => {
      if (!prev) return null;

      const effective = getEffectiveEstimateItems(prev);
      const existingEstimateItems = prev.estimateItems || [];
      const hasInEstimate = existingEstimateItems.some((i) => i.id === lineId);

      let newEstimateItems: EstimateLineItem[];
      if (hasInEstimate) {
        newEstimateItems = existingEstimateItems.map((i) => (i.id === lineId ? { ...i, ...updates } : i));
      } else {
        const targetEff = effective.find((i) => i.id === lineId);
        if (targetEff) {
          newEstimateItems = [...existingEstimateItems, { ...targetEff, ...updates }];
        } else {
          newEstimateItems = existingEstimateItems;
        }
      }

      let newInspectionItems = prev.inspectionItems || [];
      if ("customerApproved" in updates) {
        const isBuy = updates.customerApproved !== false;
        const decisionStr: "Buy" | "No" = isBuy ? "Buy" : "No";

        newInspectionItems = newInspectionItems.map((insItem) => {
          if (!insItem.requiredMaterials) return insItem;
          const updatedMats = insItem.requiredMaterials.map((m: any) => {
            if (typeof m === "object" && (m.cart_id === lineId || m.material_id === lineId || m.name === lineId)) {
              return { ...m, decision: decisionStr };
            }
            return m;
          });
          return { ...insItem, requiredMaterials: updatedMats };
        });

        // Async API call to backend
        const updatedCartIds = new Set<string>();
        (prev.inspectionItems || []).forEach((insItem) => {
          (insItem.requiredMaterials || []).forEach((m: any) => {
            if (typeof m === "object" && (m.cart_id === lineId || m.material_id === lineId || m.name === lineId)) {
              if (insItem.id && m.cart_id && !updatedCartIds.has(m.cart_id)) {
                updatedCartIds.add(m.cart_id);
                apiService.updateCartItemDecision(insItem.id, m.cart_id, decisionStr);
              }
            }
          });
        });
      }

      if (updates.qty !== undefined || updates.unitPrice !== undefined) {
        (prev.inspectionItems || []).forEach((insItem) => {
          (insItem.requiredMaterials || []).forEach((m: any) => {
            if (typeof m === "object" && (m.cart_id === lineId || m.material_id === lineId || m.name === lineId)) {
              if (insItem.id && m.cart_id) {
                apiService.updateCartItem(insItem.id, m.cart_id, {
                  quantity: updates.qty,
                  price: updates.unitPrice
                }).catch((err) => console.warn("Failed to update cart item qty/price", err));
              }
            }
          });
        });
      }

      const updatedJO = {
        ...prev,
        estimateItems: newEstimateItems,
        inspectionItems: newInspectionItems
      };

      setJobOrders((list) => list.map((jo) => (jo.id === updatedJO.id ? updatedJO : jo)));
      return updatedJO;
    });
  };

  const handleBuyAllToggle = (isAllBuy: boolean) => {
    setDrawerJobOrder((prev) => {
      if (!prev) return null;
      const decisionStr: "Buy" | "No" = isAllBuy ? "Buy" : "No";

      const effective = getEffectiveEstimateItems(prev);
      const newEstimateItems = effective.map((i) => ({ ...i, customerApproved: isAllBuy }));

      const newInspectionItems = (prev.inspectionItems || []).map((insItem) => {
        if (!insItem.requiredMaterials) return insItem;
        const updatedMats = insItem.requiredMaterials.map((m: any) => {
          if (typeof m === "object") {
            return { ...m, decision: decisionStr };
          }
          return m;
        });
        return { ...insItem, requiredMaterials: updatedMats };
      });

      const updatedJO = {
        ...prev,
        estimateItems: newEstimateItems,
        inspectionItems: newInspectionItems
      };

      setJobOrders((list) => list.map((jo) => (jo.id === updatedJO.id ? updatedJO : jo)));

      const updatedCartIds = new Set<string>();
      (prev.inspectionItems || []).forEach((insItem) => {
        (insItem.requiredMaterials || []).forEach((m: any) => {
          if (typeof m === "object" && insItem.id && m.cart_id && !updatedCartIds.has(m.cart_id)) {
            updatedCartIds.add(m.cart_id);
            apiService.updateCartItemDecision(insItem.id, m.cart_id, decisionStr);
          }
        });
      });

      return updatedJO;
    });
  };

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
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job Order</span>
          </button>
        </div>

        {/* TOAST */}
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
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
            {filteredJobOrders.map((jo) => (
              <JobOrderCard key={jo.id} jo={jo} onClick={() => setDrawerJobOrder({ ...jo })} />
            ))}
          </div>
        )}
      </div>

      {/* DRAWER WITH ANIMATEPRESENCE AT PARENT LEVEL */}
      <AnimatePresence>
        {drawerJobOrder && (
          <JobOrderDrawer
            key={drawerJobOrder.id}
            drawerJobOrder={drawerJobOrder}
            onClose={() => setDrawerJobOrder(null)}
            isEditingDrawer={isEditingDrawer}
            setIsEditingDrawer={setIsEditingDrawer}
            editOdometer={editOdometer}
            setEditOdometer={setEditOdometer}
            editServiceType={editServiceType}
            setEditServiceType={setEditServiceType}
            editMechanics={editMechanics}
            setEditMechanics={setEditMechanics}
            serviceTypeOptions={serviceTypeOptions}
            mechanicOptions={mechanicOptions}
            handleSaveEditDrawer={handleSaveEditDrawer}
            handleDeleteDrawer={handleDeleteDrawer}
            handleStartEditDrawer={handleStartEditDrawer}
            updateEstimateLine={updateEstimateLine}
            onBuyAllToggle={handleBuyAllToggle}
            updateDrawerJO={updateDrawerJO}
            setLightboxData={setLightboxData}
            onMarkCompleted={async () => {
              if (!drawerJobOrder) return;
              try {
                await apiService.updateJobOrderStatus(drawerJobOrder.id, "Job completed");
                const data = await apiService.getJobOrders();
                setJobOrders(data);
                setDrawerJobOrder(null);
                triggerToast(`${drawerJobOrder.id} → Marked as Completed`);
              } catch (e) {
                console.error("Failed to mark completed", e);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* CREATE JOB ORDER MODAL */}
      <CreateJobOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleSubmitNewJobOrder}
        isSubmitting={isSubmittingNewJO}
        selectedOwnerId={selectedOwnerId}
        onOwnerChange={(ownerId) => {
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
            }
          }
        }}
        ownerOptions={ownerOptions}
        selectedPlateNumber={selectedPlateNumber}
        onPlateChange={(val) => {
          setSelectedPlateNumber(val);
          const match =
            currentOwnerObj?.vehicles?.find((v: any) => (v.plate_number || v.plate) === val) ||
            allVehicles?.find((v: any) => (v.plate_number || v.plate) === val);
          setFormVehiclePhotoUrl(match?.photo_url || match?.photoUrl || "");
        }}
        vehicleOptions={vehicleOptions}
        formVehiclePhotoUrl={formVehiclePhotoUrl}
        setFormVehiclePhotoUrl={setFormVehiclePhotoUrl}
        onPhotoUpload={handlePhotoUpload}
        formOwnerFb={formOwnerFb}
        setFormOwnerFb={setFormOwnerFb}
        formOwnerPhone={formOwnerPhone}
        setFormOwnerPhone={setFormOwnerPhone}
        formOdometerKm={formOdometerKm}
        setFormOdometerKm={setFormOdometerKm}
        formServiceType={formServiceType}
        setFormServiceType={setFormServiceType}
        serviceTypeOptions={serviceTypeOptions}
        activeServiceInfo={activeServiceInfo}
        formMechanics={formMechanics}
        setFormMechanics={setFormMechanics}
        mechanicOptions={mechanicOptions}
        onOpenAddNew={(type) => {
          setAddNewModalType(type);
          setNewInputName("");
        }}
        addNewModalType={addNewModalType}
        onCloseAddNew={() => setAddNewModalType(null)}
        onSaveAddNew={handleSaveAddNew}
        newInputName={newInputName}
        setNewInputName={setNewInputName}
        newOwnerPhone={newOwnerPhone}
        setNewOwnerPhone={setNewOwnerPhone}
        newOwnerFb={newOwnerFb}
        setNewOwnerFb={setNewOwnerFb}
        newPlateNumber={newPlateNumber}
        setNewPlateNumber={setNewPlateNumber}
        newMake={newMake}
        setNewMake={setNewMake}
        newModel={newModel}
        setNewModel={setNewModel}
        newYear={newYear}
        setNewYear={setNewYear}
        newColor={newColor}
        setNewColor={setNewColor}
        newPhotoUrl={newPhotoUrl}
        setNewPhotoUrl={setNewPhotoUrl}
      />

      {/* LIGHTBOX MODAL */}
      <PhotoLightbox
        lightboxData={lightboxData}
        drawerJobOrder={drawerJobOrder}
        onClose={() => setLightboxData(null)}
        onSelectPhoto={(photoIdx) => lightboxData && setLightboxData({ ...lightboxData, photoIdx })}
      />
    </TailAdminLayout>
  );
}
