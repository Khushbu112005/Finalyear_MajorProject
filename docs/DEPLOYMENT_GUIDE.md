# CivicSphere AI — Production Deployment Guide

## 1. Production Architecture Overview
CivicSphere is deployed using Docker Compose or Kubernetes with isolated networks:

```
[Citizen Browser] ──> [NGINX / Cloudflare SSL Termination]
                              │
                              ▼
                      [apps/web (Port 3000)]
                              │
                              ▼
                [FastAPI Backend (Port 8000)]
                     │        │         │
                     ▼        ▼         ▼
               [PostgreSQL] [Neo4j]  [Redis/MinIO]
```

## 2. Quick Deploy with Docker Compose
```bash
# 1. Clone repo
git clone https://github.com/Khushbu112005/Finalyear_MajorProject.git
cd Finalyear_MajorProject

# 2. Configure environment
cp .env.example .env
# Edit .env with production passwords and keys

# 3. Launch full stack
docker-compose up -d --build

# 4. Apply database migrations
docker-compose exec backend alembic upgrade head
```
