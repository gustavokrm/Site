// baseado no trabalho de JeversonUNIX

const SAPL_HOST = 'https://sapl.tapira.mg.leg.br';

window.abrirModalParlamentar = async function(id) {
    const modal = document.getElementById('modal-vereador');
    const containerConteudo = document.getElementById('modal-conteudo');

    modal.classList.add('ativo');
    containerConteudo.innerHTML = '<div class="loading-status">Carregando detalhes do parlamentar...</div>';

    try {
        const response = await fetch(`${SAPL_HOST}/api/parlamentares/parlamentar/${id}/`);
        if (!response.ok) throw new Error('Erro ao buscar dados do parlamentar.');

        const p = await response.json();

        let fotoUrl = p.fotografia;
        if (fotoUrl && !fotoUrl.startsWith('http')) {
            fotoUrl = SAPL_HOST + fotoUrl;
        } else if (!fotoUrl) {
            fotoUrl = `${SAPL_HOST}/static/img/user.png`;
        }

        const nomeCompleto = p.nome_completo || 'Não informado';

        let sexoTexto = 'Não informado';
        if (p.sexo === 'M') sexoTexto = 'Masculino';
        else if (p.sexo === 'F') sexoTexto = 'Feminino';

        const celular = p.telefone_celular || p.telefone || 'Não informado';
        const email = p.email || 'Não informado';
        const biografia = p.biografia || 'Biografia não informada.';

        containerConteudo.innerHTML = `
        <div class="modal-header">
        <img class="modal-foto" src="${fotoUrl}" alt="Foto de ${nomeCompleto}" />
        <div class="modal-info-basica">
        <h2>${nomeCompleto}</h2>
        <p><strong>Sexo:</strong> ${sexoTexto}</p>
        <p><strong>Telefone Celular:</strong> ${celular}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        </div>
        </div>
        <div class="modal-biografia">
        <h3>Biografia</h3>
        <div class="modal-biografia-texto">${biografia}</div>
        </div>
        `;
    } catch (erro) {
        console.error('Erro ao carregar detalhes:', erro);
        containerConteudo.innerHTML = '<div class="loading-status" style="color: #d9534f;">Não foi possível carregar as informações do parlamentar.</div>';
    }
};

function fecharModal() {
    document.getElementById('modal-vereador').classList.remove('ativo');
}

async function carregarVereadoresSapl() {
    const container = document.getElementById('lista-vereadores-api');

    try {
        const reqLeg = await fetch(`${SAPL_HOST}/api/parlamentares/legislatura/`);
        const resLegislatura = await reqLeg.json();
        const idLegislaturaAtual = resLegislatura.results[0].id;

        const reqMesa = await fetch(`${SAPL_HOST}/api/parlamentares/mesadiretora/`);
        const resMesas = await reqMesa.json();

        const mesasAtuais = resMesas.results.filter(m => m.__str__.includes('(Atual)'));
        const mesaAtual = mesasAtuais.length > 0 ? mesasAtuais.reduce((prev, current) => (prev.id > current.id) ? prev : current) : null;
        const idMesaAtual = mesaAtual ? mesaAtual.id : null;

        const mapaMesa = {};
        if (idMesaAtual) {
            const reqComp = await fetch(`${SAPL_HOST}/api/parlamentares/composicaomesa/?mesa_diretora=${idMesaAtual}`);
            const resComposicao = await reqComp.json();

            resComposicao.results.forEach(comp => {
                const partes = comp.__str__.split(' - ');
                const nomeCargo = partes.length > 1 ? partes[1] : "Membro da Mesa";
                mapaMesa[comp.parlamentar] = {
                    cargo: nomeCargo,
                    ordem: comp.cargo
                };
            });
        }

        const reqParlamentares = await fetch(`${SAPL_HOST}/api/parlamentares/legislatura/${idLegislaturaAtual}/parlamentares/?ativo=True`);
        const resParlamentares = await reqParlamentares.json();
        const vereadores = resParlamentares.results ? resParlamentares.results : resParlamentares;

        vereadores.forEach(v => {
            if (mapaMesa[v.id]) {
                v.cargoMesa = mapaMesa[v.id].cargo;
                v.ordemMesa = mapaMesa[v.id].ordem;
            } else {
                v.cargoMesa = null;
                v.ordemMesa = 999;
            }
        });

        vereadores.sort((a, b) => {
            if (a.ordemMesa !== b.ordemMesa) {
                return a.ordemMesa - b.ordemMesa;
            }
            const nomeA = a.nome_parlamentar || a.nome_completo;
            const nomeB = b.nome_parlamentar || b.nome_completo;
            return nomeA.localeCompare(nomeB);
        });

        let htmlCards = '';
        vereadores.forEach(p => {
            let fotoUrl = p.fotografia;
            if (fotoUrl && !fotoUrl.startsWith('http')) {
                fotoUrl = SAPL_HOST + fotoUrl;
            } else if (!fotoUrl) {
                fotoUrl = `${SAPL_HOST}/static/img/user.png`;
            }

            const nomeVereador = p.nome_parlamentar || p.nome_completo;

            let partidoSigla = "SEM PARTIDO";
            if (p.partido) {
                partidoSigla = p.partido.sigla ? p.partido.sigla : p.partido;
            }

            let tagCargoHtml = '';
            if (p.cargoMesa) {
                tagCargoHtml = `<span class="cargo">${p.cargoMesa}</span>`;
            }

            htmlCards += `
            <li onclick="abrirModalParlamentar(${p.id})">
            <div class="card-content">
            <img alt="${nomeVereador}" src="${fotoUrl}" />
            <div class="card-overlay">
            <span class="partido-tag">${partidoSigla}</span>
            <div class="card-text">
            <span class="nome">${nomeVereador}</span>
            ${tagCargoHtml}
            </div>
            </div>
            </div>
            </li>
            `;
        });

        container.innerHTML = htmlCards;

    } catch (erro) {
        console.error("Erro na automação do SAPL:", erro);
        container.innerHTML = '<div class="loading-status" style="color: #d9534f;">Não foi possível carregar os parlamentares no momento.</div>';
    }
}

document.addEventListener("DOMContentLoaded", function() {
    carregarVereadoresSapl();

    const btnFechar = document.getElementById('btn-fechar-modal');
    const modal = document.getElementById('modal-vereador');

    if (btnFechar) btnFechar.addEventListener('click', fecharModal);
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) fecharModal();
        });
    }
});
