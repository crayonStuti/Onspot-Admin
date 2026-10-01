"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserCheck,
  Shield,
  Clock,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDashboardOverview,
  DashboardOverviewData,
  DashboardMetric,
} from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Helper: Generate Continuous SVG Path matching dashboard.html (NO CIRCLES)  */
/* -------------------------------------------------------------------------- */
function generateCleanSparkline(
  data: { week: string; value: number }[],
  isDownTrend: boolean,
): { linePath: string; areaPath: string } {
  const width = 200;
  const height = 56;

  if (!data || data.length === 0) {
    const defaultY = isDownTrend ? 30 : 38;
    return {
      linePath: `M0,${defaultY} L${width},${defaultY}`,
      areaPath: `M0,${defaultY} L${width},${defaultY} L${width},${height} L0,${height} Z`,
    };
  }

  // If only 1 data point is present (e.g. week 1 of the month), render a flat baseline
  if (data.length === 1) {
    const defaultY = isDownTrend ? 30 : 38;
    return {
      linePath: `M0,${defaultY} L${width},${defaultY}`,
      areaPath: `M0,${defaultY} L${width},${defaultY} L${width},${height} L0,${height} Z`,
    };
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || (max === 0 ? 1 : max * 0.25);

  // Map each data point across the 200px width with natural vertical headroom
  const rawPoints = data.map((d, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * width : width / 2;
    // Map to Y range [10, 46] out of 56 total height
    const normalized = (d.value - min) / range;
    const y = 46 - normalized * 34;
    return { x, y };
  });

  // Interpolate 9 segments (0, 25, 50, 75, 100, 125, 150, 175, 200) like dashboard.html
  const steps = 8;
  const interpolatedPoints: { x: number; y: number }[] = [];

  for (let s = 0; s <= steps; s++) {
    const currentX = (s / steps) * width;
    // Find surrounding raw points
    const rawProgress = (s / steps) * (rawPoints.length - 1);
    const idx = Math.max(
      0,
      Math.min(Math.floor(rawProgress), rawPoints.length - 2),
    );
    const t = rawProgress - idx;

    const p0 = rawPoints[Math.max(0, idx - 1)] ?? rawPoints[0];
    const p1 = rawPoints[idx] ?? rawPoints[0];
    const p2 = rawPoints[Math.min(rawPoints.length - 1, idx + 1)] ?? p1;
    const p3 = rawPoints[Math.min(rawPoints.length - 1, idx + 2)] ?? p2;

    if (!p1) {
      continue;
    }

    // Catmull-Rom cubic interpolation for continuous organic wave
    const y =
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t * t +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t * t * t);

    // Clamp Y to safe visible boundary [6, 50]
    const clampedY = Math.max(6, Math.min(50, y));
    interpolatedPoints.push({ x: currentX, y: clampedY });
  }

  // Build SVG path strings with straight/sub-bezier continuity
  const pathCommands = interpolatedPoints.map((pt, i) =>
    i === 0
      ? `M${pt.x.toFixed(0)},${pt.y.toFixed(0)}`
      : `L${pt.x.toFixed(0)},${pt.y.toFixed(0)}`,
  );

  const linePath = pathCommands.join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return { linePath, areaPath };
}

/* -------------------------------------------------------------------------- */
/* Metric Card Component                                                      */
/* -------------------------------------------------------------------------- */
interface MetricCardProps {
  id: string;
  label: string;
  metric?: DashboardMetric | null;
  icon: React.ReactNode;
  isCurrency?: boolean;
  forceTheme?: "up" | "down";
}

function MetricCard({
  id,
  label,
  metric,
  icon,
  isCurrency = false,
  forceTheme,
}: MetricCardProps) {
  const isDown = forceTheme ? forceTheme === "down" : metric?.trend === "down";
  const gradId = `sparkline-grad-${id}`;

  const graphData = metric?.graph_data || [];

  const { linePath, areaPath } = useMemo(
    () => generateCleanSparkline(graphData, isDown),
    [graphData, isDown],
  );

  const formattedCount = useMemo(() => {
    if (!metric || metric.count === undefined || metric.count === null) {
      return "—";
    }
    if (isCurrency) {
      return `$${Number(metric.count).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return Number(metric.count).toLocaleString("en-US");
  }, [metric?.count, isCurrency]);

  return (
    <div
      className="card stat"
      style={{
        background: "#fff",
        borderRadius: "14px",
        padding: "16px",
        boxShadow:
          "0 6px 20px rgba(60, 60, 60, 0.10), 0 2px 6px rgba(60, 60, 60, 0.06)",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Top Header: Title & Icon Pill */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            color: "#7D848D",
            fontSize: "13px",
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </span>
        <span
          className="icon-pill"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2d4a23",
          }}
        >
          {icon}
        </span>
      </div>

      {!metric ? (
        <div
          style={{ padding: "18px 0 10px", color: "#999", fontSize: "12px" }}
        >
          No data available
        </div>
      ) : (
        <>
          {/* Main Count */}
          <div
            className="value"
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#1f1f1f",
              marginBottom: "4px",
            }}
          >
            {formattedCount}
          </div>

          {/* Delta indicator */}
          <div
            className={`delta ${isDown ? "down" : "up"}`}
            style={{
              fontSize: "11px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: isDown ? "#e03131" : "#34A853",
              fontWeight: 500,
            }}
          >
            {metric.formatted_text ? (
              isDown ? (
                <span>&darr;{metric.formatted_text}</span>
              ) : metric.trend === "up" ? (
                <span>&uarr;{metric.formatted_text}</span>
              ) : (
                <span>{metric.formatted_text}</span>
              )
            ) : (
              <span style={{ color: "#999" }}>No change data</span>
            )}
          </div>

          {/* Sparkline Chart Container (Pure SVG with zero circular points) */}
          <div
            className="chart"
            style={{
              marginTop: "6px",
              height: "56px",
              width: "100%",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {graphData.length === 0 ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#bbb",
                  fontSize: "10px",
                }}
              >
                No trend data
              </div>
            ) : (
              <svg
                width="100%"
                height="56"
                viewBox="0 0 200 56"
                preserveAspectRatio="none"
                style={{ display: "block" }}
              >
                <defs>
                  {isDown ? (
                    <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#e88080"
                        stopOpacity="0.55"
                      />
                      <stop offset="100%" stopColor="#e88080" stopOpacity="0" />
                    </linearGradient>
                  ) : (
                    <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#34A853" stopOpacity="1" />
                      <stop offset="100%" stopColor="#34A853" stopOpacity="0" />
                    </linearGradient>
                  )}
                </defs>

                {/* Area Gradient Fill */}
                <path d={areaPath} fill={`url(#${gradId})`} />

                {/* Continuous Line Stroke (NO CIRCLES) */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={isDown ? "#d24a4a" : "#34A853"}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* User by States Component                                                   */
/* -------------------------------------------------------------------------- */
interface UsersByStatesProps {
  data?: { state: string; count: number }[];
  currentLimit: string;
  onLimitChange: (limit: string) => void;
  loading?: boolean;
}

function UsersByStatesCard({
  data = [],
  currentLimit,
  onLimitChange,
  loading = false,
}: UsersByStatesProps) {
  const safeData = data || [];
  const maxCount = useMemo(() => {
    if (!safeData || safeData.length === 0) return 5;
    const max = Math.max(...safeData.map((d) => d.count || 0));
    if (max <= 5) return 5;
    if (max <= 10) return 10;
    if (max <= 50) return Math.ceil(max / 10) * 10;
    if (max <= 500) return Math.ceil(max / 50) * 50;
    if (max <= 1000) return Math.ceil(max / 100) * 100;
    return Math.ceil(max / 500) * 500;
  }, [safeData]);

  const ticks = useMemo(() => {
    const step = maxCount / 4;
    return [
      0,
      Math.round(step),
      Math.round(step * 2),
      Math.round(step * 3),
      maxCount,
    ];
  }, [maxCount]);

  return (
    <div
      className="card states-card"
      style={{
        background: "#fff",
        borderRadius: "14px",
        padding: "16px",
        boxShadow:
          "0 6px 20px rgba(60, 60, 60, 0.10), 0 2px 6px rgba(60, 60, 60, 0.06)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
      }}
    >
      {/* States Header */}
      <div
        className="states-head"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          marginBottom: "14px",
          paddingBottom: "12px",
          borderBottom: "1px solid #ececec",
        }}
      >
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#1f1f1f",
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          User by States
        </h3>

        <select
          value={currentLimit}
          onChange={(e) => onLimitChange(e.target.value)}
          disabled={loading}
          aria-label="Filter states"
          style={{
            fontSize: "11.5px",
            color: "#666",
            border: "1px solid #ececec",
            borderRadius: "6px",
            padding: "5px 26px 5px 10px",
            backgroundColor: "#fff",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="top10">Top 10 States</option>
          <option value="top5">Top 5 States</option>
          <option value="top3">Top 3 States</option>
          <option value="all">All States</option>
        </select>
      </div>

      {/* SVG Bar Chart Body */}
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: "220px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Background Vertical Grid Lines */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: "26px",
            left: "84px",
            right: "24px",
            display: "flex",
            justifyContent: "space-between",
            pointerEvents: "none",
            opacity: 0.5,
          }}
        >
          {ticks.map((_, i) => (
            <div
              key={i}
              style={{
                height: "100%",
                borderRight: "1px dashed #e2e8f0",
              }}
            />
          ))}
        </div>

        {/* States Bars List */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            paddingTop: "6px",
            paddingBottom: "8px",
            maxHeight: "310px",
            overflowY: "auto",
          }}
        >
          {safeData.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "#999",
                fontSize: "12px",
              }}
            >
              No state data available.
            </div>
          ) : (
            safeData.map((item) => {
              const widthPct = Math.min(
                100,
                Math.max(4, (item.count / maxCount) * 100),
              );
              return (
                <div
                  key={item.state}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      width: "74px",
                      textAlign: "right",
                      fontSize: "11px",
                      color: "#666",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={item.state}
                  >
                    {item.state}
                  </span>

                  <div
                    style={{
                      flex: 1,
                      backgroundColor: "transparent",
                      height: "10px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: `${widthPct}%`,
                        height: "10px",
                        backgroundColor: "#3a5230",
                        borderRadius: "2px",
                        transition: "width 0.4s ease-out",
                      }}
                    />
                  </div>

                  <span
                    style={{
                      width: "20px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#1f1f1f",
                      textAlign: "left",
                    }}
                  >
                    {item.count}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* X-axis ticks */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingLeft: "84px",
            paddingRight: "24px",
            fontSize: "9px",
            color: "#888",
            paddingTop: "8px",
            borderTop: "1px solid #f0f0ec",
          }}
        >
          {ticks.map((t, idx) => (
            <span key={idx} style={{ transform: "translateX(-50%)" }}>
              {t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Membership Conversion Component                                            */
/* -------------------------------------------------------------------------- */
interface MembershipConversionProps {
  totalUsers?: number;
  breakdown?: {
    level: string;
    name: string;
    count: number;
    percentage: number;
  }[];
  period: string;
  onPeriodChange: (period: string) => void;
  loading?: boolean;
}

const DONUT_COLORS: Record<string, string> = {
  free: "#3a5230",
  basic: "#d4c79a",
  premium: "#5da3f5",
};

function MembershipConversionCard({
  totalUsers = 0,
  breakdown = [],
  period,
  onPeriodChange,
  loading = false,
}: MembershipConversionProps) {
  const safeBreakdown = breakdown || [];
  let accumulated = 0;
  const segments = safeBreakdown.map((item) => {
    const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
    const strokeDashoffset = -accumulated;
    accumulated += item.percentage;
    const color = DONUT_COLORS[item.level?.toLowerCase()] || "#64748b";
    return { ...item, color, strokeDasharray, strokeDashoffset };
  });

  return (
    <div
      className="card"
      style={{
        background: "#fff",
        borderRadius: "14px",
        padding: "16px",
        boxShadow:
          "0 6px 20px rgba(60, 60, 60, 0.10), 0 2px 6px rgba(60, 60, 60, 0.06)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Header */}
      <div
        className="panel-head"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          marginBottom: "14px",
          paddingBottom: "12px",
          borderBottom: "1px solid #ececec",
        }}
      >
        <h3
          style={{
            fontSize: "14.5px",
            fontWeight: 600,
            color: "#1f1f1f",
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          Membership Conversion
        </h3>

        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value)}
          disabled={loading}
          aria-label="Filter period"
          style={{
            fontSize: "11.5px",
            color: "#666",
            border: "1px solid #ececec",
            borderRadius: "6px",
            padding: "5px 26px 5px 10px",
            backgroundColor: "#fff",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Donut and Legend Wrap */}
      {safeBreakdown.length === 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "50px 0",
            color: "#999",
            fontSize: "12px",
            flex: 1,
          }}
        >
          No conversion data available.
        </div>
      ) : (
        <div
          className="donut-wrap"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            padding: "8px 0",
          }}
        >
          {/* SVG Donut */}
          <div
            style={{ width: "220px", height: "220px", position: "relative" }}
          >
            <svg width="220" height="220" viewBox="0 0 200 200">
              <g transform="rotate(-90 100 100)">
                {segments.map((seg) => (
                  <circle
                    key={seg.level}
                    cx="100"
                    cy="100"
                    r="70"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="34"
                    pathLength="100"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    className="transition-all duration-500"
                  />
                ))}
              </g>
              {/* Center Total Count */}
              <text
                x="100"
                y="98"
                textAnchor="middle"
                fontSize="20"
                fontWeight="700"
                fill="#1f1f1f"
              >
                {totalUsers.toLocaleString()}
              </text>
              <text
                x="100"
                y="116"
                textAnchor="middle"
                fontSize="10"
                fill="#888"
              >
                Total Users
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div
            className="legend"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              fontSize: "12px",
              minWidth: "160px",
            }}
          >
            {safeBreakdown.map((item) => {
              const color =
                DONUT_COLORS[item.level?.toLowerCase()] || "#64748b";
              return (
                <div
                  key={item.level}
                  className="row"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <span
                    className="sw"
                    style={{
                      width: "9px",
                      height: "9px",
                      borderRadius: "50%",
                      marginTop: "4px",
                      backgroundColor: color,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: "#1f1f1f" }}>
                      {item.name}
                    </div>
                    <div
                      style={{
                        color: "#7D848D",
                        fontSize: "11px",
                        marginTop: "1px",
                      }}
                    >
                      {item.percentage}% ({item.count})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Dashboard Page                                                        */
/* -------------------------------------------------------------------------- */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [period, setPeriod] = useState<string>("30d");
  const [stateLimit, setStateLimit] = useState<string>("top10");

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getDashboardOverview(period, stateLimit);
      if (res && res.data) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (err: any) {
      console.error("Dashboard overview API error:", err);
      setData(null);
      if (isManualRefresh) {
        toast.error("Failed to refresh dashboard data.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period, stateLimit]);

  return (
    <div style={{ paddingBottom: "40px" }}>
      {/* Top Header bar with refresh */}
      {/* <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#1f1f1f",
              margin: 0,
            }}
          >
            Dashboard Overview
          </h2>
          <p
            style={{
              fontSize: "12px",
              color: "#7D848D",
              margin: "2px 0 0 0",
            }}
          >
            Overview of users, memberships, and platform revenue
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing || loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 14px",
            backgroundColor: "#fff",
            border: "1px solid #ececec",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 500,
            color: "#333",
            cursor: refreshing || loading ? "not-allowed" : "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <RefreshCw
            style={{
              width: "13px",
              height: "13px",
              color: "#0E3E27",
              animation: refreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div> */}

      {loading && !data ? (
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "80px 20px",
            textAlign: "center",
            boxShadow:
              "0 6px 20px rgba(60, 60, 60, 0.10), 0 2px 6px rgba(60, 60, 60, 0.06)",
          }}
        >
          <RefreshCw
            style={{
              width: "28px",
              height: "28px",
              color: "#0E3E27",
              animation: "spin 1s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p
            style={{
              color: "#7D848D",
              fontSize: "14px",
              fontWeight: 500,
              margin: 0,
            }}
          >
            Loading dashboard data...
          </p>
        </div>
      ) : !data ? (
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "80px 20px",
            textAlign: "center",
            boxShadow:
              "0 6px 20px rgba(60, 60, 60, 0.10), 0 2px 6px rgba(60, 60, 60, 0.06)",
          }}
        >
          <p
            style={{
              color: "#1f1f1f",
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "6px",
            }}
          >
            No data available
          </p>
          <p
            style={{ color: "#7D848D", fontSize: "13px", marginBottom: "18px" }}
          >
            Dashboard overview metrics are currently unavailable.
          </p>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 18px",
              backgroundColor: "#0E3E27",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 500,
              color: "#fff",
              cursor: refreshing ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw
              style={{
                width: "14px",
                height: "14px",
                color: "#fff",
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            <span>{refreshing ? "Refreshing..." : "Retry"}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Grid: 4 columns for stats + 1.9fr column for states-card (matching style.css) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            {/* Row 1 Stats */}
            {/* Total Users */}
            <MetricCard
              id="total-users"
              label="Total Users"
              metric={data?.total_users}
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ width: "24px", height: "24px" }}
                >
                  <circle cx="9" cy="8" r="3.6" />
                  <path d="M2 21c0-3.87 3.13-7 7-7s7 3.13 7 7H2z" />
                  <circle cx="17" cy="9" r="2.6" />
                  <path d="M14.5 14.7c.79-.45 1.7-.7 2.5-.7 2.76 0 5 2.24 5 5h-5.5c0-1.6-.78-3.07-2-4.3z" />
                </svg>
              }
            />

            {/* Active Users */}
            <MetricCard
              id="active-users"
              label="Active Users"
              metric={data?.active_users}
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ width: "24px", height: "24px" }}
                >
                  <circle cx="12" cy="8" r="4.2" />
                  <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8z" />
                </svg>
              }
            />

            {/* Free Members */}
            <MetricCard
              id="free-members"
              label="Free Members"
              metric={data?.free_members}
              icon={
                <img
                  src="/images/free-member.png"
                  alt=""
                  width={22}
                  height={22}
                  style={{ objectFit: "contain" }}
                />
              }
            />

            {/* Premium Members */}
            <MetricCard
              id="premium-members"
              label="Premium Members"
              metric={data?.premium_members}
              icon={
                <img
                  src="/images/premium-member.png"
                  alt=""
                  width={22}
                  height={22}
                  style={{ objectFit: "contain" }}
                />
              }
              forceTheme="down"
            />

            {/* User by States (Spans 2 rows on xl screens) */}
            <div className="md:col-span-2 lg:col-span-3 xl:col-span-1 xl:row-span-2">
              <UsersByStatesCard
                data={data?.users_by_state?.data}
                currentLimit={stateLimit}
                onLimitChange={(lim) => setStateLimit(lim)}
                loading={loading}
              />
            </div>

            {/* Row 2 Stats */}
            {/* Expiring Memberships */}
            <MetricCard
              id="expiring-members"
              label="Expiring Memberships"
              metric={data?.expiring_expired_members}
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e03131"
                  strokeWidth="2"
                  style={{ width: "24px", height: "24px" }}
                >
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15.5 14" />
                </svg>
              }
              forceTheme="down"
            />

            {/* Licenses Uploaded */}
            <MetricCard
              id="licenses-uploaded"
              label="Licenses Uploaded"
              metric={data?.licenses_uploaded}
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ width: "24px", height: "24px" }}
                >
                  <path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2H2V7zm0 4h20v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6zm3 3v2h5v-2H5z" />
                </svg>
              }
            />

            {/* Basic Members */}
            <MetricCard
              id="basic-members"
              label="Basic Members"
              metric={data?.basic_members}
              icon={
                <Shield
                  style={{ width: "22px", height: "22px", color: "#2d4a23" }}
                />
              }
            />

            {/* Revenue This Month */}
            <MetricCard
              id="revenue-month"
              label="Revenue This Month"
              metric={data?.revenue_this_month}
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ width: "24px", height: "24px" }}
                >
                  <path d="M12 3L3 21h18L12 3zm0 5l5.5 11h-11L12 8z" />
                  <path d="M9 17h6v1.5H9z" />
                </svg>
              }
              isCurrency={true}
            />
          </div>

          {/* Lower Section: Membership Conversion Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <MembershipConversionCard
                totalUsers={data?.membership_conversion?.total_users}
                breakdown={data?.membership_conversion?.breakdown}
                period={period}
                onPeriodChange={(p) => setPeriod(p)}
                loading={loading}
              />
            </div>

            {/* Activity & Conversion Metrics Breakdown */}
          </div>
        </>
      )}
    </div>
  );
}
