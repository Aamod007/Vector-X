import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  LayoutDashboard, 
  Database, 
  GitFork, 
  BarChart3, 
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DatasetMeta } from '../types';
import { 
  fetchSettings, 
  updateSettings, 
  fetchProjects, 
  loadProject, 
  clearChatHistory,
  loadSampleDataset,
  uploadDataset
} from '../services/api';

interface SidebarProps {
  datasets: DatasetMeta[];
  activeDatasetId: string | null;
  onSelectDataset: (id: string) => void;
  onRefreshData?: () => void;
  telemetry?: any;
  onUploadClick?: () => void;
  onOpenStudioModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  datasets,
  activeDatasetId,
  onSelectDataset,
  onRefreshData,
  telemetry,
  onUploadClick,
  onOpenStudioModal
}) => {
  const navigate = useNavigate();

  // Settings & LLM state replicated from Streamlit and matching reference image
  const [llmProvider, setLlmProvider] = useState<'OpenAI' | 'OpenRouter' | 'Ollama'>('OpenRouter');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [modelChoice, setModelChoice] = useState('z-ai/glm-5.2:free');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3.1:8b');
  const [ollamaStatus, setOllamaStatus] = useState<string | null>(null);
  const [recursionLimit, setRecursionLimit] = useState(10);
  const [addMemory, setAddMemory] = useState(true);
  const [proactiveMode, setProactiveMode] = useState(false);
  const [intentParsing, setIntentParsing] = useState(true);

  // Data options
  const [useSample, setUseSample] = useState(false);
  const [previewRows, setPreviewRows] = useState(5);

  // Pipeline options & behaviors
  const [dockedStudio, setDockedStudio] = useState(false);
  const [persistDir, setPersistDir] = useState('pipeline_reports/pipelines');
  const [autoSavePipeline, setAutoSavePipeline] = useState(true);
  const [overwritePipeline, setOverwritePipeline] = useState(false);
  const [saveSqlArtifacts, setSaveSqlArtifacts] = useState(true);
  const [preserveAllNodes, setPreserveAllNodes] = useState(true);
  const [preserveStudioNodes, setPreserveStudioNodes] = useState(true);
  const [persistNodesDisk, setPersistNodesDisk] = useState(false);
  const [cacheFormat, setCacheFormat] = useState('parquet');
  const [cacheMaxMb, setCacheMaxMb] = useState(500);

  // Chat ↔ Pipeline context
  const [pipelineChatContext, setPipelineChatContext] = useState(true);
  const [includeCodeSnippet, setIncludeCodeSnippet] = useState(false);
  const [useSelectedNodeForChat, setUseSelectedNodeForChat] = useState(true);
  const [syncStateToAgents, setSyncStateToAgents] = useState(true);

  // SQL & MLflow options
  const [sqlUrl, setSqlUrl] = useState('sqlite:///:memory:');
  const [enableMlflow, setEnableMlflow] = useState(true);
  const [mlflowUri, setMlflowUri] = useState('sqlite:///mlflow.db');
  const [mlflowArtifactRoot, setMlflowArtifactRoot] = useState('mlflow_artifacts');
  const [mlflowExperiment, setMlflowExperiment] = useState('H2O AutoML');

  // Debug options
  const [verboseLogs, setVerboseLogs] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const [showLiveLogs, setShowLiveLogs] = useState(true);

  // Projects state
  const [projects, setProjects] = useState<any[]>([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProjectSlug, setSelectedProjectSlug] = useState('');
  const [rehydrate, setRehydrate] = useState(true);

  // Collapsible expanders state (matching st.expander)
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const [pipelineBehaviorsExpanded, setPipelineBehaviorsExpanded] = useState(false);

  // Load initial settings and projects
  useEffect(() => {
    fetchSettings().then((s) => {
      if (s.llm_provider) setLlmProvider(s.llm_provider as any);
      if (s.model_name) setModelChoice(s.model_name);
      if (s.openai_api_key) {
        setApiKey(s.openai_api_key);
        setApiKeyValid(true);
      }
      if (s.ollama_base_url) setOllamaUrl(s.ollama_base_url);
      if (s.ollama_model) setOllamaModel(s.ollama_model);
      if (s.recursion_limit !== undefined) setRecursionLimit(s.recursion_limit);
      if (s.use_memory !== undefined) setAddMemory(s.use_memory);
      if (s.proactive_mode !== undefined) setProactiveMode(s.proactive_mode);
      if (s.intent_parsing !== undefined) setIntentParsing(s.intent_parsing);
      if (s.use_sample !== undefined) setUseSample(s.use_sample);
      if (s.preview_rows !== undefined) setPreviewRows(s.preview_rows);
      if (s.sql_url) setSqlUrl(s.sql_url);
      if (s.enable_mlflow_logging !== undefined) setEnableMlflow(s.enable_mlflow_logging);
    }).catch(console.error);

    fetchProjects().then((res) => {
      setProjects(res.projects || []);
    }).catch(console.error);
  }, []);

  // Sync settings helper
  const syncSetting = (patch: any) => {
    updateSettings(patch).catch(console.error);
  };

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    const trimmed = val.trim();
    if (trimmed.startsWith('sk-') || trimmed.length > 20) {
      setApiKeyValid(true);
      syncSetting({ openai_api_key: trimmed });
    } else if (!trimmed) {
      setApiKeyValid(null);
    } else {
      setApiKeyValid(false);
    }
  };

  const handleToggleSampleData = async (checked: boolean) => {
    setUseSample(checked);
    syncSetting({ use_sample: checked });
    if (checked) {
      try {
        const res = await loadSampleDataset('churn_data.csv');
        onRefreshData?.();
        if (res.dataset?.id) {
          onSelectDataset(res.dataset.id);
        }
      } catch (e: any) {
        console.error('Error loading sample dataset:', e);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadDataset(file);
      onRefreshData?.();
      if (res.dataset?.id) {
        onSelectDataset(res.dataset.id);
      }
    } catch (e: any) {
      alert(`Upload failed: ${e.message || 'Unknown error'}`);
    }
  };

  const handleCheckOllama = async () => {
    setOllamaStatus('Checking connection...');
    try {
      const res = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/tags`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m: any) => m.name || m);
        setOllamaStatus(`Connected! Found ${models.length} model(s).`);
      } else {
        setOllamaStatus(`Connection error: HTTP ${res.status}`);
      }
    } catch (err: any) {
      setOllamaStatus(`Could not connect to Ollama: ${err.message || 'Offline'}`);
    }
  };

  const handleLoadProject = async (openStudio: boolean) => {
    if (!selectedProjectSlug) return;
    try {
      await loadProject(selectedProjectSlug);
      onRefreshData?.();
      if (openStudio) {
        navigate('/pipeline');
      }
    } catch (e: any) {
      alert(`Error loading project: ${e.message}`);
    }
  };

  const handleClearChat = async () => {
    if (confirm('Clear all conversation history and agent session checkpoints?')) {
      await clearChatHistory();
      onRefreshData?.();
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.slug.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <aside 
      className="app-sidebar"
      style={{
        width: '280px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        fontSize: '0.8rem'
      }}
    >
      {/* Primary Navigation Links (Explorer removed) */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.75rem 0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-item-left">
            <Home size={16} />
            <span>Workspace</span>
          </div>
        </NavLink>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-item-left">
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </div>
        </NavLink>

        <NavLink to="/pipeline" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-item-left">
            <GitFork size={16} />
            <span>Pipeline Studio</span>
          </div>
        </NavLink>

        <NavLink to="/datasets" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-item-left">
            <Database size={16} />
            <span>Datasets</span>
          </div>
          <span className="nav-badge">{datasets.length}</span>
        </NavLink>

        <NavLink to="/results" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-item-left">
            <BarChart3 size={16} />
            <span>Results</span>
          </div>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-item-left">
            <SettingsIcon size={16} />
            <span>Settings</span>
          </div>
        </NavLink>
      </nav>

      {/* Streamlit Pipeline Studio Sidebar Controls */}
      <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        
        {/* LLM Section (Streamlit & Reference Image Parity) */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.45rem' }}>LLM</div>
          
          <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
            Provider
          </label>
          <select
            value={llmProvider}
            onChange={(e) => {
              const val = e.target.value as any;
              setLlmProvider(val);
              syncSetting({ llm_provider: val });
            }}
            style={{ width: '100%', padding: '0.38rem 0.5rem', fontSize: '0.775rem', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a', marginBottom: '0.55rem' }}
          >
            <option value="OpenRouter">OpenRouter</option>
            <option value="OpenAI">OpenAI</option>
            <option value="Ollama">Ollama</option>
          </select>

          {llmProvider !== 'Ollama' ? (
            <>
              <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                {llmProvider === 'OpenRouter' ? 'OpenRouter API key' : 'OpenAI API key'}
              </label>
              <div style={{ position: 'relative', marginBottom: apiKeyValid ? '0.25rem' : '0.55rem' }}>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.38rem 0.5rem',
                    fontSize: '0.775rem',
                    border: apiKeyValid ? '1.5px solid #10b981' : '1px solid #cbd5e1',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    color: '#0f172a'
                  }}
                />
              </div>

              {apiKeyValid === true && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.725rem', color: '#10b981', marginBottom: '0.55rem' }}>
                  <CheckCircle2 size={13} strokeWidth={2.5} />
                  <span>API Key is valid!</span>
                </div>
              )}
              {apiKeyValid === false && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.725rem', color: '#ef4444', marginBottom: '0.55rem' }}>
                  <AlertCircle size={13} />
                  <span>Invalid API Key format</span>
                </div>
              )}

              <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Model</label>
              <select
                value={modelChoice}
                onChange={(e) => {
                  setModelChoice(e.target.value);
                  syncSetting({ model_name: e.target.value });
                }}
                style={{ width: '100%', padding: '0.38rem 0.5rem', fontSize: '0.775rem', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a' }}
              >
                <option value="z-ai/glm-5.2:free">z-ai/glm-5.2:free (Free)</option>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                <option value="gpt-4.1">gpt-4.1</option>
                <option value="gpt-5-mini">gpt-5-mini</option>
                <option value="gpt-5.1">gpt-5.1</option>
                <option value="gpt-5.2">gpt-5.2</option>
              </select>
            </>
          ) : (
            <>
              <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Ollama base URL</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => {
                  setOllamaUrl(e.target.value);
                  syncSetting({ ollama_base_url: e.target.value });
                }}
                style={{ width: '100%', padding: '0.38rem 0.5rem', fontSize: '0.775rem', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '0.45rem', backgroundColor: '#ffffff' }}
              />
              <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Ollama model</label>
              <input
                type="text"
                value={ollamaModel}
                onChange={(e) => {
                  setOllamaModel(e.target.value);
                  syncSetting({ ollama_model: e.target.value });
                }}
                style={{ width: '100%', padding: '0.38rem 0.5rem', fontSize: '0.775rem', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '0.5rem', backgroundColor: '#ffffff' }}
              />
              <button
                onClick={handleCheckOllama}
                style={{
                  width: '100%',
                  padding: '0.35rem',
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Check Ollama connection
              </button>
              {ollamaStatus && (
                <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.3rem' }}>
                  {ollamaStatus}
                </div>
              )}
            </>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />

        {/* Settings Section (Recursion limit, Memory, Proactive, Intent) */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.45rem' }}>Settings</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: '#475569' }}>Recursion limit</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{recursionLimit}</span>
            </div>
            <input
              type="range"
              min={4}
              max={20}
              step={1}
              value={recursionLimit}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRecursionLimit(val);
                syncSetting({ recursion_limit: val });
              }}
              style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer', marginBottom: '0.2rem' }}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="memory_check"
                checked={addMemory}
                onChange={(e) => {
                  setAddMemory(e.target.checked);
                  syncSetting({ use_memory: e.target.checked });
                }}
                style={{ accentColor: '#2563eb', width: '14px', height: '14px', cursor: 'pointer' }}
              />
              <span>Enable short-term memory</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="proactive_check"
                checked={proactiveMode}
                onChange={(e) => {
                  setProactiveMode(e.target.checked);
                  syncSetting({ proactive_mode: e.target.checked });
                }}
                style={{ accentColor: '#2563eb', width: '14px', height: '14px', cursor: 'pointer' }}
              />
              <span>Proactive workflow mode</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="intent_check"
                checked={intentParsing}
                onChange={(e) => {
                  setIntentParsing(e.target.checked);
                  syncSetting({ intent_parsing: e.target.checked });
                }}
                style={{ accentColor: '#2563eb', width: '14px', height: '14px', cursor: 'pointer' }}
              />
              <span>LLM intent parsing</span>
            </label>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />

        {/* Data options Section */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.45rem' }}>Data options</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="sample_churn_check"
                checked={useSample}
                onChange={(e) => handleToggleSampleData(e.target.checked)}
                style={{ accentColor: '#2563eb', width: '14px', height: '14px', cursor: 'pointer' }}
              />
              <span>Load sample Telco churn data</span>
            </label>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Upload CSV</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ fontSize: '0.725rem', width: '100%', color: '#475569' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Preview rows</label>
              <input
                type="number"
                min={1}
                max={20}
                value={previewRows}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPreviewRows(val);
                  syncSetting({ preview_rows: val });
                }}
                style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.775rem', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a' }}
              />
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />

        {/* Dataset selection (Active override) */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.45rem' }}>Dataset selection</div>
          
          <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Active dataset (override)</label>
          <select
            value={activeDatasetId || ''}
            onChange={(e) => onSelectDataset(e.target.value)}
            style={{ width: '100%', padding: '0.38rem 0.5rem', fontSize: '0.775rem', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', color: '#0f172a' }}
          >
            <option value="">Auto (use supervisor active)</option>
            {datasets.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.stage}: {ds.label} ({ds.records} rows)
              </option>
            ))}
          </select>
          <span style={{ fontSize: '0.675rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
            Overrides which dataset is considered active for downstream steps.
          </span>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />

        {/* Open Pipeline Studio Button & Docked toggle */}
        <div>
          <button
            onClick={() => {
              if (dockedStudio) {
                navigate('/pipeline');
              } else if (onOpenStudioModal) {
                onOpenStudioModal();
              } else {
                navigate('/pipeline');
              }
            }}
            style={{
              width: '100%',
              padding: '0.55rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.825rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <GitFork size={15} />
            <span>Pipeline Studio</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#475569' }}>Dock Pipeline Studio (inline)</span>
            <input
              type="checkbox"
              checked={dockedStudio}
              onChange={(e) => setDockedStudio(e.target.checked)}
              style={{ accentColor: '#2563eb', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Projects Expander */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
          <div 
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.65rem', backgroundColor: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: '0.775rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FolderOpen size={14} color="#64748b" />
              <span>Projects</span>
            </div>
            {projectsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>

          {projectsExpanded && (
            <div style={{ padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#ffffff' }}>
              <input
                type="text"
                placeholder="Search projects..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                style={{ width: '100%', padding: '0.3rem 0.5rem', fontSize: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              />

              <select
                value={selectedProjectSlug}
                onChange={(e) => setSelectedProjectSlug(e.target.value)}
                style={{ width: '100%', padding: '0.35rem', fontSize: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              >
                <option value="">Select a project…</option>
                {filteredProjects.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name} · {p.datasets?.length || 0} datasets
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="checkbox"
                  id="rehydrate_check"
                  checked={rehydrate}
                  onChange={(e) => setRehydrate(e.target.checked)}
                  style={{ accentColor: '#2563eb' }}
                />
                <label htmlFor="rehydrate_check" style={{ fontSize: '0.725rem', color: '#475569' }}>
                  Rehydrate (best-effort)
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.2rem' }}>
                <button
                  onClick={() => handleLoadProject(false)}
                  disabled={!selectedProjectSlug}
                  style={{ padding: '0.35rem', fontSize: '0.725rem', fontWeight: 600, border: '1px solid #cbd5e1', borderRadius: '4px', background: selectedProjectSlug ? '#ffffff' : '#f1f5f9', cursor: selectedProjectSlug ? 'pointer' : 'not-allowed' }}
                >
                  Load
                </button>
                <button
                  onClick={() => handleLoadProject(true)}
                  disabled={!selectedProjectSlug}
                  style={{ padding: '0.35rem', fontSize: '0.725rem', fontWeight: 600, border: 'none', borderRadius: '4px', background: selectedProjectSlug ? '#0f172a' : '#cbd5e1', color: '#ffffff', cursor: selectedProjectSlug ? 'pointer' : 'not-allowed' }}
                >
                  Load + Open
                </button>
              </div>
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />

        {/* Pipeline options & behaviors */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>Pipeline options</div>
          <label style={{ fontSize: '0.725rem', color: '#64748b' }}>Persist pipeline directory</label>
          <input
            type="text"
            value={persistDir}
            onChange={(e) => setPersistDir(e.target.value)}
            style={{ width: '100%', padding: '0.3rem', fontSize: '0.725rem', border: '1px solid #cbd5e1', borderRadius: '4px', marginTop: '0.2rem', marginBottom: '0.5rem' }}
          />

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
            <div 
              onClick={() => setPipelineBehaviorsExpanded(!pipelineBehaviorsExpanded)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', backgroundColor: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}
            >
              <span>Pipeline behaviors</span>
              {pipelineBehaviorsExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </div>

            {pipelineBehaviorsExpanded && (
              <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input type="checkbox" checked={autoSavePipeline} onChange={(e) => setAutoSavePipeline(e.target.checked)} />
                  <span style={{ fontSize: '0.7rem' }}>Auto-save pipeline files</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input type="checkbox" checked={preserveAllNodes} onChange={(e) => setPreserveAllNodes(e.target.checked)} />
                  <span style={{ fontSize: '0.7rem' }}>Preserve all nodes on AI runs</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input type="checkbox" checked={preserveStudioNodes} onChange={(e) => setPreserveStudioNodes(e.target.checked)} />
                  <span style={{ fontSize: '0.7rem' }}>Preserve Studio nodes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input type="checkbox" checked={persistNodesDisk} onChange={(e) => setPersistNodesDisk(e.target.checked)} />
                  <span style={{ fontSize: '0.7rem' }}>Persist nodes to disk</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Cache max size (MB)</span>
                  <input
                    type="number"
                    value={cacheMaxMb}
                    onChange={(e) => setCacheMaxMb(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.2rem', fontSize: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />

        {/* Chat ↔ Pipeline context */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>Chat ↔ Pipeline context</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input type="checkbox" checked={pipelineChatContext} onChange={(e) => setPipelineChatContext(e.target.checked)} />
              <span style={{ fontSize: '0.725rem' }}>Include Studio context in chat</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input type="checkbox" checked={includeCodeSnippet} onChange={(e) => setIncludeCodeSnippet(e.target.checked)} />
              <span style={{ fontSize: '0.725rem' }}>Include selected node code snippet</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input type="checkbox" checked={useSelectedNodeForChat} onChange={(e) => setUseSelectedNodeForChat(e.target.checked)} />
              <span style={{ fontSize: '0.725rem' }}>Use selected node for chat</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input type="checkbox" checked={syncStateToAgents} onChange={(e) => setSyncStateToAgents(e.target.checked)} />
              <span style={{ fontSize: '0.725rem' }}>Sync Studio state to AI</span>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />

        {/* SQL & MLflow options */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>SQL & MLflow</div>
          <label style={{ fontSize: '0.725rem', color: '#64748b' }}>SQLAlchemy URL</label>
          <input
            type="text"
            value={sqlUrl}
            onChange={(e) => {
              setSqlUrl(e.target.value);
              syncSetting({ sql_url: e.target.value });
            }}
            style={{ width: '100%', padding: '0.3rem', fontSize: '0.725rem', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '0.5rem' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <input 
              type="checkbox" 
              checked={enableMlflow} 
              onChange={(e) => {
                setEnableMlflow(e.target.checked);
                syncSetting({ enable_mlflow_logging: e.target.checked });
              }} 
            />
            <span style={{ fontSize: '0.725rem' }}>Enable MLflow logging</span>
          </div>

          <label style={{ fontSize: '0.725rem', color: '#64748b' }}>MLflow tracking URI</label>
          <input
            type="text"
            value={mlflowUri}
            onChange={(e) => setMlflowUri(e.target.value)}
            style={{ width: '100%', padding: '0.3rem', fontSize: '0.725rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />

        {/* Debug options & Clear Chat */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>Debug options</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input type="checkbox" checked={verboseLogs} onChange={(e) => setVerboseLogs(e.target.checked)} />
              <span style={{ fontSize: '0.725rem' }}>Verbose console logs</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input type="checkbox" checked={showProgress} onChange={(e) => setShowProgress(e.target.checked)} />
              <span style={{ fontSize: '0.725rem' }}>Show progress in chat</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input type="checkbox" checked={showLiveLogs} onChange={(e) => setShowLiveLogs(e.target.checked)} />
              <span style={{ fontSize: '0.725rem' }}>Show live logs while running</span>
            </div>
          </div>

          <button
            onClick={handleClearChat}
            style={{
              width: '100%',
              padding: '0.45rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <Trash2 size={13} />
            <span>Clear chat</span>
          </button>
        </div>

      </div>
    </aside>
  );
};
