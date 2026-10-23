const { Alimento } = require('../models');
const AppError = require('../utils/AppError');

// A TACO tem ~600 alimentos e não muda em tempo de execução: mantemos em
// memória para permitir busca rápida e sem acento ("feijao" acha "Feijão").
let cache = null;

const normalizar = (texto) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function carregar() {
  if (!cache) {
    const alimentos = await Alimento.findAll({ order: [['nome', 'ASC']] });
    cache = alimentos.map((a) => ({ ...a.toJSON(), _busca: normalizar(a.nome) }));
  }
  return cache;
}

const semIndice = ({ _busca, ...resto }) => resto;

// RF13 - Consultar tabela TACO com busca e filtros
async function listar({ busca, categoria, limite = 50, pagina = 1 } = {}) {
  const todos = await carregar();
  const termos = busca ? normalizar(busca).split(/\s+/).filter(Boolean) : [];
  const filtrados = todos.filter(
    (a) => (!categoria || a.categoria === categoria) && termos.every((t) => a._busca.includes(t))
  );
  const inicio = (pagina - 1) * limite;
  return {
    total: filtrados.length,
    pagina,
    itens: filtrados.slice(inicio, inicio + limite).map(semIndice),
  };
}

async function categorias() {
  const todos = await carregar();
  const contagem = {};
  for (const a of todos) contagem[a.categoria] = (contagem[a.categoria] || 0) + 1;
  return Object.entries(contagem)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

async function estatisticas() {
  const todos = await carregar();
  return {
    total: todos.length,
    categorias: new Set(todos.map((a) => a.categoria)).size,
    kcalMedia: todos.length ? Math.round(todos.reduce((s, a) => s + a.kcal100g, 0) / todos.length) : 0,
  };
}

async function buscarPorId(id) {
  const todos = await carregar();
  const alimento = todos.find((a) => a.id === Number(id));
  if (!alimento) throw new AppError('Alimento não encontrado', 404);
  return semIndice(alimento);
}

module.exports = { listar, categorias, estatisticas, buscarPorId };
