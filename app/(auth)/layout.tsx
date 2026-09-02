import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-center items-center py-10 px-4">
      <div className="w-full max-w-[558px] mx-auto">
        {children}
      </div>
    </div>
  );
}
