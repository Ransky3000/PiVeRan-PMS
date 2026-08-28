"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Car, X, Save, Trash2, Wrench, Clock } from "lucide-react";
import { apiService } from "@/app/apiService";
import { VehicleHistoryTimeline } from "./VehicleHistoryTimeline";

interface VehicleDetailDrawerProps {
  vehicle: any;
  onClose: () => void;
  onSaved: (v: any) => void;
  onDeleted: (id: string) => void;
  onSelectJobOrderForDetails?: (jo: any) => void;
  selectedJobOrderId?: string | null;
}

export function VehicleDetailDrawer({
  vehicle,
  onClose,
  onSaved,
  onDeleted,
  onSelectJobOrderForDetails,
  selectedJobOrderId
}: VehicleDetailDrawerProps) {
  const [activeDrawerTab, setActiveDrawerTab] = useState<"SPECS" | "HISTORY">("SPECS");
  const [editMake, setEditMake] = useState(vehicle.make);
  const [editModel, setEditModel] = useState(vehicle.model);
  const [editYear, setEditYear] = useState(String(vehicle.year));
  const [editColor, setEditColor] = useState(vehicle.color);
  const [editPlate, setEditPlate] = useState(vehicle.plate_number);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [vehicleJobOrders, setVehicleJobOrders] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeDrawerTab === "HISTORY" && vehicle) {
      setLoadingHistory(true);
      apiService
        .getJobOrders()
        .then((allJobs) => {
          const vId = vehicle.id || vehicle.vehicle_id;
          const vPlate = (vehicle.plate_number || vehicle.plate || "").toLowerCase();
          const filtered = (allJobs || []).filter((j: any) => {
            const joVid = j.vehicleId || j.vehicle_id;
            const joPlate = (j.plateNumber || j.plate_number || j.vehicle?.plate_number || "").toLowerCase();
            return (joVid && joVid === vId) || (vPlate && joPlate === vPlate);
          });
          setVehicleJobOrders(filtered);
        })
        .catch(console.error)
        .finally(() => setLoadingHistory(false));
    }
  }, [activeDrawerTab, vehicle]);

  const isDirty =
    editMake !== vehicle.make ||
    editModel !== vehicle.model ||
    editYear !== String(vehicle.year) ||
    editColor !== vehicle.color ||
    editPlate !== vehicle.plate_number;

  const handleSave = async () => {
    if (!editMake.trim() || !editModel.trim() || !editPlate.trim()) return;
    setSaving(true);
    try {
      const updated = await apiService.updateVehicle(vehicle.id || vehicle.vehicle_id, {
        make: editMake,
        model: editModel,
        year: parseInt(editYear) || vehicle.year,
        color: editColor,
        plate_number: editPlate
      });
      if (updated) {
        onSaved(updated);
        setToast("Vehicle updated");
        setTimeout(() => setToast(null), 2500);
      }
    } catch (err) {
      console.error("Failed to update vehicle", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${vehicle.make} ${vehicle.model} (${vehicle.plate_number})?`)) return;
    setDeleting(true);
    try {
      await apiService.deleteVehicle(vehicle.id || vehicle.vehicle_id);
      onDeleted(vehicle.id || vehicle.vehicle_id);
      onClose();
    } catch (err) {
      console.error("Failed to delete vehicle", err);
    } finally {
      setDeleting(false);
    }
  };

  const inputCls =
    "w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition-all";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/30"
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl h-full flex flex-col z-50 text-slate-900"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Plate: {vehicle.plate_number || vehicle.plate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete Vehicle"
              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-6 pt-3 bg-slate-50/50 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveDrawerTab("SPECS")}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeDrawerTab === "SPECS"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Specs & Owner</span>
          </button>

          <button
            onClick={() => setActiveDrawerTab("HISTORY")}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeDrawerTab === "HISTORY"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Service History</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeDrawerTab === "SPECS" ? (
            <>
              {/* Vehicle Image Banner */}
              <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative shadow-inner group">
                {vehicle.photo_url || vehicle.photoUrl ? (
                  <>
                    <img
                      src={vehicle.photo_url || vehicle.photoUrl}
                      alt={vehicle.model}
                      className="w-full h-full object-cover"
                    />
                    <label className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl backdrop-blur-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-md">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              const dataUrl = reader.result as string;
                              try {
                                const updated = await apiService.updateVehicle(
                                  vehicle.id || vehicle.vehicle_id,
                                  { photo_url: dataUrl }
                                );
                                if (updated) onSaved(updated);
                              } catch (err) {
                                console.error("Failed to update vehicle image", err);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <span>Change Photo</span>
                    </label>
                  </>
                ) : (
                  <label className="text-center text-slate-400 hover:text-emerald-700 cursor-pointer p-4 w-full h-full flex flex-col items-center justify-center group-hover:bg-emerald-50/50 transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const dataUrl = reader.result as string;
                            try {
                              const updated = await apiService.updateVehicle(
                                vehicle.id || vehicle.vehicle_id,
                                { photo_url: dataUrl }
                              );
                              if (updated) onSaved(updated);
                            } catch (err) {
                              console.error("Failed to update vehicle image", err);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <Car className="w-12 h-12 mx-auto mb-1.5 opacity-40 group-hover:opacity-80 group-hover:scale-110 transition-all" />
                    <p className="text-xs font-bold">Upload Vehicle Photo</p>
                    <p className="text-[10px] text-slate-400">Click to open camera or browse photo</p>
                  </label>
                )}
              </div>

              {/* Editable Specs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Specifications</h4>
                  {isDirty && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                      Unsaved Changes
                    </span>
                  )}
                </div>
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Make / Brand</span>
                    <input value={editMake} onChange={(e) => setEditMake(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Model</span>
                    <input value={editModel} onChange={(e) => setEditModel(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Year Model</span>
                    <input type="text" value={editYear} onChange={(e) => setEditYear(e.target.value.replace(/[^\d]/g, ""))} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Color</span>
                    <input value={editColor} onChange={(e) => setEditColor(e.target.value)} className={inputCls} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Plate Number</span>
                    <input value={editPlate} onChange={(e) => setEditPlate(e.target.value)} className={`${inputCls} uppercase font-extrabold`} />
                  </div>
                </div>

                {isDirty && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Saving..." : "Save Changes"}</span>
                  </button>
                )}
              </div>

              {/* Associated Owners */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Associated Owners</h4>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {(vehicle.owners || []).length} Associated
                  </span>
                </div>
                {(vehicle.owners || []).length === 0 ? (
                  <div className="bg-slate-50 rounded-xl p-4 text-center text-xs text-slate-400">
                    No owner records linked.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vehicle.owners.map((owner: any) => (
                      <div key={owner.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900 block">{owner.name}</span>
                          <span className="text-[10px] text-slate-500">{owner.phone || owner.contact_number || "No Phone"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <VehicleHistoryTimeline
              vehicle={vehicle}
              jobOrders={vehicleJobOrders}
              isLoading={loadingHistory}
              onSelectJobOrderForDetails={onSelectJobOrderForDetails}
              selectedJobOrderId={selectedJobOrderId}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
