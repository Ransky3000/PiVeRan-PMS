import React from "react";
import { LaborItem } from "./bundleHelpers";

interface LaborCardProps {
  item: LaborItem;
  onClick: () => void;
}

export const LaborCard: React.FC<LaborCardProps> = ({ item, onClick }) => {
  return (
    <div
      onClick={onClick}
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
  );
};
