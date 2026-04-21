# ── Stage 1: Build React frontend ─────────────────────────────────────────────
FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig*.json ./
COPY src ./src
COPY public ./public

RUN npm run build

# ── Stage 2: Production runtime (Python) ──────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app/server

RUN pip install --no-cache-dir uv
COPY server/requirements.txt ./
RUN uv pip install --system --no-cache -r requirements.txt

COPY server/main.py server/skills.py ./

# Built frontend (served as static files by FastAPI)
COPY --from=frontend-builder /app/dist ../dist

# Content .md files loaded at runtime by skills.py
COPY src/content ../src/content

ENV APP_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
