import React from 'react';
import { Box } from 'lucide-react';
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

export const Workspace: React.FC<WorkspaceProps> = ({
  messages,
  activeDataset,
  isLoading,
  onSendMessage,
  onUploadClick
}) => {
  // Only show hero if no user queries have been sent yet (or only the initial welcome message)
  const userMessages = messages.filter((m) => m.role === 'user');
  const showHero = userMessages.length === 0;

  return (
    <div className="main-content">
      {showHero ? (
        <div className="workbench-hero">
          <div className="hero-icon-box">
            <Box size={28} />
          </div>
          <h1 className="hero-title">Agent Data Workbench</h1>
          <p className="hero-subtitle">
            Select a dataset and start working with your data using AI agents.
            <br />
            Ask a question, run an analysis, or generate a visualization.
          </p>
        </div>
      ) : (
        <MessageList messages={messages} isLoading={isLoading} />
      )}

      {/* Floating Prompt Bar at bottom */}
      <ChatPrompt
        activeDatasetLabel={activeDataset?.label || 'track2_iam_audit_trail'}
        onSend={onSendMessage}
        onAttachClick={onUploadClick}
        disabled={isLoading}
      />
    </div>
  );
};
