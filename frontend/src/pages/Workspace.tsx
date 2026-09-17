import React, { useState } from 'react';
import { Box, CheckCircle2, ChevronDown, ChevronRight, Sparkles, Database, BarChart3, Search, Code, Brain } from 'lucide-react';
import { ChatMessage, DatasetMeta } from '../types';
import { MessageList } from '../components/MessageList';
import { ChatPrompt } from '../components/ChatPrompt';

interface WorkspaceProps {
  messages: ChatMessage[];
  activeDataset: DatasetMeta | null;
  isLoading: boolean;
  onSendMessage: (prompt: string, agent: string, autoRoute: boolean) => void;
  onUploadClick: () => void;
}

const EXAMPLE_QUESTIONS = [
  {
    title: 'Database Schema',
    query: 'What tables exist in the database, and what columns does each table contain?'
  },
  {
    title: 'Plot Extended Sales',
    query: 'Make a plot of extended sales by month for each bike model. Use a plotly dropdown to filter by bike model.'
  },
  {
    title: 'Customer Churn Analysis',
    query: 'Analyze the distribution of monthly charges by churn status and identify the top risk indicators.'
  },
  {
    title: 'Sweetviz EDA Report',
    query: 'Generate an automated Sweetviz exploratory data analysis report for customer churn.'
  },
  {
    title: 'Top Models Pie Chart',
    query: 'Show the top 5 bike models by extended sales in a pie chart.'
  },
  {
    title: 'AutoML Predictive Modeling',
    query: 'Train an H2O AutoML classification model to predict Churn using all available customer features.'
  }
];

export const Workspace: React.FC<WorkspaceProps> = ({
  messages,
  activeDataset,
  isLoading,
  onSendMessage,
  onUploadClick
}) => {
  const [openExamples, setOpenExamples] = useState(false);
  const userMessages = messages.filter((m) => m.role === 'user');
  const showHero = userMessages.length === 0;

  const handleExampleClick = (query: string) => {
    onSendMessage(query, 'ANALYST', true);
  };

  const datasetLabel = activeDataset?.label || 'churn_data.csv';
  const datasetStage = activeDataset?.stage || 'raw';
  const datasetShape = activeDataset ? `${activeDataset.records?.toLocaleString() || 7043}×${activeDataset.features || 21}` : '7,043×21';

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '1rem 1.5rem', position: 'relative' }}>
      
      {/* Top Bar: Chat Target Badge & Validated API Key Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem', flexShrink: 0 }}>
        {/* Chat Target Badge matching Streamlit line 5800 */}
        <div className="chat-dataset-badge">
          <span>Chat target:</span>
          <strong>{datasetLabel}</strong>
          <span style={{ color: '#475569' }}>({datasetStage}, {datasetShape})</span>
          <span style={{ color: '#2563eb', fontWeight: 600 }}>• studio active</span>
        </div>

        {/* API Key Valid Alert Banner matching ai_sql_database_app.jpg */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.25rem 0.75rem',
          borderRadius: '6px',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#059669',
          fontSize: '0.775rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={13} strokeWidth={2.5} />
          <span>API Key is valid!</span>
        </div>
      </div>

      {/* Example Questions Accordion matching ai_sql_database_app.jpg */}
      <div className="st-expander-container light" style={{ marginBottom: '0.75rem', flexShrink: 0 }}>
        <div 
          className="st-expander-header"
          onClick={() => setOpenExamples(!openExamples)}
          style={{ padding: '0.5rem 0.85rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ec4899', fontWeight: 600 }}>
            <Sparkles size={14} />
            <span>Example Questions</span>
          </div>
          {openExamples ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
        </div>

        {openExamples && (
          <div className="st-expander-content" style={{ padding: '0.65rem 0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem' }}>
              {EXAMPLE_QUESTIONS.map((ex, i) => (
                <div
                  key={i}
                  onClick={() => handleExampleClick(ex.query)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.15rem' }}>
                    {ex.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    "{ex.query}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages Thread or Empty Hero */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '85px', paddingRight: '0.25rem' }}>
        {showHero ? (
          <div className="workbench-hero" style={{ marginTop: '2rem' }}>
            <div className="hero-icon-box">
              <Box size={28} />
            </div>
            <h1 className="hero-title">Your AI Data Science Team</h1>
            <p className="hero-subtitle">
              Welcome to the autonomous data science workspace. Ask a natural language question, query your SQL database, clean messy values, or run automated machine learning.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleExampleClick('What tables exist in the database?')}
                className="st-btn-secondary"
                style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
              >
                <Database size={13} color="#2563eb" /> Inspect Database Tables
              </button>
              <button
                onClick={() => handleExampleClick('Generate an automated Sweetviz exploratory data analysis report for customer churn.')}
                className="st-btn-secondary"
                style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
              >
                <BarChart3 size={13} color="#ec4899" /> Generate Sweetviz EDA
              </button>
              <button
                onClick={() => handleExampleClick('Train an H2O AutoML classification model to predict Churn.')}
                className="st-btn-secondary"
                style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
              >
                <Brain size={13} color="#10b981" /> Run H2O AutoML
              </button>
            </div>
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* Floating Prompt Bar at bottom */}
      <ChatPrompt
        activeDatasetLabel={datasetLabel}
        onSend={onSendMessage}
        onAttachClick={onUploadClick}
        disabled={isLoading}
      />
    </div>
  );
};
