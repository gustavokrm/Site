# router para buscar de atas
from fastapi import APIRouter, Query, HTTPException, Request
from fastapi_cache.decorator import cache
from app.services.atasService import pesquisar_atas
from app.core.limiter import limiter

router = APIRouter()

@router.get("/api/atas")
@limiter.limit("5/minute")
@cache(expire=86400)
async def get_atas(request: Request, ano: str = Query(...), pagina: int = Query(1, ge=1)):
    if not ano:
        raise HTTPException(status_code=400, detail="O parâmetro 'ano' é obrigatório")
    atas = pesquisar_atas(ano, pagina)
    if not atas:
        raise HTTPException(status_code=404, detail="Atas não encontradas")
    return atas