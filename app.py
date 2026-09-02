"""
Hugging Face Spaces Entry Point for CivicSphere AI Unified Backend.
Mounts the production FastAPI application onto Gradio for 100% free hosting on CPU Basic.
"""

import sys
from pathlib import Path

# Ensure root directory is on Python path
root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import gradio as gr
from backend.app.main import app as fastapi_app

# Create a lightweight Gradio interface providing documentation and status
with gr.Blocks(title="CivicSphere AI — Unified Backend") as demo:
    gr.Markdown(
        """# 🏛️ CivicSphere AI — Unified Backend
Welcome to the CivicSphere AI Production API service.

- **API Version**: `1.0.0`
- **Swagger Documentation**: [Interactive OpenAPI Docs](/docs)
- **Health Check**: [API Health Endpoint](/api/v1/health)
- **Architecture**: Modular Monolith (Legal, Government, Knowledge Graph, Document AI, Cases, Agents)
"""
    )

# Mount Gradio onto the existing production FastAPI app
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=7860, reload=False)
