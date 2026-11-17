require('dotenv').config();
const path = require('path');
const express = require('express');
const { db } = require('./firebase');
const { buscarProdutos } = require('./shopee');

const app = express();
const colecao = db.collection('produtos');

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Cache curto em memória para não ler o Firestore inteiro a cada filtro
let cache = null;
const CACHE_MS = 60 * 1000;

async function lerProdutos() {
  if (cache && Date.now() - cache.em < CACHE_MS) return cache.lista;
  const snap = await colecao.get();
  const lista = snap.docs.map((d) => {
    const x = d.data();
    return { ...x, atualizadoEm: x.atualizadoEm?.toDate?.().toISOString() || null };
  });
  cache = { em: Date.now(), lista };
  return lista;
}

// Demanda x retorno. Quando existir "afiliadosEstimados", ele entra dividindo o score.
function pontuar(p) {
  const nota = p.nota > 0 ? p.nota / 5 : 1;
  const concorrencia = Number.isFinite(p.afiliadosEstimados) ? p.afiliadosEstimados + 1 : 1;
  return Math.round(((Math.log10(p.vendas + 1) * p.comissaoReais * nota) / concorrencia) * 100) / 100;
}

const limitar = (v, min, max, padrao) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : padrao;
};

// Lista filtrada: /api/produtos?vendasMin=1000&comissaoMin=10&ordem=oportunidade&busca=fone
app.get('/api/produtos', async (req, res) => {
  try {
    const vendasMin = Number(req.query.vendasMin) || 0;
    const comissaoMin = Number(req.query.comissaoMin) || 0;
    const busca = String(req.query.busca || '').trim().toLowerCase();
    const ordem = String(req.query.ordem || 'oportunidade');
    const limite = limitar(req.query.limite, 1, 200, 60);

    const filtrados = (await lerProdutos())
      .filter((p) => p.vendas >= vendasMin && p.comissaoPct >= comissaoMin)
      .filter((p) => !busca || p.nome.toLowerCase().includes(busca))
      .map((p) => ({ ...p, score: pontuar(p) }));

    const criterio = {
      oportunidade: (a, b) => b.score - a.score,
      comissao: (a, b) => b.comissaoReais - a.comissaoReais,
      vendas: (a, b) => b.vendas - a.vendas,
    }[ordem] || ((a, b) => b.score - a.score);

    filtrados.sort(criterio);
    res.json({ total: filtrados.length, produtos: filtrados.slice(0, limite) });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Busca na Shopee e grava no Firestore: { "keywords": ["fone bluetooth"], "paginas": 3 }
app.post('/api/sync', async (req, res) => {
  const palavras = (Array.isArray(req.body.keywords) ? req.body.keywords : [])
    .map((k) => String(k).trim())
    .filter(Boolean)
    .slice(0, 10);
  const paginas = limitar(req.body.paginas, 1, 10, 3);

  if (!palavras.length) return res.status(400).json({ erro: 'Informe ao menos uma palavra-chave.' });

  try {
    const unicos = new Map();
    for (const palavra of palavras) {
      for (let pagina = 1; pagina <= paginas; pagina++) {
        const { produtos, temMais } = await buscarProdutos(palavra, { pagina });
        produtos.forEach((p) => unicos.set(p.itemId, p));
        if (!temMais) break;
      }
    }

    const lista = [...unicos.values()];
    for (let i = 0; i < lista.length; i += 400) {
      const lote = db.batch();
      lista.slice(i, i + 400).forEach((p) => {
        // merge: preserva campos manuais (ex.: afiliadosEstimados) em novas sincronizações
        lote.set(colecao.doc(p.itemId), { ...p, atualizadoEm: new Date() }, { merge: true });
      });
      await lote.commit();
    }

    cache = null;
    res.json({ ok: true, total: lista.length });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

const porta = process.env.PORT || 3000;
app.listen(porta, () => console.log(`Radar Shopee em http://localhost:${porta}`));
