import React, { useEffect, useState } from 'react';
import { DatasetMeta } from '../types';
import { fetchDatasetPreview } from '../services/api';
import { DataTable } from '../components/DataTable';
import { TableProperties, Filter, RefreshCw, BarChart2 } from 'lucide-react';

interface ExplorerProps {
  activeDataset: DatasetMeta | null;
}

export const Explorer: React.FC<ExplorerProps> = ({ activeDataset }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'profile'>('table');

  const loadData = () => {
    if (activeDataset?.id) {
      setLoading(true);
      fetchDatasetPreview(activeDataset.id, 100)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadData();
  }, [activeDataset?.id]);

  return (
    <div className="view-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Data Explorer</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Interactive table, column distributions, and value profiling for <strong>{activeDataset?.label || 'dataset'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setActiveTab('table')}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.775rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'table' ? '#ffffff' : 'transparent',
                color: activeTab === 'table' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'table' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              Table View
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.775rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'profile' ? '#ffffff' : 'transparent',
                color: activeTab === 'profile' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'profile' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              Column Profiling
            </button>
          </div>

          <button
            onClick={loadData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.75rem',
              fontSize: '0.775rem',
              fontWeight: 600,
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#475569'
            }}
          >
            <RefreshCw size={14} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          Loading dataset records...
        </div>
      ) : activeTab === 'table' ? (
        <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          {data?.columns ? (
            <DataTable
              columns={data.columns}
              rows={data.rows}
              totalRows={data.total_rows}
              dtypes={data.dtypes}
              title={activeDataset?.label}
            />
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              No dataset records loaded.
            </div>
          )}
        </div>
      ) : (
        /* Column Profiling Tab */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {data?.columns?.map((col: string) => {
            const stat = data.stats?.[col];
            return (
              <div
                key={col}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '1rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{col}</span>
                  <span style={{ fontSize: '0.7rem', backgroundColor: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#475569' }}>
                    {data.dtypes?.[col] || 'string'}
                  </span>
                </div>

                {stat ? (
                  <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div>Nulls: <strong>{stat.null_count}</strong></div>
                    <div>Distinct values: <strong>{stat.unique_count}</strong></div>
                    {stat.min !== undefined && stat.min !== null && (
                      <div>Min: <strong>{stat.min}</strong> | Max: <strong>{stat.max}</strong> | Mean: <strong>{Number(stat.mean).toFixed(2)}</strong></div>
                    )}
                    {stat.top_values && (
                      <div style={{ marginTop: '0.35rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Top values:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.2rem' }}>
                          {Object.entries(stat.top_values).map(([val, cnt]) => (
                            <span key={val} style={{ fontSize: '0.675rem', backgroundColor: '#eff6ff', color: '#1e40af', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                              {val} ({cnt as number})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Profile unavailable</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
