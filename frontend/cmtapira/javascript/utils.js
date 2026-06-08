
export function carregarAno() {

    var anos = document.getElementById('selecao-ano');
    var anoAtual = new Date().getFullYear();
    var anoInicial = 2023;

    for (var i=anoAtual; i >= anoInicial; i--){
        var opcao = document.createElement('option');
        opcao.innerHTML = i;
        opcao.value = i;
        anos.appendChild(opcao);
    }
};

export function forceHttps(url) {
    if (!url) return url;
    return url.replace(/^http:/, 'https:');
}

export async function carregarAutor() {

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

export function formatarDataBR(dataISO) {
    if (!dataISO) return 'N/A';
    // Divide a string 2024-05-20 em [2024, 05, 20]
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

export function escaparHTML(texto) {
    if (!texto) return "";
    return texto.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function pegarNomeDoAutor(idAutor) {
    const baseUrl = 'https://sapl.tapira.mg.leg.br/api';
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
