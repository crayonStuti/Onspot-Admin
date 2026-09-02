import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-6 text-[#2c2c2c]">
      <div className="w-full max-w-[420px]">{children}</div>
    </div>
  );
}

