
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

# Install runtime deps first for better layer caching.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Application code + migrations + seed (only what the runtime needs).
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./alembic.ini
COPY seed.py ./seed.py

# Run as a non-root user.
RUN useradd --create-home --uid 1000 appuser
USER appuser

EXPOSE 8000

# Apply migrations, then start a single uvicorn process. Single process is
# intentional: the realtime WebSocket manager is in-memory and not shared
# across workers (see app/realtime/manager.py).
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
