"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  ArrowRight,
  LayoutDashboard,
  Users,
  CreditCard,
  Award,
  MapPin,
  FolderKanban,
  Navigation,
  Bot,
  DollarSign,
  FileBarChart,
  Trophy,
  MessageSquare,
  ShieldCheck,
  Handshake,
  Clock,
  Bell,
  Settings,
  PlusCircle,
  Loader2,
  ExternalLink,
  Building2,
} from "lucide-react";
import {
  adminGlobalSearch,
  AdminSearchGroup,
  AdminSearchResultItem,
} from "@/lib/api";

export type SearchCategory =
  | "Quick Actions"
  | "Pages"
  | "Users"
  | "Sponsors"
  | "Resources"
  | "GPS & Map Pins"
  | "Licenses"
  | "License Issuers"
  | "States"
  | string;

export interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  category: SearchCategory;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
  badge?: string;
  isApiResult?: boolean;
}

const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  user: Users,
  sponsors: Handshake,
  sponsor: Handshake,
  resources: FolderKanban,
  resource: FolderKanban,
  map_pins: Navigation,
  map_pin: Navigation,
  licenses: Award,
  license: Award,
  license_issuers: Building2,
  license_issuer: Building2,
  issuers: Building2,
  issuer: Building2,
  states: MapPin,
  state: MapPin,
};

// -----------------------------------------------------------------------------
// FRONTEND STATIC SEARCH ITEMS (Navigation Pages + Intent-Based Quick Actions)
// -----------------------------------------------------------------------------
const STATIC_ACTIONS: SearchItem[] = [
  // --- User Management Actions ---
  {
    id: "action-create-user",
    title: "Create / Add New User",
    subtitle: "Open user management to register, add, or invite a new user",
    category: "Quick Actions",
    href: "/users?action=create",
    icon: PlusCircle,
    badge: "Action",
    keywords: [
      "create user",
      "add user",
      "new user",
      "invite user",
      "register user",
      "user add",
      "user create",
      "add member",
      "create account",
    ],
  },
  {
    id: "action-reset-user-password",
    title: "Reset User Password",
    subtitle: "Manage security credentials and reset password for users",
    category: "Quick Actions",
    href: "/users",
    icon: Settings,
    badge: "Security",
    keywords: ["reset password", "change user password", "forgot password", "user password"],
  },
  {
    id: "action-suspend-user",
    title: "Suspend / Deactivate User",
    subtitle: "Temporarily suspend or ban user accounts from platform",
    category: "Quick Actions",
    href: "/users",
    icon: Users,
    badge: "Moderation",
    keywords: ["suspend user", "ban user", "deactivate user", "block user", "disable user"],
  },

  // --- Sponsor Actions ---
  {
    id: "action-review-pending-sponsors",
    title: "Review Pending Sponsors",
    subtitle: "Evaluate, approve, or reject pending partner sponsor applications",
    category: "Quick Actions",
    href: "/pending-sponsors",
    icon: Clock,
    badge: "Review Queue",
    keywords: [
      "pending sponsors",
      "approve sponsor",
      "review sponsors",
      "sponsor approval",
      "sponsor applications",
      "reject sponsor",
      "verify sponsor",
      "queue",
    ],
  },
  {
    id: "action-add-sponsor",
    title: "Add New Sponsor Partner",
    subtitle: "Create and publish a new brand partnership or enterprise sponsor",
    category: "Quick Actions",
    href: "/sponsors?action=create",
    icon: Handshake,
    badge: "Action",
    keywords: [
      "add sponsor",
      "create sponsor",
      "new sponsor",
      "add partner",
      "brand partner",
      "sponsor create",
      "sponsor add",
    ],
  },

  // --- Resource Actions ---
  {
    id: "action-upload-resource",
    title: "Upload New Resource File",
    subtitle: "Publish official regulations, guides, state PDFs, or documents",
    category: "Quick Actions",
    href: "/resources?action=create",
    icon: FolderKanban,
    badge: "Action",
    keywords: [
      "upload resource",
      "add resource",
      "new guide",
      "upload pdf",
      "add pdf",
      "create resource",
      "add document",
      "upload file",
      "publish guide",
    ],
  },

  // --- Notification Actions ---
  {
    id: "action-broadcast-notification",
    title: "Broadcast New Notification",
    subtitle: "Create and blast a targeted announcement or push alert to users",
    category: "Quick Actions",
    href: "/notifications?action=create",
    icon: Bell,
    badge: "Broadcast",
    keywords: [
      "create notification",
      "send notification",
      "broadcast announcement",
      "new alert",
      "send alert",
      "push alert",
      "blast message",
      "post announcement",
    ],
  },

  // --- Financial & Analytics Actions ---
  {
    id: "action-view-revenue",
    title: "View Revenue & Monetization",
    subtitle: "Inspect transactions, payout history, earnings, and monthly subscriptions",
    category: "Quick Actions",
    href: "/revenue",
    icon: DollarSign,
    badge: "Finance",
    keywords: [
      "view revenue",
      "monetization",
      "financial transactions",
      "earnings",
      "payouts",
      "billing",
      "subscription revenue",
    ],
  },
  {
    id: "action-manage-memberships",
    title: "Manage Membership Tiers",
    subtitle: "Configure subscription pricing plans, perks, and access levels",
    category: "Quick Actions",
    href: "/memberships",
    icon: CreditCard,
    badge: "Tiers",
    keywords: [
      "manage memberships",
      "membership tiers",
      "pricing plans",
      "subscription plans",
      "change price",
    ],
  },
  {
    id: "action-create-membership",
    title: "Create Membership Tier / Plan",
    subtitle: "Define new pricing plan, perks, recurring billing, and access levels",
    category: "Quick Actions",
    href: "/memberships?action=create",
    icon: PlusCircle,
    badge: "Action",
    keywords: [
      "create membership",
      "add membership",
      "new membership",
      "create plan",
      "add plan",
      "new plan",
      "add tier",
      "new tier",
      "pricing tier",
    ],
  },
  {
    id: "action-add-license-issuer",
    title: "Add License Issuer Organization",
    subtitle: "Register official state agency, wildlife department, or issuing authority",
    category: "Quick Actions",
    href: "/license-issuers?action=create",
    icon: PlusCircle,
    badge: "Action",
    keywords: [
      "add issuer",
      "create issuer",
      "new issuer",
      "add license issuer",
      "create license issuer",
      "issuer add",
      "agency",
      "wildlife department",
      "issuing authority",
      "texas parks",
    ],
  },
  {
    id: "action-review-reports",
    title: "Review Moderation Reports",
    subtitle: "Investigate flagged user reports, safety violations, and community abuse",
    category: "Quick Actions",
    href: "/reports",
    icon: FileBarChart,
    badge: "Moderation",
    keywords: [
      "review reports",
      "moderate reports",
      "flagged content",
      "reported users",
      "abuse reports",
      "violations",
    ],
  },
  {
    id: "action-inspect-gps",
    title: "Inspect GPS Field Tagging Map",
    subtitle: "Track live map coordinates, field pins, and GPS location activity",
    category: "Quick Actions",
    href: "/gps",
    icon: Navigation,
    badge: "Map",
    keywords: ["track gps", "field tags", "interactive map", "track pins", "coordinates", "pins"],
  },
  {
    id: "action-monitor-ai",
    title: "Monitor AI Assistant",
    subtitle: "Review prompt logs, token usage, and AI response accuracy",
    category: "Quick Actions",
    href: "/ai",
    icon: Bot,
    badge: "AI",
    keywords: ["monitor ai", "ai assistant", "chat logs", "prompts", "token consumption", "ai bot"],
  },
  {
    id: "action-admin-settings",
    title: "Admin System Settings",
    subtitle: "Configure admin profile, authentication, security, and preferences",
    category: "Quick Actions",
    href: "/settings",
    icon: Settings,
    badge: "Config",
    keywords: ["system settings", "change password", "profile settings", "admin settings", "security"],
  },
];

const STATIC_PAGES: SearchItem[] = [
  {
    id: "page-dashboard",
    title: "Dashboard Overview",
    subtitle: "Main system overview and analytics metrics",
    category: "Pages",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: ["home", "analytics", "stats", "overview"],
  },
  {
    id: "page-users",
    title: "Users Management",
    subtitle: "View, filter, edit, and manage registered users",
    category: "Pages",
    href: "/users",
    icon: Users,
    keywords: ["accounts", "members", "profiles", "customers", "users"],
  },
  {
    id: "page-memberships",
    title: "Membership Management",
    subtitle: "Membership tiers, plans, and subscribers",
    category: "Pages",
    href: "/memberships",
    icon: CreditCard,
    keywords: ["plans", "subscriptions", "tiers"],
  },
  {
    id: "page-licenses",
    title: "License Wallet Management",
    subtitle: "User licenses, credentials, and verification",
    category: "Pages",
    href: "/licenses",
    icon: Award,
    keywords: ["credentials", "permits", "wallet", "certifications", "licenses"],
  },
  {
    id: "page-license-issuers",
    title: "License Issuers Management",
    subtitle: "Authorized governing bodies & issuing authorities",
    category: "Pages",
    href: "/license-issuers",
    icon: ShieldCheck,
    keywords: ["issuers", "authorities", "regulators", "organizations"],
  },
  {
    id: "page-states",
    title: "States Management",
    subtitle: "Jurisdiction, states, regions, and regional rules",
    category: "Pages",
    href: "/states",
    icon: MapPin,
    keywords: ["regions", "locations", "provinces", "zones", "states"],
  },
  {
    id: "page-resources",
    title: "Resources Management",
    subtitle: "Downloadable guides, documents, and media resources",
    category: "Pages",
    href: "/resources",
    icon: FolderKanban,
    keywords: ["files", "documents", "downloads", "guides", "pdfs", "resources"],
  },
  {
    id: "page-gps",
    title: "GPS / Tagging Activity",
    subtitle: "Interactive map, field tags, and GPS coordinates",
    category: "Pages",
    href: "/gps",
    icon: Navigation,
    keywords: ["map", "location", "tracking", "coordinates", "pins", "gps"],
  },
  {
    id: "page-ai",
    title: "AI Assistant Monitoring",
    subtitle: "AI chat interactions, token usage, and prompts",
    category: "Pages",
    href: "/ai",
    icon: Bot,
    keywords: ["chat", "bot", "assistant", "prompts", "intelligence", "ai"],
  },
  {
    id: "page-revenue",
    title: "Revenue & Monetization",
    subtitle: "Financial transactions, payout history, and earnings",
    category: "Pages",
    href: "/revenue",
    icon: DollarSign,
    keywords: ["money", "billing", "finance", "earnings", "monetization", "revenue"],
  },
  {
    id: "page-reports",
    title: "Reports & Moderation",
    subtitle: "User reports, flags, violations, and audit logs",
    category: "Pages",
    href: "/reports",
    icon: FileBarChart,
    keywords: ["moderation", "flags", "abuse", "audits", "issues", "reports"],
  },
  {
    id: "page-leaderboard",
    title: "Leaderboard",
    subtitle: "Top rankings, active user scores, and achievements",
    category: "Pages",
    href: "/leaderboard",
    icon: Trophy,
    keywords: ["rankings", "scores", "top users", "gamification", "leaderboard"],
  },
  {
    id: "page-community",
    title: "Social Media / Community Posts",
    subtitle: "Public posts, feed comments, and community engagements",
    category: "Pages",
    href: "/community",
    icon: MessageSquare,
    keywords: ["feed", "posts", "social", "comments", "discussions", "community"],
  },
  {
    id: "page-sponsors",
    title: "Sponsors Management",
    subtitle: "Active partners, sponsor listings, and contracts",
    category: "Pages",
    href: "/sponsors",
    icon: Handshake,
    keywords: ["partners", "brands", "sponsorships", "deals", "sponsors"],
  },
  {
    id: "page-pending-sponsors",
    title: "Pending Sponsors",
    subtitle: "Applications awaiting approval, review, or rejection",
    category: "Pages",
    href: "/pending-sponsors",
    icon: Clock,
    badge: "Action Required",
    keywords: ["approval", "review", "new sponsors", "queue", "pending sponsors"],
  },
  {
    id: "page-notifications",
    title: "Notifications & Announcements",
    subtitle: "Push broadcasts, alerts, and system notifications",
    category: "Pages",
    href: "/notifications",
    icon: Bell,
    keywords: ["alerts", "broadcasts", "messages", "announcements", "notifications"],
  },
  {
    id: "page-settings",
    title: "Admin Settings",
    subtitle: "System configuration, profile, and security preferences",
    category: "Pages",
    href: "/settings",
    icon: Settings,
    keywords: ["configuration", "profile", "password", "security", "preferences", "settings"],
  },
];

const ALL_STATIC_ITEMS: SearchItem[] = [...STATIC_ACTIONS, ...STATIC_PAGES];

interface UnifiedSearchProps {
  onCloseMobile?: () => void;
}

export default function UnifiedSearch({
  onCloseMobile,
}: UnifiedSearchProps = {}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Backend API Search State
  const [apiItems, setApiItems] = useState<SearchItem[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchSeqRef = useRef<number>(0);

  // 1. Filter Frontend Static Items (Actions & Pages)
  const filteredStaticItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      // Default suggested items when focused without typing
      return [
        STATIC_ACTIONS[0], // Create User
        STATIC_ACTIONS[3], // Review Pending Sponsors
        STATIC_ACTIONS[5], // Upload Resource
        STATIC_PAGES[0],   // Dashboard
        STATIC_PAGES[1],   // Users
        STATIC_PAGES[13],  // Sponsors
        STATIC_PAGES[15],  // Notifications
      ];
    }

    return ALL_STATIC_ITEMS.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(trimmed);
      const matchSubtitle = item.subtitle?.toLowerCase().includes(trimmed);
      const matchCategory = item.category.toLowerCase().includes(trimmed);
      const matchHref = item.href.toLowerCase().includes(trimmed);
      const matchKeywords = item.keywords?.some((k) =>
        k.toLowerCase().includes(trimmed)
      );

      return (
        matchTitle ||
        matchSubtitle ||
        matchCategory ||
        matchHref ||
        matchKeywords
      );
    });
  }, [query]);

  // 2. Fetch Backend API Data via Centralized Admin Global Search Endpoint
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setApiItems([]);
      setIsApiLoading(false);
      return;
    }

    const currentSeq = ++searchSeqRef.current;
    setIsApiLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await adminGlobalSearch(trimmed, 4);

        // If a newer search occurred while waiting, discard stale results
        if (currentSeq !== searchSeqRef.current) return;

        const results: SearchItem[] = [];
        const groups: AdminSearchGroup[] = res?.data?.groups || [];

        groups.forEach((group) => {
          const IconComponent =
            ENTITY_ICONS[group.type.toLowerCase()] || Search;

          (group.results || []).forEach((item: AdminSearchResultItem | any) => {
            const rawTitle =
              item.title ||
              item.organisation ||
              item.name ||
              item.description ||
              item.metadata?.organisation ||
              "Database Record";

            const rawSubtitle =
              item.subtitle ||
              [
                item.agency_website || item.metadata?.agency_website,
                item.state_name || item.state?.state_name || item.metadata?.state_name,
              ]
                .filter(Boolean)
                .join(" • ") ||
              undefined;

            // Strip any markdown link syntax like [url](url) that might come from formatted subtitles
            const cleanSubtitle = rawSubtitle
              ? String(rawSubtitle).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim()
              : undefined;

            results.push({
              id: `api-${item.type || group.type}-${item.id}`,
              title: rawTitle,
              subtitle: cleanSubtitle,
              category: group.label,
              href: item.route || `/license-issuers?search=${encodeURIComponent(rawTitle)}`,
              icon: IconComponent,
              badge: item.badge || (group.type === "license_issuers" ? "ISSUER" : undefined),
              isApiResult: true,
            });
          });
        });

        setApiItems(results);
      } catch (err) {
        console.warn("Unified search API error:", err);
        setApiItems([]);
      } finally {
        if (currentSeq === searchSeqRef.current) {
          setIsApiLoading(false);
        }
      }
    }, 280); // 280ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // 3. Combined Results: Frontend Static Items + Backend API Items
  const allResults = useMemo(() => {
    return [...filteredStaticItems, ...apiItems];
  }, [filteredStaticItems, apiItems]);

  // 4. Group Combined Results into Ordered Categories
  const PREFERRED_ORDER = [
    "Quick Actions",
    "Pages",
    "Users",
    "Sponsors",
    "Resources",
    "GPS & Map Pins",
    "Licenses",
    "License Issuers",
    "States",
  ];

  const groupedResults = useMemo(() => {
    const groups: { [key: string]: SearchItem[] } = {};
    for (const item of allResults) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category]!.push(item);
    }
    return groups;
  }, [allResults]);

  // Determine dynamic category display order
  const orderedCategories = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];

    PREFERRED_ORDER.forEach((cat) => {
      if (groupedResults[cat] && groupedResults[cat]!.length > 0) {
        seen.add(cat);
        ordered.push(cat);
      }
    });

    Object.keys(groupedResults).forEach((cat) => {
      if (!seen.has(cat) && groupedResults[cat] && groupedResults[cat]!.length > 0) {
        seen.add(cat);
        ordered.push(cat);
      }
    });

    return ordered;
  }, [groupedResults]);

  // Flat list for index-based keyboard navigation
  const flatItems = useMemo(() => {
    const list: SearchItem[] = [];
    orderedCategories.forEach((cat) => {
      const items = groupedResults[cat];
      if (items && items.length > 0) {
        list.push(...items);
      }
    });
    return list;
  }, [groupedResults, orderedCategories]);


  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [allResults]);

  // Scroll active item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const activeEl = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex, isOpen]);

  // Global keyboard shortcut: Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: SearchItem) => {
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
    onCloseMobile?.();

    // Trigger instant form open events or in-page filter events if already on target page
    if (typeof window !== "undefined") {
      // 1. Actions / Modal Openers
      if (item.id === "action-create-user") {
        window.dispatchEvent(new CustomEvent("onspot:open-create-user"));
      } else if (item.id === "action-add-sponsor") {
        window.dispatchEvent(new CustomEvent("onspot:open-add-sponsor"));
      } else if (item.id === "action-upload-resource") {
        window.dispatchEvent(new CustomEvent("onspot:open-upload-resource"));
      } else if (item.id === "action-broadcast-notification") {
        window.dispatchEvent(new CustomEvent("onspot:open-broadcast-notification"));
      } else if (item.id === "action-create-membership") {
        window.dispatchEvent(new CustomEvent("onspot:open-create-membership"));
      } else if (item.id === "action-add-license-issuer") {
        window.dispatchEvent(new CustomEvent("onspot:open-create-license-issuer"));
      }

      // 2. In-page filter events for database results
      if (item.isApiResult && item.href.includes("search=")) {
        try {
          const urlObj = new URL(item.href, window.location.origin);
          const searchParam = urlObj.searchParams.get("search");
          if (searchParam) {
            if (item.category === "Users") {
              window.dispatchEvent(new CustomEvent("onspot:filter-users", { detail: { search: searchParam } }));
            } else if (item.category === "Sponsors") {
              window.dispatchEvent(new CustomEvent("onspot:filter-sponsors", { detail: { search: searchParam } }));
            } else if (item.category === "Resources") {
              window.dispatchEvent(new CustomEvent("onspot:filter-resources", { detail: { search: searchParam } }));
            } else if (item.category === "GPS & Map Pins") {
              window.dispatchEvent(new CustomEvent("onspot:filter-gps", { detail: { search: searchParam } }));
            } else if (item.category === "Licenses") {
              window.dispatchEvent(new CustomEvent("onspot:filter-licenses", { detail: { search: searchParam } }));
            } else if (item.category === "License Issuers") {
              window.dispatchEvent(new CustomEvent("onspot:filter-license-issuers", { detail: { search: searchParam } }));
            }
          }
        } catch {}
      }
    }

    router.push(item.href);
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        handleSelect(flatItems[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
      onCloseMobile?.();
    }
  };

  const clearSearch = () => {
    setQuery("");
    setApiItems([]);
    inputRef.current?.focus();
  };

  let globalItemIndex = 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Bar - exact HTML structure and styles */}
      <div className="relative flex items-center w-full">
        <input
          ref={inputRef}
          type="text"
          id="top-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search"
          autoComplete="off"
          className="w-full py-[13px] pl-5 pr-11 border-none rounded-[15px] bg-white text-[13.5px] text-[#444] placeholder-[#999] shadow-xs outline-none focus:ring-2 focus:ring-[#0E3E27]/20 transition-all"
        />

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-auto">
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="text-[#999] pointer-events-none flex items-center">
            {isApiLoading ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin text-[#0E3E27]" />
            ) : (
              <Search className="w-[18px] h-[18px]" />
            )}
          </span>
        </div>
      </div>

      {/* Dropdown Results Modal / Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden backdrop-blur-md animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header indicator when query is active or empty */}
          <div className="px-4 py-2 bg-[#fbfbfb] border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span className="flex items-center gap-2">
              {query.trim()
                ? `Results for "${query}" (${flatItems.length})`
                : "Suggested Actions & Pages"}
              {isApiLoading && (
                <span className="inline-flex items-center gap-1 text-[#0E3E27] font-normal text-[10.5px]">
                  <Loader2 className="w-3 h-3 animate-spin" /> Searching database...
                </span>
              )}
            </span>
            <span className="text-gray-400 text-[10.5px]">
              ↑ ↓ to navigate • ↵ to select
            </span>
          </div>

          {/* Results List */}
          <div
            ref={listRef}
            className="max-h-[380px] overflow-y-auto divide-y divide-gray-50 p-1.5"
          >
            {flatItems.length === 0 ? (
              isApiLoading ? (
                <div className="py-10 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#0E3E27]/10 text-[#0E3E27] flex items-center justify-center mx-auto mb-2.5 animate-pulse">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <p className="text-[13.5px] font-semibold text-gray-700">
                    Searching database...
                  </p>
                  <p className="text-[12px] text-gray-400 mt-1 max-w-xs mx-auto">
                    Scanning users, sponsors, resources, license issuers, and map pins for &ldquo;{query}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="py-8 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2.5">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="text-[13.5px] font-semibold text-gray-700">
                    No matches found
                  </p>
                  <p className="text-[12px] text-gray-400 mt-1 max-w-xs mx-auto">
                    No actions, pages, or records matched &ldquo;{query}&rdquo;.
                    Try searching for &ldquo;create user&rdquo;, &ldquo;sponsors&rdquo;, or &ldquo;resources&rdquo;.
                  </p>
                </div>
              )
            ) : (
              orderedCategories.map((category) => {
                const items = groupedResults[category];
                if (!items || items.length === 0) return null;

                const isApiCategory =
                  category !== "Quick Actions" && category !== "Pages";

                return (
                  <div key={category} className="py-1">
                    <div className="px-3 pt-2 pb-1 text-[10.5px] font-bold tracking-wider text-gray-400 uppercase flex items-center justify-between">
                      <span>{category}</span>
                      {isApiCategory && (
                        <span className="text-[9.5px] text-[#0E3E27] font-semibold bg-[#0E3E27]/10 px-1.5 py-0.5 rounded">
                          Database Record
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      {items.map((item) => {
                        const currentIndex = globalItemIndex++;
                        const isSelected = currentIndex === selectedIndex;
                        const Icon = item.icon;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            data-index={currentIndex}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer group ${
                              isSelected
                                ? "bg-[#f5efdc] text-[#1f1f1f]"
                                : "text-[#333] hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? "bg-[#0E3E27] text-[#f5efdc]"
                                    : item.category === "Quick Actions" || item.category === "License Issuers"
                                    ? "bg-[#0E3E27]/10 text-[#0E3E27]"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-medium text-gray-900 truncate">
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span
                                      className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full shrink-0 tracking-wide uppercase ${
                                        item.badge === "Action" || item.badge === "Broadcast"
                                          ? "bg-[#0E3E27]/10 text-[#0E3E27]"
                                          : item.badge === "Review Queue" || item.badge === "Pending"
                                          ? "bg-amber-100 text-amber-800"
                                          : item.badge === "Active"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : item.badge === "ISSUER"
                                          ? "bg-[#0E3E27]/10 text-[#0E3E27] border border-[#0E3E27]/20"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                {item.subtitle && (
                                  <p className="text-[11.5px] text-gray-500 truncate mt-0.5">
                                    {item.subtitle}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
                              <span className="text-[10.5px] font-mono text-gray-400 hidden sm:inline-block max-w-[130px] truncate">
                                {item.href.split("?")[0]}
                              </span>
                              <ArrowRight
                                className={`w-3.5 h-3.5 transition-transform ${
                                  isSelected
                                    ? "translate-x-0.5 text-[#0E3E27]"
                                    : "text-gray-300 group-hover:text-gray-500"
                                }`}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}

            {flatItems.length > 0 && isApiLoading && (
              <div className="px-3 py-2 text-center text-[11px] text-gray-500 flex items-center justify-center gap-1.5 border-t border-gray-100 bg-[#fbfbfb]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0E3E27]" />
                <span>Searching database for more records...</span>
              </div>
            )}
          </div>

          {/* Footer with keyboard shortcuts hints */}
          <div className="px-3.5 py-2 bg-[#f8f9fa] border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[9.5px] font-medium bg-white rounded border border-gray-200">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 text-[9.5px] font-medium bg-white rounded border border-gray-200">
                  ↓
                </kbd>{" "}
                navigate
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[9.5px] font-medium bg-white rounded border border-gray-200">
                  ↵
                </kbd>{" "}
                select
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[9.5px] font-medium bg-white rounded border border-gray-200">
                  esc
                </kbd>{" "}
                close
              </span>
            </div>
            <span className="text-[10px] text-gray-400">
              Frontend Actions + API Data
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
