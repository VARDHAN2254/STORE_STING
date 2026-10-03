import sys
import os
from pathlib import Path

os.environ["TESTING"] = "1"

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import async_session_factory


@pytest_asyncio.fixture(scope="function")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture(scope="function")
async def db_session():
    async with async_session_factory() as session:
        yield session
