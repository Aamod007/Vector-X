import { DatasetMeta, Telemetry, ChatMessage, PipelineSnapshot, AppSettings } from '../types';

const API_BASE = '/api';

export async function fetchStatus(): Promise<any> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export async function fetchSettings(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<any> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function fetchDatasets(): Promise<{ datasets: DatasetMeta[]; telemetry: Telemetry }> {
  const res = await fetch(`${API_BASE}/datasets`);
  if (!res.ok) throw new Error('Failed to fetch datasets');
  return res.json();
}

export async function setActiveDataset(dataset_id: string): Promise<{ success: boolean; telemetry: Telemetry }> {
  const res = await fetch(`${API_BASE}/datasets/active`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_id }),
  });
  if (!res.ok) throw new Error('Failed to set active dataset');
  return res.json();
}

export async function uploadDataset(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/datasets/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload dataset');
  return res.json();
}

export async function loadSampleDataset(name: string): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets/sample`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to load sample dataset');
  return res.json();
}

export async function deleteDataset(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete dataset');
  return res.json();
}

export async function fetchDatasetPreview(id: string, limit = 100): Promise<any> {
  const res = await fetch(`${API_BASE}/datasets/${id}/preview?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch preview');
  return res.json();
}

export async function fetchChatHistory(): Promise<{ messages: ChatMessage[] }> {
  const res = await fetch(`${API_BASE}/chat/history`);
  if (!res.ok) throw new Error('Failed to fetch chat history');
  return res.json();
}

export async function clearChatHistory(): Promise<any> {
  const res = await fetch(`${API_BASE}/chat/history`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear chat history');
  return res.json();
}

export async function sendChatMessage(prompt: string, target_dataset_id?: string, agent = 'ANALYST', auto_route = true): Promise<any> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      target_dataset_id,
      agent,
      auto_route,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(err.detail || 'Chat request failed');
  }
  return res.json();
}

export async function fetchPipeline(): Promise<PipelineSnapshot> {
  const res = await fetch(`${API_BASE}/pipeline`);
  if (!res.ok) throw new Error('Failed to fetch pipeline');
  return res.json();
}

export async function fetchNodeDetail(node_id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/pipeline/node/${node_id}`);
  if (!res.ok) throw new Error('Failed to fetch node detail');
  return res.json();
}

export async function runCodeTransform(node_id: string, code: string, label = ''): Promise<any> {
  const res = await fetch(`${API_BASE}/pipeline/code-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ node_id, code, label }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Execution failed' }));
    throw new Error(err.detail || 'Code transform failed');
  }
  return res.json();
}

export async function mergeDatasets(left_id: string, right_id: string, on_col: string, how = 'inner'): Promise<any> {
  const res = await fetch(`${API_BASE}/pipeline/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ left_id, right_id, on_col, how }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Merge failed' }));
    throw new Error(err.detail || 'Merge failed');
  }
  return res.json();
}

export async function undoPipeline(): Promise<any> {
  const res = await fetch(`${API_BASE}/pipeline/undo`, { method: 'POST' });
  return res.json();
}

export async function redoPipeline(): Promise<any> {
  const res = await fetch(`${API_BASE}/pipeline/redo`, { method: 'POST' });
  return res.json();
}

export async function fetchProjects(): Promise<{ projects: any[] }> {
  const res = await fetch(`${API_BASE}/projects`);
  return res.json();
}

export async function saveProject(name: string, description = '', metadata_only = false): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, metadata_only }),
  });
  return res.json();
}

export async function loadProject(slug: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  });
  return res.json();
}

export async function runSqlQuery(query: string): Promise<any> {
  const res = await fetch(`${API_BASE}/sql/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Query failed' }));
    throw new Error(err.detail || 'SQL Query failed');
  }
  return res.json();
}

export function getExportUrl(dataset_id: string, format = 'csv'): string {
  return `${API_BASE}/export/${dataset_id}?format=${format}`;
}
