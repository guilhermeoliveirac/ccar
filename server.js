const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Uploads com Multer
const upload = multer({ dest: 'uploads/' });

// Servir arquivos estáticos da pasta public
app.use(express.static('public'));

// Habilitar leitura de JSON e URL-encoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Caminhos para arquivos JSON
const manutencaoPath = path.join(__dirname, 'dados', 'manutencao.json');
const usuariosPath = path.join(__dirname, 'dados', 'usuarios.json');

// Utilitários de leitura/gravação
const readData = () => {
    if (fs.existsSync(manutencaoPath)) {
        const data = fs.readFileSync(manutencaoPath);
        return JSON.parse(data);
    }
    return [];
};

const writeData = (data) => {
    fs.writeFileSync(manutencaoPath, JSON.stringify(data, null, 2));
};

// 🔐 Rota de login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!fs.existsSync(usuariosPath)) {
        return res.status(500).json({ success: false, message: 'Arquivo de usuários não encontrado.' });
    }

    const usuarios = JSON.parse(fs.readFileSync(usuariosPath));
    const user = usuarios.usuarios.find(u => u.username === username && u.password === password);

    if (user) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Usuário ou senha inválidos' });
    }
});

// ➕ Adicionar manutenção
app.post('/adicionar-manutencao', upload.single('imagem'), (req, res) => {
    const { nome, fabricante, codigo, valor, km, maoDeObra, mes, ano, dia } = req.body;
    const imagem = req.file ? req.file.path : '';

    const manutencao = {
        id: Date.now(),
        nome,
        fabricante,
        codigo,
        valor: parseFloat(valor),
        km: parseFloat(km),
        maoDeObra: parseFloat(maoDeObra),
        imagem,
        data: new Date(ano, mes - 1, dia).toISOString()
    };
    

    const manutencaoList = readData();
    manutencaoList.push(manutencao);
    writeData(manutencaoList);

    res.json({ success: true });
});

// 🔁 Atualizar manutenção
app.post('/atualizar-manutencao/:id', upload.single('imagem'), (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { nome, fabricante, codigo, valor, km, maoDeObra, mes, ano } = req.body;
    const imagem = req.file ? req.file.path : '';

    const manutencaoList = readData();
    const index = manutencaoList.findIndex(item => item.id === id);

    if (index !== -1) {
        manutencaoList[index] = {
            id,
            nome,
            fabricante,
            codigo,
            valor: parseFloat(valor),
            km: parseFloat(km),
            maoDeObra: parseFloat(maoDeObra),
            imagem,
            data: new Date(ano, mes - 1).toISOString()
        };
        writeData(manutencaoList);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'Manutenção não encontrada' });
    }
});

// 🗑️ Excluir manutenção
app.delete('/manutencao/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const manutencaoList = readData();
    const updatedList = manutencaoList.filter(item => item.id !== id);

    if (updatedList.length < manutencaoList.length) {
        writeData(updatedList);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'Manutenção não encontrada' });
    }
});

// 🔎 Filtrar manutenções por mês/ano
app.get('/manutencao/:mes/:ano', (req, res) => {
    const { mes, ano } = req.params;
    const manutencaoList = readData();
    const filteredList = manutencaoList.filter(item => {
        const date = new Date(item.data);
        return date.getMonth() === parseInt(mes, 10) - 1 && date.getFullYear() === parseInt(ano, 10);
    });
    res.json(filteredList);
});

// 📄 Obter todas as manutenções
app.get('/manutencao', (req, res) => {
    const manutencaoList = readData();
    res.json(manutencaoList);
});

// 🚀 Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
