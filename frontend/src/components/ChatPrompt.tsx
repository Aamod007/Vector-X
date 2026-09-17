import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, ArrowRight, ChevronDown, Check } from 'lucide-react';

interface ChatPromptProps {
  activeDatasetLabel?: string;
  onSend: (prompt: string, agent: string, autoRoute: boolean) => void;
  onAttachClick?: () => void;
  disabled?: boolean;
}

const AGENTS = [
  { id: 'ANALYST', label: 'ANALYST' },
  { id: 'SUPERVISOR', label: 'SUPERVISOR' },
  { id: 'DATA_VISUALIZER', label: 'VISUALIZER' },
  { id: 'DATA_CLEANER', label: 'DATA CLEANER' },
  { id: 'DATA_WRANGLER', label: 'DATA WRANGLER' },
  { id: 'EDA_AGENT', label: 'EDA AGENT' },
  { id: 'SQL_AGENT', label: 'SQL AGENT' },
  { id: 'ML_AGENT', label: 'H2O ML AGENT' },
];

export const ChatPrompt: React.FC<ChatPromptProps> = ({
  activeDatasetLabel = 'track2_iam_audit_trail',
  onSend,
  onAttachClick,
  disabled = false
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('ANALYST');
  const [autoRoute, setAutoRoute] = useState(true);
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [prompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || disabled) return;
    onSend(prompt.trim(), selectedAgent, autoRoute);
    setPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="floating-prompt-bar">
      <textarea
        ref={textareaRef}
        className="prompt-textarea"
        placeholder={`Ask your agent anything about ${activeDatasetLabel}...`}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
      />

      <div className="prompt-actions-bar">
        <div className="prompt-actions-left">
          <button 
            className="attach-btn" 
            title="Attach file"
            onClick={onAttachClick}
            type="button"
          >
            <Paperclip size={16} />
          </button>

          {/* Agent Picker Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="agent-selector-pill"
              onClick={() => setAgentMenuOpen(!agentMenuOpen)}
            >
              <span>{selectedAgent}</span>
              <ChevronDown size={13} />
            </button>

            {agentMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  marginBottom: '0.4rem',
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  minWidth: '180px',
                  zIndex: 60,
                  padding: '0.35rem',
                }}
              >
                <div style={{ fontSize: '0.675rem', fontWeight: 600, color: '#94a3b8', padding: '0.3rem 0.5rem' }}>
                  SELECT SPECIALIZED AGENT
                </div>
                {AGENTS.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgent(agent.label);
                      setAgentMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '5px',
                      fontSize: '0.775rem',
                      cursor: 'pointer',
                      backgroundColor: selectedAgent === agent.label ? '#eff6ff' : 'transparent',
                      color: selectedAgent === agent.label ? '#2563eb' : '#334155',
                      fontWeight: selectedAgent === agent.label ? 600 : 500,
                    }}
                  >
                    <span>{agent.label}</span>
                    {selectedAgent === agent.label && <Check size={13} color="#2563eb" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auto-route Toggle */}
          <div
            className="auto-route-toggle"
            onClick={() => setAutoRoute(!autoRoute)}
            title="When enabled, supervisor automatically routes to the best agent"
          >
            <span>Auto-route</span>
            <div className={`toggle-switch ${autoRoute ? 'active' : ''}`}>
              <div className="toggle-thumb" />
            </div>
          </div>
        </div>

        <div className="prompt-actions-right">
          <span className="kbd-hint">Shift + Enter for new line</span>
          <button
            type="button"
            className="send-btn"
            disabled={!prompt.trim() || disabled}
            onClick={() => handleSubmit()}
            title="Send query"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
