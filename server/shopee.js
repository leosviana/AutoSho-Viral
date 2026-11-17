const crypto = require('crypto');

const ENDPOINT = process.env.SHOPEE_ENDPOINT || 'https://open-api.affiliate.shopee.com.br/graphql';

// Ordenação da query productOfferV2 (confira no schema do seu painel Open API)
const ORDENACAO = { RELEVANCIA: 1, VENDAS: 2, PRECO_DESC: 3, PRECO_ASC: 4, COMISSAO: 5 };

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const numero = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

function credenciais() {
  const appId = process.env.SHOPEE_APP_ID;
  const secret = process.env.SHOPEE_APP_SECRET;
  if (!appId || !secret) throw new Error('Defina SHOPEE_APP_ID e SHOPEE_APP_SECRET no arquivo .env');
  return { appId, secret };
}

// Assinatura: SHA256(AppId + Timestamp + Payload + Secret), enviada no header Authorization
async function graphql(query, tentativa = 1) {
  const { appId, secret } = credenciais();
  const payload = JSON.stringify({ query });
  const timestamp = Math.floor(Date.now() / 1000);
  const assinatura = crypto
    .createHash('sha256')
    .update(`${appId}${timestamp}${payload}${secret}`)
    .digest('hex');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${assinatura}`,
    },
    body: payload,
  });

  const json = await res.json().catch(() => ({}));
  const erros = json.errors || [];

  // Rate limit (código 10030): tenta de novo com espera crescente
  const limite = res.status === 429 || erros.some((e) => String(e.extensions?.code) === '10030');
  if (limite && tentativa < 4) {
    await dormir(2000 * 2 ** (tentativa - 1));
    return graphql(query, tentativa + 1);
  }
  if (!res.ok || erros.length) {
    throw new Error(erros.map((e) => e.message).join('; ') || `Erro HTTP ${res.status}`);
  }
  return json.data;
}

function normalizar(n, palavraChave) {
  let taxa = numero(n.commissionRate); // a API devolve decimal (0.12 = 12%)
  if (taxa <= 1) taxa *= 100;
  const preco = numero(n.price) || numero(n.priceMin);
  const comissaoReais = numero(n.commission) || (preco * taxa) / 100;

  return {
    itemId: String(n.itemId),
    nome: n.productName || '',
    imagem: n.imageUrl || '',
    link: n.offerLink || n.productLink || '',
    linkProduto: n.productLink || '',
    loja: n.shopName || '',
    preco: Math.round(preco * 100) / 100,
    vendas: parseInt(n.sales, 10) || 0,
    nota: numero(n.ratingStar),
    comissaoPct: Math.round(taxa * 100) / 100,
    comissaoReais: Math.round(comissaoReais * 100) / 100,
    palavraChave,
  };
}

async function buscarProdutos(palavraChave, { pagina = 1, limite = 50, ordenacao = ORDENACAO.VENDAS } = {}) {
  const query = `{
    productOfferV2(keyword: ${JSON.stringify(palavraChave)}, sortType: ${ordenacao}, page: ${pagina}, limit: ${limite}) {
      nodes {
        itemId productName imageUrl productLink offerLink shopName
        price priceMin sales ratingStar commissionRate commission
      }
      pageInfo { page limit hasNextPage }
    }
  }`;
  const data = await graphql(query);
  const { nodes = [], pageInfo = {} } = data.productOfferV2 || {};
  return {
    produtos: nodes.filter((n) => n.itemId).map((n) => normalizar(n, palavraChave)),
    temMais: Boolean(pageInfo.hasNextPage),
  };
}

module.exports = { buscarProdutos, ORDENACAO };
