import React, { useEffect, useState } from 'react';
import { 
  fetchPipeline, 
  fetchNodeDetail, 
  runCodeTransform, 
  mergeDatasets, 
  undoPipeline, 
  redoPipeline,
  saveProject,
  fetchProjects,
  loadProject
} from '../services/api';
import { PipelineSnapshot, PipelineNode } from '../types';
import { DataTable } from '../components/DataTable';
import { 
  GitFork, 
  Play, 
  Undo2, 
  Redo2, 
  FolderPlus, 
  Combine, 
  ArrowRight, 
  Check, 
  Layers, 
  Code2, 
  Save, 
  FolderOpen 
} from 'lucide-react';

export const PipelineStudio: React.FC = () => {
  const [pipeline, setPipeline] = useState<PipelineSnapshot | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeDetail, setNodeDetail] = useState<any>(null);
  const [code, setCode] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [execMessage, setExecMessage] = useState<string | null>(null);

  // Merge modal state
  const [showMerge, setShowMerge] = useState(false);
  const [mergeLeft, setMergeLeft] = useState('');
  const [mergeRight, setMergeRight] = useState('');
  const [mergeCol, setMergeCol] = useState('');

  // Project modal state
  const [showSaveProject, setShowSaveProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [showLoadProject, setShowLoadProject] = useState(false);

  const loadPipeline = () => {
    fetchPipeline().then((snap) => {
      setPipeline(snap);
      if (!selectedNodeId && snap.active_node_id) {
        setSelectedNodeId(snap.active_node_id);
      } else if (!selectedNodeId && snap.nodes.length) {
        setSelectedNodeId(snap.nodes[0].id);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  useEffect(() => {
    if (selectedNodeId) {
      fetchNodeDetail(selectedNodeId).then((detail) => {
        setNodeDetail(detail);
        setCode(detail.code_draft || '');
      }).catch(console.error);
    }
  }, [selectedNodeId]);

  const handleRunTransform = async () => {
    if (!selectedNodeId || !code.trim()) return;
    setIsExecuting(true);
    setExecMessage(null);
    try {
      const res = await runCodeTransform(selectedNodeId, code);
      if (res.success) {
        setExecMessage(`Successfully created transformed node: ${res.new_node?.label}`);
        loadPipeline();
        setSelectedNodeId(res.new_node?.id);
      }
    } catch (err: any) {
      setExecMessage(`Execution error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleUndo = async () => {
    await undoPipeline();
    loadPipeline();
  };

  const handleRedo = async () => {
    await redoPipeline();
    loadPipeline();
  };

  const handleMerge = async () => {
    if (!mergeLeft || !mergeRight) return;
    try {
      const res = await mergeDatasets(mergeLeft, mergeRight, mergeCol);
      if (res.success) {
        setShowMerge(false);
        loadPipeline();
        setSelectedNodeId(res.new_node?.id);
      }
    } catch (e: any) {
      alert(e.message || 'Merge failed');
    }
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) return;
    await saveProject(projectName);
    setShowSaveProject(false);
    setProjectName('');
    alert('Project saved successfully!');
  };

  const handleOpenLoadProject = async () => {
    const res = await fetchProjects();
    setProjectsList(res.projects || []);
    setShowLoadProject(true);
  };

  const handleLoadSelectedProject = async (slug: string) => {
    await loadProject(slug);
    setShowLoadProject(false);
    loadPipeline();
  };

  return (
    <div className="view-container">
      {/* Top action header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>AI Pipeline Studio</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Visual lineage, reproducible code transformations, and interactive step execution.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleUndo}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
            title="Undo last step"
          >
            <Undo2 size={14} /> Undo
          </button>
          <button
            onClick={handleRedo}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
            title="Redo step"
          >
            <Redo2 size={14} /> Redo
          </button>
          <button
            onClick={() => setShowMerge(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
          >
            <Combine size={14} /> Merge Datasets
          </button>
          <button
            onClick={() => setShowSaveProject(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
          >
            <Save size={14} /> Save Project
          </button>
          <button
            onClick={handleOpenLoadProject}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            <FolderOpen size={14} /> Load Project
          </button>
        </div>
      </div>

      {/* Visual Pipeline Node Flowchart */}
      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)', overflowX: 'auto' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          LINEAGE GRAPH ({pipeline?.nodes.length || 0} NODES)
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 'max-content', padding: '0.5rem 0' }}>
          {pipeline?.nodes.map((node, index) => {
            const isSelected = node.id === selectedNodeId;
            return (
              <React.Fragment key={node.id}>
                <div
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{
                    padding: '0.85rem 1.1rem',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? '#eff6ff' : node.bg || '#f8fafc',
                    border: `2px solid ${isSelected ? '#2563eb' : node.color || '#cbd5e1'}`,
                    cursor: 'pointer',
                    minWidth: '180px',
                    boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.675rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '4px', backgroundColor: 'white', border: `1px solid ${node.color}` }}>
                      {node.badge || node.stage}
                    </span>
                    {node.is_active && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#2563eb' }}>● ACTIVE</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {node.label}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.2rem' }}>
                    {node.records?.toLocaleString()} rows • {node.features} cols
                  </div>
                </div>

                {index < (pipeline?.nodes.length || 0) - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                    <ArrowRight size={18} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Node Details & Code Draft Editor */}
      {nodeDetail && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Left: Step Info & Table Preview */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="#2563eb" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{nodeDetail.label}</h3>
              </div>
              <span className="raw-badge">{nodeDetail.stage?.toUpperCase()}</span>
            </div>

            <div style={{ fontSize: '0.775rem', color: '#64748b', marginBottom: '1rem' }}>
              {nodeDetail.shape?.[0]?.toLocaleString()} rows • {nodeDetail.shape?.[1]} columns • Created by {nodeDetail.created_by}
            </div>

            {nodeDetail.preview?.columns ? (
              <DataTable
                columns={nodeDetail.preview.columns}
                rows={nodeDetail.preview.rows}
                totalRows={nodeDetail.preview.total_rows}
                title={nodeDetail.label}
              />
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Preview not available</div>
            )}
          </div>

          {/* Right: Interactive Code Draft Transform */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code2 size={18} color="#10b981" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Code Draft / Transformation</h3>
              </div>
              <button
                onClick={handleRunTransform}
                disabled={isExecuting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isExecuting ? 'not-allowed' : 'pointer'
                }}
              >
                <Play size={13} />
                <span>{isExecuting ? 'Running...' : 'Run Code Draft'}</span>
              </button>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
              Write custom pandas Python code. Variable <code>df</code> represents the current node's DataFrame. Executing will produce a new lineage step.
            </p>

            {execMessage && (
              <div style={{ padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', marginBottom: '0.75rem', backgroundColor: execMessage.includes('error') ? '#fef2f2' : '#f0fdf4', color: execMessage.includes('error') ? '#b91c1c' : '#15803d' }}>
                {execMessage}
              </div>
            )}

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                flex: 1,
                minHeight: '220px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.5
              }}
            />
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {showMerge && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', width: '420px', boxShadow: 'var(--shadow-float)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Merge Datasets Wizard</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Left Dataset</label>
                <select
                  value={mergeLeft}
                  onChange={(e) => setMergeLeft(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', marginTop: '0.2rem' }}
                >
                  <option value="">Select Left Dataset</option>
                  {pipeline?.nodes.map((n) => (
                    <option key={n.id} value={n.id}>{n.label} ({n.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Right Dataset</label>
                <select
                  value={mergeRight}
                  onChange={(e) => setMergeRight(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', marginTop: '0.2rem' }}
                >
                  <option value="">Select Right Dataset</option>
                  {pipeline?.nodes.map((n) => (
                    <option key={n.id} value={n.id}>{n.label} ({n.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Join Key Column (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. user_id, id, timestamp"
                  value={mergeCol}
                  onChange={(e) => setMergeCol(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', marginTop: '0.2rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setShowMerge(false)}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleMerge}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                Execute Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Project Modal */}
      {showSaveProject && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', width: '380px', boxShadow: 'var(--shadow-float)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Save Pipeline Project</h3>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Project Name</label>
            <input
              type="text"
              placeholder="e.g. Security Audit Analysis 2026"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '0.35rem', marginBottom: '1.25rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setShowSaveProject(false)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSaveProject} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Project Modal */}
      {showLoadProject && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', width: '420px', boxShadow: 'var(--shadow-float)', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Load Saved Project</h3>
            {projectsList.length === 0 ? (
              <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1rem' }}>No saved projects found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {projectsList.map((p) => (
                  <div
                    key={p.slug}
                    onClick={() => handleLoadSelectedProject(p.slug)}
                    style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#f8fafc' }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                      {p.datasets?.length || 0} datasets • Saved {new Date(p.saved_at * 1000).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowLoadProject(false)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
