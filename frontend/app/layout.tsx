import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DevRoleProvider } from "@/context/DevRoleContext";
import { DevRoleBar } from "@/components/DevRoleBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PiVeRan PMS — Preventive Maintenance System",
  description: "Shop Management System for Rey Auto Repair Shop by PiVeRan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-900">
        <DevRoleProvider>
          <DevRoleBar />
          <div className="flex-1 flex flex-col">{children}</div>
        </DevRoleProvider>
      </body>
    </html>
  );
}

