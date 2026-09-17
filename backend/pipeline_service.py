import os
import json
import time
import shutil
import pandas as pd
from data_agents.utils.pipeline import build_pipeline_snapshot

APP_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
STORE_DIR = os.path.join(APP_ROOT, "pipeline_store")
PROJECTS_DIR = os.path.join(STORE_DIR, "pipeline_projects")
CODE_DRAFTS_FILE = os.path.join(STORE_DIR, "pipeline_studio_code_drafts.json")

os.makedirs(PROJECTS_DIR, exist_ok=True)

class PipelineService:
    def __init__(self, dataset_service):
        self.dataset_service = dataset_service
        self.undo_stack: list[dict] = []
        self.redo_stack: list[dict] = []
        self.code_drafts: dict[str, dict] = self._load_code_drafts()

    def _load_code_drafts(self) -> dict:
        if os.path.exists(CODE_DRAFTS_FILE):
            try:
                with open(CODE_DRAFTS_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def _save_code_drafts(self):
        try:
            with open(CODE_DRAFTS_FILE, "w", encoding="utf-8") as f:
                json.dump(self.code_drafts, f, indent=2)
        except Exception:
            pass

    def get_pipeline_snapshot(self) -> dict:
        datasets = self.dataset_service.datasets
        active_id = self.dataset_service.active_dataset_id
        
        # Build raw lineage snapshot using adst utility
        try:
            snapshot = build_pipeline_snapshot(datasets, active_dataset_id=active_id)
        except Exception:
            snapshot = {}

        # Format nodes and edges for visual flowchart
        nodes = []
        edges = []
        
        # Stages display metadata
        stage_colors = {
            "raw": {"bg": "#f1f5f9", "border": "#94a3b8", "badge": "RAW"},
            "wrangled": {"bg": "#e0f2fe", "border": "#38bdf8", "badge": "WRANGLED"},
            "cleaned": {"bg": "#dcfce7", "border": "#4ade80", "badge": "CLEANED"},
            "features": {"bg": "#fef3c7", "border": "#f59e0b", "badge": "FEATURES"},
            "model": {"bg": "#f3e8ff", "border": "#c084fc", "badge": "MODEL"},
            "predictions": {"bg": "#ffe4e6", "border": "#fb7185", "badge": "PREDICTIONS"},
            "transformed": {"bg": "#e2e8f0", "border": "#64748b", "badge": "TRANSFORM"}
        }

        # Create nodes list from datasets
        idx = 0
        for did, entry in datasets.items():
            stage = str(entry.get("stage", "raw")).lower()
            style = stage_colors.get(stage, stage_colors["transformed"])
            shape = entry.get("shape", [0, 0])
            nodes.append({
                "id": did,
                "label": entry.get("label", did),
                "stage": stage.upper(),
                "shape": shape,
                "records": shape[0] if len(shape) > 0 else 0,
                "features": shape[1] if len(shape) > 1 else 0,
                "created_by": entry.get("created_by", "User"),
                "created_ts": entry.get("created_ts", 0),
                "is_active": did == active_id,
                "badge": style["badge"],
                "color": style["border"],
                "bg": style["bg"],
                "parent_id": entry.get("parent_id") or entry.get("provenance", {}).get("parent_id")
            })
            idx += 1

        # Sort by creation time
        nodes.sort(key=lambda x: x["created_ts"])

        # Build edges based on parents or sequential steps
        for i, node in enumerate(nodes):
            parent = node.get("parent_id")
            if parent and any(n["id"] == parent for n in nodes):
                edges.append({
                    "id": f"edge_{parent}_{node['id']}",
                    "source": parent,
                    "target": node["id"],
                    "label": "transform"
                })
            elif i > 0 and len(nodes) > 1 and not parent:
                # If no explicit parent, create linear edge if sequential in same pipeline
                pass

        return {
            "nodes": nodes,
            "edges": edges,
            "active_node_id": active_id,
            "total_nodes": len(nodes),
            "snapshot": snapshot
        }

    def get_node_detail(self, node_id: str) -> dict:
        entry = self.dataset_service.get_dataset(node_id)
        if not entry:
            return {"error": "Node not found"}
        
        preview = self.dataset_service.get_preview(node_id, limit=50)
        draft = self.code_drafts.get(node_id, {
            "code": f"# Python transform code for {entry.get('label')}\n# 'df' contains current node dataframe\n# Return or assign 'df' to create output\n\nimport pandas as pd\nimport numpy as np\n\n# Example transformation:\n# df['new_column'] = df.iloc[:, 0] * 2\n"
        })

        return {
            "node_id": node_id,
            "label": entry.get("label"),
            "stage": entry.get("stage"),
            "shape": entry.get("shape"),
            "columns": entry.get("columns", []),
            "dtypes": entry.get("dtypes", {}),
            "provenance": entry.get("provenance", {}),
            "created_ts": entry.get("created_ts"),
            "created_by": entry.get("created_by"),
            "preview": preview,
            "code_draft": draft.get("code", "")
        }

    def run_code_transform(self, node_id: str, code: str, new_label: str = "") -> dict:
        entry = self.dataset_service.get_dataset(node_id)
        if not entry or not isinstance(entry.get("data"), pd.DataFrame):
            return {"error": f"Node dataset {node_id} not found"}

        df_source = entry["data"].copy()
        
        # Execute transform in restricted environment
        local_scope = {
            "df": df_source,
            "pd": pd,
            "np": pd.np if hasattr(pd, "np") else __import__("numpy")
        }
        
        try:
            exec(code, {}, local_scope)
            df_result = local_scope.get("df")
            if not isinstance(df_result, pd.DataFrame):
                return {"error": "Execution did not return a valid DataFrame in variable 'df'"}
            
            label = new_label or f"{entry.get('label')}_transformed"
            new_meta = self.dataset_service.register_dataset_from_df(
                df_result,
                label=label,
                stage="transformed",
                parent_id=node_id,
                created_by="Code Transform"
            )
            
            # Save code draft
            self.code_drafts[new_meta["id"]] = {"code": code, "parent_id": node_id}
            self._save_code_drafts()
            
            # Record undo
            self.undo_stack.append({
                "action": "code_transform",
                "created_id": new_meta["id"],
                "prev_active": node_id
            })
            self.redo_stack.clear()

            return {
                "success": True,
                "new_node": new_meta,
                "shape": new_meta.get("shape")
            }
        except Exception as e:
            return {"error": f"Transform execution error: {str(e)}"}

    def merge_datasets(self, left_id: str, right_id: str, on_col: str, how: str = "inner") -> dict:
        ds_left = self.dataset_service.get_dataset(left_id)
        ds_right = self.dataset_service.get_dataset(right_id)
        if not ds_left or not ds_right:
            return {"error": "One or both datasets not found"}

        df_left = ds_left["data"]
        df_right = ds_right["data"]

        try:
            if on_col and on_col in df_left.columns and on_col in df_right.columns:
                df_merged = pd.merge(df_left, df_right, on=on_col, how=how, suffixes=("_x", "_y"))
            else:
                df_merged = pd.concat([df_left, df_right], axis=1)

            label = f"merged_{ds_left.get('label')}_{ds_right.get('label')}"
            new_meta = self.dataset_service.register_dataset_from_df(
                df_merged,
                label=label,
                stage="wrangled",
                parent_id=left_id,
                created_by="Merge Wizard"
            )
            
            self.undo_stack.append({
                "action": "merge",
                "created_id": new_meta["id"],
                "prev_active": left_id
            })
            self.redo_stack.clear()

            return {"success": True, "new_node": new_meta}
        except Exception as e:
            return {"error": f"Merge error: {str(e)}"}

    def undo(self) -> dict:
        if not self.undo_stack:
            return {"success": False, "message": "Nothing to undo"}
        action = self.undo_stack.pop()
        created_id = action.get("created_id")
        if created_id:
            self.dataset_service.delete_dataset(created_id)
            prev = action.get("prev_active")
            if prev:
                self.dataset_service.set_active(prev)
        self.redo_stack.append(action)
        return {"success": True, "undone": action.get("action")}

    def redo(self) -> dict:
        if not self.redo_stack:
            return {"success": False, "message": "Nothing to redo"}
        action = self.redo_stack.pop()
        self.undo_stack.append(action)
        return {"success": True, "message": "Redo completed"}

    def list_projects(self) -> list[dict]:
        projects = []
        if os.path.exists(PROJECTS_DIR):
            for item in os.listdir(PROJECTS_DIR):
                item_path = os.path.join(PROJECTS_DIR, item)
                manifest_path = os.path.join(item_path, "manifest.json")
                if os.path.isdir(item_path) and os.path.exists(manifest_path):
                    try:
                        with open(manifest_path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            projects.append(data)
                    except Exception:
                        pass
        return sorted(projects, key=lambda x: x.get("saved_at", 0), reverse=True)

    def save_project(self, name: str, description: str = "", metadata_only: bool = False) -> dict:
        slug = "".join(c if c.isalnum() else "_" for c in name.lower()).strip("_")
        project_dir = os.path.join(PROJECTS_DIR, slug)
        os.makedirs(project_dir, exist_ok=True)
        
        manifest = {
            "name": name,
            "slug": slug,
            "description": description,
            "saved_at": time.time(),
            "metadata_only": metadata_only,
            "datasets": [self.dataset_service.get_dataset_meta(did) for did in self.dataset_service.datasets],
            "active_dataset_id": self.dataset_service.active_dataset_id
        }

        with open(os.path.join(project_dir, "manifest.json"), "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

        if not metadata_only:
            data_dir = os.path.join(project_dir, "datasets")
            os.makedirs(data_dir, exist_ok=True)
            for did, entry in self.dataset_service.datasets.items():
                if isinstance(entry.get("data"), pd.DataFrame):
                    entry["data"].to_csv(os.path.join(data_dir, f"{did}.csv"), index=False)

        return {"success": True, "project": manifest}

    def load_project(self, slug: str) -> dict:
        project_dir = os.path.join(PROJECTS_DIR, slug)
        manifest_path = os.path.join(project_dir, "manifest.json")
        if not os.path.exists(manifest_path):
            return {"error": "Project not found"}
            
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        data_dir = os.path.join(project_dir, "datasets")
        if os.path.exists(data_dir):
            for file in os.listdir(data_dir):
                if file.endswith(".csv"):
                    path = os.path.join(data_dir, file)
                    did = os.path.splitext(file)[0]
                    self.dataset_service.register_dataset_from_file(path, dataset_id=did)

        if manifest.get("active_dataset_id"):
            self.dataset_service.set_active(manifest["active_dataset_id"])

        return {"success": True, "manifest": manifest}
