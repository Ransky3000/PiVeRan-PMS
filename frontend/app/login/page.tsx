"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { apiService, authService } from "../apiService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleGoogleAuth = () => {
    triggerToast("Google OAuth trigger: Authenticating with Google Account...");
    setTimeout(() => {
      router.push("/frontdesk/job-orders");
    }, 1200);
  };

  const handleDemoFill = (demoEmail: string, roleName: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    triggerToast(`Auto-filled credentials for ${roleName}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await apiService.login({ email, password });
      
      if (user.status === "PENDING") {
        authService.setPendingUser(user);
        triggerToast("Account pending approval. Redirecting...");
        setTimeout(() => {
          router.push("/pending-approval");
        }, 1500);
      } else if (user.status === "REJECTED") {
        triggerToast("Your registration request was rejected by Admin.");
      } else {
        // APPROVED
        authService.setCurrentUser(user);
        authService.setPendingUser(null);
        triggerToast(`Authenticated! Welcome back (${user.name})`);
        
        setTimeout(() => {
          if (user.role === "Admin") {
            router.push("/admin/analytics");
          } else if (user.role === "Front Desk") {
            router.push("/frontdesk/job-orders");
          } else if (user.role === "Mechanic") {
            router.push("/mechanic/job-board");
          }
        }, 1200);
      }
    } catch (err: any) {
      triggerToast(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Centered Main Stage (ElevenLabs Layout) */}
      <div className="w-full max-w-sm pt-8 sm:pt-12 my-auto">
        
        {/* Top Centered Brand Logo (Clean PiVeRan PMS) */}
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

        {/* Title Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 text-center tracking-tight mb-8">
          Welcome back
        </h1>

        {/* Toast Feedback Alert */}
        {toastMessage && (
          <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          className="w-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-sm mb-6"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-full border-t border-slate-200" />
          <span className="bg-white px-3 text-[11px] text-slate-400 font-semibold uppercase tracking-wider absolute">
            or work email
          </span>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Input Field */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@reyauto.com"
              className="w-full bg-white border border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-xl py-2.5 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Password reset instructions will be sent to your email.");
                }}
                className="text-[11px] text-slate-500 hover:text-emerald-700 font-medium transition-colors"
              >
                Forgot your password?
              </a>
            </div>

            <div className="relative flex items-center">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          </div>

          {/* Primary Sign In Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-emerald-700/20 active:scale-[0.99] transition-all text-sm disabled:opacity-75"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>

        </form>

        {/* Footer Navigation Link */}
        <div className="mt-6 text-center text-xs text-slate-500 font-medium">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-emerald-700 font-semibold hover:underline">
            Sign up
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
