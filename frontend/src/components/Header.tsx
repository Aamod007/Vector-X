import React, { useState } from 'react';
import { ChevronDown, LayoutGrid, Sidebar as SidebarIcon, Check } from 'lucide-react';
import { DatasetMeta } from '../types';

interface HeaderProps {
  activeDataset: DatasetMeta | null;
  datasets: DatasetMeta[];
  onSelectDataset: (id: string) => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeDataset,
  datasets,
  onSelectDataset,
  onToggleSidebar
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="header-left">
        <a href="/" className="brand-logo" style={{ letterSpacing: '0.04em', fontSize: '1.05rem', fontWeight: 800 }}>
          <span>Vector X</span>
        </a>
      </div>

      <div className="header-center">
        <div className="relative">
          <button 
            className="breadcrumb-pill"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span>Workspace</span>
            <span style={{ color: '#94a3b8' }}>&gt;</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>
              {activeDataset ? (activeDataset.label.length > 24 ? `${activeDataset.label.slice(0, 24)}...` : activeDataset.label) : 'Select Dataset'}
            </span>
            <ChevronDown size={14} style={{ marginLeft: 2, color: '#64748b' }} />
          </button>

          {dropdownOpen && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.4rem',
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                minWidth: '260px',
                zIndex: 50,
                padding: '0.4rem',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              <div style={{ fontSize: '0.725rem', fontWeight: 600, color: '#94a3b8', padding: '0.4rem 0.5rem' }}>
                SWITCH ACTIVE DATASET
              </div>
              {datasets.map((ds) => (
                <div
                  key={ds.id}
                  onClick={() => {
                    onSelectDataset(ds.id);
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    backgroundColor: ds.id === activeDataset?.id ? '#f1f5f9' : 'transparent',
                    fontWeight: ds.id === activeDataset?.id ? 600 : 400
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ds.id === activeDataset?.id ? '#f1f5f9' : 'transparent')}
                >
                  <div>
                    <div>{ds.label}</div>
                    <div style={{ fontSize: '0.675rem', color: '#64748b' }}>
                      {ds.records?.toLocaleString()} rows • {ds.features} cols
                    </div>
                  </div>
                  {ds.id === activeDataset?.id && <Check size={14} color="#2563eb" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        <button className="icon-btn" title="Grid Layout">
          <LayoutGrid size={16} />
        </button>
        <button className="icon-btn" title="Toggle Sidebar" onClick={onToggleSidebar}>
          <SidebarIcon size={16} />
        </button>
      </div>
    </header>
  );
};
