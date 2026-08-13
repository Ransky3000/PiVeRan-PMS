import React from "react";

interface LogoHeaderProps {
  subtitle?: string;
}

export const LogoHeader: React.FC<LogoHeaderProps> = ({ subtitle }) => {
  return (
    <div className="w-full mb-6">
      {/* Branding Logo Containers Bar (Placeholders per specification) */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Rey Auto Repair Shop Logo Box */}
        <div className="bg-white border border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-3 flex items-center justify-center gap-2.5 shadow-sm transition-all">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
            R
          </div>
          <div className="text-left">
            <div className="font-semibold text-slate-800 text-xs tracking-tight">
              Rey Auto Repair Shop
            </div>
            <div className="text-[10px] text-slate-500 font-normal">
              Partnered Workshop
            </div>
          </div>
        </div>

        {/* PiVeRan PMS Logo Box */}
        <div className="bg-white border border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-3 flex items-center justify-center gap-2.5 shadow-sm transition-all">
          <div className="w-7 h-7 rounded-md bg-orange-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
            P
          </div>
          <div className="text-left">
            <div className="font-semibold text-slate-800 text-xs tracking-tight">
              PiVeRan PMS
            </div>
            <div className="text-[10px] text-slate-500 font-normal">
              Cloud Management
            </div>
          </div>
        </div>
      </div>

      {subtitle && (
        <p className="text-xs text-center text-slate-500 font-medium">{subtitle}</p>
      )}
    </div>
  );
};
