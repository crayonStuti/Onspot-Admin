"use client";

import React, { useState } from "react";
import {
  X,
  UserPlus,
  Type,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  User,
  MapPin,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { registerUser } from "@/lib/api";

export interface StateItem {
  id?: string;
  state_id?: string;
  state_name: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  states: StateItem[];
  loadingStates: boolean;
}

export function AddUserModal({
  isOpen,
  onClose,
  onSuccess,
  states,
  loadingStates,
}: AddUserModalProps) {
  const [addForm, setAddForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "user",
    status: "active",
    state_id: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSaveAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!addForm.first_name.trim()) errors.first_name = "First name is required";
    if (!addForm.last_name.trim()) errors.last_name = "Last name is required";
    if (!addForm.email.trim() || !/\S+@\S+\.\S+/.test(addForm.email)) {
      errors.email = "Valid email address is required";
    }

    if (!addForm.password) {
      errors.password = "Password is required";
    } else {
      if (addForm.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      } else if (!/[A-Z]/.test(addForm.password)) {
        errors.password = "Password must contain at least one uppercase letter";
      } else if (!/[a-z]/.test(addForm.password)) {
        errors.password = "Password must contain at least one lowercase letter";
      } else if (!/[0-9]/.test(addForm.password)) {
        errors.password = "Password must contain at least one number";
      } else if (!/[^A-Za-z0-9]/.test(addForm.password)) {
        errors.password = "Password must contain at least one special character";
      }
    }

    if (addForm.role === "admin" && !addForm.state_id) {
      errors.state_id = "State is required for admin users";
    }

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }

    setAddSaving(true);
    try {
      const payload: any = {
        first_name: addForm.first_name,
        last_name: addForm.last_name,
        display_name: `${addForm.first_name} ${addForm.last_name}`.trim(),
        email: addForm.email,
        password: addForm.password,
        role: addForm.role,
        status: addForm.status,
      };

      if (addForm.state_id) {
        payload.state_id = addForm.state_id;
      }

      await registerUser(payload);
      toast.success("User created successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Create user error:", err);
      toast.error(err?.message || "Failed to create user");
    } finally {
      setAddSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2d4a23] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Add New User</h3>
              <p className="text-xs text-gray-500">Create a new user account in the system</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveAddUser} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Type className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={addForm.first_name}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, first_name: e.target.value }))}
                  placeholder="First Name"
                  className={`w-full h-10 pl-9 pr-3 rounded-lg border ${addErrors.first_name ? 'border-red-500' : 'border-gray-200'} text-xs focus:outline-none focus:border-[#2d4a23]`}
                />
              </div>
              {addErrors.first_name && <p className="text-[11px] text-red-500">{addErrors.first_name}</p>}
            </div>

            {/* Last Name */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Type className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={addForm.last_name}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Last Name"
                  className={`w-full h-10 pl-9 pr-3 rounded-lg border ${addErrors.last_name ? 'border-red-500' : 'border-gray-200'} text-xs focus:outline-none focus:border-[#2d4a23]`}
                />
              </div>
              {addErrors.last_name && <p className="text-[11px] text-red-500">{addErrors.last_name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  className={`w-full h-10 pl-9 pr-3 rounded-lg border ${addErrors.email ? 'border-red-500' : 'border-gray-200'} text-xs focus:outline-none focus:border-[#2d4a23]`}
                />
              </div>
              {addErrors.email && <p className="text-[11px] text-red-500">{addErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={addForm.password}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className={`w-full h-10 pl-9 pr-9 rounded-lg border ${addErrors.password ? 'border-red-500' : 'border-gray-200'} text-xs focus:outline-none focus:border-[#2d4a23]`}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {passwordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {addErrors.password ? (
                <p className="text-[11px] text-red-500">{addErrors.password}</p>
              ) : (
                <p className="text-[10px] text-gray-400">Must include uppercase, lowercase, number & special char.</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-[#2d4a23]"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="dnr">DNR</option>
                </select>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={addForm.status}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-[#2d4a23]"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* State */}
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-gray-700">
                State {addForm.role === 'admin' && <span className="text-red-500">* (Required for Admin)</span>}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={addForm.state_id}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, state_id: e.target.value }))}
                  disabled={loadingStates}
                  className={`w-full h-10 pl-9 pr-3 rounded-lg border ${addErrors.state_id ? 'border-red-500' : 'border-gray-200'} text-xs bg-white focus:outline-none focus:border-[#2d4a23]`}
                >
                  <option value="">{loadingStates ? "Loading states..." : "Select state"}</option>
                  {states.map((s) => (
                    <option key={s.state_id || s.id} value={s.state_id || s.id}>
                      {s.state_name}
                    </option>
                  ))}
                </select>
              </div>
              {addErrors.state_id && <p className="text-[11px] text-red-500">{addErrors.state_id}</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addSaving}
              className="px-5 py-2 rounded-xl bg-[#2d4a23] hover:bg-[#233a1b] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {addSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save User</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
