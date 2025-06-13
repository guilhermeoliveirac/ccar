// ✅ Protege páginas com login obrigatório
function verificarAutenticacao() {
    const paginasProtegidas = ['index.html', 'manutencao.html', 'valores.html'];
    const caminhoAtual = window.location.pathname.split('/').pop();

    if (paginasProtegidas.includes(caminhoAtual)) {
        const logado = localStorage.getItem('logado');
        if (logado !== 'true') {
            window.location.href = 'login.html';
        }
    }
}

verificarAutenticacao();

document.addEventListener('DOMContentLoaded', function () {

    // ✅ Formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const username = document.getElementById('uname').value;
            const password = document.getElementById('psw').value;
            const mensagemDiv = document.getElementById('mensagemLogin');

            mensagemDiv.textContent = 'Validando credenciais...';
            mensagemDiv.className = 'mensagem sucesso';
            mensagemDiv.style.display = 'block';

            fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
                .then(response => {
                    if (!response.ok) throw new Error('Falha na autenticação');
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        mensagemDiv.textContent = 'Login bem-sucedido! Redirecionando...';
                        setTimeout(() => {
                            localStorage.setItem('logado', 'true');
                            window.location.href = 'index.html';
                        }, 1500);
                    } else {
                        mensagemDiv.textContent = 'Usuário ou senha incorretos.';
                        mensagemDiv.className = 'mensagem erro';
                    }
                })
                .catch(error => {
                    console.error('Erro no login:', error);
                    mensagemDiv.textContent = 'Erro no servidor. Tente novamente.';
                    mensagemDiv.className = 'mensagem erro';
                });
        });
    }

    // ✅ Botão de logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    }

    // ✅ Página: index.html (home)
    if (document.getElementById('home')) {
        function carregarInformacoesHome() {
            fetch('/manutencao')
                .then(response => response.json())
                .then(manutencaoList => {
                    const ultimaManutencao = manutencaoList[manutencaoList.length - 1];
                    const valorTotal = manutencaoList.reduce((acc, item) => acc + item.valor + item.maoDeObra, 0);

                    if (ultimaManutencao) {
                        document.getElementById('ultima-manutencao').textContent = `${ultimaManutencao.nome} - ${new Date(ultimaManutencao.data).toLocaleDateString()}`;
                    } else {
                        document.getElementById('ultima-manutencao').textContent = 'Nenhuma manutenção registrada';
                    }

                    document.getElementById('valor-total').textContent = `R$ ${valorTotal.toFixed(2)}`;
                    gerarGraficoGastosPorMes(manutencaoList);
                })
                .catch(error => console.error('Erro:', error));
        }

        function gerarGraficoGastosPorMes(dados) {
            const gastosPorMes = Array(12).fill(0);

            dados.forEach(item => {
                const data = new Date(item.data);
                const mes = data.getMonth();
                const total = item.valor + item.maoDeObra;
                gastosPorMes[mes] += total;
            });

            const ctx = document.getElementById('graficoGastos').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                    datasets: [{
                        label: 'Gasto Total (R$)',
                        data: gastosPorMes,
                        backgroundColor: 'rgba(75, 192, 192, 0.4)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        carregarInformacoesHome();
    }

    // ✅ Página: manutencao.html
    document.getElementById('manutencaoForm')?.addEventListener('submit', function (event) {
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

    // ✅ Página: valores.html
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

                        const actionsCell = row.insertCell(7);
                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'Excluir';
                        deleteButton.addEventListener('click', () => excluirManutencao(item.id));
                        actionsCell.appendChild(deleteButton);
                    });
                })
                .catch(error => console.error('Erro:', error));
        }

        carregarTabelaValores();

        document.getElementById('filtroForm')?.addEventListener('submit', function (event) {
            event.preventDefault();
            const mes = document.getElementById('filtroMes').value;
            const ano = document.getElementById('filtroAno').value;
            carregarTabelaValores(mes, ano);
        });
    }
});

// ✅ Excluir manutenção
function excluirManutencao(id) {
    fetch(`/manutencao/${id}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Manutenção excluída com sucesso!');
                location.reload();
            } else {
                alert('Erro ao excluir manutenção.');
            }
        })
        .catch(error => console.error('Erro:', error));
}

function extrairAnosUnicos(lista) {
    const anos = new Set();
    lista.forEach(item => {
      const ano = new Date(item.data).getFullYear();
      anos.add(ano);
    });
    return Array.from(anos).sort((a, b) => b - a);
  }

// ✅ Logout
function logout() {
    localStorage.removeItem('logado');
    window.location.href = 'login.html';
}
