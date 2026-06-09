# busca informações sobre as pautas das sessões
# para tanto, ele precisa buscar informações em vários lugares
# primeiramente, ele precisa buscar as sessões em /api/sessao/sessaoplenaria, com os parâmetros de tipo e data de inicio
# tipo 1 - ordinária, 2 - extraordinária, 3 - solene
# data de inicio - formato YYYY-MM-DD
# depois, com o id da sessão, deve buscar as matérias cadastradas em ordem do dia: /api/sessao/ordemdia/?sessao_plenaria = id da sessao
# por fim, para que o cidadão possa baixar a matéria cadastrada, ele precisa buscar a matéria em /materia/materialegislativa, na qual 
# o id da matéria é a variável materia que vem na resposta da ordem do dia.
from fastapi import HTTPException
import requests
import httpx
import asyncio

baseURL = 'https://sapl.tapira.mg.leg.br/api'

async def fetch_json(client: httpx.AsyncClient, url: str, params: dict = None):

    response = await client.get(url, params=params, follow_redirects=True)    
    
    if response.status_code == 404:
        return {"results": []}
        
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code, 
            detail=f"Erro {e.response.status_code} no SAPL ao acessar a URL: {url}"
        )
        
    return response.json()

async def buscarSessoes(
        tipo: int, 
        ano: str,
        mes: str = None,
        dia: str = None,
        page: int = 1,
        page_size: int = 100
    ):
    
    todos_tipos = []
    
    url = f'{baseURL}/sessao/sessaoplenaria/' 
            
    params = {
        'tipo': tipo,
        'page': page,
        'page_size': page_size,
        "o": "-data_inicio"
    }
    
    if ano:
        params['data_inicio__year'] = ano
    if mes:
        params['data_inicio__month'] = mes
    if dia:
        params['data_inicio__day'] = dia
    
   # while url:
   #     try:
    async with httpx.AsyncClient(follow_redirects=True) as client:
    
        try: 
            response = await client.get(url, params=params, timeout=10.0)
            
            if response.status_code!=200:
                return {"error": "Erro ao acessar o SAPL"}
            
            dados = response.json()
            resposta = dados.get("results", [])
                        
            #paginação
            proxima_url = dados.get("next")
            if not proxima_url:
                proxima_url = dados.get("pagination", {}).get("links", {}).get("next")
            url = proxima_url
            
            print("Próxima URL:", proxima_url)
            
            params = None
        
        except Exception as e:
            raise HTTPException(
            status_code=e.response.status_code, 
            detail=f"Erro {e.response.status_code} no SAPL ao acessar a URL: {url}")
            
    return resposta
    
    
async def buscarExpediente(sessao_id):
    try:
        url = f'{baseURL}/sessao/expedientemateria/'
        params = {
            'sessao_plenaria': sessao_id
        }
        async with httpx.AsyncClient() as client:
            response = await fetch_json(client, url, params=params)
        
        expediente = response.get('results', [])
        return expediente
    except Exception as e:
        print(f'Erro ao buscar expediente: {e}')
        return None

async def buscarOrdemDoDia(sessao_id):
    try:
        url = f'{baseURL}/sessao/ordemdia/'
        params = {
            'sessao_plenaria': sessao_id
        }
        async with httpx.AsyncClient() as client:
            response = await fetch_json(client, url, params=params)
        
        ordem_do_dia = response.get('results', [])
        return ordem_do_dia
    except Exception as e:
        print(f'Erro ao buscar ordem do dia: {e}')
        return None
    
async def buscarMateria(materia_id):
    try:
        url = f'{baseURL}/materia/materialegislativa/{materia_id}/'
        async with httpx.AsyncClient() as client:
            materia = await fetch_json(client, url)
        return materia
    except Exception as e:
        print(f'Erro ao buscar matéria: {e}')
        return None
