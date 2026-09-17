import React, { useState } from 'react';
import { PlotlyChart } from './PlotlyChart';
import { DataTable } from './DataTable';
import { ReasoningItem } from '../types';
import { Copy, Check, BarChart2, Table as TableIcon, Code as CodeIcon, Brain, Info } from 'lucide-react';

interface DetailTabsProps {
  artifacts?: any;
  reasoning?: ReasoningItem[];
}

export const DetailTabs: React.FC<DetailTabsProps> = ({ artifacts, reasoning }) => {
  const hasChart = Boolean(artifacts?.plotly_chart?.data?.length || artifacts?.plotly_chart?.layout);
  const hasTable = Boolean(artifacts?.table?.columns?.length);
  const hasCode = Boolean(artifacts?.code);
  const hasReasoning = Boolean(reasoning?.length);

  // Pick first available tab
  const defaultTab = hasChart ? 'chart' : hasTable ? 'table' : hasCode ? 'code' : 'reasoning';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [copied, setCopied] = useState(false);

  if (!hasChart && !hasTable && !hasCode && !hasReasoning) {
    return null;
  }

  const handleCopyCode = () => {
    if (artifacts?.code) {
      navigator.clipboard.writeText(artifacts.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="tabs-container">
      <div className="tab-headers">
        {hasChart && (
          <button
            className={`tab-header-btn ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => setActiveTab('chart')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BarChart2 size={14} />
              <span>Interactive Chart</span>
            </div>
          </button>
        )}

        {hasTable && (
          <button
            className={`tab-header-btn ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TableIcon size={14} />
              <span>Data Table</span>
            </div>
          </button>
        )}

        {hasCode && (
          <button
            className={`tab-header-btn ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CodeIcon size={14} />
              <span>Python Code</span>
            </div>
          </button>
        )}

        {hasReasoning && (
          <button
            className={`tab-header-btn ${activeTab === 'reasoning' ? 'active' : ''}`}
            onClick={() => setActiveTab('reasoning')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Brain size={14} />
              <span>Agent Reasoning</span>
            </div>
          </button>
        )}

        {artifacts?.summary && (
          <button
            className={`tab-header-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={14} />
              <span>Telemetry</span>
            </div>
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'chart' && hasChart && (
          <div style={{ padding: '0.5rem 0' }}>
            <PlotlyChart figure={artifacts.plotly_chart} height={380} />
          </div>
        )}

        {activeTab === 'table' && hasTable && (
          <div style={{ padding: '0.5rem 0' }}>
            <DataTable
              columns={artifacts.table.columns}
              rows={artifacts.table.rows}
              totalRows={artifacts.table.total_rows}
            />
          </div>
        )}

        {activeTab === 'code' && hasCode && (
          <div className="code-box">
            <button className="copy-btn" onClick={handleCopyCode}>
              {copied ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Check size={12} /> Copied
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Copy size={12} /> Copy Code
                </span>
              )}
            </button>
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{artifacts.code}</code>
            </pre>
          </div>
        )}

        {activeTab === 'reasoning' && hasReasoning && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reasoning?.map((r, i) => (
              <div key={i} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.775rem', fontWeight: 700, color: '#2563eb', marginBottom: '0.35rem' }}>
                  {r.agent}
                </div>
                <div style={{ fontSize: '0.835rem', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {r.thought}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'summary' && artifacts?.summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Records</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {artifacts.summary.total_records?.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Features</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {artifacts.summary.features}
              </div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Memory</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {artifacts.summary.memory_usage_mb} MB
              </div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Missing Cells</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {artifacts.summary.null_cells || 0}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
