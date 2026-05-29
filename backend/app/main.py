import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis

from app.api import atas
from app.api import projetos
from app.core.limiter import limiter

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

async def lifespan(app: FastAPI):

    redis = aioredis.from_url(REDIS_URL)
    FastAPICache.init(RedisBackend(redis), prefix="sapl-cache")
    yield
    #Fechar a conexão quando a API desligar
    await redis.aclose()

app = FastAPI(lifespan=lifespan,docs_url=None,redoc_url=None)

# anexa o limitador ao estado global da aplicação
app.state.limiter = limiter

# lida com o erro de excesso de requisições
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# middleware, permite somente origens conhecidas e métodos aprovados
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://127.0.0.1:8081', 'http://localhost:8081', 'http://localhost:8081'],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(projetos.router)
app.include_router(atas.router)

@app.get("/")
def root():
    return {"API funcionando corretamente!"}
