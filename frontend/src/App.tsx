import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PipelineStudioModal } from './components/PipelineStudioModal';
import { Workspace } from './pages/Workspace';
import { Dashboard } from './pages/Dashboard';
import { Datasets } from './pages/Datasets';
import { Explorer } from './pages/Explorer';
import { PipelineStudio } from './pages/PipelineStudio';
import { Results } from './pages/Results';
import { Settings } from './pages/Settings';
import { 
  fetchDatasets, 
  fetchChatHistory, 
  sendChatMessage, 
  setActiveDataset 
} from './services/api';
import { DatasetMeta, Telemetry, ChatMessage } from './types';

export const App: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const loadInitialData = async () => {
    try {
      const dsRes = await fetchDatasets();
      setDatasets(dsRes.datasets || []);
      setTelemetry(dsRes.telemetry || null);

      const active = dsRes.datasets.find((d) => d.is_active) || dsRes.datasets[0];
      if (active) {
        setActiveDatasetId(active.id);
      }

      const chatRes = await fetchChatHistory();
      setMessages(chatRes.messages || []);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectDataset = async (id: string) => {
    try {
      const res = await setActiveDataset(id);
      setActiveDatasetId(id);
      if (res.telemetry) {
        setTelemetry(res.telemetry);
      }
      // Refresh datasets active status
      const dsRes = await fetchDatasets();
      setDatasets(dsRes.datasets || []);
    } catch (err) {
      console.error('Failed to set active dataset:', err);
    }
  };

  const handleSendMessage = async (prompt: string, agent: string, autoRoute: boolean) => {
    setIsLoading(true);
    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now() / 1000,
      target_dataset: datasets.find((d) => d.id === activeDatasetId)?.label,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await sendChatMessage(prompt, activeDatasetId || undefined, agent, autoRoute);
      if (res.message) {
        setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, res.message]);
      }
      if (res.telemetry) {
        setTelemetry(res.telemetry);
      }
      // Refresh datasets in case a new step was registered
      const dsRes = await fetchDatasets();
      setDatasets(dsRes.datasets || []);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        agent: 'Supervisor',
        content: `Error executing query: ${err.message || 'Unknown failure'}. Please verify model connection in Settings.`,
        timestamp: Date.now() / 1000,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || null;

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        activeDataset={activeDataset}
        datasets={datasets}
        onSelectDataset={handleSelectDataset}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenStudioModal={() => setIsStudioModalOpen(true)}
      />

      {/* Main Layout Body */}
      <div className="app-body">
        {sidebarOpen && (
          <Sidebar
            telemetry={telemetry}
            datasets={datasets}
            activeDatasetId={activeDatasetId}
            onSelectDataset={handleSelectDataset}
            onRefreshData={loadInitialData}
            onUploadClick={() => navigate('/datasets')}
            onOpenStudioModal={() => setIsStudioModalOpen(true)}
          />
        )}

        {/* Route Views */}
        <Routes>
          <Route
            path="/"
            element={
              <Workspace
                messages={messages}
                activeDataset={activeDataset}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                onUploadClick={() => navigate('/datasets')}
              />
            }
          />
          <Route
            path="/chat"
            element={
              <Workspace
                messages={messages}
                activeDataset={activeDataset}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                onUploadClick={() => navigate('/datasets')}
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                telemetry={telemetry}
                activeDataset={activeDataset}
                onAskQuestion={(q) => handleSendMessage(q, 'ANALYST', true)}
              />
            }
          />
          <Route
            path="/datasets"
            element={
              <Datasets
                datasets={datasets}
                activeDatasetId={activeDatasetId}
                onSelectDataset={handleSelectDataset}
                onRefresh={loadInitialData}
              />
            }
          />
          <Route
            path="/upload"
            element={
              <Datasets
                datasets={datasets}
                activeDatasetId={activeDatasetId}
                onSelectDataset={handleSelectDataset}
                onRefresh={loadInitialData}
              />
            }
          />
          <Route
            path="/explorer"
            element={<Explorer activeDataset={activeDataset} />}
          />
          <Route
            path="/pipeline"
            element={<PipelineStudio />}
          />
          <Route
            path="/pipeline-studio"
            element={<PipelineStudio />}
          />
          <Route
            path="/results"
            element={<Results messages={messages} />}
          />
          <Route
            path="/settings"
            element={<Settings />}
          />
        </Routes>
      </div>

      {/* Pipeline Studio Overlay Modal Dialog (st.dialog parity) */}
      <PipelineStudioModal
        isOpen={isStudioModalOpen}
        onClose={() => setIsStudioModalOpen(false)}
      />
    </div>
  );
};
export default App;
