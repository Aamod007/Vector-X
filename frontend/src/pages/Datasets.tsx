import React, { useState, useRef } from 'react';
import { DatasetMeta } from '../types';
import { uploadDataset, loadSampleDataset, deleteDataset } from '../services/api';
import { UploadCloud, FileText, Check, Trash2, Database, Layers, ArrowRight, ExternalLink, X, FileSpreadsheet } from 'lucide-react';
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
  const [uploadedFileChip, setUploadedFileChip] = useState<{ name: string; size: string } | null>(null);
  const [useDemoData, setUseDemoData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const res = await uploadDataset(file);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadedFileChip({ name: file.name, size: `${sizeMB}MB` });
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

  const handleToggleDemoData = async (checked: boolean) => {
    setUseDemoData(checked);
    if (checked) {
      handleLoadSample('churn_data.csv');
    }
  };

  const handleLoadSample = async (sampleName: string) => {
    setIsUploading(true);
    setError(null);
    try {
      const res = await loadSampleDataset(sampleName);
      setUploadedFileChip({ name: sampleName, size: '1.0MB' });
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
        if (uploadedFileChip) {
          setUploadedFileChip(null);
        }
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to delete');
      }
    }
  };

  return (
    <div className="view-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em', margin: '0 0 0.25rem 0' }}>
          Upload Data (CSV or Excel)
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
          Upload your tabular data, load verified sample datasets, or connect database tables.
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.825rem' }}>
          {error}
        </div>
      )}

      {/* Use Demo Data Checkbox matching ai_exploratory_copilot.jpg */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={useDemoData}
            onChange={(e) => handleToggleDemoData(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#ec4899', cursor: 'pointer' }}
          />
          <span>Use demo data (Customer Churn)</span>
        </label>
      </div>

      {/* Upload Zone matching ai_exploratory_copilot.jpg */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.45rem' }}>
          Upload CSV or Excel file
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
          }}
          style={{
            border: '2px dashed #0f172a',
            backgroundColor: dragOver ? '#f1f5f9' : '#0f172a',
            color: dragOver ? '#0f172a' : '#ffffff',
            borderRadius: '10px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
          onClick={() => fileInputRef.current?.click()}
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

          <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            {isUploading ? 'Processing and registering dataset...' : 'Drag and drop file here'}
          </div>
          <div style={{ fontSize: '0.775rem', color: dragOver ? '#475569' : '#94a3b8', marginBottom: '1.25rem' }}>
            Limit 200MB per file • CSV, XLSX
          </div>

          <button
            type="button"
            className="st-btn-secondary"
            style={{
              backgroundColor: '#1e293b',
              color: '#ffffff',
              borderColor: '#334155',
              padding: '0.45rem 1.15rem',
              borderRadius: '6px'
            }}
          >
            Browse files
          </button>
        </div>

        {/* Selected File Chip matching ai_exploratory_copilot.jpg */}
        {(uploadedFileChip || activeDatasetId) && (
          <div className="file-chip-card light" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <FileSpreadsheet size={20} color="#2563eb" />
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0f172a' }}>
                  {uploadedFileChip?.name || datasets.find(d => d.id === activeDatasetId)?.label || 'churn_data.csv'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {uploadedFileChip?.size || '1.0MB'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setUploadedFileChip(null)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
              title="Remove file"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Preloaded Sample Datasets */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
          Verified Sample Datasets
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
          Registered Workspace Datasets ({datasets.length})
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
                      {ds.records?.toLocaleString()} records • {ds.features} columns
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={(e) => handleDelete(ds.id, e)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.4rem' }}
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
