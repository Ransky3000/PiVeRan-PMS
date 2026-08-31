import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # backend/app
BACKEND_DIR = os.path.dirname(BASE_DIR)              # backend
WORKSPACE_DIR = os.path.dirname(BACKEND_DIR)
DEFAULT_SQLITE_URL = f"sqlite:///{os.path.join(BACKEND_DIR, 'piveran.db')}"

if "DATABASE_URL" not in os.environ:
    env_file = os.path.join(WORKSPACE_DIR, ".env")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("DATABASE_URL="):
                    val = line.split("DATABASE_URL=", 1)[1].strip().strip('"').strip("'")
                    if val and not val.startswith("PASTE_"):
                        os.environ["DATABASE_URL"] = val
                    break

DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_SQLITE_URL).strip()

# Normalize postgres:// scheme if provided by cloud hosts to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Connect with appropriate engine arguments
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

