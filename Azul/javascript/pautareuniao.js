// Peneira de Segurança: Transforma tags HTML em texto inofensivo
function escaparHTML(texto) {
    if (!texto) return "";
    return texto.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const baseUrl = 'https://sapl.tapira.mg.leg.br/api';

            // Formata a data de YYYY-MM-DD para DD/MM/YYYY
            function formatarData(dataIso) {
                if (!dataIso) return '';
                const partes = dataIso.split('-');
                return `${partes[2]}/${partes[1]}/${partes[0]}`;
            }

            // NOVA FUNÇÃO: Busca o nome do autor pelo ID
            async function pegarNomeDoAutor(idAutor) {
                if (!idAutor) return "Sem autor";
                try {
                    const urlAutor = `${baseUrl}/base/autor/${idAutor}/`;
                    const response = await fetch(urlAutor);
                    const data = await response.json();
                    return data.nome || "Autor Desconhecido";
                } catch (erro) {
                    console.error("Erro ao buscar autor", erro);
                    return "Autor Desconhecido";
                }
            }

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

            // Função Principal
            async function buscarUltimaReuniaoCompleta() {
                const containerExpediente = document.getElementById('conteudo-expediente');
                const containerOrdemDia = document.getElementById('conteudo-ordem-dia');
                const tituloSessao = document.getElementById('titulo-sessao');
                const dataSessao = document.getElementById('data-sessao');


                try {
                    // Busca a Última Sessão
                    const resSessao = await fetch(`${baseUrl}/sessao/sessaoplenaria/?o=-data_inicio&page_size=1`);
                    const jsonSessao = await resSessao.json();

                    if (!jsonSessao.results || jsonSessao.results.length === 0) {
                        dataSessao.innerText = "Nenhuma sessão encontrada.";
                        return;
                    }

                    const ultimaSessao = jsonSessao.results[0];
                    tituloSessao.innerText = `${ultimaSessao.__str__ || ''}`;
                    dataSessao.innerText = `Realizada em: ${formatarData(ultimaSessao.data_inicio)}`;

                    containerExpediente.innerHTML = "<p><em>Buscando autores e ementas do Expediente...</em></p>";
                    containerOrdemDia.innerHTML = "<p><em>Buscando autores e ementas da Ordem do Dia...</em></p>";

                    // Busca o Expediente
                    const resExpediente = await fetch(`${baseUrl}/sessao/expedientemateria/?sessao_plenaria=${ultimaSessao.id}`);
                    const jsonExpediente = await resExpediente.json();
                    containerExpediente.innerHTML = await montarHtmlMaterias(jsonExpediente.results, "card-expediente");

                    // Busca a Ordem do Dia
                    const resPauta = await fetch(`${baseUrl}/sessao/ordemdia/?sessao_plenaria=${ultimaSessao.id}`);
                    const jsonPauta = await resPauta.json();
                    containerOrdemDia.innerHTML = await montarHtmlMaterias(jsonPauta.results, "");

                } catch (erro) {
                    console.error("Erro ao comunicar com o SAPL:", erro);
                    dataSessao.innerText = "Não foi possível carregar os dados no momento.";
                    containerExpediente.innerHTML = "";
                    containerOrdemDia.innerHTML = "<p>Tente novamente mais tarde.</p>";
                }
            }

            document.addEventListener('DOMContentLoaded', buscarUltimaReuniaoCompleta);
