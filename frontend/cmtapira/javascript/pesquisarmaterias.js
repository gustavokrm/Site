
const URL_BACKEND = 'https://pesquisasapl.fastapicloud.dev/api/materias';

let paginaAtual = 1;

document.addEventListener('DOMContentLoaded', () => {
    const selectAno = document.getElementById('selecao-ano');
    const anoAtual = new Date().getFullYear();
    const anoInicial = 2021;

    // Popula o select de anos dinamicamente
    for (let ano = anoAtual; ano >= anoInicial; ano--) {
        const novaOpcao = document.createElement('option');
        novaOpcao.value = ano;
        novaOpcao.textContent = ano;
        selectAno.appendChild(novaOpcao);
    }

    selectAno.value = "";
    let anoPesquisado = anoAtual;

 
    carregarTiposMateria();
    carregarAutor();

    // Eventos dos botões
    document.getElementById('btn-pesquisar').addEventListener('click', () => {
        paginaAtual = 1;
        pesquisaMateria(paginaAtual);
    });

    document.getElementById('btn-proximo').addEventListener('click', () => {
        paginaAtual++;
        pesquisaMateria(paginaAtual);
    });

    document.getElementById('btn-anterior').addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            pesquisaMateria(paginaAtual);
        }
    });

    document.getElementById('btn-limpar').addEventListener('click', () => {
        // Limpa todos os campos
        document.getElementById('tipo-materia').value = "";
        document.getElementById('selecao-ano').value = "";
        document.getElementById('numero-materia').value = "";
        document.getElementById('selecao-autor').value = "";
        document.getElementById('pesquisar-expressoes').value = "";

        // Limpa os resultados e paginação da tela
        document.getElementById('lista-sessoes').innerHTML = "";
        document.getElementById('controles-paginacao').style.display = "none";
        
        const infoPagina = document.getElementById('info-pagina');
        if (infoPagina) infoPagina.textContent = "Página 1";
        
        paginaAtual = 1;
    });
});


async function carregarTiposMateria() {
    const selectTipo = document.getElementById('tipo-materia');
    let urlTiposSapl = `${URL_BACKEND}/tipos`; // URL do seu backend local que busca os tipos do SAPL
    let todosTipos = [];

    try {
    
            const resposta = await fetch(`${URL_BACKEND}/tipos`);
            if(!resposta.ok) throw new Error(`Erro: ${resposta.status}`);
            const todosTipos = await resposta.json();
            
        }

        todosTipos.forEach(tipo => {
            const opcaoHTML = document.createElement('option');
            opcaoHTML.value = tipo.id;
            opcaoHTML.textContent = tipo.descricao || tipo.nome;
            selectTipo.appendChild(opcaoHTML);
        });
    } catch (erro) {
        console.error("Falha ao carregar os tipos de matéria:", erro);
    }
}


async function carregarAutor() {
    const selectAutor = document.getElementById('selecao-autor');
    try {
        const resposta = await fetch(`${URL_BACKEND}/autores`);
        if (!resposta.ok) throw new Error("Erro ao buscar autores do servidor local.");

        const todosAutores = await resposta.json();

        todosAutores.forEach(autor => {
            const opcaoHTML = document.createElement('option');
            opcaoHTML.value = autor.id;
            opcaoHTML.textContent = autor.nome;
            selectAutor.appendChild(opcaoHTML);
        });
    } catch (erro) {
        console.error("Falha ao carregar os autores no seletor:", erro);
    }
}


async function pesquisaMateria(pagina) {
    const tipo = document.getElementById('tipo-materia').value.trim();
    const ano = document.getElementById('selecao-ano').value.trim();
    const numero = document.getElementById('numero-materia').value.trim();
    const autor = document.getElementById('selecao-autor').value;
    const expressoes = document.getElementById('pesquisar-expressoes').value.trim();

    if (!tipo || !ano) {
        alert("Por favor, preencha os campos obrigatórios: Tipo e Ano.");
        return;
    }

    
    const params = new URLSearchParams({
        tipo: tipo,
        ano: ano,
        page: pagina
    });

    if (numero) params.append('numero', numero);
    if (autor) params.append('autor', autor);
    if (expressoes) params.append('expressoes', expressoes);

    try {
        const containerResultados = document.getElementById('lista-sessoes');
        containerResultados.innerHTML = '<p style="margin-top:20px;">Buscando dados...</p>';

        const resposta = await fetch(`${URL_BACKEND}/pesquisar?${params.toString()}`);
        if (!resposta.ok) throw new Error("Erro na comunicação com o servidor Python.");
       
        const dados = await resposta.json();
        
        // Renderiza os resultados recebidos
        renderizarResultados(dados);

    } catch (erro) {
        console.error("Falha ao buscar matérias:", erro);
        alert("Houve um erro ao buscar os dados. Tente novamente mais tarde.");
    }
}


function renderizarResultados(dados) {
    const btnAnterior = document.getElementById('btn-anterior');
    const btnProximo = document.getElementById('btn-proximo');
    const infoPagina = document.getElementById('info-pagina');
    const divPaginacao = document.getElementById('controles-paginacao');
    const containerResultados = document.getElementById('lista-sessoes');
    
    containerResultados.innerHTML = ''; // Limpa a busca anterior
    const listaMaterias = dados.results || [];

    if (listaMaterias.length === 0) {
        containerResultados.innerHTML = `<p style="margin-top:20px;">Nenhuma matéria encontrada com esses filtros. Por favor, faça uma nova pesquisa.</p>`;
        divPaginacao.style.display = "none";
        return;
    }

    listaMaterias.forEach(materia => {
        
        const dataFormatada = materia.data_apresentacao_formatada || 'N/A';
        const nomeAutor = materia.nomeAutorReal || 'Sem autor';
        const statusTramitacao = materia.status || 'Sem tramitação';
        const textoAcao = materia.texto_completo || 'Sem texto informativo';

        const baixarMateria = materia.texto_original
            ? `<a title="Baixe a matéria em PDF" href="${materia.texto_original}" target="_blank" class="btn-baixar">Baixar Matéria (PDF)</a>`
            : `<span style="color:#777; font-size:0.9em; display:inline-block; margin-top:10px;">(Matéria não disponível)</span>`;

        // Monta os links dos anexos (documentos acessórios)
        let documentosHTML = '';
        const docs = materia.documentos_accessorios || [];
        
        if (docs.length > 0) {
            docs.forEach((doc, index) => {
                const urlArquivo = doc.arquivo;
                if (urlArquivo && urlArquivo.startsWith('http')) {
                    documentosHTML += `
                        <a title="Documentos anexados à matéria." href="${urlArquivo}" target="_blank" class="btn-anexos" style="color:white;">
                            Baixar Anexo ${index + 1}
                        </a>`;
                }
            });
        }
        
        if (!documentosHTML) {
            documentosHTML = `<span class="btn-indisponivel" title="Não foi anexado nenhum documento" style="color:white; font-size:0.9em; display:inline-block; margin-top:10px;">(Documento acessório não disponível)</span>`;
        }
        
        const idMateria = materia.id || Math.floor(Math.random() * 100000);
       
        const cardHTML = `<div class="caixa-sessao">
        <h3>${materia.__str__ || 'Matéria sem título'}</h3>
        <p title="Qual o assunto da matéria"><strong>Ementa:</strong> ${materia.ementa || 'Sem ementa disponível'}</p>
        <p title="Quando a matéria foi apresentada em plenário"><strong>Data de Apresentação:</strong> ${dataFormatada} </p>
        <p title="Quem é o vereador que a criou"><strong>Autor:</strong> ${nomeAutor}</p>
        <p title="Qual o estado atual da matéria?"><strong>Status de tramitação:</strong> ${statusTramitacao}</p>
        
        <div id="conteudo-acao-${idMateria}" class="container-texto-acao">
            <p title="Texto que indica o que aconteceu com a matéria"><strong>Texto da ação:</strong> ${textoAcao}</p> 
            
            <div class="bloco-anexos-escondidos" style="margin-top: 15px;">
                <strong style="display: block; margin-bottom: 8px; color: #222; font-size: 0.95em;">Documentos Acessórios:</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${documentosHTML}
                </div>
            </div>
        </div>
        
        <div class="botoes-acao">
            ${baixarMateria}
            
            <button type="button" class="btn-detalhes" onclick="alternarTextoAcao(${idMateria})" title="Mostra ou esconde detalhes e anexos">
                👁️‍🗨️ Visualizar detalhes
            </button>
        </div>
    </div>
`;
            
        containerResultados.innerHTML += cardHTML;
    });

   
    const pagination = dados.pagination || {};
    const links = pagination.links || {};

    btnAnterior.disabled = (links.previous === null || links.previous === undefined);
    btnProximo.disabled = (links.next === null || links.next === undefined);

    btnAnterior.style.opacity = btnAnterior.disabled ? "0.5" : "1";
    btnProximo.style.opacity = btnProximo.disabled ? "0.5" : "1";

    infoPagina.textContent = `Página ${pagination.page || 1} de ${pagination.total_pages || 1}`;
    divPaginacao.style.display = "flex";
}

window.alternarTextoAcao = function(id) {
    const container = document.getElementById(`conteudo-acao-${id}`);
    
    if(container){
        container.classList.toggle('aberto');
        
        const botao = container.parentElement.querySelector('.btn-detalhes');
        if(container.classList.contains('aberto')){
            botao.innerHTML = '👁️‍🗨️ Ocultar detalhes';
        } else {
            botao.innerHTML = '👁️‍🗨️ Visualizar detalhes';
        }
        }
    }

