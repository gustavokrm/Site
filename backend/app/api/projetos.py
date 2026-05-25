from fastapi import APIRouter, Query
from app.services.projetosService import pesquisar_materias, carregar_todos_autores

router = APIRouter() 

@router.get("/api/materias/pesquisar")
def listar_projetos(
    tipo: str = Query(...),
    ano: str = Query(...),
    page: int = Query(1),
    numero: str = Query(None),
    autor: str = Query(None),
    expressoes: str = Query(None)
):
    projetos = pesquisar_materias(
        tipo=tipo,
        ano=ano,
        page=page,
        numero=numero,
        autor=autor,
        expressoes=expressoes
    )
    return projetos

@router.get("/api/materias/autores")    
def listar_autores():
    autores = carregar_todos_autores()
    return autores

