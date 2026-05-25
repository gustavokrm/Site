import { formatarDataBR, pegarNomeDoAutor, escaparHTML } from './utils.js';

const baseUrl = "https://sapl.tapira.mg.leg.br/api";

// Função que monta os Cards (agora com o Autor)
async function montarHtmlMaterias(listaItens, classeCssAdicional) {
    if (!listaItens || listaItens.length === 0) {
        return "<p>Nenhuma matéria cadastrada nesta fase.</p>";
    }

    let html = "";
    for (const item of listaItens) {
        if (item.materia) {
            try {
                // 1. Busca os detalhes do projeto (texto, ementa, lista de autores)
                const resMateria = await fetch(`${baseUrl}/materia/materialegislativa/${item.materia}/`);
                const materia = await resMateria.json();

                // 2. Verifica se tem autor e busca o nome do primeiro
                let nomeAutorReal = "Sem autor";
                if (materia.autores && materia.autores.length > 0) {
                    nomeAutorReal = await pegarNomeDoAutor(materia.autores[0]);

                    // Se tiver mais de um autor, adiciona um "e outros" para ficar elegante
                    if (materia.autores.length > 1) {
                        nomeAutorReal += " e outros";
                    }
                }

                // 3. Monta o Card final com o Autor incluído
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

async function mostrarTodasSessoes() {
    const containerSessoes = document.getElementById('lista-sessoes');
    const detalhesReuniao = document.getElementById('detalhes-reuniao');

    detalhesReuniao.style.display = 'none';
    containerSessoes.style.display = 'block';
    containerSessoes.innerHTML = "<p><em>Buscando sessões...</em></p>";

    // esta função deve receber os dados da função buscarReuniao e mostrar todas as sessões encontradas, 
    // com um botão para mostrar os detalhes de cada sessão
    // o botão deve chamar a função mostraDetalhesReuniao passando os dados da sessão selecionada

    try {
        const sessoes = await buscarReuniao();
        if (!sessoes || sessoes.length === 0) {
            containerSessoes.innerHTML = "<p>Nenhuma sessão encontrada.</p>";
            return;
        }

        let html = "";
        for (let i = 0; i < sessoes.length; i++) {
            const sessao = sessoes[i];
            html += `
            <div class="caixa-sessao">
                <h3>${escaparHTML(sessao.__str__ || 'Sessão')}</h3>
                <p>Data: ${formatarDataBR(sessao.data_inicio)}</p>
                <button class="btn-ata btn-ver-detalhes" data-index="${i}"><strong>Ver detalhes</strong></button>
            </div>
            `;
        }
        containerSessoes.innerHTML = html;
        containerSessoes.querySelectorAll('.btn-ver-detalhes').forEach(button => {
            button.addEventListener('click', () => {
                const index = Number(button.dataset.index);
                mostraDetalhesReuniao(sessoes[index]);
            });
        });
    } catch (erro) {
        console.error("Erro ao buscar sessões:", erro);
        containerSessoes.innerHTML = "<p>Não foi possível carregar as sessões no momento.</p>";
    }
}   

async function mostraDetalhesReuniao(sessoes) {

    // Mostrar os detalhes da reunião e ocultar a lista
    document.getElementById('detalhes-reuniao').style.display = 'block';
    document.getElementById('lista-sessoes').style.display = 'none';

    // TODO - Essa função deve mostrar somente o resultado da sessão selecionada
    // outra função que mostra todas as reuniões deve ser feita

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
        
    // Busca o Expediente
    const resExpediente = await fetch(`${baseUrl}/sessao/expedientemateria/?sessao_plenaria=${sessoes.id}`);
    const jsonExpediente = await resExpediente.json();
    containerExpediente.innerHTML = await montarHtmlMaterias(jsonExpediente.results, "card-expediente");

    // Busca a Ordem do Dia
    const resPauta = await fetch(`${baseUrl}/sessao/ordemdia/?sessao_plenaria=${sessoes.id}`);
    const jsonPauta = await resPauta.json();
    containerOrdemDia.innerHTML = await montarHtmlMaterias(jsonPauta.results, "");
}

// Função Principal
async function buscarReuniao() {
    
    
    const tipo = document.getElementById('select-tipo').value; // 1 - Ordinária, 2 - Extraordinária, 3 - Solene
    const ano = document.getElementById('select-ano').value; // Ex: 2024
    const mes = document.getElementById('select-mes').value; // Ex: 6 para Junho
    const dia = document.getElementById('select-dia').value; // Ex: 15
    const dataSessao = document.getElementById('data-sessao');

    try {
        // Busca a Última Sessão
        const params = new URLSearchParams({
            'tipo': tipo, // 1 - Ordinária, 2 - Extraordinária, 3 - Solene
            'data_inicio__year': ano, // Ex: 2024
            'data_inicio__month': mes, // Ex: 6 para Junho
            'data_inicio__day': dia, // Ex: 15
        });

        // TODO - Buscar todas as reuniões e filtrar pelos parâmetros escolhidos (ex: tipo de reunião, ano, mês, etc).
        const resSessao = await fetch(`${baseUrl}/sessao/sessaoplenaria/?${params}`);
        const jsonSessao = await resSessao.json();

        if (!jsonSessao.results || jsonSessao.results.length === 0) {
            alert("Nenhuma sessão encontrada para os parâmetros selecionados. Tente ajustar os filtros ou limpar para mostrar todas as sessões.");
            dataSessao.innerText = "Nenhuma sessão encontrada.";
            return;
        }

        const sessoes = jsonSessao.results;        
        return sessoes;

    } catch (erro) {
        console.error("Erro ao comunicar com o SAPL:", erro);
        dataSessao.innerText = "Não foi possível carregar os dados no momento.";
        containerExpediente.innerHTML = "";
        containerOrdemDia.innerHTML = "<p>Tente novamente mais tarde.</p>";
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('btn-pesquisar').addEventListener('click', async () => {
        await mostrarTodasSessoes();
    });
    document.getElementById('btn-limpar').addEventListener('click', async () => {
        document.getElementById('select-ano').value = '';
        document.getElementById('select-mes').value = '';
        document.getElementById('select-dia').value = '';
        document.getElementById('select-tipo').value = '';
        const listaSessoes = document.getElementById('lista-sessoes');
        listaSessoes.innerHTML = '';
        listaSessoes.style.display = 'block';
        document.getElementById('detalhes-reuniao').style.display = 'none';
        document.getElementById('titulo-sessao').innerText = 'Pesquise as pautas de reunião';
    });
});
