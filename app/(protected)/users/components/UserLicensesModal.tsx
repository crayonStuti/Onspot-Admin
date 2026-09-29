"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  CreditCard,
  FileBadge,
  Calendar,
  Building2,
  Loader2,
  Download,
  ExternalLink,
  MapPin,
  ShieldCheck,
  ImageIcon,
} from "lucide-react";
import { UserItem, getUserById, getUserLicenses, API_URL } from "@/lib/api";

export interface LicensePhoto {
  id: string;
  front_image?: string | null;
  back_image?: string | null;
}

export interface LicenseIssuedBy {
  id?: string;
  organisation?: string;
  agency_website?: string | null;
}

export interface UserLicenseState {
  state_id?: string;
  state_code?: string;
  state_name?: string;
  state_flag_image?: string | null;
}

export interface UserLicenseItem {
  id: string;
  user_id?: string;
  license_number: string;
  license_type: string;
  valid_from?: string | null;
  valid_to?: string | null;
  document_url?: string | null;
  tier_constraints?: number | string | null;
  created_at?: string;
  updated_at?: string;
  state?: UserLicenseState;
  photos?: LicensePhoto[];
  issued_by?: LicenseIssuedBy;
  [key: string]: any;
}

interface UserLicensesModalProps {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
}

export function UserLicensesModal({
  isOpen,
  user,
  onClose,
}: UserLicensesModalProps) {
  const [licenses, setLicenses] = useState<UserLicenseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;

    const loadLicenses = async () => {
      setLoading(true);
      try {
        const res = await getUserById(user.id);
        const fullUser = res?.data?.user || res?.user || res?.data || res;
        const lic = fullUser?.licenses || (user as any).licenses || [];
        setLicenses(Array.isArray(lic) ? lic : []);
      } catch (err) {
        console.warn("Failed to load user licenses from user details:", err);
        if (Array.isArray((user as any).licenses)) {
          setLicenses((user as any).licenses);
        } else {
          setLicenses([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadLicenses();
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const userDisplayName =
    `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
    user.display_name ||
    user.email;

  const resolveImageUrl = (path?: string | null) => {
    if (!path) return "";
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("blob:") ||
      path.startsWith("data:")
    ) {
      return path;
    }
    return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl border border-gray-100 p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2d4a23]/10 text-[#2d4a23] flex items-center justify-center flex-shrink-0">
                <FileBadge className="w-5 h-5 text-[#2d4a23]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1f1f1f]">
                  User Licenses
                </h3>
                <p className="text-xs text-[#7D848D]">
                  Uploaded permits and credentials for{" "}
                  <span className="font-semibold text-gray-800">
                    {userDisplayName}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content list */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#2d4a23]" />
                <p className="text-xs">Loading user licenses...</p>
              </div>
            ) : licenses.length === 0 ? (
              <div className="py-12 text-center text-[#7D848D]">
                <div className="flex flex-col items-center justify-center gap-2">
                  <FileBadge className="w-10 h-10 text-gray-300" />
                  <p className="text-[13px] font-semibold text-gray-700">
                    No licenses found
                  </p>
                  <p className="text-xs text-gray-400 max-w-xs">
                    This user does not have any active hunting, fishing, or state
                    licenses uploaded.
                  </p>
                </div>
              </div>
            ) : (
              licenses.map((lic: UserLicenseItem, idx: number) => {
                const licenseType =
                  lic.license_type ||
                  lic.name ||
                  lic.title ||
                  "Recreational License";
                const licenseNum = lic.license_number || `ID #${lic.id?.slice(0, 8)}`;
                const issuerName =
                  lic.issued_by?.organisation ||
                  lic.organisation ||
                  lic.issuer ||
                  "State Wildlife Agency";
                const stateName =
                  lic.state?.state_name ||
                  (lic.state?.state_code ? `State of ${lic.state.state_code}` : "State Agency");
                const stateCode = lic.state?.state_code;
                const agencyWebsite = lic.issued_by?.agency_website;

                const validFrom = lic.valid_from;
                const validTo = lic.valid_to || lic.expires_at || lic.expiry_date;
                const isExpired =
                  validTo && new Date(validTo) < new Date();

                const photos = lic.photos || [];

                return (
                  <div
                    key={lic.id || idx}
                    className="p-4 rounded-xl border border-[#ececec] bg-[#fcfcfa] hover:border-gray-300 transition-all text-xs space-y-3"
                  >
                    {/* Top Row: Type & Number & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#2d4a23] flex items-center justify-center flex-shrink-0 border border-emerald-100 font-bold uppercase text-[11px]">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm capitalize">
                              {licenseType} License
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isExpired
                                  ? "bg-red-100 text-red-700"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {isExpired ? "Expired" : "Active"}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium">
                            License #: <span className="font-semibold text-gray-800">{licenseNum}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tier constraint badge if present */}
                      {lic.tier_constraints && (
                        <div className="self-start sm:self-center px-2 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-[11px] font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-600" />
                          <span>Tier Limit: {lic.tier_constraints}</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#f0f0eb] text-gray-600">
                      {/* State & Issuer */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#2d4a23]" />
                          <span>
                            {stateName} {stateCode ? `(${stateCode})` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-[11px] pl-5">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[200px]" title={issuerName}>
                            {issuerName}
                          </span>
                          {agencyWebsite && (
                            <a
                              href={agencyWebsite}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#2d4a23] hover:underline inline-flex items-center"
                              title="Visit Agency Website"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Validity Period */}
                      <div className="space-y-1 sm:text-right">
                        <div className="flex items-center sm:justify-end gap-1.5 text-gray-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#2d4a23]" />
                          <span>
                            {validTo ? `Expires: ${validTo}` : "Expiry: Unlimited"}
                          </span>
                        </div>
                        {validFrom && (
                          <div className="text-[11px] text-gray-400 sm:text-right">
                            Valid from: {validFrom}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* License Photos Preview Section */}
                    {photos.length > 0 && (
                      <div className="pt-2 border-t border-[#f0f0eb] space-y-1.5">
                        <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider block">
                          License Photos
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                          {photos.map((photo, pIdx) => (
                            <React.Fragment key={photo.id || pIdx}>
                              {photo.front_image && (
                                <div
                                  onClick={() => setPreviewImage(resolveImageUrl(photo.front_image))}
                                  className="group relative w-28 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 hover:border-[#2d4a23] transition-all cursor-pointer shadow-xs"
                                  title="Click to view front side image"
                                >
                                  <img
                                    src={resolveImageUrl(photo.front_image)}
                                    alt="License Front"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-medium py-0.5 text-center backdrop-blur-xs">
                                    Front Side
                                  </span>
                                </div>
                              )}
                              {photo.back_image && (
                                <div
                                  onClick={() => setPreviewImage(resolveImageUrl(photo.back_image))}
                                  className="group relative w-28 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 hover:border-[#2d4a23] transition-all cursor-pointer shadow-xs"
                                  title="Click to view back side image"
                                >
                                  <img
                                    src={resolveImageUrl(photo.back_image)}
                                    alt="License Back"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-medium py-0.5 text-center backdrop-blur-xs">
                                    Back Side
                                  </span>
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Document Download Link */}
                    {lic.document_url && (
                      <div className="pt-2 border-t border-[#f0f0eb] flex justify-end">
                        <a
                          href={lic.document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg border border-[#e4e4df] bg-white hover:bg-gray-50 text-gray-700 font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors text-xs"
                        >
                          <Download className="w-3.5 h-3.5 text-[#2d4a23]" />
                          <span>Download License File</span>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#ececec] flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Total licenses: <strong>{licenses.length}</strong>
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-xl overflow-hidden p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="License Photo Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
