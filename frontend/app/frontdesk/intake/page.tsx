"use client";

import React, { useState, useMemo } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { useDevRole } from "@/context/DevRoleContext";
import {
  Car,
  User,
  Phone,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Send,
  Plus,
  Search,
  Clock,
  Gauge,
  X,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VehicleRecord {
  id: string;
  plateNumber: string;
  makeModel: string;
  year: string;
  ownerName: string;
  phone: string;
  pmsService: string;
  assignedMechanic: string;
  status: "ACTIVE_REPAIR" | "INTAKE_BUFFER" | "READY_PICKUP";
  checkInDate: string;
  deferredServices?: string[];
}

export default function FrontDeskIntakePage() {
  const { mockDataState } = useDevRole();

  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "BUFFER" | "READY">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);

  // New Intake Form State
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [makeModel, setMakeModel] = useState("");
  const [modelYear, setModelYear] = useState("2022");
  const [odometerKm, setOdometerKm] = useState("");
  const [fuelLevel, setFuelLevel] = useState("1/2 Tank");
  const [selectedPmsLevel, setSelectedPmsLevel] = useState("Level 2 Master PMS (40K)");
  const [selectedMechanic, setSelectedMechanic] = useState("Master Mechanic Mark (Bay 1)");
  const [reportedSymptoms, setReportedSymptoms] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [vehicleList, setVehicleList] = useState<VehicleRecord[]>([
    {
      id: "VEH-001",
      plateNumber: "NKM-4321",
      makeModel: "Mitsubishi Montero Sport",
      year: "2022",
      ownerName: "Mr. Tan",
      phone: "0917-555-8888",
      pmsService: "Level 2 Master PMS (40K)",
      assignedMechanic: "Master Mechanic Mark (Bay 1)",
      status: "ACTIVE_REPAIR",
      checkInDate: "Today, 10:15 AM",
      deferredServices: ["Brake Pad Replacement (Front)", "Aircon Filter Decarbonization"]
    },
    {
      id: "VEH-002",
      plateNumber: "ABC-1234",
      makeModel: "Toyota Vios 1.3E",
      year: "2020",
      ownerName: "Juan Dela Cruz",
      phone: "0917-888-9999",
      pmsService: "Level 1 Basic PMS (10K)",
      assignedMechanic: "Ramon Garcia (Bay 2)",
      status: "ACTIVE_REPAIR",
      checkInDate: "Today, 09:30 AM"
    },
    {
      id: "VEH-003",
      plateNumber: "TUV-5544",
      makeModel: "Ford Ranger Wildtrak",
      year: "2021",
      ownerName: "Roberto Santos",
      phone: "0918-333-1111",
      pmsService: "Level 3 Heavy PMS (80K)",
      assignedMechanic: "Unassigned (Intake Queue)",
      status: "INTAKE_BUFFER",
      checkInDate: "Today, 11:00 AM"
    },
    {
      id: "VEH-004",
      plateNumber: "RST-1122",
      makeModel: "Nissan Navara Pro-4X",
      year: "2023",
      ownerName: "Cedrick Santos",
      phone: "0917-123-4567",
      pmsService: "Level 1 Basic PMS (10K)",
      assignedMechanic: "Master Mechanic Mark (Bay 1)",
      status: "READY_PICKUP",
      checkInDate: "Yesterday, 02:00 PM"
    }
  ]);

  const displayedVehicles = useMemo(() => {
    if (mockDataState === "empty") return [];

    return vehicleList.filter((item) => {
      const matchesSearch =
        item.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.makeModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab =
        activeTab === "ALL" ||
        (activeTab === "ACTIVE" && item.status === "ACTIVE_REPAIR") ||
        (activeTab === "BUFFER" && item.status === "INTAKE_BUFFER") ||
        (activeTab === "READY" && item.status === "READY_PICKUP");

      return matchesSearch && matchesTab;
    });
  }, [mockDataState, vehicleList, searchTerm, activeTab]);

  const activeInShopCount = vehicleList.filter((i) => i.status === "ACTIVE_REPAIR").length;
  const bufferCount = vehicleList.filter((i) => i.status === "INTAKE_BUFFER").length;
  const readyCount = vehicleList.filter((i) => i.status === "READY_PICKUP").length;

  const handleAutoFillReturning = (name: string, pNo: string, mModel: string, ph: string) => {
    setCustomerName(name);
    setPlateNumber(pNo);
    setMakeModel(mModel);
    setPhone(ph);
    triggerToast(`Auto-filled returning vehicle details for ${name}`);
  };

  const handleCreateCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: VehicleRecord = {
      id: `VEH-${Math.floor(100 + Math.random() * 900)}`,
      plateNumber: plateNumber.toUpperCase() || "NEW-8888",
      makeModel: makeModel || "Toyota Hilux",
      year: modelYear || "2023",
      ownerName: customerName || "Customer",
      phone: phone || "0917-000-0000",
      pmsService: selectedPmsLevel,
      assignedMechanic: selectedMechanic,
      status: "ACTIVE_REPAIR",
      checkInDate: "Just now"
    };

    setVehicleList([newRecord, ...vehicleList]);
    setIsIntakeModalOpen(false);
    triggerToast(`Checked in ${newRecord.makeModel} (${newRecord.plateNumber}) and dispatched to mechanic!`);
    setCustomerName("");
    setPlateNumber("");
    setMakeModel("");
    setPhone("");
    setOdometerKm("");
    setReportedSymptoms("");
  };

  return (
    <TailAdminLayout userRole="FrontDesk" userName="Sir Cedrick" userEmail="frontdesk@piveran.com">
      <div className="space-y-3 font-sans">
        
        {/* 1. TOP TITLE HEADER SECTION */}
        <div className="overflow-hidden border-b border-slate-200/80 pb-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Vehicles
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Directory of registered customer vehicles, active shop intake status, and check-in management
              </p>
            </div>

            <div>
              <button
                onClick={() => setIsIntakeModalOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Check-in New Vehicle</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toast Notification Alert */}
        {toastMessage && (
          <div className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 2. STICKY TAB BAR + FILTERS ROW */}
        <div className="bg-slate-50/95 backdrop-blur-md pt-2 pb-0 border-b border-slate-200/90 shadow-2xs -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            
            {/* Tab Selection */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>All Vehicles</span>
              </button>

              <button
                onClick={() => setActiveTab("ACTIVE")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "ACTIVE"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Active in Shop</span>
              </button>

              <button
                onClick={() => setActiveTab("BUFFER")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "BUFFER"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white text-amber-800 hover:bg-amber-50 border border-amber-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Intake Buffer</span>
              </button>

              <button
                onClick={() => setActiveTab("READY")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "READY"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-blue-800 hover:bg-blue-50 border border-blue-200"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready for Pickup</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search plate, vehicle or owner..."
                className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 transition-all w-56 sm:w-64 shadow-2xs"
              />
            </div>

          </div>

          {/* TABLE COLUMN HEADERS */}
          <div className="bg-slate-100/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 grid grid-cols-12 py-3 px-5 items-center mt-2 rounded-t-xl">
            <div className="col-span-4 sm:col-span-3">Vehicle & Plate</div>
            <div className="col-span-3 sm:col-span-3">Car Owner</div>
            <div className="col-span-3 sm:col-span-3">Assigned PMS Service</div>
            <div className="col-span-2 sm:col-span-3 text-right">Mechanic / Status</div>
          </div>
        </div>

        {/* 3. CLEAN TABLE LIST */}
        <section className="bg-white rounded-b-2xl border border-slate-200 border-t-0 shadow-2xs">
          {displayedVehicles.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <Car className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  {mockDataState === "empty" ? "No vehicles in shop database" : "No matching vehicles found"}
                </h4>
                <p className="text-xs text-slate-400">
                  {mockDataState === "empty"
                    ? "Start by checking in your first customer vehicle."
                    : `No vehicles matched search term "${searchTerm}".`}
                </p>
              </div>
              {mockDataState === "empty" && (
                <button
                  onClick={() => setIsIntakeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Check-in First Vehicle</span>
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {displayedVehicles.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 py-3.5 px-5 items-center hover:bg-emerald-50/60 transition-colors"
                >
                  
                  {/* Vehicle & Plate */}
                  <div className="col-span-4 sm:col-span-3 pr-2 font-medium text-slate-900">
                    <div>{item.makeModel}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{item.plateNumber}</div>
                  </div>

                  {/* Car Owner */}
                  <div className="col-span-3 sm:col-span-3 pr-2 text-slate-600 font-medium">
                    <div>{item.ownerName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{item.phone}</div>
                  </div>

                  {/* Assigned PMS Service */}
                  <div className="col-span-3 sm:col-span-3 pr-2 text-slate-600 font-medium">
                    <div>{item.pmsService}</div>
                    {item.deferredServices && item.deferredServices.length > 0 && (
                      <div className="text-[10px] text-amber-700 font-medium">
                        ⚠️ {item.deferredServices.length} Skipped Repairs
                      </div>
                    )}
                  </div>

                  {/* Mechanic & Status */}
                  <div className="col-span-2 sm:col-span-3 text-right flex items-center justify-end gap-3 text-xs">
                    <div className="text-right">
                      <div className="font-medium text-slate-800">{item.assignedMechanic}</div>
                      <div className="text-[11px] text-slate-400">{item.checkInDate}</div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* 4. REFINED NEW VEHICLE INTAKE MODAL DRAWER */}
      <AnimatePresence>
        {isIntakeModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 border border-slate-100 text-slate-900 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <Car className="w-5 h-5 text-emerald-700" />
                  <span>Check-in New Vehicle</span>
                </div>
                <button
                  onClick={() => setIsIntakeModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateCheckIn} className="space-y-4 overflow-y-auto pr-1">
                
                {/* Returning Customer Quick Select */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Returning Customer Auto-Fill:</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAutoFillReturning("Mr. Tan", "NKM-4321", "Mitsubishi Montero Sport", "0917-555-8888")}
                      className="bg-white hover:bg-emerald-50 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors"
                    >
                      Mr. Tan (Montero NKM-4321)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoFillReturning("Juan Dela Cruz", "ABC-1234", "Toyota Vios 1.3E", "0917-888-9999")}
                      className="bg-white hover:bg-emerald-50 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors"
                    >
                      Juan Dela Cruz (Vios ABC-1234)
                    </button>
                  </div>
                </div>

                {/* Field Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Customer Full Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Mr. Tan"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mobile Contact Phone</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0917-555-8888"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Plate Number</label>
                    <input
                      type="text"
                      required
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                      placeholder="NKM-4321"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-900 font-bold uppercase outline-none focus:border-emerald-600 focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vehicle Make & Model</label>
                    <input
                      type="text"
                      required
                      value={makeModel}
                      onChange={(e) => setMakeModel(e.target.value)}
                      placeholder="Mitsubishi Montero Sport"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Odometer Reading (KM)</label>
                    <input
                      type="text"
                      value={odometerKm}
                      onChange={(e) => setOdometerKm(e.target.value)}
                      placeholder="42,550 KM"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">PMS Package Level</label>
                    <select
                      value={selectedPmsLevel}
                      onChange={(e) => setSelectedPmsLevel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-900 font-semibold outline-none focus:border-emerald-600"
                    >
                      <option value="Level 1 Basic PMS (10K)">Level 1 Basic PMS (10K KM) - ₱3,500</option>
                      <option value="Level 2 Master PMS (40K)">Level 2 Master PMS (40K KM) - ₱8,500</option>
                      <option value="Level 3 Heavy PMS (80K)">Level 3 Heavy PMS (80K KM) - ₱14,200</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Assign Mechanic & Bay</label>
                  <select
                    value={selectedMechanic}
                    onChange={(e) => setSelectedMechanic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 font-semibold outline-none focus:border-emerald-600"
                  >
                    <option value="Master Mechanic Mark (Bay 1)">Master Mechanic Mark (Bay 1 - Available)</option>
                    <option value="Ramon Garcia (Bay 2)">Ramon Garcia (Bay 2 - Active Repair)</option>
                    <option value="Unassigned (Intake Buffer)">Unassigned (Hold in Buffer Queue)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Customer Reported Symptoms</label>
                  <textarea
                    value={reportedSymptoms}
                    onChange={(e) => setReportedSymptoms(e.target.value)}
                    placeholder="e.g. Squeaking noise when braking at low speed..."
                    className="w-full h-16 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsIntakeModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Check-in & Dispatch</span>
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
