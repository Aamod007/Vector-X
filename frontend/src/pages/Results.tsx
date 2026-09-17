import React from 'react';
import { ChatMessage } from '../types';
import { PlotlyChart } from '../components/PlotlyChart';
import { DataTable } from '../components/DataTable';
import { BarChart3, Download, Code, Table as TableIcon } from 'lucide-react';

interface ResultsProps {
  messages: ChatMessage[];
}

export const Results: React.FC<ResultsProps> = ({ messages }) => {
  // Collect all artifacts from assistant messages
  const artifactsList = messages
    .filter((m) => m.role === 'assistant' && m.artifacts && Object.keys(m.artifacts).length > 0)
    .map((m) => ({
      messageId: m.id,
      timestamp: m.timestamp,
      agent: m.agent,
      artifacts: m.artifacts!,
    }));

  return (
    <div className="view-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Results & Generated Artifacts</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Historical gallery of interactive visualizations, data tables, and scripts produced across the workspace.
        </p>
      </div>

      {artifactsList.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8' }}>
          <BarChart3 size={36} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>No artifacts generated yet</h3>
          <p style={{ fontSize: '0.8rem' }}>Ask an AI agent in the Workspace to analyze data or generate a chart.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
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
