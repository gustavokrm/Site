document.addEventListener('DOMContentLoaded', carregarSessoes);

async function carregarSessoes() {
    const url = "https://sapl.tapira.mg.leg.br/api/sessao/sessaoplenaria/";
    // Ordena por data (decrescente) e pega as 5 últimas
    const params = "?data_fim__year=2026&data_inicio__year=2026";
    const container = document.getElementById('lista-sessoes');


    try {
        const response = await fetch(url + params);
        const data = await response.json();

        // Limpa o "Carregando..."
        container.innerHTML = "";

        // Para cada sessão encontrada...
        data.results.forEach(sessao => {
            // Formata a data (de 2024-02-15 para 15/02/2024)
            const dataFormatada = new Date(sessao.data_inicio).toLocaleDateString('pt-BR');

            // Faz o botão ficar 'vazio'
            let botaoAta = "";

            // Lógica simples: se tiver url, cria o botão.
            if (sessao.upload_ata) {
                botaoAta = `<a href="${sessao.upload_ata}" target="_blank" class="btn-ata"> Baixar Ata (PDF)</a>`;
            } else {
                botaoAta = `<span style="color: #777; font-size: 0.9em;">(Ata não disponível)</span>`;
            }

            const htmlSessao = `
            <div class="caixa-sessao">
            <h3>${sessao.__str__}</h3>
            <p><strong>Data:</strong> ${dataFormatada}</p>
            ${botaoAta}
            </div>
            `;

            container.innerHTML += htmlSessao;
        });

    } catch (erro) {
        console.error(erro);
        container.innerHTML = "<p>Erro ao carregar sessões. Tente recarregar a página.</p>";
    }

}


