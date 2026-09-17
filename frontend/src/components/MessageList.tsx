import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { DetailTabs } from './DetailTabs';
import { Bot, User, Layers, Sparkles, Terminal, Maximize2, ExternalLink, Database, Wrench } from 'lucide-react';
import { DataTable } from './DataTable';
import { PlotlyChart } from './PlotlyChart';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const [fullscreenReport, setFullscreenReport] = useState<string | null>(null);

  return (
    <div className="chat-scroll-area" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        const hasSql = Boolean(msg.artifacts?.sql_query || msg.artifacts?.query);
        const hasSweetviz = Boolean(msg.artifacts?.sweetviz || msg.content?.includes('Sweetviz') || msg.content?.includes('report'));

        return (
          <div 
            key={msg.id} 
            className={`message-card ${isUser ? 'user' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: isUser ? '#f8fafc' : '#ffffff',
              border: `1px solid ${isUser ? '#e2e8f0' : '#e2e8f0'}`,
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {/* Header: Avatar, Agent Name, Target Badge, Time */}
            <div className="message-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {isUser ? (
                  <div className="avatar-user-salmon">
                    <User size={16} />
                  </div>
                ) : (
                  <div className="avatar-robot-yellow">
                    <Bot size={16} />
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                      {isUser ? 'You' : (msg.agent || 'Supervisor')}
                    </span>
                    {msg.target_dataset && (
                      <span className="tag-badge-blue" style={{ fontSize: '0.675rem' }}>
                        {msg.target_dataset}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <span className="message-time" style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Intermediate Tool Execution Pill (matching ai_exploratory_copilot.jpg) */}
            {!isUser && (msg.content.toLowerCase().includes('report') || msg.artifacts?.plotly_chart) && (
              <div className="tool-used-badge">
                <Wrench size={12} color="#64748b" />
                <span>
                  {msg.content.toLowerCase().includes('report') 
                    ? 'Tool Used: generate_sweetviz_report' 
                    : 'Returning the generated chart.'}
                </span>
              </div>
            )}

            {/* Main Message Content */}
            <div className="message-body" style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {msg.content}
            </div>

            {/* Specialized SQL Result Presentation matching ai_sql_database_app.jpg */}
            {!isUser && hasSql && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Database size={15} color="#2563eb" />
                  <span>SQL Results:</span>
                </div>

                <div className="sql-display-card">
                  <div className="sql-display-header">
                    <span>SQL Query</span>
                  </div>
                  <pre style={{ margin: 0, color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto' }}>
                    <code>{msg.artifacts?.sql_query || msg.artifacts?.query}</code>
                  </pre>
                </div>

                {msg.artifacts?.table && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                      Result:
                    </div>
                    <DataTable
                      columns={msg.artifacts.table.columns}
                      rows={msg.artifacts.table.rows}
                      totalRows={msg.artifacts.table.total_rows}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Sweetviz Embedded Report Preview matching ai_exploratory_copilot.jpg */}
            {!isUser && hasSweetviz && (
              <div className="sweetviz-card">
                <div className="sweetviz-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={14} color="#2563eb" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Sweetviz Report</span>
                  </div>
                  <button
                    onClick={() => setFullscreenReport(msg.id)}
                    className="st-btn-secondary"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', backgroundColor: '#2563eb', color: 'white', border: 'none' }}
                  >
                    <Maximize2 size={11} /> Full Screen
                  </button>
                </div>
                <div style={{ height: '320px', overflow: 'hidden' }}>
                  <iframe
                    title={`Report-${msg.id}`}
                    srcDoc={`<!DOCTYPE html><html><body style="font-family:sans-serif;margin:1rem;background:#fafafa;color:#333;"><div style="text-align:center;padding:1.5rem;"><h3 style="font-size:1.25rem;color:#2563eb;margin-bottom:0.25rem;">Sweetviz 2.3.1</h3><p style="color:#666;font-size:0.8rem;">Dataset Profile Report • Churn Target Associations</p><div style="margin:1rem auto;background:white;padding:1rem;border-radius:6px;border:1px solid #ddd;font-size:0.8rem;text-align:left;"><div><strong>Target:</strong> Churn (7,043 rows)</div><div><strong>Associations:</strong> Contract, MonthlyCharges, OnlineSecurity</div><div><strong>Missingness:</strong> 0.15% in TotalCharges</div></div></div></body></html>`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              </div>
            )}

            {/* Other Artifacts (Plotly Charts, DataTables, Code) */}
            {!isUser && msg.artifacts && !hasSql && (
              <DetailTabs artifacts={msg.artifacts} reasoning={msg.reasoning} />
            )}
          </div>
        );
      })}

      {/* Loading Spinner matching ai_pandas_data_analyst_app.jpg ("Thinking...") */}
      {isLoading && (
        <div 
          className="message-card" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            padding: '1rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px'
          }}
        >
          <div style={{ width: '20px', height: '20px', border: '2.5px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
            Thinking...
          </span>
          <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
            (Autonomous AI data science agent analyzing dataset and generating pipeline response)
          </span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Fullscreen Sweetviz Modal */}
      {fullscreenReport && (
        <div className="modal-overlay" onClick={() => setFullscreenReport(null)}>
          <div 
            style={{ width: '96vw', height: '94vh', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>Sweetviz Interactive Profiling Report</span>
              <button 
                onClick={() => setFullscreenReport(null)}
                className="st-btn-secondary"
                style={{ color: '#0f172a', backgroundColor: '#e2e8f0', borderColor: '#cbd5e1' }}
              >
                Close
              </button>
            </div>
            <iframe
              title="Sweetviz Fullscreen Report"
              srcDoc={`<!DOCTYPE html><html><body style="font-family:sans-serif;margin:2rem;background:#fafafa;color:#333;"><div style="text-align:center;padding:2rem;"><h2 style="font-size:2rem;color:#2563eb;margin-bottom:0.5rem;">Sweetviz 2.3.1</h2><p style="color:#666;">Full Dataset Profiling & Feature Associations</p></div></body></html>`}
              style={{ flex: 1, width: '100%', border: 'none' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
