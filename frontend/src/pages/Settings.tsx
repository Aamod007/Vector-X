import React, { useEffect, useState } from 'react';
import { AppSettings } from '../types';
import { fetchSettings, updateSettings } from '../services/api';
import {
  Cpu,
  Key,
  Sliders,
  Database,
  Layers,
  MessageSquare,
  BarChart3,
  Terminal,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    llm_provider: 'OpenAI',
    model_name: 'gpt-4o-mini',
    openai_api_key: '',
    ollama_base_url: 'http://localhost:11434',
    ollama_model: 'llama3.1:8b',
    recursion_limit: 10,
    use_memory: true,
    proactive_mode: false,
    intent_parsing: true,
    use_sample: false,
    preview_rows: 5,
    pipeline_persist_dir: 'pipeline_reports/pipelines',
    pipeline_persist_enabled: true,
    pipeline_persist_overwrite: false,
    pipeline_persist_include_sql: true,
    pipeline_preserve_all_nodes: true,
    pipeline_preserve_studio_nodes: true,
    pipeline_dataset_persist_enabled: false,
    pipeline_dataset_restore_enabled: false,
    pipeline_dataset_cache_format: 'parquet',
    pipeline_dataset_cache_max_items: 5,
    pipeline_dataset_cache_max_mb: 500,
    pipeline_chat_context_enabled: true,
    pipeline_chat_context_include_code: false,
    pipeline_use_selected_node_for_chat: true,
    pipeline_sync_state_to_agents: true,
    sql_url: 'sqlite:///:memory:',
    enable_mlflow_logging: true,
    mlflow_tracking_uri: 'sqlite:///mlflow.db',
    mlflow_artifact_root: 'mlflow_artifacts',
    mlflow_experiment_name: 'H2O AutoML',
    verbose_logs: false,
    show_progress: true,
    show_live_logs: true,
    debug_mode: false,
  });

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<string | null>(null);

  // Expander collapse toggles matching Streamlit sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    llm: true,
    agent: true,
    data: true,
    pipeline: true,
    chat: false,
    sql: false,
    mlflow: false,
    debug: false,
  });

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        setSettings((prev) => ({ ...prev, ...s }));
        if (s.openai_api_key) setApiKeyInput(s.openai_api_key);
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Partial<AppSettings> = {
        ...settings,
        openai_api_key: apiKeyInput ? apiKeyInput.trim() : undefined,
      };
      const res = await updateSettings(payload);
      if (res.settings) {
        setSettings((prev) => ({ ...prev, ...res.settings }));
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const checkOllamaConnection = async () => {
    setOllamaStatus('Checking connection...');
    try {
      const targetUrl = settings.ollama_base_url || 'http://localhost:11434';
      const res = await fetch(`${targetUrl.replace(/\/$/, '')}/api/tags`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m: any) => m.name).join(', ');
        setOllamaStatus(`Connected! Models found: ${models || 'None'}`);
      } else {
        setOllamaStatus(`Connected, but server returned HTTP ${res.status}`);
      }
    } catch (e: any) {
      setOllamaStatus(`Could not connect to Ollama at ${settings.ollama_base_url}: ${e.message}`);
    }
  };

  const isKeyValid = apiKeyInput.trim().startsWith('sk-') && apiKeyInput.trim().length > 20;

  return (
    <div className="view-container" style={{ maxWidth: '920px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>Workspace Settings</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.15rem 0.6rem', borderRadius: '12px' }}>
              Streamlit Equivalent
            </span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
            Configure LLM providers, supervisor behaviors, pipeline persistence, SQL databases, MLflow, and debug options.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.25rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <Save size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.8rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
          <CheckCircle size={17} color="#16a34a" />
          <span>Settings saved and synced across all agents successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* ─── 1. LLM CONFIGURATION (Streamlit Header: LLM) ─── */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div
            onClick={() => toggleSection('llm')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer', backgroundColor: '#fafafa', borderBottom: openSections.llm ? '1px solid #e2e8f0' : 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Cpu size={18} color="#2563eb" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>LLM Provider & Model</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({settings.llm_provider} · {settings.model_name})</span>
            </div>
            {openSections.llm ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
          </div>

          {openSections.llm && (
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Provider</label>
                <select
                  value={settings.llm_provider}
                  onChange={(e) => setSettings({ ...settings, llm_provider: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '0.3rem', backgroundColor: '#ffffff' }}
                >
                  <option value="OpenAI">OpenAI (Cloud)</option>
                  <option value="Ollama">Ollama (Local Models)</option>
                </select>
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                  Choose OpenAI for high-capability models or Ollama for offline local execution.
                </span>
              </div>

              {settings.llm_provider === 'OpenAI' ? (
                <>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>OpenAI API Key</label>
                      {isKeyValid ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>
                          <Check size={12} /> Key format valid
                        </span>
                      ) : apiKeyInput ? (
                        <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600 }}>
                          Format warning (typically starts with sk-...)
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>
                          API key required for OpenAI
                        </span>
                      )}
                    </div>
                    <div style={{ position: 'relative', marginTop: '0.3rem' }}>
                      <Key size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder={settings.openai_api_key_masked || "sk-proj-..."}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 2.5rem 0.5rem 2.2rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                      >
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Model Choice</label>
                    <select
                      value={settings.model_name}
                      onChange={(e) => setSettings({ ...settings, model_name: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '0.3rem', backgroundColor: '#ffffff' }}
                    >
                      <option value="gpt-4o-mini">gpt-4o-mini (Fast & efficient — Default)</option>
                      <option value="gpt-4o">gpt-4o (High performance multimodal)</option>
                      <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                      <option value="gpt-4.1">gpt-4.1</option>
                      <option value="gpt-5-mini">gpt-5-mini</option>
                      <option value="gpt-5.1">gpt-5.1</option>
                      <option value="gpt-5.2">gpt-5.2</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Ollama Base URL</label>
                    <input
                      type="text"
                      value={settings.ollama_base_url || 'http://localhost:11434'}
                      onChange={(e) => setSettings({ ...settings, ollama_base_url: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '0.3rem' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>Usually http://localhost:11434.</span>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Ollama Model Name</label>
                    <input
                      type="text"
                      value={settings.ollama_model || 'llama3.1:8b'}
                      onChange={(e) => setSettings({ ...settings, ollama_model: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '0.3rem' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>e.g. llama3.1:8b, mistral, qwen2.5-coder:7b</span>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={checkOllamaConnection}
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 600, backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Check Ollama Connection
                    </button>
                    {ollamaStatus && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: ollamaStatus.includes('Connected') ? '#16a34a' : '#ef4444' }}>
                        {ollamaStatus}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ─── 2. GENERAL SETTINGS (Streamlit Header: Settings) ─── */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div
            onClick={() => toggleSection('agent')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer', backgroundColor: '#fafafa', borderBottom: openSections.agent ? '1px solid #e2e8f0' : 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sliders size={18} color="#10b981" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Agent Execution & Reasoning</span>
            </div>
            {openSections.agent ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
          </div>

          {openSections.agent && (
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Recursion Limit</label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', backgroundColor: '#eff6ff', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                    {settings.recursion_limit || 10} steps
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="20"
                  step="1"
                  value={settings.recursion_limit || 10}
                  onChange={(e) => setSettings({ ...settings, recursion_limit: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                  Maximum agent loop iterations permitted before terminating supervisor flow (Default: 10).
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Enable short-term memory</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Checkpoints conversation state and multi-turn lineage across agent iterations</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.use_memory}
                  onChange={(e) => setSettings({ ...settings, use_memory: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Proactive workflow mode</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>When enabled, supervisor proposes and runs end-to-end multi-step flows for broad requests</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.proactive_mode}
                  onChange={(e) => setSettings({ ...settings, proactive_mode: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>LLM intent parsing</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Uses a lightweight classifier for ambiguous user queries to improve tool selection</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.intent_parsing}
                  onChange={(e) => setSettings({ ...settings, intent_parsing: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ─── 3. DATA OPTIONS (Streamlit: Data options) ─── */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div
            onClick={() => toggleSection('data')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer', backgroundColor: '#fafafa', borderBottom: openSections.data ? '1px solid #e2e8f0' : 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BarChart3 size={18} color="#f59e0b" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Data & Table Options</span>
            </div>
            {openSections.data ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
          </div>

          {openSections.data && (
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Load sample Telco churn data on startup</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Automatically registers benchmark dataset with 7,043 rows & 21 columns</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.use_sample}
                  onChange={(e) => setSettings({ ...settings, use_sample: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Preview Rows in Workspace</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.preview_rows || 5}
                  onChange={(e) => setSettings({ ...settings, preview_rows: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '0.3rem' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>Default head/tail slice rows to display in table cards.</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── 4. PIPELINE BEHAVIORS & PERSISTENCE (Streamlit: Pipeline options) ─── */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div
            onClick={() => toggleSection('pipeline')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer', backgroundColor: '#fafafa', borderBottom: openSections.pipeline ? '1px solid #e2e8f0' : 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Layers size={18} color="#8b5cf6" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Pipeline Persistence & Graph Behaviors</span>
            </div>
            {openSections.pipeline ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
          </div>

          {openSections.pipeline && (
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Persist Pipeline Directory</label>
                <input
                  type="text"
                  value={settings.pipeline_persist_dir || 'pipeline_reports/pipelines'}
                  onChange={(e) => setSettings({ ...settings, pipeline_persist_dir: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '0.3rem' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                  Writes pipeline_spec.json and pipeline_repro.py for standalone reproducible executions.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Auto-save pipeline files</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Saves latest pipeline spec on each state modification</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pipeline_persist_enabled}
                  onChange={(e) => setSettings({ ...settings, pipeline_persist_enabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Overwrite existing pipeline files</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>If disabled, writes new timestamped revisions</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pipeline_persist_overwrite}
                  onChange={(e) => setSettings({ ...settings, pipeline_persist_overwrite: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Also save SQL artifacts</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Outputs sql/query.sql and sql/sql_executor.py under pipeline folder</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pipeline_persist_include_sql}
                  onChange={(e) => setSettings({ ...settings, pipeline_persist_include_sql: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Preserve all nodes on AI runs</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Append-only graph logic prevents agent runs from dropping existing transform steps</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pipeline_preserve_all_nodes}
                  onChange={(e) => setSettings({ ...settings, pipeline_preserve_all_nodes: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Preserve Pipeline Studio nodes</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Keeps custom Python transforms and code nodes intact</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pipeline_preserve_studio_nodes}
                  onChange={(e) => setSettings({ ...settings, pipeline_preserve_studio_nodes: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Cache Storage Format</label>
                  <select
                    value={settings.pipeline_dataset_cache_format || 'parquet'}
                    onChange={(e) => setSettings({ ...settings, pipeline_dataset_cache_format: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '0.3rem', backgroundColor: '#ffffff' }}
                  >
                    <option value="parquet">Parquet (Compact & Fast)</option>
                    <option value="pickle">Pickle (Fastest for raw Python objects)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Dataset Cache Limit (MB)</label>
                  <input
                    type="number"
                    value={settings.pipeline_dataset_cache_max_mb || 500}
                    onChange={(e) => setSettings({ ...settings, pipeline_dataset_cache_max_mb: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '0.3rem' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── 5. CHAT ↔ PIPELINE CONTEXT (Streamlit: Chat ↔ Pipeline context) ─── */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div
            onClick={() => toggleSection('chat')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer', backgroundColor: '#fafafa', borderBottom: openSections.chat ? '1px solid #e2e8f0' : 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <MessageSquare size={18} color="#0284c7" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Chat ↔ Pipeline Context Synchronization</span>
            </div>
            {openSections.chat ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
          </div>

          {openSections.chat && (
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Include Pipeline Studio context in chat</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Appends current active node details to your chat prompt</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pipeline_chat_context_enabled}
                  onChange={(e) => setSettings({ ...settings, pipeline_chat_context_enabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Include selected node code snippet</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Sends transform Python code to the LLM agent for context</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pipeline_chat_context_include_code}
                  onChange={(e) => setSettings({ ...settings, pipeline_chat_context_include_code: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Use selected Pipeline Studio node for chat</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Selected canvas node becomes target dataset for next query</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pipeline_use_selected_node_for_chat}
                  onChange={(e) => setSettings({ ...settings, pipeline_use_selected_node_for_chat: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Sync Pipeline Studio state to AI</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Keeps agent dataset registry strictly aligned with visual canvas</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pipeline_sync_state_to_agents}
                  onChange={(e) => setSettings({ ...settings, pipeline_sync_state_to_agents: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ─── 6. SQL DATABASE OPTIONS (Streamlit: SQL options) ─── */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div
            onClick={() => toggleSection('sql')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer', backgroundColor: '#fafafa', borderBottom: openSections.sql ? '1px solid #e2e8f0' : 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Database size={18} color="#059669" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>SQL Database Connection</span>
            </div>
            {openSections.sql ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
          </div>

          {openSections.sql && (
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>SQLAlchemy URL</label>
                <input
                  type="text"
                  value={settings.sql_url || 'sqlite:///:memory:'}
                  onChange={(e) => setSettings({ ...settings, sql_url: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '0.3rem', fontFamily: 'monospace' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                  Tip: you can also type in chat `connect to data/northwind.db` or paste postgresql://user:pass@host/db
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Quick Presets:</span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, sql_url: 'sqlite:///:memory:' })}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    SQLite (Memory)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, sql_url: 'sqlite:///data/northwind.db' })}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Northwind Demo DB
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, sql_url: 'postgresql://postgres:password@localhost:5432/analytics' })}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    PostgreSQL Local
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── 7. MLFLOW OPTIONS (Streamlit: MLflow options) ─── */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div
            onClick={() => toggleSection('mlflow')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer', backgroundColor: '#fafafa', borderBottom: openSections.mlflow ? '1px solid #e2e8f0' : 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={18} color="#d97706" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>MLflow Tracking & Registry</span>
            </div>
            {openSections.mlflow ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
          </div>

          {openSections.mlflow && (
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Enable MLflow logging in training</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Records H2O AutoML leaderboards, hyper-parameters, and ROC curves</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enable_mlflow_logging}
                  onChange={(e) => setSettings({ ...settings, enable_mlflow_logging: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>MLflow Tracking URI</label>
                <input
                  type="text"
                  value={settings.mlflow_tracking_uri || 'sqlite:///mlflow.db'}
                  onChange={(e) => setSettings({ ...settings, mlflow_tracking_uri: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '0.3rem', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>MLflow Artifact Root (Local Path)</label>
                <input
                  type="text"
                  value={settings.mlflow_artifact_root || 'mlflow_artifacts'}
                  onChange={(e) => setSettings({ ...settings, mlflow_artifact_root: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '0.3rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>MLflow Experiment Name</label>
                <input
                  type="text"
                  value={settings.mlflow_experiment_name || 'H2O AutoML'}
                  onChange={(e) => setSettings({ ...settings, mlflow_experiment_name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '0.3rem' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ─── 8. DEBUG OPTIONS (Streamlit: Debug options) ─── */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div
            onClick={() => toggleSection('debug')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer', backgroundColor: '#fafafa', borderBottom: openSections.debug ? '1px solid #e2e8f0' : 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Terminal size={18} color="#dc2626" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Debug & Diagnostic Logging</span>
            </div>
            {openSections.debug ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
          </div>

          {openSections.debug && (
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Verbose console logs</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Prints detailed tool arguments, SQL execution, and lineage logs to terminal</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.verbose_logs}
                  onChange={(e) => setSettings({ ...settings, verbose_logs: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Show progress in chat</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Displays real-time indicator of which specialist agent is currently active</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.show_progress}
                  onChange={(e) => setSettings({ ...settings, show_progress: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Show live logs while running</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Streams agent reasoning and stdout during multi-agent execution</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.show_live_logs}
                  onChange={(e) => setSettings({ ...settings, show_live_logs: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Save Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 2rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving Configuration...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
