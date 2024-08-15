const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Configuração do multer para upload de arquivos
const upload = multer({ dest: 'uploads/' });

// Middleware para servir arquivos estáticos
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Função para ler e escrever no arquivo JSON
const filePath = path.join(__dirname, 'dados', 'manutencao.json');

const readData = () => {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        return JSON.parse(data);
    }
    return [];
};

const writeData = (data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Rota para adicionar manutenção
app.post('/adicionar-manutencao', upload.single('imagem'), (req, res) => {
    const { nome, fabricante, codigo, valor, km, maoDeObra, mes, ano } = req.body;
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
        data: new Date(ano, mes - 1).toISOString() // Data para o mês e ano
    };

    const manutencaoList = readData();
    manutencaoList.push(manutencao);
    writeData(manutencaoList);

    res.json({ success: true });
});

// Rota para obter manutenções
app.get('/manutencao', (req, res) => {
    const manutencaoList = readData();
    res.json(manutencaoList);
});

// Rota para atualizar manutenção
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
            data: new Date(ano, mes - 1).toISOString() // Atualizar data
        };
        writeData(manutencaoList);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'Manutenção não encontrada' });
    }
});

// Rota para excluir manutenção
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

// Rota para filtrar manutenções por mês e ano
app.get('/manutencao/:mes/:ano', (req, res) => {
    const { mes, ano } = req.params;
    const manutencaoList = readData();
    const filteredList = manutencaoList.filter(item => {
        const date = new Date(item.data);
        return date.getMonth() === parseInt(mes, 10) - 1 && date.getFullYear() === parseInt(ano, 10);
    });
    res.json(filteredList);
});

// Inicie o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
