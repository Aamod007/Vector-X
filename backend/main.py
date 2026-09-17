import os
import sys
from pathlib import Path
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

load_dotenv()

# Load the consolidated app from backend.server
from backend.server import app

# Include cyber router if available
try:
    from backend.routers import cyber
    app.include_router(cyber.router)
except Exception:
    pass


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("backend.main:app", host="127.0.0.1", port=port, reload=True)
