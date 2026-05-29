# realiza busca de atas de reunião na api
from diskcache import Cache

import requests

cache = Cache(".cache_sapl")

BASE_URL = "https://sapl.tapira.mg.leg.br/api/sessao/sessaoplenaria/"

@cache.memoize(expire=86400)
def pesquisar_atas(ano: str, pagina: int = 1):
    try:
        response = requests.get(f"{BASE_URL}?data_inicio__year={ano}&page={pagina}&o=-data_inicio&page_size=6")
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Erro ao buscar atas: {e}")
    return None
