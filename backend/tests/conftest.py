import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.celery_app import celery_app

# Enable eager execution for unit/integration tests so tests run instantly without requiring live Redis
celery_app.conf.update(
    task_always_eager=True,
    task_eager_propagates=True,
)
