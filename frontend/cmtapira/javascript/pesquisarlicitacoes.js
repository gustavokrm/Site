// Variáveis de Estado
let currentPage = 1;
let currentDataList = []; // Guarda os dados da página atual para filtrar e exportar
let filteredDataList = []; // Guarda os dados após o filtro de texto

// Constantes
const API_BASE_URL = 'https://transparencia.tapira.mg.leg.br/publico/contrato/buscarDadosAbertos';

document.addEventListener('DOMContentLoaded', () => {
    // Referências do DOM
    const inputTexto = document.getElementById('input-texto');
    const inputDataInicio = document.getElementById('data-inicio');
    const inputDataFim = document.getElementById('data-fim');
    
    const btnPesquisar = document.getElementById('btn-pesquisar');
    const btnLimpar = document.getElementById('btn-limpar');
    
    const btnAnterior = document.getElementById('btn-anterior');
    const btnProximo = document.getElementById('btn-proximo');
    const infoPagina = document.getElementById('info-pagina');
    
    const listaSessoes = document.getElementById('lista-sessoes');
    const controlesPaginacao = document.getElementById('controles-paginacao');
    const controlesExportacao = document.getElementById('controles-exportacao');
    
    const qtdVigentes = document.getElementById('qtd-vigentes');
    const qtdNaoVigentes = document.getElementById('qtd-nao-vigentes');

    const btnExportJson = document.getElementById('btn-export-json');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnExportHtml = document.getElementById('btn-export-html');

    // Máscara simples para data DD/MM/AAAA
    const mascaraData = (e) => {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length >= 5) v = v.replace(/^(\d{2})(\d{2})(\d{1,4}).*/, "$1/$2/$3");
        else if (v.length >= 3) v = v.replace(/^(\d{2})(\d{1,2}).*/, "$1/$2");
        e.target.value = v;
    };
    inputDataInicio.addEventListener('input', mascaraData);
    inputDataFim.addEventListener('input', mascaraData);

    // Converte DD/MM/AAAA para AAAA-MM-DD (Padrão ISO requerido pela API)
    const converterDataParaISO = (dataPtBr) => {
        if (!dataPtBr || dataPtBr.length !== 10) return null;
        const partes = dataPtBr.split('/');
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
    };

    // Formata valor financeiro para BRL
    const formatarMoeda = (valor) => {
        if (valor === null || valor === undefined) return 'Não informado';
        return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Dispara a busca
    const realizarBusca = async (pagina = 1) => {
        const strInicio = converterDataParaISO(inputDataInicio.value);
        const strFim = converterDataParaISO(inputDataFim.value);

        // 1. Verifica se os campos estão vazios ou incompletos
        if (!strInicio || !strFim || strInicio.includes('undefined') || strFim.includes('undefined')) {
            alert("Por favor, preencha as datas de Início e Fim no formato correto (DD/MM/AAAA).");
            return;
        }

        const dataObjInicio = new Date(`${strInicio}T00:00:00`);
        const dataObjFim = new Date(`${strFim}T00:00:00`);

        // 2. Verifica se a data é inválida (ex: 30/02/2026)
        if (isNaN(dataObjInicio.getTime()) || isNaN(dataObjFim.getTime())) {
            alert("Data inválida fornecida.");
            return;
        }

        // 3. Verifica se a data de início é maior que a do fim
        if (dataObjInicio > dataObjFim) {
            alert("A data inicial não pode ser maior que a data final.");
            return;
        }

        currentPage = pagina;
        listaSessoes.innerHTML = '<tr><td colspan="8" style="text-align:center;">Buscando dados na API...</td></tr>';

        try {
            // Monta a URL consumindo o Swagger demonstrado
            const url = `${API_BASE_URL}?pagina=${currentPage}&Data%20de%20In%C3%ADcio%20da%20Assinatura=${strInicio}&Data%20de%20Fim%20da%20Assinatura=${strFim}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error("Erro de comunicação com a API");
            
            const rawData = await response.json();
            
            // APIs frequentemente encapsulam os dados em 'content' ou 'data'.
            // Verificamos qual é o formato retornado (array direto ou objeto encapsulado)
            const arrayDados = Array.isArray(rawData) ? rawData : (rawData.content || rawData.data || []);

            currentDataList = arrayDados;
            aplicarFiltroEmMemoria(); // Aplica texto se houver e renderiza

            // Atualiza controles de paginação
            controlesPaginacao.style.display = 'flex';
            infoPagina.textContent = `Página ${currentPage}`;
            btnAnterior.disabled = currentPage <= 1;
            
            // Lógica simples: se trouxe menos de 10/20 (tamanho padrão), provavelmente é a última página.
            // O Swagger geralmente retorna um booleano "last" em objetos pageables do Spring Boot.
            if (rawData.last !== undefined) {
                btnProximo.disabled = rawData.last;
            } else {
                btnProximo.disabled = arrayDados.length === 0; 
            }

            controlesExportacao.style.display = 'flex';

        } catch (error) {
            console.error("Erro ao buscar dados:", error);
            listaSessoes.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red;">Erro ao tentar buscar os dados. Tente novamente mais tarde.</td></tr>';
        }
    };

    // Aplica o filtro de texto aos dados já paginados da API
    const aplicarFiltroEmMemoria = () => {
        const termo = inputTexto.value.toLowerCase().trim();
        
        if (!termo) {
            filteredDataList = [...currentDataList];
        } else {
            filteredDataList = currentDataList.filter(item => {
                const numContrato = (item.getNumeroContratoEAno || '').toLowerCase();
                const fornecedor = (item.getFornecedorFormatado || '').toLowerCase();
                const objeto = (item.desObjeto || '').toLowerCase();
                return numContrato.includes(termo) || fornecedor.includes(termo) || objeto.includes(termo);
            });
        }
        
        renderizarTabela();
    };

    // Renderiza o HTML da tabela
    const renderizarTabela = () => {
        listaSessoes.innerHTML = '';
        let vigentes = 0;
        let naoVigentes = 0;

        if (filteredDataList.length === 0) {
            listaSessoes.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum contrato encontrado para estes filtros.</td></tr>';
            qtdVigentes.textContent = '0';
            qtdNaoVigentes.textContent = '0';
            return;
        }

        filteredDataList.forEach(item => {
            // Contabiliza vigência com base no indSituacao
            const situacao = (item.indSituacao || '').trim();
            if (situacao.toLowerCase() === 'vigente') {
                vigentes++;
            } else {
                naoVigentes++;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.getNumeroContratoEAno || '-'}</td>
                <td>${item.getNumeroProcessoEAno || '-'}</td>
                <td>${item.datAssinatura || '-'}</td>
                <td>${item.datVencimento || '-'}</td>
                <td>${formatarMoeda(item.vlrContratado)}</td>
                <td>${item.getFornecedorFormatado || '-'}</td>
                <td>${item.desObjeto || '-'}</td>
                <td>${situacao || '-'}</td>
            `;
            listaSessoes.appendChild(tr);
        });

        // Atualiza contadores
        qtdVigentes.textContent = vigentes;
        qtdNaoVigentes.textContent = naoVigentes;
    };

    // --- FUNÇÕES DE EXPORTAÇÃO ---
    const triggerDownload = (content, fileName, mimeType) => {
        const a = document.createElement('a');
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        a.setAttribute('href', url);
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const exportarJSON = () => {
        triggerDownload(JSON.stringify(filteredDataList, null, 2), 'licitacoes.json', 'application/json');
    };

    const exportarCSV = () => {
        const headers = ['Contrato', 'Processo', 'Data Assinatura', 'Vencimento', 'Valor Contratado', 'Fornecedor', 'Objeto', 'Situacao'];
        const rows = [headers.join(',')];

        filteredDataList.forEach(item => {
            const linha = [
                item.getNumeroContratoEAno || '',
                item.getNumeroProcessoEAno || '',
                item.datAssinatura || '',
                item.datVencimento || '',
                item.vlrContratado || '',
                `"${(item.getFornecedorFormatado || '').replace(/"/g, '""')}"`, // Escapa aspas
                `"${(item.desObjeto || '').replace(/"/g, '""')}"`,
                item.indSituacao || ''
            ];
            rows.push(linha.join(','));
        });

        // Adiciona BOM para o Excel ler o UTF-8 corretamente
        const csvContent = "\uFEFF" + rows.join('\n');
        triggerDownload(csvContent, 'licitacoes.csv', 'text/csv;charset=utf-8;');
    };

    const exportarHTML = () => {
        let htmlStr = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><title>Exportação Licitações</title><style>table{border-collapse: collapse; width:100%;} th,td{border:1px solid #000; padding:8px;}</style></head><body>`;
        htmlStr += `<h2>Relatório de Licitações - Portal Transparência</h2>`;
        htmlStr += `<table><thead><tr><th>Contrato</th><th>Processo</th><th>Assinatura</th><th>Vencimento</th><th>Valor</th><th>Fornecedor</th><th>Objeto</th><th>Situação</th></tr></thead><tbody>`;
        
        filteredDataList.forEach(item => {
            htmlStr += `<tr>
                <td>${item.getNumeroContratoEAno || ''}</td>
                <td>${item.getNumeroProcessoEAno || ''}</td>
                <td>${item.datAssinatura || ''}</td>
                <td>${item.datVencimento || ''}</td>
                <td>${formatarMoeda(item.vlrContratado)}</td>
                <td>${item.getFornecedorFormatado || ''}</td>
                <td>${item.desObjeto || ''}</td>
                <td>${item.indSituacao || ''}</td>
            </tr>`;
        });

        htmlStr += `</tbody></table></body></html>`;
        triggerDownload(htmlStr, 'licitacoes.html', 'text/html;charset=utf-8;');
    };

    // --- EVENT LISTENERS ---
    btnPesquisar.addEventListener('click', () => realizarBusca(1));
    
    // O input de texto filtra os dados "on-the-fly" da página atual carregada
    inputTexto.addEventListener('input', aplicarFiltroEmMemoria);

    btnLimpar.addEventListener('click', () => {
        inputTexto.value = '';
        inputDataInicio.value = '';
        inputDataFim.value = '';
        listaSessoes.innerHTML = '<tr><td colspan="8" style="text-align:center;">Preencha as datas e clique em "Pesquisar na API" para buscar os dados.</td></tr>';
        controlesPaginacao.style.display = 'none';
        controlesExportacao.style.display = 'none';
        qtdVigentes.textContent = '0';
        qtdNaoVigentes.textContent = '0';
        currentDataList = [];
        filteredDataList = [];
    });

    btnAnterior.addEventListener('click', () => {
        if (currentPage > 1) realizarBusca(currentPage - 1);
    });

    btnProximo.addEventListener('click', () => {
        realizarBusca(currentPage + 1);
    });

    // Botões de exportação
    btnExportJson.addEventListener('click', exportarJSON);
    btnExportCsv.addEventListener('click', exportarCSV);
    btnExportHtml.addEventListener('click', exportarHTML);
});
