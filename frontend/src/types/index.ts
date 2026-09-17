export interface DatasetMeta {
  id: string;
  label: string;
  stage: string;
  records: number;
  features: number;
  shape: [number, number];
  columns: string[];
  dtypes: Record<string, string>;
  size_bytes?: number;
  created_ts?: number;
  created_by?: string;
  is_active?: boolean;
}

export interface Telemetry {
  records: number;
  features: number;
  stage: string;
  label: string;
  dataset_id?: string;
  total_datasets: number;
  total_storage_mb: number;
}

export interface ReasoningItem {
  agent: string;
  thought: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  agent?: string;
  content: string;
  timestamp: number;
  target_dataset?: string;
  reasoning?: ReasoningItem[];
  artifacts?: {
    plotly_chart?: any;
    table?: {
      columns: string[];
      rows: any[];
      total_rows: number;
    };
    code?: string;
    summary?: {
      total_records: number;
      features: number;
      memory_usage_mb: number;
      null_cells: number;
    };
    eda?: any;
    models?: any;
    predictions?: any;
  };
}

export interface PipelineNode {
  id: string;
  label: string;
  stage: string;
  shape: [number, number];
  records: number;
  features: number;
  created_by: string;
  created_ts: number;
  is_active: boolean;
  badge: string;
  color: string;
  bg: string;
  parent_id?: string;
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface PipelineSnapshot {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  active_node_id: string | null;
  total_nodes: number;
}

export interface AppSettings {
  llm_provider: string;
  model_name: string;
  openai_api_key?: string;
  openai_api_key_masked?: string;
  has_key?: boolean;
  ollama_base_url?: string;
  ollama_model?: string;
  recursion_limit?: number;
  use_memory: boolean;
  proactive_mode?: boolean;
  intent_parsing?: boolean;
  use_sample?: boolean;
  preview_rows?: number;
  pipeline_persist_dir?: string;
  pipeline_persist_enabled?: boolean;
  pipeline_persist_overwrite?: boolean;
  pipeline_persist_include_sql?: boolean;
  pipeline_preserve_all_nodes?: boolean;
  pipeline_preserve_studio_nodes?: boolean;
  pipeline_dataset_persist_enabled?: boolean;
  pipeline_dataset_restore_enabled?: boolean;
  pipeline_dataset_cache_format?: string;
  pipeline_dataset_cache_max_items?: number;
  pipeline_dataset_cache_max_mb?: number;
  pipeline_chat_context_enabled?: boolean;
  pipeline_chat_context_include_code?: boolean;
  pipeline_use_selected_node_for_chat?: boolean;
  pipeline_sync_state_to_agents?: boolean;
  sql_url?: string;
  enable_mlflow_logging: boolean;
  mlflow_tracking_uri?: string;
  mlflow_artifact_root?: string;
  mlflow_experiment_name?: string;
  verbose_logs?: boolean;
  show_progress?: boolean;
  show_live_logs?: boolean;
  debug_mode?: boolean;
}

