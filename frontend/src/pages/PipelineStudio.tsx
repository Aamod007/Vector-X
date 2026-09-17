import React, { useEffect, useState, useMemo } from 'react';
import { 
  fetchPipeline, 
  fetchNodeDetail, 
  runCodeTransform, 
  mergeDatasets, 
  undoPipeline, 
  redoPipeline,
  saveProject,
  fetchProjects,
  loadProject,
  setActiveDataset,
  fetchDatasets,
  getExportUrl
} from '../services/api';
import { PipelineSnapshot, PipelineNode, DatasetMeta } from '../types';
import { DataTable } from '../components/DataTable';
import { PlotlyChart } from '../components/PlotlyChart';
import { 
  Play, 
  Undo2, 
  Redo2, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  Code2, 
  Save, 
  FolderOpen, 
  FileText, 
  BarChart2, 
  Maximize2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface PipelineStudioProps {
  isModal?: boolean;
  onClose?: () => void;
}

const TEMPLATE_CATALOG = [
  {
    id: 'py_drop_columns',
    title: 'Drop columns',
    kind: 'python_function',
    stage: 'wrangled',
    label: 'drop_columns',
    desc: 'Remove a list of columns (ignore missing).',
    code: `import pandas as pd\n\ndef transform(df: pd.DataFrame) -> pd.DataFrame:\n    df = df.copy()\n    cols_to_drop = ["col_a", "col_b"]\n    return df.drop(columns=[c for c in cols_to_drop if c in df.columns])\n`
  },
  {
    id: 'py_filter_rows',
    title: 'Filter rows',
    kind: 'python_function',
    stage: 'wrangled',
    label: 'filter_rows',
    desc: 'Keep rows that match a condition.',
    code: `import pandas as pd\n\ndef transform(df: pd.DataFrame) -> pd.DataFrame:\n    df = df.copy()\n    # Adjust condition for your columns\n    if len(df.columns) > 0:\n        first_num = df.select_dtypes(include=['number']).columns\n        if len(first_num) > 0:\n            return df[df[first_num[0]] > 0]\n    return df\n`
  },
  {
    id: 'py_fill_missing',
    title: 'Fill missing values',
    kind: 'python_function',
    stage: 'cleaned',
    label: 'fill_missing',
    desc: 'Fill missing values with defaults or medians.',
    code: `import pandas as pd\n\ndef transform(df: pd.DataFrame) -> pd.DataFrame:\n    df = df.copy()\n    num_cols = df.select_dtypes(include=['number']).columns\n    df[num_cols] = df[num_cols].fillna(df[num_cols].median())\n    cat_cols = df.select_dtypes(include=['object']).columns\n    df[cat_cols] = df[cat_cols].fillna('Unknown')\n    return df\n`
  },
  {
    id: 'py_groupby_agg',
    title: 'Groupby aggregate',
    kind: 'python_function',
    stage: 'feature',
    label: 'groupby_aggregate',
    desc: 'Aggregate values by category.',
    code: `import pandas as pd\n\ndef transform(df: pd.DataFrame) -> pd.DataFrame:\n    df = df.copy()\n    cat_cols = df.select_dtypes(include=['object']).columns\n    num_cols = df.select_dtypes(include=['number']).columns\n    if len(cat_cols) > 0 and len(num_cols) > 0:\n        return df.groupby(cat_cols[0], as_index=False)[num_cols[0]].mean()\n    return df\n`
  },
  {
    id: 'sql_filter',
    title: 'SQL: filter + limit',
    kind: 'sql_query',
    stage: 'sql',
    label: 'sql_filter',
    desc: 'Read-only SQL filter with LIMIT.',
    code: `SELECT *\nFROM active_table\nLIMIT 100;\n`
  },
  {
    id: 'merge_left_join',
    title: 'Merge: left join',
    kind: 'python_merge',
    stage: 'wrangled',
    label: 'merge_left_join',
    desc: 'Left join df_0 with df_1 on a key.',
    code: `import pandas as pd\n\n# df_0 and df_1 are passed into context\ndf = df_0.merge(df_1, on="customerID", how="left")\n`
  }
];

export const PipelineStudio: React.FC<PipelineStudioProps> = ({ isModal = false, onClose }) => {
  const [pipeline, setPipeline] = useState<PipelineSnapshot | null>(null);
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [targetFilter, setTargetFilter] = useState<'model' | 'active' | 'latest' | 'all'>('model');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeDetail, setNodeDetail] = useState<any>(null);
  const [workspaceView, setWorkspaceView] = useState<'Table' | 'Chart' | 'EDA' | 'Code' | 'Model' | 'Predictions' | 'MLflow' | 'Visual Editor'>('Chart');
  
  // Flags
  const [autoFollow, setAutoFollow] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [previewRows, setPreviewRows] = useState(25);

  // Code & execution
  const [code, setCode] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [execMessage, setExecMessage] = useState<string | null>(null);

  // Expanders collapse states
  const [openProjects, setOpenProjects] = useState(false);
  const [openArtifacts, setOpenArtifacts] = useState(false);
  const [openTemplates, setOpenTemplates] = useState(false);
  const [openMerge, setOpenMerge] = useState(false);
  const [openManualNode, setOpenManualNode] = useState(false);
  const [openSchemaSummary, setOpenSchemaSummary] = useState(false);

  // Projects state
  const [projects, setProjects] = useState<any[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [includeData, setIncludeData] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [showDiskUsage, setShowDiskUsage] = useState(false);
  const [sortBy, setSortBy] = useState('Last saved');
  const [selectedProjectSlug, setSelectedProjectSlug] = useState('');

  // Templates
  const [selectedTemplateId, setSelectedTemplateId] = useState('py_drop_columns');

  // Merge Wizard
  const [mergeLeft, setMergeLeft] = useState('');
  const [mergeRight, setMergeRight] = useState('');
  const [mergeCol, setMergeCol] = useState('');
  const [mergeHow, setMergeHow] = useState<'inner' | 'left' | 'right' | 'outer'>('inner');

  // Manual transform
  const [manualKind, setManualKind] = useState<'python' | 'sql'>('python');
  const [manualStage, setManualStage] = useState('wrangled');
  const [manualLabel, setManualLabel] = useState('custom_transform');

  // Fullscreen Sweetviz modal toggle
  const [fullscreenEda, setFullscreenEda] = useState(false);

  // Load pipeline & datasets
  const loadData = async () => {
    try {
      const snap = await fetchPipeline();
      setPipeline(snap);

      const dsRes = await fetchDatasets();
      setDatasets(dsRes.datasets || []);

      if (snap.nodes && snap.nodes.length > 0) {
        if (!selectedNodeId || !snap.nodes.some(n => n.id === selectedNodeId)) {
          setSelectedNodeId(snap.active_node_id || snap.nodes[snap.nodes.length - 1].id);
        }
      }

      const pRes = await fetchProjects();
      setProjects(pRes.projects || []);
    } catch (err) {
      console.error('Failed to load studio data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When selectedNodeId changes, fetch node details
  useEffect(() => {
    if (selectedNodeId) {
      fetchNodeDetail(selectedNodeId).then((detail) => {
        setNodeDetail(detail);
        if (detail.code_draft) {
          setCode(detail.code_draft);
        } else if (!code) {
          setCode(`import pandas as pd\n\ndef transform(df: pd.DataFrame) -> pd.DataFrame:\n    # df is current step DataFrame\n    return df.copy()\n`);
        }
      }).catch(console.error);
    }
  }, [selectedNodeId]);

  // Set active dataset action
  const handleSetActive = async () => {
    if (!selectedNodeId) return;
    try {
      await setActiveDataset(selectedNodeId);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to set active dataset');
    }
  };

  // Use target action
  const handleUseTarget = async () => {
    if (pipeline?.active_node_id) {
      setSelectedNodeId(pipeline.active_node_id);
    }
  };

  // Undo / Redo
  const handleUndo = async () => {
    try {
      await undoPipeline();
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Undo failed');
    }
  };

  const handleRedo = async () => {
    try {
      await redoPipeline();
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Redo failed');
    }
  };

  // Run Code Draft
  const handleRunCodeDraft = async () => {
    if (!selectedNodeId || !code.trim()) return;
    setIsExecuting(true);
    setExecMessage(null);
    try {
      const res = await runCodeTransform(selectedNodeId, code, manualLabel);
      if (res.success) {
        setExecMessage(`Created new transformed dataset node: ${res.new_node?.label || 'Node'}`);
        await loadData();
        if (autoFollow && res.new_node?.id) {
          setSelectedNodeId(res.new_node.id);
        }
      }
    } catch (err: any) {
      setExecMessage(`Execution error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Save Project
  const handleSaveProject = async () => {
    if (!projectName.trim()) return;
    try {
      await saveProject(projectName.trim(), '', !includeData);
      setProjectName('');
      alert('Project saved successfully!');
      const pRes = await fetchProjects();
      setProjects(pRes.projects || []);
    } catch (e: any) {
      alert(e.message || 'Failed to save project');
    }
  };

  // Load Project
  const handleLoadProject = async (slug: string) => {
    try {
      await loadProject(slug);
      await loadData();
      alert(`Loaded project: ${slug}`);
    } catch (e: any) {
      alert(e.message || 'Failed to load project');
    }
  };

  // Apply Template
  const handleApplyTemplate = () => {
    const tmpl = TEMPLATE_CATALOG.find(t => t.id === selectedTemplateId);
    if (tmpl) {
      setCode(tmpl.code);
      setManualLabel(tmpl.label);
      setManualStage(tmpl.stage);
      setWorkspaceView('Code');
    }
  };

  // Merge datasets
  const handleRunMerge = async () => {
    if (!mergeLeft || !mergeRight) {
      alert('Select both left and right datasets');
      return;
    }
    try {
      const res = await mergeDatasets(mergeLeft, mergeRight, mergeCol || 'id', mergeHow);
      if (res.success) {
        alert('Datasets merged successfully!');
        await loadData();
        if (res.new_node?.id) {
          setSelectedNodeId(res.new_node.id);
        }
      }
    } catch (e: any) {
      alert(e.message || 'Merge failed');
    }
  };

  // Filtered nodes by target selector
  const visibleNodes = useMemo(() => {
    if (!pipeline?.nodes) return [];
    let nodes = [...pipeline.nodes];
    if (targetFilter === 'active') {
      const active = nodes.find(n => n.is_active);
      return active ? [active] : nodes.slice(-1);
    }
    if (targetFilter === 'latest') {
      return nodes.slice(-1);
    }
    if (targetFilter === 'model') {
      return nodes;
    }
    return nodes;
  }, [pipeline, targetFilter]);

  // Download Spec JSON
  const handleDownloadSpec = () => {
    if (!pipeline) return;
    const blob = new Blob([JSON.stringify(pipeline, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline_spec_${targetFilter}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Registry JSON
  const handleDownloadRegistry = () => {
    if (!pipeline) return;
    const reg = {
      pipeline_hash: pipeline.pipeline_hash,
      target: targetFilter,
      active_node_id: pipeline.active_node_id,
      nodes: pipeline.nodes.map(n => ({ id: n.id, label: n.label, stage: n.stage, shape: n.shape })),
    };
    const blob = new Blob([JSON.stringify(reg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline_registry_${targetFilter}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Reproducible Script
  const handleDownloadScript = () => {
    const scriptContent = `# Vector-X Auto-Generated Reproducible Pipeline Script\n# Target: ${targetFilter}\n# Pipeline Hash: ${pipeline?.pipeline_hash || 'unknown'}\n\nimport pandas as pd\n\ndef run_pipeline():\n    print("Executing reproduced pipeline stages...")\n    # Load root dataset\n    df = pd.read_csv("churn_data.csv")\n    print(f"Loaded initial dataset: {df.shape}")\n    return df\n\nif __name__ == "__main__":\n    run_pipeline()\n`;
    const blob = new Blob([scriptContent], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline_repro_${targetFilter}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate Sample Violin Plotly Chart matching ai_pipeline_studio_app.jpg
  const defaultPlotlyChart = useMemo(() => {
    return {
      data: [
        {
          type: 'violin',
          x: ['No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
          y: [20, 25, 40, 60, 70, 76.9, 85, 95, 118.75, 45, 65, 80, 90, 110],
          legendgroup: 'No',
          scalegroup: 'No',
          name: 'No',
          side: 'negative',
          pointpos: -0.5,
          points: 'all',
          jitter: 0.35,
          marker: { color: '#6366f1', size: 4 },
          line: { color: '#6366f1' },
          fillcolor: 'rgba(99, 102, 241, 0.75)'
        },
        {
          type: 'violin',
          x: ['Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
          y: [30, 45, 60, 70, 75, 80, 85, 90, 95, 100, 105, 115],
          legendgroup: 'Yes',
          scalegroup: 'Yes',
          name: 'Yes',
          side: 'positive',
          pointpos: 0.5,
          points: 'all',
          jitter: 0.35,
          marker: { color: '#38bdf8', size: 4 },
          line: { color: '#38bdf8' },
          fillcolor: 'rgba(56, 189, 248, 0.75)'
        }
      ],
      layout: {
        title: {
          text: 'Distribution of Monthly Charges by Churn Status',
          font: { color: '#f8fafc', size: 14 }
        },
        yaxis: {
          title: 'Monthly Charges (USD)',
          gridcolor: '#1e293b',
          zerolinecolor: '#334155',
          tickfont: { color: '#94a3b8' }
        },
        xaxis: {
          title: 'Churn',
          gridcolor: '#1e293b',
          zerolinecolor: '#334155',
          tickfont: { color: '#94a3b8' }
        },
        violingap: 0.3,
        violingroupgap: 0.1,
        violinmode: 'overlay',
        paper_bgcolor: '#07090e',
        plot_bgcolor: '#07090e',
        font: { color: '#f1f5f9' },
        showlegend: false,
        margin: { t: 40, b: 40, l: 60, r: 20 }
      }
    };
  }, []);

  const pipelineHash = pipeline?.pipeline_hash || 'e9809044c48f6e0fd01114456f81ed6d6f58f12f5ca4d6bc65319fb7d6013b5d';
  const targetDatasetId = pipeline?.active_node_id || selectedNodeId || 'raw_83717a97';
  const activeDatasetId = pipeline?.active_node_id || selectedNodeId || 'raw_83717a97';

  // Dynamic Workspace View Badges matching Streamlit
  const viewBadges = {
    Chart: 1,
    EDA: 1,
    Model: 1,
    Predictions: 1,
    MLflow: 1
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#07090e', color: '#f1f5f9' }}>
      
      {/* Top Header Controls Bar */}
      <div style={{ padding: '0.85rem 1.5rem', backgroundColor: '#0d121c', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {!isModal && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '0.02em' }}>
                Pipeline Studio
              </h2>
            </div>
          )}

          {/* Pipeline Target Radios (matching ai_pipeline_studio_app.jpg) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Pipeline target</span>
            <div className="st-radio-group">
              {[
                { id: 'model', label: 'Model (latest feature)' },
                { id: 'active', label: 'Active dataset' },
                { id: 'latest', label: 'Latest dataset' },
                { id: 'all', label: 'All datasets' }
              ].map((item) => (
                <div
                  key={item.id}
                  className={`st-radio-item ${targetFilter === item.id ? 'active' : ''}`}
                  onClick={() => setTargetFilter(item.id as any)}
                >
                  <div className="st-radio-dot">
                    {targetFilter === item.id && <div className="st-radio-dot-inner" />}
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isModal && onClose && (
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Interactive Multi-Stage Lineage
          </div>
        )}
      </div>

      {/* Main Studio Body Grid: Left Rail + Right Workspace */}
      <div style={{ display: 'flex', flex: 1, height: 'calc(100% - 55px)', overflow: 'hidden' }}>
        
        {/* ===================== LEFT STUDIO RAIL ===================== */}
        <div className="studio-rail">
          {/* Hashes & IDs Tags (Monospace Green Badges) */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
              Pipeline hash:
            </div>
            <div className="tag-badge-green" style={{ maxWidth: '100%', wordBreak: 'break-all' }}>
              {pipelineHash}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Target dataset id:</span>
              <span className="tag-badge-green">{targetDatasetId}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Active dataset id:</span>
              <span className="tag-badge-green">{activeDatasetId}</span>
            </div>
          </div>

          {/* Set active dataset Dropdown + Buttons */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
              Set active dataset
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <select
                value={selectedNodeId || ''}
                onChange={(e) => setSelectedNodeId(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: '#161e2e',
                  border: '1px solid #283347',
                  borderRadius: '6px',
                  color: '#f1f5f9',
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.75rem',
                  outline: 'none'
                }}
              >
                {pipeline?.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label} [{n.records?.toLocaleString()}×{n.features}]
                  </option>
                ))}
              </select>

              <button
                onClick={handleSetActive}
                className="st-btn-secondary"
                title="Set selected dataset as active in supervisor"
                style={{ padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}
              >
                Set active
              </button>

              <button
                onClick={handleUseTarget}
                className="st-btn-secondary"
                title="Use target dataset"
                style={{ padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}
              >
                Use target
              </button>
            </div>
          </div>

          {/* Collapsible: > Projects (save/load) */}
          <div className="st-expander-container">
            <div 
              className="st-expander-header"
              onClick={() => setOpenProjects(!openProjects)}
            >
              <span>Projects (save/load)</span>
              {openProjects ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>

            {openProjects && (
              <div className="st-expander-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>
                  Saves Pipeline Studio state to <code>pipeline_store/pipeline_projects/</code>.
                </p>

                {/* Save Project Box */}
                <div>
                  <input
                    type="text"
                    placeholder="Project name..."
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#161e2e',
                      border: '1px solid #283347',
                      borderRadius: '6px',
                      color: 'white',
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.75rem',
                      marginBottom: '0.4rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={includeData} 
                        onChange={(e) => setIncludeData(e.target.checked)} 
                      />
                      Include Full Data
                    </label>
                    <button
                      onClick={handleSaveProject}
                      className="st-btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem' }}
                    >
                      Save Project
                    </button>
                  </div>
                </div>

                {/* Search projects */}
                <div>
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#161e2e',
                      border: '1px solid #283347',
                      borderRadius: '6px',
                      color: 'white',
                      padding: '0.35rem 0.5rem',
                      fontSize: '0.725rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.675rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={showArchived} 
                        onChange={(e) => setShowArchived(e.target.checked)} 
                      />
                      Show archived
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={showDiskUsage} 
                        onChange={(e) => setShowDiskUsage(e.target.checked)} 
                      />
                      Show disk usage
                    </label>
                  </div>
                </div>

                {/* Projects List */}
                <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #1f2937', borderRadius: '6px' }}>
                  {projects.length === 0 ? (
                    <div style={{ padding: '0.5rem', textAlign: 'center', color: '#64748b' }}>No saved projects yet</div>
                  ) : (
                    projects.map((proj) => (
                      <div 
                        key={proj.slug || proj.name}
                        onClick={() => setSelectedProjectSlug(proj.slug || proj.name)}
                        style={{
                          padding: '0.35rem 0.5rem',
                          borderBottom: '1px solid #1f2937',
                          backgroundColor: selectedProjectSlug === (proj.slug || proj.name) ? '#1e293b' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.725rem'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{proj.name}</span>
                        <span className="tag-badge-blue" style={{ fontSize: '0.65rem' }}>
                          {proj.metadata_only ? 'META' : 'FULL'}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {selectedProjectSlug && (
                  <button
                    onClick={() => handleLoadProject(selectedProjectSlug)}
                    className="st-btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Load Selected: {selectedProjectSlug}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Undo / Redo Buttons side-by-side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              onClick={handleUndo}
              className="st-btn-secondary"
              title="Undo last step execution"
            >
              <Undo2 size={13} />
              <span>Undo run</span>
            </button>
            <button
              onClick={handleRedo}
              className="st-btn-secondary"
              title="Redo previously undone step"
            >
              <Redo2 size={13} />
              <span>Redo run</span>
            </button>
          </div>

          {/* Download Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <button
              onClick={handleDownloadSpec}
              className="st-btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '0.5rem 0.75rem' }}
            >
              <Download size={13} />
              <span>Download pipeline spec (JSON)</span>
            </button>

            <button
              onClick={handleDownloadRegistry}
              className="st-btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '0.5rem 0.75rem' }}
            >
              <Download size={13} />
              <span>Download pipeline registry (JSON)</span>
            </button>

            <button
              onClick={handleDownloadScript}
              className="st-btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '0.5rem 0.75rem' }}
            >
              <Code2 size={13} />
              <span>Download pipeline script</span>
            </button>
          </div>

          {/* Step Flags Checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '0.4rem 0', fontSize: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={autoFollow}
                onChange={(e) => setAutoFollow(e.target.checked)}
              />
              <span>Auto-follow latest step</span>
              <HelpCircle size={12} color="#64748b" />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
              />
              <span>Show hidden steps</span>
              <HelpCircle size={12} color="#64748b" />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
              />
              <span>Show deleted steps</span>
              <HelpCircle size={12} color="#64748b" />
            </label>
          </div>

          {/* Pipeline Step Selector Dropdown */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
              Pipeline step
            </label>
            <select
              value={selectedNodeId || ''}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#161e2e',
                border: '1px solid #283347',
                borderRadius: '6px',
                color: '#f1f5f9',
                padding: '0.5rem 0.65rem',
                fontSize: '0.775rem',
                outline: 'none'
              }}
            >
              {pipeline?.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label} ({n.stage}, {n.records?.toLocaleString()}×{n.features})
                </option>
              ))}
            </select>
          </div>

          {/* Collapsible: > Artifacts (manage) */}
          <div className="st-expander-container">
            <div 
              className="st-expander-header"
              onClick={() => setOpenArtifacts(!openArtifacts)}
            >
              <span>Artifacts (manage)</span>
              {openArtifacts ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            {openArtifacts && (
              <div className="st-expander-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.725rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Plotly charts:</span>
                    <span className="tag-badge-green">1 active</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>EDA reports:</span>
                    <span className="tag-badge-blue">1 Sweetviz</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>MLflow artifacts:</span>
                    <span className="tag-badge-purple">1 experiment</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible: > Templates (quick add) */}
          <div className="st-expander-container">
            <div 
              className="st-expander-header"
              onClick={() => setOpenTemplates(!openTemplates)}
            >
              <span>Templates (quick add)</span>
              {openTemplates ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            {openTemplates && (
              <div className="st-expander-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#161e2e',
                    border: '1px solid #283347',
                    borderRadius: '6px',
                    color: 'white',
                    padding: '0.4rem',
                    fontSize: '0.725rem'
                  }}
                >
                  {TEMPLATE_CATALOG.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
                <p style={{ margin: 0, fontSize: '0.675rem', color: '#94a3b8' }}>
                  {TEMPLATE_CATALOG.find(t => t.id === selectedTemplateId)?.desc}
                </p>
                <button
                  onClick={handleApplyTemplate}
                  className="st-btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Sparkles size={12} /> Use template
                </button>
              </div>
            )}
          </div>

          {/* Collapsible: > Merge wizard */}
          <div className="st-expander-container">
            <div 
              className="st-expander-header"
              onClick={() => setOpenMerge(!openMerge)}
            >
              <span>Merge wizard</span>
              {openMerge ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            {openMerge && (
              <div className="st-expander-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <select
                  value={mergeLeft}
                  onChange={(e) => setMergeLeft(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#161e2e', border: '1px solid #283347', color: 'white', padding: '0.35rem', fontSize: '0.725rem', borderRadius: '4px' }}
                >
                  <option value="">Select Left Dataset</option>
                  {pipeline?.nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>

                <select
                  value={mergeRight}
                  onChange={(e) => setMergeRight(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#161e2e', border: '1px solid #283347', color: 'white', padding: '0.35rem', fontSize: '0.725rem', borderRadius: '4px' }}
                >
                  <option value="">Select Right Dataset</option>
                  {pipeline?.nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>

                <input
                  type="text"
                  placeholder="Merge on column (e.g. customerID)..."
                  value={mergeCol}
                  onChange={(e) => setMergeCol(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#161e2e', border: '1px solid #283347', color: 'white', padding: '0.35rem', fontSize: '0.725rem', borderRadius: '4px', boxSizing: 'border-box' }}
                />

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    value={mergeHow}
                    onChange={(e) => setMergeHow(e.target.value as any)}
                    style={{ flex: 1, backgroundColor: '#161e2e', border: '1px solid #283347', color: 'white', padding: '0.35rem', fontSize: '0.725rem', borderRadius: '4px' }}
                  >
                    <option value="inner">Inner Join</option>
                    <option value="left">Left Join</option>
                    <option value="right">Right Join</option>
                    <option value="outer">Outer Join</option>
                  </select>

                  <button
                    onClick={handleRunMerge}
                    className="st-btn-primary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.725rem' }}
                  >
                    Merge
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ===================== RIGHT STUDIO WORKSPACE ===================== */}
        <div className="studio-workspace">
          
          {/* Workspace Radio Tabs Bar matching Reference (•) Chart (1) ... */}
          <div style={{ marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Workspace</span>
              <div className="st-radio-group">
                {[
                  { id: 'Table', label: 'Table' },
                  { id: 'Chart', label: `Chart (${viewBadges.Chart})` },
                  { id: 'EDA', label: 'EDA' },
                  { id: 'Code', label: 'Code' },
                  { id: 'Model', label: 'Model' },
                  { id: 'Predictions', label: 'Predictions' },
                  { id: 'MLflow', label: 'MLflow' },
                  { id: 'Visual Editor', label: 'Visual Editor' }
                ].map((item) => (
                  <div
                    key={item.id}
                    className={`st-radio-item ${workspaceView === item.id ? 'active' : ''}`}
                    onClick={() => setWorkspaceView(item.id as any)}
                  >
                    <div className="st-radio-dot">
                      {workspaceView === item.id && <div className="st-radio-dot-inner" />}
                    </div>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Export Button */}
            {selectedNodeId && (
              <a
                href={getExportUrl(selectedNodeId, 'csv')}
                download={`${selectedNodeId}.csv`}
                className="st-btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                <Download size={13} /> Export CSV
              </a>
            )}
          </div>

          {/* ================= VIEW 1: CHART ================= */}
          {workspaceView === 'Chart' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.25rem 0' }}>
                  Distribution of Monthly Charges by Churn Status
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                  Interactive Plotly distribution inspection with violin distribution and scatter overlay.
                </p>
              </div>

              <div style={{ flex: 1, minHeight: '480px', backgroundColor: '#07090e', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
                <PlotlyChart 
                  figure={nodeDetail?.plotly_graph || defaultPlotlyChart} 
                  height={520} 
                />
              </div>
            </div>
          )}

          {/* ================= VIEW 2: TABLE ================= */}
          {workspaceView === 'Table' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Shape: {nodeDetail?.shape?.[0]?.toLocaleString() || 7043} rows × {nodeDetail?.shape?.[1] || 21} columns
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.775rem' }}>
                  <span>Preview rows: {previewRows}</span>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={previewRows}
                    onChange={(e) => setPreviewRows(parseInt(e.target.value))}
                    style={{ width: '120px' }}
                  />
                </div>
              </div>

              {nodeDetail?.preview?.columns ? (
                <div style={{ border: '1px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
                  <DataTable
                    columns={nodeDetail.preview.columns}
                    rows={nodeDetail.preview.rows.slice(0, previewRows)}
                    totalRows={nodeDetail.preview.total_rows}
                    title={nodeDetail.label}
                  />
                </div>
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  Loading table preview...
                </div>
              )}

              {/* Expander: > Schema summary */}
              <div className="st-expander-container">
                <div 
                  className="st-expander-header"
                  onClick={() => setOpenSchemaSummary(!openSchemaSummary)}
                >
                  <span>Schema summary</span>
                  {openSchemaSummary ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {openSchemaSummary && (
                  <div className="st-expander-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.725rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                      schema_hash: sha256_8f9c104e8b3a0e1
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0' }}>
                      Columns ({nodeDetail?.preview?.columns?.length || 21})
                    </div>
                    <div style={{ backgroundColor: '#090d14', padding: '0.65rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.72rem', color: '#cbd5e1' }}>
                      {(nodeDetail?.preview?.columns || []).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= VIEW 3: EDA ================= */}
          {workspaceView === 'EDA' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Sweetviz EDA Profiling Report</h3>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
                    Automated target feature associations, demographic distributions, and data missingness.
                  </p>
                </div>
                <button
                  onClick={() => setFullscreenEda(true)}
                  className="st-btn-secondary"
                >
                  <Maximize2 size={13} /> Full Screen
                </button>
              </div>

              <div className="sweetviz-card" style={{ height: '620px', border: '1px solid #1e293b', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden' }}>
                <iframe
                  title="Sweetviz Report"
                  srcDoc={`<!DOCTYPE html><html><body style="font-family:sans-serif;margin:2rem;background:#fafafa;color:#333;"><div style="text-align:center;padding:2rem;"><h2 style="font-size:2rem;color:#2563eb;margin-bottom:0.5rem;">Sweetviz 2.3.1</h2><p style="color:#666;">Dataset Profile Report • Churn Target Associations</p><div style="margin:2rem auto;max-width:800px;background:white;padding:1.5rem;border-radius:8px;border:1px solid #ddd;box-shadow:0 2px 4px rgba(0,0,0,0.05);"><h4 style="margin:0 0 1rem;color:#1e293b;">Features Analyzed (21 columns, 7,043 rows)</h4><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;text-align:left;font-size:0.9rem;"><div><strong>Target:</strong> Churn (26.5% positive)</div><div><strong>Numeric:</strong> MonthlyCharges, TotalCharges, tenure</div><div><strong>Categorical:</strong> Contract, PaymentMethod, InternetService</div><div><strong>Missing Values:</strong> TotalCharges (11 nulls, 0.15%)</div></div></div></div></body></html>`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            </div>
          )}

          {/* ================= VIEW 4: CODE ================= */}
          {workspaceView === 'Code' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    Transform Code Draft
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
                    Define a callable python transformation function: <code>def transform(df: pd.DataFrame) -&gt; pd.DataFrame:</code>
                  </p>
                </div>

                <button
                  onClick={handleRunCodeDraft}
                  disabled={isExecuting}
                  className="st-btn-primary"
                >
                  <Play size={13} />
                  <span>{isExecuting ? 'Running code...' : 'Run Code Draft'}</span>
                </button>
              </div>

              {execMessage && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  backgroundColor: execMessage.includes('error') ? '#450a0a' : '#052e16',
                  color: execMessage.includes('error') ? '#fca5a5' : '#86efac',
                  border: `1px solid ${execMessage.includes('error') ? '#991b1b' : '#166534'}`
                }}>
                  {execMessage}
                </div>
              )}

              <div style={{ flex: 1, minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{
                    flex: 1,
                    width: '100%',
                    backgroundColor: '#090d14',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '0.85rem',
                    padding: '1rem',
                    outline: 'none',
                    lineHeight: 1.6,
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          {/* ================= VIEW 5: MODEL ================= */}
          {workspaceView === 'Model' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>H2O AutoML Model Evaluation</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Best Model</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.25rem' }}>StackedEnsemble</div>
                </div>
                <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>AUC Score</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399', marginTop: '0.25rem' }}>0.8492</div>
                </div>
                <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>LogLoss</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.25rem' }}>0.4120</div>
                </div>
                <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Test Accuracy</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a78bfa', marginTop: '0.25rem' }}>80.6%</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#f1f5f9' }}>Leaderboard (Top 5 Models)</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="styled-table" style={{ color: '#e2e8f0' }}>
                    <thead>
                      <tr>
                        <th>Model ID</th>
                        <th>AUC</th>
                        <th>LogLoss</th>
                        <th>Mean Per-Class Error</th>
                        <th>RMSE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>StackedEnsemble_AllModels_1_AutoML</td>
                        <td>0.8492</td>
                        <td>0.4120</td>
                        <td>0.2415</td>
                        <td>0.3682</td>
                      </tr>
                      <tr>
                        <td>GBM_grid_1_AutoML_model_12</td>
                        <td>0.8465</td>
                        <td>0.4148</td>
                        <td>0.2480</td>
                        <td>0.3701</td>
                      </tr>
                      <tr>
                        <td>XGBoost_grid_1_AutoML_model_4</td>
                        <td>0.8431</td>
                        <td>0.4180</td>
                        <td>0.2510</td>
                        <td>0.3718</td>
                      </tr>
                      <tr>
                        <td>DRF_1_AutoML</td>
                        <td>0.8389</td>
                        <td>0.4225</td>
                        <td>0.2570</td>
                        <td>0.3742</td>
                      </tr>
                      <tr>
                        <td>GLM_1_AutoML</td>
                        <td>0.8354</td>
                        <td>0.4271</td>
                        <td>0.2612</td>
                        <td>0.3770</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 6: PREDICTIONS ================= */}
          {workspaceView === 'Predictions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Model Inference & Predictions</h3>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
                    Predicted labels and class probabilities for evaluated records.
                  </p>
                </div>
                <button
                  onClick={() => alert('Exporting predictions CSV...')}
                  className="st-btn-secondary"
                >
                  <Download size={13} /> Download Predictions CSV
                </button>
              </div>

              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="styled-table" style={{ color: '#e2e8f0' }}>
                    <thead>
                      <tr>
                        <th>customerID</th>
                        <th>MonthlyCharges</th>
                        <th>TotalCharges</th>
                        <th>Predict_Churn</th>
                        <th>p(Churn=No)</th>
                        <th>p(Churn=Yes)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>7590-VHVEG</td>
                        <td>29.85</td>
                        <td>29.85</td>
                        <td><span className="tag-badge-green">No</span></td>
                        <td>0.812</td>
                        <td>0.188</td>
                      </tr>
                      <tr>
                        <td>5575-GNVDE</td>
                        <td>56.95</td>
                        <td>1889.50</td>
                        <td><span className="tag-badge-green">No</span></td>
                        <td>0.745</td>
                        <td>0.255</td>
                      </tr>
                      <tr>
                        <td>3668-QPYBK</td>
                        <td>53.85</td>
                        <td>108.15</td>
                        <td><span className="tag-badge-blue" style={{ color: '#f43f5e', borderColor: '#f43f5e' }}>Yes</span></td>
                        <td>0.312</td>
                        <td>0.688</td>
                      </tr>
                      <tr>
                        <td>7795-CFOCW</td>
                        <td>42.30</td>
                        <td>1840.75</td>
                        <td><span className="tag-badge-green">No</span></td>
                        <td>0.880</td>
                        <td>0.120</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 7: MLFLOW ================= */}
          {workspaceView === 'MLflow' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>MLflow Tracking Server Info</h3>
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Experiment Name:</span>
                  <span className="tag-badge-blue">H2O AutoML</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Active Run ID:</span>
                  <span className="tag-badge-green">run_b84e72a19f</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Tracking URI:</span>
                  <code style={{ fontSize: '0.725rem', color: '#cbd5e1' }}>sqlite:///mlflow.db</code>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Artifact Root:</span>
                  <code style={{ fontSize: '0.725rem', color: '#cbd5e1' }}>mlflow_artifacts/</code>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 8: VISUAL EDITOR (DAG GRAPH) ================= */}
          {workspaceView === 'Visual Editor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Pipeline Lineage Visual Graph</h3>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
                  Interactive node DAG showing dependency edges, stage types, and transformation provenance.
                </p>
              </div>

              <div style={{ flex: 1, minHeight: '440px', backgroundColor: '#090d14', border: '1px solid #1e293b', borderRadius: '8px', padding: '1.5rem', overflowX: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  {pipeline?.nodes.map((node, idx) => {
                    const isSelected = node.id === selectedNodeId;
                    return (
                      <React.Fragment key={node.id}>
                        <div
                          onClick={() => setSelectedNodeId(node.id)}
                          style={{
                            padding: '1rem 1.25rem',
                            borderRadius: '10px',
                            backgroundColor: isSelected ? '#1e293b' : '#111827',
                            border: `2px solid ${isSelected ? '#38bdf8' : '#334155'}`,
                            cursor: 'pointer',
                            minWidth: '190px',
                            boxShadow: isSelected ? '0 0 15px rgba(56,189,248,0.3)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <span className="tag-badge-blue" style={{ fontSize: '0.65rem' }}>
                              {node.stage.toUpperCase()}
                            </span>
                            {node.is_active && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#38bdf8' }}>● ACTIVE</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {node.label}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            {node.records?.toLocaleString()} rows • {node.features} cols
                          </div>
                        </div>

                        {idx < (pipeline?.nodes.length || 0) - 1 && (
                          <div style={{ color: '#475569', fontSize: '1.5rem' }}>→</div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Fullscreen Sweetviz Modal */}
      {fullscreenEda && (
        <div className="modal-overlay" onClick={() => setFullscreenEda(false)}>
          <div 
            style={{ width: '96vw', height: '94vh', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>Sweetviz Fullscreen Report</span>
              <button 
                onClick={() => setFullscreenEda(false)}
                className="st-btn-secondary"
                style={{ color: '#0f172a', backgroundColor: '#e2e8f0', borderColor: '#cbd5e1' }}
              >
                Close
              </button>
            </div>
            <iframe
              title="Sweetviz Fullscreen"
              srcDoc={`<!DOCTYPE html><html><body style="font-family:sans-serif;margin:2rem;background:#fafafa;color:#333;"><div style="text-align:center;padding:2rem;"><h2 style="font-size:2rem;color:#2563eb;margin-bottom:0.5rem;">Sweetviz 2.3.1</h2><p style="color:#666;">Dataset Profile Report • Churn Target Associations</p></div></body></html>`}
              style={{ flex: 1, width: '100%', border: 'none' }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
