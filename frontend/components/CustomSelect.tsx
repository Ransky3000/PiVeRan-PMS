"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface SelectOption {
  value: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string | string[];
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  icon?: React.ReactNode;
  align?: "left" | "right";
  dropUp?: boolean; // When true, popover opens UPWARDS above input (matching screenshot 2)
  onManageClick?: () => void;
  manageLabel?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
  isMultiSelect?: boolean;
  searchable?: boolean;
  showSelectAll?: boolean;
  hideSelectedPills?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select option",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  icon,
  align = "left",
  dropUp = false,
  onManageClick,
  manageLabel = "Manage Options",
  onAddNew,
  addNewLabel = "New Item",
  isMultiSelect = false,
  searchable = true,
  showSelectAll = false,
  hideSelectedPills = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedValues = isMultiSelect ? (Array.isArray(value) ? value : []) : [];
  const singleValue = isMultiSelect ? "" : (typeof value === "string" ? value : "");
  const selectedSingleOption = options.find((opt) => opt.value === singleValue);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAllSelected = isMultiSelect && options.length > 0 && selectedValues.length === options.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  const toggleMultiSelectValue = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  return (
    <div ref={containerRef} className={`relative text-left ${className}`}>
      {/* Dropdown Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white hover:border-slate-300 text-slate-700 font-normal text-xs py-2 px-3 rounded-xl border border-slate-200 shadow-2xs transition-all flex flex-wrap items-center justify-between gap-1.5 cursor-pointer outline-none ${
          isOpen ? "border-emerald-600 ring-2 ring-emerald-500/10 bg-white" : ""
        } ${buttonClassName}`}
      >
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
          {icon && <span className="text-slate-500 shrink-0">{icon}</span>}

          {isMultiSelect ? (
            selectedValues.length > 0 && !hideSelectedPills ? (
              <div className="flex flex-wrap gap-1 items-center">
                {selectedValues.map((val) => {
                  const opt = options.find((o) => o.value === val);
                  return (
                    <span
                      key={val}
                      className="bg-slate-100 text-slate-800 font-medium text-xs px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1 shrink-0"
                    >
                      <span>{opt ? opt.label : val}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMultiSelectValue(val);
                        }}
                        className="text-slate-400 hover:text-slate-700 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className={selectedValues.length > 0 ? "text-slate-700 font-medium" : "text-slate-400 font-normal"}>
                {selectedValues.length > 0 ? `${placeholder} (${selectedValues.length} selected)` : placeholder}
              </span>
            )
          ) : (
            <span className="truncate font-medium text-slate-800">
              {selectedSingleOption ? selectedSingleOption.label : placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </div>

      {/* Dropdown Popover Menu (Supports dropUp = true for upward positioning) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropUp ? -4 : 4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropUp ? -4 : 4, scale: 0.99 }}
            transition={{ duration: 0.1 }}
            className={`absolute z-[80] w-full min-w-[220px] bg-white rounded-xl border border-slate-200 shadow-xl py-1 max-h-56 overflow-hidden flex flex-col ${
              dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
            } ${align === "right" ? "right-0" : "left-0"} ${menuClassName}`}
          >
            {/* Search Bar */}
            {searchable && (
              <div className="p-2 border-b border-slate-100 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600 font-normal"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Top "+ New" Button Header */}
            {onAddNew && (
              <div className="p-1 border-b border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onAddNew();
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-emerald-700 hover:bg-emerald-50 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{addNewLabel}</span>
                </button>
              </div>
            )}

            {/* Multi-Select Header: "Select all" Checkbox (Optional) */}
            {isMultiSelect && showSelectAll && (
              <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-700 flex items-center justify-between shrink-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="accent-emerald-600 w-3.5 h-3.5 rounded border-slate-300"
                  />
                  <span className="font-bold text-emerald-900">Select all</span>
                </label>
                {selectedValues.length > 0 && (
                  <span className="text-[11px] text-slate-500">{selectedValues.length} selected</span>
                )}
              </div>
            )}

            {/* Options List */}
            <div className="flex-1 overflow-y-auto space-y-0.5 p-1">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">No items found</div>
              ) : (
                filteredOptions.map((option) => {
                  if (isMultiSelect) {
                    const isChecked = selectedValues.includes(option.value);
                    return (
                      <div
                        key={option.value}
                        onClick={() => toggleMultiSelectValue(option.value)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-normal flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-emerald-100/70 text-emerald-950 font-medium"
                            : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-950"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="accent-emerald-600 w-3.5 h-3.5 rounded border-slate-300"
                          />
                          <span className="truncate">{option.label}</span>
                        </div>
                      </div>
                    );
                  } else {
                    const isSelected = option.value === singleValue;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onChange(option.value);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-normal flex items-center justify-between gap-2 transition-colors ${
                          isSelected
                            ? "bg-emerald-700 text-white font-medium shadow-2xs"
                            : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-950"
                        }`}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                      </button>
                    );
                  }
                })
              )}
            </div>

            {/* Manage Footer */}
            {onManageClick && (
              <div className="p-1 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onManageClick();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {manageLabel}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
