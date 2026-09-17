import React, { useState, useRef } from 'react';
import { DatasetMeta } from '../types';
import { uploadDataset, loadSampleDataset, deleteDataset } from '../services/api';
import { UploadCloud, FileText, Check, Trash2, Database, Layers, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DatasetsProps {
  datasets: DatasetMeta[];
  activeDatasetId: string | null;
  onSelectDataset: (id: string) => void;
  onRefresh: () => void;
}

const SAMPLE_FILES = [
  { name: 'churn_data.csv', label: 'Customer Churn (7k rows, 21 cols)', desc: 'Telecom subscriber churn dataset with demographics and billing' },
  { name: 'bike_sales_data.csv', label: 'Bike Sales (15.6k rows, 17 cols)', desc: 'Retail store orders, revenue, and product categories' },
  { name: 'dirty_dataset.csv', label: 'Dirty Dataset (10 rows, 4 cols)', desc: 'Sample dataset with missing data, messy strings and nulls' },
  { name: 'bike_model_specs.csv', label: 'Bike Specs (15 rows, 7 cols)', desc: 'Product specs, weights, components and frame types' },
];

export const Datasets: React.FC<DatasetsProps> = ({
  datasets,
  activeDatasetId,
  onSelectDataset,
  onRefresh
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const res = await uploadDataset(file);
      onRefresh();
      if (res.dataset?.id) {
        onSelectDataset(res.dataset.id);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSample = async (sampleName: string) => {
    setIsUploading(true);
    setError(null);
    try {
      const res = await loadSampleDataset(sampleName);
      onRefresh();
      if (res.dataset?.id) {
        onSelectDataset(res.dataset.id);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load sample dataset');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to remove dataset ${id}?`)) {
      try {
        await deleteDataset(id);
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to delete');
      }
    }
  };

  return (
    <div className="view-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Dataset Manager & Uploader</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Upload your tabular data, load verified sample datasets, or connect database tables.
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.825rem' }}>
          {error}
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#2563eb' : '#cbd5e1'}`,
          backgroundColor: dragOver ? '#eff6ff' : '#ffffff',
          borderRadius: '12px',
          padding: '2.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '2rem',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
          }}
        />
        <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', marginBottom: '1rem' }}>
          <UploadCloud size={32} />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
          {isUploading ? 'Processing and registering dataset...' : 'Click to upload or drag and drop'}
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Supports CSV, Excel (.xlsx, .xls) up to 200MB. Full provenance and lineage are automatically recorded.
        </p>
      </div>

      {/* Preloaded Sample Datasets */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
          Sample Datasets
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {SAMPLE_FILES.map((sample) => (
            <div
              key={sample.name}
              onClick={() => handleLoadSample(sample.name)}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={15} color="#2563eb" />
                  <span>{sample.label}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {sample.desc}
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Load Dataset <ArrowRight size={13} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active & Registered Datasets List */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
          Registered Datasets ({datasets.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {datasets.map((ds) => {
            const isActive = ds.id === activeDatasetId;
            return (
              <div
                key={ds.id}
                onClick={() => onSelectDataset(ds.id)}
                style={{
                  backgroundColor: '#ffffff',
                  border: `1px solid ${isActive ? '#2563eb' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 0 0 1px #2563eb' : 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: isActive ? '#eff6ff' : '#f8fafc', color: isActive ? '#2563eb' : '#64748b' }}>
                    <Layers size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{ds.label}</span>
                      <span className="raw-badge" style={{ fontSize: '0.675rem' }}>{ds.stage?.toUpperCase() || 'RAW'}</span>
                      {isActive && (
                        <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600, backgroundColor: '#eff6ff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                      {ds.records?.toLocaleString()} records • {ds.features} columns ({ds.columns?.slice(0, 5).join(', ')}{ds.columns?.length > 5 ? '...' : ''})
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDataset(ds.id);
                      navigate('/explorer');
                    }}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Inspect in Explorer
                  </button>
                  <button
                    onClick={(e) => handleDelete(ds.id, e)}
                    style={{
                      padding: '0.35rem',
                      color: '#ef4444',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    title="Delete dataset"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
