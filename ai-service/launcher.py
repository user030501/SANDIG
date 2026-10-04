import os

from sklearn.ensemble import RandomForestClassifier
import uvicorn

from app import app


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=int(os.environ.get("SANDIG_AI_PORT", "8000")),
        log_level="warning",
    )