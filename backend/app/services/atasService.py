# realiza busca de atas de reunião na api

from fastapi import HTTPException
import requests
import httpx
import asyncio
import traceback

async def pesquisar_atas(
    tipo: int,
    ano: str, 
    mes: str = None,
    dia: str = None,
    page: int = 1
    ):
    
    BASE_URL = "https://sapl.tapira.mg.leg.br/api/sessao/sessaoplenaria/"
    
    params = {
        'tipo': tipo,
        'data_inicio__year': ano,
        'page': page,
        'page_size': 10,
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
            
            return dados
            
        except Exception as e:
            raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Erro {e.response.status_code} no SAPL ao acessar a URL: {url} Traceback: {traceback.format_exc()}")

