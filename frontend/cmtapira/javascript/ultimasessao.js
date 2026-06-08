import { formatarDataBR, pegarNomeDoAutor, escaparHTML } from './utils.js';

// const baseUrl = "https://pesquisasapl.fastapicloud.dev/api";
const baseUrl = "http://127.0.0.1:8000/api"

let todasSessoes = []; // Aqui guardaremos todos os dados vindos da API
let paginaAtual = 1;
const itensPorPagina = 10; // Defina a quantidade de itens por página

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-pesquisar').addEventListener('click', () => {
        paginaAtual = 1;
        buscarReuniao(); // Agora busca na API e depois renderiza a página 1
    });
    
    document.getElementById('btn-limpar').addEventListener('click', () => {
        document.getElementById('select-ano').value = '';
        document.getElementById('select-mes').value = '';
        document.getElementById('select-dia').value = '';
        document.getElementById('select-tipo').value = '';
        const listaSessoes = document.getElementById('lista-sessoes');
        listaSessoes.innerHTML = '';
        listaSessoes.style.display = 'block';
        document.getElementById('detalhes-reuniao').style.display = 'none';
        document.getElementById('titulo-sessao').innerText = 'Pesquise as pautas de reunião';
        
        // Limpar os dados armazenados
        todasSessoes = [];
        paginaAtual = 1;
        document.getElementById('controles-paginacao').style.display = 'none';
    });
    
    document.getElementById('btn-anterior').addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            renderizarSessoes(); // Apenas renderiza os dados já salvos
        }
    });

    document.getElementById('btn-proximo').addEventListener('click', () => {
        const totalPaginas = Math.ceil(todasSessoes.length / itensPorPagina);
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            renderizarSessoes(); // Apenas renderiza os dados já salvos
        }
    });
});

async function montarHtmlMaterias(listaItens, classeCssAdicional) {
 
    if (!listaItens || listaItens.length === 0) {
        return "<p>Nenhuma matéria cadastrada nesta fase.</p>";
    }

    let html = "";
    for (const item of listaItens) {
        if (item.materia) {
            try {
                const resMateria = await fetch(`${baseUrl}/materias/pesquisar/${item.materia}/`);
                const materia = await resMateria.json();

                let nomeAutorReal = "Sem autor";
                if (materia.autores && materia.autores.length > 0) {
                    nomeAutorReal = await pegarNomeDoAutor(materia.autores[0]);
                    if (materia.autores.length > 1) {
                        nomeAutorReal += " e outros";
                    }
                }

                html += `
                <div class="card-materia ${classeCssAdicional}">
                <h3>${escaparHTML(materia.__str__ || 'Matéria')}</h3>
                <p><strong>Autor:</strong> ${escaparHTML(nomeAutorReal)}</p>
                <p><strong>Assunto:</strong> ${escaparHTML(materia.ementa) || 'Sem ementa cadastrada.'}</p>
                <p><a href="${escaparHTML(materia.texto_original)}" target="_blank" class="btn-ata"><strong>Baixar matéria</strong></a></p>
                ${item.resultado_str ? `<span class="resultado-votacao">Resultado: ${item.resultado_str}</span>` : ''}
                </div>
                `;
            } catch (e) {
                console.error("Erro ao buscar detalhes da matéria:", e);
            }
        }
    }
    return html;
}


async function buscarReuniao() {
    const containerExpediente = document.getElementById('conteudo-expediente');
    const containerOrdemDia = document.getElementById('conteudo-ordem-dia');
    const tipo = document.getElementById('select-tipo').value;
    const ano = document.getElementById('select-ano').value;
    const mes = document.getElementById('select-mes').value;
    const dia = document.getElementById('select-dia').value;
    const dataSessao = document.getElementById('data-sessao');
    const containerSessoes = document.getElementById('lista-sessoes');
    const detalhesReuniao = document.getElementById('detalhes-reuniao');

    detalhesReuniao.style.display = 'none';
    containerSessoes.style.display = 'block';
    containerSessoes.innerHTML = "<p><em>Buscando sessões...</em></p>";

    try {
        // Removemos o 'page' dos parâmetros, assumindo que a API traz tudo 
        // ou traz tudo filtrado pelos parâmetros abaixo
        const params = new URLSearchParams({
            'tipo': tipo,
            'ano': ano,
            'mes': mes,
            'dia': dia
        });
        
        const resSessao = await fetch(`${baseUrl}/pautas/pesquisar/?${params}`);
        const jsonSessao = await resSessao.json();

        // Salva todos os resultados no array global
        todasSessoes = jsonSessao.results || [];

        if (todasSessoes.length === 0) {
            alert("Nenhuma sessão encontrada para os parâmetros selecionados.");
            dataSessao.innerText = "Nenhuma sessão encontrada.";
            document.getElementById('controles-paginacao').style.display = "none";
            containerSessoes.innerHTML = "";
            return;
        }

        // Após buscar tudo, chamamos a função que corta e desenha na tela
        renderizarSessoes();

    } catch (erro) {
        console.error("Erro ao comunicar com o SAPL:", erro);
        dataSessao.innerText = "Não foi possível carregar os dados no momento.";
        if (containerExpediente) containerExpediente.innerHTML = "";
        if (containerOrdemDia) containerOrdemDia.innerHTML = "<p>Tente novamente mais tarde.</p>";
    }
}

// 2. Função para PEGAR 10 ITENS do array e desenhar na tela (Paginação Local)
function renderizarSessoes() {
    const containerSessoes = document.getElementById('lista-sessoes');
    const btnAnterior = document.getElementById('btn-anterior');
    const btnProximo = document.getElementById('btn-proximo');
    const infoPagina = document.getElementById('info-pagina');
    const divPaginacao = document.getElementById('controles-paginacao');

    // Lógica do SLICE para pegar apenas os 10 resultados da página atual
    const indiceInicio = (paginaAtual - 1) * itensPorPagina;
    const indiceFim = indiceInicio + itensPorPagina;
    const sessoesDaPagina = todasSessoes.slice(indiceInicio, indiceFim);

    // Montar o HTML apenas com as sessões daquela página
    let html = "";
    for (let i = 0; i < sessoesDaPagina.length; i++) {
        const sessao = sessoesDaPagina[i];
        html += `
        <div class="caixa-sessao">
            <h3>${escaparHTML(sessao.__str__ || 'Sessão')}</h3>
            <p>Data: ${formatarDataBR(sessao.data_inicio)}</p>
            <button class="btn-ata btn-ver-detalhes" data-index="${i}"><strong>Ver detalhes</strong></button>
        </div>
        `;
    }
    
    containerSessoes.innerHTML = html;

    // Adiciona o evento de clique nos botões usando as sessões *da página atual*
    containerSessoes.querySelectorAll('.btn-ver-detalhes').forEach(button => {
        button.addEventListener('click', () => {
            const index = Number(button.dataset.index);
            mostraDetalhesReuniao(sessoesDaPagina[index]);
            document.getElementById('controles-paginacao').style.display = 'none';
        });
    });
    
    // Atualiza o estado dos botões de paginação
    if (btnAnterior && btnProximo) {
        const totalPaginas = Math.ceil(todasSessoes.length / itensPorPagina);
        
        btnAnterior.disabled = paginaAtual === 1;
        btnProximo.disabled = paginaAtual >= totalPaginas;
        
        btnAnterior.style.opacity = btnAnterior.disabled ? "0.5" : "1";
        btnProximo.style.opacity = btnProximo.disabled ? "0.5" : "1";
    }

    if (infoPagina) {
        const totalPaginas = Math.ceil(todasSessoes.length / itensPorPagina);
        infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas || 1}`;
    }
    
    divPaginacao.style.display = "flex";
}

async function mostraDetalhesReuniao(sessoes) {
    
    document.getElementById('detalhes-reuniao').style.display = 'block';
    document.getElementById('lista-sessoes').style.display = 'none';

    const containerExpediente = document.getElementById('conteudo-expediente');
    const containerOrdemDia = document.getElementById('conteudo-ordem-dia');
    const tituloSessao = document.getElementById('titulo-sessao');
    const dataSessao = document.getElementById('data-sessao');
    const baixarSessao = document.getElementById('impressao-pauta');

    tituloSessao.innerText = `${sessoes.__str__ || ''}`;
    dataSessao.innerText = `Realizada em: ${formatarDataBR(sessoes.data_inicio)}`;

    containerExpediente.innerHTML = "<p><em>Buscando autores e ementas do Expediente...</em></p>";
    containerOrdemDia.innerHTML = "<p><em>Buscando autores e ementas da Ordem do Dia...</em></p>";
        
    baixarSessao.innerHTML = `<a href="https://sapl.tapira.mg.leg.br/sessao/pauta-sessao/${sessoes.id}/pdf" class="btn-ata"><strong>Impressão da pauta em PDF</strong></a>`;
        
    const resExpediente = await fetch(`${baseUrl}/pautas/expediente/?sessao_id=${sessoes.id}`);
    const jsonExpediente = await resExpediente.json();
    containerExpediente.innerHTML = await montarHtmlMaterias(jsonExpediente, "card-expediente");

    const resPauta = await fetch(`${baseUrl}/pautas/ordemdodia/?sessao_id=${sessoes.id}`);
    const jsonPauta = await resPauta.json();
    containerOrdemDia.innerHTML = await montarHtmlMaterias(jsonPauta, "");
}
