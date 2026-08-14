"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { useDevRole } from "@/context/DevRoleContext";
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2,
  Trash2,
  ChevronRight,
  Save,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Boxes,
  Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MaterialItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  cabinetCode: string;
  unitOfMeasure: string;
  costPrice: string;
  sellingPrice: string;
  stockQty: number;
  criticalThreshold: number;
  supplier: string;
  compatibleVehicles: string;
}

export default function MaterialsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockStatusFilter, setStockStatusFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Scroll Header Visibility
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

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

  // Master Categories List
  const categoriesList = [
    "🛠️ Filters",
    "🛢️ Fluids & Lubricants",
    "🚗 Brakes & Rotors",
    "⚙️ Belts & Timing",
    "🚘 Suspension & Steering",
    "🌡️ Cooling System",
    "⚡ Electrical & Ignition"
  ];

  // Master Materials Catalog Data
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  // Modals & Active Selections
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [isStockAdjustModalOpen, setIsStockAdjustModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);

  // Form State for Add / Edit
  const [formSku, setFormSku] = useState("");
  const [formName, setFormName] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formCategory, setFormCategory] = useState("🛠️ Filters");
  const [formCabinetCode, setFormCabinetCode] = useState("");
  const [formUnit, setFormUnit] = useState("pcs");
  const [formCostPrice, setFormCostPrice] = useState("");
  const [formSellingPrice, setFormSellingPrice] = useState("");
  const [formStockQty, setFormStockQty] = useState("");
  const [formCriticalThreshold, setFormCriticalThreshold] = useState("5");
  const [formSupplier, setFormSupplier] = useState("Rey Auto Supply Corp");
  const [formCompatibleVehicles, setFormCompatibleVehicles] = useState("");

  // Quick Stock Adjust Form State
  const [adjustMode, setAdjustMode] = useState<"ADD" | "SCRAP" | "AUDIT">("ADD");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  // Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open Edit Material Modal
  const openEditModal = (material: MaterialItem) => {
    setSelectedMaterial(material);
    setFormSku(material.sku);
    setFormName(material.name);
    setFormBrand(material.brand);
    setFormCategory(material.category);
    setFormCabinetCode(material.cabinetCode);
    setFormUnit(material.unitOfMeasure);
    setFormCostPrice(material.costPrice.replace(/[^\d.]/g, ""));
    setFormSellingPrice(material.sellingPrice.replace(/[^\d.]/g, ""));
    setFormStockQty(material.stockQty.toString());
    setFormCriticalThreshold(material.criticalThreshold.toString());
    setFormSupplier(material.supplier);
    setFormCompatibleVehicles(material.compatibleVehicles);
    setIsAddMaterialModalOpen(true);
  };

  // Open New Material Modal
  const openNewPartModal = () => {
    setSelectedMaterial(null);
    setFormSku("");
    setFormName("");
    setFormBrand("");
    setFormCategory("🛠️ Filters");
    setFormCabinetCode("");
    setFormUnit("pcs");
    setFormCostPrice("");
    setFormSellingPrice("");
    setFormStockQty("0");
    setFormCriticalThreshold("5");
    setFormSupplier("Rey Auto Supply Corp");
    setFormCompatibleVehicles("");
    setIsAddMaterialModalOpen(true);
  };

  // Save Material (Add or Update)
  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSku.trim() || !formName.trim() || !formSellingPrice.trim()) return;

    const parsedCost = parseFloat(formCostPrice) || 0;
    const parsedSelling = parseFloat(formSellingPrice) || 0;
    const parsedQty = parseInt(formStockQty) || 0;
    const parsedThreshold = parseInt(formCriticalThreshold) || 5;

    if (selectedMaterial) {
      const updated: MaterialItem = {
        ...selectedMaterial,
        sku: formSku.trim(),
        name: formName.trim(),
        brand: formBrand.trim() || "Generic",
        category: formCategory,
        cabinetCode: formCabinetCode.trim() || "SHELF-MAIN",
        unitOfMeasure: formUnit,
        costPrice: `₱${parsedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        sellingPrice: `₱${parsedSelling.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        stockQty: parsedQty,
        criticalThreshold: parsedThreshold,
        supplier: formSupplier.trim() || "Default Vendor",
        compatibleVehicles: formCompatibleVehicles.trim() || "Universal"
      };

      setMaterials(materials.map((p) => (p.id === selectedMaterial.id ? updated : p)));
      triggerToast(`Updated material details: ${formName}`);
    } else {
      const newPart: MaterialItem = {
        id: `PRT-${Math.floor(100 + Math.random() * 900)}`,
        sku: formSku.trim(),
        name: formName.trim(),
        brand: formBrand.trim() || "Generic",
        category: formCategory,
        cabinetCode: formCabinetCode.trim() || "SHELF-MAIN",
        unitOfMeasure: formUnit,
        costPrice: `₱${parsedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        sellingPrice: `₱${parsedSelling.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        stockQty: parsedQty,
        criticalThreshold: parsedThreshold,
        supplier: formSupplier.trim() || "Default Vendor",
        compatibleVehicles: formCompatibleVehicles.trim() || "Universal"
      };

      setMaterials([newPart, ...materials]);
      triggerToast(`Added new material to inventory: ${formName}`);
    }

    setIsAddMaterialModalOpen(false);
    setSelectedMaterial(null);
  };

  // Stock Adjustment Handler
  const handleStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !adjustQty) return;

    const qtyVal = parseInt(adjustQty) || 0;
    let newQty = selectedMaterial.stockQty;

    if (adjustMode === "ADD") {
      newQty += qtyVal;
    } else if (adjustMode === "SCRAP") {
      newQty = Math.max(0, newQty - qtyVal);
    } else if (adjustMode === "AUDIT") {
      newQty = Math.max(0, qtyVal);
    }

    setMaterials(
      materials.map((p) => (p.id === selectedMaterial.id ? { ...p, stockQty: newQty } : p))
    );

    triggerToast(`Adjusted stock for ${selectedMaterial.name} to ${newQty} ${selectedMaterial.unitOfMeasure}`);
    setIsStockAdjustModalOpen(false);
    setSelectedMaterial(null);
    setAdjustQty("");
    setAdjustNote("");
  };

  // Delete Material
  const handleDeleteMaterial = (id: string, name: string) => {
    setMaterials(materials.filter((p) => p.id !== id));
    setIsAddMaterialModalOpen(false);
    setSelectedMaterial(null);
    triggerToast(`Removed material: ${name}`);
  };

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesSearch =
        material.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.compatibleVehicles.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === "ALL" || material.category === categoryFilter;

      let matchesStatus = true;
      if (stockStatusFilter === "IN_STOCK") {
        matchesStatus = material.stockQty > material.criticalThreshold;
      } else if (stockStatusFilter === "LOW_STOCK") {
        matchesStatus = material.stockQty > 0 && material.stockQty <= material.criticalThreshold;
      } else if (stockStatusFilter === "OUT_OF_STOCK") {
        matchesStatus = material.stockQty === 0;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [materials, searchTerm, categoryFilter, stockStatusFilter]);

  // Statistics Computations
  const totalValuation = useMemo(() => {
    return materials.reduce((sum, p) => {
      const cost = parseFloat(p.costPrice.replace(/[^\d.]/g, "")) || 0;
      return sum + cost * p.stockQty;
    }, 0);
  }, [materials]);

  const criticalCount = useMemo(() => {
    return materials.filter((p) => p.stockQty <= p.criticalThreshold).length;
  }, [materials]);

  // Options for Category Select
  const categoryOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "ALL", label: "All Categories", count: materials.length },
      ...categoriesList.map((cat) => ({
        value: cat,
        label: cat,
        count: materials.filter((p) => p.category === cat).length
      }))
    ];
  }, [materials, categoriesList]);

  // Options for Stock Status Select
  const stockStatusOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "ALL", label: "All Stock Levels", count: materials.length },
      {
        value: "IN_STOCK",
        label: "🟢 In Stock",
        count: materials.filter((p) => p.stockQty > p.criticalThreshold).length
      },
      {
        value: "LOW_STOCK",
        label: "🟡 Low Stock Warning",
        count: materials.filter((p) => p.stockQty > 0 && p.stockQty <= p.criticalThreshold).length
      },
      {
        value: "OUT_OF_STOCK",
        label: "🔴 Out of Stock",
        count: materials.filter((p) => p.stockQty === 0).length
      }
    ];
  }, [materials]);

  const devContext = useDevRole();

  return (
    <TailAdminLayout userRole={devContext.activeRole} userName={devContext.currentProfile.name} userEmail={devContext.currentProfile.email}>
      <div className="space-y-3">
        
        {/* 1. TOP HEADER SECTION */}
        <motion.div
          animate={{
            height: isHeaderVisible ? "auto" : 0,
            opacity: isHeaderVisible ? 1 : 0,
            marginBottom: isHeaderVisible ? 12 : 0
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden border-b border-slate-200/80 pb-2.5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Materials Catalog & Stock Manager
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage shop materials stock levels, supplier unit costs, cabinet storage codes, and catalog
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openNewPartModal}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Material</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-2xs flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Materials</div>
                <div className="text-sm font-extrabold text-slate-900">{materials.length} Materials</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-2xs flex items-center gap-3">
              <div className={`p-2 rounded-lg ${criticalCount > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Low Stock Alerts</div>
                <div className={`text-sm font-extrabold ${criticalCount > 0 ? "text-amber-800" : "text-emerald-800"}`}>
                  {criticalCount} Critical
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-2xs flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Inventory Value</div>
                <div className="text-sm font-extrabold text-emerald-900">
                  ₱{totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 2. FIXED STICKY AREA: FILTERS & TABLE HEADERS */}
        <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md pt-2 pb-0 border-b border-slate-200/90 shadow-2xs -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search SKU, Material Name, Brand, Car..."
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 transition-all w-52 sm:w-64 shadow-2xs"
                />
              </div>

              {/* Category Filter */}
              <CustomSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryOptions}
                className="w-48"
              />

              {/* Stock Status Filter */}
              <CustomSelect
                value={stockStatusFilter}
                onChange={setStockStatusFilter}
                options={stockStatusOptions}
                className="w-48"
              />
            </div>

            <div className="text-xs text-slate-500 font-semibold">
              Showing <span className="font-extrabold text-slate-900">{filteredMaterials.length}</span> of {materials.length} materials
            </div>
          </div>

          {/* TABLE COLUMN HEADERS */}
          <div className="bg-slate-100/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 grid grid-cols-12 py-3 px-5 items-center mt-2 rounded-t-xl">
            <div className="col-span-3 sm:col-span-3">Material SKU & Name</div>
            <div className="col-span-2 sm:col-span-2">Brand & Category</div>
            <div className="col-span-2 sm:col-span-2">Location Code</div>
            <div className="col-span-2 sm:col-span-2 text-right">Cost / Selling (₱)</div>
            <div className="col-span-3 sm:col-span-3 text-right pr-2">Stock Level & Status</div>
          </div>

        </div>

        {/* 3. MASTER PARTS DATA ROWS */}
        <section className="bg-white rounded-b-2xl border border-slate-200 border-t-0 shadow-2xs">
          <div className="divide-y divide-slate-100 text-xs">
            {filteredMaterials.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Package className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                <div className="text-sm font-bold text-slate-700">No materials added yet</div>
                <p className="text-xs text-slate-400 font-normal">Click "Add New Material" above to add items to your materials catalog.</p>
              </div>
            ) : (
              filteredMaterials.map((material) => {
              const isOut = material.stockQty === 0;
              const isLow = material.stockQty > 0 && material.stockQty <= material.criticalThreshold;

              return (
                <div
                  key={material.id}
                  onClick={() => openEditModal(material)}
                  className="grid grid-cols-12 py-3.5 px-5 items-center hover:bg-emerald-50/60 cursor-pointer transition-colors group"
                >
                  {/* SKU & Name */}
                  <div className="col-span-3 sm:col-span-3 pr-2">
                    <div className="font-extrabold text-slate-950 text-xs group-hover:text-emerald-700 transition-colors">
                      {material.name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded border border-slate-200">
                        {material.sku}
                      </span>
                      <span className="truncate">{material.unitOfMeasure}</span>
                    </div>
                  </div>

                  {/* Brand & Category */}
                  <div className="col-span-2 sm:col-span-2 pr-2">
                    <div className="font-bold text-slate-800 text-xs">{material.brand}</div>
                    <div className="text-[10px] text-slate-500 font-medium truncate">{material.category}</div>
                  </div>

                  {/* Location Code */}
                  <div className="col-span-2 sm:col-span-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                      {material.cabinetCode}
                    </span>
                  </div>

                  {/* Cost & Selling Price */}
                  <div className="col-span-2 sm:col-span-2 text-right">
                    <div className="font-extrabold text-emerald-800 text-xs">{material.sellingPrice}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Cost: {material.costPrice}</div>
                  </div>

                  {/* Stock Qty & Status Badge */}
                  <div className="col-span-3 sm:col-span-3 flex items-center justify-end gap-2 pr-1">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border flex items-center gap-1.5 ${
                        isOut
                          ? "bg-rose-50 text-rose-800 border-rose-300"
                          : isLow
                          ? "bg-amber-50 text-amber-900 border-amber-300"
                          : "bg-emerald-50 text-emerald-900 border-emerald-300"
                      }`}
                    >
                      <span>
                        {material.stockQty} {material.unitOfMeasure}
                      </span>
                      {isOut && <span className="text-[9px] uppercase font-black">Out</span>}
                      {isLow && <span className="text-[9px] uppercase font-black">Low</span>}
                    </span>

                    {/* Stock Adjust Trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMaterial(material);
                        setIsStockAdjustModalOpen(true);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 font-bold text-[11px] rounded-lg border border-slate-200 transition-all shrink-0"
                      title="Adjust Stock Qty"
                    >
                      📦 Adjust
                    </button>
                  </div>
                </div>
              );
            }))}
          </div>
        </section>

      </div>

      {/* 🟢 ADD / EDIT PART MODAL */}
      <AnimatePresence>
        {isAddMaterialModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 text-slate-900 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <h2 className="text-base font-extrabold text-slate-950 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-700" />
                  <span>{selectedMaterial ? "Edit Material Details" : "Add New Auto Material"}</span>
                </h2>
                <button
                  onClick={() => setIsAddMaterialModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMaterial} className="space-y-3 flex-1 overflow-y-auto pr-1">
                
                {/* SKU & Name */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Material SKU / OEM #</label>
                    <input
                      type="text"
                      required
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      placeholder="e.g. 90915-YZZE1"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Material Name / Description</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Engine Oil Filter (Toyota Vios)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Brand, Category & Cabinet Location Code */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Brand / Make</label>
                    <input
                      type="text"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="e.g. Denso"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                    <CustomSelect
                      value={formCategory}
                      onChange={setFormCategory}
                      options={categoriesList.map((cat) => ({ value: cat, label: cat }))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cabinet Code</label>
                    <input
                      type="text"
                      value={formCabinetCode}
                      onChange={(e) => setFormCabinetCode(e.target.value)}
                      placeholder="e.g. CAB-A1-S2"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Cost Price, Selling Price, Unit */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formCostPrice}
                      onChange={(e) => setFormCostPrice(e.target.value)}
                      placeholder="120.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Retail Selling (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formSellingPrice}
                      onChange={(e) => setFormSellingPrice(e.target.value)}
                      placeholder="250.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-extrabold text-emerald-800 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Format</label>
                    <CustomSelect
                      value={formUnit}
                      onChange={setFormUnit}
                      options={[
                        { value: "pcs", label: "pcs (Pieces)" },
                        { value: "set", label: "set (Set/Kit)" },
                        { value: "bottle", label: "bottle (Bottles)" },
                        { value: "liters", label: "liters (Fluid)" },
                        { value: "box", label: "box (Carton Box)" }
                      ]}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Stock Qty & Critical Threshold */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Stock Quantity</label>
                    <input
                      type="number"
                      value={formStockQty}
                      onChange={(e) => setFormStockQty(e.target.value)}
                      placeholder="45"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Critical Low Stock Threshold</label>
                    <input
                      type="number"
                      value={formCriticalThreshold}
                      onChange={(e) => setFormCriticalThreshold(e.target.value)}
                      placeholder="5"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-amber-800 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Supplier & Compatible Vehicles */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Supplier / Vendor</label>
                    <input
                      type="text"
                      value={formSupplier}
                      onChange={(e) => setFormSupplier(e.target.value)}
                      placeholder="e.g. Rey Auto Supply Corp"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Compatible Vehicles</label>
                    <input
                      type="text"
                      value={formCompatibleVehicles}
                      onChange={(e) => setFormCompatibleVehicles(e.target.value)}
                      placeholder="e.g. Toyota Vios, Yaris, Wigo"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
                  {selectedMaterial ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteMaterial(selectedMaterial.id, selectedMaterial.name)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-all flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddMaterialModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>{selectedMaterial ? "Save Changes" : "Save Material"}</span>
                    </button>
                  </div>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📦 QUICK STOCK ADJUSTMENT MODAL */}
      <AnimatePresence>
        {isStockAdjustModalOpen && selectedMaterial && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 text-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-950">Quick Stock Adjustment</h2>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">{selectedMaterial.name}</p>
                </div>
                <button
                  onClick={() => setIsStockAdjustModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAdjustMode("ADD")}
                  className={`py-1.5 rounded-lg transition-all ${
                    adjustMode === "ADD" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ➕ Restock
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustMode("SCRAP")}
                  className={`py-1.5 rounded-lg transition-all ${
                    adjustMode === "SCRAP" ? "bg-rose-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ➖ Scrap
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustMode("AUDIT")}
                  className={`py-1.5 rounded-lg transition-all ${
                    adjustMode === "AUDIT" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  📋 Audit
                </button>
              </div>

              <form onSubmit={handleStockAdjustment} className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold">Current Stock Level:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {selectedMaterial.stockQty} {selectedMaterial.unitOfMeasure}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {adjustMode === "ADD" && "Quantity to Add (+):"}
                    {adjustMode === "SCRAP" && "Quantity to Scrap (-):"}
                    {adjustMode === "AUDIT" && "New Exact Physical Audit Count:"}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    placeholder="Enter quantity..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Supplier Invoice #</label>
                  <input
                    type="text"
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    placeholder="e.g. Restock invoice #INV-9021"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsStockAdjustModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                  >
                    Save Stock Adjustment
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
