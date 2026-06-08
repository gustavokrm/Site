from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Request
from fastapi_cache.decorator import cache
from app.services.projetosService import buscar_tiposmateria, pesquisar_materias, carregar_todos_autores
from app.core.limiter import limiter

router = APIRouter() 

@router.get("/api/materias/pesquisar")
@limiter.limit("20/minute")
@cache(expire=43200)
async def listar_projetos(
    request: Request,
    tipo: str = Query(..., max_length=50),
    ano: str = Query(..., min_length=4, max_length=4, pattern=r"^\d{4}$"),
    page: int = Query(1, ge=1, le=100),
    numero: Optional[str] = Query(None, max_length=10),
    autor: Optional[str] = Query(None, max_length=150),
    expressoes: Optional[str] = Query(
        default=None,
        min_length=3,
        max_length=150,
        pattern=r"^[a-zA-Z0-9 áéíóúÁÉÍÓÚâêîôûÂÊÎÔÛãõÃÕçÇ]+$",
        description="Termo para buscar matérias"
    )     
):
    try:
        projetos = await pesquisar_materias(
            tipo=tipo,
            ano=ano,
            page=page,
            numero=numero,
            autor=autor,
            expressoes=expressoes
        )
        return projetos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/materias/autores")    
@limiter.limit("20/minute")
@cache(expire=43200)
async def listar_autores(request: Request):
    try:
        autores = await carregar_todos_autores(       
        )
        return autores
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/materias/tipos")
@limiter.limit("20/minute")
@cache(expire=43200)
async def listar_tiposmateria(request: Request):
    try:
        tipos = await buscar_tiposmateria()
        return tipos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
