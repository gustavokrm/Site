from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import projetos

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projetos.router)

@app.get("/")
def root():
    return {"API funcionando corretamente!"}
