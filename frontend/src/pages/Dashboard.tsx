import React from 'react';
import { Telemetry, DatasetMeta } from '../types';
import { CyberShieldDashboard } from '@/components/cybershield-dashboard';
import '../dashboard.css';

interface DashboardProps {
  telemetry?: Telemetry | null;
  activeDataset?: DatasetMeta | null;
  onAskQuestion?: (q: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = () => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <CyberShieldDashboard />
      </div>
    </div>
  );
};

export default Dashboard;

