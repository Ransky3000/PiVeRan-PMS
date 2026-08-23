import React from "react";
import { Sparkles, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { PackageBundle } from "./bundleHelpers";

interface BundleCardProps {
  pkg: PackageBundle;
  onClick: () => void;
}

export const BundleCard: React.FC<BundleCardProps> = ({ pkg, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 flex flex-col justify-between relative overflow-hidden hover:border-emerald-500/80 hover:shadow-md cursor-pointer transition-all group"
    >
      {pkg.popularBadge && (
        <div className="absolute top-0 right-0 bg-emerald-700 text-white text-[10px] font-extrabold px-3.5 py-1 rounded-bl-xl tracking-wider uppercase flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Most Popular</span>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-end">
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

      {/* Services Included */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Services Included ({pkg.servicesIncluded.length}):
        </div>
        <div className="space-y-1.5">
          {pkg.servicesIncluded.map((svcName, idx) => (
            <div key={idx} className="text-xs text-slate-800 font-semibold flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{svcName}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 line-through">Standalone Sum: {pkg.standaloneSum}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Discounted Package Rate:</div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-800">{pkg.packagePrice}</div>
        </div>
      </div>
    </div>
  );
};
