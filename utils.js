Site.carregarAno = function() {

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

Site.limparFormulario = function(){
//export function limparFormulario(seletorForm) {

    var $form = $(seletorForm);

    $form.find('input:text, input:password, textarea').val('');

    $form.find('select').prop('selectedIndex', 0);

    console.log("Campos limpos");
};

export function carregarAutor() {

    const selectAutor = document.getElementById('selecao-autor');
    let urlAutor = `https://sapl.tapira.mg.leg.br/api/base/autor/?tipo=2`;
    let todosAutores = [];

    try {

        let contadorPagina = 0;

        while (urlAutor && contadorPagina <5){

            const resposta = await fetch(urlAutor);
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
