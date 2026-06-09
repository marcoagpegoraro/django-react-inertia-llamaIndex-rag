FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY package.json pnpm-lock.yaml vite.config.mjs ./
COPY frontend ./frontend

RUN corepack enable && pnpm install --frozen-lockfile && pnpm build

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_DEBUG=false

WORKDIR /app

COPY requirements.txt ./

RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install -r requirements.txt

ENV PATH="/opt/venv/bin:$PATH"

COPY . .
COPY --from=frontend-builder /app/frontend_dist ./frontend_dist

RUN chmod +x docker/entrypoint.sh

EXPOSE 8000

CMD ["./docker/entrypoint.sh"]
