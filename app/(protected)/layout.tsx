"use client";

import React, { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex text-[#2c2c2c]">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <main className="flex-1 p-5 sm:p-7 max-w-[1600px] w-full mx-auto">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          {children}
        </main>
      </div>
    </div>
  );
}
