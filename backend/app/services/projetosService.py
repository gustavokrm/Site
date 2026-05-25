from datetime import datetime
import requests

BASE_URL = "https://sapl.tapira.mg.leg.br/api"

def formatar_data_br(data_iso: str) -> str:
    if not data_iso:
        return "N/A"
    try:
        # Converte data iso para DD/MM/YYYY
        dt = datetime.strftime(data_iso, "%Y-%m-%d")
        return dt.strftime("%d/%m/%Y")
    except Exception:
        return data_iso
        
def buscar_tramitacao(id_materia: int) -> dict:
    try:
        response = requests.get(f"{BASE_URL}/materia/tramitacao/?materia={id_materia}&o=-data_tramitacao")
        if response.status_code == 200:
            dados = response.json()
            lista = dados.get("results", [])
            return lista[0]
    except Exception as e:
        print(f"Erro ao buscar tramitação: {e}")
    return {}
    
def buscar_documentos(id_materia: int) -> list:
    try:
        response = requests.get(f"{BASE_URL}/materia/documentoacessorio/?materia={id_materia}")
        if response.status_code == 200:
            return response.json().get("results", [])
    except Exception:
        pass
    return []

def pesquisar_materias(
    tipo: str,
    ano: str,
    page: int = 1,
    numero: str = None,
    autor: str = None,
    expressoes: str = None
):

    # parâmetros de busca
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
    if expressoes: params["ementa__icontains"]  = expressoes
    
    response = requests.get(f"{BASE_URL}/materia/materialegislativa/", params=params)
    if response.status_code != 200:
        return {"error": "Erro ao acessar o SAPL"}, response.status_code
    
    dados = response.json()
    materias = dados.get("results", [])
    
    for materia in materias:
        id_materia = materia.get("id")
        
        autores_expandidos = materia.get("autores", [])
        if autores_expandidos:
            materia["nomeAutorReal"] = autores_expandidos[0].get("nome", "Autor Desconhecido")
        else:
            materia["nomeAutorReal"] = "Sem autor"
    
        if "data_apresentacao" in materia:
            materia["data_apresentacao_formatada"] = formatar_data_br(materia["data_apresentacao"])
            
        if id_materia:
            tramitacao_recente = buscar_tramitacao(id_materia)
            if tramitacao_recente:
                texto_status = tramitacao_recente.get("__str__", "")
                if "|" in texto_status:
                    partes = texto_status.split("|")
                    materia["status"] = f"{partes[1].strip()} - {partes[2].strip()}" if len(partes) >= 3 else texto_status
                else:
                    materia["status"] = texto_status
                materia["texto_completo"] = tramitacao_recente.get("texto", "Sem texto informativo")
            else:
                materia["status"] = "Sem tramitação"
                materia["texto_completo"] = "Sem texto informativo"

            materia["documentos_accessorios"] = buscar_documentos(id_materia)

    return dados
    
def carregar_todos_autores():
    todos_autores = []
    url_autor = f"{BASE_URL}/base/autor/?tipo=2"
    contador = 0
    
    while url_autor and contador < 5:
        try:
            response = requests.get(url_autor)
            if response.status_code !=200:
                break;
            dados = response.json()
            todos_autores.extend(dados.get("results", []))
            
            pagination = dados.get("pagination", {})
            links = pagination.get("links", {})
            url_autor = links.get("next") if links else None
            contador +=1
        except Exception:
            break
    return todos_autores
