import { escaparHTML } from './utils.js'; 
 
let paginaAtual = 1;
let anoPesquisado = "";

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

         anoPesquisado = anoEscolhido;

         paginaAtual = 1;

         carregarSessoes(anoPesquisado, paginaAtual);

     });

	document.getElementById('btn-limpar').addEventListener('click', () => {
		document.getElementById('ano-ata').value = "";
		document.getElementById('select-mes').value = "";
		document.getElementById('select-dia').value = "";
		document.getElementById('select-tipo').value = "";
		document.getElementById('lista-sessoes').innerHTML = "";
		document.getElementById('controles-paginacao').style.display = "none";
		const infoPagina = document.getElementById('info-pagina');
		if (infoPagina) infoPagina.textContent = "Página 1";

		paginaAtual = 1;
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

async function carregarSessoes(ano, page) {


    const url = 'https://pesquisasapl.fastapicloud.dev/api/atas';     
    const tipo = document.getElementById('select-tipo').value;    
    const mes = document.getElementById('select-mes').value;
    const dia = document.getElementById('select-dia').value;

    try {
                   
        if(!tipo || !ano) {
            alert("Por favor, preencha os campos obrigatórios: tipo de reunião e ano!");
            return;
        }
        
        const params = new URLSearchParams({
            ano: ano,
            page: page
        });
        
        if (tipo) params.append('tipo', tipo);
        if (mes) params.append('mes', mes);
        if (dia) params.append('dia', dia);
        
        const response = await fetch(`${url}?${params.toString()}`);

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

        container.innerHTML =
        container.innerHTML = `<p style="margin-top:20px;">Nenhuma matéria encontrada com esses filtros. Por favor, faça uma nova pesquisa.</p>`;

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
    if (infoPagina) {
        infoPagina.textContent = `Página ${paginaAtual}`;
    }

    const pagination = dados.pagination || {};
    const links = pagination.links || {};

    btnAnterior.disabled = (links.previous === null || links.previous === undefined);
    btnProximo.disabled = (links.next === null || links.next === undefined);

    btnAnterior.style.opacity = btnAnterior.disabled ? "0.5" : "1";
    btnProximo.style.opacity = btnProximo.disabled ? "0.5" : "1";

    infoPagina.textContent = `Página ${pagination.page || 1} de ${pagination.total_pages || 1}`;
    divPaginacao.style.display = "flex";
    
    } catch (erro) {

        container.innerHTML = "<p style='color:red; margin-top:20px;'>Erro ao conectar com o servidor.</p>";
        divPaginacao.style.display = "none";
        console.error("Houve um erro ao se conectar com o servidor", erro);
    }
}
