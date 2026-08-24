"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { useDevRole } from "@/context/DevRoleContext";
import { apiService } from "@/app/apiService";
import {
  Wrench,
  Package,
  Plus,
  Search,
  CheckCircle2,
  Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { LaborItem, PackageBundle, calculateStandaloneSum } from "./bundleHelpers";
import { LaborCard } from "./LaborCard";
import { BundleCard } from "./BundleCard";
import { CreateEditLaborModal } from "./CreateEditLaborModal";
import { CreateEditBundleModal } from "./CreateEditBundleModal";
import { CategoryManagementModal } from "./CategoryManagementModal";
import { ReorderMaterialsModal } from "./ReorderMaterialsModal";

export default function AdminServicesPage() {
  const [activeTab, setActiveTab] = useState<"LABOR" | "PACKAGES">("LABOR");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Smart scroll header reveal/hide
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

  // Categories & Modals
  const [categoriesList, setCategoriesList] = useState<string[]>([
    "PMS",
    "AIRCON SERVICES",
    "MAJOR WORK",
    "UNDER CHASSIS",
    "COOLING SYSTEM RESTORATION"
  ]);

  const [isAddLaborModalOpen, setIsAddLaborModalOpen] = useState(false);
  const [isAddPackageModalOpen, setIsAddPackageModalOpen] = useState(false);
  const [isAddLaborsSubModalOpen, setIsAddLaborsSubModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [selectedLaborDetail, setSelectedLaborDetail] = useState<LaborItem | null>(null);
  const [selectedPackageDetail, setSelectedPackageDetail] = useState<PackageBundle | null>(null);

  const [laborItems, setLaborItems] = useState<LaborItem[]>([]);
  const [packages, setPackages] = useState<PackageBundle[]>([]);

  // Package Form State
  const [pkgTitle, setPkgTitle] = useState("");
  const [pkgDescription, setPkgDescription] = useState("");
  const [pkgInterval, setPkgInterval] = useState("");
  const [pkgFlatPrice, setPkgFlatPrice] = useState("");
  const [selectedLaborIdsForPkg, setSelectedLaborIdsForPkg] = useState<string[]>(["PMS-001", "PMS-002"]);
  const [pkgSearchLaborQuery, setPkgSearchLaborQuery] = useState("");
  const [pkgSubModalCategoryFilter, setPkgSubModalCategoryFilter] = useState("ALL");

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const labor = await apiService.getLabor();
        if (labor && labor.length > 0) {
          const realLabor = labor.filter((l: any) => !l.id.startsWith("PKG-REF-") && l.category !== "📦 EXISTING PMS PACKAGES") as LaborItem[];
          setLaborItems(realLabor);
          const uniqueCats = Array.from(new Set(realLabor.map((l: any) => l.category))) as string[];
          if (uniqueCats.length > 0) setCategoriesList(uniqueCats);
        }
        const bundles = await apiService.getBundles();
        if (bundles && bundles.length > 0) {
          setPackages(bundles);
        }
      } catch (err) {
        console.error("Failed to load master labor and bundles", err);
      }
    };
    fetchMasterData();
  }, []);

  const selectableItemsForPackagePicker = useMemo(() => {
    const packageItems: LaborItem[] = packages.map((pkg) => ({
      id: `PKG-REF-${pkg.id}`,
      name: `Everything included in ${pkg.packageName}`,
      price: pkg.packagePrice,
      category: "📦 EXISTING PMS PACKAGES",
      description: pkg.description,
      status: "Active",
      isPackageItem: true
    }));

    return [...packageItems, ...laborItems];
  }, [packages, laborItems]);

  const stickyHeaderCategoryOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "ALL", label: "All Categories", count: laborItems.length },
      ...categoriesList.map((cat) => ({
        value: cat,
        label: cat,
        count: laborItems.filter((i) => i.category === cat).length
      }))
    ];
  }, [categoriesList, laborItems]);

  const subModalCategoryOptions: SelectOption[] = useMemo(() => {
    return [
      { value: "ALL", label: "All Items", count: selectableItemsForPackagePicker.length },
      { value: "📦 EXISTING PMS PACKAGES", label: "📦 EXISTING PMS PACKAGES", count: packages.length },
      ...categoriesList.map((cat) => ({
        value: cat,
        label: cat,
        count: selectableItemsForPackagePicker.filter((i) => i.category === cat).length
      }))
    ];
  }, [categoriesList, packages, selectableItemsForPackagePicker]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openPackageDetailsModal = (pkg: PackageBundle) => {
    setSelectedPackageDetail(pkg);
    setPkgTitle(pkg.packageName);
    setPkgDescription(pkg.description);
    setPkgInterval(pkg.targetInterval);
    setPkgFlatPrice(pkg.packagePrice.replace(/[^\d.]/g, ""));

    const matchedIds: string[] = [];
    pkg.servicesIncluded.forEach((svcName) => {
      const match = selectableItemsForPackagePicker.find((item) => item.name === svcName);
      if (match) matchedIds.push(match.id);
    });

    setSelectedLaborIdsForPkg(matchedIds.length > 0 ? matchedIds : ["PMS-001", "PMS-002"]);
    setIsAddPackageModalOpen(true);
  };

  const openCreatePackageModal = () => {
    setSelectedPackageDetail(null);
    setPkgTitle("");
    setPkgDescription("");
    setPkgInterval("");
    setPkgFlatPrice("");
    setSelectedLaborIdsForPkg(["PMS-001", "PMS-002"]);
    setIsAddPackageModalOpen(true);
  };

  const handleSaveNewLabor = async (data: { name: string; price: string; category: string; description: string }) => {
    try {
      const result = await apiService.createLabor({
        name: data.name,
        price: `₱${Number(data.price).toLocaleString()}.00`,
        category: data.category,
        description: data.description || "Standard shop labor service."
      });
      setLaborItems((prev) => [result, ...prev]);
      triggerToast(`Added new labor service: ${data.name}`);
    } catch (err) {
      console.error("Failed to create labor via API", err);
    }
    setIsAddLaborModalOpen(false);
  };

  const handleUpdateLabor = async (data: { id: string; name: string; price: string; category: string; description: string }) => {
    try {
      const updated = await apiService.updateLabor(data.id, {
        labor_name: data.name,
        price: parseFloat(data.price),
        category: data.category,
        description: data.description
      });
      if (updated) {
        setLaborItems((prev) => prev.map((item) => (item.id === data.id ? updated : item)));
        triggerToast(`Saved changes for ${data.name}`);
      }
    } catch (err) {
      console.error("Failed to update labor", err);
    }
    setSelectedLaborDetail(null);
  };

  const handleDeleteLabor = async (id: string, name: string) => {
    try {
      await apiService.deleteLabor(id);
      setLaborItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedLaborDetail(null);
      triggerToast(`Removed labor service: ${name}`);
    } catch (err) {
      console.error("Failed to delete labor", err);
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgTitle.trim()) return;

    const standaloneSumNum = calculateStandaloneSum(selectedLaborIdsForPkg, selectableItemsForPackagePicker);
    const finalPrice = pkgFlatPrice ? `₱${Number(pkgFlatPrice).toLocaleString()}.00` : `₱${standaloneSumNum.toLocaleString()}.00`;

    if (selectedPackageDetail) {
      try {
        const updated = await apiService.updateBundle(selectedPackageDetail.id, {
          bundle_name: pkgTitle,
          interval: pkgInterval || selectedPackageDetail.targetInterval,
          description: pkgDescription || selectedPackageDetail.description,
          original_price: standaloneSumNum,
          discounted_price: pkgFlatPrice ? parseFloat(pkgFlatPrice) : standaloneSumNum,
          labor_ids: selectedLaborIdsForPkg
        });
        if (updated) {
          setPackages((prev) => prev.map((p) => (p.id === selectedPackageDetail.id ? updated : p)));
          triggerToast(`Saved changes for package: ${pkgTitle}`);
        }
      } catch (err) {
        console.error("Failed to update bundle via API", err);
      }
    } else {
      try {
        const result = await apiService.createBundle({
          packageName: pkgTitle,
          targetInterval: pkgInterval || "Custom Service Interval",
          description: pkgDescription || `Custom package bundling ${selectedLaborIdsForPkg.length} services.`,
          standaloneSum: `₱${standaloneSumNum.toLocaleString()}.00`,
          packagePrice: finalPrice,
          laborIds: selectedLaborIdsForPkg
        });
        setPackages((prev) => [result, ...prev]);
        triggerToast(`Created new package bundle: ${pkgTitle}`);
      } catch (err) {
        console.error("Failed to create bundle via API", err);
      }
    }

    setIsAddPackageModalOpen(false);
    setSelectedPackageDetail(null);
    setPkgTitle("");
    setPkgDescription("");
    setPkgInterval("");
    setPkgFlatPrice("");
  };

  const handleDeletePackage = async (id: string, name: string) => {
    try {
      await apiService.deleteBundle(id);
      setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
      setIsAddPackageModalOpen(false);
      setSelectedPackageDetail(null);
      triggerToast(`Removed package service: ${name}`);
    } catch (err) {
      console.error("Failed to delete bundle", err);
    }
  };

  const toggleLaborSelectionForPkg = (id: string) => {
    setSelectedLaborIdsForPkg((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const devContext = useDevRole();
  const { mockDataState } = devContext;

  const filteredLaborItems = useMemo(() => {
    return laborItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = categoryFilter === "ALL" || item.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [laborItems, searchTerm, categoryFilter]);

  const displayedLaborItems = useMemo(() => {
    if (mockDataState === "empty") return [];
    return filteredLaborItems;
  }, [mockDataState, filteredLaborItems]);

  const displayedPackages = useMemo(() => {
    if (mockDataState === "empty") return [];
    return packages.filter((pkg) => pkg.packageName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [mockDataState, packages, searchTerm]);

  return (
    <TailAdminLayout userRole={devContext.activeRole} userName={devContext.currentProfile.name} userEmail={devContext.currentProfile.email}>
      <div className="space-y-3">
        {/* HEADER */}
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
                Service Catalog & Package Builder
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage shop labor rates, inspection services, and package bundles for Rey Auto Repair Shop
              </p>
            </div>

            <div>
              {activeTab === "LABOR" ? (
                <button
                  onClick={() => {
                    setSelectedLaborDetail(null);
                    setIsAddLaborModalOpen(true);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Labor</span>
                </button>
              ) : (
                <button
                  onClick={openCreatePackageModal}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Package</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* TOAST */}
        {toastMessage && (
          <div className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* STICKY TAB & FILTER BAR */}
        <div className="sticky top-0 z-30 bg-slate-50 pt-2 pb-0 border-b border-slate-200/90 shadow-2xs -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("LABOR")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "LABOR"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Labor ({laborItems.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("PACKAGES")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "PACKAGES"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Package Service ({packages.length})</span>
              </button>

              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-2.5 py-1.5 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Manage Categories"
              >
                <Tag className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Categories</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search labor or packages..."
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 transition-all w-44 sm:w-60 shadow-2xs font-normal"
                />
              </div>

              {activeTab === "LABOR" && (
                <CustomSelect
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={stickyHeaderCategoryOptions}
                  className="w-56"
                />
              )}

              <AnimatePresence>
                {!isHeaderVisible && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => (activeTab === "LABOR" ? setIsAddLaborModalOpen(true) : openCreatePackageModal())}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {activeTab === "LABOR" ? "Add Labor" : "New Package"}
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {activeTab === "LABOR" && (
            <div className="bg-slate-100/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 grid grid-cols-12 py-3 px-5 items-center mt-2 rounded-t-xl">
              <div className="col-span-4 sm:col-span-3">Labor Name</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-3 sm:col-span-3">Category</div>
              <div className="col-span-3 sm:col-span-4">Description</div>
            </div>
          )}
        </div>

        {/* DATA ROWS AREA */}
        {activeTab === "LABOR" && (
          <section className="bg-white rounded-b-2xl border border-slate-200 border-t-0 shadow-2xs">
            {displayedLaborItems.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3">
                <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-900">
                    {mockDataState === "empty" ? "No labor services found" : "No matching items found"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {mockDataState === "empty"
                      ? "Get started by adding your shop's first labor service."
                      : `No labor items matched "${searchTerm}".`}
                  </p>
                </div>
                {mockDataState === "empty" ? (
                  <button
                    onClick={() => setIsAddLaborModalOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Labor Service</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("ALL");
                    }}
                    className="text-xs text-emerald-600 font-semibold hover:underline cursor-pointer"
                  >
                    Reset search & filters
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {displayedLaborItems.map((item) => (
                  <LaborCard key={item.id} item={item} onClick={() => setSelectedLaborDetail(item)} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "PACKAGES" && (
          <div>
            {displayedPackages.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 py-12 px-4 text-center space-y-3 my-2">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-900">
                    {mockDataState === "empty" ? "No package bundles found" : "No matching packages found"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {mockDataState === "empty"
                      ? "Bundle individual labor rates into flat-priced PMS packages."
                      : `No packages matched "${searchTerm}".`}
                  </p>
                </div>
                {mockDataState === "empty" ? (
                  <button
                    onClick={openCreatePackageModal}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Package</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-xs text-emerald-600 font-semibold hover:underline cursor-pointer"
                  >
                    Reset search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-3">
                {displayedPackages.map((pkg) => (
                  <BundleCard key={pkg.id} pkg={pkg} onClick={() => openPackageDetailsModal(pkg)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE & EDIT LABOR MODAL */}
      <AnimatePresence>
        {(isAddLaborModalOpen || selectedLaborDetail) && (
          <CreateEditLaborModal
            key={selectedLaborDetail ? `edit-${selectedLaborDetail.id}` : "add-labor"}
            isOpen={isAddLaborModalOpen || Boolean(selectedLaborDetail)}
            onClose={() => {
              setIsAddLaborModalOpen(false);
              setSelectedLaborDetail(null);
            }}
            selectedLaborDetail={selectedLaborDetail}
            categoriesList={categoriesList}
            onSaveNewLabor={handleSaveNewLabor}
            onUpdateLabor={handleUpdateLabor}
            onDeleteLabor={handleDeleteLabor}
          />
        )}
      </AnimatePresence>

      {/* CREATE & EDIT BUNDLE MODAL */}
      <AnimatePresence>
        {isAddPackageModalOpen && (
          <CreateEditBundleModal
            key={selectedPackageDetail ? `edit-bundle-${selectedPackageDetail.id}` : "add-bundle"}
            isOpen={isAddPackageModalOpen}
            onClose={() => {
              setIsAddPackageModalOpen(false);
              setSelectedPackageDetail(null);
            }}
            selectedPackageDetail={selectedPackageDetail}
            pkgTitle={pkgTitle}
            setPkgTitle={setPkgTitle}
            pkgDescription={pkgDescription}
            setPkgDescription={setPkgDescription}
            pkgInterval={pkgInterval}
            setPkgInterval={setPkgInterval}
            pkgFlatPrice={pkgFlatPrice}
            setPkgFlatPrice={setPkgFlatPrice}
            selectedLaborIdsForPkg={selectedLaborIdsForPkg}
            selectableItemsForPackagePicker={selectableItemsForPackagePicker}
            onOpenSubModal={() => setIsAddLaborsSubModalOpen(true)}
            onToggleLaborSelection={toggleLaborSelectionForPkg}
            onSavePackage={handleSavePackage}
            onDeletePackage={handleDeletePackage}
          />
        )}
      </AnimatePresence>

      {/* REORDER & PICK LABORS SUB-MODAL */}
      <AnimatePresence>
        {isAddLaborsSubModalOpen && (
          <ReorderMaterialsModal
            key="reorder-modal"
            isOpen={isAddLaborsSubModalOpen}
            onClose={() => setIsAddLaborsSubModalOpen(false)}
            selectableItems={selectableItemsForPackagePicker}
            selectedLaborIds={selectedLaborIdsForPkg}
            onToggleLaborSelection={toggleLaborSelectionForPkg}
            onReorder={setSelectedLaborIdsForPkg}
            subModalCategoryOptions={subModalCategoryOptions}
            pkgSearchLaborQuery={pkgSearchLaborQuery}
            setPkgSearchLaborQuery={setPkgSearchLaborQuery}
            pkgSubModalCategoryFilter={pkgSubModalCategoryFilter}
            setPkgSubModalCategoryFilter={setPkgSubModalCategoryFilter}
          />
        )}
      </AnimatePresence>

      {/* CATEGORY MANAGEMENT MODAL */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <CategoryManagementModal
            key="category-modal"
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            categoriesList={categoriesList}
            onAddCategory={(newCat) => {
              if (!categoriesList.includes(newCat)) {
                setCategoriesList([...categoriesList, newCat]);
                triggerToast(`Added category: ${newCat}`);
              }
            }}
          />
        )}
      </AnimatePresence>
    </TailAdminLayout>
  );
}
