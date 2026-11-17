const $ = (seletor) => document.querySelector(seletor);

const estado = {
  vendasMin: 500,
  comissaoMin: 5,
  ordem: 'oportunidade',
  busca: '',
  categoria: '',
  afiliadosMin: 0,
  afiliadosQtdMax: 200,
};

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = new Intl.NumberFormat('pt-BR');
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

// ---------- Log e status ----------

function log(mensagem, tipo = 'info') {
  const pre = $('#log');
  pre.querySelector('.log-empty')?.remove();
  const linha = document.createElement('span');
  linha.className = `log-line log-${tipo}`;
  const hora = document.createElement('span');
  hora.className = 'ts';
  hora.textContent = new Date().toLocaleTimeString('pt-BR');
  linha.append(hora, mensagem);
  pre.appendChild(linha);
  pre.scrollTop = pre.scrollHeight;
}

function definirStatus(situacao, texto) {
  const el = $('#syncStatus');
  el.dataset.state = situacao;
  el.querySelector('.status-text').textContent = texto;
}

async function chamarApi(url, opcoes) {
  const resposta = await fetch(url, opcoes);
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || `Erro ${resposta.status}`);
  return dados;
}

// ---------- Lista de produtos ----------

const linkSeguro = (url) => (/^https:\/\//i.test(url) ? url : null);

function criarCard(p) {
  const href = linkSeguro(p.link);
  const li = document.createElement('li');
  li.className = 'product';

  const miniatura = document.createElement(href ? 'a' : 'div');
  miniatura.className = 'thumb';
  if (href) {
    miniatura.href = href;
    miniatura.target = '_blank';
    miniatura.rel = 'noopener noreferrer sponsored';
    miniatura.setAttribute('aria-label', `Abrir ${p.nome} na Shopee`);
  }
  if (p.imagem) {
    const img = document.createElement('img');
    img.src = p.imagem;
    img.alt = '';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    miniatura.appendChild(img);
  }

  const info = document.createElement('div');
  info.className = 'product-info';

  const titulo = document.createElement('h3');
  if (href) {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer sponsored';
    a.textContent = p.nome;
    titulo.appendChild(a);
  } else {
    titulo.textContent = p.nome;
  }

  const meta = document.createElement('p');
  meta.className = 'product-meta';
  meta.textContent = `${inteiro.format(p.vendas)} vendas · ${decimal.format(p.comissaoPct)}% de comissão`;

  const extra = document.createElement('p');
  extra.className = 'product-extra';
  const partes = [moeda.format(p.preco)];
  if (p.nota > 0) partes.push(`nota ${decimal.format(p.nota)}`);
  if (p.loja) partes.push(p.loja);
  if (p.categoria) partes.push(p.categoria);
  if (Number.isFinite(p.afiliadosEstimados)) {
    partes.push(`${inteiro.format(p.afiliadosEstimados)} afiliados`);
  }
  extra.textContent = partes.join(' · ');

  info.append(titulo, meta, extra);

  const lado = document.createElement('div');
  lado.className = 'product-side';
  const valor = document.createElement('strong');
  valor.textContent = moeda.format(p.comissaoReais);
  const legenda = document.createElement('span');
  legenda.textContent = 'comissão estimada por unidade';
  const score = document.createElement('span');
  score.className = 'tag tag-purple';
  score.textContent = `score ${decimal.format(p.score)}`;
  lado.append(valor, legenda, score);

  li.append(miniatura, info, lado);
  return li;
}

async function carregar() {
  const params = new URLSearchParams(estado);
  const lista = $('#lista');
  try {
    const { total, produtos } = await chamarApi(`/api/produtos?${params}`);
    lista.replaceChildren(...produtos.map(criarCard));
    $('#contagem').textContent = total
      ? `${inteiro.format(total)} produtos encontrados${total > produtos.length ? ` (mostrando ${produtos.length})` : ''}`
      : 'Nenhum produto com esses filtros. Sincronize o catálogo ou reduza os mínimos.';
  } catch (e) {
    lista.replaceChildren();
    $('#contagem').textContent = `Não foi possível carregar os produtos: ${e.message}`;
    log(e.message, 'error');
  }
}

// ---------- Filtros e categorias ----------

async function carregarCategorias() {
  const seletor = $('#categoria');
  try {
    const { categorias } = await chamarApi('/api/categorias');
    const selecionada = seletor.value;
    seletor.replaceChildren(new Option('Todas as categorias', ''));
    categorias.forEach((categoria) => {
      const option = document.createElement('option');
      option.value = categoria;
      option.textContent = categoria;
      seletor.appendChild(option);
    });
    seletor.value = categorias.includes(selecionada) ? selecionada : '';
  } catch (e) {
    log(`Não foi possível carregar categorias: ${e.message}`, 'error');
  }
}

$('#filtros').addEventListener('submit', (e) => {
  e.preventDefault();
  estado.busca = $('#busca').value.trim();
  estado.categoria = $('#categoria').value;
  estado.afiliadosMin = Number($('#afiliadosMin').value) || 0;
  estado.afiliadosQtdMax = Number($('#afiliadosQtdMax').value) || 0;
  estado.vendasMin = Number($('#vendasMin').value) || 0;
  estado.comissaoMin = Number($('#comissaoMin').value) || 0;
  estado.ordem = $('#ordem').value;
  carregar();
});

$('#filtros').addEventListener('reset', (e) => {
  e.preventDefault();
  Object.assign(estado, {
    vendasMin: 500,
    comissaoMin: 5,
    ordem: 'oportunidade',
    busca: '',
    categoria: '',
    afiliadosMin: 0,
    afiliadosQtdMax: 200,
  });
  $('#busca').value = '';
  $('#categoria').value = '';
  $('#afiliadosMin').value = '0';
  $('#afiliadosQtdMax').value = '200';
  $('#vendasMin').value = '500';
  $('#comissaoMin').value = '5';
  $('#ordem').value = 'oportunidade';
  carregar();
});

// ---------- Sincronização ----------

$('#btnSync').addEventListener('click', async () => {
  const keywords = $('#keywords').value.split(',').map((k) => k.trim()).filter(Boolean);
  if (!keywords.length) {
    definirStatus('error', 'Informe uma palavra-chave');
    return;
  }

  const botao = $('#btnSync');
  botao.disabled = true;
  definirStatus('running', 'Sincronizando…');
  log(`Buscando na Shopee: ${keywords.join(', ')}`);

  try {
    const { total } = await chamarApi('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords, paginas: 3 }),
    });
    definirStatus('success', `${inteiro.format(total)} produtos salvos`);
    log(`${inteiro.format(total)} produtos salvos no banco.`, 'ok');
    await carregarCategorias();
    await carregar();
  } catch (e) {
    definirStatus('error', 'Falhou');
    log(e.message, 'error');
  } finally {
    botao.disabled = false;
  }
});

$('#btnLimpar').addEventListener('click', () => {
  $('#log').innerHTML = '<span class="log-empty">Nenhuma ação executada ainda.</span>';
});

// ---------- Navegação e integração Shopee ----------

function mostrarTela(tela) {
  const configuracoes = tela === 'settings';
  $('#radarView').hidden = configuracoes;
  $('#settingsView').hidden = !configuracoes;
  document.querySelectorAll('.nav-item[data-view]').forEach((item) => {
    const ativo = item.dataset.view === tela;
    item.classList.toggle('active', ativo);
    if (ativo) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  document.title = configuracoes ? 'Configurações | Radar Shopee' : 'Radar Shopee | Análise';
  if (configuracoes) carregarStatusShopee();
}

document.querySelectorAll('.nav-item[data-view]').forEach((item) => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const destino = item.dataset.view;
    const hash = destino === 'settings' ? '#configuracoes' : '#radar';
    if (location.hash !== hash) location.hash = hash;
    else mostrarTela(destino);
  });
});

window.addEventListener('hashchange', () => {
  mostrarTela(location.hash === '#configuracoes' ? 'settings' : 'radar');
});

function atualizarStatusShopee(configuracao) {
  const status = $('#shopeeConfigStatus');
  if (configuracao.configurado) {
    status.textContent = `Credenciais configuradas · App ID ${configuracao.appIdMascarado}`;
    status.dataset.state = 'success';
  } else {
    status.textContent = 'API ainda não configurada neste servidor.';
    status.dataset.state = 'idle';
  }
}

async function carregarStatusShopee() {
  try {
    atualizarStatusShopee(await chamarApi('/api/config/shopee'));
  } catch (e) {
    $('#shopeeConfigStatus').textContent = `Não foi possível verificar a configuração: ${e.message}`;
    $('#shopeeConfigStatus').dataset.state = 'error';
  }
}

async function testarOuSalvarShopee(salvar) {
  const botaoTeste = $('#btnTestShopee');
  const botaoSalvar = $('#btnSaveShopee');
  const resultado = $('#shopeeTestResult');
  const appId = $('#shopeeAppId').value.trim();
  const appSecret = $('#shopeeAppSecret').value;
  if (salvar && (!appId || !appSecret)) {
    resultado.textContent = 'Informe o App ID e o App Secret para salvar.';
    resultado.dataset.state = 'error';
    return;
  }

  botaoTeste.disabled = true;
  botaoSalvar.disabled = true;
  resultado.textContent = 'Testando conexão com a API Shopee…';
  resultado.dataset.state = 'running';
  try {
    const endpoint = salvar ? '/api/config/shopee' : '/api/config/shopee/testar';
    const resposta = await chamarApi(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId, appSecret }),
    });
    resultado.textContent = resposta.mensagem;
    resultado.dataset.state = 'success';
    atualizarStatusShopee(resposta.configuracao);
    if (salvar) {
      $('#shopeeAppId').value = '';
      $('#shopeeAppSecret').value = '';
    }
  } catch (e) {
    resultado.textContent = `Falha na conexão: ${e.message}`;
    resultado.dataset.state = 'error';
  } finally {
    botaoTeste.disabled = false;
    botaoSalvar.disabled = false;
  }
}

$('#btnTestShopee').addEventListener('click', () => testarOuSalvarShopee(false));
$('#shopeeSettingsForm').addEventListener('submit', (e) => {
  e.preventDefault();
  testarOuSalvarShopee(true);
});

mostrarTela(location.hash === '#configuracoes' ? 'settings' : 'radar');
carregarCategorias();
carregar();
