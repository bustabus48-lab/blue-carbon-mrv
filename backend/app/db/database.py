import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from dotenv import load_dotenv

# Load environment variables, primarily looking for DB_URL 
# (either local from .env.supabase or a production URL)
load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env.supabase"))
load_dotenv("../.env.supabase")
load_dotenv()

# Build the async database URL
# Supabase connection strings start with postgresql:// or postgres://
# We need to change it to postgresql+asyncpg:// for SQLAlchemy async
DATABASE_URL = os.getenv("DB_URL", "postgresql://postgres:postgres@127.0.0.1:54332/postgres")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://")

# Create Async Engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_size=10,
    max_overflow=20
)

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db():
    """Dependency to provide a database session to FastAPI routes."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
