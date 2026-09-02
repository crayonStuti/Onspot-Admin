"use client";

import React from "react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-[14px] p-6 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)]">
        <h1 className="text-xl font-bold text-[#1f1f1f]">Admin Settings</h1>
        <p className="text-sm text-[#7D848D] mt-1">
          Manage system configurations, admin roles, API keys, and platform settings.
        </p>
      </section>
    </div>
  );
}
