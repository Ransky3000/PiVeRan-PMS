"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Flame, Clock, AlertTriangle, CheckCircle, RotateCw, ArrowLeft } from "lucide-react";

export default function PendingApprovalPage() {
  const [status, setStatus] = useState<"PENDING" | "NEEDS_REVISION">("PENDING");
  const [adminComment, setAdminComment] = useState("Please verify your 11-digit mobile phone number.");
  const [fullName, setFullName] = useState("Cedrick Santos");
  const [email, setEmail] = useState("cedrick@reyauto.com");
  const [phone, setPhone] = useState("0917123456");
  const [role, setRole] = useState("Front Desk Operations (Sir Cedrick)");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleResubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("PENDING");
    triggerToast("Application details updated & re-submitted to Admin!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Container Card Layout */}
      <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-xl shadow-slate-200/60 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[540px] border border-slate-100">
        
        {/* LEFT HERO PANEL */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 text-white p-8 flex flex-col justify-between items-center text-center relative overflow-hidden rounded-b-[36px] md:rounded-b-none md:rounded-r-[48px]">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700/30 rounded-full blur-xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-950/50 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

          {/* Logo Badge (Updated to PiVeRan PMS) */}
          <div className="relative z-10 pt-2">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-2 shadow-lg">
              <Flame className="w-9 h-9 text-emerald-700 fill-emerald-700" />
            </div>
            <div className="font-bold text-white text-lg tracking-wide">
              PiVeRan PMS
            </div>
          </div>

          {/* Hero Welcome Text (Updated to Admin) */}
          <div className="relative z-10 my-4 max-w-xs">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
              Application Status
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
              Your staff registration is undergoing verification by Admin.
            </p>
          </div>

          <div className="text-[10px] text-emerald-200/70 tracking-wider uppercase relative z-10 pb-1 font-medium">
            PIVERAN AUTO MANAGEMENT SYSTEMS
          </div>

        </div>

        {/* RIGHT STATUS & REVISION PANEL */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white">
          
          <div>
            
            {/* Status Header Badge */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                CURRENT STATUS
              </span>

              {status === "PENDING" ? (
                <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3.5 py-1.5 rounded-full">
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>PENDING ADMIN REVIEW</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold px-3.5 py-1.5 rounded-full">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>NEEDS REVISION</span>
                </span>
              )}
            </div>

            {/* Toast Feedback */}
            {toastMessage && (
              <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-full text-center font-medium flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{toastMessage}</span>
              </div>
            )}

            {/* Admin Revision Feedback Alert Box */}
            {status === "NEEDS_REVISION" && (
              <div className="mb-6 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Admin Feedback / Revision Request:</span>
                </div>
                <p className="text-xs text-amber-800 font-medium pl-6">
                  &ldquo;{adminComment}&rdquo;
                </p>
              </div>
            )}

            {/* Status Information / Edit Form */}
            {status === "PENDING" ? (
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-xs text-slate-700">
                <div className="font-bold text-slate-900 text-sm mb-2">Application Summary:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-400">Applicant:</span> <strong className="text-slate-800">{fullName}</strong></div>
                  <div><span className="text-slate-400">Requested Role:</span> <strong className="text-slate-800">{role}</strong></div>
                  <div><span className="text-slate-400">Email:</span> <strong className="text-slate-800">{email}</strong></div>
                  <div><span className="text-slate-400">Phone:</span> <strong className="text-slate-800">{phone}</strong></div>
                </div>
                <p className="text-slate-500 pt-2 border-t border-slate-200 text-[11px] leading-relaxed">
                  You will automatically be redirected once Admin approves your application. You can also check back here anytime.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResubmit} className="space-y-3 max-w-sm mx-auto">
                <div className="text-xs font-bold text-slate-800 mb-2">Edit Details to Re-submit:</div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-full py-2.5 px-4 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-full py-2.5 px-4 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div className="pt-2 text-center">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-full shadow-md text-xs tracking-wider uppercase flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>RE-SUBMIT APPLICATION</span>
                  </button>
                </div>
              </form>
            )}

            {/* Interactive State Toggle Demo for Testing */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                ⚡ TOGGLE ADMIN FEEDBACK STATE DEMO
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setStatus("PENDING")}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-all ${status === "PENDING" ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-slate-100 border-slate-200 text-slate-600"}`}
                >
                  🟡 Pending State
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("NEEDS_REVISION")}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-all ${status === "NEEDS_REVISION" ? "bg-rose-100 border-rose-300 text-rose-800" : "bg-slate-100 border-slate-200 text-slate-600"}`}
                >
                  ⚠️ Needs Revision Loop
                </button>
              </div>
            </div>

          </div>

          {/* Footer Back Link */}
          <div className="text-center pt-4 border-t border-slate-100">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-semibold transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Sign In</span>
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
