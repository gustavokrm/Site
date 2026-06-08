from slowapi import Limiter
from slowapi.util import get_remote_address

# get_remote_address extrai o IP de quem está fazendo a requisição
# e aplica o limite para ele
limiter = Limiter(key_func=get_remote_address)
