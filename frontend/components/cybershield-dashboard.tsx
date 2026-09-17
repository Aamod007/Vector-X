"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertOctagon,
  ArrowUpRight,
  BarChart2,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Globe,
  Grid,
  Info,
  Laptop,
  Layers,
  LineChart,
  PieChart,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Table,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { ThreatMapGL } from "./threat-map-gl";

export type TrendViewMode = "line" | "area" | "bar" | "heatmap";
export type ThreatTypeViewMode = "donut" | "bar" | "table";
export type SourceViewMode = "bar" | "table" | "donut";
export type VulnViewMode = "donut" | "bar" | "kpi";
export type VulnTableViewMode = "table" | "bar";
export type DashboardPreset = "balanced" | "trend" | "comparative" | "matrix" | "tabular";

export function CyberShieldDashboard() {
  const {
    filters,
    telemetry,
    activeQueryWidget,
    dynamicKpis,
    fetchTelemetry,
    setTimeRange,
    setEnvironment,
    setSearchQuery,
    setSeverity,
    setThreatType,
    resetFilters,
  } = useDashboardStore();

  const { activeDatasetId } = useWorkspaceStore();
  const [forceMap, setForceMap] = useState<boolean>(false);

  // Visualization mode states
  const [trendMode, setTrendMode] = useState<TrendViewMode>("line");
  const [threatTypeMode, setThreatTypeMode] = useState<ThreatTypeViewMode>("donut");
  const [sourceMode, setSourceMode] = useState<SourceViewMode>("bar");
  const [vulnMode, setVulnMode] = useState<VulnViewMode>("donut");
  const [vulnTableMode, setVulnTableMode] = useState<VulnTableViewMode>("table");
  const [activePreset, setActivePreset] = useState<DashboardPreset>("balanced");

  useEffect(() => {
    setForceMap(false);
  }, [activeQueryWidget]);

  useEffect(() => {
    void fetchTelemetry();
  }, [fetchTelemetry, activeDatasetId]);

  // Dynamic filter adaptation: automatically optimize visualization modes when filters change
  useEffect(() => {
    if (filters.threatType !== "all") {
      // Focused vector is best inspected as an area fill or trend line
      setTrendMode("area");
    }
  }, [filters.threatType]);

  useEffect(() => {
    if (filters.severity === "critical" || filters.severity === "high") {
      // Critical vulnerabilities are best highlighted via KPI impact or comparative bars
      setVulnMode("kpi");
      setVulnTableMode("bar");
    }
  }, [filters.severity]);

  useEffect(() => {
    if (filters.searchQuery.trim().length > 0) {
      // Search active: switch sources to table for clear row identification
      setSourceMode("table");
    }
  }, [filters.searchQuery]);

  // Dashboard preset switcher handler
  const applyPreset = (preset: DashboardPreset) => {
    setActivePreset(preset);
    if (preset === "balanced") {
      setTrendMode("line");
      setThreatTypeMode("donut");
      setSourceMode("bar");
      setVulnMode("donut");
      setVulnTableMode("table");
    } else if (preset === "trend") {
      setTrendMode("area");
      setThreatTypeMode("donut");
      setSourceMode("bar");
      setVulnMode("donut");
      setVulnTableMode("table");
    } else if (preset === "comparative") {
      setTrendMode("bar");
      setThreatTypeMode("bar");
      setSourceMode("bar");
      setVulnMode("bar");
      setVulnTableMode("bar");
    } else if (preset === "matrix") {
      setTrendMode("heatmap");
      setThreatTypeMode("bar");
      setSourceMode("table");
      setVulnMode("donut");
      setVulnTableMode("table");
    } else if (preset === "tabular") {
      setTrendMode("heatmap");
      setThreatTypeMode("table");
      setSourceMode("table");
      setVulnMode("bar");
      setVulnTableMode("table");
    }
  };

  // Scaled multipliers based on active time range or environment
  const multiplier = useMemo(() => {
    let m = 1.0;
    if (filters.timeRange === "24h") m *= 0.18;
    if (filters.timeRange === "7d") m *= 0.45;
    if (filters.timeRange === "all") m *= 1.35;
    if (filters.environment === "production") m *= 0.6;
    if (filters.environment === "staging") m *= 0.25;
    if (filters.environment === "corporate") m *= 0.15;
    return m;
  }, [filters.timeRange, filters.environment]);

  // Real KPIs from telemetry
  const kpis = useMemo(() => {
    const baseThreats = telemetry?.kpi?.totalThreats ?? 5023;
    const baseIncidents = telemetry?.kpi?.activeIncidents ?? 4865;
    const baseBlocked = telemetry?.kpi?.blockedAttacks ?? 6716;
    const baseAssets = telemetry?.kpi?.assetsMonitored ?? 2829;

    let threats = Math.round(baseThreats * multiplier);
    let incidents = Math.max(1, Math.round(baseIncidents * multiplier));
    let blocked = Math.round(baseBlocked * multiplier);
    let assets = baseAssets;

    if (filters.severity === "critical") {
      threats = telemetry?.vulnerabilityStatus?.critical ?? 790;
      incidents = Math.max(1, Math.round(threats * 0.4));
    } else if (filters.severity === "high") {
      threats = telemetry?.vulnerabilityStatus?.high ?? 1805;
      incidents = Math.max(1, Math.round(threats * 0.5));
    }

    if (filters.threatType !== "all" && telemetry?.threatsByType) {
      const match = telemetry.threatsByType.find(
        (t) => t.label.toLowerCase() === filters.threatType.toLowerCase()
      );
      if (match) {
        threats = match.value;
      }
    }

    return {
      threats,
      threatsDelta: telemetry?.kpi?.threatsDelta ?? "+12%",
      incidents,
      incidentsDelta: telemetry?.kpi?.incidentsDelta ?? "+28%",
      blocked,
      blockedDelta: telemetry?.kpi?.blockedDelta ?? "+35%",
      assets,
      assetsDelta: telemetry?.kpi?.assetsDelta ?? "+5%",
    };
  }, [telemetry, multiplier, filters.severity, filters.threatType]);

  // Threat trend data points from real telemetry timeline
  const trendPoints = useMemo(() => {
    if (telemetry?.timeline && telemetry.timeline.length > 0) {
      return telemetry.timeline.map((pt) => ({
        date: pt.date,
        malware: Math.round(pt.malware * multiplier),
        phishing: Math.round(pt.phishing * multiplier),
        intrusion: Math.round(pt.intrusion * multiplier),
        ddos: Math.round(pt.ddos * multiplier),
      }));
    }
    const dates = ["Aug 17", "Aug 21", "Aug 25", "Aug 29", "Sep 02", "Sep 06", "Sep 10", "Sep 14"];
    const baseMalware = [48, 65, 92, 120, 145, 110, 168, 185];
    const basePhishing = [32, 45, 58, 82, 98, 75, 112, 128];
    const baseIntrusion = [18, 24, 35, 48, 62, 44, 70, 82];
    const baseDDoS = [12, 16, 22, 28, 35, 25, 42, 48];

    return dates.map((d, i) => ({
      date: d,
      malware: Math.round(baseMalware[i] * multiplier),
      phishing: Math.round(basePhishing[i] * multiplier),
      intrusion: Math.round(baseIntrusion[i] * multiplier),
      ddos: Math.round(baseDDoS[i] * multiplier),
    }));
  }, [telemetry?.timeline, multiplier]);

  // SVG coordinate calculations for smooth trend curves
  const maxTrend = useMemo(() => {
    const highest = Math.max(
      ...trendPoints.flatMap((pt) => [pt.malware, pt.phishing, pt.intrusion, pt.ddos]),
      180
    );
    return Math.ceil(highest / 50) * 50;
  }, [trendPoints]);

  const svgW = 420;
  const svgH = 110;
  const padX = 25;
  const padY = 10;
  const chartW = svgW - padX * 2;
  const chartH = svgH - padY * 2;

  const getPointsStr = (key: "malware" | "phishing" | "intrusion" | "ddos") => {
    return trendPoints
      .map((pt, idx) => {
        const x = padX + (idx / Math.max(1, trendPoints.length - 1)) * chartW;
        const y = padY + chartH - (Math.min(pt[key], maxTrend) / maxTrend) * chartH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  // Real Threats By Type Donut calculations
  const threatsByTypeData = useMemo(() => {
    const items = telemetry?.threatsByType || [
      { label: "Malware", value: 1714, color: "#ef4444" },
      { label: "Phishing", value: 1050, color: "#3b82f6" },
      { label: "Intrusion", value: 842, color: "#8b5cf6" },
      { label: "DDoS", value: 320, color: "#10b981" },
      { label: "Ransomware", value: 1097, color: "#f59e0b" },
      { label: "Other", value: 400, color: "#64748b" },
    ];
    const total = items.reduce((acc, cur) => acc + cur.value, 0) || 1;
    const circumference = 2 * Math.PI * 42;

    let currentOffset = 0;
    const segments = items.map((item) => {
      const fraction = item.value / total;
      const arcLength = fraction * circumference;
      const dasharray = `${arcLength.toFixed(1)} ${(circumference - arcLength).toFixed(1)}`;
      const dashoffset = -currentOffset;
      currentOffset += arcLength;
      const pct = Math.round(fraction * 100);
      return {
        ...item,
        pct,
        dasharray,
        dashoffset: dashoffset.toFixed(1),
        isActive: filters.threatType !== "all" && filters.threatType.toLowerCase() === item.label.toLowerCase(),
      };
    });

    return { total, segments, items };
  }, [telemetry?.threatsByType, filters.threatType]);

  // Real Top Threat Sources
  const threatSources = useMemo(() => {
    if (telemetry?.topThreatSources && telemetry.topThreatSources.length > 0) {
      return telemetry.topThreatSources;
    }
    return [
      { country: "India", count: 7682, color: "#ef4444" },
      { country: "Russia", count: 5113, color: "#3b82f6" },
      { country: "United States", count: 5112, color: "#8b5cf6" },
      { country: "China", count: 5068, color: "#10b981" },
      { country: "Germany", count: 98, color: "#f59e0b" },
      { country: "Singapore", count: 62, color: "#64748b" },
    ];
  }, [telemetry?.topThreatSources]);

  const maxSourceCount = useMemo(() => {
    return Math.max(...threatSources.map((s) => s.count), 100);
  }, [threatSources]);

  // Real Vulnerability Status
  const vulnStatus = useMemo(() => {
    return (
      telemetry?.vulnerabilityStatus || {
        total: 2829,
        critical: 790,
        high: 1805,
        medium: 3152,
        low: 2493,
        informational: 126,
      }
    );
  }, [telemetry?.vulnerabilityStatus]);

  const vulnDonutData = useMemo(() => {
    const items = [
      { label: "Critical", key: "critical", value: vulnStatus.critical, color: "#ef4444" },
      { label: "High", key: "high", value: vulnStatus.high, color: "#f97316" },
      { label: "Medium", key: "medium", value: vulnStatus.medium, color: "#f59e0b" },
      { label: "Low", key: "low", value: vulnStatus.low, color: "#3b82f6" },
      { label: "Informational", key: "informational", value: vulnStatus.informational, color: "#94a3b8" },
    ];
    const total = items.reduce((acc, cur) => acc + cur.value, 0) || 1;
    const circumference = 2 * Math.PI * 42;

    let currentOffset = 0;
    const segments = items.map((item) => {
      const fraction = item.value / total;
      const arcLength = fraction * circumference;
      const dasharray = `${arcLength.toFixed(1)} ${(circumference - arcLength).toFixed(1)}`;
      const dashoffset = -currentOffset;
      currentOffset += arcLength;
      return {
        ...item,
        dasharray,
        dashoffset: dashoffset.toFixed(1),
        isActive: filters.severity !== "all" && filters.severity.toLowerCase() === item.key,
      };
    });

    return { total: vulnStatus.total, segments, items };
  }, [vulnStatus, filters.severity]);

  // Real Recent Security Incidents with live filter
  const recentIncidents = useMemo(() => {
    const raw = telemetry?.recentIncidents || [];
    return raw.filter((row) => {
      if (filters.severity !== "all" && row.severity.toLowerCase() !== filters.severity.toLowerCase()) {
        return false;
      }
      if (filters.threatType !== "all") {
        const rowText = `${row.incident} ${row.status}`.toLowerCase();
        if (!rowText.includes(filters.threatType.toLowerCase())) {
          return false;
        }
      }
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const rowText = `${row.time} ${row.severity} ${row.incident} ${row.source} ${row.status}`.toLowerCase();
        if (!rowText.includes(q)) return false;
      }
      return true;
    });
  }, [telemetry?.recentIncidents, filters.severity, filters.threatType, filters.searchQuery]);

  // Real Top Targeted Vulnerabilities with live filter
  const topVulns = useMemo(() => {
    const raw = telemetry?.topVulnerabilities || [];
    return raw.filter((vuln) => {
      if (filters.severity !== "all" && vuln.severity.toLowerCase() !== filters.severity.toLowerCase()) {
        return false;
      }
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const vulnText = `${vuln.cveId} ${vuln.severity} ${vuln.description}`.toLowerCase();
        if (!vulnText.includes(q)) return false;
      }
      return true;
    });
  }, [telemetry?.topVulnerabilities, filters.severity, filters.searchQuery]);

  const maxVulnAssets = useMemo(() => {
    return Math.max(...topVulns.map((v) => v.affectedAssets || 0), 10);
  }, [topVulns]);

  // Real Security Posture Score
  const posture = useMemo(() => {
    return (
      telemetry?.securityPosture || {
        score: 78,
        categories: [
          { name: "Identity & Access", score: 82, color: "#3b82f6" },
          { name: "Network Security", score: 76, color: "#06b6d4" },
          { name: "Endpoint Security", score: 71, color: "#eab308" },
          { name: "Data Protection", score: 85, color: "#10b981" },
          { name: "Compliance", score: 79, color: "#8b5cf6" },
        ],
      }
    );
  }, [telemetry?.securityPosture]);

  // Real Compliance Status list from telemetry
  const complianceList = useMemo(() => {
    return (
      telemetry?.complianceStatus || [
        { name: "ISO 27001", control: "A.9 Access Control", score: "92% Adherence", status: "Compliant", type: "success" as const },
        { name: "SOC 2 Type II", control: "CC6.1 Perimeter Gateway", score: "73% Drop Ratio", status: "Compliant", type: "success" as const },
        { name: "GDPR Art. 32", control: "Security of Processing", score: "74% Coverage", status: "In Progress", type: "warning" as const },
        { name: "HIPAA Security", control: "§164.312 Complete Audit Trail", score: "100% Audit Logged", status: "Compliant", type: "success" as const },
        { name: "PCI DSS 4.0", control: "Req 1 & 8 Auth Hardening", score: "78% Baseline", status: "Non-Compliant", type: "danger" as const },
      ]
    );
  }, [telemetry?.complianceStatus]);

  const showDynamicWidget = Boolean(activeQueryWidget && activeQueryWidget.type !== "map" && !forceMap);

  const hasActiveFilters =
    filters.severity !== "all" ||
    filters.threatType !== "all" ||
    filters.searchQuery.trim() !== "";

  return (
    <div className="cybershield-canvas-root light-theme">
      {/* ─── TOP CANVAS HEADER BAR ─── */}
      <header className="cs-topbar">
        <div className="cs-topbar-search">
          <Search size={14} className="cs-search-icon" />
          <input
            type="text"
            placeholder="Search threats, assets, or logs..."
            value={filters.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {filters.searchQuery && (
            <button
              type="button"
              className="cs-clear-search-btn"
              onClick={() => setSearchQuery("")}
              title="Clear search"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="cs-topbar-actions">
          <button
            type="button"
            className="cs-pill-btn"
            onClick={() => {
              const next: Record<string, any> = { "24h": "7d", "7d": "30d", "30d": "all", all: "24h" };
              setTimeRange(next[filters.timeRange]);
            }}
            title="Click to toggle time period"
          >
            <Calendar size={13} style={{ color: "#64748b" }} />
            <span>
              {filters.timeRange === "24h"
                ? "Last 24 hours"
                : filters.timeRange === "7d"
                ? "Last 7 days"
                : filters.timeRange === "30d"
                ? "Last 30 days"
                : "All Time"}
            </span>
            <ChevronDown size={12} style={{ color: "#94a3b8" }} />
          </button>

          <button
            type="button"
            className="cs-pill-btn"
            onClick={() => {
              const nextEnv: Record<string, any> = {
                all: "production",
                production: "staging",
                staging: "corporate",
                corporate: "cloud",
                cloud: "all",
              };
              setEnvironment(nextEnv[filters.environment]);
            }}
            title="Click to switch environment"
          >
            <Globe size={13} style={{ color: "#64748b" }} />
            <span>
              {filters.environment === "all"
                ? "All Environments"
                : filters.environment === "production"
                ? "Production Cloud"
                : filters.environment === "staging"
                ? "Staging VPC"
                : filters.environment === "corporate"
                ? "Corporate"
                : "Cloud AWS/Azure"}
            </span>
            <ChevronDown size={12} style={{ color: "#94a3b8" }} />
          </button>

          <button type="button" className="cs-icon-btn" title="Alerts & Notifications">
            <Bell size={15} />
            <span className="cs-alert-badge-dot" />
          </button>

          <div className="cs-avatar" title="Security Admin (YP)">
            <span>YP</span>
          </div>
        </div>
      </header>

      {/* ─── ACTIVE FILTER & PRESET RIBBON ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          padding: "6px 16px",
          background: hasActiveFilters ? "rgba(37, 99, 235, 0.05)" : "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          fontSize: "11.5px",
          color: "#1e293b",
        }}
      >
        {/* Left: Active Filter Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {hasActiveFilters && (
            <span style={{ fontWeight: 600, color: "#2563eb", display: "flex", alignItems: "center", gap: "4px" }}>
              Active Filters:
            </span>
          )}

          {filters.severity !== "all" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "12px",
                background: "#fee2e2",
                color: "#991b1b",
                fontWeight: 600,
                fontSize: "11px",
              }}
            >
              Severity: {filters.severity.toUpperCase()}
              <X size={11} style={{ cursor: "pointer" }} onClick={() => setSeverity("all")} />
            </span>
          )}

          {filters.threatType !== "all" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "12px",
                background: "#e0e7ff",
                color: "#3730a3",
                fontWeight: 600,
                fontSize: "11px",
              }}
            >
              Vector: {filters.threatType}
              <X size={11} style={{ cursor: "pointer" }} onClick={() => setThreatType("all")} />
            </span>
          )}

          {filters.searchQuery && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "12px",
                background: "#f1f5f9",
                color: "#334155",
                fontWeight: 600,
                fontSize: "11px",
              }}
            >
              Query: &quot;{filters.searchQuery}&quot;
              <X size={11} style={{ cursor: "pointer" }} onClick={() => setSearchQuery("")} />
            </span>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                background: "none",
                border: "none",
                color: "#2563eb",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <RotateCcw size={11} /> Reset Filters
            </button>
          )}
        </div>

        {/* Right: Dynamic Visualization Mode Presets */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 600 }}>View Mode:</span>
          <div className="cs-chart-toggle-group">
            <button
              type="button"
              className={`cs-chart-toggle-btn ${activePreset === "balanced" ? "is-active" : ""}`}
              onClick={() => applyPreset("balanced")}
              title="Balanced Overview (Line, Donut, Bar)"
            >
              Overview
            </button>
            <button
              type="button"
              className={`cs-chart-toggle-btn ${activePreset === "trend" ? "is-active" : ""}`}
              onClick={() => applyPreset("trend")}
              title="Time-Series Focus (Area & Line)"
            >
              Time-Series
            </button>
            <button
              type="button"
              className={`cs-chart-toggle-btn ${activePreset === "comparative" ? "is-active" : ""}`}
              onClick={() => applyPreset("comparative")}
              title="Comparative Bars (Bar Charts)"
            >
              Bars
            </button>
            <button
              type="button"
              className={`cs-chart-toggle-btn ${activePreset === "matrix" ? "is-active" : ""}`}
              onClick={() => applyPreset("matrix")}
              title="Matrix & Heatmap View"
            >
              Heatmap
            </button>
            <button
              type="button"
              className={`cs-chart-toggle-btn ${activePreset === "tabular" ? "is-active" : ""}`}
              onClick={() => applyPreset("tabular")}
              title="Tabular & Audit Data Tables"
            >
              Tabular
            </button>
          </div>
        </div>
      </div>

      {/* ─── ROW 1: 4 KPI METRIC TILES ─── */}
      <section className="cs-kpi-row">
        {dynamicKpis && dynamicKpis.length === 4 ? (
          dynamicKpis.map((kpi, idx) => (
            <div
              key={idx}
              className="cs-kpi-card"
              style={{
                borderLeft: `3px solid ${
                  kpi.type === "danger"
                    ? "#ef4444"
                    : kpi.type === "warning"
                    ? "#f59e0b"
                    : kpi.type === "success"
                    ? "#10b981"
                    : "#2563eb"
                }`,
                animation: "fadeIn 0.3s ease",
              }}
            >
              <div
                className="cs-kpi-icon-wrap"
                style={{
                  background:
                    kpi.type === "danger"
                      ? "rgba(239, 68, 68, 0.1)"
                      : kpi.type === "warning"
                      ? "rgba(245, 158, 11, 0.1)"
                      : kpi.type === "success"
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(37, 99, 235, 0.1)",
                  color:
                    kpi.type === "danger"
                      ? "#ef4444"
                      : kpi.type === "warning"
                      ? "#f59e0b"
                      : kpi.type === "success"
                      ? "#10b981"
                      : "#2563eb",
                }}
              >
                <Sparkles size={15} />
              </div>
              <div className="cs-kpi-content">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="cs-kpi-title">{kpi.title}</span>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "#2563eb",
                      background: "rgba(37,99,235,0.08)",
                      padding: "1px 5px",
                      borderRadius: "4px",
                    }}
                  >
                    AI Insight
                  </span>
                </div>
                <div className="cs-kpi-value-line">
                  <strong className="cs-kpi-num" style={{ fontSize: "17px" }}>
                    {kpi.value}
                  </strong>
                  <span
                    className={`cs-trend-pill ${
                      kpi.type === "danger" ? "up-danger" : kpi.type === "warning" ? "up-danger" : "up-success"
                    }`}
                  >
                    <ArrowUpRight size={10} /> {kpi.delta}
                  </span>
                </div>
                <span className="cs-kpi-sub">{kpi.sub}</span>
              </div>
            </div>
          ))
        ) : (
          <>
            {/* KPI 1 */}
            <div
              className="cs-kpi-card"
              onClick={() => setSeverity("critical")}
              style={{ cursor: "pointer" }}
              title="Click to filter critical alerts"
            >
              <div className="cs-kpi-icon-wrap" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
                <AlertOctagon size={16} />
              </div>
              <div className="cs-kpi-content">
                <span className="cs-kpi-title">Total Threats Detected</span>
                <div className="cs-kpi-value-line">
                  <strong className="cs-kpi-num">{kpis.threats.toLocaleString()}</strong>
                  <span className="cs-trend-pill up-danger">
                    <ArrowUpRight size={11} /> {kpis.threatsDelta}
                  </span>
                </div>
                <span className="cs-kpi-sub">vs. previous period</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div
              className="cs-kpi-card"
              onClick={() => setSeverity("high")}
              style={{ cursor: "pointer" }}
              title="Click to filter high alerts"
            >
              <div className="cs-kpi-icon-wrap" style={{ background: "rgba(249, 115, 22, 0.1)", color: "#f97316" }}>
                <Clock size={16} />
              </div>
              <div className="cs-kpi-content">
                <span className="cs-kpi-title">Active Incidents</span>
                <div className="cs-kpi-value-line">
                  <strong className="cs-kpi-num">{kpis.incidents.toLocaleString()}</strong>
                  <span className="cs-trend-pill up-danger">
                    <ArrowUpRight size={11} /> {kpis.incidentsDelta}
                  </span>
                </div>
                <span className="cs-kpi-sub">vs. previous period</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div
              className="cs-kpi-card"
              onClick={() => setThreatType("ddos")}
              style={{ cursor: "pointer" }}
              title="Click to isolate blocked firewall attacks"
            >
              <div className="cs-kpi-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                <ShieldCheck size={16} />
              </div>
              <div className="cs-kpi-content">
                <span className="cs-kpi-title">Blocked Attacks</span>
                <div className="cs-kpi-value-line">
                  <strong className="cs-kpi-num">{kpis.blocked.toLocaleString()}</strong>
                  <span className="cs-trend-pill up-success">
                    <ArrowUpRight size={11} /> {kpis.blockedDelta}
                  </span>
                </div>
                <span className="cs-kpi-sub">vs. previous period</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div
              className="cs-kpi-card"
              onClick={() => resetFilters()}
              style={{ cursor: "pointer" }}
              title="Click to view all assets"
            >
              <div className="cs-kpi-icon-wrap" style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}>
                <Database size={16} />
              </div>
              <div className="cs-kpi-content">
                <span className="cs-kpi-title">Assets Monitored</span>
                <div className="cs-kpi-value-line">
                  <strong className="cs-kpi-num">{kpis.assets.toLocaleString()}</strong>
                  <span className="cs-trend-pill up-success">
                    <ArrowUpRight size={11} /> {kpis.assetsDelta}
                  </span>
                </div>
                <span className="cs-kpi-sub">vs. previous period</span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ─── ROW 2: 3 MAIN CHARTS ─── */}
      <section className="cs-chart-row-top">
        {/* CARD 1: Threat Activity Trend (Line vs Area vs Bar vs Heatmap Matrix) */}
        <div className="cs-card cs-card-trend">
          <div className="cs-card-header">
            <div className="cs-card-title-group">
              <h3 className="cs-card-title">Threat Activity Trend</h3>
              <Info size={12} className="cs-info-icon" />
            </div>

            {/* Dynamic Interactive Variation Switcher for Card 1 */}
            <div className="cs-card-actions">
              <div className="cs-chart-toggle-group">
                <button
                  type="button"
                  className={`cs-chart-toggle-btn ${trendMode === "line" ? "is-active" : ""}`}
                  onClick={() => setTrendMode("line")}
                  title="Switch to Line Chart"
                >
                  <LineChart size={11} />
                  <span>Line</span>
                </button>
                <button
                  type="button"
                  className={`cs-chart-toggle-btn ${trendMode === "area" ? "is-active" : ""}`}
                  onClick={() => setTrendMode("area")}
                  title="Switch to Area Chart"
                >
                  <Layers size={11} />
                  <span>Area</span>
                </button>
                <button
                  type="button"
                  className={`cs-chart-toggle-btn ${trendMode === "bar" ? "is-active" : ""}`}
                  onClick={() => setTrendMode("bar")}
                  title="Switch to Grouped Bar Chart"
                >
                  <BarChart2 size={11} />
                  <span>Bar</span>
                </button>
                <button
                  type="button"
                  className={`cs-chart-toggle-btn ${trendMode === "heatmap" ? "is-active" : ""}`}
                  onClick={() => setTrendMode("heatmap")}
                  title="Switch to Threat Heatmap Matrix"
                >
                  <Grid size={11} />
                  <span>Heatmap</span>
                </button>
              </div>
            </div>
          </div>

          <div className="cs-chart-legend-top">
            <span
              className="cs-legend-item"
              style={{ cursor: "pointer", opacity: filters.threatType === "all" || filters.threatType === "malware" ? 1 : 0.4 }}
              onClick={() => setThreatType(filters.threatType === "malware" ? "all" : "malware")}
            >
              <span className="cs-legend-dot" style={{ background: "#ef4444" }} />
              <span>Malware</span>
            </span>
            <span
              className="cs-legend-item"
              style={{ cursor: "pointer", opacity: filters.threatType === "all" || filters.threatType === "phishing" ? 1 : 0.4 }}
              onClick={() => setThreatType(filters.threatType === "phishing" ? "all" : "phishing")}
            >
              <span className="cs-legend-dot" style={{ background: "#3b82f6" }} />
              <span>Phishing</span>
            </span>
            <span
              className="cs-legend-item"
              style={{ cursor: "pointer", opacity: filters.threatType === "all" || filters.threatType === "intrusion" ? 1 : 0.4 }}
              onClick={() => setThreatType(filters.threatType === "intrusion" ? "all" : "intrusion")}
            >
              <span className="cs-legend-dot" style={{ background: "#8b5cf6" }} />
              <span>Intrusion</span>
            </span>
            <span
              className="cs-legend-item"
              style={{ cursor: "pointer", opacity: filters.threatType === "all" || filters.threatType === "ddos" ? 1 : 0.4 }}
              onClick={() => setThreatType(filters.threatType === "ddos" ? "all" : "ddos")}
            >
              <span className="cs-legend-dot" style={{ background: "#10b981" }} />
              <span>DDoS</span>
            </span>
          </div>

          <div className="cs-trend-svg-container">
            {/* VARIATION 1: LINE or AREA CHART */}
            {(trendMode === "line" || trendMode === "area") && (
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="cs-trend-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="malwareGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={trendMode === "area" ? "0.45" : "0.22"} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="phishingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={trendMode === "area" ? "0.4" : "0.18"} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="intrusionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={trendMode === "area" ? "0.35" : "0.0"} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="ddosGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={trendMode === "area" ? "0.35" : "0.0"} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guide lines */}
                {[0, 50, 100, 150, 200].map((val) => {
                  const y = padY + chartH - (val / maxTrend) * chartH;
                  return (
                    <g key={val}>
                      <line x1={padX} y1={y} x2={svgW - padX} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                      <text x={padX - 6} y={y + 3} textAnchor="end" fontSize="8" fill="#94a3b8" fontFamily="monospace">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Area fills */}
                {(trendMode === "area" || filters.threatType === "all" || filters.threatType === "malware") && (
                  <polygon
                    points={`${padX},${padY + chartH} ${getPointsStr("malware")} ${svgW - padX},${padY + chartH}`}
                    fill="url(#malwareGrad)"
                  />
                )}
                {(trendMode === "area" || filters.threatType === "all" || filters.threatType === "phishing") && (
                  <polygon
                    points={`${padX},${padY + chartH} ${getPointsStr("phishing")} ${svgW - padX},${padY + chartH}`}
                    fill="url(#phishingGrad)"
                  />
                )}
                {trendMode === "area" && (filters.threatType === "all" || filters.threatType === "intrusion") && (
                  <polygon
                    points={`${padX},${padY + chartH} ${getPointsStr("intrusion")} ${svgW - padX},${padY + chartH}`}
                    fill="url(#intrusionGrad)"
                  />
                )}
                {trendMode === "area" && (filters.threatType === "all" || filters.threatType === "ddos") && (
                  <polygon
                    points={`${padX},${padY + chartH} ${getPointsStr("ddos")} ${svgW - padX},${padY + chartH}`}
                    fill="url(#ddosGrad)"
                  />
                )}

                {/* Polylines with dynamic emphasis */}
                <polyline
                  points={getPointsStr("malware")}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={filters.threatType === "malware" ? "3.6" : filters.threatType === "all" ? "2.2" : "1.2"}
                  opacity={filters.threatType === "all" || filters.threatType === "malware" ? 1 : 0.18}
                  strokeLinecap="round"
                  style={{ transition: "stroke-width 0.25s ease, opacity 0.25s ease" }}
                />
                <polyline
                  points={getPointsStr("phishing")}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={filters.threatType === "phishing" ? "3.6" : filters.threatType === "all" ? "2.0" : "1.2"}
                  opacity={filters.threatType === "all" || filters.threatType === "phishing" ? 1 : 0.18}
                  strokeLinecap="round"
                  style={{ transition: "stroke-width 0.25s ease, opacity 0.25s ease" }}
                />
                <polyline
                  points={getPointsStr("intrusion")}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth={filters.threatType === "intrusion" ? "3.6" : filters.threatType === "all" ? "1.8" : "1.2"}
                  opacity={filters.threatType === "all" || filters.threatType === "intrusion" ? 1 : 0.18}
                  strokeLinecap="round"
                  style={{ transition: "stroke-width 0.25s ease, opacity 0.25s ease" }}
                />
                <polyline
                  points={getPointsStr("ddos")}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={filters.threatType === "ddos" ? "3.6" : filters.threatType === "all" ? "1.8" : "1.2"}
                  opacity={filters.threatType === "all" || filters.threatType === "ddos" ? 1 : 0.18}
                  strokeLinecap="round"
                  style={{ transition: "stroke-width 0.25s ease, opacity 0.25s ease" }}
                />

                {/* Bottom X-Labels */}
                {trendPoints.map((pt, idx) => {
                  const x = padX + (idx / Math.max(1, trendPoints.length - 1)) * chartW;
                  return (
                    <text key={pt.date} x={x} y={svgH - 1} textAnchor="middle" fontSize="8.5" fill="#64748b" fontFamily="sans-serif">
                      {pt.date}
                    </text>
                  );
                })}
              </svg>
            )}

            {/* VARIATION 2: GROUPED COLUMN BAR CHART */}
            {trendMode === "bar" && (
              <div className="cs-grouped-bar-container">
                {trendPoints.map((pt) => {
                  const mH = Math.max(4, Math.round((pt.malware / maxTrend) * 65));
                  const pH = Math.max(4, Math.round((pt.phishing / maxTrend) * 65));
                  const iH = Math.max(4, Math.round((pt.intrusion / maxTrend) * 65));
                  const dH = Math.max(4, Math.round((pt.ddos / maxTrend) * 65));

                  return (
                    <div key={pt.date} className="cs-grouped-col">
                      <div className="cs-grouped-bars">
                        <div
                          className="cs-grouped-bar-single"
                          style={{
                            height: `${mH}px`,
                            background: "#ef4444",
                            opacity: filters.threatType === "all" || filters.threatType === "malware" ? 1 : 0.25,
                          }}
                          title={`Malware: ${pt.malware}`}
                        />
                        <div
                          className="cs-grouped-bar-single"
                          style={{
                            height: `${pH}px`,
                            background: "#3b82f6",
                            opacity: filters.threatType === "all" || filters.threatType === "phishing" ? 1 : 0.25,
                          }}
                          title={`Phishing: ${pt.phishing}`}
                        />
                        <div
                          className="cs-grouped-bar-single"
                          style={{
                            height: `${iH}px`,
                            background: "#8b5cf6",
                            opacity: filters.threatType === "all" || filters.threatType === "intrusion" ? 1 : 0.25,
                          }}
                          title={`Intrusion: ${pt.intrusion}`}
                        />
                        <div
                          className="cs-grouped-bar-single"
                          style={{
                            height: `${dH}px`,
                            background: "#10b981",
                            opacity: filters.threatType === "all" || filters.threatType === "ddos" ? 1 : 0.25,
                          }}
                          title={`DDoS: ${pt.ddos}`}
                        />
                      </div>
                      <span style={{ fontSize: "8.5px", color: "#64748b", fontFamily: "sans-serif" }}>{pt.date}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VARIATION 3: THREAT HEATMAP MATRIX (Date x Threat Vector) */}
            {trendMode === "heatmap" && (
              <div className="cs-matrix-container">
                {/* Matrix Header */}
                <div className="cs-matrix-grid">
                  <span className="cs-matrix-header-cell" style={{ textAlign: "left" }}>
                    VECTOR
                  </span>
                  {trendPoints.map((pt) => (
                    <span key={pt.date} className="cs-matrix-header-cell">
                      {pt.date.split(" ")[1]}
                    </span>
                  ))}
                </div>

                {/* Matrix Rows */}
                {(
                  [
                    { key: "malware", label: "Malware", color: "#ef4444", baseBg: "239, 68, 68" },
                    { key: "phishing", label: "Phishing", color: "#3b82f6", baseBg: "59, 130, 246" },
                    { key: "intrusion", label: "Intrusion", color: "#8b5cf6", baseBg: "139, 92, 246" },
                    { key: "ddos", label: "DDoS", color: "#10b981", baseBg: "16, 185, 129" },
                  ] as const
                ).map((row) => (
                  <div key={row.key} className="cs-matrix-grid">
                    <div
                      className="cs-matrix-row-label"
                      style={{ cursor: "pointer" }}
                      onClick={() => setThreatType(filters.threatType === row.key ? "all" : row.key)}
                      title={`Click to filter by ${row.label}`}
                    >
                      <span className="cs-legend-dot" style={{ background: row.color }} />
                      <span style={{ fontWeight: filters.threatType === row.key ? 700 : 500 }}>{row.label}</span>
                    </div>
                    {trendPoints.map((pt) => {
                      const val = pt[row.key];
                      const alpha = Math.min(1, Math.max(0.12, val / maxTrend));
                      const isHigh = alpha > 0.6;
                      return (
                        <div
                          key={pt.date}
                          className="cs-matrix-cell"
                          style={{
                            background: `rgba(${row.baseBg}, ${alpha})`,
                            color: isHigh ? "#ffffff" : "#0f172a",
                          }}
                          onClick={() => setThreatType(row.key)}
                          title={`${row.label} on ${pt.date}: ${val} threats detected`}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: Threats by Type (Donut vs Bar vs Table) */}
        <div className="cs-card">
          <div className="cs-card-header">
            <div className="cs-card-title-group">
              <h3 className="cs-card-title">Threats by Type</h3>
              {filters.threatType !== "all" && (
                <span style={{ fontSize: "9.5px", fontWeight: 700, background: "rgba(37,99,235,0.1)", color: "#2563eb", padding: "1px 6px", borderRadius: "10px" }}>
                  {filters.threatType.toUpperCase()}
                </span>
              )}
            </div>

            {/* Dynamic Interactive Variation Switcher for Card 2 */}
            <div className="cs-chart-toggle-group">
              <button
                type="button"
                className={`cs-chart-toggle-btn ${threatTypeMode === "donut" ? "is-active" : ""}`}
                onClick={() => setThreatTypeMode("donut")}
                title="Donut Chart"
              >
                <PieChart size={11} />
                <span>Donut</span>
              </button>
              <button
                type="button"
                className={`cs-chart-toggle-btn ${threatTypeMode === "bar" ? "is-active" : ""}`}
                onClick={() => setThreatTypeMode("bar")}
                title="Ranked Bar Chart"
              >
                <BarChart3 size={11} />
                <span>Bar</span>
              </button>
              <button
                type="button"
                className={`cs-chart-toggle-btn ${threatTypeMode === "table" ? "is-active" : ""}`}
                onClick={() => setThreatTypeMode("table")}
                title="Tabular Breakdown"
              >
                <Table size={11} />
                <span>Table</span>
              </button>
            </div>
          </div>

          {/* VARIATION 1: RADIAL DONUT */}
          {threatTypeMode === "donut" && (
            <div className="cs-donut-layout">
              <div className="cs-donut-graphic">
                <svg viewBox="0 0 120 120" className="cs-donut-svg">
                  {threatsByTypeData.segments.map((seg, i) => (
                    <circle
                      key={i}
                      cx="60"
                      cy="60"
                      r="42"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={seg.isActive ? "20" : "15"}
                      strokeDasharray={seg.dasharray}
                      strokeDashoffset={seg.dashoffset}
                      strokeLinecap="butt"
                      style={{
                        transition: "stroke-width 0.2s ease, opacity 0.2s ease",
                        cursor: "pointer",
                        opacity: filters.threatType === "all" || seg.isActive ? 1 : 0.35,
                      }}
                      onClick={() => {
                        const next = seg.label.toLowerCase() as any;
                        setThreatType(filters.threatType === next ? "all" : next);
                      }}
                    />
                  ))}
                </svg>
                <div className="cs-donut-center">
                  <strong className="cs-donut-total">
                    {filters.threatType !== "all"
                      ? (
                          threatsByTypeData.items.find(
                            (it) => it.label.toLowerCase() === filters.threatType.toLowerCase()
                          )?.value || kpis.threats
                        ).toLocaleString()
                      : kpis.threats.toLocaleString()}
                  </strong>
                  <span className="cs-donut-label">
                    {filters.threatType !== "all" ? `${filters.threatType.toUpperCase()} Threats` : "Total Threats"}
                  </span>
                </div>
              </div>

              <div className="cs-donut-legend">
                {threatsByTypeData.segments.map((item) => (
                  <div
                    key={item.label}
                    className="cs-donut-legend-row"
                    style={{
                      cursor: "pointer",
                      padding: "2px 4px",
                      borderRadius: "4px",
                      background: item.isActive ? "rgba(37, 99, 235, 0.12)" : "transparent",
                      border: item.isActive ? "1px solid #bfdbfe" : "1px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                    onClick={() => {
                      const next = item.label.toLowerCase() as any;
                      setThreatType(filters.threatType === next ? "all" : next);
                    }}
                    title={`Filter by ${item.label}`}
                  >
                    <span className="cs-legend-dot" style={{ background: item.color }} />
                    <span
                      className="cs-legend-name"
                      style={{ fontWeight: item.isActive ? 700 : 500, color: item.isActive ? "#1d4ed8" : undefined }}
                    >
                      {item.label}
                    </span>
                    <strong className="cs-legend-val">{item.pct}%</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VARIATION 2: RANKED HORIZONTAL BARS */}
          {threatTypeMode === "bar" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, justifyContent: "center", padding: "2px 4px" }}>
              {threatsByTypeData.segments.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    padding: "3px 4px",
                    borderRadius: "4px",
                    background: item.isActive ? "rgba(37, 99, 235, 0.08)" : "transparent",
                  }}
                  onClick={() => {
                    const next = item.label.toLowerCase() as any;
                    setThreatType(filters.threatType === next ? "all" : next);
                  }}
                >
                  <span style={{ width: "85px", fontSize: "10.5px", fontWeight: item.isActive ? 700 : 500, color: "#1e293b", display: "flex", alignItems: "center", gap: "5px" }}>
                    <span className="cs-legend-dot" style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <div style={{ flex: 1, height: "7px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${item.pct}%`, height: "100%", background: item.color, borderRadius: "3px", transition: "width 0.3s ease" }} />
                  </div>
                  <span style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 700, color: "#0f172a", width: "42px", textAlign: "right" }}>
                    {item.value.toLocaleString()}
                  </span>
                  <span style={{ fontSize: "9.5px", color: "#64748b", width: "30px", textAlign: "right" }}>{item.pct}%</span>
                </div>
              ))}
            </div>
          )}

          {/* VARIATION 3: METRIC DATA TABLE */}
          {threatTypeMode === "table" && (
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                    <th style={{ padding: "4px" }}>Vector</th>
                    <th style={{ padding: "4px", textAlign: "right" }}>Count</th>
                    <th style={{ padding: "4px", textAlign: "right" }}>Share</th>
                    <th style={{ padding: "4px", textAlign: "center" }}>Severity</th>
                    <th style={{ padding: "4px", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {threatsByTypeData.segments.map((item) => (
                    <tr
                      key={item.label}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: item.isActive ? "rgba(37,99,235,0.06)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "4px", fontWeight: 600, color: "#1e293b" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <span className="cs-legend-dot" style={{ background: item.color }} />
                          <span>{item.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: "4px", textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>
                        {item.value.toLocaleString()}
                      </td>
                      <td style={{ padding: "4px", textAlign: "right", fontFamily: "monospace" }}>{item.pct}%</td>
                      <td style={{ padding: "4px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "8.5px",
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: "3px",
                            background: item.pct > 25 ? "#fee2e2" : "#f1f5f9",
                            color: item.pct > 25 ? "#dc2626" : "#475569",
                          }}
                        >
                          {item.pct > 25 ? "High Exposure" : "Monitored"}
                        </span>
                      </td>
                      <td style={{ padding: "4px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => {
                            const next = item.label.toLowerCase() as any;
                            setThreatType(filters.threatType === next ? "all" : next);
                          }}
                          style={{
                            background: "none",
                            border: "1px solid #bfdbfe",
                            borderRadius: "3px",
                            color: "#2563eb",
                            fontSize: "9px",
                            padding: "1px 5px",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          {item.isActive ? "Clear" : "Filter"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CARD 3: Dynamic Slot - Global Threat Map (MapLibre + Free OSM Tiles) OR Specialized AI Widget */}
        <div className="cs-card">
          <div className="cs-card-header">
            <div className="cs-card-title-group">
              <h3 className="cs-card-title">
                {showDynamicWidget && activeQueryWidget ? activeQueryWidget.title : "Global Threat Map"}
              </h3>
              <Info size={12} className="cs-info-icon" />
            </div>
            <div className="cs-card-actions">
              {activeQueryWidget && activeQueryWidget.type !== "map" ? (
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    className="cs-pill-btn"
                    style={{
                      height: "22px",
                      padding: "0 8px",
                      fontSize: "11px",
                      background: !forceMap ? "#eff6ff" : "transparent",
                      color: !forceMap ? "#2563eb" : "#64748b",
                      border: !forceMap ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                      fontWeight: !forceMap ? 600 : 400,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    onClick={() => setForceMap(false)}
                    title="View Query Analysis Widget"
                  >
                    <BarChart3 size={11} />
                    <span>Analysis</span>
                  </button>
                  <button
                    type="button"
                    className="cs-pill-btn"
                    style={{
                      height: "22px",
                      padding: "0 8px",
                      fontSize: "11px",
                      background: forceMap ? "#eff6ff" : "transparent",
                      color: forceMap ? "#2563eb" : "#64748b",
                      border: forceMap ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                      fontWeight: forceMap ? 600 : 400,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    onClick={() => setForceMap(true)}
                    title="View Geographic Map"
                  >
                    <Globe size={11} />
                    <span>Map</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="cs-pill-btn"
                  style={{ height: "22px", padding: "0 8px", fontSize: "11px" }}
                  onClick={() => resetFilters()}
                >
                  <span>All Threats</span>
                  <ChevronDown size={10} />
                </button>
              )}
            </div>
          </div>

          {showDynamicWidget ? (
            <div className="cs-dynamic-widget-wrap" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "10px 14px", overflow: "hidden" }}>
              {activeQueryWidget?.type === "top_failed_users" && (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <Users size={12} style={{ color: "#ef4444" }} />
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>Top Users with Most Failed Logins</span>
                    </div>
                    <span style={{ fontSize: "10px", color: "#ef4444", background: "#fee2e2", padding: "1px 6px", borderRadius: "10px", fontWeight: 700 }}>
                      IAM Audit Trail
                    </span>
                  </div>

                  <div style={{ margin: "4px 0", flex: 1, overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                          <th style={{ padding: "3px 2px", fontWeight: 600 }}>Rank</th>
                          <th style={{ padding: "3px 4px", fontWeight: 600 }}>User</th>
                          <th style={{ padding: "3px 4px", fontWeight: 600 }}>Dept</th>
                          <th style={{ padding: "3px 4px", fontWeight: 600, textAlign: "right" }}>Attempts</th>
                          <th style={{ padding: "3px 4px", fontWeight: 600, textAlign: "center" }}>Severity</th>
                          <th style={{ padding: "3px 4px", fontWeight: 600 }}>Failure Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          activeQueryWidget.users ||
                          activeQueryWidget.topUsers ||
                          telemetry?.topFailedUsers || [
                            { username: "osha.kapur39", count: 29, severity: "Critical", department: "Finance", failureReason: "Invalid Password" },
                            { username: "oviya.acharya25", count: 27, severity: "Critical", department: "Legal", failureReason: "MFA Challenge Failed" },
                            { username: "aryan.gour66", count: 26, severity: "Critical", department: "Sales", failureReason: "MFA Challenge Failed" },
                            { username: "gagan.bhandari75", count: 24, severity: "Critical", department: "Legal", failureReason: "MFA Challenge Failed" },
                            { username: "mohini.minhas94", count: 23, severity: "Critical", department: "Operations", failureReason: "Policy Lockout" },
                          ]
                        )
                          .slice(0, 5)
                          .map((u: any, idx: number) => {
                            const isCritical = u.severity === "Critical";
                            return (
                              <tr
                                key={u.username}
                                onClick={() => setSearchQuery(u.username)}
                                style={{
                                  borderBottom: "1px solid #f1f5f9",
                                  cursor: "pointer",
                                  transition: "background 0.15s ease",
                                }}
                                className="cs-user-row"
                                title={`Click to filter dashboard by user ${u.username}`}
                              >
                                <td style={{ padding: "4px 2px", fontWeight: 700, color: "#94a3b8", fontFamily: "monospace" }}>#{idx + 1}</td>
                                <td style={{ padding: "4px 4px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    <User size={10} style={{ color: "#3b82f6", flexShrink: 0 }} />
                                    <span style={{ fontWeight: 600, color: "#1e293b", fontFamily: "monospace" }}>{u.username}</span>
                                  </div>
                                </td>
                                <td style={{ padding: "4px 4px", color: "#475569" }}>{u.department}</td>
                                <td style={{ padding: "4px 4px", textAlign: "right", fontWeight: 700, color: "#e11d48", fontFamily: "monospace" }}>{u.count}</td>
                                <td style={{ padding: "4px 4px", textAlign: "center" }}>
                                  <span
                                    style={{
                                      fontSize: "9px",
                                      fontWeight: 700,
                                      padding: "1px 5px",
                                      borderRadius: "4px",
                                      background: isCritical ? "#fee2e2" : "#fef3c7",
                                      color: isCritical ? "#dc2626" : "#d97706",
                                      border: isCritical ? "1px solid #fecaca" : "1px solid #fde68a",
                                    }}
                                  >
                                    +{u.severity}
                                  </span>
                                </td>
                                <td style={{ padding: "4px 4px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "110px" }}>
                                  {u.failureReason || "MFA Challenge Failed"}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "5px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: "#64748b" }}>
                    <span>Click any user to filter live incidents</span>
                    <button
                      type="button"
                      onClick={() => resetFilters()}
                      style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 600, fontSize: "10px" }}
                    >
                      Reset View
                    </button>
                  </div>
                </div>
              )}

              {activeQueryWidget?.type === "failed_logins_dept" && (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Top Departments with Failed Logins</span>
                    <span style={{ fontSize: "10px", color: "#ef4444", background: "#fee2e2", padding: "1px 6px", borderRadius: "10px", fontWeight: 600 }}>
                      IAM Anomaly
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "6px 0" }}>
                    {(
                      activeQueryWidget.departments || [
                        ["Legal", 249],
                        ["Finance", 182],
                        ["Operations", 172],
                        ["Sales", 171],
                        ["Procurement Team", 122],
                      ]
                    )
                      .slice(0, 4)
                      .map(([dept, cnt]) => {
                        const maxD = 280;
                        const pct = Math.min(100, Math.round((cnt / maxD) * 100));
                        return (
                          <div key={dept} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                            <span style={{ width: "95px", color: "#334155", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {dept}
                            </span>
                            <div style={{ flex: 1, height: "7px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: "#ef4444", borderRadius: "3px" }} />
                            </div>
                            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e293b", width: "35px", textAlign: "right" }}>
                              {cnt}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "6px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>Top High-Risk Users:</span>
                    {(
                      activeQueryWidget.topUsers || [
                        { username: "gagan.bhandari75", count: 24 },
                        { username: "osha.kapur39", count: 23 },
                        { username: "ira.tara4", count: 22 },
                      ]
                    )
                      .slice(0, 3)
                      .map((u) => (
                        <span
                          key={u.username}
                          onClick={() => setSearchQuery(u.username)}
                          style={{
                            fontSize: "10px",
                            padding: "1px 6px",
                            background: "#fff1f2",
                            border: "1px solid #fecdd3",
                            borderRadius: "4px",
                            color: "#e11d48",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          title={`Filter by ${u.username}`}
                        >
                          {u.username} ({u.count})
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {activeQueryWidget?.type === "firewall_protocols" && (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Protocol Traffic: Allow vs Block</span>
                    <div style={{ display: "flex", gap: "8px", fontSize: "10px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#10b981" }}>
                        <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: "#10b981" }} /> Allow
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#ef4444" }}>
                        <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: "#ef4444" }} /> Block
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "8px 0" }}>
                    {(
                      activeQueryWidget.protocols || [
                        { protocol: "TCP", allow: 8608, block: 2442, total: 11050 },
                        { protocol: "UDP", allow: 2741, block: 743, total: 3484 },
                        { protocol: "ICMP", allow: 577, block: 145, total: 722 },
                      ]
                    ).map((p) => {
                      const tot = p.total || 1;
                      const allowPct = Math.round((p.allow / tot) * 100);
                      const blockPct = 100 - allowPct;
                      return (
                        <div key={p.protocol} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                            <span style={{ fontWeight: 600, color: "#1e293b" }}>{p.protocol}</span>
                            <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#64748b" }}>
                              {p.allow.toLocaleString()} allow / {p.block.toLocaleString()} block ({blockPct}% dropped)
                            </span>
                          </div>
                          <div style={{ height: "7px", display: "flex", borderRadius: "3px", overflow: "hidden", background: "#f1f5f9" }}>
                            <div style={{ width: `${allowPct}%`, background: "#10b981" }} />
                            <div style={{ width: `${blockPct}%`, background: "#ef4444" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: "10px", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "5px" }}>
                    Firewall Policy: Border gateways active with default drop rules on unauthorized ports.
                  </span>
                </div>
              )}

              {activeQueryWidget?.type === "endpoint_alerts" && (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Top Detected Alert Signatures</span>
                    <span style={{ fontSize: "10px", color: "#6366f1", background: "#e0e7ff", padding: "1px 6px", borderRadius: "10px", fontWeight: 600 }}>
                      8,240 Total Alerts
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", margin: "6px 0" }}>
                    {(
                      activeQueryWidget.alertTypes || [
                        { name: "Malware Detected", count: 588 },
                        { name: "Trojan:Win32", count: 579 },
                        { name: "Browser Hijack Attempt", count: 570 },
                        { name: "Usb Device Blocked", count: 562 },
                        { name: "Ransomware Behavior", count: 560 },
                      ]
                    )
                      .slice(0, 5)
                      .map((a, i) => {
                        const maxA = 600;
                        const pct = Math.min(100, Math.round((a.count / maxA) * 100));
                        const colors = ["#ef4444", "#f97316", "#8b5cf6", "#3b82f6", "#f59e0b"];
                        const col = colors[i % colors.length];
                        return (
                          <div
                            key={a.name}
                            style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", cursor: "pointer" }}
                            onClick={() => setSearchQuery(a.name)}
                          >
                            <span style={{ width: "135px", color: "#334155", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {a.name}
                            </span>
                            <div style={{ flex: 1, height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: "3px" }} />
                            </div>
                            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e293b", width: "32px", textAlign: "right" }}>
                              {a.count}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  <span style={{ fontSize: "10px", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "5px" }}>
                    EDR Status: Automated isolation enabled on high-entropy triggers.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="cs-map-wrap">
              <ThreatMapGL
                threatSources={threatSources}
                maxCount={maxSourceCount}
                onCountryClick={(country) => {
                  const isSelected = filters.searchQuery.toLowerCase() === country.toLowerCase();
                  setSearchQuery(isSelected ? "" : country);
                }}
                searchQuery={filters.searchQuery}
              />
              <div className="cs-map-gradient-bar">
                <span className="cs-gradient-label">Low</span>
                <div className="cs-gradient-line" />
                <span className="cs-gradient-label">High</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── ROW 3: TOP THREAT SOURCES, RECENT INCIDENTS, VULN STATUS ─── */}
      <section className="cs-chart-row-middle">
        {/* CARD 4: Top Threat Sources (Bar vs Table vs Donut) */}
        <div className="cs-card">
          <div className="cs-card-header">
            <h3 className="cs-card-title">Top Threat Sources</h3>

            {/* Dynamic Interactive Variation Switcher for Card 4 */}
            <div className="cs-chart-toggle-group">
              <button
                type="button"
                className={`cs-chart-toggle-btn ${sourceMode === "bar" ? "is-active" : ""}`}
                onClick={() => setSourceMode("bar")}
                title="Bar Chart"
              >
                <BarChart3 size={11} />
                <span>Bar</span>
              </button>
              <button
                type="button"
                className={`cs-chart-toggle-btn ${sourceMode === "table" ? "is-active" : ""}`}
                onClick={() => setSourceMode("table")}
                title="Table Breakdown"
              >
                <Table size={11} />
                <span>Table</span>
              </button>
              <button
                type="button"
                className={`cs-chart-toggle-btn ${sourceMode === "donut" ? "is-active" : ""}`}
                onClick={() => setSourceMode("donut")}
                title="Donut Chart"
              >
                <PieChart size={11} />
                <span>Donut</span>
              </button>
            </div>
          </div>

          {/* VARIATION 1: HORIZONTAL BARS */}
          {sourceMode === "bar" && (
            <div className="cs-bar-chart-container">
              {threatSources.map((item) => {
                const widthPct = Math.min(100, Math.max(8, Math.round((item.count / maxSourceCount) * 100)));
                const isSelected = filters.searchQuery.toLowerCase() === item.country.toLowerCase();
                return (
                  <div
                    key={item.country}
                    className="cs-bar-row"
                    style={{
                      cursor: "pointer",
                      padding: "2px",
                      borderRadius: "4px",
                      background: isSelected ? "rgba(37, 99, 235, 0.08)" : "transparent",
                    }}
                    onClick={() => setSearchQuery(isSelected ? "" : item.country)}
                    title={`Filter incidents by ${item.country}`}
                  >
                    <span className="cs-bar-label">{item.country}</span>
                    <div className="cs-bar-track">
                      <div
                        className="cs-bar-fill"
                        style={{
                          width: `${widthPct}%`,
                          background: item.color,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                    <span className="cs-bar-value mono">{item.count.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* VARIATION 2: GEOGRAPHIC TABLE */}
          {sourceMode === "table" && (
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                    <th style={{ padding: "3px 4px" }}>Country</th>
                    <th style={{ padding: "3px 4px", textAlign: "right" }}>Blocked</th>
                    <th style={{ padding: "3px 4px", textAlign: "right" }}>Share</th>
                    <th style={{ padding: "3px 4px", textAlign: "center" }}>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {threatSources.map((s, idx) => {
                    const isSelected = filters.searchQuery.toLowerCase() === s.country.toLowerCase();
                    const totalS = threatSources.reduce((a, b) => a + b.count, 0) || 1;
                    const share = Math.round((s.count / totalS) * 100);
                    return (
                      <tr
                        key={s.country}
                        onClick={() => setSearchQuery(isSelected ? "" : s.country)}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          cursor: "pointer",
                          background: isSelected ? "rgba(37,99,235,0.08)" : "transparent",
                        }}
                      >
                        <td style={{ padding: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: "9px" }}>#{idx + 1}</span>
                            <span style={{ fontWeight: 600, color: "#1e293b" }}>{s.country}</span>
                          </div>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#e11d48" }}>
                          {s.count.toLocaleString()}
                        </td>
                        <td style={{ padding: "4px", textAlign: "right", fontFamily: "monospace" }}>{share}%</td>
                        <td style={{ padding: "4px", textAlign: "center" }}>
                          <span
                            style={{
                              fontSize: "8.5px",
                              fontWeight: 700,
                              padding: "1px 4px",
                              borderRadius: "3px",
                              background: idx < 2 ? "#fee2e2" : "#f1f5f9",
                              color: idx < 2 ? "#dc2626" : "#64748b",
                            }}
                          >
                            {idx === 0 ? "Extreme" : idx < 3 ? "Elevated" : "Standard"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* VARIATION 3: MINI DONUT */}
          {sourceMode === "donut" && (
            <div className="cs-donut-layout">
              <div className="cs-donut-graphic">
                <svg viewBox="0 0 120 120" className="cs-donut-svg">
                  {(() => {
                    const totalS = threatSources.reduce((a, b) => a + b.count, 0) || 1;
                    const circumference = 2 * Math.PI * 42;
                    let curOffset = 0;
                    return threatSources.slice(0, 5).map((s) => {
                      const fraction = s.count / totalS;
                      const arcLength = fraction * circumference;
                      const dasharray = `${arcLength.toFixed(1)} ${(circumference - arcLength).toFixed(1)}`;
                      const dashoffset = -curOffset;
                      curOffset += arcLength;
                      return (
                        <circle
                          key={s.country}
                          cx="60"
                          cy="60"
                          r="42"
                          fill="none"
                          stroke={s.color}
                          strokeWidth="15"
                          strokeDasharray={dasharray}
                          strokeDashoffset={dashoffset.toFixed(1)}
                          strokeLinecap="butt"
                          style={{ cursor: "pointer" }}
                          onClick={() => setSearchQuery(s.country)}
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="cs-donut-center">
                  <strong className="cs-donut-total">{threatSources.length}</strong>
                  <span className="cs-donut-label">Origins</span>
                </div>
              </div>
              <div className="cs-donut-legend">
                {threatSources.slice(0, 4).map((s) => (
                  <div
                    key={s.country}
                    className="cs-donut-legend-row"
                    onClick={() => setSearchQuery(s.country)}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="cs-legend-dot" style={{ background: s.color }} />
                    <span className="cs-legend-name">{s.country}</span>
                    <strong className="cs-legend-val">{s.count.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CARD 5: Recent Security Incidents Table (Live Filtered) */}
        <div className="cs-card cs-card-table">
          <div className="cs-card-header">
            <h3 className="cs-card-title">Recent Security Incidents</h3>
            <span className="cs-table-link" style={{ cursor: "pointer" }} onClick={() => resetFilters()}>
              View all &rarr;
            </span>
          </div>

          <div className="cs-table-scroll-container">
            {recentIncidents.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                No incidents match active filter.
                <div style={{ marginTop: "6px" }}>
                  <button type="button" onClick={resetFilters} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 600 }}>
                    Reset Filters
                  </button>
                </div>
              </div>
            ) : (
              <table className="cs-data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Severity</th>
                    <th>Incident</th>
                    <th>Source</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIncidents.slice(0, 6).map((row, idx) => (
                    <tr key={idx}>
                      <td className="cs-time-cell">{row.time}</td>
                      <td>
                        <span
                          className={`cs-severity-badge ${
                            row.severity === "Critical"
                              ? "sev-critical"
                              : row.severity === "High"
                              ? "sev-high"
                              : row.severity === "Medium"
                              ? "sev-medium"
                              : "sev-low"
                          }`}
                          style={{ cursor: "pointer" }}
                          onClick={() => setSeverity(row.severity.toLowerCase() as any)}
                          title={`Filter by ${row.severity}`}
                        >
                          +{row.severity}
                        </span>
                      </td>
                      <td className="cs-incident-name">{row.incident}</td>
                      <td
                        className="cs-ip-cell mono"
                        style={{ cursor: "pointer" }}
                        onClick={() => setSearchQuery(row.source)}
                        title={`Filter by ${row.sourceType === "user" ? "user" : "host"} ${row.source}`}
                      >
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          {row.sourceType === "user" || (row.source && row.source.includes(".")) ? (
                            <User size={10} style={{ color: "#3b82f6", flexShrink: 0 }} />
                          ) : (
                            <Laptop size={10} style={{ color: "#64748b", flexShrink: 0 }} />
                          )}
                          <span>{row.source}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`cs-status-pill ${
                            row.status === "Open"
                              ? "stat-open"
                              : row.status === "Investigating"
                              ? "stat-investigating"
                              : row.status === "Blocked"
                              ? "stat-blocked"
                              : "stat-closed"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* CARD 6: Vulnerability Status (Donut vs Bar vs KPI Grid) */}
        <div className="cs-card">
          <div className="cs-card-header">
            <h3 className="cs-card-title">Vulnerability Status</h3>

            {/* Dynamic Interactive Variation Switcher for Card 6 */}
            <div className="cs-chart-toggle-group">
              <button
                type="button"
                className={`cs-chart-toggle-btn ${vulnMode === "donut" ? "is-active" : ""}`}
                onClick={() => setVulnMode("donut")}
                title="Donut Chart"
              >
                <PieChart size={11} />
                <span>Donut</span>
              </button>
              <button
                type="button"
                className={`cs-chart-toggle-btn ${vulnMode === "bar" ? "is-active" : ""}`}
                onClick={() => setVulnMode("bar")}
                title="Severity Distribution Bars"
              >
                <BarChart2 size={11} />
                <span>Bar</span>
              </button>
              <button
                type="button"
                className={`cs-chart-toggle-btn ${vulnMode === "kpi" ? "is-active" : ""}`}
                onClick={() => setVulnMode("kpi")}
                title="Remediation KPI Grid"
              >
                <Sparkles size={11} />
                <span>KPI</span>
              </button>
            </div>
          </div>

          {/* VARIATION 1: RADIAL DONUT */}
          {vulnMode === "donut" && (
            <div className="cs-donut-layout">
              <div className="cs-donut-graphic">
                <svg viewBox="0 0 120 120" className="cs-donut-svg">
                  {vulnDonutData.segments.map((seg, i) => (
                    <circle
                      key={i}
                      cx="60"
                      cy="60"
                      r="42"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={seg.isActive ? "17" : "14"}
                      strokeDasharray={seg.dasharray}
                      strokeDashoffset={seg.dashoffset}
                      strokeLinecap="butt"
                      style={{
                        transition: "stroke-width 0.2s ease, opacity 0.2s ease",
                        cursor: "pointer",
                        opacity: filters.severity === "all" || seg.isActive ? 1 : 0.4,
                      }}
                      onClick={() => {
                        const next = seg.key as any;
                        setSeverity(filters.severity === next ? "all" : next);
                      }}
                    />
                  ))}
                </svg>
                <div className="cs-donut-center">
                  <strong className="cs-donut-total">{vulnDonutData.total.toLocaleString()}</strong>
                  <span className="cs-donut-label">Total Assets</span>
                </div>
              </div>

              <div className="cs-donut-legend">
                {vulnDonutData.items.map((item) => {
                  const isActive = filters.severity === item.key;
                  return (
                    <div
                      key={item.label}
                      className="cs-donut-legend-row"
                      style={{
                        cursor: "pointer",
                        padding: "2px 4px",
                        borderRadius: "4px",
                        background: isActive ? "rgba(37, 99, 235, 0.08)" : "transparent",
                      }}
                      onClick={() => setSeverity(isActive ? "all" : (item.key as any))}
                      title={`Filter by ${item.label}`}
                    >
                      <span className="cs-legend-dot" style={{ background: item.color }} />
                      <span className="cs-legend-name">{item.label}</span>
                      <strong className="cs-legend-val">{item.value.toLocaleString()}</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VARIATION 2: SEVERITY DISTRIBUTION BARS */}
          {vulnMode === "bar" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, justifyContent: "center", padding: "2px 4px" }}>
              {vulnDonutData.items.map((item) => {
                const total = vulnDonutData.total || 1;
                const pct = Math.min(100, Math.round((item.value / total) * 100));
                const isActive = filters.severity === item.key;
                return (
                  <div
                    key={item.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      padding: "2px 4px",
                      borderRadius: "4px",
                      background: isActive ? "rgba(37, 99, 235, 0.08)" : "transparent",
                    }}
                    onClick={() => setSeverity(isActive ? "all" : (item.key as any))}
                  >
                    <span style={{ width: "85px", fontSize: "10.5px", fontWeight: isActive ? 700 : 500, color: "#1e293b", display: "flex", alignItems: "center", gap: "5px" }}>
                      <span className="cs-legend-dot" style={{ background: item.color }} />
                      {item.label}
                    </span>
                    <div style={{ flex: 1, height: "7px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: item.color, borderRadius: "3px" }} />
                    </div>
                    <span style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 700, color: "#0f172a", width: "42px", textAlign: "right" }}>
                      {item.value.toLocaleString()}
                    </span>
                    <span style={{ fontSize: "9px", color: "#64748b", width: "26px", textAlign: "right" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* VARIATION 3: REMEDIATION KPI GRID */}
          {vulnMode === "kpi" && (
            <div className="cs-vuln-kpi-grid">
              <div
                className="cs-vuln-kpi-box"
                style={{ cursor: "pointer", borderLeft: "3px solid #ef4444" }}
                onClick={() => setSeverity("critical")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="cs-vuln-kpi-label">Critical Risks</span>
                  <span className="cs-vuln-kpi-badge" style={{ background: "#fee2e2", color: "#dc2626" }}>
                    &lt; 24h SLA
                  </span>
                </div>
                <div className="cs-vuln-kpi-val" style={{ color: "#dc2626" }}>
                  {vulnStatus.critical.toLocaleString()}
                </div>
                <span style={{ fontSize: "9px", color: "#64748b" }}>Action required immediately</span>
              </div>

              <div
                className="cs-vuln-kpi-box"
                style={{ cursor: "pointer", borderLeft: "3px solid #f97316" }}
                onClick={() => setSeverity("high")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="cs-vuln-kpi-label">High Severity</span>
                  <span className="cs-vuln-kpi-badge" style={{ background: "#ffedd5", color: "#ea580c" }}>
                    Patching
                  </span>
                </div>
                <div className="cs-vuln-kpi-val" style={{ color: "#ea580c" }}>
                  {vulnStatus.high.toLocaleString()}
                </div>
                <span style={{ fontSize: "9px", color: "#64748b" }}>Scheduled for roll-out</span>
              </div>

              <div className="cs-vuln-kpi-box" style={{ borderLeft: "3px solid #10b981" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="cs-vuln-kpi-label">Patch Velocity</span>
                  <span className="cs-vuln-kpi-badge" style={{ background: "#ecfdf5", color: "#059669" }}>
                    Target Met
                  </span>
                </div>
                <div className="cs-vuln-kpi-val" style={{ color: "#059669" }}>
                  1.8d
                </div>
                <span style={{ fontSize: "9px", color: "#64748b" }}>Mean Time to Remediate</span>
              </div>

              <div className="cs-vuln-kpi-box" style={{ borderLeft: "3px solid #3b82f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="cs-vuln-kpi-label">SLA Compliance</span>
                  <span className="cs-vuln-kpi-badge" style={{ background: "#eff6ff", color: "#2563eb" }}>
                    +3.2% MoM
                  </span>
                </div>
                <div className="cs-vuln-kpi-val" style={{ color: "#2563eb" }}>
                  94.2%
                </div>
                <span style={{ fontSize: "9px", color: "#64748b" }}>Across 2,829 assets</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── ROW 4: TOP VULNERABILITIES, SECURITY POSTURE SCORE, COMPLIANCE ─── */}
      <section className="cs-chart-row-bottom">
        {/* CARD 7: Top Vulnerabilities (Table vs Impact Bar Chart) */}
        <div className="cs-card cs-card-table">
          <div className="cs-card-header">
            <h3 className="cs-card-title">Top Vulnerabilities</h3>

            {/* Dynamic Interactive Variation Switcher for Card 7 */}
            <div className="cs-chart-toggle-group">
              <button
                type="button"
                className={`cs-chart-toggle-btn ${vulnTableMode === "table" ? "is-active" : ""}`}
                onClick={() => setVulnTableMode("table")}
                title="CVE Table"
              >
                <Table size={11} />
                <span>Table</span>
              </button>
              <button
                type="button"
                className={`cs-chart-toggle-btn ${vulnTableMode === "bar" ? "is-active" : ""}`}
                onClick={() => setVulnTableMode("bar")}
                title="Asset Impact Bars"
              >
                <BarChart3 size={11} />
                <span>Impact</span>
              </button>
            </div>
          </div>

          <div className="cs-table-scroll-container">
            {topVulns.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                No vulnerabilities match active filter.
              </div>
            ) : vulnTableMode === "table" ? (
              /* VARIATION 1: CVE TABLE */
              <table className="cs-data-table">
                <thead>
                  <tr>
                    <th>CVE ID</th>
                    <th>Severity</th>
                    <th>Description</th>
                    <th>Affected Assets</th>
                  </tr>
                </thead>
                <tbody>
                  {topVulns.slice(0, 5).map((vuln, i) => (
                    <tr key={i}>
                      <td
                        className="cs-cve-cell mono"
                        style={{ cursor: "pointer" }}
                        onClick={() => setSearchQuery(vuln.cveId)}
                        title={`Filter by ${vuln.cveId}`}
                      >
                        {vuln.cveId}
                      </td>
                      <td>
                        <span
                          className={`cs-severity-badge ${
                            vuln.severity === "Critical"
                              ? "sev-critical"
                              : vuln.severity === "High"
                              ? "sev-high"
                              : "sev-medium"
                          }`}
                          style={{ cursor: "pointer" }}
                          onClick={() => setSeverity(vuln.severity.toLowerCase() as any)}
                        >
                          +{vuln.severity}
                        </span>
                      </td>
                      <td className="cs-desc-cell">{vuln.description}</td>
                      <td className="cs-affected-cell mono">{vuln.affectedAssets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* VARIATION 2: CVE ASSET IMPACT BARS */
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "6px 8px" }}>
                {topVulns.slice(0, 5).map((vuln) => {
                  const pct = Math.min(100, Math.round((vuln.affectedAssets / maxVulnAssets) * 100));
                  const isCritical = vuln.severity === "Critical";
                  return (
                    <div
                      key={vuln.cveId}
                      style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                      onClick={() => setSearchQuery(vuln.cveId)}
                      title={`Filter by ${vuln.cveId}`}
                    >
                      <span style={{ width: "95px", fontFamily: "monospace", fontSize: "10.5px", fontWeight: 700, color: "#2563eb" }}>
                        {vuln.cveId}
                      </span>
                      <div style={{ flex: 1, height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: isCritical ? "#ef4444" : "#f97316",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 700, width: "32px", textAlign: "right" }}>
                        {vuln.affectedAssets}
                      </span>
                      <span
                        style={{
                          fontSize: "8.5px",
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: "3px",
                          background: isCritical ? "#fee2e2" : "#ffedd5",
                          color: isCritical ? "#dc2626" : "#c2410c",
                        }}
                      >
                        +{vuln.severity}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CARD 8: Security Posture Score */}
        <div className="cs-card">
          <div className="cs-card-header">
            <h3 className="cs-card-title">Security Posture Score</h3>
            <span className="cs-trend-pill up-success">
              <ArrowUpRight size={10} /> 12% vs. previous period
            </span>
          </div>

          <div className="cs-posture-layout">
            <div className="cs-posture-dial-container">
              <svg viewBox="0 0 100 100" className="cs-dial-svg">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="9"
                  strokeDasharray="180 360"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(135 50 50)"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="9"
                  strokeDasharray={`${(posture.score / 100) * 180} 360`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(135 50 50)"
                />
              </svg>
              <div className="cs-dial-label-wrap">
                <strong className="cs-dial-num">{posture.score}</strong>
                <span className="cs-dial-sub">/ 100</span>
              </div>
            </div>

            <div className="cs-posture-bars">
              {posture.categories.map((cat) => (
                <div key={cat.name} className="cs-posture-row">
                  <span className="cs-posture-name">{cat.name}</span>
                  <div className="cs-posture-track">
                    <div
                      className="cs-posture-fill"
                      style={{
                        width: `${cat.score}%`,
                        background: cat.color,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <span className="cs-posture-val mono">{cat.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 9: Compliance Status (API Driven) */}
        <div className="cs-card">
          <div className="cs-card-header">
            <h3 className="cs-card-title">Compliance Status</h3>
            <span className="cs-table-link">View all &rarr;</span>
          </div>

          <div className="cs-compliance-list">
            {complianceList.map((comp) => (
              <div
                key={comp.name}
                className="cs-compliance-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "5px 0",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                  <span className="cs-compliance-name" style={{ fontWeight: 600, fontSize: "11.5px", color: "#1e293b" }}>
                    {comp.name}
                  </span>
                  {comp.control && <span style={{ fontSize: "9.5px", color: "#64748b" }}>{comp.control}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {comp.score && (
                    <span
                      style={{
                        fontSize: "9.5px",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: "#334155",
                        background: "#f8fafc",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      {comp.score}
                    </span>
                  )}
                  <span
                    className={`cs-compliance-status is-${
                      comp.type === "success" ? "compliant" : comp.type === "warning" ? "progress" : "failed"
                    }`}
                  >
                    {comp.type === "success" ? (
                      <CheckCircle2 size={11} />
                    ) : comp.type === "warning" ? (
                      <Clock size={11} />
                    ) : (
                      <XCircle size={11} />
                    )}
                    {" "}{comp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
