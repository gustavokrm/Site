var MeuPortal = MeuPortal || {};

MeuPortal.helpers = {

    // Peneira de Segurança: Transforma tags HTML em texto inofensivo
    escaparHTML: function(texto) {
        if (!texto) return "";
        return texto.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    //Busca o nome do autor pelo ID
    pegarNomeDoAutor: async function (idAutor) {
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

    // Função que lida com o ano -- reescrever para aproveitá-la como função em outros lugares

    popularAno: function(){
        const selectAno = document.getElementById('ano-ata');
        const anoAtual = new Date().getFullYear();
        const anoInicial = 2023;

        for (let ano = anoAtual; ano >= anoInicial; ano --){
            const novaOpcao = document.createElement('option');
            novaOpcao.value = ano;
            novaOpcao.textContent = ano;
            selectAno.appendChild(novaOpcao);
        }

        selectAno.value = "";
        anoPesquisado = anoAtual;
    }

    exibirAlerta: function(msg){
        alert(msg);
    }

};


