# Site
Repositório da futura versão do site da Câmara Municipal de Tapira, com algumas melhorias do tema e integração com o SAPL, de forma a garantir uma experiência mais fluida, intuitiva e com menos interrupções. 

Essa iniciativa surgiu de um problema: sites institucionais de órgãos públicos não são intuitivos, e as informações estão espalhadas em diversos lugares, então o cidadão precisa entrar em portal da transparência, em SAPL etc para conseguir a informação que deseja ver. 

Com a integração da API do SAPL, é possível garantir que tudo esteja em um só lugar, sem quebrar a navegação e a acessibilidade.

# Depende de:
Portal Modelo (Plone 4.3), Python 3.13.5, docker (para testes), docker-compose.

# Desenvolvimento:

```docker-compose up ```

para subir o portal modelo e fazer os testes.

O Backend depende do FastAPI, uma biblioteca Python para criação de APIs. Ela se alimenta da API do SAPL e retorna os dados para o Frontend.
Para subir a API em desenvolvimento, instale:

```pip install FastAPI[standard]```

e depois rode para subir o servidor em desenvolvimento: 

```fastapi dev```

Baixe o tema e instale-o na sua interface de tema nas configurações do Portal Modelo.
Ao instalar o tema, ele já virá com o JS necessário para se comunicar com a API.
Mude os scripts para referenciar sua casa legislativa.
Os page templates que são usados já estão no tema, mas devem ser criados através do /manage, ou interface de gerência do Zope, em portal_skins > custom.

# O que muda:
Página de pesquisa de atas, página de pesquisa de matérias legislativas, página de pesquisa de pauta de reuniões, respostas de indicações.
