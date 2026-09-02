import type { Metadata } from "next";
import { Inter, Montserrat, Roboto } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Admin Panel — S.P.O.T.",
  description: "On S.P.O.T. Administrative Management Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable} ${roboto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-[#1B1E28]">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
