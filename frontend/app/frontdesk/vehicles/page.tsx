"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { useDevRole } from "@/context/DevRoleContext";
import { apiService } from "@/app/apiService";
import { Search, Plus, Car, X, UserCircle2, Save, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function VehicleDetailDrawer({ vehicle, onClose, onSaved, onDeleted }: { vehicle: any; onClose: () => void; onSaved: (v: any) => void; onDeleted: (id: string) => void }) {
  const [editMake, setEditMake] = useState(vehicle.make);
  const [editModel, setEditModel] = useState(vehicle.model);
  const [editYear, setEditYear] = useState(String(vehicle.year));
  const [editColor, setEditColor] = useState(vehicle.color);
  const [editPlate, setEditPlate] = useState(vehicle.plate_number);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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
      const updated = await apiService.updateVehicle(vehicle.id, {
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
      await apiService.deleteVehicle(vehicle.id);
      onDeleted(vehicle.id);
      onClose();
    } catch (err) {
      console.error("Failed to delete vehicle", err);
    } finally {
      setDeleting(false);
    }
  };

  const inputCls = "w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition-all";

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
        className="relative w-full max-w-md bg-white border-l border-slate-200 shadow-2xl h-full flex flex-col z-50 text-slate-900"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Vehicle Profile</h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Specs & Owners</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete Vehicle"
              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Vehicle Image Banner */}
          <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative shadow-inner group">
            {vehicle.photo_url || vehicle.photoUrl ? (
              <>
                <img src={vehicle.photo_url || vehicle.photoUrl} alt={vehicle.model} className="w-full h-full object-cover" />
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
                            const updated = await apiService.updateVehicle(vehicle.id || vehicle.vehicle_id, { photo_url: dataUrl });
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
                          const updated = await apiService.updateVehicle(vehicle.id || vehicle.vehicle_id, { photo_url: dataUrl });
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
                <input type="number" value={editYear} onChange={(e) => setEditYear(e.target.value)} className={inputCls} />
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
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            )}
          </div>

          {/* Owners List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Associated Owners</h4>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {(vehicle.owners || []).length} Associated
              </span>
            </div>
            <div className="space-y-3">
              {(vehicle.owners || []).length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl">
                  <UserCircle2 className="w-6 h-6 text-slate-300 mx-auto mb-1.5 opacity-60" />
                  <p className="text-xs text-slate-400 font-medium">No registered owners linked to this vehicle</p>
                </div>
              ) : (
                (vehicle.owners || []).map((owner: any) => (
                  <div key={owner.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 shadow-sm hover:border-slate-300 transition-all">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                      <UserCircle2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 truncate">{owner.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{owner.phone}</p>
                      </div>
                      {owner.fb_handle && (
                        <p className="text-[10px] font-bold text-emerald-700 hover:underline mt-1 truncate">
                          <a href={owner.fb_handle.startsWith("http") ? owner.fb_handle : `https://facebook.com/${owner.fb_handle.replace("@", "")}`} target="_blank" rel="noopener noreferrer">
                            {owner.fb_handle}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<any | null>(null);

  const [newMake, setNewMake] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newPlateNumber, setNewPlateNumber] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  const lastScrollY = useRef(0);
  const devContext = useDevRole();

  useEffect(() => {
    const loadData = async () => {
      try {
        const vData = await apiService.getVehicles();
        setVehicles(vData);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMake.trim() || !newModel.trim() || !newPlateNumber.trim()) return;

    try {
      const added = await apiService.createVehicle({
        make: newMake,
        model: newModel,
        year: parseInt(newYear) || 2020,
        color: newColor || "Black",
        plate_number: newPlateNumber,
        photo_url: newPhotoUrl
      });
      setVehicles([...vehicles, added]);
      setIsAddModalOpen(false);
      setNewMake("");
      setNewModel("");
      setNewYear("");
      setNewColor("");
      setNewPlateNumber("");
      setNewPhotoUrl("");
    } catch (err) {
      console.error("Failed to create vehicle", err);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (!mainElement) return;

    const handleScroll = () => {
      const currentScrollY = mainElement.scrollTop;
      if (currentScrollY > 50) {
        if (currentScrollY > lastScrollY.current + 5) {
          setIsHeaderVisible(false);
        } else if (currentScrollY < lastScrollY.current - 5) {
          setIsHeaderVisible(true);
        }
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    mainElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, []);

  const displayedVehicles = useMemo(() => {
    return vehicles.filter((v) =>
      v.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.make?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vehicles, searchTerm]);

  return (
    <TailAdminLayout userRole={devContext.activeRole} userName={devContext.currentProfile.name} userEmail={devContext.currentProfile.email}>
      <div className="space-y-3">
        {/* TOP TITLE HEADER */}
        <motion.div
          animate={{ height: isHeaderVisible ? "auto" : 0, opacity: isHeaderVisible ? 1 : 0, marginBottom: isHeaderVisible ? 12 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden border-b border-slate-200/80 pb-2.5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Vehicles Directory</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Manage registered client vehicles for PiVeRan PMS</p>
            </div>
            <div>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vehicle</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* STICKY AREA: SEARCH BAR */}
        <div className="sticky top-0 z-30 bg-slate-50 pt-2 pb-0 border-b border-slate-200/90 shadow-2xs -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-slate-900 text-white shadow-xs">
                <Car className="w-3.5 h-3.5" />
                <span>Vehicles ({vehicles.length})</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search vehicles..."
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 transition-all w-44 sm:w-60 shadow-2xs"
                />
              </div>
              <AnimatePresence>
                {!isHeaderVisible && (
                  <motion.button
                    onClick={() => setIsAddModalOpen(true)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Vehicle</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* TABLE HEADERS */}
          <div className="bg-slate-100/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 grid grid-cols-12 py-3 px-5 items-center mt-2 rounded-t-xl">
            <div className="col-span-2">Photo</div>
            <div className="col-span-2">Make</div>
            <div className="col-span-3">Model</div>
            <div className="col-span-1">Year</div>
            <div className="col-span-1">Color</div>
            <div className="col-span-3">Plate Number</div>
          </div>
        </div>

        {/* DATA ROWS */}
        <section className="bg-white rounded-b-2xl border border-slate-200 border-t-0 shadow-2xs">
          {displayedVehicles.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <Car className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">No matching vehicles found</h4>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {displayedVehicles.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedVehicleForDetail(item)}
                  className="grid grid-cols-12 py-3.5 px-5 items-center hover:bg-emerald-50/60 cursor-pointer transition-colors group"
                >
                  <div className="col-span-2 pr-2">
                    {item.photo_url || item.photoUrl ? (
                      <img src={item.photo_url || item.photoUrl} alt={item.model} className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <Car className="w-5 h-5 opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 pr-2 text-slate-900 font-bold">{item.make}</div>
                  <div className="col-span-3 pr-2 text-slate-700 font-medium">{item.model}</div>
                  <div className="col-span-1 pr-2 text-slate-500 font-medium">{item.year}</div>
                  <div className="col-span-1 pr-2 text-slate-500 font-medium truncate">{item.color}</div>
                  <div className="col-span-3 pr-2 font-bold text-slate-900 uppercase">{item.plate_number}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ADD VEHICLE GLASSMORPHIC MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-950/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md relative z-10 space-y-4 text-slate-900"
            >
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Add Customer Vehicle</h3>
                <p className="text-xs text-slate-500">Register a new client vehicle in the database</p>
              </div>
              <form onSubmit={handleAddVehicle} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Brand / Make</label>
                    <input
                      type="text"
                      required
                      value={newMake}
                      onChange={(e) => setNewMake(e.target.value)}
                      placeholder="e.g. Toyota"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Model</label>
                    <input
                      type="text"
                      required
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      placeholder="e.g. Vios"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900 font-medium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Year Model</label>
                    <input
                      type="number"
                      required
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      placeholder="e.g. 2018"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Color</label>
                    <input
                      type="text"
                      required
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="e.g. Silver"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900 font-medium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plate Number</label>
                    <input
                      type="text"
                      required
                      value={newPlateNumber}
                      onChange={(e) => setNewPlateNumber(e.target.value)}
                      placeholder="e.g. ABC 1234"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900 font-medium uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2 text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900 font-medium file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md transition-all"
                  >
                    Save Vehicle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* VEHICLE DETAIL PANEL (EDITABLE DRAWER) */}
      <AnimatePresence>
        {selectedVehicleForDetail && (
          <VehicleDetailDrawer
            vehicle={selectedVehicleForDetail}
            onClose={() => setSelectedVehicleForDetail(null)}
            onSaved={(updated) => {
              setVehicles(vehicles.map(v => v.id === updated.id ? updated : v));
              setSelectedVehicleForDetail(updated);
            }}
            onDeleted={(id) => {
              setVehicles(vehicles.filter(v => v.id !== id));
              setSelectedVehicleForDetail(null);
            }}
          />
        )}
      </AnimatePresence>
    </TailAdminLayout>
  );
}
