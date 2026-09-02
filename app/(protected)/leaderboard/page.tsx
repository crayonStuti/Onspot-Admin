"use client";

import React from "react";

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-[14px] p-6 border border-[#ececec] shadow-[0_6px_20px_rgba(60,60,60,0.10),0_2px_6px_rgba(60,60,60,0.06)]">
        <h1 className="text-xl font-bold text-[#1f1f1f]">Leaderboard</h1>
        <p className="text-sm text-[#7D848D] mt-1">
          Top community contributors, pins created, and activity rankings.
        </p>
      </section>
    </div>
  );
}
