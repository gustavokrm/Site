# router para buscar de atas
from fastapi import APIRouter, Query, HTTPException, Request
from typing import Optional
from fastapi_cache.decorator import cache
from app.services.atasService import pesquisar_atas
from app.core.limiter import limiter

router = APIRouter()

@router.get("/api/atas")
@limiter.limit("50/minute")
@cache(expire=43200)
async def get_atas(
    request: Request,
    tipo: int = Query(...),
    ano: str = Query(..., min_length=4, max_length = 8),
    mes: Optional[str] = Query(None, max_length=10),
    dia: Optional[str] = Query(None, max_length=10),
    page: int = Query(1, ge=1)
    
    ):
    
    try:
        atas = await pesquisar_atas(
            tipo = tipo, 
            ano = ano,
            mes = mes,
            dia = dia,
            page = page
        )
    
        return atas
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
