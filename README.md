# Site
Repositório da futura versão do tema para o site da Câmara Municipal de Tapira, com algumas melhorias do tema e integração com o SAPL, de forma a garantir uma experiência mais fluida, intuitiva e com menos interrupções. 
Essa iniciativa nasceu de um desejo de integrar o site com o SAPL, de forma que não seja necessário acessar outras páginas para obter a informação desejada.

# Depende de:
Portal Modelo, Plone, Zope.

# Como instalar:
Baixe o tema e instale-o na sua interface de tema nas configurações.
Mude os scripts para referenciar sua casa legislativa.
Os page templates que são usados já estão no tema, mas devem ser criados através do /manage, ou interface de gerência do Zope, em portal_skins > custom.

Modelo de HTML de um page template:

```html
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="pt" lang="pt"
      metal:use-macro="here/main_template/macros/master">
<body>
    
    <metal:main fill-slot="main">
        
        <script type="module" tal:attributes="src string:${portal_url}/++theme++cmtapira/javascript/script.js"></script> 
       
    </metal:main>
</body>
</html>
```

# O que muda:
Página de pesquisa de atas, página de pesquisa de matérias legislativas, página de pesquisa de pauta de reuniões, respostas de indicações.
