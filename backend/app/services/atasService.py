# realiza busca de atas de reunião na api

from fastapi import HTTPException
import requests
import httpx
import asyncio

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

async def pesquisar_atas(
    tipo: int,
    ano: str, 
    mes: str = None,
    dia: str = None,
    page: int = 1,
    page_size: int = 10
    ):
    
    BASE_URL = "https://sapl.tapira.mg.leg.br/api/sessao/sessaoplenaria/"
    
    params = {
        'tipo': tipo,
        'data_inicio__year': ano,
        'page': page,
        'page_size': page_size,
        "o": "-data_inicio"    
    }
 
    if mes:
        params['data_inicio__month'] = mes
    if dia:
        params['data_inicio__day'] = dia
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
    
        try:
            response = await client.get(BASE_URL, params=params, timeout=10.0)
            
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
