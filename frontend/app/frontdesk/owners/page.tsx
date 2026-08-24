"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { useDevRole } from "@/context/DevRoleContext";
import { apiService } from "@/app/apiService";
import { Search, Plus, UserCircle2, X, Car } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomSelect } from "@/components/CustomSelect";
import { useRouter } from "next/navigation";

export default function OwnersPage() {
  const router = useRouter();
  const [owners, setOwners] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newFb, setNewFb] = useState("");
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedOwnerForDetail, setSelectedOwnerForDetail] = useState<any | null>(null);
  
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [newMake, setNewMake] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newPlateNumber, setNewPlateNumber] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  
  const lastScrollY = useRef(0);
  const devContext = useDevRole();

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    try {
      const added = await apiService.createOwner({
        name: newName,
        phone: newPhone,
        fb_handle: newFb,
        vehicle_ids: selectedVehicles
      });
      setOwners([...owners, added]);
      setIsAddModalOpen(false);
      setNewName("");
      setNewPhone("");
      setNewFb("");
      setSelectedVehicles([]);
    } catch (err) {
      console.error("Failed to create owner", err);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMake.trim() || !newModel.trim() || !newPlateNumber.trim()) return;

    try {
      const ownerId = selectedOwnerForDetail?.id || null;
      const added = await apiService.createVehicle({
        make: newMake,
        model: newModel,
        year: parseInt(newYear) || 2020,
        color: newColor || "Black",
        plate_number: newPlateNumber,
        photo_url: newPhotoUrl,
        owner_id: ownerId
      });
      setAllVehicles([...allVehicles, added]);
      setSelectedVehicles([...selectedVehicles, added.id]);
      const freshOwners = await apiService.getOwners();
      setOwners(freshOwners);
      if (selectedOwnerForDetail) {
        const updatedDetail = freshOwners.find((o: any) => o.id === selectedOwnerForDetail.id);
        if (updatedDetail) setSelectedOwnerForDetail(updatedDetail);
      }
      setIsAddVehicleModalOpen(false);
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
    const fetchOwners = async () => {
      try {
        const data = await apiService.getOwners();
        setOwners(data);
        const vData = await apiService.getVehicles();
        setAllVehicles(vData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOwners();
  }, []);

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

  const displayedOwners = useMemo(() => {
    return owners.filter((o) =>
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [owners, searchTerm]);

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
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Owner Directory</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Manage registered vehicle owners for PiVeRan PMS</p>
            </div>
            <div>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Owner</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* STICKY AREA: SEARCH BAR */}
        <div className="sticky top-0 z-30 bg-slate-50 pt-2 pb-0 border-b border-slate-200/90 shadow-2xs -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-slate-900 text-white shadow-xs">
                <UserCircle2 className="w-3.5 h-3.5" />
                <span>Owners ({owners.length})</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search owners..."
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
                    <span className="hidden sm:inline">Add Owner</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* TABLE HEADERS */}
          <div className="bg-slate-100/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 grid grid-cols-12 py-3 px-5 items-center mt-2 rounded-t-xl">
            <div className="col-span-4">Owner Name</div>
            <div className="col-span-3">Phone Number</div>
            <div className="col-span-3">Facebook Handle</div>
            <div className="col-span-2 text-right">Registered Vehicles</div>
          </div>
        </div>

        {/* DATA ROWS */}
        <section className="bg-white rounded-b-2xl border border-slate-200 border-t-0 shadow-2xs">
          {displayedOwners.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <UserCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">No matching owners found</h4>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {displayedOwners.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedOwnerForDetail(item)}
                  className="grid grid-cols-12 py-3.5 px-5 items-center hover:bg-emerald-50/60 cursor-pointer transition-colors group"
                >
                  <div className="col-span-4 pr-2 font-medium text-slate-900">{item.name}</div>
                  <div className="col-span-3 text-slate-700 font-medium">{item.phone}</div>
                  <div className="col-span-3 pr-2 text-slate-500 font-normal">{item.fb_handle || "—"}</div>
                  <div className="col-span-2 text-right pr-2">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-bold">
                      {(item.vehicles || []).length}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ADD OWNER GLASSMORPHIC MODAL */}
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
                <h3 className="text-base font-extrabold text-slate-900">Add Registered Owner</h3>
                <p className="text-xs text-slate-500">Create a new customer profile in the database</p>
              </div>
              <form onSubmit={handleAddOwner} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. 0917-123-4567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Facebook Handle (Optional)</label>
                  <input
                    type="text"
                    value={newFb}
                    onChange={(e) => setNewFb(e.target.value)}
                    placeholder="e.g. @juandelacruz"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Vehicle</label>
                  <CustomSelect
                    value={selectedVehicles}
                    onChange={setSelectedVehicles}
                    options={allVehicles.map((v) => ({
                      value: v.id,
                      label: `${v.make} ${v.model} (${v.plate_number})`
                    }))}
                    placeholder="Select option"
                    isMultiSelect={true}
                    searchable={true}
                    onAddNew={() => setIsAddVehicleModalOpen(true)}
                    addNewLabel="New Vehicle"
                  />
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
                    Save Profile
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD VEHICLE MODAL ON TOP (z-60) */}
      <AnimatePresence>
        {isAddVehicleModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddVehicleModalOpen(false)}
              className="absolute inset-0 bg-slate-950/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md relative z-10 space-y-4 text-slate-900"
            >
              <button
                onClick={() => setIsAddVehicleModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Add Vehicle</h3>
                <p className="text-xs text-slate-500">Register a new vehicle directly</p>
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
                      placeholder="e.g. Red"
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
                    onClick={() => setIsAddVehicleModalOpen(false)}
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
      {/* OWNER DETAIL PANEL (SLIDE-OVER DRAWER) */}
      <AnimatePresence>
        {selectedOwnerForDetail && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOwnerForDetail(null)}
              className="absolute inset-0 bg-slate-950/30"
            />
            {/* Drawer Panel */}
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
                    <UserCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Owner Profile</h3>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Details & Vehicles</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOwnerForDetail(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Profile Information Card */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Information</h4>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3.5">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Full Name</span>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedOwnerForDetail.name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact Number</span>
                      <p className="text-sm font-semibold text-slate-700 mt-0.5">{selectedOwnerForDetail.phone}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Facebook Account</span>
                      {selectedOwnerForDetail.fb_handle ? (
                        <p className="text-sm font-semibold text-emerald-700 hover:underline mt-0.5">
                          <a href={selectedOwnerForDetail.fb_handle.startsWith("http") ? selectedOwnerForDetail.fb_handle : `https://facebook.com/${selectedOwnerForDetail.fb_handle.replace("@", "")}`} target="_blank" rel="noopener noreferrer">
                            {selectedOwnerForDetail.fb_handle}
                          </a>
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic mt-0.5">Not provided</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vehicles List Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registered Vehicles</h4>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {(selectedOwnerForDetail.vehicles || []).length} Vehicles
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(selectedOwnerForDetail.vehicles || []).length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl">
                        <Car className="w-6 h-6 text-slate-300 mx-auto mb-1.5 opacity-60" />
                        <p className="text-xs text-slate-400 font-medium">No vehicles registered to this owner</p>
                      </div>
                    ) : (
                      (selectedOwnerForDetail.vehicles || []).map((vehicle: any) => (
                        <div key={vehicle.vehicle_id || vehicle.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 shadow-sm hover:border-slate-300 transition-all">
                          <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
                            {vehicle.photo_url ? (
                              <img src={vehicle.photo_url} alt={vehicle.model} className="w-full h-full object-cover" />
                            ) : (
                              <Car className="w-6 h-6 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <p className="text-xs font-extrabold text-slate-900 truncate">{vehicle.make} {vehicle.model}</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{vehicle.color} • {vehicle.year}</p>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="inline-block bg-slate-100 text-slate-800 text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md border border-slate-200 uppercase">
                                {vehicle.plate_number}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </TailAdminLayout>
  );
}
