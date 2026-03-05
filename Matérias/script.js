// TODO modficar o código de forma a garantir que ele capture pelo menos o tipo de matéria e o ano da matéria. Ver também uma forma de garantir que os dados opcionais sejam capturados conforme necessário.

function escaparHTML(texto) {
    if(!texto) return "";
    return texto.toString()
    .replace(/&/g, "&samp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039");
}

document.addEventListener('DOMContentLoaded', () =>{

    const selectAno = document.getElementById('ano-materia');
    const selectTipo = document.getElementById('tipo-materia');
    const anoAtual = new Date().getFullYear();
    const anoInicial = 2021;

    for (let ano = anoAtual; ano >= anoInicial; ano --){
        const novaOpcao = document.createElement('option');
        novaOpcao.value = ano;
        novaOpcao.textContent = ano;
        selectAno.appendChild(novaOpcao);
    }

    selectAno.value = "";
    anoPesquisado = anoAtual;

    carregarTiposMateria();
    carregarNomeAutor();

    document.getElementById('btn-pesquisar').addEventListener('click', () => {

        /*const anoEscolhido = document.getElementById('ano-materia').value;

        if(anoEscolhido === ""){
            alert("Por favor, selecione um ano na lista.");
            return;
        }*/
        pesquisaMateria();
    });
});

async function carregarTiposMateria(){

    const selectTipo = document.getElementById('tipo-materia');
    const urlTiposSapl = 'https://sapl.tapira.mg.leg.br/api/materia/tipomaterialegislativa';

    try{
        const resposta = await fetch(urlTiposSapl);
        if(!resposta.ok){
            throw new Error(`Erro ao carregar tipos de matéria: ${resposta.status}`);
        }

        const dados = await resposta.json();

        const listaTipos = dados.results || dados;

        listaTipos.forEach(tipo => {
            const opcaoHTML = document.createElement('option');

            opcaoHTML.value = tipo.id;

            opcaoHTML.textContent = tipo.descricao || tipo.nome;

            selectTipo.appendChild(opcaoHTML);
        });

    } catch(erro){
        console.error("Falha ao carregar os tipos de matéria:", erro);

    }
}

async function carregarNomeAutor(){

    let tipo = 2; // para só mostrar os vereadores
    let idAutor = "";
    const selectAutor = document.getElementById('autor-materia');
    let urlAutor = `https://sapl.tapira.mg.leg.br/api/base/autor/${idAutor}?tipo=2`;

    try{

        let todosAutores = [];

        while(urlAutor)  {

            const resposta = await fetch(urlAutor);
            if(!resposta.ok){
                throw new Error(`Erro ao acessar os autores das matérias: ${resposta.status}`);
            }

            const dados = await resposta.json();
            const listaDaPagina = dados.results || dados;
            todosAutores = todosAutores.concat(listaDaPagina);
            urlAutor = dados.pagination.links.next;
        }

        todosAutores.forEach(autor => {
            const opcaoHTML = document.createElement('option');
            opcaoHTML.value = autor.id;
            opcaoHTML.textContent = autor.nome;
            selectAutor.appendChild(opcaoHTML);
        });


    } catch(erro){
        console.error("Falha ao carregar os autores:", erro)

    }

}

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

async function pesquisaMateria() {

    // 1. Capturar os valores digitados/selecionados pelo usuário
    const tipo = document.getElementById('tipo-materia').value.trim();
    const ano = document.getElementById('ano-materia').value.trim();
    const numero = document.getElementById('numero-materia').value.trim();
    const autor = document.getElementById('autor-materia').value;
    const expressoes = document.getElementById('pesquisar-expressoes').value.trim();

    // 2. Validação dos campos obrigatórios
    // Se "tipo" OU "ano" estiverem vazios, dispara o alerta e para a execução
    if (!tipo || !ano) {
        alert("Por favor, preencha os campos obrigatórios: Tipo e Ano.");
        return; // O 'return' faz o script parar de rodar aqui
    }

    // 3. Montar a URL dinamicamente com os parâmetros
    const baseUrl = 'https://sapl.tapira.mg.leg.br/api/materia/materialegislativa/';
    const params = new URLSearchParams();

    // Adiciona os campos obrigatórios na busca
    params.append('tipo', tipo);
    params.append('ano', ano);

    // Adiciona os campos opcionais APENAS se o usuário digitou algo
    if (numero) {
        params.append('numero', numero);
    }
    if (autor) {
        params.append('autores', autor); // Verifique se o nome exato na API é 'autor' ou 'autoria'
    }
    if (expressoes) {
        params.append('ementa__icontains', expressoes); // No padrão SAPL/Django, buscas por texto na ementa costumam usar esse formato
    }

    // A URL final ficará algo como: https://sapl.../?tipo=1&ano=2024&numero=15
    const urlCompleta = `${baseUrl}?${params.toString()}`;

    // 4. Fazer a requisição na API
    try {
        // Mostra um "Carregando..." no console ou na tela (opcional)
        console.log("Buscando dados em:", urlCompleta);

        const resposta = await fetch(urlCompleta);

        if (!resposta.ok) {
            throw new Error(`Erro na comunicação com o SAPL: ${resposta.status}`);
        }

        const dados = await resposta.json();

        // APIs do SAPL geralmente retornam os dados paginados dentro de um array chamado "results"
        const materias = dados.results || dados;

        for (const indicacao of materias){
            const idAutor = indicacao.autores[0];
            if (idAutor){
                indicacao.nomeAutorReal = await pegarNomeDoAutor(idAutor);
            } else {
                indicacao.nomeAutorReal = "Sem autor";
            }
        }

        // 5. Enviar os dados para a função que vai desenhar os cards na tela
        renderizarResultados(materias);

    } catch (erro) {
        console.error("Falha ao buscar matérias:", erro);
        alert("Houve um erro ao buscar os dados do SAPL. Tente novamente mais tarde.");
    }
}

// Função para desenhar o HTML (Os cards que você estilizou no CSS)
function renderizarResultados(materias) {


    const containerResultados = document.getElementById('lista-materias'); // Crie uma div com essa classe para receber os cards
    containerResultados.innerHTML = ''; // Limpa os resultados da busca anterior

    if (materias.length === 0) {
        containerResultados.innerHTML = '<p>Nenhuma matéria encontrada com esses filtros.</p>';
        return;
    }

    materias.forEach(materia => {
        // Monta o HTML do seu card (.caixa-sessao)

        const baixarMateria = materia.texto_original
        ? `<a href="${materia.texto_original}" target="_blank" class="btn-baixar">Baixar Matéria (PDF)</a>`
        : `<span style="color:#777; font-size:0.9em; display:inline-block;
        margin-top:10px;">(Matéria não disponível)</span>`;

        const cardHTML = `
        <div class="caixa-sessao">
        <h3>${materia.__str__ || 'Matéria sem título'}</h3>
        <p><strong>Ementa:</strong> ${materia.ementa || 'Sem ementa disponível'}</p>
        <p><strong>Data de Apresentação:</strong> ${materia.data_apresentacao || 'N/A'}</p>
        <p><strong>Autor:</strong> ${materia.nomeAutorReal}</p>
        ${baixarMateria}
        </div>
        `;
        // Adiciona o card na tela
        containerResultados.innerHTML += cardHTML;
    });
}
