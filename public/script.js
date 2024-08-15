document.addEventListener('DOMContentLoaded', function() {
    // Adicionar manutenção
    document.getElementById('manutencaoForm')?.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const formData = new FormData(this);

        fetch('/adicionar-manutencao', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Manutenção adicionada com sucesso!');
                this.reset();
            } else {
                alert('Erro ao adicionar manutenção.');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao adicionar manutenção.');
        });
    });

    // Carregar informações da página inicial
    if (document.getElementById('home')) {
        function carregarInformacoesHome() {
            fetch('/manutencao')
                .then(response => response.json())
                .then(manutencaoList => {
                    const ultimaManutencao = manutencaoList[manutencaoList.length - 1];
                    const valorTotal = manutencaoList.reduce((acc, item) => acc + item.valor + item.maoDeObra, 0);

                    if (ultimaManutencao) {
                        document.getElementById('ultima-manutencao').textContent = `${ultimaManutencao.nome} - ${new Date(ultimaManutencao.data).toLocaleDateString()}`;
                        document.getElementById('valor-total').textContent = `R$ ${valorTotal.toFixed(2)}`;
                    } else {
                        document.getElementById('ultima-manutencao').textContent = 'Nenhuma manutenção registrada';
                        document.getElementById('valor-total').textContent = 'R$ 0,00';
                    }
                })
                .catch(error => console.error('Erro:', error));
        }

        carregarInformacoesHome();
    }

    // Carregar tabela de valores
    if (document.getElementById('valores')) {
        function carregarTabelaValores(mes = '', ano = '') {
            const url = mes && ano ? `/manutencao/${mes}/${ano}` : '/manutencao';

            fetch(url)
                .then(response => response.json())
                .then(manutencaoList => {
                    const tbody = document.getElementById('tabela-valores').getElementsByTagName('tbody')[0];
                    tbody.innerHTML = '';

                    manutencaoList.forEach(item => {
                        const row = tbody.insertRow();
                        row.insertCell(0).textContent = item.nome;
                        row.insertCell(1).textContent = item.fabricante;
                        row.insertCell(2).textContent = item.codigo;
                        row.insertCell(3).textContent = `R$ ${item.valor.toFixed(2)}`;
                        row.insertCell(4).textContent = item.km;
                        row.insertCell(5).textContent = `R$ ${item.maoDeObra.toFixed(2)}`;
                        row.insertCell(6).textContent = new Date(item.data).toLocaleDateString();

                        const imgCell = row.insertCell(7);
                        if (item.imagem) {
                            const img = document.createElement('img');
                            img.src = item.imagem;
                            img.width = 100; // Define o tamanho da imagem
                            imgCell.appendChild(img);
                        }

                        const actionsCell = row.insertCell(8);
                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'Excluir';
                        deleteButton.addEventListener('click', () => excluirManutencao(item.id));
                        actionsCell.appendChild(deleteButton);
                    });
                })
                .catch(error => console.error('Erro:', error));
        }

        carregarTabelaValores(); // Carregar todas as manutenções ao carregar a página

        document.getElementById('filtroForm')?.addEventListener('submit', function(event) {
            event.preventDefault();
            const mes = document.getElementById('filtroMes').value;
            const ano = document.getElementById('filtroAno').value;
            carregarTabelaValores(mes, ano);
        });
    }
});

// Função para excluir manutenção
function excluirManutencao(id) {
    fetch(`/manutencao/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Manutenção excluída com sucesso!');
            location.reload(); // Atualiza a página para refletir a exclusão
        } else {
            alert('Erro ao excluir manutenção.');
        }
    })
    .catch(error => console.error('Erro:', error));
}
