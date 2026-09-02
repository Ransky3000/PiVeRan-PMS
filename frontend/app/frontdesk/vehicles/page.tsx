"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { useDevRole } from "@/context/DevRoleContext";
import { apiService } from "@/app/apiService";
import { Search, Plus, Car, UserCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VehicleDetailDrawer } from "./VehicleDetailDrawer";
import { JobOrderDrawer } from "@/app/frontdesk/job-orders/JobOrderDrawer";
import { getItemPhotos } from "@/app/frontdesk/job-orders/jobOrderHelpers";
import { compressImage } from "@/lib/imageUtils";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<any | null>(null);
  const [selectedHistoricalJO, setSelectedHistoricalJO] = useState<any | null>(null);
  const [lightboxData, setLightboxData] = useState<{ itemIdx: number; photoIdx: number } | null>(null);

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

  useEffect(() => {
    if (typeof window === "undefined" || vehicles.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const plateParam = params.get("plate");
    if (plateParam) {
      const matched = vehicles.find(
        (v: any) => (v.plate_number || v.plate || "").toLowerCase() === plateParam.toLowerCase()
      );
      if (matched) {
        setSelectedVehicleForDetail(matched);
      }
    }
  }, [vehicles]);

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 600, 600, 0.75);
        setNewPhotoUrl(compressed);
      } catch (err) {
        console.error("Failed to compress photo", err);
      }
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
      {/* HISTORICAL JOB ORDER DETAILS PANE (LEFT MAIN CONTENT AREA) */}
      <AnimatePresence>
        {selectedHistoricalJO && selectedVehicleForDetail && (
          <div className="fixed right-[524px] top-20 bottom-6 z-[60] flex items-start justify-end pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="w-[460px] h-full max-h-[82vh] bg-white border border-slate-200/90 shadow-2xl rounded-3xl overflow-hidden flex flex-col pointer-events-auto"
            >
              <JobOrderDrawer
                drawerJobOrder={selectedHistoricalJO}
                onClose={() => setSelectedHistoricalJO(null)}
                readOnly={true}
                inline={true}
                setLightboxData={setLightboxData}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VEHICLE DETAIL PANEL (EDITABLE DRAWER) */}
      <AnimatePresence>
        {selectedVehicleForDetail && (
          <VehicleDetailDrawer
            vehicle={selectedVehicleForDetail}
            onClose={() => {
              setSelectedVehicleForDetail(null);
              setSelectedHistoricalJO(null);
            }}
            onSaved={(updated) => {
              setVehicles(vehicles.map(v => v.id === updated.id ? updated : v));
              setSelectedVehicleForDetail(updated);
            }}
            onDeleted={(id) => {
              setVehicles(vehicles.filter(v => v.id !== id));
              setSelectedVehicleForDetail(null);
              setSelectedHistoricalJO(null);
            }}
            onSelectJobOrderForDetails={(jo) => setSelectedHistoricalJO(jo)}
            selectedJobOrderId={selectedHistoricalJO?.id}
          />
        )}
      </AnimatePresence>

      {/* FULL-SCREEN IMAGE LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxData && selectedHistoricalJO && (
          <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col w-full"
            >
              {/* Lightbox Header */}
              <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Diagnostic Visual Proof</h4>
                  <span className="text-xs text-slate-400">
                    {selectedHistoricalJO.inspectionItems?.[lightboxData.itemIdx]?.name || "Inspection Item"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxData(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lightbox Image Preview */}
              <div className="flex-1 flex items-center justify-center p-6 bg-black/60 overflow-hidden min-h-[350px]">
                {(() => {
                  const item = selectedHistoricalJO.inspectionItems?.[lightboxData.itemIdx];
                  const photos = item ? getItemPhotos(item) : [];
                  const currentPhoto = photos[lightboxData.photoIdx];
                  return currentPhoto ? (
                    <img
                      src={currentPhoto}
                      alt="Visual Proof"
                      className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-xl"
                    />
                  ) : (
                    <p className="text-slate-400 text-xs">No image preview available.</p>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </TailAdminLayout>
  );
}
