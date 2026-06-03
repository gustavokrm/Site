from datetime import datetime
import asyncio
import httpx

BASE_URL = "https://sapl.tapira.mg.leg.br/api"

def formatar_data_br(data_iso: str) -> str:
    if not data_iso:
        return "N/A"
    try:
        # Correção do bug original: strptime converte texto em objeto datetime
        dt = datetime.strptime(data_iso, "%Y-%m-%d")
        return dt.strftime("%d/%m/%Y")
    except Exception:
        return data_iso

async def buscar_tiposmateria() -> list:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/materia/tipomaterialegislativa/", timeout=5.0)
            if response.status_code == 200:
                return response.json().get("results", [])
    except Exception as e:
        print(f"Erro ao buscar tipos de matéria: {e}")
    return []

async def carregar_todos_autores() -> list:
    todos_autores = []
    url_autor = f"{BASE_URL}/base/autor/?tipo=2"
    contador = 0
    
    async with httpx.AsyncClient() as client:
        while url_autor and contador < 5:
            try:
                response = await client.get(url_autor, timeout=5.0)
                if response.status_code != 200:
                    break
                dados = response.json()
                todos_autores.extend(dados.get("results", []))
                
                pagination = dados.get("pagination", {})
                links = pagination.get("links", {})
                url_autor = links.get("next") if links else None
                contador += 1
            except Exception as e:
                print(f"Erro ao carregar autores: {e}")
                break
    return todos_autores

async def buscar_tramitacao_async(client: httpx.AsyncClient, id_materia: int) -> dict:
    try:
        response = await client.get(
            f"{BASE_URL}/materia/tramitacao/?materia={id_materia}&o=-data_tramitacao", 
            timeout=5.0
        )
        if response.status_code == 200:
            dados = response.json()
            lista = dados.get("results", [])
            return lista[0] if lista else {}
    except Exception as e:
        print(f"Erro na tramitação {id_materia}: {e}")
    return {}

async def buscar_documentos_async(client: httpx.AsyncClient, id_materia: int) -> list:
    try:
        response = await client.get(
            f"{BASE_URL}/materia/documentoacessorio/?materia={id_materia}", 
            timeout=5.0
        )
        if response.status_code == 200:
            return response.json().get("results", [])
    except Exception:
        pass
    return []

async def pesquisar_materias(
    tipo: str,
    ano: str,
    page: int = 1,
    numero: str = None,
    autor: str = None,
    expressoes: str = None
):
    params = {
        "expand": "autores",
        "tipo": tipo,
        "ano": ano,
        "page": page,
        "page_size": 6,
        "o": "-numero"
    }
    
    if numero: params["numero"] = numero
    if autor: params["autores"] = autor
    if expressoes: params["ementa__icontains"] = expressoes
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/materia/materialegislativa/", params=params, timeout=10.0)
            if response.status_code != 200:
                return {"error": "Erro ao acessar o SAPL"}
            
            dados = response.json()
            materias = dados.get("results", [])
            
            tarefas = []
            
            for materia in materias:
                id_materia = materia.get("id")
                autores = materia.get("autores", [])
                materia["nomeAutorReal"] = autores[0].get("nome", "Autor Desconhecido") if autores else "Sem autor"
                
                if "data_apresentacao" in materia:
                    materia["data_apresentacao_formatada"] = formatar_data_br(materia["data_apresentacao"])
                
                if id_materia:
                    tarefas.append(buscar_tramitacao_async(client, id_materia))
                    tarefas.append(buscar_documentos_async(client, id_materia))

            if tarefas:
                resultados = await asyncio.gather(*tarefas)
                
                # Remapeia os resultados assíncronos de volta para cada matéria
                indice_resultado = 0
                for materia in materias:
                    if materia.get("id"):
                        tramitacao = resultados[indice_resultado]
                        documentos = resultados[indice_resultado + 1]
                        indice_resultado += 2
                        
                        if tramitacao:
                            texto_status = tramitacao.get("__str__", "")
                            if "|" in texto_status:
                                partes = texto_status.split("|")
                                materia["status"] = f"{partes[1].strip()} - {partes[2].strip()}" if len(partes) >= 3 else texto_status
                            else:
                                materia["status"] = texto_status
                            materia["texto_completo"] = tramitacao.get("texto", "Sem texto informativo")
                        else:
                            materia["status"] = "Sem tramitação"
                            materia["texto_completo"] = "Sem texto informativo"
                            
                        materia["documentos_accessorios"] = documentos
            
            return dados
            
        except httpx.RequestError as e:
            return {"error": f"Falha de comunicação com o SAPL: {str(e)}"}
