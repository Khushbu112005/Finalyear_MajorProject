# Multi-stage Python 3.11 production container for CivicSphere Unified Backend
FROM python:3.11-slim as builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY packages/ packages/
COPY backend/ backend/
COPY data/ data/
COPY README.md .
COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

# Final Runner Stage
FROM python:3.11-slim as runner

WORKDIR /app

# Security: Non-root user with home directory (User ID 1000 standard for Hugging Face Spaces and container isolation)
RUN groupadd -r civicsphere && useradd -m -r -g civicsphere -u 1000 civicsphere

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY packages/ packages/
COPY backend/ backend/
COPY data/ data/
COPY README.md .
COPY pyproject.toml .

RUN pip install --no-cache-dir -e .

USER civicsphere

EXPOSE 7860
EXPOSE 8000

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENVIRONMENT=production

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-7860} --workers 2"]
