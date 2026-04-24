"""
Async database connection manager.
Uses SQLite locally (zero config) and PostgreSQL in production.
"""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from config import settings


# ── Engine ──
# For SQLite we need aiosqlite; for PG we need asyncpg
if "sqlite" in settings.DATABASE_URL:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        pool_size=20,
        max_overflow=10,
    )

# ── Session factory ──
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# ── Base model ──
class Base(DeclarativeBase):
    pass


# ── Dependency for FastAPI routes ──
async def get_db() -> AsyncSession:
    """Yield a database session; auto-close on exit."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Startup helper ──
async def init_db():
    """Create all tables on first run."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
