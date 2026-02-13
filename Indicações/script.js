async function pegarNomeDoAutor(idAutor){
    try {
        const urlAutor = `https://sapl.tapira.mg.leg.br/api/base/autor/${idAutor}/`;
        const response = await fetch(urlAutor);
        const data = await response.json();
        return data.nome || "Autor Desconhecido";
    } catch (erro){
        console.error("Erro ao buscar autor", erro);
        return "Erro ao carregar";
    }
}

async function buscarUltimasIndicacoes() {
    const url = "https://sapl.tapira.mg.leg.br/api/materia/materialegislativa/";
    const ano = new Date().getUTCFullYear();
    const id = 1; // ID para Indicações

    let pagina = 1;
    let todasIndicacoes = [];
    let temMaisPaginas = true;

    // --- SEU CÓDIGO DE BUSCA (INTACTO) ---

    try {
    const response = await fetch(`${url}?&tipo=${id}&o=-data_apresentacao&page_size=3`);
    const data = await response.json();
    todasIndicacoes.push(...data.results);
    } catch (erro) {
        console.error("Não foi possível acessar as indicações.", erro);
        document.getElementById('container-cards').innerHTML = "<p>Erro ao carregar dados.</p>";
        return;
    }
    // --- SEU CÓDIGO DE ORDENAÇÃO (INTACTO) ---
    todasIndicacoes.sort((a, b) => b.numero - a.numero);
    const ultimas3Indicacoes = todasIndicacoes.slice(0, 3);

    for (const indicacao of ultimas3Indicacoes){
        const idAutor = indicacao.autores[0];
        if (idAutor){
            indicacao.nomeAutorReal = await pegarNomeDoAutor(idAutor);
        } else {
            indicacao.nomeAutorReal = "Sem autor";
        }
    }

    // --- MUDANÇA AQUI! ---
    // Em vez de console.log, chamamos a função que desenha na tela
    renderizarCardsNaTela(ultimas3Indicacoes);
}


// --- NOVA FUNÇÃO: Focada apenas em desenhar o HTML ---
function renderizarCardsNaTela(listaDeIndicacoes) {
    // 1. Encontra o "balde" vazio no HTML
    const container = document.getElementById('container-cards');

    // 2. Limpa o texto "Carregando..." que estava lá
    container.innerHTML = '';

    // 3. Para cada indicação da lista de 3 itens...
    listaDeIndicacoes.forEach(indicacao => {
        // Vamos criar o HTML do card usando "Template Strings" (as crases ``)
        // Isso permite misturar HTML com variáveis ${...}

        // NOTA: Estou assumindo que a API retorna 'numero', 'ano' e 'ementa'.
        const htmlDoCard = `
        <div class="card">
        <h3>Indicação nº ${indicacao.numero}/${indicacao.ano}</h3>
        <p><strong>Autor:</strong> ${indicacao.nomeAutorReal}</p>
        <p><strong>Assunto:</strong> ${indicacao.ementa}</p>
        </div>
        `;

        // 4. Adiciona esse novo HTML dentro do balde
        // O += significa "pegue o que já tem lá e adicione mais isso"
        container.innerHTML += htmlDoCard;
    });
}

// Executa a função principal quando a página carrega
buscarUltimasIndicacoes();
