"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Eye, EyeOff, Check, X, ArrowLeft, ArrowRight, ShieldCheck, Wrench, CheckCircle } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { motion, AnimatePresence } from "framer-motion";

export default function SignUpPage() {
  const router = useRouter();

  // Multi-step Flow State (1 = Credentials, 2 = Profile Setup)
  const [step, setStep] = useState<1 | 2>(1);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("frontdesk");

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dynamic Live Password Validation Rules
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasMinLength && hasNumber && hasSpecialChar;

  // Handle Google OAuth Trigger -> Pre-fill & Skip to Step 2
  const handleGoogleAuth = () => {
    setIsGoogleAuth(true);
    setEmail("google.user@piveran.com");
    setFullName("Alex Mercer (Google Account)");
    setStep(2);
  };

  // Step 1 Validation -> Proceed to Step 2
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.includes("@")) {
      setErrorMsg("Please enter a valid work email address.");
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg("Please satisfy all password security requirements before continuing.");
      return;
    }

    setStep(2);
  };

  // Final Form Submission -> Submit Application & Route to Pending Approval
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !phone.trim()) {
      setErrorMsg("Please fill out your full name and mobile phone number.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push("/pending-approval");
    }, 1200);
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Centered Main Stage (2-Step Registration Flow) */}
      <div className="w-full max-w-sm pt-6 sm:pt-10 my-auto">
        
        {/* Top Centered Brand Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center shadow-md shadow-emerald-700/20">
              <Flame className="w-6 h-6 text-white fill-white" />
            </div>
            <div className="font-extrabold text-emerald-950 text-xl tracking-tight leading-none">
              PiVeRan PMS
            </div>
          </div>
        </div>

        {/* Multi-Step Header Indicator */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-full mb-2">
            <span>{step === 1 ? "Step 1 of 2 — Credentials" : "Step 2 of 2 — Staff Profile Setup"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">
            {step === 1 ? "Create an account" : "Complete your profile"}
          </h1>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="mb-5 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* Animated Step Container */}
        <AnimatePresence mode="wait">
          
          {/* STEP 1: CREDENTIALS (Email & Password) */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-sm mb-4"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign up with Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center mb-6">
                <div className="w-full border-t border-slate-200" />
                <span className="bg-white px-3 text-[11px] text-slate-400 font-semibold uppercase tracking-wider absolute">
                  or work email
                </span>
              </div>

              {/* Step 1 Form */}
              <form onSubmit={handleProceedToStep2} className="space-y-4">
                
                {/* Work Email */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Work Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cedrick@reyauto.com"
                    className="w-full bg-white border border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-xl py-2.5 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  />
                </div>

                {/* Password Input with Interactive Live Requirements Checklist */}
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      placeholder="••••••••••••"
                      className="w-full bg-white border border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-xl py-2.5 pl-3.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Smooth Animated Requirement Checklist */}
                  <AnimatePresence>
                    {(isPasswordFocused || password.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden space-y-1.5 text-xs font-normal"
                      >
                        {/* Requirement 1: Minimum 8 letters */}
                        <div className={`flex items-center gap-2 transition-colors ${hasMinLength ? "text-emerald-600 font-medium" : "text-slate-500"}`}>
                          {hasMinLength ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>Minimum 8 letters</span>
                        </div>

                        {/* Requirement 2: At least one number */}
                        <div className={`flex items-center gap-2 transition-colors ${hasNumber ? "text-emerald-600 font-medium" : "text-slate-500"}`}>
                          {hasNumber ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>At least one number</span>
                        </div>

                        {/* Requirement 3: At least one special character */}
                        <div className={`flex items-center gap-2 transition-colors ${hasSpecialChar ? "text-emerald-600 font-medium" : "text-slate-500"}`}>
                          {hasSpecialChar ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>At least one special character</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Continue to Step 2 Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-emerald-700/20 active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </form>
            </motion.div>
          )}

          {/* STEP 2: PROFILE & SHOP ROLE SETUP */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Account Email Preview Badge */}
              <div className="mb-5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-500 truncate">
                    {isGoogleAuth ? "Google Authenticated:" : "Account Email:"}
                  </span>
                  <strong className="text-slate-900 truncate">{email}</strong>
                </div>
                {!isGoogleAuth && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-emerald-700 font-bold text-[11px] hover:underline shrink-0 ml-2"
                  >
                    Edit
                  </button>
                )}
              </div>

              {/* Step 2 Form */}
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                
                {/* Your name */}
                <div>
                  <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Your name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Cedrick Santos"
                    className="w-full bg-white border border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-xl py-2.5 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  />
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mobile Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0917XXXXXXX"
                    className="w-full bg-white border border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-xl py-2.5 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  />
                </div>

                {/* Role Selection */}
                <div>
                  <label htmlFor="role" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Role
                  </label>
                  <CustomSelect
                    value={role}
                    onChange={setRole}
                    options={[
                      { value: "frontdesk", label: "Front desk" },
                      { value: "mechanic", label: "Mechanic" }
                    ]}
                    className="w-full"
                    buttonClassName="py-2.5 px-3.5 text-sm font-medium"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-emerald-700/20 active:scale-[0.99] transition-all text-sm disabled:opacity-75"
                  >
                    {isLoading ? "Submitting application..." : "Submit Application"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsGoogleAuth(false);
                      setStep(1);
                    }}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-semibold py-2.5 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Step 1</span>
                  </button>
                </div>

              </form>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Footer Navigation Link */}
        <div className="mt-6 text-center text-xs text-slate-500 font-medium">
          Already registered?{" "}
          <Link href="/login" className="text-emerald-700 font-semibold hover:underline">
            Sign in
          </Link>
        </div>

      </div>

      {/* Legal Footer */}
      <div className="w-full max-w-sm pb-6 text-center text-[11px] text-slate-400 font-normal">
        By continuing, you agree to our{" "}
        <a href="#" className="underline hover:text-slate-600">Terms of Service</a>{" "}
        and{" "}
        <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
      </div>

    </div>
  );
}
