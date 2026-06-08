# router para busca de pautas
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Request
from fastapi_cache.decorator import cache
from app.services.pautaService import buscarSessoes, buscarExpediente, buscarOrdemDoDia, buscarMateria
from app.core.limiter import limiter

router = APIRouter()

@router.get("/api/pautas/pesquisar")
@limiter.limit("20/minute")
#@cache(expire=43200)
async def get_pautas(
    request: Request, 
    tipo: int = Query(...),
    ano: str = Query(..., min_length=4, max_length=8), 
    mes: Optional[str] = Query(None, max_length=10), 
    dia: Optional[str] = Query(None, max_length=10), 
    page: int = Query(1, ge=1, le=10)
):

    try:
        pautas = await buscarSessoes(
            tipo = tipo,
            ano = ano,
            mes = mes,
            dia = dia,
            page = page
        )
        return {"results": pautas}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/api/pautas/expediente")
@limiter.limit("20/minute")
@cache(expire=43200)
async def get_expediente(
    request: Request,
    sessao_id: int = Query(1, ge=1, le=300)  
):

    try:
        expediente = await buscarExpediente(
            sessao_id = sessao_id
        )
        return expediente

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/pautas/ordemdodia")
@limiter.limit("20/minute")
@cache(expire=43200)
async def get_ordemDoDia(request: Request,
    sessao_id: int = Query(1, ge=1, le=300)  
):

    try:
        ordemdodia = await buscarOrdemDoDia(
            sessao_id = sessao_id
        )
        return ordemdodia

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@router.get("/api/materias/pesquisar/{materia_id}")
@limiter.limit("20/minute")
@cache(expire=43200)
async def get_materia(request: Request, materia_id: int):
    try:
        materia = await buscarMateria(materia_id=materia_id)
        if not materia:
            raise HTTPException(status_code=404, detail="Matéria não encontrada")
        return materia
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
