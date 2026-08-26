# mostra quais indicações foram respondidas pela Prefeitura

from fastapi import HTTPException
import requests
import httpx
import asyncio

BASE_URL = "https://sapl.tapira.mg.leg.br/api/materia/tramitacao/?status=43&materia__tipo=1"

async def pesquisar_respostas (
        ano: str,
        page: int = 1,
        autor: str
    ):

    params = {
        "expand": "autores",
        "data_tramitacao__iso_year": ano,
        "page": page,
        "page_size": 6,
        "o": "-data_apresentacao"
    }

    autor: params["autores"] = autor

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}", params=params, timeout=10.0)
            if response.status_code !=200:
                return {"error": "Erro ao acessar o SAPL"}

            dados = response.json()
            materias = dados.get("results", [])

    except httpx.RequestError as e:
        return {"error": f"Falha de comunicação com o SAPL: {str(e)}"}

