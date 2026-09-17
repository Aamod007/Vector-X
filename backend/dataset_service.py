import os
import hashlib
import json
import time
import pandas as pd
import numpy as np

APP_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(APP_ROOT, "data")
STORE_DIR = os.path.join(APP_ROOT, "pipeline_store")
UPLOAD_DIR = os.path.join(APP_ROOT, "temp", "uploads")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(STORE_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

DATASET_STORE_FILE = os.path.join(STORE_DIR, "pipeline_studio_dataset_store.json")

class DatasetService:
    def __init__(self):
        self.datasets: dict[str, dict] = {}
        self.active_dataset_id: str | None = None
        self._ensure_sample_data()
        self._load_store()
        if not self.datasets:
            self._seed_default_datasets()

    def _ensure_sample_data(self):
        """Create sample audit trail dataset if not present to match reference image."""
        audit_path = os.path.join(DATA_DIR, "track2_iam_audit_trail.csv")
        if not os.path.exists(audit_path):
            np.random.seed(42)
            n_rows = 20500
            actions = ["AssumeRole", "GetSecretValue", "CreateUser", "AttachRolePolicy", "DeleteBucket", "AuthorizeSecurityGroupIngress", "ListBuckets", "UpdateAssumeRolePolicy"]
            users = [f"user_sec_{i:03d}" for i in range(1, 45)]
            roles = ["AdminRole", "DevOpsEngineers", "ReadOnlyAudit", "DataScientistAccess", "SecurityOperator", "CI_CD_Deployer"]
            regions = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]
            statuses = ["Success", "AccessDenied", "UnauthorizedOperation", "ValidationException"]
            privileges = ["High", "Medium", "Low", "Admin"]
            
            timestamps = pd.date_range("2026-08-01", periods=n_rows, freq="2min").astype(str)
            df_audit = pd.DataFrame({
                "timestamp": timestamps,
                "event_id": [f"evt_{hashlib.md5(str(i).encode()).hexdigest()[:10]}" for i in range(n_rows)],
                "user_id": np.random.choice(users, n_rows),
                "role": np.random.choice(roles, n_rows),
                "action": np.random.choice(actions, n_rows, p=[0.25, 0.20, 0.10, 0.10, 0.05, 0.10, 0.15, 0.05]),
                "resource_arn": [f"arn:aws:iam::123456789012:role/{np.random.choice(roles)}" for _ in range(n_rows)],
                "source_ip": [f"192.168.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}" for _ in range(n_rows)],
                "user_agent": np.random.choice(["Boto3/1.34.0", "AWS-CLI/2.15.0", "Console/CloudTrail", "Terraform/1.6.0"], n_rows),
                "status_code": np.random.choice(statuses, n_rows, p=[0.82, 0.12, 0.04, 0.02]),
                "mfa_used": np.random.choice([True, False], n_rows, p=[0.75, 0.25]),
                "region": np.random.choice(regions, n_rows),
                "session_duration_s": np.random.randint(60, 7200, n_rows),
                "privilege_level": np.random.choice(privileges, n_rows, p=[0.2, 0.4, 0.3, 0.1]),
                "risk_score": np.round(np.random.beta(2, 5, n_rows) * 100, 1),
                "audit_category": np.random.choice(["PrivilegedAccess", "CredentialExposure", "PolicyChange", "DataRead"], n_rows)
            })
            df_audit.to_csv(audit_path, index=False)

        firewall_path = os.path.join(DATA_DIR, "track2_firewall_logs.csv")
        if not os.path.exists(firewall_path):
            n_fw = 38600
            df_fw = pd.DataFrame({
                "timestamp": pd.date_range("2026-08-01", periods=n_fw, freq="1min").astype(str),
                "source_ip": [f"10.0.{np.random.randint(1, 50)}.{np.random.randint(1, 255)}" for _ in range(n_fw)],
                "dest_ip": [f"172.16.{np.random.randint(1, 10)}.{np.random.randint(1, 255)}" for _ in range(n_fw)],
                "dest_port": np.random.choice([443, 80, 22, 5432, 3306, 8080], n_fw),
                "protocol": np.random.choice(["TCP", "UDP"], n_fw, p=[0.9, 0.1]),
                "action": np.random.choice(["ACCEPT", "DROP", "REJECT"], n_fw, p=[0.85, 0.12, 0.03]),
                "bytes_transferred": np.random.randint(40, 65535, n_fw),
                "rule_id": [f"rule_{np.random.randint(100, 999)}" for _ in range(n_fw)]
            })
            df_fw.to_csv(firewall_path, index=False)

    def _load_store(self):
        if os.path.exists(DATASET_STORE_FILE):
            try:
                with open(DATASET_STORE_FILE, "r", encoding="utf-8") as f:
                    meta_store = json.load(f)
                for did, meta in meta_store.items():
                    path = meta.get("provenance", {}).get("source")
                    if path and os.path.exists(path):
                        df = pd.read_csv(path)
                        meta["data"] = df
                        meta["shape"] = [len(df), len(df.columns)]
                        meta["columns"] = list(df.columns)
                        meta["dtypes"] = {col: str(dtype) for col, dtype in df.dtypes.items()}
                        self.datasets[did] = meta
            except Exception as e:
                print(f"Error loading dataset store: {e}")

    def _save_store(self):
        try:
            meta_store = {}
            for did, entry in self.datasets.items():
                meta_store[did] = {
                    "id": entry.get("id"),
                    "label": entry.get("label"),
                    "stage": entry.get("stage"),
                    "shape": entry.get("shape"),
                    "created_ts": entry.get("created_ts"),
                    "created_by": entry.get("created_by"),
                    "provenance": entry.get("provenance"),
                    "columns": entry.get("columns"),
                    "dtypes": entry.get("dtypes")
                }
            with open(DATASET_STORE_FILE, "w", encoding="utf-8") as f:
                json.dump(meta_store, f, indent=2)
        except Exception as e:
            print(f"Error saving dataset store: {e}")

    def _seed_default_datasets(self):
        """Seed datasets matching the reference image and sample data."""
        # 1. track2_iam_audit_trail (Active in reference image)
        audit_path = os.path.join(DATA_DIR, "track2_iam_audit_trail.csv")
        if os.path.exists(audit_path):
            self.register_dataset_from_file(audit_path, label="track2_iam_audit_trail", dataset_id="track2_iam_audit_trail", stage="raw")
        
        # 2. track2_firewall_logs
        fw_path = os.path.join(DATA_DIR, "track2_firewall_logs.csv")
        if os.path.exists(fw_path):
            self.register_dataset_from_file(fw_path, label="track2_firewall_logs", dataset_id="track2_firewall_logs", stage="raw")

        # 3. churn_data
        churn_path = os.path.join(DATA_DIR, "churn_data.csv")
        if os.path.exists(churn_path):
            self.register_dataset_from_file(churn_path, label="churn_data", dataset_id="churn_data", stage="raw")

        # 4. bike_sales_data
        bike_path = os.path.join(DATA_DIR, "bike_sales_data.csv")
        if os.path.exists(bike_path):
            self.register_dataset_from_file(bike_path, label="bike_sales_data", dataset_id="bike_sales_data", stage="raw")

        self.set_active("track2_iam_audit_trail")

    def register_dataset_from_file(self, file_path: str, label: str | None = None, dataset_id: str | None = None, stage: str = "raw") -> dict:
        abs_path = os.path.abspath(file_path)
        df = pd.read_csv(abs_path) if abs_path.endswith(".csv") else pd.read_excel(abs_path)
        
        with open(abs_path, "rb") as f:
            sha256 = hashlib.sha256(f.read()).hexdigest()
            
        did = dataset_id or f"{stage}_{os.path.splitext(os.path.basename(abs_path))[0]}"
        lbl = label or os.path.splitext(os.path.basename(abs_path))[0]
        
        entry = {
            "id": did,
            "label": lbl,
            "stage": stage,
            "shape": [len(df), len(df.columns)],
            "created_ts": time.time(),
            "created_by": "User",
            "provenance": {
                "source_type": "file",
                "source": abs_path,
                "original_name": os.path.basename(abs_path),
                "sha256": sha256
            },
            "data": df,
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()}
        }
        self.datasets[did] = entry
        self._save_store()
        if not self.active_dataset_id:
            self.active_dataset_id = did
        return self.get_dataset_meta(did)

    def register_dataset_from_df(self, df: pd.DataFrame, label: str, stage: str = "transformed", parent_id: str | None = None, created_by: str = "Agent") -> dict:
        did = f"{stage}_{int(time.time()*1000)%100000}"
        save_path = os.path.join(UPLOAD_DIR, f"{did}.csv")
        df.to_csv(save_path, index=False)
        
        entry = {
            "id": did,
            "label": label,
            "stage": stage,
            "shape": [len(df), len(df.columns)],
            "created_ts": time.time(),
            "created_by": created_by,
            "parent_id": parent_id,
            "provenance": {
                "source_type": "pipeline_step",
                "parent_id": parent_id,
                "source": save_path
            },
            "data": df,
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()}
        }
        self.datasets[did] = entry
        self._save_store()
        self.active_dataset_id = did
        return self.get_dataset_meta(did)

    def list_datasets(self) -> list[dict]:
        out = []
        for did, entry in self.datasets.items():
            out.append(self.get_dataset_meta(did))
        out.sort(key=lambda x: x.get("created_ts", 0), reverse=True)
        return out

    def get_dataset(self, dataset_id: str) -> dict | None:
        return self.datasets.get(dataset_id)

    def get_dataset_meta(self, dataset_id: str) -> dict:
        entry = self.datasets.get(dataset_id)
        if not entry:
            return {}
        df = entry.get("data")
        size_bytes = int(df.memory_usage(deep=True).sum()) if isinstance(df, pd.DataFrame) else 0
        return {
            "id": entry.get("id"),
            "label": entry.get("label"),
            "stage": entry.get("stage"),
            "records": entry.get("shape", [0, 0])[0],
            "features": entry.get("shape", [0, 0])[1],
            "shape": entry.get("shape"),
            "columns": entry.get("columns", []),
            "dtypes": entry.get("dtypes", {}),
            "size_bytes": size_bytes,
            "created_ts": entry.get("created_ts"),
            "created_by": entry.get("created_by"),
            "is_active": dataset_id == self.active_dataset_id
        }

    def set_active(self, dataset_id: str) -> bool:
        if dataset_id in self.datasets:
            self.active_dataset_id = dataset_id
            return True
        return False

    def get_active_dataset(self) -> dict | None:
        if self.active_dataset_id and self.active_dataset_id in self.datasets:
            return self.datasets[self.active_dataset_id]
        if self.datasets:
            first_id = next(iter(self.datasets.keys()))
            self.active_dataset_id = first_id
            return self.datasets[first_id]
        return None

    def get_telemetry(self) -> dict:
        active = self.get_active_dataset()
        if not active or not isinstance(active.get("data"), pd.DataFrame):
            return {
                "records": 0,
                "features": 0,
                "stage": "RAW",
                "label": "None",
                "total_datasets": len(self.datasets),
                "total_storage_mb": 0.0
            }
        df = active["data"]
        total_bytes = sum(
            int(e["data"].memory_usage(deep=True).sum()) 
            for e in self.datasets.values() 
            if isinstance(e.get("data"), pd.DataFrame)
        )
        return {
            "records": len(df),
            "features": len(df.columns),
            "stage": str(active.get("stage", "raw")).upper(),
            "label": active.get("label", active.get("id")),
            "dataset_id": active.get("id"),
            "total_datasets": len(self.datasets),
            "total_storage_mb": round(total_bytes / (1024 * 1024), 1)
        }

    def get_preview(self, dataset_id: str, limit: int = 100) -> dict:
        entry = self.datasets.get(dataset_id) or self.get_active_dataset()
        if not entry or not isinstance(entry.get("data"), pd.DataFrame):
            return {"error": "Dataset not found"}
        df = entry["data"]
        
        stats = {}
        for col in df.columns[:25]:
            col_series = df[col]
            null_count = int(col_series.isnull().sum())
            unique_count = int(col_series.nunique())
            if pd.api.types.is_numeric_dtype(col_series):
                stats[col] = {
                    "dtype": str(col_series.dtype),
                    "null_count": null_count,
                    "unique_count": unique_count,
                    "min": float(col_series.min()) if not pd.isna(col_series.min()) else None,
                    "max": float(col_series.max()) if not pd.isna(col_series.max()) else None,
                    "mean": float(col_series.mean()) if not pd.isna(col_series.mean()) else None,
                }
            else:
                stats[col] = {
                    "dtype": str(col_series.dtype),
                    "null_count": null_count,
                    "unique_count": unique_count,
                    "top_values": col_series.value_counts().head(5).to_dict()
                }

        preview_df = df.head(limit)
        records = preview_df.replace({np.nan: None}).to_dict(orient="records")
        return {
            "id": entry.get("id"),
            "label": entry.get("label"),
            "shape": [len(df), len(df.columns)],
            "columns": list(df.columns),
            "dtypes": {c: str(df[c].dtype) for c in df.columns},
            "rows": records,
            "total_rows": len(df),
            "stats": stats
        }

    def delete_dataset(self, dataset_id: str) -> bool:
        if dataset_id in self.datasets:
            del self.datasets[dataset_id]
            self._save_store()
            if self.active_dataset_id == dataset_id:
                self.active_dataset_id = next(iter(self.datasets.keys())) if self.datasets else None
            return True
        return False
