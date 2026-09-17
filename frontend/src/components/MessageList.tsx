import React from 'react';
import { ChatMessage } from '../types';
import { DetailTabs } from './DetailTabs';
import { Bot, User, Layers } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  return (
    <div className="chat-scroll-area">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        return (
          <div key={msg.id} className={`message-card ${isUser ? 'user' : ''}`}>
            <div className="message-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isUser ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', fontWeight: 600, fontSize: '0.8rem' }}>
                    <User size={15} />
                    <span>You</span>
                  </div>
                ) : (
                  <div className="message-agent-badge">
                    <Bot size={13} />
                    <span>{msg.agent || 'Supervisor'}</span>
                  </div>
                )}
                {msg.target_dataset && (
                  <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Layers size={11} />
                    <span>{msg.target_dataset}</span>
                  </span>
                )}
              </div>
              <span className="message-time">
                {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="message-body">
              {msg.content}
            </div>

            {!isUser && msg.artifacts && (
              <DetailTabs artifacts={msg.artifacts} reasoning={msg.reasoning} />
            )}
          </div>
        );
      })}

      {isLoading && (
        <div className="message-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
          <div style={{ width: '18px', height: '18px', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Data Science Team analyzing dataset and running pipeline...
          </span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};
