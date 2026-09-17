import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, Download, Search } from 'lucide-react';

interface DataTableProps {
  columns: string[];
  rows: any[];
  totalRows?: number;
  dtypes?: Record<string, string>;
  title?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns = [],
  rows = [],
  totalRows,
  dtypes = {},
  title
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const val = row[col];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(term);
      })
    );
  }, [rows, columns, searchTerm]);

  const sortedRows = useMemo(() => {
    if (!sortCol) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredRows, sortCol, sortAsc]);

  const totalPages = Math.ceil(sortedRows.length / pageSize);
  const paginatedRows = sortedRows.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const handleExportCsv = () => {
    if (!columns.length || !rows.length) return;
    const header = columns.join(',');
    const body = rows
      .map((r) => columns.map((c) => JSON.stringify(r[c] ?? '')).join(','))
      .join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!columns.length) {
    return <div style={{ color: '#94a3b8', padding: '1rem' }}>No columns defined.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '240px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Filter table rows..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            style={{
              width: '100%',
              padding: '0.35rem 0.5rem 0.35rem 1.85rem',
              fontSize: '0.775rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              outline: 'none',
              backgroundColor: '#ffffff'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Showing {Math.min(sortedRows.length, (page + 1) * pageSize)} of {totalRows || rows.length} rows
          </span>
          <button
            onClick={handleExportCsv}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              background: '#ffffff',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="styled-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>#</th>
              {columns.map((col) => (
                <th key={col} onClick={() => handleSort(col)} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>{col}</span>
                    {dtypes[col] && (
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 400 }}>
                        ({dtypes[col]})
                      </span>
                    )}
                    <ArrowUpDown size={12} style={{ color: sortCol === col ? '#2563eb' : '#cbd5e1' }} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.725rem' }}>
                  {page * pageSize + idx + 1}
                </td>
                {columns.map((col) => (
                  <td key={col}>
                    {row[col] === null || row[col] === undefined ? (
                      <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>null</span>
                    ) : typeof row[col] === 'boolean' ? (
                      <span style={{ color: row[col] ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                        {String(row[col])}
                      </span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Page {page + 1} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.25rem 0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                background: '#ffffff',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                opacity: page === 0 ? 0.5 : 1
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.25rem 0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                background: '#ffffff',
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages - 1 ? 0.5 : 1
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
