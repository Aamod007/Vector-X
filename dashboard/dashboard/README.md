# CyberShield Security Operations Center (SOC) Dashboard System

A high-performance, real-time cybersecurity telemetry dashboard featuring dynamic visualization switching, AI copilot natural language integration, and a MapLibre GL JS threat map powered by 100% free OpenStreetMap standard raster tiles with **zero API keys required**.

---

## 📁 System Architecture & Directory Structure

```
dashboard/
├── README.md                          # Comprehensive documentation & setup instructions
├── frontend/                          # Next.js 15 + React 19 + TypeScript + Zustand + MapLibre GL
│   ├── app/
│   │   ├── dashboard/
│   │   │   └── page.tsx               # Next.js route page for /dashboard
│   │   └── globals.css                # Curated SOC light/dark design system & chart styling
│   ├── components/
│   │   ├── cybershield-dashboard.tsx  # Core dashboard component with all 8 visualization variations
│   │   ├── threat-map-gl.tsx          # MapLibre GL map with free OSM tiles, native heatmap & trajectory arcs
│   │   ├── dashboard-sidebar-controls.tsx # Quick-filter chips and preset queries (Lucide SVG icons)
│   │   └── dashboard-workspace.tsx    # Dashboard layout wrapper
│   ├── stores/
│   │   ├── dashboard-store.ts         # Zustand store managing telemetry, filters, dynamic widgets & AI sync
│   │   └── workspace-store.ts         # Dataset workspace state management
│   ├── lib/
│   │   ├── api.ts                     # API client, base URLs, fetch helpers & endpoints
│   │   └── types.ts                   # Strict TypeScript interfaces and type definitions
│   ├── package.json                   # Frontend npm dependencies & scripts
│   ├── tsconfig.json                  # TypeScript compiler settings & path aliases (@/*)
│   └── next.config.ts                 # Next.js reverse proxy rewrites (/api/* -> http://127.0.0.1:8001)
└── backend/                           # FastAPI + Python + Pandas Telemetry Engine
    ├── main.py                        # FastAPI application entrypoint with CORS & router mounting
    ├── models.py                      # Pydantic data validation schemas
    ├── requirements.txt               # Backend Python dependencies
    ├── routers/
    │   └── cyber.py                   # API router exposing /api/cyber/dashboard and /api/cyber/chat
    └── services/
        ├── cyber_telemetry.py         # Telemetry processing engine, IAM audit trail, compliance scoring
        └── workspace.py               # Dataset workspace manager
```

---

## 📊 Visualization Variations & Dynamic Interactions

The dashboard supports 8 primary visualization types with interactive per-card toggle controls and filter-driven automatic adaptation:

### 1. Threat Activity Trend
- **Line Chart**: Smooth multi-vector SVG polylines with hover nodes, dynamic grid lines, and vector opacity highlighting.
- **Area Chart**: Layered SVG gradient fills displaying cumulative threat volume.
- **Grouped Bar Chart**: Vertical columns comparing Malware, Phishing, Intrusion, and DDoS per date interval.
- **Heatmap Matrix**: 4 $\times$ 8 Threat Matrix Grid (Vectors $\times$ Dates) with density heat-scaling, cell hover tooltips, and click-to-filter.

### 2. Threats by Type
- **Donut Chart**: Radial SVG donut chart with active segment expand, percentage indicators, and center count readout.
- **Ranked Bar Chart**: Proportional horizontal comparative bars with percentage tracks and color tags.
- **Metric Table**: Tabular breakdown with Vector, Count, Global Share %, Severity Exposure tag, and Filter action.

### 3. Global Threat Map (MapLibre GL JS + Free OSM Tiles)
- **Map Provider**: 100% Free Standard OpenStreetMap raster tiles (`https://{a,b,c}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
- **Zero API Key Required**: No access tokens, no credit cards, no Mapbox/Carto keys.
- **Native MapLibre Heatmap Layer**: Native GPU-accelerated `"heatmap"` layer with continuous density color interpolation (`heatmap-color`, `heatmap-weight`).
- **HUD Modes**: Interactive 3-way toggle between **Arcs** (animated attack trajectories), **Heatmap** (density spread), and **Hybrid** (both).
- **Navigation**: Custom zoom in (`+`), zoom out (`-`), and global view reset compass.
- **Tooltips & Filtering**: Interactive popups on hover displaying blocked attempts and click-to-filter sync across all dashboard tables and KPIs.

### 4. Top Threat Sources
- **Bar Chart**: Ranked horizontal progress bars with country labels and proportional widths.
- **Geographic Table**: Ranked Ingress table (#1..6, Country, Blocked Volume, Share %, Risk Level).
- **Donut Chart**: Mini geographic ingress origin donut.

### 5. Vulnerability Status
- **Donut Chart**: Radial breakdown across Critical, High, Medium, Low, Informational.
- **Distribution Bar Chart**: Horizontal comparative bars displaying exact asset counts and percentages.
- **Remediation KPI Grid**: 4 high-impact metric boxes (Critical Risks `< 24h SLA`, High Severity, Patch Velocity `1.8d MTTR`, SLA Compliance `94.2%`).

### 6. Top Vulnerabilities
- **CVE Table**: CVE ID, Severity badge, Description, Affected Assets count.
- **Impact Bar Chart**: Horizontal comparative bars ranking CVEs by affected host count.

### 7. Filter-Driven Dynamic Auto-Adaptation
- Selecting a vector (e.g. `malware`) automatically sets the Trend chart to **Area** to inspect volumetric exposure over time.
- Selecting `critical` or `high` severity automatically switches Vulnerability Status to **KPI** or **Bar** and Top Vulnerabilities to **Impact Bar**.
- Searching for a country or host switches Top Threat Sources to **Table** for row inspection.
- **View Mode Presets**: 5 one-click global presets in the filter ribbon: **Overview**, **Time-Series**, **Bars**, **Heatmap**, and **Tabular**.

---

## 🔌 API Calling & Telemetry System

The frontend connects to the backend through Next.js proxy rewrites (`next.config.ts`) routing all `/api/*` requests to the FastAPI backend:

### Key Endpoints:
- `GET /api/cyber/dashboard`: Returns real-time aggregated telemetry:
  - `kpi`: Total threats, active incidents, blocked attacks, assets monitored, and deltas.
  - `timeline`: 8-interval time series for malware, phishing, intrusion, and DDoS.
  - `threatsByType`: Categorical breakdown with colors and counts.
  - `topThreatSources`: Geographic ingress volume and source countries.
  - `vulnerabilityStatus`: Counts by severity tier (Critical, High, Medium, Low, Informational).
  - `topVulnerabilities`: Ranked CVEs with affected asset counts and descriptions.
  - `recentIncidents`: Time-stamped security event feed with source IP/user, severity, and status.
  - `securityPosture`: Overall composite score and category breakdowns (Identity, Network, Endpoint, Data, Compliance).
  - `complianceStatus`: Adherence metrics for ISO 27001, SOC 2, GDPR, HIPAA, PCI DSS, and NIST CSF.
  - `topFailedUsers`: High-risk IAM users with failed login counts, department, and failure reasons.
- `POST /api/cyber/chat`: Natural language copilot query endpoint.
  - Accepts `{ "query": "..." }`.
  - Returns structured response with natural language summary (strictly emoji-free), updated filter states (`filters`), dynamic query widgets (`activeWidget`), and dynamic KPIs (`dynamicKpis`).

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+

### 1. Start the Backend API
```bash
cd dashboard/backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```
The FastAPI backend will be live at `http://127.0.0.1:8001`.
Interactive API docs are available at `http://127.0.0.1:8001/docs`.

### 2. Start the Frontend Application
```bash
cd dashboard/frontend
npm install
npm run dev
```
The Next.js application will start at `http://localhost:3000`.
Navigate to `http://localhost:3000/dashboard` to interact with the dashboard.

---

## 🛡️ Key Guarantees
- **Zero API Key Requirement**: MapLibre GL JS operates strictly on standard OpenStreetMap raster tiles.
- **Zero Emojis**: Clean, professional SOC appearance using dedicated Lucide SVG icons.
- **TypeScript Strict Compliance**: Clean builds with 0 type errors.
