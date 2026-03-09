 let paginaAtual = 1;
 let anoPesquisado = "";


 function escaparHTML(texto) {

     if (!texto) return "";
     return texto.toString()
     .replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;")
     .replace(/'/g, "&#039;");
 }

 document.addEventListener('DOMContentLoaded', () => {

     const selectAno = document.getElementById('ano-ata');

     const anoAtual = new Date().getFullYear();

     const anoInicial = 2023;


     for (let ano = anoAtual; ano >= anoInicial; ano--) {

         const novaOpcao = document.createElement('option');
         novaOpcao.value = ano;
         novaOpcao.textContent = ano;
         selectAno.appendChild(novaOpcao);
     }


     selectAno.value = "";
     anoPesquisado = anoAtual;


     document.getElementById('btn-pesquisar').addEventListener('click', () => {

         const anoEscolhido = document.getElementById('ano-ata').value;


         if (anoEscolhido === "") {

             alert("Por favor, selecione um ano na lista.");

             return;

         }


         anoPesquisado = anoEscolhido;

         paginaAtual = 1; // Sempre que trocar o ano, volta para a página 1!

         carregarSessoes(anoPesquisado, paginaAtual);

     });

     document.getElementById('btn-proximo').addEventListener('click', () => {
         paginaAtual++;
         carregarSessoes(anoPesquisado, paginaAtual);

     });

     document.getElementById('btn-anterior').addEventListener('click', () => {
         if(paginaAtual > 1){
         paginaAtual--;
         carregarSessoes(anoPesquisado, paginaAtual);
         }

     }); 

 });

async function carregarSessoes(ano, pagina) {

    const url = "https://sapl.tapira.mg.leg.br/api/sessao/sessaoplenaria/";
    const params = `?data_inicio__year=${ano}&o=-data_inicio&page=${pagina}&page_size=5`;

    try {
        const response = await fetch(url + params);

        if(!response.ok){
            throw new Error("Erro na resposta da API");
        }

        const dados = await response.json();

        renderizarResultados(dados);

    } catch (erro){
        console.error("Falha ao buscar as atas:", erro);
        alert("Houve um erro ao buscar os dados do SAPL. Tente novamente mais tarde.");
    }

}

function renderizarResultados(dados){

    const btnAnterior = document.getElementById('btn-anterior');
    const btnProximo = document.getElementById('btn-proximo');
    const infoPagina = document.getElementById('info-pagina');
    const divPaginacao = document.getElementById('controles-paginacao');
    const container = document.getElementById('lista-sessoes');

    container.innerHTML = "";

    const listaMaterias = dados.results || [];

    if(listaMaterias.length === 0){

        containerResultados.innerHTML =
        containerResultados.innerHTML = `<p style="margin-top:20px;">Nenhuma matéria encontrada com esses filtros. Por favor, faça uma nova pesquisa.</p>`;

        divPaginacao.style.display="none";

        return;
    }

    try{

        dados.results.forEach(sessao => {

        const partes = sessao.data_inicio.split('-');
        const dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;

        const botaoAta = sessao.upload_ata
        ? `<a href="${sessao.upload_ata}" target="_blank" class="btn-ata">Baixar Ata (PDF)</a>`
        : `<span style="color:#777; font-size:0.9em; display:inline-block; margin-top:10px;">(Ata não disponível)</span>`;

        const htmlSessao = `
        <div class="caixa-sessao">
        <h3>${escaparHTML(sessao.__str__)}</h3>
        <p><strong>Data:</strong> ${dataFormatada}</p>
        ${botaoAta}
        </div>
        `;

        container.innerHTML += htmlSessao;
    });

    // Atualiza paginação com base no backend
    btnAnterior.disabled = (dados.pagination.links.previous === null);
    btnProximo.disabled = (dados.pagination.links.next === null);

    btnAnterior.style.opacity = btnAnterior.disabled ? "0.5" : "1";
    btnProximo.style.opacity = btnProximo.disabled ? "0.5" : "1";

    // Mostra número real vindo da API
    infoPagina.textContent = `Página ${dados.pagination.page} de ${dados.pagination.total_pages}`;

    divPaginacao.style.display = "flex";

    } catch (erro) {

        container.innerHTML = "<p style='color:red; margin-top:20px;'>Erro ao conectar com o SAPL.</p>";
        divPaginacao.style.display = "none";
        console.error("Houve um erro ao se conectar com o SAPL", erro);
    }
}
