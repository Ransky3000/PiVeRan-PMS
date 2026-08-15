"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { useDevRole } from "@/context/DevRoleContext";
import { apiService } from "@/app/apiService";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { Search, Plus, Boxes, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
        sellingPrice: newPrice
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
        const formatted = data.map((item: any) => ({
            ...item,
            cabinetCode: item.cabinet_code,
            unitOfMeasure: item.unit_of_measure,
            costPrice: String(item.cost_price),
            sellingPrice: String(item.selling_price),
            stockQty: item.stock_qty,
            criticalThreshold: item.critical_threshold,
            compatibleVehicles: item.compatible_vehicles
        }));
        setMaterials(formatted);
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

  const categoryOptions: SelectOption[] = useMemo(() => {
    const cats = Array.from(new Set(materials.map(m => m.category))).filter(Boolean);
    return [
      { value: "ALL", label: "All Categories" },
      ...cats.map(c => ({ value: c, label: c }))
    ];
  }, [materials]);

  const displayedMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            m.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = categoryFilter === "ALL" || m.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [materials, searchTerm, categoryFilter]);

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
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Materials & Parts Catalog</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Manage inventory, stock levels, and pricing</p>
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

        {/* STICKY AREA: SEARCH BAR & FILTERS */}
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
                  placeholder="Search SKU or name..."
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 transition-all w-44 sm:w-60 shadow-2xs"
                />
              </div>

              <CustomSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryOptions}
                className="w-56"
              />

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
            <div className="col-span-2">SKU</div>
            <div className="col-span-3">Material Name & Brand</div>
            <div className="col-span-3">Category</div>
            <div className="col-span-2">Unit Price</div>
            <div className="col-span-2 text-right">Stock Qty</div>
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
                <div key={item.id} className="grid grid-cols-12 py-3.5 px-5 items-center hover:bg-emerald-50/60 cursor-pointer transition-colors group">
                  
                  {/* SKU */}
                  <div className="col-span-2 pr-2 font-bold text-slate-500">
                    {item.sku}
                  </div>

                  {/* Name & Brand */}
                  <div className="col-span-3 pr-2">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">{item.brand}</div>
                  </div>

                  {/* Category */}
                  <div className="col-span-3 pr-2 text-slate-500 font-normal">
                    {item.category}
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-2 text-slate-700 font-medium">
                    ₱{Number(item.sellingPrice).toLocaleString()}.00 <span className="text-[10px] text-slate-400 font-normal">/ {item.unitOfMeasure}</span>
                  </div>

                  {/* Stock Qty with Visual Indicator */}
                  <div className="col-span-2 text-right pr-2 flex items-center justify-end gap-2">
                    {item.stockQty <= item.criticalThreshold && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    )}
                    <span className={`px-2.5 py-1 rounded-md font-bold ${
                      item.stockQty <= item.criticalThreshold 
                        ? "bg-red-50 text-red-700" 
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {item.stockQty}
                    </span>
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
                <h3 className="text-base font-extrabold text-slate-900">Add Material & Part</h3>
                <p className="text-xs text-slate-500">Register a new catalog item in the database</p>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Selling Price (₱)</label>
                  <input
                    type="number"
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
                    Save Part
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
