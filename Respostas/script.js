let paginaAtual = 1;

document.addEventListener("DOMContentLoaded", function() {

    const selecaoAno = document.getElementById("selecao-ano");
    const selecaoAutor = document.getElementById("selecao-autor");

    carregarAutor();

    // a ideia é pesquisar somente caso o botão pesquisar seja acionado, não automaticamente
    // após os campos serem selecionados


    document.getElementById('btn-pesquisar').addEventListener('click', () => {

        paginaAtual = 1;
        const ano = selecaoAno.value;
        const autorId = selecaoAutor.value;
        carregarSessoes(ano, paginaAtual, autorId);
    });

    document.getElementById('btn-proximo').addEventListener('click', () => {
        paginaAtual++;
        carregarSessoes(selecaoAno.value, paginaAtual, selecaoAutor.value);
    });

    document.getElementById('btn-anterior').addEventListener('click', () => {
        if(paginaAtual > 1){
            paginaAtual--;
            carregarSessoes(selecaoAno.value, paginaAtual, selecaoAutor.value);
        }
    });

    document.getElementById('btn-limpar').addEventListener('click', () => {
        // limpa todos os campos

        document.getElementById('selecao-ano').value = "";
        document.getElementById('selecao-autor').value = "";
        document.getElementById('lista-sessoes').innerHTML = "";
        document.getElementById('info-pagina').innerHTML = "";
        document.getElementById('controles-paginacao').style.display = "none";
    });


});

function forceHttps(url) {
    if (!url) return url;
    return url.replace(/^http:/, 'https:');
}

async function carregarAutor() {

    const selectAutor = document.getElementById('selecao-autor');
    let urlAutor = `https://sapl.tapira.mg.leg.br/api/base/autor/?tipo=2`;
    let todosAutores = [];

    try {

        let contadorPagina = 0;

        while (urlAutor && contadorPagina <5){

            const resposta = await fetch(forceHttps(urlAutor));
            if(!resposta.ok){
                break;
            }

            const dados = await resposta.json();
            const listaDaPagina = dados.results || [];
            todosAutores = todosAutores.concat(listaDaPagina);

            urlAutor = dados.pagination && dados.pagination.links ? dados.pagination.links.next : null;
            contadorPagina++;

        }

        todosAutores.forEach(autor =>{
            const opcaoHTML = document.createElement('option') ;
            opcaoHTML.value = autor.id;
            opcaoHTML.textContent = autor.nome;
            selectAutor.appendChild(opcaoHTML);


        });

    } catch (erro) {
        console.error("Falha ao carregar os autores:", erro)

    }

};

function carregarSessoes(ano, pagina) {
    const listaSessoes = document.getElementById("lista-sessoes");
    const idAutorSelecionado = document.getElementById('selecao-autor').value;
    
    let url = `https://sapl.tapira.mg.leg.br/api/materia/tramitacao/?status=43&materia__tipo=1&page=${pagina}&page_size=50`;

    if (ano && ano !== "") {
        url += `&data_tramitacao__iso_year=${ano}`;
    }

    url += `&expand=materia.autores`;

    fetch(forceHttps(url))
    .then(response => response.json())
    .then(data => {
        // Se houver um autor selecionado, filtramos o array 'results' antes de renderizar
        if(!ano) {
            alert("Favor selecionar um ano antes de pesquisar!");
            return;
        }
        
        if (idAutorSelecionado && idAutorSelecionado !== "") {
            const resultadosFiltrados = data.results.filter(sessao => {
                // Verificamos se dentro da lista de autores da matéria existe o ID selecionado
                // Importante: o ID costuma vir como número ou string, por isso usamos '=='
                return sessao.materia.autores && sessao.materia.autores.some(autor => autor.id == idAutorSelecionado);
            });

            // Sobrescrevemos os resultados brutos pelos filtrados para a renderização
            data.results = resultadosFiltrados;
        }
        else if (!idAutorSelecionado) {
            alert("Favor selecionar um autor antes de pesquisar!");
            return;
        }

        renderizarResultados(data);
    })
    .catch(error => {
        console.error("Erro:", error);
        listaSessoes.innerHTML = "<li>Erro ao carregar dados.</li>";
    });
}

function renderizarResultados(data) {
    const btnAnterior = document.getElementById("btn-anterior");
    const btnProximo = document.getElementById("btn-proximo");
    const infoPagina = document.getElementById('info-pagina');
    const listaSessoes = document.getElementById("lista-sessoes");
    const divPaginacao = document.getElementById("controles-paginacao");

    listaSessoes.innerHTML = "";

    const listaMaterias = data.results || [];

    if (listaMaterias.length === 0) {
        listaSessoes.innerHTML = `<p style="margin-top:20px;">Nenhuma matéria encontrada com esses filtros.</p>`;
        divPaginacao.style.display = "none";
        return;
    }

    listaMaterias.forEach(sessao => {
        // Extracting author names from the expanded array
        const nomesAutores = sessao.materia.autores
        ? sessao.materia.autores.map(a => a.nome).join(", ")
        : "Autor não informado";

        const baixarMateria = sessao.materia.texto_original
        ? `<a href="${sessao.materia.texto_original}" target="_blank" class="btn-download">Baixar matéria</a>`
        : "<em>Texto original indisponível</em>";

        const cardHTML = `
        <div class="card">
        <h3>${sessao.materia.__str__ || sessao.__str__}</h3>
        <p><strong>Autor:</strong> ${nomesAutores}</p>
        <p><strong>Data:</strong> ${sessao.materia.data_apresentacao}</p>
        <p><strong>Resumo/Texto:</strong> ${sessao.texto || "Sem descrição disponível"}</p>
        <p>${baixarMateria}</p>
        </div>`;
        listaSessoes.innerHTML += cardHTML;
    });
    
    if(btnAnterior && btnProximo){
        btnAnterior.disabled = !data.pagination.links.previous;
        btnProximo.disabled = !data.pagination.links.next;
        
        btnAnterior.style.opacity = btnAnterior.disabled ? "0.5" : "1";
        btnProximo.style.opacity = btnProximo.disabled ? "0.5" : "1";
        
    }
    
    if (infoPagina) {
        infoPagina.textContent = `Página ${data.pagination.page} de ${data.pagination.total_pages}`;
    }
    
    /*
    btnAnterior.disabled = (data.pagination.links.previous === null);
    btnProximo.disabled = (data.pagination.links.next === null);

    btnAnterior.style.opacity = btnAnterior.disabled ? "0.5" : "1";
    btnProximo.style.opacity = btnProximo.disabled ? "0.5" : "1";

    infoPagina.textContent = `Página ${data.pagination.page} de ${data.pagination.total_pages}`;*/

    divPaginacao.style.display = "flex";
}
