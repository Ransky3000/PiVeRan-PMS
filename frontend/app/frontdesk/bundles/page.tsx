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
  Tag,
  X,
  Sparkles,
  Trash2,
  ChevronRight,
  Save,
  Clock,
  CheckSquare,
  Square,
  Filter,
  GripVertical,
  Settings,
  Edit2,
  Check
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";

interface LaborItem {
  id: string;
  name: string;
  price: string;
  category: string;
  description: string;
  status: "Active" | "Archived";
  isPackageItem?: boolean;
}

interface PackageBundle {
  id: string;
  packageName: string;
  targetInterval: string;
  description: string;
  servicesIncluded: string[];
  packagePrice: string;
  standaloneSum: string;
  popularBadge?: boolean;
}

export default function AdminServicesPage() {
  const [activeTab, setActiveTab] = useState<"LABOR" | "PACKAGES">("LABOR");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 📜 SMART SCROLL HEADER REVEAL / HIDE STATE FOR TITLE ONLY
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

  // Dynamic Categories List
  const [categoriesList, setCategoriesList] = useState<string[]>([
    "🛠️ PREVENTIVE MAINTENANCE SERVICE",
    "❄️ AIRCON SERVICES",
    "⚙️ MAJOR WORK",
    "🚗 UNDER CHASSIS",
    "🌡️ COOLING SYSTEM RESTORATION"
  ]);

  // Modals & Detail Drawers
  const [isAddLaborModalOpen, setIsAddLaborModalOpen] = useState(false);
  const [isAddPackageModalOpen, setIsAddPackageModalOpen] = useState(false);
  const [isAddLaborsSubModalOpen, setIsAddLaborsSubModalOpen] = useState(false);
  const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false);
  const [selectedLaborDetail, setSelectedLaborDetail] = useState<LaborItem | null>(null);
  const [selectedPackageDetail, setSelectedPackageDetail] = useState<PackageBundle | null>(null);

  // Category Renaming State
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [renamingInput, setRenamingInput] = useState("");
  const [newCategoryModalInput, setNewCategoryModalInput] = useState("");

  // Labor Detail Modal Editable State
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [customEditCategoryInput, setCustomEditCategoryInput] = useState("");
  const [isCustomEditCategory, setIsCustomEditCategory] = useState(false);

  // 📋 MASTER LABOR CATALOG ITEMS
  const [laborItems, setLaborItems] = useState<LaborItem[]>([
    // Category 1: 🛠️ PREVENTIVE MAINTENANCE SERVICE
    { id: "PMS-001", name: "Change Oil", price: "₱650.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Drain old engine oil, replace sealing washer, and refill fresh engine oil.", status: "Active" },
    { id: "PMS-002", name: "Replace Oil Filter", price: "₱250.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Spin-off old oil filter and install new OEM oil filter element.", status: "Active" },
    { id: "PMS-003", name: "Replace Air Filter", price: "₱350.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Inspect air intake box and replace engine air filter element.", status: "Active" },
    { id: "PMS-004", name: "Replace Fuel Filter", price: "₱550.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Replace inline fuel filter to prevent injector clogging.", status: "Active" },
    { id: "PMS-005", name: "Replace Sparkplug", price: "₱450.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Inspect spark plug electrode gap and replace set of spark plugs.", status: "Active" },
    { id: "PMS-006", name: "Replace Cabin Filter", price: "₱350.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Replace interior AC cabin pollen hygiene filter.", status: "Active" },
    { id: "PMS-007", name: "Replace Transmission Oil", price: "₱950.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Drain and refill automatic/manual transmission fluid.", status: "Active" },
    { id: "PMS-008", name: "Replace Differential Oil", price: "₱850.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Drain and refill front/rear differential gear oil.", status: "Active" },
    { id: "PMS-009", name: "Throttle Body Inspection", price: "₱450.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Inspect throttle valve plate for carbon deposits.", status: "Active" },
    { id: "PMS-010", name: "Inspect and Clean brake lining and drum", price: "₱1,200.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Remove rear drums, blow out dust, sand lining, and adjust clearance.", status: "Active" },
    { id: "PMS-011", name: "Inspect/Replace Brake pads and disk", price: "₱1,800.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Inspect front disc pads, measure rotor thickness, and fit new pads.", status: "Active" },
    { id: "PMS-012", name: "Inspect Steering wheel, linkage and gear box", price: "₱650.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Check steering play, tie rods, pitman arm, and gear box boots.", status: "Active" },
    { id: "PMS-013", name: "Inspect Front and rear suspension", price: "₱750.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Inspect struts, coil springs, control arm bushings, and sway links.", status: "Active" },
    { id: "PMS-014", name: "Inspect Battery", price: "₱250.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Digital battery CCA load test, terminal cleaning, and electrolyte check.", status: "Active" },
    { id: "PMS-015", name: "Inspect Clutch System", price: "₱550.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Check clutch pedal freeplay, master/slave cylinder fluid, and slippage.", status: "Active" },
    { id: "PMS-016", name: "Inspect Airconditioning", price: "₱450.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Check manifold pressure gauge, vent temp output, and compressor clutch.", status: "Active" },
    { id: "PMS-017", name: "Inspect/Replace Drivebelt", price: "₱600.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Inspect serpentine belt for cracks, tensioner alignment, or replace belt.", status: "Active" },
    { id: "PMS-018", name: "Engine Detailing", price: "₱1,500.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Degrease engine bay, steam clean, and apply protective dressing.", status: "Active" },
    { id: "PMS-019", name: "Fluid Flushing", price: "₱750.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Flush power steering or brake hydraulic fluid system.", status: "Active" },
    { id: "PMS-020", name: "Full ECU Scanning", price: "₱800.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Plug OBD2 scanner, perform full module scan, and log fault codes.", status: "Active" },
    { id: "PMS-021", name: "Diagnose", price: "₱650.00", category: "🛠️ PREVENTIVE MAINTENANCE SERVICE", description: "Systematic engine noise or driveability symptom troubleshooting.", status: "Active" },

    // Category 2: ❄️ AIRCON SERVICES
    { id: "AC-001", name: "Aircon Cleaning", price: "₱2,800.00", category: "❄️ AIRCON SERVICES", description: "Full dashboard pull-out evaporator coil cleaning & chemical treatment.", status: "Active" },
    { id: "AC-002", name: "Replace Compressor", price: "₱3,500.00", category: "❄️ AIRCON SERVICES", description: "Remove faulty AC compressor assembly, install replacement, and vacuum system.", status: "Active" },
    { id: "AC-003", name: "Replace Evaporator", price: "₱2,200.00", category: "❄️ AIRCON SERVICES", description: "Replace leaking evaporator cooling coil inside dashboard.", status: "Active" },

    // Category 3: ⚙️ MAJOR WORK
    { id: "MJ-001", name: "EGR and Intake Manifold Cleaning", price: "₱3,500.00", category: "⚙️ MAJOR WORK", description: "Decarbonize EGR valve, cooler passages, and intake manifold ports.", status: "Active" },
    { id: "MJ-004", name: "Replace Timing Belt", price: "₱4,200.00", category: "⚙️ MAJOR WORK", description: "Replace rubber timing belt and calibrate engine camshaft timing.", status: "Active" },

    // Category 4: 🚗 UNDER CHASSIS
    { id: "UC-003", name: "Replace Shock Absorber", price: "₱2,800.00", category: "🚗 UNDER CHASSIS", description: "Replace front strut / rear shock absorbers and compress coil springs.", status: "Active" },
    { id: "UC-007", name: "Replace Rack and Pinion", price: "₱3,200.00", category: "🚗 UNDER CHASSIS", description: "Replace leaking hydraulic or electric steering rack & pinion assembly.", status: "Active" },

    // Category 5: 🌡️ COOLING SYSTEM RESTORATION
    { id: "CS-001", name: "Radiator Cleaning", price: "₱1,800.00", category: "🌡️ COOLING SYSTEM RESTORATION", description: "Dismantle radiator tanks, chemical flush fins, and leak pressure test.", status: "Active" },
    { id: "CS-002", name: "Coolant Flushing", price: "₱850.00", category: "🌡️ COOLING SYSTEM RESTORATION", description: "Flush old engine coolant and refill high-performance glycol coolant.", status: "Active" }
  ]);

  // Master PMS Package Bundles
  const [packages, setPackages] = useState<PackageBundle[]>([
    {
      id: "PKG-LVL1",
      packageName: "Level 1: Basic PMS Package",
      targetInterval: "Every 10,000 KM or 6 Months",
      description: "Essential routine maintenance including 3-Stage inspection, Change Oil & Filter, Air & Cabin filters, Sparkplug, and Full ECU Scanning.",
      servicesIncluded: [
        "Change Oil",
        "Replace Oil Filter",
        "Replace Air Filter",
        "Replace Cabin Filter",
        "Replace Sparkplug",
        "Full ECU Scanning",
        "Inspect/Replace Brake pads and disk"
      ],
      standaloneSum: "₱4,800.00",
      packagePrice: "₱3,850.00",
      popularBadge: true
    },
    {
      id: "PKG-LVL2",
      packageName: "Level 2: Full PMS Package (Diesel/Gasoline)",
      targetInterval: "Every 50,000 KM or 5 Years",
      description: "Complete maintenance including Level 1 Basic PMS + EGR & Intake Manifold Cleaning, Replace Fuel Filter, Throttle Body & Radiator Cleaning.",
      servicesIncluded: [
        "Everything included in Level 1 Basic PMS",
        "Replace Fuel Filter",
        "EGR and Intake Manifold Cleaning",
        "Aircon Cleaning",
        "Inspect and Clean brake lining and drum"
      ],
      standaloneSum: "₱9,400.00",
      packagePrice: "₱7,500.00"
    },
    {
      id: "PKG-LVL3",
      packageName: "Level 3: Heavy PMS Package (Engine Refresh)",
      targetInterval: "Every 80,000 KM and Up",
      description: "Major engine refresh including Level 2 Full PMS + Replace Timing Belt, Tensioner Bearing, Valve Clearance Setting, Shock Absorber & Rack and Pinion.",
      servicesIncluded: [
        "Everything included in Level 2 Full PMS",
        "Replace Timing Belt",
        "Replace Tensioner Bearing",
        "Replace Shock Absorber",
        "Replace Rack and Pinion"
      ],
      standaloneSum: "₱17,600.00",
      packagePrice: "₱14,200.00"
    }
  ]);

  // Combined Selectable Items for Package Picker Sub-Modal
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

  // New Labor Form State
  const [newLaborName, setNewLaborName] = useState("");
  const [newLaborPrice, setNewLaborPrice] = useState("");
  const [newLaborCategory, setNewLaborCategory] = useState("🛠️ PREVENTIVE MAINTENANCE SERVICE");
  const [customNewCategoryInput, setCustomNewCategoryInput] = useState("");
  const [isCustomNewCategory, setIsCustomNewCategory] = useState(false);
  const [newLaborDescription, setNewLaborDescription] = useState("");

  // 📹 YOUTUBE STUDIO EXACT PACKAGE CREATION & DETAILS STATE
  const [pkgTitle, setPkgTitle] = useState("");
  const [pkgDescription, setPkgDescription] = useState("");
  const [pkgInterval, setPkgInterval] = useState("");
  const [pkgFlatPrice, setPkgFlatPrice] = useState("");
  const [selectedLaborIdsForPkg, setSelectedLaborIdsForPkg] = useState<string[]>(["PMS-001", "PMS-002"]);
  const [pkgSearchLaborQuery, setPkgSearchLaborQuery] = useState("");
  const [pkgSubModalCategoryFilter, setPkgSubModalCategoryFilter] = useState("ALL");

  // Format options for CustomSelect (Header Category Filter)
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

  // Format options for CustomSelect (Sub-Modal Category Filter)
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

  // 🔄 SMART CASCADING CATEGORY RENAME HANDLER
  const handleSaveCategoryRename = (oldName: string) => {
    const trimmed = renamingInput.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingCategoryName(null);
      return;
    }

    // 1. Update Master Categories Array
    setCategoriesList(categoriesList.map((cat) => (cat === oldName ? trimmed : cat)));

    // 2. Cascade update to all assigned labor items
    const updatedCount = laborItems.filter((item) => item.category === oldName).length;
    setLaborItems(
      laborItems.map((item) => (item.category === oldName ? { ...item, category: trimmed } : item))
    );

    // 3. Update Category Filter if active
    if (categoryFilter === oldName) {
      setCategoryFilter(trimmed);
    }
    if (pkgSubModalCategoryFilter === oldName) {
      setPkgSubModalCategoryFilter(trimmed);
    }

    triggerToast(`Renamed category to "${trimmed}" (${updatedCount} labor items updated)`);
    setEditingCategoryName(null);
    setRenamingInput("");
  };

  // 🗑️ DELETE CATEGORY HANDLER
  const handleDeleteCategory = (catName: string) => {
    const assignedCount = laborItems.filter((item) => item.category === catName).length;
    if (assignedCount > 0) {
      alert(`Cannot delete category "${catName}" because ${assignedCount} labor items are assigned to it. Please reassign those items first.`);
      return;
    }

    setCategoriesList(categoriesList.filter((cat) => cat !== catName));
    if (categoryFilter === catName) setCategoryFilter("ALL");
    triggerToast(`Deleted category "${catName}"`);
  };

  // ➕ ADD NEW CATEGORY FROM MODAL HANDLER
  const handleAddNewCategoryFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryModalInput.trim();
    if (!trimmed) return;

    if (categoriesList.includes(trimmed)) {
      alert(`Category "${trimmed}" already exists.`);
      return;
    }

    setCategoriesList([...categoriesList, trimmed]);
    triggerToast(`Added new category: "${trimmed}"`);
    setNewCategoryModalInput("");
  };

  // Sync edit state when package detail card is clicked
  const openPackageDetailsModal = (pkg: PackageBundle) => {
    setSelectedPackageDetail(pkg);
    setPkgTitle(pkg.packageName);
    setPkgDescription(pkg.description);
    setPkgInterval(pkg.targetInterval);
    setPkgFlatPrice(pkg.packagePrice.replace(/[^\d.]/g, ""));
    
    const matchedIds: string[] = [];
    pkg.servicesIncluded.forEach((svcName) => {
      const match = selectableItemsForPackagePicker.find((item) => item.name === svcName);
      if (match) {
        matchedIds.push(match.id);
      }
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

  // Fetch Labor and Bundles from Backend API on Mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const labor = await apiService.getLabor();
        if (labor && labor.length > 0) {
          setLaborItems(labor);
          const uniqueCats = Array.from(new Set(labor.map((l: any) => l.category))) as string[];
          setCategoriesList(uniqueCats);
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

  // Sync edit state when labor detail modal opens
  useEffect(() => {
    if (selectedLaborDetail) {
      setEditName(selectedLaborDetail.name);
      setEditPrice(selectedLaborDetail.price.replace(/[^\d.]/g, ""));
      setEditCategory(selectedLaborDetail.category);
      setEditDescription(selectedLaborDetail.description);
      setIsCustomEditCategory(false);
      setCustomEditCategoryInput("");
    }
  }, [selectedLaborDetail]);

  const isFormDirty =
    selectedLaborDetail &&
    (editName !== selectedLaborDetail.name ||
      editPrice !== selectedLaborDetail.price.replace(/[^\d.]/g, "") ||
      (isCustomEditCategory ? customEditCategoryInput.trim() !== "" : editCategory !== selectedLaborDetail.category) ||
      editDescription !== selectedLaborDetail.description);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auto-calculate cumulative standalone sum for selected checklist items
  const calculatedStandaloneSum = useMemo(() => {
    return selectedLaborIdsForPkg.reduce((sum, id) => {
      const item = selectableItemsForPackagePicker.find((l) => l.id === id);
      if (!item) return sum;
      const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, "")) || 0;
      return sum + numericPrice;
    }, 0);
  }, [selectedLaborIdsForPkg, selectableItemsForPackagePicker]);

  // Save Labor Inline Edits Handler
  const handleSaveChanges = () => {
    if (!selectedLaborDetail || !editName.trim() || !editPrice.trim()) return;

    const finalCat = isCustomEditCategory ? customEditCategoryInput.trim() : editCategory;
    if (!finalCat) return;

    if (!categoriesList.includes(finalCat)) {
      setCategoriesList([...categoriesList, finalCat]);
    }

    const updatedItem: LaborItem = {
      ...selectedLaborDetail,
      name: editName,
      price: `₱${Number(editPrice).toLocaleString()}.00`,
      category: finalCat,
      description: editDescription
    };

    setLaborItems(laborItems.map((item) => (item.id === selectedLaborDetail.id ? updatedItem : item)));
    triggerToast(`Saved changes for ${editName}`);
    setSelectedLaborDetail(null);
  };

  // Add Labor Handler
  const handleAddLabor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLaborName.trim() || !newLaborPrice.trim()) return;

    const finalCat = isCustomNewCategory ? customNewCategoryInput.trim() : newLaborCategory;
    if (!finalCat) return;

    if (!categoriesList.includes(finalCat)) {
      setCategoriesList([...categoriesList, finalCat]);
    }

    try {
      const result = await apiService.createLabor({
        name: newLaborName,
        price: `₱${Number(newLaborPrice).toLocaleString()}.00`,
        category: finalCat,
        description: newLaborDescription || "Standard shop labor service."
      });
      setLaborItems([result, ...laborItems]);
      triggerToast(`Added new labor service: ${newLaborName}`);
    } catch (err) {
      console.error("Failed to create labor via API", err);
    }

    setIsAddLaborModalOpen(false);
    setNewLaborName("");
    setNewLaborPrice("");
    setNewLaborDescription("");
    setIsCustomNewCategory(false);
    setCustomNewCategoryInput("");
  };

  // Create or Update Package Handler
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgTitle.trim()) return;

    const includedNames = selectedLaborIdsForPkg
      .map((id) => selectableItemsForPackagePicker.find((l) => l.id === id)?.name)
      .filter((n): n is string => Boolean(n));

    const finalPrice = pkgFlatPrice ? `₱${Number(pkgFlatPrice).toLocaleString()}.00` : `₱${calculatedStandaloneSum.toLocaleString()}.00`;

    if (selectedPackageDetail) {
      const updatedPkg: PackageBundle = {
        ...selectedPackageDetail,
        packageName: pkgTitle,
        targetInterval: pkgInterval || selectedPackageDetail.targetInterval,
        description: pkgDescription || selectedPackageDetail.description,
        servicesIncluded: includedNames,
        standaloneSum: `₱${calculatedStandaloneSum.toLocaleString()}.00`,
        packagePrice: finalPrice
      };
      setPackages(packages.map((p) => (p.id === selectedPackageDetail.id ? updatedPkg : p)));
      triggerToast(`Saved changes for package: ${pkgTitle}`);
    } else {
      try {
        const result = await apiService.createBundle({
          packageName: pkgTitle,
          targetInterval: pkgInterval || "Custom Service Interval",
          description: pkgDescription || `Custom package bundling ${includedNames.length} services.`,
          standaloneSum: `₱${calculatedStandaloneSum.toLocaleString()}.00`,
          packagePrice: finalPrice,
          laborIds: selectedLaborIdsForPkg
        });
        setPackages([result, ...packages]);
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

  const handleDeleteLabor = (id: string, name: string) => {
    setLaborItems(laborItems.filter((item) => item.id !== id));
    setSelectedLaborDetail(null);
    triggerToast(`Removed labor service: ${name}`);
  };

  const handleDeletePackage = (id: string, name: string) => {
    setPackages(packages.filter((pkg) => pkg.id !== id));
    setIsAddPackageModalOpen(false);
    setSelectedPackageDetail(null);
    triggerToast(`Removed package service: ${name}`);
  };

  const toggleLaborSelectionForPkg = (id: string) => {
    if (selectedLaborIdsForPkg.includes(id)) {
      setSelectedLaborIdsForPkg(selectedLaborIdsForPkg.filter((i) => i !== id));
    } else {
      setSelectedLaborIdsForPkg([...selectedLaborIdsForPkg, id]);
    }
  };

  const devContext = useDevRole();
  const { mockDataState, setMockDataState } = devContext;

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
        
        {/* 1. TOP TITLE HEADER SECTION */}
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
                Service Catalog & Master PMS Package Builder
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage shop labor rates, inspection services, and master PMS package bundles for Rey Auto Repair Shop
              </p>
            </div>

            <div>
              {activeTab === "LABOR" ? (
                <button
                  onClick={() => setIsAddLaborModalOpen(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Labor</span>
                </button>
              ) : (
                <button
                  onClick={openCreatePackageModal}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Package</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Toast Notification Alert */}
        {toastMessage && (
          <div className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 2. FIXED STICKY AREA: TAB BAR + FILTERS */}
        <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md pt-2 pb-0 border-b border-slate-200/90 shadow-2xs -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all">
          
          {/* Row A: Tabs & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            
            {/* Tab Selection */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("LABOR")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "PACKAGES"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Package Service ({packages.length})</span>
              </button>
            </div>

            {/* Search & Category Filter with Manage Categories Option */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search labor or packages..."
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 transition-all w-44 sm:w-60 shadow-2xs"
                />
              </div>

              {/* ✨ MODERN CUSTOM DROPDOWN SELECT FOR CATEGORY FILTER (WITH MANAGE CATEGORIES FOOTER) */}
              {activeTab === "LABOR" && (
                <CustomSelect
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={stickyHeaderCategoryOptions}
                  onManageClick={() => setIsManageCategoriesModalOpen(true)}
                  manageLabel="⚙️ Manage Categories"
                  className="w-56"
                />
              )}

              {/* Show Action Button in Sticky Bar when Top Title Header Hides */}
              <AnimatePresence>
                {!isHeaderVisible && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => (activeTab === "LABOR" ? setIsAddLaborModalOpen(true) : openCreatePackageModal())}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
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

          {/* Row B: TABLE COLUMN HEADERS FOR LABOR */}
          {activeTab === "LABOR" && (
            <div className="bg-slate-100/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 grid grid-cols-12 py-3 px-5 items-center mt-2 rounded-t-xl">
              <div className="col-span-4 sm:col-span-3">Labor Name</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-3 sm:col-span-3">Category</div>
              <div className="col-span-3 sm:col-span-4">Description</div>
            </div>
          )}

        </div>

        {/* 3. SCROLLABLE DATA ROWS AREA */}
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
                  <div
                    key={item.id}
                    onClick={() => setSelectedLaborDetail(item)}
                    className="grid grid-cols-12 py-3.5 px-5 items-center hover:bg-emerald-50/60 cursor-pointer transition-colors group"
                  >
                    
                    {/* Labor Name */}
                    <div className="col-span-4 sm:col-span-3 pr-2 font-medium text-slate-900">
                      {item.name}
                    </div>

                    {/* Price */}
                    <div className="col-span-2 text-slate-700 font-medium">
                      {item.price}
                    </div>

                    {/* Category */}
                    <div className="col-span-3 sm:col-span-3 pr-2 text-slate-500 font-normal truncate">
                      {item.category.replace(/^[\p{Extended_Pictographic}\s]+/u, '')}
                    </div>

                    {/* Description */}
                    <div className="col-span-3 sm:col-span-4 text-slate-600 pr-2">
                      <p className="text-xs leading-relaxed font-normal line-clamp-2">{item.description}</p>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION 2: MASTER PMS LEVEL PACKAGES GRID */}
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
                <div
                  key={pkg.id}
                  onClick={() => openPackageDetailsModal(pkg)}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 flex flex-col justify-between relative overflow-hidden hover:border-emerald-500/80 hover:shadow-md cursor-pointer transition-all group"
                >
                  
                  {pkg.popularBadge && (
                    <div className="absolute top-0 right-0 bg-emerald-700 text-white text-[10px] font-extrabold px-3.5 py-1 rounded-bl-xl tracking-wider uppercase flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Most Popular</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{pkg.id}</span>
                      <span className="text-[10px] text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        <span>Click to view & edit</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                    
                    <h3 className="font-extrabold text-slate-950 text-lg leading-snug group-hover:text-emerald-800 transition-colors">
                      {pkg.packageName}
                    </h3>
                    
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{pkg.targetInterval}</span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-medium pt-1">{pkg.description}</p>
                  </div>

                  {/* Services Included Rendered in EXACT Saved Arrangement! */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Services Included ({pkg.servicesIncluded.length}):</div>
                    <div className="space-y-1.5">
                      {pkg.servicesIncluded.map((svcName, idx) => (
                        <div key={idx} className="text-xs text-slate-800 font-semibold flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{svcName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 line-through">Standalone Sum: {pkg.standaloneSum}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Discounted Package Rate:</div>
                      </div>
                      <div className="text-2xl font-extrabold text-emerald-800">{pkg.packagePrice}</div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerToast(`Package ${pkg.packageName} assigned to Front Desk!`);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2"
                    >
                      <span>Assign PMS Level Package</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      </div>

      {/* ⚙️ MANAGE & RENAME CATEGORIES CENTRAL MODAL */}
      <AnimatePresence>
        {isManageCategoriesModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100 text-slate-900 max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <Settings className="w-5 h-5 text-emerald-700" />
                  <span>Manage Categories</span>
                </div>
                <button
                  onClick={() => {
                    setIsManageCategoriesModalOpen(false);
                    setEditingCategoryName(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add New Category Form inside Modal */}
              <form onSubmit={handleAddNewCategoryFromModal} className="flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={newCategoryModalInput}
                  onChange={(e) => setNewCategoryModalInput(e.target.value)}
                  placeholder="➕ Type new category name..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600"
                />
                <button
                  type="submit"
                  disabled={!newCategoryModalInput.trim()}
                  className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shrink-0"
                >
                  Add
                </button>
              </form>

              {/* Categories List with Inline Rename */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Active Categories ({categoriesList.length}):
                </div>

                {categoriesList.map((cat) => {
                  const assignedCount = laborItems.filter((i) => i.category === cat).length;
                  const isEditing = editingCategoryName === cat;

                  return (
                    <div
                      key={cat}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs shadow-2xs"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={renamingInput}
                            onChange={(e) => setRenamingInput(e.target.value)}
                            className="flex-1 bg-white border border-emerald-600 rounded-xl py-1.5 px-2.5 text-xs font-bold text-slate-950 outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveCategoryRename(cat)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white p-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                            title="Save Rename"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingCategoryName(null)}
                            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg shrink-0"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-slate-900 text-xs truncate">{cat}</span>
                            <span className="bg-emerald-100 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                              {assignedCount} items
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingCategoryName(cat);
                                setRenamingInput(cat);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-[11px] rounded-lg border border-slate-200 transition-all flex items-center gap-1"
                              title="Rename category"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Rename</span>
                            </button>

                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Delete category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsManageCategoriesModalOpen(false);
                    setEditingCategoryName(null);
                  }}
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-full transition-all shadow-xs"
                >
                  Done
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔴 YOUTUBE STUDIO EXACT 2-STEP MODAL */}
      <AnimatePresence>
        {isAddPackageModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-100 text-slate-900"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-950">
                  {selectedPackageDetail ? "Package details" : "Create new bundle"}
                </h2>
                <button
                  onClick={() => {
                    setIsAddPackageModalOpen(false);
                    setSelectedPackageDetail(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePackage} className="space-y-4">
                
                {/* Title (required) */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">
                    Title (required)
                  </label>
                  <input
                    type="text"
                    required
                    value={pkgTitle}
                    onChange={(e) => setPkgTitle(e.target.value)}
                    placeholder="Add title"
                    className="w-full bg-white border border-slate-300 focus:border-slate-900 rounded-xl p-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 font-bold"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={pkgDescription}
                    onChange={(e) => setPkgDescription(e.target.value)}
                    placeholder="Add description"
                    className="w-full bg-white border border-slate-300 focus:border-slate-900 rounded-xl p-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Target Interval & Flat Package Rate */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Service Interval
                    </label>
                    <input
                      type="text"
                      value={pkgInterval}
                      onChange={(e) => setPkgInterval(e.target.value)}
                      placeholder="e.g. Every 10,000 KM"
                      className="w-full bg-white border border-slate-300 focus:border-slate-900 rounded-xl p-2.5 text-xs text-slate-900 outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Package Rate (₱)
                    </label>
                    <input
                      type="number"
                      value={pkgFlatPrice}
                      onChange={(e) => setPkgFlatPrice(e.target.value)}
                      placeholder={`Default: ₱${calculatedStandaloneSum}`}
                      className="w-full bg-white border border-slate-300 focus:border-slate-900 rounded-xl p-2.5 text-xs font-extrabold text-emerald-800 outline-none"
                    />
                  </div>
                </div>

                {/* Labors Pill Button */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-slate-600">
                    Labors & Base Packages ({selectedLaborIdsForPkg.length} selected — Standalone: ₱{calculatedStandaloneSum.toLocaleString()}.00)
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddLaborsSubModalOpen(true)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-full transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add labors & packages</span>
                    </button>

                    {selectedLaborIdsForPkg.map((id) => {
                      const item = selectableItemsForPackagePicker.find((l) => l.id === id);
                      if (!item) return null;
                      return (
                        <span
                          key={id}
                          className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 max-w-[220px] truncate ${
                            item.isPackageItem
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleLaborSelectionForPkg(id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded-full"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  {selectedPackageDetail ? (
                    <button
                      type="button"
                      onClick={() => handleDeletePackage(selectedPackageDetail.id, selectedPackageDetail.packageName)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-full border border-rose-200 transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddPackageModalOpen(false);
                        setSelectedPackageDetail(null);
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!pkgTitle.trim()}
                      className={`px-6 py-2.5 font-bold text-xs rounded-full transition-all shadow-xs ${
                        pkgTitle.trim()
                          ? "bg-slate-950 hover:bg-slate-800 text-white cursor-pointer"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {selectedPackageDetail ? "Save changes" : "Create"}
                    </button>
                  </div>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔴 STEP 2: YOUTUBE STUDIO SUB-MODAL WITH MODERN CUSTOM SELECT DROPDOWN */}
      <AnimatePresence>
        {isAddLaborsSubModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 text-slate-900 max-h-[85vh] flex flex-col"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div>
                  <h2 className="text-base font-bold text-slate-950">Add labors & base packages</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Drag items in the right pane to smoothly reorder sequence</p>
                </div>
                <button
                  onClick={() => setIsAddLaborsSubModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 2-Pane Body Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
                
                {/* Left Pane: Search + Category Filter Dropdown + Item List (7 Cols) */}
                <div className="md:col-span-7 flex flex-col min-h-0 border-r border-slate-100 pr-3">
                  
                  {/* Search Bar & Category Filter Controls */}
                  <div className="space-y-2 mb-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={pkgSearchLaborQuery}
                        onChange={(e) => setPkgSearchLaborQuery(e.target.value)}
                        placeholder="Search labors or existing packages..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-slate-900"
                      />
                    </div>

                    {/* ✨ MODERN CUSTOM DROPDOWN SELECT FOR SUB-MODAL CATEGORY FILTER */}
                    <div className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <CustomSelect
                        value={pkgSubModalCategoryFilter}
                        onChange={setPkgSubModalCategoryFilter}
                        options={subModalCategoryOptions}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Labor & Package Items Checklist */}
                  <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                    {selectableItemsForPackagePicker
                      .filter((l) => {
                        const matchesQuery = l.name.toLowerCase().includes(pkgSearchLaborQuery.toLowerCase()) || l.category.toLowerCase().includes(pkgSearchLaborQuery.toLowerCase());
                        const matchesCat = pkgSubModalCategoryFilter === "ALL" || l.category === pkgSubModalCategoryFilter;
                        return matchesQuery && matchesCat;
                      })
                      .map((item) => {
                        const isChecked = selectedLaborIdsForPkg.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleLaborSelectionForPkg(item.id)}
                            className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                              isChecked
                                ? item.isPackageItem
                                  ? "bg-emerald-50 border border-emerald-300"
                                  : "bg-slate-100/90"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              {isChecked ? (
                                <CheckSquare className={`w-4 h-4 shrink-0 ${item.isPackageItem ? "text-emerald-700" : "text-slate-900"}`} />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 shrink-0" />
                              )}
                              <div className="truncate">
                                <div className={`font-bold text-xs truncate ${item.isPackageItem ? "text-emerald-950" : "text-slate-900"}`}>
                                  {item.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium truncate">{item.category}</div>
                              </div>
                            </div>

                            <span className="font-extrabold text-xs text-emerald-800 shrink-0">{item.price}</span>
                          </div>
                        );
                      })}
                  </div>

                </div>

                {/* Right Pane: FLUID FRAMER-MOTION REORDER.GROUP "Items to add" Column (5 Cols) */}
                <div className="md:col-span-5 flex flex-col min-h-0 pl-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Items to add ({selectedLaborIdsForPkg.length})</span>
                    <span className="text-xs font-extrabold text-emerald-800">₱{calculatedStandaloneSum.toLocaleString()}.00</span>
                  </div>

                  {selectedLaborIdsForPkg.length === 0 ? (
                    <div className="flex-1 overflow-y-auto p-4 text-center text-xs text-slate-400 bg-slate-50/60 rounded-2xl border border-slate-200/60">
                      No items selected yet. Select labors or packages from the left.
                    </div>
                  ) : (
                    <Reorder.Group
                      axis="y"
                      values={selectedLaborIdsForPkg}
                      onReorder={setSelectedLaborIdsForPkg}
                      className="flex-1 overflow-y-auto space-y-1.5 pr-1 bg-slate-50/60 p-2.5 rounded-2xl border border-slate-200/60"
                    >
                      {selectedLaborIdsForPkg.map((id) => {
                        const item = selectableItemsForPackagePicker.find((l) => l.id === id);
                        if (!item) return null;
                        return (
                          <Reorder.Item
                            key={id}
                            value={id}
                            whileDrag={{ scale: 1.03, boxShadow: "0px 10px 25px rgba(0,0,0,0.15)", zIndex: 50 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className={`p-2.5 rounded-xl border shadow-2xs flex items-center justify-between text-xs cursor-grab active:cursor-grabbing select-none ${
                              item.isPackageItem
                                ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                                : "bg-white border-slate-200/80 text-slate-900 font-semibold"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-1">
                              <span title="Drag to reorder" className="cursor-grab">
                                <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              </span>
                              <span className="truncate">{item.name}</span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLaborSelectionForPkg(id);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-0.5"
                                title="Remove item"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </Reorder.Item>
                        );
                      })}
                    </Reorder.Group>
                  )}
                </div>

              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddLaborsSubModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddLaborsSubModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-full transition-all shadow-xs"
                >
                  Done
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔍 LABOR DIRECT INLINE EDITING DETAILS MODAL */}
      <AnimatePresence>
        {selectedLaborDetail && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                  <Wrench className="w-5 h-5 text-emerald-700" />
                  <span>Labor Service Details</span>
                </div>
                <button
                  onClick={() => setSelectedLaborDetail(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">ID: {selectedLaborDetail.id}</span>
                  {isFormDirty && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                      Unsaved Changes
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Labor Name:
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full font-bold text-slate-950 text-base bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Price (₱):
                    </label>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full font-extrabold text-emerald-800 text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Category:
                    </label>
                    {!isCustomEditCategory ? (
                      <CustomSelect
                        value={editCategory}
                        onChange={(val) => {
                          if (val === "CUSTOM") {
                            setIsCustomEditCategory(true);
                          } else {
                            setEditCategory(val);
                          }
                        }}
                        options={[
                          ...categoriesList.map((cat) => ({ value: cat, label: cat })),
                          { value: "CUSTOM", label: "➕ Add Custom Category..." }
                        ]}
                        className="w-full"
                      />
                    ) : (
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={customEditCategoryInput}
                          onChange={(e) => setCustomEditCategoryInput(e.target.value)}
                          placeholder="Type custom category..."
                          className="w-full font-semibold text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-8 outline-none focus:border-emerald-600"
                        />
                        <button
                          type="button"
                          onClick={() => setIsCustomEditCategory(false)}
                          className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Service Description:
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full text-xs text-slate-700 leading-relaxed font-normal bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  onClick={() => handleDeleteLabor(selectedLaborDetail.id, selectedLaborDetail.name)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Labor</span>
                </button>

                <div className="flex items-center gap-2">
                  {isFormDirty && (
                    <button
                      onClick={handleSaveChanges}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedLaborDetail(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD NEW LABOR MODAL */}
      <AnimatePresence>
        {isAddLaborModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                  <Wrench className="w-5 h-5 text-emerald-700" />
                  <span>Add New Labor Service</span>
                </div>
                <button
                  onClick={() => setIsAddLaborModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddLabor} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Labor Name</label>
                  <input
                    type="text"
                    required
                    value={newLaborName}
                    onChange={(e) => setNewLaborName(e.target.value)}
                    placeholder="e.g. Change Oil"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₱)</label>
                    <input
                      type="number"
                      required
                      value={newLaborPrice}
                      onChange={(e) => setNewLaborPrice(e.target.value)}
                      placeholder="650"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                    {!isCustomNewCategory ? (
                      <CustomSelect
                        value={newLaborCategory}
                        onChange={(val) => {
                          if (val === "CUSTOM") {
                            setIsCustomNewCategory(true);
                          } else {
                            setNewLaborCategory(val);
                          }
                        }}
                        options={[
                          ...categoriesList.map((cat) => ({ value: cat, label: cat })),
                          { value: "CUSTOM", label: "➕ Add Custom Category..." }
                        ]}
                        className="w-full"
                      />
                    ) : (
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          required
                          value={customNewCategoryInput}
                          onChange={(e) => setCustomNewCategoryInput(e.target.value)}
                          placeholder="Type custom category..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-8 text-xs text-slate-900 outline-none focus:border-emerald-600"
                        />
                        <button
                          type="button"
                          onClick={() => setIsCustomNewCategory(false)}
                          className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newLaborDescription}
                    onChange={(e) => setNewLaborDescription(e.target.value)}
                    placeholder="Detailed description of labor work..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddLaborModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save Labor</span>
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
