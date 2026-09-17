import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { PlotlyChart } from '../components/PlotlyChart';
import { DataTable } from '../components/DataTable';
import { BarChart3, Download, Code, Table as TableIcon, Filter, Search, Layers, Calendar } from 'lucide-react';

interface ResultsProps {
  messages: ChatMessage[];
}

export const Results: React.FC<ResultsProps> = ({ messages }) => {
  const [filterType, setFilterType] = useState<'all' | 'charts' | 'tables' | 'code'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all artifacts from assistant messages
  const rawArtifactsList = messages
    .filter((m) => m.role === 'assistant' && m.artifacts && Object.keys(m.artifacts).length > 0)
    .map((m) => ({
      messageId: m.id,
      timestamp: m.timestamp,
      agent: m.agent,
      artifacts: m.artifacts!,
    }));

  const artifactsList = rawArtifactsList.filter((item) => {
    if (filterType === 'charts' && !item.artifacts.plotly_chart) return false;
    if (filterType === 'tables' && !item.artifacts.table) return false;
    if (filterType === 'code' && !item.artifacts.code) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchAgent = (item.agent || '').toLowerCase().includes(q);
      const matchCode = (item.artifacts.code || '').toLowerCase().includes(q);
      return matchAgent || matchCode;
    }
    return true;
  });

  return (
    <div className="view-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em', margin: '0 0 0.25rem 0' }}>
            Results & Generated Artifacts
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            Historical gallery of interactive visualizations, data tables, and scripts produced across the workspace.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            {[
              { id: 'all', label: 'All Artifacts' },
              { id: 'charts', label: 'Charts' },
              { id: 'tables', label: 'Tables' },
              { id: 'code', label: 'Code' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: filterType === f.id ? '#ffffff' : 'transparent',
                  color: filterType === f.id ? '#0f172a' : '#64748b',
                  boxShadow: filterType === f.id ? 'var(--shadow-sm)' : 'none'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search artifacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '0.38rem 0.65rem 0.38rem 1.8rem',
                fontSize: '0.775rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                outline: 'none',
                width: '160px'
              }}
            />
            <Search size={13} style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
        </div>
      </div>

      {artifactsList.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '3.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8' }}>
          <BarChart3 size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
            No artifacts found
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Run an analysis, request a chart, or query data in the Workspace.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {artifactsList.map((item, idx) => (
            <div
              key={item.messageId}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="raw-badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                    {item.agent || 'Analyst'}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    Artifact Set #{artifactsList.length - idx}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {new Date(item.timestamp * 1000).toLocaleString()}
                </span>
              </div>

              {/* Chart */}
              {item.artifacts.plotly_chart && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <PlotlyChart figure={item.artifacts.plotly_chart} height={360} />
                </div>
              )}

              {/* Table */}
              {item.artifacts.table && item.artifacts.table.columns && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <TableIcon size={14} /> Output Table Preview
                  </div>
                  <DataTable
                    columns={item.artifacts.table.columns}
                    rows={item.artifacts.table.rows}
                    totalRows={item.artifacts.table.total_rows}
                  />
                </div>
              )}

              {/* Code */}
              {item.artifacts.code && (
                <div className="code-box">
                  <pre style={{ margin: 0 }}>
                    <code>{item.artifacts.code}</code>
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
