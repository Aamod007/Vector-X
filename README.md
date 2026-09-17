# Vector-X

Vector-X is an autonomous AI multi-agent workspace and data intelligence platform. It integrates LangGraph-powered data science agents with a FastAPI backend and a modern React 18 web interface, featuring a visual pipeline studio, dataset profiling, streaming agent chat, and a CyberShield executive security operations center (SOC) dashboard.

---

## Key Capabilities

- **Autonomous Agent Workflows**: Specialized LangGraph agents for data loading, data cleaning, exploratory data analysis (EDA), data wrangling, feature engineering, and automated machine learning (H2O AutoML).
- **Interactive Pipeline Studio**: Visual node graph for building reproducible data transformation and machine learning pipelines, with full state persistence and dataset caching.
- **CyberShield SOC Dashboard**: Executive security operations center interface providing real-time threat telemetry, incident distribution, vulnerability maps, and tactical mitigation tracking.
- **Dataset Management & Profiling**: Instant dataset upload (CSV, Excel), automated schema detection, statistical summaries, missing value heatmaps, and correlation analysis.
- **Streaming Multi-Agent Chat**: Real-time conversational interface utilizing Server-Sent Events (SSE) to display agent thought processes, tool calls, and generated Python code.
- **Flexible LLM Provider Support**: Native integration with both OpenAI (`gpt-4o`, `gpt-4o-mini`) and local open-source models via Ollama (`llama3.1:8b`, `qwen2.5-coder`).
- **MLflow Experiment Tracking**: Automated logging of parameters, metrics, and models to local or remote MLflow tracking servers.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React 18 Frontend                        │
│   (Vite + TypeScript + Plotly.js + MapLibre + Zustand)      │
│                                                             │
│  [SOC Dashboard] [Pipeline Studio] [Datasets] [Agent Chat]  │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / SSE Stream
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend                          │
│               (backend/server.py :8000)                     │
│                                                             │
│  [DatasetService]   [PipelineService]   [SettingsService]   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Agent Invocations
┌──────────────────────────────▼──────────────────────────────┐
│             LangGraph Multi-Agent Team                      │
│             (ai_data_science_team/)                         │
│                                                             │
│  • Data Loader Agent       • Data Cleaning Agent            │
│  • Data Wrangling Agent    • Feature Engineering Agent      │
│  • EDA Tools Agent         • Data Visualization Agent       │
│  • H2O ML Agent            • MLflow Tools Agent             │
│  • SQL Database Agent      • Multi-Agent Supervisor         │
└─────────────────────────────────────────────────────────────┘
```

---

## System Requirements

- **Python**: 3.10, 3.11, or 3.12
- **Node.js**: 18.x or later
- **Package Managers**: `pip` and `npm`
- **Optional**:
  - OpenAI API key
  - [Ollama](https://ollama.com/) for local offline model execution

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Aamod007/Vector-X.git
cd Vector-X
```

### 2. Set Up Python Environment

Create and activate a virtual environment:

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate
```

Install core dependencies and the local package in editable mode:

```bash
pip install -r requirements.txt
pip install -e .
```

### 3. Set Up Frontend

```bash
cd frontend
npm install
cd ..
```

---

## Configuration & Environment Variables

You can configure settings via environment variables or directly inside the web UI at `http://localhost:3000/settings`.

Optional environment variables:

| Variable | Description | Default |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key for agent reasoning | *None* |
| `OLLAMA_BASE_URL` | Base endpoint for local Ollama models | `http://localhost:11434` |
| `MLFLOW_TRACKING_URI` | Tracking URI for MLflow experiment logs | `sqlite:///mlflow.db` |

---

## Running the Application

### Option A: Windows Quickstart (Recommended)

Run the included batch script to launch the FastAPI backend and Vite frontend simultaneously:

```bat
run.bat
```

### Option B: Manual Execution

#### Terminal 1 — Backend (FastAPI):
```bash
uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at `http://127.0.0.1:8000/docs`.

#### Terminal 2 — Frontend (Vite):
```bash
cd frontend
npm run dev
```
The web application will be accessible at `http://localhost:3000`.

### Option C: Streamlit Copilot Apps

To run the standalone Streamlit pipeline studio or individual copilot tools:

```bash
streamlit run apps/ai-pipeline-studio-app/app.py
```

---

## Key API Endpoints

The backend exposes RESTful endpoints for integration and automation:

- `GET /api/health` — Service health and active configuration status
- `GET /api/settings` — Current LLM provider, recursion limits, and persistence options
- `POST /api/settings` — Update runtime settings
- `GET /api/datasets` — List loaded datasets and basic schemas
- `POST /api/datasets/upload` — Upload multipart dataset files (`.csv`, `.xlsx`)
- `GET /api/datasets/{id}/preview` — Paginated preview of rows and column types
- `GET /api/datasets/{id}/summary` — Statistical summary and missing value counts
- `GET /api/pipeline/graph` — Current DAG structure of pipeline nodes and dependencies
- `POST /api/pipeline/node` — Create a manual or agent-generated pipeline node
- `POST /api/pipeline/run-node` — Execute a specific node in the DAG
- `POST /api/chat/stream` — SSE endpoint for interactive agent chat with live event streaming

---

## Project Structure

```
Vector-X/
├── ai_data_science_team/    # LangGraph & LangChain multi-agent implementations
│   ├── agents/              # Cleaning, wrangling, feature engineering, SQL agents
│   ├── ds_agents/           # EDA and statistical testing agents
│   ├── ml_agents/           # H2O AutoML and MLflow integration agents
│   └── multiagents/         # Supervisor and team orchestration workflows
├── backend/                 # FastAPI REST API services
│   ├── dataset_service.py   # Dataset storage, profiling, and caching
│   ├── pipeline_service.py  # Pipeline graph execution and project state
│   └── server.py            # API routes and SSE streaming handlers
├── frontend/                # React 18 + TypeScript web client
│   ├── src/
│   │   ├── components/      # UI components (Header, Sidebar, DataTable, Charts)
│   │   ├── pages/           # Dashboard, Pipeline, Datasets, Results, Settings
│   │   └── services/        # API client and WebSocket/SSE connectors
│   └── package.json
├── apps/                    # Streamlit applications (Studio, EDA, Analyst)
├── examples/                # Jupyter notebook demonstrations and agent tutorials
├── data/                    # Sample datasets for testing and demonstrations
├── run.bat                  # Automated launcher script for Windows
├── setup.py                 # Python package installation manifest
├── requirements.txt         # Core Python dependencies
├── CONTRIBUTING.md          # Contribution guidelines and development workflow
└── LICENSE                  # MIT License & attribution notices
```

---

## Development & Testing

Run frontend tests and build verification:

```bash
cd frontend
npm run build
```

Run Python syntax and import tests:

```bash
python -c "import backend.server; print('Backend loaded successfully')"
```

---

## Contributing

Contributions, bug reports, and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on code standards, branch naming, and pull request procedures.

---

## Maintainer

- **Repository Owner / Maintainer**: Aamod ([@Aamod007](https://github.com/Aamod007))
- **Repository**: [https://github.com/Aamod007/Vector-X](https://github.com/Aamod007/Vector-X)

---

## License & Attribution

This project is licensed under the [MIT License](LICENSE).

This repository builds upon and incorporates open-source work from the `ai-data-science-team` project (Copyright &copy; 2024 ai-data-science-team authors). All original copyright notices and license permissions are preserved in accordance with the MIT License.
