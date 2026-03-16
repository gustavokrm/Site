let paginaAtual = 1;

document.addEventListener("DOMContentLoaded", function() {
    const selecaoAno = document.getElementById("selecao-ano");
    const selecaoAutor = document.getElementById("selecao-autor");
    const listaSessoes = document.getElementById("lista-sessoes");
      

    // Carregar as sessões do ano selecionado quando a seleção mudar
    selecaoAno.addEventListener("change", function() {
        const anoSelecionado = this.value;
        carregarSessoes(anoSelecionado, paginaAtual);
    });

    // Carregar as sessões do ano atual ao carregar a página
    const anoAtual = new Date().getFullYear();
    selecaoAno.value = anoAtual;
    carregarSessoes(anoAtual, paginaAtual);
}); 


function carregarSessoes(ano, paginaAtual, idAutor) {
        // Aqui você pode fazer uma requisição AJAX para obter as sessões do ano selecionado
        // Endpoint para buscar respostas: https://sapl.tapira.mg.leg.br/api/materia/tramitacao/?status=43&materia__tipo=1&expand=materia,materia.autores=${idAutor}
        // Tipo 1 - Indicação
        // Status 43 - Indicação respondida pelo órgão responsável
        // Expand para obter detalhes da matéria e autores sem precisar fazer uma segunda requisição cruzando os dados
        // Paginação: pagination.links.next para obter a próxima página de resultados, pagination.links.prev para obter a página anterior. 
        // page=2 para acessar a página 2, page=3 para acessar a página 3, e assim por diante.
        
        urlBase = "https://sapl.tapira.mg.leg.br/api";
        autores = idAutor; // Substitua pelo ID do autor desejado

        fetch(`https://sapl.tapira.mg.leg.br/api/sessoes?&ano=${ano}&page=${paginaAtual}`)
            .then(response => response.json())
            .then(data => {
                // Limpar a lista de sessões
                listaSessoes.innerHTML = "";
                // Iterar sobre as sessões e adicionar à lista
                data.results.forEach(sessao => {
                    const itemSessao = document.createElement("li");
                    itemSessao.textContent = `Sessão: ${sessao.__str__} - Data: ${sessao.data_apresentacao} - Texto: ${sessao.materia.texto}`;
                    listaSessoes.appendChild(itemSessao);
                });
                renderizarResultados(data);
            })
            .catch(error => console.error("Erro ao carregar sessões:", error));
}

function renderizarResultados(data) {
    
    const btnAnterior = document.getElementById("btn-anterior");
    const btnProximo = document.getElementById("btn-proximo");
    const containerResultados = document.getElementById("lista-sessoes");
    listaSessoes.innerHTML = ""; // Limpa a lista antes de renderizar os novos resultados

    const listaMaterias = data.results || [];

    if(listaMaterias.length === 0) {
        const itemSessao = document.createElement("li");
        itemSessao.textContent = "Nenhuma sessão encontrada para o ano selecionado.";
        listaSessoes.appendChild(itemSessao);
    } else {
        listaMaterias.forEach(sessao => {
            const baixarMateria = sessao.materia.texto_original ? `<a href="${sessao.materia.texto_original}" target="_blank">Baixar matéria</a>` : "Texto original indisponível";
            const cardHTML = `<div class="card">
                <h3>${sessao.__str__}</h3>
                <p><strong>Data:</strong> ${sessao.data_apresentacao}</p>
                <p><strong>Texto:</strong> ${sessao.materia.texto}</p>
                <p>${baixarMateria}</p>
            </div>`;
            containerResultados.innerHTML += cardHTML;
        });
        btnAnterior.disabled = !data.pagination.links.prev;
        btnProximo.disabled = !data.pagination.links.next;
    }
}