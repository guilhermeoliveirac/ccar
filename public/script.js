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
      let chartGastos = null;
  
      function extrairAnosUnicos(lista) {
        const anos = new Set();
        lista.forEach(item => {
          const ano = new Date(item.data).getFullYear();
          anos.add(ano);
        });
        return Array.from(anos).sort((a, b) => b - a);
      }
  
      function gerarGraficoGastosPorMes(lista) {
        const dadosPorMes = Array(12).fill(0);
  
        lista.forEach(item => {
          const data = new Date(item.data);
          const mes = data.getMonth();
          dadosPorMes[mes] += item.valor + item.maoDeObra;
        });
  
        const ctx = document.getElementById('graficoGastos').getContext('2d');
  
        if (chartGastos) chartGastos.destroy();
  
        chartGastos = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            datasets: [{
              label: 'Gastos por mês (R$)',
              data: dadosPorMes,
              backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Gastos Mensais por Mês' }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: 'Valor (R$)' }
              }
            }
          }
        });
      }
  
      function carregarInformacoesHome(filtroAno = '') {
        fetch('/manutencao')
          .then(res => res.json())
          .then(lista => {
            const selectAno = document.getElementById('filtroAnoHome');
  
            // Preenche o select apenas 1x
            if (selectAno && selectAno.options.length === 0) {
              const anos = extrairAnosUnicos(lista);
              selectAno.innerHTML = `<option value="">Todos</option>` + anos.map(ano =>
                `<option value="${ano}">${ano}</option>`).join('');
            }
  
            // Filtro de ano
            if (filtroAno) {
              lista = lista.filter(item => new Date(item.data).getFullYear() == filtroAno);
            }
  
            const ultima = lista[lista.length - 1];
            const total = lista.reduce((soma, item) => soma + item.valor + item.maoDeObra, 0);
  
            document.getElementById('ultima-manutencao').textContent = ultima
              ? `${ultima.nome} - ${new Date(ultima.data).toLocaleDateString()}`
              : 'Nenhuma manutenção registrada';
  
            document.getElementById('valor-total').textContent = `R$ ${total.toFixed(2)}`;
  
            gerarGraficoGastosPorMes(lista);
          });
      }
  
      carregarInformacoesHome();
  
      // ✅ Evento de mudança no filtro
      const selectAno = document.getElementById('filtroAnoHome');
      if (selectAno) {
        selectAno.addEventListener('change', e => {
          carregarInformacoesHome(e.target.value);
        });
      }
    }
  
    // ✅ Página: manutencao.html
    const manutencaoForm = document.getElementById('manutencaoForm');
    if (manutencaoForm) {
      manutencaoForm.addEventListener('submit', function (event) {
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
    }
  
    // ✅ Página: valores.html
    if (document.getElementById('valores')) {
      function extrairAnosUnicos(lista) {
        const anos = new Set();
        lista.forEach(item => {
          const ano = new Date(item.data).getFullYear();
          anos.add(ano);
        });
        return Array.from(anos).sort((a, b) => b - a);
      }
  
      function carregarTabelaValores(ano = '') {
        fetch('/manutencao')
          .then(res => res.json())
          .then(lista => {
            const selectAno = document.getElementById('filtroAnoHome');
  
            if (selectAno && selectAno.options.length === 0) {
              const anos = extrairAnosUnicos(lista);
              selectAno.innerHTML = `<option value="">Todos</option>` + anos.map(ano =>
                `<option value="${ano}">${ano}</option>`).join('');
            }
  
            if (ano) {
              lista = lista.filter(item => new Date(item.data).getFullYear() == ano);
            }
  
            const tbody = document.querySelector('#tabela-valores tbody');
            tbody.innerHTML = '';
  
            lista.forEach(item => {
              const row = tbody.insertRow();
              row.insertCell(0).textContent = item.nome;
              row.insertCell(1).textContent = item.fabricante;
              row.insertCell(2).textContent = item.codigo;
              row.insertCell(3).textContent = `R$ ${item.valor.toFixed(2)}`;
              row.insertCell(4).textContent = item.km;
              row.insertCell(5).textContent = `R$ ${item.maoDeObra.toFixed(2)}`;
              row.insertCell(6).textContent = new Date(item.data).toLocaleDateString();
  
              const actionsCell = row.insertCell(7);
              const btn = document.createElement('button');
              btn.textContent = 'Excluir';
              btn.onclick = () => excluirManutencao(item.id);
              actionsCell.appendChild(btn);
            });
          });
      }
  
      const selectAno = document.getElementById('filtroAnoHome');
      if (selectAno) {
        selectAno.addEventListener('change', e => {
          carregarTabelaValores(e.target.value);
        });
      }
  
      carregarTabelaValores();
    }
  });
  
  // ✅ Excluir manutenção
  function excluirManutencao(id) {
    fetch(`/manutencao/${id}`, { method: 'DELETE' })
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
  
  // ✅ Logout
  function logout() {
    localStorage.removeItem('logado');
    window.location.href = 'login.html';
  }
  