"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { useDevRole } from "@/context/DevRoleContext";
import { apiService } from "@/app/apiService";
import { Search, Plus, Boxes, X, Save, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function MaterialDetailDrawer({
  material,
  onClose,
  onSaved,
  onDeleted
}: {
  material: any;
  onClose: () => void;
  onSaved: (m: any) => void;
  onDeleted: (id: string) => void;
}) {
  const [editName, setEditName] = useState(material.name);
  const [editDescription, setEditDescription] = useState(material.description || "");
  const [editPrice, setEditPrice] = useState(String(material.price));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isDirty =
    editName !== material.name ||
    editDescription !== (material.description || "") ||
    editPrice !== String(material.price);

  const handleSave = async () => {
    if (!editName.trim() || !editPrice.trim()) return;
    setSaving(true);
    try {
      const updated = await apiService.updateMaterial(material.id, {
        name: editName,
        description: editDescription,
        price: parseFloat(editPrice) || 0
      });
      if (updated) {
        onSaved(updated);
        setToast("Material updated successfully");
        setTimeout(() => setToast(null), 2500);
      }
    } catch (err) {
      console.error("Failed to update material", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${material.name}"?`)) return;
    setDeleting(true);
    try {
      await apiService.deleteMaterial(material.id);
      onDeleted(material.id);
      onClose();
    } catch (err) {
      console.error("Failed to delete material", err);
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
        className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs"
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
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Material Details</h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">View & Edit Item</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete Material"
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Item Information</h4>
              {isDirty && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                  Unsaved Changes
                </span>
              )}
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Item Name</span>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Description</span>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className={`${inputCls} h-24 resize-none`}
                  placeholder="Enter material description..."
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Price (₱)</span>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className={`${inputCls} font-extrabold text-emerald-800`}
                />
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

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMaterialForDetail, setSelectedMaterialForDetail] = useState<any | null>(null);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const lastScrollY = useRef(0);
  const devContext = useDevRole();

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice.trim()) return;

    try {
      const added = await apiService.createMaterial({
        name: newName,
        description: newDescription,
        price: parseFloat(newPrice) || 0
      });
      setMaterials([...materials, added]);
      setIsAddModalOpen(false);
      setNewName("");
      setNewDescription("");
      setNewPrice("");
    } catch (err) {
      console.error("Failed to create material", err);
    }
  };

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const data = await apiService.getMaterials();
        setMaterials(data || []);
      } catch (err) {
        console.error("Failed to fetch materials", err);
      }
    };
    fetchMaterials();
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

  const displayedMaterials = useMemo(() => {
    return materials.filter((m) => {
      return (
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.description || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [materials, searchTerm]);

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
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Materials</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Manage workshop materials, parts, and pricing</p>
            </div>
            <div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Material</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* STICKY AREA: SEARCH BAR */}
        <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md pt-2 pb-0 border-b border-slate-200/90 shadow-2xs -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-slate-900 text-white shadow-xs">
                <Boxes className="w-3.5 h-3.5" />
                <span>Materials ({materials.length})</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search material or description..."
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 transition-all w-52 sm:w-72 shadow-2xs"
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
                    <span className="hidden sm:inline">Add Material</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* TABLE HEADERS */}
          <div className="bg-slate-100/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 grid grid-cols-12 py-3 px-5 items-center mt-2 rounded-t-xl">
            <div className="col-span-4">Item Name</div>
            <div className="col-span-5">Description</div>
            <div className="col-span-3 text-right">Price (₱)</div>
          </div>
        </div>

        {/* DATA ROWS */}
        <section className="bg-white rounded-b-2xl border border-slate-200 border-t-0 shadow-2xs">
          {displayedMaterials.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">No matching materials found</h4>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {displayedMaterials.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedMaterialForDetail(item)}
                  className="grid grid-cols-12 py-3.5 px-5 items-center hover:bg-emerald-50/60 cursor-pointer transition-colors group"
                >
                  {/* Name */}
                  <div className="col-span-4 pr-2 font-bold text-slate-900">{item.name}</div>

                  {/* Description */}
                  <div className="col-span-5 pr-2 text-slate-500 font-normal truncate">
                    {item.description || <span className="italic text-slate-300">No description</span>}
                  </div>

                  {/* Price */}
                  <div className="col-span-3 text-right font-extrabold text-emerald-800">
                    ₱{Number(item.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ADD MATERIAL GLASSMORPHIC MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
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
                <h3 className="text-base font-extrabold text-slate-900">Add Material</h3>
                <p className="text-xs text-slate-500">Register a new material item in the database</p>
              </div>
              <form onSubmit={handleAddMaterial} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Item Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Engine Oil (5W-30)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="e.g. Premium synthetic engine oil for modern gasoline engines"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900 font-medium h-20 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900 font-medium"
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
                    Save Material
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MATERIAL DETAIL DRAWER */}
      <AnimatePresence>
        {selectedMaterialForDetail && (
          <MaterialDetailDrawer
            material={selectedMaterialForDetail}
            onClose={() => setSelectedMaterialForDetail(null)}
            onSaved={(updated) => {
              setMaterials(materials.map((m) => (m.id === updated.id ? updated : m)));
              setSelectedMaterialForDetail(updated);
            }}
            onDeleted={(id) => {
              setMaterials(materials.filter((m) => m.id !== id));
              setSelectedMaterialForDetail(null);
            }}
          />
        )}
      </AnimatePresence>
    </TailAdminLayout>
  );
}
