import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Send } from "lucide-react";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";

interface CreateJobOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  selectedOwnerId: string;
  onOwnerChange: (val: string) => void;
  ownerOptions: SelectOption[];
  selectedPlateNumber: string;
  onPlateChange: (val: string) => void;
  vehicleOptions: SelectOption[];
  formVehiclePhotoUrl: string;
  setFormVehiclePhotoUrl: (url: string) => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formOwnerFb: string;
  setFormOwnerFb: (val: string) => void;
  formOwnerPhone: string;
  setFormOwnerPhone: (val: string) => void;
  formOdometerKm: string;
  setFormOdometerKm: (val: string) => void;
  formServiceType: string;
  setFormServiceType: (val: string) => void;
  serviceTypeOptions: SelectOption[];
  activeServiceInfo: { interval: string; items: string[] } | null;
  formMechanics: string[];
  setFormMechanics: (val: string[]) => void;
  mechanicOptions: SelectOption[];
  onOpenAddNew: (type: "OWNER" | "VEHICLE" | "MECHANIC") => void;
  addNewModalType: "OWNER" | "VEHICLE" | "MECHANIC" | null;
  onCloseAddNew: () => void;
  onSaveAddNew: (e: React.FormEvent) => void;
  newInputName: string;
  setNewInputName: (val: string) => void;
  newOwnerPhone: string;
  setNewOwnerPhone: (val: string) => void;
  newOwnerFb: string;
  setNewOwnerFb: (val: string) => void;
  newPlateNumber: string;
  setNewPlateNumber: (val: string) => void;
  newMake: string;
  setNewMake: (val: string) => void;
  newModel: string;
  setNewModel: (val: string) => void;
  newYear: string;
  setNewYear: (val: string) => void;
  newColor: string;
  setNewColor: (val: string) => void;
  newPhotoUrl: string;
  setNewPhotoUrl: (val: string) => void;
}

export const CreateJobOrderModal: React.FC<CreateJobOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  selectedOwnerId,
  onOwnerChange,
  ownerOptions,
  selectedPlateNumber,
  onPlateChange,
  vehicleOptions,
  formVehiclePhotoUrl,
  setFormVehiclePhotoUrl,
  onPhotoUpload,
  formOwnerFb,
  setFormOwnerFb,
  formOwnerPhone,
  setFormOwnerPhone,
  formOdometerKm,
  setFormOdometerKm,
  formServiceType,
  setFormServiceType,
  serviceTypeOptions,
  activeServiceInfo,
  formMechanics,
  setFormMechanics,
  mechanicOptions,
  onOpenAddNew,
  addNewModalType,
  onCloseAddNew,
  onSaveAddNew,
  newInputName,
  setNewInputName,
  newOwnerPhone,
  setNewOwnerPhone,
  newOwnerFb,
  setNewOwnerFb,
  newPlateNumber,
  setNewPlateNumber,
  newMake,
  setNewMake,
  newModel,
  setNewModel,
  newYear,
  setNewYear,
  newColor,
  setNewColor,
  newPhotoUrl,
  setNewPhotoUrl
}) => {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-900 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <h2 className="text-base font-bold text-slate-900">Create Job Order</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={onSubmit} className="flex-1 overflow-y-auto pr-1.5 py-2 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Select Owner</label>
                  <CustomSelect value={selectedOwnerId} onChange={onOwnerChange} options={ownerOptions} onAddNew={() => onOpenAddNew("OWNER")} addNewLabel="New Owner" className="w-full" />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Select Vehicle</label>
                  <CustomSelect value={selectedPlateNumber} onChange={onPlateChange} options={vehicleOptions} onAddNew={() => onOpenAddNew("VEHICLE")} addNewLabel="New Vehicle" className="w-full" />
                </div>

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
                      <input type="file" accept="image/*" capture="environment" onChange={onPhotoUpload} className="hidden" />
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
                  <button type="button" onClick={onClose} className="px-4 py-2 font-medium text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">Cancel</button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
                      isSubmitting ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <Send className="w-4 h-4" /><span>{isSubmitting ? "Submitting..." : "Submit for Inspection"}</span>
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
          <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.1 }}
              className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 border border-slate-200 text-slate-900"
            >
              <form onSubmit={onSaveAddNew} className="space-y-4 text-xs">
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
                  <button type="button" onClick={onCloseAddNew} className="px-3 py-1.5 text-slate-600 font-medium text-xs rounded-lg hover:bg-slate-100">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
