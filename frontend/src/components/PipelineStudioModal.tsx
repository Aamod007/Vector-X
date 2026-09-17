import React from 'react';
import { X } from 'lucide-react';
import { PipelineStudio } from '../pages/PipelineStudio';

interface PipelineStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PipelineStudioModal: React.FC<PipelineStudioModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="studio-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="studio-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Pipeline Studio
            </h2>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
            style={{ 
              backgroundColor: 'transparent', 
              border: 'none', 
              color: '#94a3b8', 
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close Pipeline Studio"
          >
            <X size={20} />
          </button>
        </div>

        <div className="studio-modal-body">
          <PipelineStudio isModal={true} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};
